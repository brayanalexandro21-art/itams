const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth } = require('../middleware/auth');

// AI-powered search in knowledge base
router.post('/search', auth, (req, res) => {
  try {
    const { query, category, limit = 10 } = req.body;

    if (!query || query.length < 2) {
      return res.status(400).json({ error: 'Query must be at least 2 characters' });
    }

    // Simple AI search - in production, use vector embeddings
    const results = [];
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(' ').filter(w => w.length > 2);

    // Search in title and content
    let searchQuery = `
      SELECT kb.*, u.name as author_name,
        CASE
          WHEN LOWER(kb.title) LIKE ? THEN 10
          WHEN LOWER(kb.content) LIKE ? THEN 5
          ELSE 0
        END as title_match
      FROM knowledge_base kb
      LEFT JOIN users u ON kb.author_id = u.id
      WHERE 1=1
    `;

    const params = [`%${query}%`, `%${query}%`];

    if (category) {
      searchQuery += ' AND kb.category = ?';
      params.push(category);
    }

    searchQuery += ' ORDER BY title_match DESC, kb.views DESC LIMIT ?';
    params.push(parseInt(limit));

    const articles = db.prepare(searchQuery).all(...params);

    // Calculate relevance scores
    const scoredResults = articles.map(article => {
      let score = 0;
      const titleLower = article.title.toLowerCase();
      const contentLower = article.content.toLowerCase();

      // Exact match in title
      if (titleLower === queryLower) score += 100;
      // Title contains query
      else if (titleLower.includes(queryLower)) score += 50;

      // Word matching
      queryWords.forEach(word => {
        if (titleLower.includes(word)) score += 10;
        if (contentLower.includes(word)) score += 5;
      });

      // Boost popular articles
      score += Math.min(article.views / 100, 10);
      score += Math.min(article.helpful / 10, 5);

      return {
        ...article,
        relevance_score: score,
        excerpt: generateExcerpt(article.content, queryWords),
      };
    });

    // Sort by relevance
    scoredResults.sort((a, b) => b.relevance_score - a.relevance_score);

    // Get suggestions
    const suggestions = generateSuggestions(query, articles);

    res.json({
      results: scoredResults,
      suggestions,
      total: scoredResults.length,
      query,
    });
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

    // Find related articles by category and content similarity
    const related = db.prepare(`
      SELECT kb.*, u.name as author_name
      FROM knowledge_base kb
      LEFT JOIN users u ON kb.author_id = u.id
      WHERE kb.id != ? AND (
        kb.category = ? OR
        LOWER(kb.title) LIKE ? OR
        LOWER(kb.content) LIKE ?
      )
      ORDER BY kb.views DESC
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

// Get popular searches
router.get('/popular-searches', auth, (req, res) => {
  try {
    const searches = db.prepare(`
      SELECT search_query, COUNT(*) as count
      FROM kb_search_logs
      GROUP BY search_query
      ORDER BY count DESC
      LIMIT 10
    `).all();

    res.json(searches);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Log search query
router.post('/log-search', auth, (req, res) => {
  try {
    const { query, results_count } = req.body;

    db.prepare(`
      INSERT INTO kb_search_logs (user_id, search_query, results_count)
      VALUES (?, ?, ?)
    `).run(req.user.id, query, results_count);

    res.json({ message: 'Search logged' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get search suggestions
router.get('/suggestions', auth, (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.json([]);
    }

    const suggestions = db.prepare(`
      SELECT DISTINCT title
      FROM knowledge_base
      WHERE LOWER(title) LIKE ?
      ORDER BY views DESC
      LIMIT 5
    `).all(`%${q}%`);

    res.json(suggestions.map(s => s.title));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

function generateExcerpt(content, queryWords) {
  if (!content) return '';

  const contentLower = content.toLowerCase();
  let bestPosition = 0;

  // Find best position (where most query words appear)
  queryWords.forEach(word => {
    const pos = contentLower.indexOf(word);
    if (pos !== -1 && (bestPosition === 0 || Math.abs(pos - 100) < Math.abs(bestPosition - 100))) {
      bestPosition = pos;
    }
  });

  // Extract excerpt around best position
  const start = Math.max(0, bestPosition - 50);
  const end = Math.min(content.length, bestPosition + 150);
  let excerpt = content.substring(start, end);

  if (start > 0) excerpt = '...' + excerpt;
  if (end < content.length) excerpt += '...';

  return excerpt;
}

function generateSuggestions(query, articles) {
  const suggestions = [];

  // Get categories from results
  const categories = [...new Set(articles.map(a => a.category).filter(Boolean))];
  if (categories.length > 0) {
    suggestions.push({
      type: 'category',
      label: `Filter by: ${categories[0]}`,
      value: categories[0],
    });
  }

  // Get common words from results
  const words = {};
  articles.forEach(article => {
    article.title.split(' ').forEach(word => {
      if (word.length > 3 && !query.toLowerCase().includes(word.toLowerCase())) {
        words[word] = (words[word] || 0) + 1;
      }
    });
  });

  const topWords = Object.entries(words)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([word]) => word);

  topWords.forEach(word => {
    suggestions.push({
      type: 'keyword',
      label: `Try: ${word}`,
      value: word,
    });
  });

  return suggestions;
}

module.exports = router;
