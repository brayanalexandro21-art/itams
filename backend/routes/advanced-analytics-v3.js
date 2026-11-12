const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

// Dashboard analytics v3
router.get('/dashboard-v3', auth, (req, res) => {
  try {
    const stats = {
      tickets: {
        total: db.prepare('SELECT COUNT(*) as count FROM tickets').get().count,
        open: db.prepare("SELECT COUNT(*) as count FROM tickets WHERE status = 'open'").get().count,
        inProgress: db.prepare("SELECT COUNT(*) as count FROM tickets WHERE status = 'in_progress'").get().count,
        resolved: db.prepare("SELECT COUNT(*) as count FROM tickets WHERE status = 'resolved'").get().count,
        closed: db.prepare("SELECT COUNT(*) as count FROM tickets WHERE status = 'closed'").get().count,
        byPriority: db.prepare('SELECT priority, COUNT(*) as count FROM tickets GROUP BY priority').all(),
        byCategory: db.prepare('SELECT category, COUNT(*) as count FROM tickets WHERE category IS NOT NULL GROUP BY category').all(),
        byDay: db.prepare(`
          SELECT date(created_at) as date, COUNT(*) as count
          FROM tickets WHERE created_at >= date('now', '-7 days')
          GROUP BY date(created_at) ORDER BY date
        `).all(),
      },
      assets: {
        total: db.prepare('SELECT COUNT(*) as count FROM assets').get().count,
        available: db.prepare("SELECT COUNT(*) as count FROM assets WHERE status = 'available'").get().count,
        inUse: db.prepare("SELECT COUNT(*) as count FROM assets WHERE status = 'in_use'").get().count,
        maintenance: db.prepare("SELECT COUNT(*) as count FROM assets WHERE status = 'maintenance'").get().count,
        byType: db.prepare('SELECT type, COUNT(*) as count FROM assets GROUP BY type').all(),
      },
      users: {
        total: db.prepare('SELECT COUNT(*) as count FROM users').get().count,
        active: db.prepare("SELECT COUNT(*) as count FROM users WHERE status = 'active'").get().count,
      },
      recentActivity: db.prepare(`
        SELECT * FROM activity_log ORDER BY created_at DESC LIMIT 10
      `).all()
    };
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;