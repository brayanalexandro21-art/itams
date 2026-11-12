const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

// Gestión avanzada de sesiones
router.get('/active', auth, (req, res) => {
  try {
    const sessions = db.prepare(`
      SELECT us.*, u.name, u.email
      FROM user_sessions us
      JOIN users u ON us.user_id = u.id
      WHERE us.expires_at > datetime('now')
      ORDER BY us.last_active DESC
    `).all();
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Forzar cierre de sesión
router.post('/force-logout', auth, adminOnly, (req, res) => {
  try {
    const { user_id } = req.body;
    db.prepare('DELETE FROM user_sessions WHERE user_id = ?').run(user_id);
    res.json({ message: 'Sesiones cerradas' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;