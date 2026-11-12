const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

// Listar plantillas de email
router.get('/', auth, (req, res) => {
  try {
    const templates = db.prepare('SELECT * FROM email_templates ORDER BY name').all();
    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener plantilla por ID
router.get('/:id', auth, (req, res) => {
  try {
    const template = db.prepare('SELECT * FROM email_templates WHERE id = ?').get(req.params.id);
    if (!template) return res.status(404).json({ error: 'Plantilla no encontrada' });
    res.json(template);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear plantilla
router.post('/', auth, adminOnly, (req, res) => {
  try {
    const { name, subject, body, category } = req.body;
    const result = db.prepare(`
      INSERT INTO email_templates (name, subject, body, category, created_by)
      VALUES (?, ?, ?, ?, ?)
    `).run(name, subject, body, category || 'general', req.user.id);
    res.json({ id: result.lastInsertRowid, name });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar plantilla
router.put('/:id', auth, adminOnly, (req, res) => {
  try {
    const { name, subject, body, category } = req.body;
    db.prepare(`
      UPDATE email_templates SET name = ?, subject = ?, body = ?, category = ? WHERE id = ?
    `).run(name, subject, body, category, req.params.id);
    res.json({ message: 'Plantilla actualizada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar plantilla
router.delete('/:id', auth, adminOnly, (req, res) => {
  try {
    db.prepare('DELETE FROM email_templates WHERE id = ?').run(req.params.id);
    res.json({ message: 'Plantilla eliminada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Duplicar plantilla
router.post('/:id/duplicate', auth, adminOnly, (req, res) => {
  try {
    const original = db.prepare('SELECT * FROM email_templates WHERE id = ?').get(req.params.id);
    if (!original) return res.status(404).json({ error: 'Plantilla no encontrada' });

    const result = db.prepare(`
      INSERT INTO email_templates (name, subject, body, category, created_by)
      VALUES (?, ?, ?, ?, ?)
    `).run(`${original.name} (copia)`, original.subject, original.body, original.category, req.user.id);

    res.json({ id: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;