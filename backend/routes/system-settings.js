const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

// Obtener configuración del sistema
router.get('/', auth, (req, res) => {
  try {
    const settings = {};
    const rows = db.prepare('SELECT key, value FROM settings').all();
    rows.forEach(r => { settings[r.key] = r.value; });
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener configuración de usuario
router.get('/user', auth, (req, res) => {
  try {
    let prefs = db.prepare('SELECT * FROM user_preferences WHERE user_id = ?').get(req.user.id);
    if (!prefs) {
      db.prepare('INSERT INTO user_preferences (user_id, theme, language, timezone) VALUES (?, ?, ?, ?)').run(req.user.id, 'light', 'es', 'America/Mexico_City');
      prefs = db.prepare('SELECT * FROM user_preferences WHERE user_id = ?').get(req.user.id);
    }
    res.json(prefs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar configuración de usuario
router.put('/user', auth, (req, res) => {
  try {
    const { theme, language, timezone, notifications_enabled, compact_mode } = req.body;
    db.prepare(`
      INSERT INTO user_preferences (user_id, theme, language, timezone, notifications_enabled, compact_mode)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        theme = COALESCE(?, theme),
        language = COALESCE(?, language),
        timezone = COALESCE(?, timezone),
        notifications_enabled = COALESCE(?, notifications_enabled),
        compact_mode = COALESCE(?, compact_mode)
    `).run(req.user.id, theme, language, timezone, notifications_enabled ? 1 : 0, compact_mode ? 1 : 0,
      theme, language, timezone, notifications_enabled !== undefined ? (notifications_enabled ? 1 : 0) : null, compact_mode !== undefined ? (compact_mode ? 1 : 0) : null);
    res.json({ message: 'Configuración actualizada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar configuración del sistema (admin)
router.put('/', auth, adminOnly, (req, res) => {
  try {
    const settings = req.body;
    Object.entries(settings).forEach(([key, value]) => {
      db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?')
        .run(key, value, value);
    });
    res.json({ message: 'Configuración del sistema actualizada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Temas disponibles
router.get('/themes', auth, (req, res) => {
  res.json([
    { id: 'light', name: 'Claro', primary: '#4f46e5', bg: '#ffffff' },
    { id: 'dark', name: 'Oscuro', primary: '#818cf8', bg: '#1f2937' },
    { id: 'midnight', name: 'Medianoche', primary: '#6366f1', bg: '#0f172a' },
    { id: 'ocean', name: 'Océano', primary: '#0ea5e9', bg: '#f0f9ff' },
  ]);
});

module.exports = router;