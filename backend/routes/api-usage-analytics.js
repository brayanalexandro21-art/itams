const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

// Dashboard de uso de API
router.get('/dashboard', auth, adminOnly, (req, res) => {
  try {
    const totalRequests = db.prepare('SELECT COUNT(*) as count FROM api_request_logs').get().count;
    const todayRequests = db.prepare("SELECT COUNT(*) as count FROM api_request_logs WHERE created_at >= date('now')").get().count;
    const avgResponseTime = db.prepare('SELECT AVG(response_time) as avg FROM api_request_logs').get().avg;

    const byEndpoint = db.prepare(`
      SELECT endpoint, COUNT(*) as count, AVG(response_time) as avg_time,
        MAX(response_time) as max_time
      FROM api_request_logs
      GROUP BY endpoint
      ORDER BY count DESC
      LIMIT 15
    `).all();

    const byHour = db.prepare(`
      SELECT strftime('%H', created_at) as hour, COUNT(*) as count
      FROM api_request_logs
      WHERE created_at >= datetime('now', '-24 hours')
      GROUP BY hour
      ORDER BY hour
    `).all();

    const byMethod = db.prepare(`
      SELECT method, COUNT(*) as count
      FROM api_request_logs
      GROUP BY method
    `).all();

    const errorRate = db.prepare(`
      SELECT
        COUNT(CASE WHEN status_code >= 400 THEN 1 END) as errors,
        COUNT(*) as total
      FROM api_request_logs
    `).get();

    const topUsers = db.prepare(`
      SELECT u.name, COUNT(*) as request_count
      FROM api_request_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.user_id IS NOT NULL
      GROUP BY al.user_id
      ORDER BY request_count DESC
      LIMIT 10
    `).all();

    res.json({
      summary: {
        total: totalRequests,
        today: todayRequests,
        avg_response_ms: Math.round(avgResponseTime || 0),
        error_rate: errorRate.total > 0 ? Math.round((errorRate.errors / errorRate.total) * 100) : 0,
      },
      byEndpoint,
      byHour,
      byMethod,
      topUsers,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Uso de API keys
router.get('/keys', auth, adminOnly, (req, res) => {
  try {
    const keys = db.prepare(`
      SELECT ak.id, ak.name, ak.key_prefix, ak.created_at, ak.last_used,
        (SELECT COUNT(*) FROM api_request_logs WHERE api_key_id = ak.id) as usage_count
      FROM api_keys ak
      ORDER BY usage_count DESC
    `).all();
    res.json(keys);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;