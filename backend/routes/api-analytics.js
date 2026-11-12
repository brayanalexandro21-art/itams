const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

// Get API analytics overview
router.get('/overview', auth, adminOnly, (req, res) => {
  try {
    const overview = {
      total_requests: db.prepare('SELECT COUNT(*) as count FROM api_request_logs').get().count,
      requests_today: db.prepare(`
        SELECT COUNT(*) as count FROM api_request_logs
        WHERE DATE(created_at) = DATE('now')
      `).get().count,
      requests_this_hour: db.prepare(`
        SELECT COUNT(*) as count FROM api_request_logs
        WHERE created_at >= DATE('now', '-1 hour')
      `).get().count,
      avg_response_time: db.prepare(`
        SELECT AVG(response_time_ms) as avg FROM api_request_logs
        WHERE created_at >= DATE('now', '-1 day')
      `).get().avg || 0,
      error_rate: calculateErrorRate(),
      unique_users: db.prepare(`
        SELECT COUNT(DISTINCT user_id) as count FROM api_request_logs
        WHERE created_at >= DATE('now', '-1 day')
      `).get().count,
      top_endpoints: db.prepare(`
        SELECT endpoint, COUNT(*) as count
        FROM api_request_logs
        WHERE created_at >= DATE('now', '-1 day')
        GROUP BY endpoint
        ORDER BY count DESC
        LIMIT 10
      `).all(),
    };

    res.json(overview);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get API usage by endpoint
router.get('/by-endpoint', auth, adminOnly, (req, res) => {
  try {
    const { period = 'day' } = req.query;

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
      case 'month':
        timeFilter = "AND created_at >= DATE('now', '-30 days')";
        break;
    }

    const usage = db.prepare(`
      SELECT endpoint, method,
        COUNT(*) as request_count,
        AVG(response_time_ms) as avg_response_time,
        MIN(response_time_ms) as min_response_time,
        MAX(response_time_ms) as max_response_time,
        SUM(CASE WHEN status_code = 200 THEN 1 ELSE 0 END) as success_count,
        SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END) as error_count
      FROM api_request_logs
      WHERE 1=1 ${timeFilter}
      GROUP BY endpoint, method
      ORDER BY request_count DESC
    `).all();

    res.json(usage);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get API usage by user
router.get('/by-user', auth, adminOnly, (req, res) => {
  try {
    const usage = db.prepare(`
      SELECT u.id, u.name, u.email,
        COUNT(arl.id) as request_count,
        AVG(arl.response_time_ms) as avg_response_time,
        COUNT(DISTINCT arl.endpoint) as endpoints_used,
        MIN(arl.created_at) as first_request,
        MAX(arl.created_at) as last_request
      FROM api_request_logs arl
      JOIN users u ON arl.user_id = u.id
      WHERE arl.created_at >= DATE('now', '-30 days')
      GROUP BY arl.user_id
      ORDER BY request_count DESC
    `).all();

    res.json(usage);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get API response time distribution
router.get('/response-times', auth, adminOnly, (req, res) => {
  try {
    const distribution = db.prepare(`
      SELECT 
        CASE
          WHEN response_time_ms < 100 THEN '< 100ms'
          WHEN response_time_ms < 500 THEN '100-500ms'
          WHEN response_time_ms < 1000 THEN '500ms-1s'
          WHEN response_time_ms < 5000 THEN '1-5s'
          ELSE '> 5s'
        END as bucket,
        COUNT(*) as count
      FROM api_request_logs
      WHERE created_at >= DATE('now', '-1 day')
      GROUP BY bucket
      ORDER BY MIN(response_time_ms)
    `).all();

    res.json(distribution);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get API error analysis
router.get('/errors', auth, adminOnly, (req, res) => {
  try {
    const errors = db.prepare(`
      SELECT endpoint, method, status_code,
        COUNT(*) as count,
        MAX(created_at) as last_occurrence
      FROM api_request_logs
      WHERE status_code >= 400
      AND created_at >= DATE('now', '-7 days')
      GROUP BY endpoint, method, status_code
      ORDER BY count DESC
      LIMIT 20
    `).all();

    res.json(errors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get API timeline
router.get('/timeline', auth, adminOnly, (req, res) => {
  try {
    const { hours = 24 } = req.query;

    const timeline = db.prepare(`
      SELECT 
        strftime('%Y-%m-%d %H:00:00', created_at) as hour,
        COUNT(*) as requests,
        AVG(response_time_ms) as avg_response_time,
        SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END) as errors
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

// Get API health score
router.get('/health', auth, adminOnly, (req, res) => {
  try {
    const health = {
      score: 100,
      issues: [],
      metrics: {
        uptime: process.uptime(),
        memory_usage: process.memoryUsage(),
        requests_per_minute: db.prepare(`
          SELECT COUNT(*) as count FROM api_request_logs
          WHERE created_at >= DATE('now', '-1 minute')
        `).get().count,
        avg_response_time: db.prepare(`
          SELECT AVG(response_time_ms) as avg FROM api_request_logs
          WHERE created_at >= DATE('now', '-5 minutes')
        `).get().avg || 0,
        error_rate: calculateErrorRate(),
      },
    };

    // Deductions
    if (health.metrics.error_rate > 5) {
      health.score -= 20;
      health.issues.push('High error rate');
    }
    if (health.metrics.avg_response_time > 1000) {
      health.score -= 15;
      health.issues.push('Slow response times');
    }
    if (health.metrics.requests_per_minute > 1000) {
      health.score -= 10;
      health.issues.push('High traffic');
    }

    health.score = Math.max(0, health.score);
    health.status = health.score >= 80 ? 'healthy' : health.score >= 60 ? 'degraded' : 'unhealthy';

    res.json(health);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

function calculateErrorRate() {
  const total = db.prepare(`
    SELECT COUNT(*) as count FROM api_request_logs
    WHERE created_at >= DATE('now', '-1 day')
  `).get().count;

  const errors = db.prepare(`
    SELECT COUNT(*) as count FROM api_request_logs
    WHERE status_code >= 400 AND created_at >= DATE('now', '-1 day')
  `).get().count;

  return total > 0 ? Math.round((errors / total) * 100) : 0;
}

module.exports = router;
