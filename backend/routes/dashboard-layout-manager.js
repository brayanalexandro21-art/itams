const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth } = require('../middleware/auth');

// Obtener layouts del usuario
router.get('/', auth, (req, res) => {
  try {
    const layouts = db.prepare('SELECT * FROM dashboard_layouts WHERE user_id = ? ORDER BY is_default DESC').all(req.user.id);
    res.json(layouts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear layout
router.post('/', auth, (req, res) => {
  try {
    const { name, layout_config, is_default } = req.body;
    if (is_default) {
      db.prepare('UPDATE dashboard_layouts SET is_default = 0 WHERE user_id = ?').run(req.user.id);
    }
    const result = db.prepare(`
      INSERT INTO dashboard_layouts (user_id, name, layout_config, is_default)
      VALUES (?, ?, ?, ?)
    `).run(req.user.id, name, JSON.stringify(layout_config || {}), is_default ? 1 : 0);
    res.json({ id: result.lastInsertRowid, name });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar layout
router.put('/:id', auth, (req, res) => {
  try {
    const { name, layout_config, is_default } = req.body;
    if (is_default) {
      db.prepare('UPDATE dashboard_layouts SET is_default = 0 WHERE user_id = ?').run(req.user.id);
    }
    db.prepare('UPDATE dashboard_layouts SET name = ?, layout_config = ?, is_default = ? WHERE id = ? AND user_id = ?')
      .run(name, JSON.stringify(layout_config), is_default ? 1 : 0, req.params.id, req.user.id);
    res.json({ message: 'Layout actualizado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar layout
router.delete('/:id', auth, (req, res) => {
  try {
    db.prepare('DELETE FROM dashboard_layouts WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
    res.json({ message: 'Layout eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Establecer como default
router.post('/:id/default', auth, (req, res) => {
  try {
    db.prepare('UPDATE dashboard_layouts SET is_default = 0 WHERE user_id = ?').run(req.user.id);
    db.prepare('UPDATE dashboard_layouts SET is_default = 1 WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
    res.json({ message: 'Layout establecido como predeterminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;