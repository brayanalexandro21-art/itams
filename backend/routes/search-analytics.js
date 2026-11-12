const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

// Get search analytics overview
router.get('/overview', auth, adminOnly, (req, res) => {
  try {
    const overview = {
      total_searches: db.prepare('SELECT COUNT(*) as count FROM search_logs').get().count,
      searches_today: db.prepare(`
        SELECT COUNT(*) as count FROM search_logs
        WHERE DATE(created_at) = DATE('now')
      `).get().count,
      avg_results_per_search: db.prepare(`
        SELECT AVG(results_count) as avg FROM search_logs
      `).get().avg || 0,
      zero_result_searches: db.prepare(`
        SELECT COUNT(*) as count FROM search_logs
        WHERE results_count = 0
      `).get().count,
      top_searches: db.prepare(`
        SELECT search_query, COUNT(*) as count, AVG(results_count) as avg_results
        FROM search_logs
        GROUP BY LOWER(search_query)
        ORDER BY count DESC
        LIMIT 10
      `).all(),
      recent_searches: db.prepare(`
        SELECT sl.*, u.name as user_name
        FROM search_logs sl
        LEFT JOIN users u ON sl.user_id = u.id
        ORDER BY sl.created_at DESC
        LIMIT 20
      `).all(),
    };

    res.json(overview);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get search trends
router.get('/trends', auth, adminOnly, (req, res) => {
  try {
    const { period = 'week' } = req.query;

    let timeFilter = '';
    switch (period) {
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

    const trends = db.prepare(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as search_count,
        AVG(results_count) as avg_results,
        SUM(CASE WHEN results_count = 0 THEN 1 ELSE 0 END) as zero_results
      FROM search_logs
      WHERE 1=1 ${timeFilter}
      GROUP BY DATE(created_at)
      ORDER BY date
    `).all();

    res.json(trends);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get search by entity type
router.get('/by-entity', auth, adminOnly, (req, res) => {
  try {
    const byEntity = db.prepare(`
      SELECT entity_type, COUNT(*) as count, AVG(results_count) as avg_results
      FROM search_logs
      GROUP BY entity_type
      ORDER BY count DESC
    `).all();

    res.json(byEntity);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get search by user
router.get('/by-user', auth, adminOnly, (req, res) => {
  try {
    const byUser = db.prepare(`
      SELECT u.id, u.name, u.email,
        COUNT(sl.id) as search_count,
        AVG(sl.results_count) as avg_results,
        MAX(sl.created_at) as last_search
      FROM search_logs sl
      JOIN users u ON sl.user_id = u.id
      GROUP BY sl.user_id
      ORDER BY search_count DESC
    `).all();

    res.json(byUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get failed searches (zero results)
router.get('/failed', auth, adminOnly, (req, res) => {
  try {
    const failed = db.prepare(`
      SELECT sl.*, u.name as user_name
      FROM search_logs sl
      LEFT JOIN users u ON sl.user_id = u.id
      WHERE sl.results_count = 0
      ORDER BY sl.created_at DESC
      LIMIT 50
    `).all();

    res.json(failed);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get search suggestions based on failed searches
router.get('/suggestions-from-failed', auth, adminOnly, (req, res) => {
  try {
    // Analyze failed searches to suggest new KB articles
    const failedSearches = db.prepare(`
      SELECT search_query, COUNT(*) as count
      FROM search_logs
      WHERE results_count = 0
      GROUP BY LOWER(search_query)
      ORDER BY count DESC
      LIMIT 20
    `).all();

    res.json(failedSearches);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
