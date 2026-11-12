const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

// Configurar plantillas de notificación
router.get('/templates', auth, (req, res) => {
  try {
    const templates = db.prepare('SELECT * FROM notification_templates ORDER BY name').all();
    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear plantilla de notificación
router.post('/templates', auth, adminOnly, (req, res) => {
  try {
    const { name, subject, body, channel } = req.body;
    const result = db.prepare(
      'INSERT INTO notification_templates (name, subject, body, channel) VALUES (?, ?, ?, ?)'
    ).run(name, subject, body, channel);
    res.json({ id: result.lastInsertRowid, name });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Enviar notificación masiva
router.post('/bulk', auth, adminOnly, (req, res) => {
  try {
    const { user_ids, template_id, custom_message } = req.body;
    
    const template = db.prepare('SELECT * FROM notification_templates WHERE id = ?').get(template_id);
    if (!template) return res.status(404).json({ error: 'Plantilla no encontrada' });

    let sent = 0;
    user_ids.forEach(user_id => {
      try {
        db.prepare(`
          INSERT INTO notifications (user_id, title, message, type)
          VALUES (?, ?, ?, 'system')
        `).run(user_id, template.subject, custom_message || template.body);
        sent++;
      } catch (e) {
        // Skip failed notifications
      }
    });

    res.json({ sent, total: user_ids.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;