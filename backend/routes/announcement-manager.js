const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

// Obtener anuncios activos (para todos)
router.get('/active', auth, (req, res) => {
  try {
    const announcements = db.prepare(`
      SELECT id, title, message, type, priority, created_at
      FROM announcements
      WHERE active = 1 AND (expires_at IS NULL OR expires_at >= datetime('now'))
      ORDER BY priority DESC, created_at DESC
    `).all();
    res.json(announcements);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Listar todos los anuncios (admin)
router.get('/', auth, adminOnly, (req, res) => {
  try {
    const announcements = db.prepare('SELECT * FROM announcements ORDER BY created_at DESC').all();
    res.json(announcements);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear anuncio
router.post('/', auth, adminOnly, (req, res) => {
  try {
    const { title, message, type, priority, expires_at } = req.body;
    const result = db.prepare(`
      INSERT INTO announcements (title, message, type, priority, expires_at, active, created_by)
      VALUES (?, ?, ?, ?, ?, 1, ?)
    `).run(title, message, type || 'info', priority || 'normal', expires_at, req.user.id);
    res.json({ id: result.lastInsertRowid, title });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar anuncio
router.put('/:id', auth, adminOnly, (req, res) => {
  try {
    const { title, message, type, priority, expires_at, active } = req.body;
    db.prepare('UPDATE announcements SET title = ?, message = ?, type = ?, priority = ?, expires_at = ?, active = ? WHERE id = ?')
      .run(title, message, type, priority, expires_at, active ? 1 : 0, req.params.id);
    res.json({ message: 'Anuncio actualizado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar anuncio
router.delete('/:id', auth, adminOnly, (req, res) => {
  try {
    db.prepare('DELETE FROM announcements WHERE id = ?').run(req.params.id);
    res.json({ message: 'Anuncio eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;