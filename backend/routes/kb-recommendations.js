const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth } = require('../middleware/auth');

// Get personalized recommendations
router.get('/personalized', auth, (req, res) => {
  try {
    const recommendations = [];

    // Based on user's ticket history
    const userTickets = db.prepare(`
      SELECT DISTINCT category FROM tickets
      WHERE created_by = ? OR assigned_to = ?
      AND category IS NOT NULL
      LIMIT 5
    `).all(req.user.id, req.user.id);

    if (userTickets.length > 0) {
      const categories = userTickets.map(t => t.category);
      const articles = db.prepare(`
        SELECT id, title, category, views, helpful
        FROM knowledge_base
        WHERE category IN (${categories.map(() => '?').join(',')})
        AND id NOT IN (
          SELECT article_id FROM kb_read_history WHERE user_id = ?
        )
        ORDER BY views DESC
        LIMIT 5
      `).all(...categories, req.user.id);

      if (articles.length > 0) {
        recommendations.push({
          type: 'category_based',
          title: 'Based on your ticket history',
          articles,
        });
      }
    }

    // Trending articles
    const trending = db.prepare(`
      SELECT id, title, category, views, helpful
      FROM knowledge_base
      WHERE views > 0
      ORDER BY views DESC
      LIMIT 5
    `).all();

    if (trending.length > 0) {
      recommendations.push({
        type: 'trending',
        title: 'Trending articles',
        articles: trending,
      });
    }

    // Recently updated
    const recent = db.prepare(`
      SELECT id, title, category, views, helpful, updated_at
      FROM knowledge_base
      WHERE updated_at >= DATE('now', '-7 days')
      ORDER BY updated_at DESC
      LIMIT 5
    `).all();

    if (recent.length > 0) {
      recommendations.push({
        type: 'recently_updated',
        title: 'Recently updated',
        articles: recent,
      });
    }

    res.json(recommendations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get related articles
router.get('/related/:articleId', auth, (req, res) => {
  try {
    const article = db.prepare('SELECT * FROM knowledge_base WHERE id = ?').get(req.params.articleId);
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    // Find related by category and content similarity
    const related = db.prepare(`
      SELECT id, title, category, views, helpful
      FROM knowledge_base
      WHERE id != ? AND (
        category = ?
        OR LOWER(title) LIKE ?
        OR LOWER(content) LIKE ?
      )
      ORDER BY views DESC
      LIMIT 5
    `).all(
      req.params.articleId,
      article.category,
      `%${article.title.split(' ')[0]}%`,
      `%${article.title.split(' ').slice(0, 2).join(' ')}%`
    );

    res.json(related);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get frequently viewed together
router.get('/frequently-viewed/:articleId', auth, (req, res) => {
  try {
    // Find articles viewed by users who also viewed this article
    const viewedTogether = db.prepare(`
      SELECT kb.id, kb.title, kb.category, COUNT(*) as view_count
      FROM kb_read_history krh1
      JOIN kb_read_history krh2 ON krh1.user_id = krh2.user_id AND krh1.article_id != krh2.article_id
      JOIN knowledge_base kb ON krh2.article_id = kb.id
      WHERE krh1.article_id = ?
      GROUP BY kb.id
      ORDER BY view_count DESC
      LIMIT 5
    `).all(req.params.articleId);

    res.json(viewedTogether);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get knowledge gaps (topics with few articles)
router.get('/gaps', auth, (req, res) => {
  try {
    const gaps = db.prepare(`
      SELECT category, COUNT(*) as article_count
      FROM knowledge_base
      GROUP BY category
      HAVING article_count < 3
      ORDER BY article_count ASC
    `).all();

    // Also get categories with no articles
    const allCategories = db.prepare(`
      SELECT DISTINCT category FROM tickets
      WHERE category IS NOT NULL
    `).all();

    const ticketCategories = allCategories.map(c => c.category);
    const kbCategories = db.prepare(`
      SELECT DISTINCT category FROM knowledge_base
      WHERE category IS NOT NULL
    `).all().map(c => c.category);

    const missingCategories = ticketCategories.filter(c => !kbCategories.includes(c));

    res.json({
      low_coverage: gaps,
      missing_categories: missingCategories,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Log article read
router.post('/read/:articleId', auth, (req, res) => {
  try {
    // Check if already read
    const existing = db.prepare(`
      SELECT id FROM kb_read_history
      WHERE user_id = ? AND article_id = ?
    `).get(req.user.id, req.params.articleId);

    if (!existing) {
      db.prepare(`
        INSERT INTO kb_read_history (user_id, article_id)
        VALUES (?, ?)
      `).run(req.user.id, req.params.articleId);
    }

    // Update read count
    db.prepare(`
      UPDATE kb_read_history
      SET read_count = read_count + 1, last_read_at = CURRENT_TIMESTAMP
      WHERE user_id = ? AND article_id = ?
    `).run(req.user.id, req.params.articleId);

    res.json({ message: 'Article read logged' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get reading history
router.get('/history', auth, (req, res) => {
  try {
    const history = db.prepare(`
      SELECT krh.*, kb.title, kb.category
      FROM kb_read_history krh
      JOIN knowledge_base kb ON krh.article_id = kb.id
      WHERE krh.user_id = ?
      ORDER BY krh.last_read_at DESC
      LIMIT 20
    `).all(req.user.id);

    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
