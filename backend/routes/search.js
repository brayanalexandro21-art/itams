const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth } = require('../middleware/auth');

// Global search
router.get('/', auth, (req, res) => {
  try {
    const { q, type, limit } = req.query;
    const searchTerm = `%${q}%`;
    const results = { tickets: [], assets: [], articles: [], users: [] };

    if (!q || q.length < 2) {
      return res.json(results);
    }

    const maxResults = parseInt(limit) || 10;

    // Search tickets
    if (!type || type === 'tickets') {
      results.tickets = db.prepare(`
        SELECT t.id, t.title, t.status, t.priority, 'ticket' as type
        FROM tickets t
        WHERE t.title LIKE ? OR t.description LIKE ? OR t.id = ?
        LIMIT ?
      `).all(searchTerm, searchTerm, q.replace('#', ''), maxResults);
    }

    // Search assets
    if (!type || type === 'assets') {
      results.assets = db.prepare(`
        SELECT a.id, a.name, a.type, a.serial_number, 'asset' as type
        FROM assets a
        WHERE a.name LIKE ? OR a.serial_number LIKE ? OR a.model LIKE ?
        LIMIT ?
      `).all(searchTerm, searchTerm, searchTerm, maxResults);
    }

    // Search knowledge base
    if (!type || type === 'articles') {
      results.articles = db.prepare(`
        SELECT kb.id, kb.title, kb.category, 'article' as type
        FROM knowledge_base kb
        WHERE kb.title LIKE ? OR kb.content LIKE ?
        LIMIT ?
      `).all(searchTerm, searchTerm, maxResults);
    }

    // Search users (admin only)
    if (type === 'users') {
      results.users = db.prepare(`
        SELECT u.id, u.name, u.email, u.role, 'user' as type
        FROM users u
        WHERE u.name LIKE ? OR u.email LIKE ?
        LIMIT ?
      `).all(searchTerm, searchTerm, maxResults);
    }

    // Total count
    results.total = 
      results.tickets.length + 
      results.assets.length + 
      results.articles.length + 
      results.users.length;

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search suggestions
router.get('/suggestions', auth, (req, res) => {
  try {
    const { q } = req.query;
    const searchTerm = `%${q}%`;

    if (!q || q.length < 2) {
      return res.json([]);
    }

    const suggestions = [];

    // Ticket suggestions
    const tickets = db.prepare(`
      SELECT id, title, 'ticket' as type
      FROM tickets
      WHERE title LIKE ?
      LIMIT 3
    `).all(searchTerm);
    suggestions.push(...tickets.map(t => ({ ...t, label: `#${t.id} ${t.title}` })));

    // Asset suggestions
    const assets = db.prepare(`
      SELECT id, name, 'asset' as type
      FROM assets
      WHERE name LIKE ?
      LIMIT 3
    `).all(searchTerm);
    suggestions.push(...assets.map(a => ({ ...a, label: a.name })));

    // Article suggestions
    const articles = db.prepare(`
      SELECT id, title, 'article' as type
      FROM knowledge_base
      WHERE title LIKE ?
      LIMIT 3
    `).all(searchTerm);
    suggestions.push(...articles.map(a => ({ ...a, label: a.title })));

    res.json(suggestions.slice(0, 10));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
