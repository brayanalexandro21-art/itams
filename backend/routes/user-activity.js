const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

// Historial de actividad del usuario
router.get('/history', auth, (req, res) => {
  try {
    const history = db.prepare(`
      SELECT * FROM activity_log 
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 50
    `).all(req.user.id);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Registrar actividad
router.post('/log', auth, (req, res) => {
  try {
    const { action, entity_type, entity_id, details } = req.body;
    const result = db.prepare(
      'INSERT INTO activity_log (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)'
    ).run(req.user.id, action, entity_type, entity_id, details);
    res.json({ id: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
