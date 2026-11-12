const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

// Estadísticas de usuarios
router.get('/stats', auth, adminOnly, (req, res) => {
  try {
    const stats = {
      total: db.prepare('SELECT COUNT(*) as count FROM users').get().count,
      byRole: db.prepare('SELECT role, COUNT(*) as count FROM users GROUP BY role').all(),
      recentLogins: db.prepare(`
        SELECT u.name, u.email, la.timestamp
        FROM login_attempts la
        JOIN users u ON la.user_id = u.id
        WHERE la.success = 1
        ORDER BY la.timestamp DESC
        LIMIT 10
      `).all(),
      activeUsers: db.prepare("SELECT COUNT(*) as count FROM users WHERE status = 'active'").get().count,
    };
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Grupos de usuarios
router.get('/groups', auth, adminOnly, (req, res) => {
  try {
    const groups = db.prepare('SELECT * FROM user_groups ORDER BY name').all();
    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;