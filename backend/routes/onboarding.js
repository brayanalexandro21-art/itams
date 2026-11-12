const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

// Get onboarding status for user
router.get('/status', auth, (req, res) => {
  try {
    let onboarding = db.prepare('SELECT * FROM user_onboarding WHERE user_id = ?').get(req.user.id);

    if (!onboarding) {
      // Create onboarding record
      db.prepare(`
        INSERT INTO user_onboarding (user_id, steps_completed)
        VALUES (?, ?)
      `).run(req.user.id, '[]');

      onboarding = db.prepare('SELECT * FROM user_onboarding WHERE user_id = ?').get(req.user.id);
    }

    const steps = JSON.parse(onboarding.steps_completed || '[]');

    res.json({
      completed: steps,
      total_steps: getOnboardingSteps().length,
      progress: Math.round((steps.length / getOnboardingSteps().length) * 100),
      steps: getOnboardingSteps().map(step => ({
        ...step,
        completed: steps.includes(step.id),
      })),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Complete onboarding step
router.post('/complete-step', auth, (req, res) => {
  try {
    const { step_id } = req.body;

    let onboarding = db.prepare('SELECT * FROM user_onboarding WHERE user_id = ?').get(req.user.id);

    if (!onboarding) {
      db.prepare('INSERT INTO user_onboarding (user_id, steps_completed) VALUES (?, ?)').run(req.user.id, '[]');
      onboarding = db.prepare('SELECT * FROM user_onboarding WHERE user_id = ?').get(req.user.id);
    }

    const steps = JSON.parse(onboarding.steps_completed || '[]');

    if (!steps.includes(step_id)) {
      steps.push(step_id);

      db.prepare(`
        UPDATE user_onboarding
        SET steps_completed = ?,
            completed_at = CASE WHEN ? = ? THEN CURRENT_TIMESTAMP ELSE completed_at END
        WHERE user_id = ?
      `).run(
        JSON.stringify(steps),
        steps.length,
        getOnboardingSteps().length,
        req.user.id
      );
    }

    res.json({ message: 'Step completed', progress: steps.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reset onboarding
router.post('/reset', auth, adminOnly, (req, res) => {
  try {
    const { user_id } = req.body;

    db.prepare('DELETE FROM user_onboarding WHERE user_id = ?').run(user_id || req.user.id);
    res.json({ message: 'Onboarding reset' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get onboarding progress for all users (admin)
router.get('/all', auth, adminOnly, (req, res) => {
  try {
    const progress = db.prepare(`
      SELECT uo.*, u.name, u.email,
        (SELECT COUNT(*) FROM user_onboarding) as total_users,
        (SELECT COUNT(*) FROM user_onboarding WHERE completed_at IS NOT NULL) as completed_users
      FROM user_onboarding uo
      JOIN users u ON uo.user_id = u.id
      ORDER BY u.name
    `).all();

    res.json(progress);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get onboarding analytics
router.get('/analytics', auth, adminOnly, (req, res) => {
  try {
    const analytics = {
      total_users: db.prepare('SELECT COUNT(*) as count FROM users').get().count,
      onboarding_started: db.prepare('SELECT COUNT(*) as count FROM user_onboarding').get().count,
      onboarding_completed: db.prepare('SELECT COUNT(*) as count FROM user_onboarding WHERE completed_at IS NOT NULL').get().count,
      avg_completion_time: db.prepare(`
        SELECT AVG(julianday(completed_at) - julianday(created_at)) * 24 as hours
        FROM user_onboarding
        WHERE completed_at IS NOT NULL
      `).get().hours || 0,
      completion_rate: 0,
    };

    if (analytics.onboarding_started > 0) {
      analytics.completion_rate = Math.round((analytics.onboarding_completed / analytics.onboarding_started) * 100);
    }

    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

function getOnboardingSteps() {
  return [
    { id: 'welcome', title: 'Welcome to ITAMS', description: 'Complete your profile', icon: '👋', required: true },
    { id: 'profile', title: 'Complete Profile', description: 'Add your information', icon: '👤', required: true },
    { id: 'first_ticket', title: 'Create First Ticket', description: 'Learn to create tickets', icon: '🎫', required: true },
    { id: 'first_asset', title: 'Create First Asset', description: 'Add an asset to the system', icon: '💻', required: false },
    { id: 'search', title: 'Try Search', description: 'Search for tickets and assets', icon: '🔍', required: false },
    { id: 'knowledge_base', title: 'Browse Knowledge Base', description: 'Read helpful articles', icon: '📚', required: false },
    { id: 'keyboard_shortcuts', title: 'Learn Shortcuts', description: 'Use keyboard shortcuts', icon: '⌨️', required: false },
    { id: 'notifications', title: 'Set Notifications', description: 'Configure notification preferences', icon: '🔔', required: false },
  ];
}

module.exports = router;
