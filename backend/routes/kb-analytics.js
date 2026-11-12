const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

// Analíticas del knowledge base
router.get('/overview', auth, (req, res) => {
  try {
    const overview = {
      total_articles: db.prepare('SELECT COUNT(*) as count FROM knowledge_base').get().count,
      total_views: db.prepare('SELECT SUM(views) as total FROM knowledge_base').get().total || 0,
      avg_rating: db.prepare('SELECT AVG(rating) as avg FROM knowledge_base WHERE rating IS NOT NULL').get().avg || 0,
      categories: db.prepare('SELECT category, COUNT(*) as count FROM knowledge_base GROUP BY category ORDER BY count DESC').all(),
      recent_articles: db.prepare('SELECT id, title, views, created_at FROM knowledge_base ORDER BY created_at DESC LIMIT 5').all(),
      popular_articles: db.prepare('SELECT id, title, views FROM knowledge_base ORDER BY views DESC LIMIT 5').all(),
    };
    res.json(overview);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
