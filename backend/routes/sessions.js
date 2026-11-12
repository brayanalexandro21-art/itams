const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

// Obtener sesiones activas del usuario
router.get('/my', auth, (req, res) => {
  try {
    const sessions = db.prepare(`
      SELECT id, device, browser, ip_address, created_at, last_active
      FROM user_sessions
      WHERE user_id = ? AND is_active = 1
      ORDER BY last_active DESC
    `).all(req.user.id);
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener todas las sesiones (admin)
router.get('/', auth, adminOnly, (req, res) => {
  try {
    const sessions = db.prepare(`
      SELECT us.*, u.name, u.email
      FROM user_sessions us
      JOIN users u ON us.user_id = u.id
      WHERE us.is_active = 1
      ORDER BY us.last_active DESC
    `).all();
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Registrar nueva sesión
router.post('/create', (req, res) => {
  try {
    const { user_id, device, browser, ip_address } = req.body;
    
    db.prepare(`
      INSERT INTO user_sessions (user_id, device, browser, ip_address)
      VALUES (?, ?, ?, ?)
    `).run(user_id, device, browser, ip_address);

    res.json({ message: 'Sesión registrada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cerrar sesión
router.delete('/logout/:sessionId', auth, (req, res) => {
  try {
    db.prepare(`
      UPDATE user_sessions SET active = 0 WHERE id = ? AND user_id = ?
    `).run(req.params.sessionId, req.user.id);
    
    res.json({ message: 'Sesión cerrada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cerrar todas las sesiones excepto la actual
router.delete('/logout-all', auth, (req, res) => {
  try {
    db.prepare(`
      UPDATE user_sessions SET active = 0
      WHERE user_id = ? AND id != ?
    `).run(req.user.id, req.body.currentSessionId);
    
    res.json({ message: 'Todas las sesiones cerradas' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;