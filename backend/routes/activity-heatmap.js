const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth } = require('../middleware/auth');

// Dashboard de actividad de usuario
router.get('/dashboard', auth, (req, res) => {
  try {
    const userActions = db.prepare(`
      SELECT date(created_at) as date, COUNT(*) as count
      FROM activity_log
      WHERE user_id = ? AND created_at >= date('now', '-30 days')
      GROUP BY date(created_at)
      ORDER BY date
    `).all(req.user.id);

    const byHour = db.prepare(`
      SELECT strftime('%H', created_at) as hour, COUNT(*) as count
      FROM activity_log
      WHERE user_id = ? AND created_at >= date('now', '-7 days')
      GROUP BY hour ORDER BY hour
    `).all(req.user.id);

    const byAction = db.prepare(`
      SELECT action, COUNT(*) as count
      FROM activity_log
      WHERE user_id = ? AND created_at >= date('now', '-30 days')
      GROUP BY action ORDER BY count DESC
      LIMIT 10
    `).all(req.user.id);

    const totalActions = db.prepare(`
      SELECT COUNT(*) as count FROM activity_log WHERE user_id = ? AND created_at >= date('now', '-30 days')
    `).get(req.user.id).count;

    const streak = calculateStreak(req.user.id);

    res.json({ userActions, byHour, byAction, totalActions, streak });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

function calculateStreak(userId) {
  const dates = db.prepare(`
    SELECT DISTINCT date(created_at) as d
    FROM activity_log WHERE user_id = ?
    ORDER BY d DESC LIMIT 30
  `).all(userId).map(r => r.d);

  let streak = 0;
  const today = new Date().toISOString().split('T')[0];
  let checkDate = new Date(today);

  for (const d of dates) {
    const dateStr = checkDate.toISOString().split('T')[0];
    if (d === dateStr) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

module.exports = router;