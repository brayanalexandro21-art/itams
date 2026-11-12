const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');
const crypto = require('crypto');

// Get security settings
router.get('/settings', auth, adminOnly, (req, res) => {
  try {
    const settings = db.prepare("SELECT * FROM settings WHERE key LIKE 'security_%'").all();
    const config = {};
    settings.forEach(s => {
      config[s.key.replace('security_', '')] = s.value;
    });

    res.json({
      password_policy: {
        min_length: parseInt(config.password_min_length || '8'),
        require_uppercase: config.password_require_uppercase === 'true',
        require_lowercase: config.password_require_lowercase === 'true',
        require_numbers: config.password_require_numbers === 'true',
        require_special: config.password_require_special === 'true',
        max_age_days: parseInt(config.password_max_age_days || '90'),
      },
      session_policy: {
        max_sessions: parseInt(config.session_max_count || '5'),
        idle_timeout_minutes: parseInt(config.session_idle_timeout || '30'),
        absolute_timeout_hours: parseInt(config.session_absolute_timeout || '24'),
      },
      login_policy: {
        max_attempts: parseInt(config.login_max_attempts || '5'),
        lockout_duration_minutes: parseInt(config.login_lockout_duration || '15'),
        require_2fa: config.login_require_2fa === 'true',
      },
      api_security: {
        rate_limit_per_minute: parseInt(config.api_rate_limit || '100'),
        require_https: config.api_require_https === 'true',
        cors_origins: config.api_cors_origins || '*',
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update security settings
router.put('/settings', auth, adminOnly, (req, res) => {
  try {
    const { password_policy, session_policy, login_policy, api_security } = req.body;

    const upsert = db.prepare(`
      INSERT INTO settings (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = ?
    `);

    // Password policy
    if (password_policy) {
      upsert.run('security_password_min_length', password_policy.min_length?.toString(), password_policy.min_length?.toString());
      upsert.run('security_password_require_uppercase', password_policy.require_uppercase?.toString(), password_policy.require_uppercase?.toString());
      upsert.run('security_password_require_lowercase', password_policy.require_lowercase?.toString(), password_policy.require_lowercase?.toString());
      upsert.run('security_password_require_numbers', password_policy.require_numbers?.toString(), password_policy.require_numbers?.toString());
      upsert.run('security_password_require_special', password_policy.require_special?.toString(), password_policy.require_special?.toString());
      upsert.run('security_password_max_age_days', password_policy.max_age_days?.toString(), password_policy.max_age_days?.toString());
    }

    // Session policy
    if (session_policy) {
      upsert.run('security_session_max_count', session_policy.max_sessions?.toString(), session_policy.max_sessions?.toString());
      upsert.run('security_session_idle_timeout', session_policy.idle_timeout_minutes?.toString(), session_policy.idle_timeout_minutes?.toString());
      upsert.run('security_session_absolute_timeout', session_policy.absolute_timeout_hours?.toString(), session_policy.absolute_timeout_hours?.toString());
    }

    // Login policy
    if (login_policy) {
      upsert.run('security_login_max_attempts', login_policy.max_attempts?.toString(), login_policy.max_attempts?.toString());
      upsert.run('security_login_lockout_duration', login_policy.lockout_duration_minutes?.toString(), login_policy.lockout_duration_minutes?.toString());
      upsert.run('security_login_require_2fa', login_policy.require_2fa?.toString(), login_policy.require_2fa?.toString());
    }

    // API security
    if (api_security) {
      upsert.run('security_api_rate_limit', api_security.rate_limit_per_minute?.toString(), api_security.rate_limit_per_minute?.toString());
      upsert.run('security_api_require_https', api_security.require_https?.toString(), api_security.require_https?.toString());
      upsert.run('security_api_cors_origins', api_security.cors_origins, api_security.cors_origins);
    }

    res.json({ message: 'Security settings updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Check password strength
router.post('/check-password', (req, res) => {
  try {
    const { password } = req.body;

    const strength = {
      score: 0,
      feedback: [],
      requirements: {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        numbers: /[0-9]/.test(password),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      },
    };

    // Calculate score
    if (strength.requirements.length) strength.score += 1;
    if (strength.requirements.uppercase) strength.score += 1;
    if (strength.requirements.lowercase) strength.score += 1;
    if (strength.requirements.numbers) strength.score += 1;
    if (strength.requirements.special) strength.score += 1;
    if (password.length >= 12) strength.score += 1;

    // Normalize score to 0-100
    strength.score = Math.round((strength.score / 6) * 100);

    // Add feedback
    if (!strength.requirements.length) strength.feedback.push('Use at least 8 characters');
    if (!strength.requirements.uppercase) strength.feedback.push('Add uppercase letters');
    if (!strength.requirements.lowercase) strength.feedback.push('Add lowercase letters');
    if (!strength.requirements.numbers) strength.feedback.push('Add numbers');
    if (!strength.requirements.special) strength.feedback.push('Add special characters');
    if (password.length < 12) strength.feedback.push('Consider using 12+ characters');

    // Determine strength label
    if (strength.score >= 80) strength.label = 'Strong';
    else if (strength.score >= 60) strength.label = 'Good';
    else if (strength.score >= 40) strength.label = 'Fair';
    else strength.label = 'Weak';

    res.json(strength);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get login attempts
router.get('/login-attempts', auth, adminOnly, (req, res) => {
  try {
    const { email, limit = 50 } = req.query;

    let query = `
      SELECT la.*, u.email as user_email
      FROM login_attempts la
      LEFT JOIN users u ON la.user_id = u.id
      WHERE 1=1
    `;

    const params = [];

    if (email) {
      query += ' AND u.email = ?';
      params.push(email);
    }

    query += ' ORDER BY la.created_at DESC LIMIT ?';
    params.push(parseInt(limit));

    const attempts = db.prepare(query).all(...params);
    res.json(attempts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get security audit log
router.get('/audit', auth, adminOnly, (req, res) => {
  try {
    const { limit = 100 } = req.query;

    const logs = db.prepare(`
      SELECT al.*, u.email as user_email
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.action IN ('login', 'logout', 'password_change', '2fa_enable', '2fa_disable', 'role_change')
      ORDER BY al.created_at DESC
      LIMIT ?
    `).all(parseInt(limit));

    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate API key with rotation
router.post('/rotate-api-key', auth, adminOnly, (req, res) => {
  try {
    const { key_id } = req.body;

    // Get existing key
    const existingKey = db.prepare('SELECT * FROM api_keys WHERE id = ?').get(key_id);
    if (!existingKey) {
      return res.status(404).json({ error: 'API key not found' });
    }

    // Generate new key
    const newKey = 'itams_' + crypto.randomBytes(32).toString('hex');
    const newPrefix = newKey.substring(0, 12) + '...';

    // Update key
    db.prepare(`
      UPDATE api_keys
      SET key = ?, key_prefix = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(newKey, newPrefix, key_id);

    res.json({
      message: 'API key rotated successfully',
      key: newKey,
      prefix: newPrefix,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get security score
router.get('/score', auth, adminOnly, (req, res) => {
  try {
    const checks = {
      twoFactorEnabled: db.prepare('SELECT COUNT(*) as count FROM users WHERE two_factor_enabled = 1').get().count,
      totalUsers: db.prepare('SELECT COUNT(*) as count FROM users').get().count,
      weakPasswords: 0, // Would check password hashes in production
      activeSessions: db.prepare('SELECT COUNT(*) as count FROM user_sessions WHERE active = 1').get().count,
      recentLogins: db.prepare("SELECT COUNT(*) as count FROM login_attempts WHERE created_at >= DATE('now', '-7 days')").get().count,
      failedLogins: db.prepare("SELECT COUNT(*) as count FROM login_attempts WHERE success = 0 AND created_at >= DATE('now', '-7 days')").get().count,
    };

    // Calculate score
    let score = 100;
    
    // Deductions
    if (checks.twoFactorEnabled < checks.totalUsers * 0.5) score -= 20;
    if (checks.failedLogins > 10) score -= 15;
    if (checks.activeSessions > 50) score -= 10;

    score = Math.max(0, Math.min(100, score));

    let grade;
    if (score >= 90) grade = 'A';
    else if (score >= 80) grade = 'B';
    else if (score >= 70) grade = 'C';
    else if (score >= 60) grade = 'D';
    else grade = 'F';

    res.json({
      score,
      grade,
      checks,
      recommendations: generateRecommendations(checks),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

function generateRecommendations(checks) {
  const recommendations = [];

  if (checks.twoFactorEnabled < checks.totalUsers * 0.5) {
    recommendations.push({
      priority: 'high',
      message: 'Enable two-factor authentication for more users',
    });
  }

  if (checks.failedLogins > 10) {
    recommendations.push({
      priority: 'high',
      message: 'Review recent failed login attempts for potential security threats',
    });
  }

  if (checks.activeSessions > 50) {
    recommendations.push({
      priority: 'medium',
      message: 'Consider limiting active sessions per user',
    });
  }

  return recommendations;
}

module.exports = router;
