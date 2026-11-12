const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

// Listar reglas de notificación
router.get('/', auth, adminOnly, (req, res) => {
  try {
    const rules = db.prepare('SELECT * FROM notification_channels ORDER BY name').all();
    res.json(rules);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear regla
router.post('/', auth, adminOnly, (req, res) => {
  try {
    const { name, channel_type, config, events, active } = req.body;
    const result = db.prepare(`
      INSERT INTO notification_channels (name, type, config, events, active, created_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(name, channel_type, JSON.stringify(config || {}), JSON.stringify(events || []), active !== false ? 1 : 0, req.user.id);
    res.json({ id: result.lastInsertRowid, name });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar regla
router.put('/:id', auth, adminOnly, (req, res) => {
  try {
    const { name, channel_type, config, events, active } = req.body;
    db.prepare('UPDATE notification_channels SET name = ?, type = ?, config = ?, events = ?, active = ? WHERE id = ?')
      .run(name, channel_type, JSON.stringify(config), JSON.stringify(events), active ? 1 : 0, req.params.id);
    res.json({ message: 'Regla actualizada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar regla
router.delete('/:id', auth, adminOnly, (req, res) => {
  try {
    db.prepare('DELETE FROM notification_channels WHERE id = ?').run(req.params.id);
    res.json({ message: 'Regla eliminada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Tipos de canal disponibles
router.get('/types', auth, (req, res) => {
  res.json([
    { type: 'email', name: 'Email', icon: '📧' },
    { type: 'slack', name: 'Slack', icon: '💬' },
    { type: 'discord', name: 'Discord', icon: '🎮' },
    { type: 'teams', name: 'Microsoft Teams', icon: '👥' },
    { type: 'webhook', name: 'Webhook', icon: '🔗' },
    { type: 'sms', name: 'SMS', icon: '📱' },
  ]);
});

module.exports = router;