const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

// Listar plantillas de tickets
router.get('/', auth, (req, res) => {
  try {
    const templates = db.prepare('SELECT * FROM ticket_templates ORDER BY name').all();
    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener plantilla por ID
router.get('/:id', auth, (req, res) => {
  try {
    const template = db.prepare('SELECT * FROM ticket_templates WHERE id = ?').get(req.params.id);
    if (!template) return res.status(404).json({ error: 'Plantilla no encontrada' });
    template.custom_fields = JSON.parse(template.custom_fields || '[]');
    res.json(template);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear plantilla
router.post('/', auth, adminOnly, (req, res) => {
  try {
    const { name, description, category, priority, custom_fields } = req.body;
    const result = db.prepare(`
      INSERT INTO ticket_templates (name, template_title, description, template_category, template_priority, fields, created_by)
      VALUES (?1, ?1, ?2, ?3, ?4, ?5, ?6)
    `).run(name, description, category, priority || 'medium', JSON.stringify(custom_fields || []), req.user.id);
    res.json({ id: result.lastInsertRowid, name });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar plantilla
router.put('/:id', auth, adminOnly, (req, res) => {
  try {
    const { name, description, category, priority, custom_fields } = req.body;
    db.prepare(`
      UPDATE ticket_templates SET name = ?, description = ?, template_category = ?, template_priority = ?, fields = ?
      WHERE id = ?
    `).run(name, description, category, priority, JSON.stringify(custom_fields || []), req.params.id);
    res.json({ message: 'Plantilla actualizada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar plantilla
router.delete('/:id', auth, adminOnly, (req, res) => {
  try {
    db.prepare('DELETE FROM ticket_templates WHERE id = ?').run(req.params.id);
    res.json({ message: 'Plantilla eliminada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Duplicar plantilla
router.post('/:id/duplicate', auth, adminOnly, (req, res) => {
  try {
    const original = db.prepare('SELECT * FROM ticket_templates WHERE id = ?').get(req.params.id);
    if (!original) return res.status(404).json({ error: 'Plantilla no encontrada' });

    const result = db.prepare(`
      INSERT INTO ticket_templates (name, template_title, description, template_category, template_priority, fields, created_by)
      VALUES (?1, ?1, ?2, ?3, ?4, ?5, ?6)
    `).run(`${original.name} (copia)`, original.description, original.category, original.priority, original.custom_fields, req.user.id);
    res.json({ id: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear ticket desde plantilla
router.post('/:id/create-ticket', auth, (req, res) => {
  try {
    const template = db.prepare('SELECT * FROM ticket_templates WHERE id = ?').get(req.params.id);
    if (!template) return res.status(404).json({ error: 'Plantilla no encontrada' });

    const { title, description } = req.body;
    const result = db.prepare(`
      INSERT INTO tickets (title, description, priority, category, created_by, status)
      VALUES (?, ?, ?, ?, ?, 'open')
    `).run(title || template.name, description || template.description, template.priority, template.category, req.user.id);

    res.json({ id: result.lastInsertRowid, message: 'Ticket creado desde plantilla' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;