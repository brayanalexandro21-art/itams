const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

// Gestión de sesiones activas
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

// Cerrar sesión específica
router.delete('/:sessionId', auth, (req, res) => {
  try {
    db.prepare('DELETE FROM user_sessions WHERE id = ?').run(req.params.sessionId);
    res.json({ message: 'Sesión cerrada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Estadísticas de sesiones
router.get('/stats', auth, adminOnly, (req, res) => {
  try {
    const stats = {
      total_sessions: db.prepare('SELECT COUNT(*) as count FROM user_sessions').get().count,
      active_sessions: db.prepare("SELECT COUNT(*) as count FROM user_sessions WHERE expires_at > datetime('now')").get().count,
      unique_users: db.prepare("SELECT COUNT(DISTINCT user_id) as count FROM user_sessions WHERE expires_at > datetime('now')").get().count,
    };
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
