const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

// Get all articles
router.get('/', auth, (req, res) => {
  try {
    const { category, search } = req.query;
    let query = `
      SELECT kb.*, u.name as author_name
      FROM knowledge_base kb
      LEFT JOIN users u ON kb.author_id = u.id
    `;

    const params = [];
    const conditions = [];

    if (category) {
      conditions.push('kb.category = ?');
      params.push(category);
    }
    if (search) {
      conditions.push('(kb.title LIKE ? OR kb.content LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY kb.created_at DESC';

    const articles = db.prepare(query).all(...params);
    res.json(articles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get article by ID
router.get('/:id', auth, (req, res) => {
  try {
    const article = db.prepare(`
      SELECT kb.*, u.name as author_name
      FROM knowledge_base kb
      LEFT JOIN users u ON kb.author_id = u.id
      WHERE kb.id = ?
    `).get(req.params.id);

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    // Increment views
    db.prepare('UPDATE knowledge_base SET views = views + 1 WHERE id = ?').run(req.params.id);

    // Get comments
    const comments = db.prepare(`
      SELECT c.*, u.name as user_name
      FROM kb_comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.article_id = ?
      ORDER BY c.created_at DESC
    `).all(req.params.id);

    res.json({ ...article, comments, views: article.views + 1 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create article
router.post('/', auth, (req, res) => {
  try {
    const { title, content, category } = req.body;

    const result = db.prepare(
      'INSERT INTO knowledge_base (title, content, category, author_id) VALUES (?, ?, ?, ?)'
    ).run(title, content, category, req.user.id);

    const article = db.prepare('SELECT * FROM knowledge_base WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(article);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update article
router.put('/:id', auth, (req, res) => {
  try {
    const { title, content, category } = req.body;

    db.prepare(`
      UPDATE knowledge_base
      SET title = COALESCE(?, title),
          content = COALESCE(?, content),
          category = COALESCE(?, category),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(title, content, category, req.params.id);

    const article = db.prepare('SELECT * FROM knowledge_base WHERE id = ?').get(req.params.id);
    res.json(article);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete article
router.delete('/:id', auth, (req, res) => {
  try {
    db.prepare('DELETE FROM kb_comments WHERE article_id = ?').run(req.params.id);
    db.prepare('DELETE FROM knowledge_base WHERE id = ?').run(req.params.id);
    res.json({ message: 'Article deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark article as helpful
router.post('/:id/helpful', auth, (req, res) => {
  try {
    db.prepare('UPDATE knowledge_base SET helpful = helpful + 1 WHERE id = ?').run(req.params.id);
    res.json({ message: 'Marked as helpful' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add comment to article
router.post('/:id/comments', auth, (req, res) => {
  try {
    const { comment } = req.body;

    const result = db.prepare(
      'INSERT INTO kb_comments (article_id, user_id, comment) VALUES (?, ?, ?)'
    ).run(req.params.id, req.user.id, comment);

    const newComment = db.prepare(`
      SELECT c.*, u.name as user_name
      FROM kb_comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json(newComment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get categories
router.get('/meta/categories', auth, (req, res) => {
  try {
    const categories = db.prepare(
      'SELECT DISTINCT category FROM knowledge_base WHERE category IS NOT NULL ORDER BY category'
    ).all();
    res.json(categories.map(c => c.category));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
