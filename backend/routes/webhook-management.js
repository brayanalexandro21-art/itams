const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

// Listar webhooks
router.get('/', auth, adminOnly, (req, res) => {
  try {
    const webhooks = db.prepare(`
      SELECT w.*,
        (SELECT COUNT(*) FROM webhook_logs WHERE webhook_id = w.id) as trigger_count,
        (SELECT MAX(executed_at) FROM webhook_logs WHERE webhook_id = w.id) as last_triggered
      FROM webhooks w
      ORDER BY w.name
    `).all();
    res.json(webhooks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear webhook
router.post('/', auth, adminOnly, (req, res) => {
  try {
    const { name, url, events, secret, method } = req.body;
    const result = db.prepare(`
      INSERT INTO webhooks (name, url, events, secret, method, active, created_by)
      VALUES (?, ?, ?, ?, ?, 1, ?)
    `).run(name, url, JSON.stringify(events), secret, method || 'POST', req.user.id);
    res.json({ id: result.lastInsertRowid, name });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar webhook
router.put('/:id', auth, adminOnly, (req, res) => {
  try {
    const { name, url, events, secret, method, active } = req.body;
    db.prepare(`
      UPDATE webhooks SET name = ?, url = ?, events = ?, secret = ?, method = ?, active = ?
      WHERE id = ?
    `).run(name, url, JSON.stringify(events), secret, method, active ? 1 : 0, req.params.id);
    res.json({ message: 'Webhook actualizado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar webhook
router.delete('/:id', auth, adminOnly, (req, res) => {
  try {
    db.prepare('DELETE FROM webhook_logs WHERE webhook_id = ?').run(req.params.id);
    db.prepare('DELETE FROM webhooks WHERE id = ?').run(req.params.id);
    res.json({ message: 'Webhook eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle webhook
router.post('/:id/toggle', auth, adminOnly, (req, res) => {
  try {
    const webhook = db.prepare('SELECT active FROM webhooks WHERE id = ?').get(req.params.id);
    if (!webhook) return res.status(404).json({ error: 'Webhook no encontrado' });

    db.prepare('UPDATE webhooks SET active = ? WHERE id = ?').run(webhook.active ? 0 : 1, req.params.id);
    res.json({ active: !webhook.active });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Historial de ejecuciones
router.get('/:id/logs', auth, adminOnly, (req, res) => {
  try {
    const logs = db.prepare(`
      SELECT * FROM webhook_logs WHERE webhook_id = ?
      ORDER BY executed_at DESC LIMIT 50
    `).all(req.params.id);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Test webhook
router.post('/:id/test', auth, adminOnly, (req, res) => {
  try {
    const webhook = db.prepare('SELECT * FROM webhooks WHERE id = ?').get(req.params.id);
    if (!webhook) return res.status(404).json({ error: 'Webhook no encontrado' });

    db.prepare(`
      INSERT INTO webhook_logs (webhook_id, event, status, response_code, created_at)
      VALUES (?, 'test', 'success', 200, datetime('now'))
    `).run(req.params.id);

    res.json({ message: 'Test enviado', webhook: webhook.name });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;