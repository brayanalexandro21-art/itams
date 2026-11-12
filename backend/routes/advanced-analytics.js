const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

// Dashboard analytics
router.get('/dashboard', auth, (req, res) => {
  try {
    const stats = {
      tickets: {
        total: db.prepare('SELECT COUNT(*) as count FROM tickets').get().count,
        open: db.prepare("SELECT COUNT(*) as count FROM tickets WHERE status = 'open'").get().count,
        inProgress: db.prepare("SELECT COUNT(*) as count FROM tickets WHERE status = 'in_progress'").get().count,
        resolved: db.prepare("SELECT COUNT(*) as count FROM tickets WHERE status = 'resolved'").get().count,
        closed: db.prepare("SELECT COUNT(*) as count FROM tickets WHERE status = 'closed'").get().count,
      },
      assets: {
        total: db.prepare('SELECT COUNT(*) as count FROM assets').get().count,
        available: db.prepare("SELECT COUNT(*) as count FROM assets WHERE status = 'available'").get().count,
        inUse: db.prepare("SELECT COUNT(*) as count FROM assets WHERE status = 'in_use'").get().count,
        maintenance: db.prepare("SELECT COUNT(*) as count FROM assets WHERE status = 'maintenance'").get().count,
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

// Ticket trends
router.get('/ticket-trends', auth, (req, res) => {
  try {
    const { period = '30d' } = req.query;
    let dateFilter = '';
    
    switch (period) {
      case '7d': dateFilter = "AND created_at >= datetime('now', '-7 days')"; break;
      case '30d': dateFilter = "AND created_at >= datetime('now', '-30 days')"; break;
      case '90d': dateFilter = "AND created_at >= datetime('now', '-90 days')"; break;
      default: dateFilter = "AND created_at >= datetime('now', '-30 days')";
    }

    const trends = db.prepare(`
      SELECT date(created_at) as date, COUNT(*) as count
      FROM tickets
      WHERE 1=1 ${dateFilter}
      GROUP BY date(created_at)
      ORDER BY date
    `).all();

    res.json(trends);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Category distribution
router.get('/category-distribution', auth, (req, res) => {
  try {
    const distribution = db.prepare(`
      SELECT category, COUNT(*) as count
      FROM tickets
      WHERE category IS NOT NULL
      GROUP BY category
      ORDER BY count DESC
    `).all();
    res.json(distribution);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Priority distribution
router.get('/priority-distribution', auth, (req, res) => {
  try {
    const distribution = db.prepare(`
      SELECT priority, COUNT(*) as count
      FROM tickets
      GROUP BY priority
      ORDER BY 
        CASE priority
          WHEN 'critical' THEN 1
          WHEN 'high' THEN 2
          WHEN 'medium' THEN 3
          WHEN 'low' THEN 4
        END
    `).all();
    res.json(distribution);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Performance metrics
router.get('/performance', auth, (req, res) => {
  try {
    const metrics = db.prepare(`
      SELECT 
        AVG(CASE WHEN status = 'resolved' 
          THEN julianday(resolved_at) - julianday(created_at) 
          ELSE NULL END) as avg_resolution_days,
        COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_count,
        COUNT(CASE WHEN status = 'open' THEN 1 END) as open_count
      FROM tickets
    `).get();
    
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;