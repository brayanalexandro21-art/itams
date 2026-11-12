const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

// Listar campañas
router.get('/', auth, adminOnly, (req, res) => {
  try {
    const campaigns = db.prepare(`
      SELECT ec.*,
        (SELECT COUNT(*) FROM notifications WHERE type = 'campaign' AND message LIKE '%' || ec.name || '%') as sent_count
      FROM email_templates ec
      WHERE ec.category = 'campaign'
      ORDER BY ec.created_at DESC
    `).all();
    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear campaña
router.post('/', auth, adminOnly, (req, res) => {
  try {
    const { name, subject, body, recipients } = req.body;
    const result = db.prepare(`
      INSERT INTO email_templates (name, subject, body, category, created_by)
      VALUES (?, ?, ?, 'campaign', ?)
    `).run(name, subject, body, req.user.id);
    res.json({ id: result.lastInsertRowid, name });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Enviar campaña
router.post('/:id/send', auth, adminOnly, (req, res) => {
  try {
    const { recipient_ids } = req.body;
    const template = db.prepare('SELECT * FROM email_templates WHERE id = ?').get(req.params.id);
    if (!template) return res.status(404).json({ error: 'Campaña no encontrada' });

    let sent = 0;
    const targetUsers = recipient_ids || db.prepare('SELECT id FROM users').all().map(u => u.id);

    targetUsers.forEach(userId => {
      try {
        db.prepare(`
          INSERT INTO notifications (user_id, title, message, type)
          VALUES (?, ?, ?, 'campaign')
        `).run(userId, template.subject, template.body);
        sent++;
      } catch (e) {}
    });

    db.prepare(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
      VALUES (?, 'campaign_sent', 'email_template', ?, ?)
    `).run(req.user.id, req.params.id, `Campaña "${template.name}" enviada a ${sent} usuarios`);

    res.json({ sent, total: targetUsers.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar campaña
router.delete('/:id', auth, adminOnly, (req, res) => {
  try {
    db.prepare("DELETE FROM email_templates WHERE id = ? AND category = 'campaign'").run(req.params.id);
    res.json({ message: 'Campaña eliminada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;