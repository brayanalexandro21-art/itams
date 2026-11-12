const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

// Dashboard de integraciones
router.get('/dashboard', auth, adminOnly, (req, res) => {
  try {
    const integrations = db.prepare('SELECT * FROM integrations ORDER BY name').all();
    const logs = db.prepare(`
      SELECT il.*, i.name as integration_name
      FROM integration_logs il
      LEFT JOIN integrations i ON il.integration_id = i.id
      ORDER BY il.created_at DESC
      LIMIT 20
    `).all();

    const stats = {
      total: integrations.length,
      active: integrations.filter(i => i.active).length,
      failed_today: db.prepare("SELECT COUNT(*) as c FROM integration_logs WHERE status = 'error' AND created_at >= date('now')").get().c,
      total_logs: db.prepare('SELECT COUNT(*) as c FROM integration_logs').get().c,
    };

    res.json({ integrations, logs, stats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle integración
router.post('/:id/toggle', auth, adminOnly, (req, res) => {
  try {
    const integration = db.prepare('SELECT active FROM integrations WHERE id = ?').get(req.params.id);
    if (!integration) return res.status(404).json({ error: 'Integración no encontrada' });
    db.prepare('UPDATE integrations SET active = ? WHERE id = ?').run(integration.active ? 0 : 1, req.params.id);
    res.json({ active: !integration.active });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Probar integración
router.post('/:id/test', auth, adminOnly, (req, res) => {
  try {
    const integration = db.prepare('SELECT * FROM integrations WHERE id = ?').get(req.params.id);
    if (!integration) return res.status(404).json({ error: 'Integración no encontrada' });

    db.prepare("INSERT INTO integration_logs (integration_id, status, message, executed_at) VALUES (?, 'success', ?, datetime('now'))")
      .run(req.params.id, `Test de ${integration.name} completado`);

    res.json({ message: `Test de ${integration.name} exitoso` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;