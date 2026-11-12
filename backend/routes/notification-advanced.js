const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

const PREF_FIELDS = ['email_enabled', 'push_enabled', 'ticket_created', 'ticket_updated'];

// better-sqlite3 no acepta booleanos: se convierten a 1/0
const toInt = (v) => (v === undefined || v === null ? 1 : (v ? 1 : 0));

// Configurar canales de notificación
router.get('/channels', auth, (req, res) => {
  try {
    const channels = db.prepare('SELECT * FROM notification_channels WHERE created_by = ?').all(req.user.id);
    res.json(channels);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear canal de notificación
router.post('/channels', auth, (req, res) => {
  try {
    const { name, type, config } = req.body;
    if (!name || !type) {
      return res.status(400).json({ error: 'name y type son requeridos' });
    }
    const result = db.prepare(
      'INSERT INTO notification_channels (created_by, name, type, config) VALUES (?, ?, ?, ?)'
    ).run(req.user.id, name, type, JSON.stringify(config || {}));
    res.json({ id: result.lastInsertRowid, name, type });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener preferencias de notificación (valores por defecto si no existen)
router.get('/preferences', auth, (req, res) => {
  try {
    const row = db.prepare(
      `SELECT ${PREF_FIELDS.join(', ')} FROM notification_preferences WHERE user_id = ?`
    ).get(req.user.id);
    const prefs = {};
    PREF_FIELDS.forEach((f) => { prefs[f] = row ? !!row[f] : true; });
    res.json(prefs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Configurar preferencias de notificación
router.put('/preferences', auth, (req, res) => {
  try {
    const values = PREF_FIELDS.map((f) => toInt(req.body[f]));
    db.prepare(`
      INSERT INTO notification_preferences (user_id, email_enabled, push_enabled, ticket_created, ticket_updated)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET email_enabled=?, push_enabled=?, ticket_created=?, ticket_updated=?
    `).run(req.user.id, ...values, ...values);
    res.json({ message: 'Preferencias actualizadas' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
