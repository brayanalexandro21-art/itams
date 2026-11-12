const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth } = require('../middleware/auth');

// Búsqueda global avanzada
router.get('/global', auth, (req, res) => {
  try {
    const { q, type } = req.query;
    
    if (!q || q.length < 2) {
      return res.status(400).json({ error: 'Query debe tener al menos 2 caracteres' });
    }

    const results = {};
    const searchTerm = `%${q}%`;

    if (!type || type === 'tickets') {
      results.tickets = db.prepare(`
        SELECT id, title, status, priority, 'ticket' as type
        FROM tickets
        WHERE title LIKE ? OR description LIKE ?
        LIMIT 10
      `).all(searchTerm, searchTerm);
    }

    if (!type || type === 'assets') {
      results.assets = db.prepare(`
        SELECT id, name, type, serial_number, 'asset' as type
        FROM assets
        WHERE name LIKE ? OR serial_number LIKE ?
        LIMIT 10
      `).all(searchTerm, searchTerm);
    }

    if (!type || type === 'knowledge_base') {
      results.knowledge_base = db.prepare(`
        SELECT id, title, category, 'article' as type
        FROM knowledge_base
        WHERE title LIKE ? OR content LIKE ?
        LIMIT 10
      `).all(searchTerm, searchTerm);
    }

    const totalResults = Object.values(results).reduce((sum, arr) => sum + arr.length, 0);
    res.json({ results, total: totalResults });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Búsqueda guardada
router.get('/saved', auth, (req, res) => {
  try {
    const searches = db.prepare(`
      SELECT * FROM saved_searches WHERE user_id = ? ORDER BY created_at DESC
    `).all(req.user.id);
    res.json(searches);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/saved', auth, (req, res) => {
  try {
    const { name, query, filters } = req.body;
    const result = db.prepare(
      "INSERT INTO saved_searches (user_id, name, query, filters, entity) VALUES (?, ?, ?, ?, 'global')"
    ).run(req.user.id, name, query, JSON.stringify(filters));
    res.json({ id: result.lastInsertRowid, name });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;