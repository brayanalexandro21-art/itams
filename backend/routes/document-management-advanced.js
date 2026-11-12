const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

// Gestión de documentos avanzada
router.get('/list', auth, (req, res) => {
  try {
    const { category, entity_type, entity_id } = req.query;
    let query = 'SELECT * FROM documents WHERE 1=1';
    const params = [];

    if (category) { query += ' AND category = ?'; params.push(category); }
    if (entity_type) { query += ' AND entity_type = ?'; params.push(entity_type); }
    if (entity_id) { query += ' AND entity_id = ?'; params.push(entity_id); }

    query += ' ORDER BY created_at DESC';
    const documents = db.prepare(query).all(...params);
    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Subir documento
router.post('/upload', auth, (req, res) => {
  try {
    const { name, category, entity_type, entity_id, description } = req.body;
    const result = db.prepare(
      "INSERT INTO documents (filename, original_name, path, category, entity_type, entity_id, description, uploaded_by) VALUES (?1, ?1, '', ?2, ?3, ?4, ?5, ?6)"
    ).run(name, category, entity_type, entity_id, description, req.user.id);
    res.json({ id: result.lastInsertRowid, name });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;