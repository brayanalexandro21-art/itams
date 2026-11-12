const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

// Búsqueda semántica en KB
router.post('/semantic-search', auth, (req, res) => {
  try {
    const { query, category, limit = 10 } = req.body;
    
    // Búsqueda por palabras clave
    const words = query.toLowerCase().split(' ').filter(w => w.length > 2);
    const conditions = words.map(() => '(LOWER(title) LIKE ? OR LOWER(content) LIKE ?)').join(' OR ');
    const params = words.flatMap(w => [`%${w}%`, `%${w}%`]);

    let sql = `
      SELECT id, title, content, category, views, helpful,
        CASE
          ${words.map(w => `WHEN LOWER(title) LIKE '%${w}%' THEN 10`).join(' ')}
          WHEN LOWER(title) LIKE ? THEN 5
          ELSE 1
        END as relevance
      FROM knowledge_base
      WHERE (${conditions})
    `;

    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }

    sql += ` ORDER BY relevance DESC, views DESC LIMIT ?`;
    params.push(limit);

    const results = db.prepare(sql).all(...params);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Artículos relacionados
router.get('/:id/related', auth, (req, res) => {
  try {
    const article = db.prepare('SELECT * FROM knowledge_base WHERE id = ?').get(req.params.id);
    if (!article) return res.status(404).json({ error: 'Artículo no encontrado' });

    const related = db.prepare(`
      SELECT id, title, category, views
      FROM knowledge_base
      WHERE id != ? AND (category = ? OR content LIKE ?)
      ORDER BY views DESC
      LIMIT 5
    `).all(req.params.id, article.category, `%${article.title}%`);

    res.json(related);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;