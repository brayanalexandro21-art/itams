const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

// Dashboard de gamificación
router.get('/dashboard', auth, (req, res) => {
  try {
    const userPoints = db.prepare('SELECT * FROM gamification_points WHERE user_id = ?').get(req.user.id);
    const userBadges = db.prepare(`
      SELECT gb.name, gb.description, gb.icon, ub.earned_at
      FROM user_badges ub
      JOIN gamification_badges gb ON ub.badge_id = gb.id
      WHERE ub.user_id = ?
      ORDER BY ub.earned_at DESC
    `).all(req.user.id);

    const leaderboard = db.prepare(`
      SELECT u.id, u.name, gp.total_points, gp.level
      FROM gamification_points gp
      JOIN users u ON gp.user_id = u.id
      ORDER BY gp.total_points DESC
      LIMIT 10
    `).all();

    const recentHistory = db.prepare(`
      SELECT gh.*, gh.reason as points_name
      FROM gamification_history gh
      WHERE gh.user_id = ?
      ORDER BY gh.created_at DESC
      LIMIT 10
    `).all(req.user.id);

    const allBadges = db.prepare('SELECT * FROM gamification_badges ORDER BY points_required').all();

    res.json({
      user: userPoints || { total_points: 0, level: 1 },
      badges: userBadges,
      allBadges,
      leaderboard,
      recentHistory,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Otorgar puntos
router.post('/award', auth, adminOnly, (req, res) => {
  try {
    const { user_id, points, reason } = req.body;

    let userPoints = db.prepare('SELECT * FROM gamification_points WHERE user_id = ?').get(user_id);
    if (!userPoints) {
      db.prepare('INSERT INTO gamification_points (user_id, total_points, level) VALUES (?, 0, 1)').run(user_id);
      userPoints = db.prepare('SELECT * FROM gamification_points WHERE user_id = ?').get(user_id);
    }

    const newTotal = userPoints.total_points + points;
    const newLevel = Math.floor(Math.log2(newTotal / 100)) + 1;

    db.prepare('UPDATE gamification_points SET total_points = ?, level = ? WHERE user_id = ?')
      .run(newTotal, Math.max(1, newLevel), user_id);

    db.prepare(`
      INSERT INTO gamification_history (user_id, points_earned, reason, created_by)
      VALUES (?, ?, ?, ?)
    `).run(user_id, points, reason, req.user.id);

    // Check for badge unlocks
    const badges = db.prepare('SELECT * FROM gamification_badges WHERE points_required <= ?').all(newTotal);
    badges.forEach(badge => {
      const existing = db.prepare('SELECT * FROM user_badges WHERE user_id = ? AND badge_id = ?').get(user_id, badge.id);
      if (!existing) {
        db.prepare('INSERT INTO user_badges (user_id, badge_id) VALUES (?, ?)').run(user_id, badge.id);
      }
    });

    res.json({ total_points: newTotal, level: Math.max(1, newLevel) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Leaderboard
router.get('/leaderboard', auth, (req, res) => {
  try {
    const leaderboard = db.prepare(`
      SELECT u.id, u.name, gp.total_points, gp.level
      FROM gamification_points gp
      JOIN users u ON gp.user_id = u.id
      ORDER BY gp.total_points DESC
      LIMIT 20
    `).all();
    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;