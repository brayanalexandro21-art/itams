const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth } = require('../middleware/auth');

// Obtener tema del usuario
router.get('/theme', auth, (req, res) => {
  try {
    const theme = db.prepare('SELECT theme FROM user_preferences WHERE user_id = ?').get(req.user.id);
    res.json({ theme: theme?.theme || 'light' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar tema
router.put('/theme', auth, (req, res) => {
  try {
    const { theme } = req.body;
    
    db.prepare(`
      INSERT INTO user_preferences (user_id, theme) VALUES (?, ?)
      ON CONFLICT(user_id) DO UPDATE SET theme = ?
    `).run(req.user.id, theme, theme);

    res.json({ theme, message: 'Tema actualizado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;