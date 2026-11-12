const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

// Get rate limit overview
router.get('/overview', auth, adminOnly, (req, res) => {
  try {
    const overview = {
      total_requests: db.prepare('SELECT COUNT(*) as count FROM api_request_logs').get().count,
      requests_today: db.prepare(`
        SELECT COUNT(*) as count FROM api_request_logs
        WHERE DATE(created_at) = DATE('now')
      `).get().count,
      rate_limited: db.prepare(`
        SELECT COUNT(*) as count FROM api_request_logs
        WHERE status_code = 429
      `).get().count,
      avg_response_time: db.prepare(`
        SELECT AVG(response_time_ms) as avg FROM api_request_logs
        WHERE created_at >= DATE('now', '-1 hour')
      `).get().avg || 0,
      active_rate_limits: db.prepare(`
        SELECT COUNT(DISTINCT identifier) as count FROM rate_limits
        WHERE window_start >= DATE('now', '-1 hour')
      `).get().count,
    };

    res.json(overview);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get rate limit stats by endpoint
router.get('/by-endpoint', auth, adminOnly, (req, res) => {
  try {
    const { period = 'hour' } = req.query;

    let timeFilter = '';
    switch (period) {
      case 'hour':
        timeFilter = "AND created_at >= DATE('now', '-1 hour')";
        break;
      case 'day':
        timeFilter = "AND created_at >= DATE('now', '-1 day')";
        break;
      case 'week':
        timeFilter = "AND created_at >= DATE('now', '-7 days')";
        break;
    }

    const stats = db.prepare(`
      SELECT endpoint, method,
        COUNT(*) as request_count,
        AVG(response_time_ms) as avg_response_time,
        SUM(CASE WHEN status_code = 429 THEN 1 ELSE 0 END) as rate_limited,
        SUM(CASE WHEN status_code >= 500 THEN 1 ELSE 0 END) as errors
      FROM api_request_logs
      WHERE 1=1 ${timeFilter}
      GROUP BY endpoint, method
      ORDER BY request_count DESC
      LIMIT 20
    `).all();

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get rate limit stats by user
router.get('/by-user', auth, adminOnly, (req, res) => {
  try {
    const stats = db.prepare(`
      SELECT u.name, u.email,
        COUNT(arl.id) as request_count,
        AVG(arl.response_time_ms) as avg_response_time,
        SUM(CASE WHEN arl.status_code = 429 THEN 1 ELSE 0 END) as rate_limited
      FROM api_request_logs arl
      LEFT JOIN users u ON arl.user_id = u.id
      WHERE arl.created_at >= DATE('now', '-24 hours')
      GROUP BY arl.user_id
      ORDER BY request_count DESC
      LIMIT 20
    `).all();

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get rate limit timeline
router.get('/timeline', auth, adminOnly, (req, res) => {
  try {
    const { hours = 24 } = req.query;

    const timeline = db.prepare(`
      SELECT 
        strftime('%Y-%m-%d %H:00:00', created_at) as hour,
        COUNT(*) as requests,
        SUM(CASE WHEN status_code = 429 THEN 1 ELSE 0 END) as rate_limited,
        AVG(response_time_ms) as avg_response_time
      FROM api_request_logs
      WHERE created_at >= DATE('now', '-' || ? || ' hours')
      GROUP BY strftime('%Y-%m-%d %H:00:00', created_at)
      ORDER BY hour
    `).all(parseInt(hours));

    res.json(timeline);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get active rate limits
router.get('/active-limits', auth, adminOnly, (req, res) => {
  try {
    const limits = db.prepare(`
      SELECT rl.*, u.name as user_name
      FROM rate_limits rl
      LEFT JOIN users u ON rl.user_id = u.id
      WHERE rl.window_start >= DATE('now', '-1 hour')
      ORDER BY rl.count DESC
      LIMIT 50
    `).all();

    res.json(limits);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update rate limit settings
router.put('/settings', auth, adminOnly, (req, res) => {
  try {
    const { default_limit, window_minutes, whitelist_ips, blacklist_ips } = req.body;

    const upsert = db.prepare(`
      INSERT INTO settings (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = ?
    `);

    if (default_limit !== undefined) {
      upsert.run('ratelimit_default', default_limit.toString(), default_limit.toString());
    }
    if (window_minutes !== undefined) {
      upsert.run('ratelimit_window', window_minutes.toString(), window_minutes.toString());
    }
    if (whitelist_ips) {
      upsert.run('ratelimit_whitelist', JSON.stringify(whitelist_ips), JSON.stringify(whitelist_ips));
    }
    if (blacklist_ips) {
      upsert.run('ratelimit_blacklist', JSON.stringify(blacklist_ips), JSON.stringify(blacklist_ips));
    }

    res.json({ message: 'Rate limit settings updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get rate limit settings
router.get('/settings', auth, adminOnly, (req, res) => {
  try {
    const settings = {
      default_limit: parseInt(db.prepare("SELECT value FROM settings WHERE key = 'ratelimit_default'").get()?.value || '100'),
      window_minutes: parseInt(db.prepare("SELECT value FROM settings WHERE key = 'ratelimit_window'").get()?.value || '1'),
      whitelist_ips: JSON.parse(db.prepare("SELECT value FROM settings WHERE key = 'ratelimit_whitelist'").get()?.value || '[]'),
      blacklist_ips: JSON.parse(db.prepare("SELECT value FROM settings WHERE key = 'ratelimit_blacklist'").get()?.value || '[]'),
    };

    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reset rate limits for user
router.post('/reset/:userId', auth, adminOnly, (req, res) => {
  try {
    db.prepare('DELETE FROM rate_limits WHERE user_id = ?').run(req.params.userId);
    res.json({ message: 'Rate limits reset' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get API health status
router.get('/health', auth, adminOnly, (req, res) => {
  try {
    const health = {
      status: 'healthy',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      requests_per_minute: db.prepare(`
        SELECT COUNT(*) as count FROM api_request_logs
        WHERE created_at >= DATE('now', '-1 minute')
      `).get().count,
      error_rate: calculateErrorRate(),
      avg_response_time: db.prepare(`
        SELECT AVG(response_time_ms) as avg FROM api_request_logs
        WHERE created_at >= DATE('now', '-5 minutes')
      `).get().avg || 0,
    };

    // Determine health status
    if (health.error_rate > 10) health.status = 'degraded';
    if (health.error_rate > 50) health.status = 'unhealthy';

    res.json(health);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

function calculateErrorRate() {
  const total = db.prepare(`
    SELECT COUNT(*) as count FROM api_request_logs
    WHERE created_at >= DATE('now', '-5 minutes')
  `).get().count;

  const errors = db.prepare(`
    SELECT COUNT(*) as count FROM api_request_logs
    WHERE status_code >= 400 AND created_at >= DATE('now', '-5 minutes')
  `).get().count;

  return total > 0 ? Math.round((errors / total) * 100) : 0;
}

module.exports = router;
