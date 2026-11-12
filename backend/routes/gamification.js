const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

// Badge definitions
const BADGES = {
  FIRST_TICKET: { name: 'First Ticket', description: 'Created your first ticket', icon: '🎫', points: 10 },
  TICKET_MASTER: { name: 'Ticket Master', description: 'Created 100 tickets', icon: '🏆', points: 100 },
  QUICK_RESOLVER: { name: 'Quick Resolver', description: 'Resolved a ticket in under 1 hour', icon: '⚡', points: 50 },
  HELPFUL_HERO: { name: 'Helpful Hero', description: 'Received 10 helpful votes on KB articles', icon: '🦸', points: 75 },
  KNOWLEDGE_GURU: { name: 'Knowledge Guru', description: 'Created 20 KB articles', icon: '📚', points: 150 },
  SPEED_DEMON: { name: 'Speed Demon', description: 'Resolved 10 tickets in one day', icon: ' demonspeed', points: 100 },
  TEAM_PLAYER: { name: 'Team Player', description: 'Helped 5 different colleagues', icon: '🤝', points: 50 },
  PERFECTIONIST: { name: 'Perfectionist', description: 'Maintained 95% SLA compliance for a month', icon: '⭐', points: 200 },
  CUSTOMER_CHAMP: { name: 'Customer Champion', description: 'Received 5-star rating 10 times', icon: '👑', points: 100 },
  IRON_MAN: { name: 'Iron Man', description: '30 day streak of resolving tickets', icon: '🦾', points: 300 },
};

// Get gamification leaderboard
router.get('/leaderboard', auth, (req, res) => {
  try {
    const leaderboard = db.prepare(`
      SELECT 
        u.id,
        u.name,
        u.department,
        COALESCE(gp.total_points, 0) as total_points,
        COALESCE(gp.level, 1) as level,
        (SELECT COUNT(*) FROM user_badges WHERE user_id = u.id) as badge_count
      FROM users u
      LEFT JOIN gamification_points gp ON u.id = gp.user_id
      WHERE u.role IN ('technician', 'admin')
      ORDER BY total_points DESC
      LIMIT 20
    `).all();

    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's gamification stats
router.get('/my-stats', auth, (req, res) => {
  try {
    const stats = db.prepare(`
      SELECT 
        gp.total_points,
        gp.level,
        gp.streak_days,
        (SELECT COUNT(*) FROM user_badges WHERE user_id = ?) as badge_count
      FROM gamification_points gp
      WHERE gp.user_id = ?
    `).get(req.user.id, req.user.id);

    const badges = db.prepare(`
      SELECT ub.*, b.name, b.description, b.icon, b.points
      FROM user_badges ub
      JOIN gamification_badges b ON ub.badge_id = b.id
      WHERE ub.user_id = ?
      ORDER BY ub.earned_at DESC
    `).all(req.user.id);

    const recentActivity = db.prepare(`
      SELECT points_earned, reason, created_at
      FROM gamification_history
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 10
    `).all(req.user.id);

    res.json({
      stats: stats || { total_points: 0, level: 1, streak_days: 0 },
      badges,
      recentActivity,
      nextLevelPoints: Math.pow(2, (stats?.level || 1)) * 100,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add points to user (internal function)
function addPoints(userId, points, reason) {
  try {
    // Get current points
    let stats = db.prepare('SELECT * FROM gamification_points WHERE user_id = ?').get(userId);

    if (!stats) {
      db.prepare('INSERT INTO gamification_points (user_id, total_points, level) VALUES (?, ?, 1)')
        .run(userId, points);
      stats = { total_points: 0, level: 1 };
    } else {
      const newTotal = stats.total_points + points;
      const newLevel = Math.floor(Math.log2(newTotal / 100)) + 1;
      
      db.prepare('UPDATE gamification_points SET total_points = ?, level = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?')
        .run(newTotal, newLevel, userId);
    }

    // Log the points
    db.prepare('INSERT INTO gamification_history (user_id, points_earned, reason) VALUES (?, ?, ?)')
      .run(userId, points, reason);

    // Check for badge eligibility
    checkBadges(userId);

    return true;
  } catch (error) {
    console.error('Gamification error:', error);
    return false;
  }
}

// Check and award badges
function checkBadges(userId) {
  try {
    const userStats = {
      tickets_created: db.prepare('SELECT COUNT(*) as count FROM tickets WHERE created_by = ?').get(userId).count,
      tickets_resolved: db.prepare("SELECT COUNT(*) as count FROM tickets WHERE assigned_to = ? AND status IN ('resolved', 'closed')").get(userId).count,
      kb_articles: db.prepare('SELECT COUNT(*) as count FROM knowledge_base WHERE author_id = ?').get(userId).count,
      helpful_votes: db.prepare(`
        SELECT SUM(helpful) as total FROM knowledge_base WHERE author_id = ?
      `).get(userId).total || 0,
    };

    const earnedBadges = db.prepare('SELECT badge_id FROM user_badges WHERE user_id = ?').all(userId).map(b => b.badge_id);

    // Check each badge condition
    if (userStats.tickets_created >= 1 && !earnedBadges.includes('FIRST_TICKET')) {
      awardBadge(userId, 'FIRST_TICKET');
    }
    if (userStats.tickets_created >= 100 && !earnedBadges.includes('TICKET_MASTER')) {
      awardBadge(userId, 'TICKET_MASTER');
    }
    if (userStats.kb_articles >= 20 && !earnedBadges.includes('KNOWLEDGE_GURU')) {
      awardBadge(userId, 'KNOWLEDGE_GURU');
    }
    if (userStats.helpful_votes >= 10 && !earnedBadges.includes('HELPFUL_HERO')) {
      awardBadge(userId, 'HELPFUL_HERO');
    }
  } catch (error) {
    console.error('Badge check error:', error);
  }
}

// Award badge to user
function awardBadge(userId, badgeId) {
  try {
    const badge = BADGES[badgeId];
    if (!badge) return;

    db.prepare('INSERT OR IGNORE INTO user_badges (user_id, badge_id) VALUES (?, ?)')
      .run(userId, badgeId);

    // Add bonus points
    addPoints(userId, badge.points, `Earned badge: ${badge.name}`);

    // Create notification
    db.prepare('INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)')
      .run(userId, 'Badge Earned!', `You earned the "${badge.name}" badge!`, 'success');

    return true;
  } catch (error) {
    console.error('Badge award error:', error);
    return false;
  }
}

// Get all available badges
router.get('/badges', auth, (req, res) => {
  try {
    const badges = Object.entries(BADGES).map(([id, badge]) => ({
      id,
      ...badge,
    }));
    res.json(badges);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
module.exports.addPoints = addPoints;
module.exports.BADGES = BADGES;
