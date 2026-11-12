const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

// Get all templates
router.get('/', auth, (req, res) => {
  try {
    const templates = db.prepare(`
      SELECT t.*, u.name as created_by_name
      FROM ticket_templates t
      LEFT JOIN users u ON t.created_by = u.id
      WHERE t.active = 1 OR t.created_by = ?
      ORDER BY t.name
    `).all(req.user.id);
    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get template by ID
router.get('/:id', auth, (req, res) => {
  try {
    const template = db.prepare(`
      SELECT t.*, u.name as created_by_name
      FROM ticket_templates t
      LEFT JOIN users u ON t.created_by = u.id
      WHERE t.id = ?
    `).get(req.params.id);

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json(template);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create template
router.post('/', auth, adminOnly, (req, res) => {
  try {
    const { name, description, title, description: ticketDescription, priority, category, fields } = req.body;

    const result = db.prepare(`
      INSERT INTO ticket_templates (name, description, template_title, template_description, template_priority, template_category, fields, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      name,
      description,
      title,
      ticketDescription,
      priority || 'medium',
      category,
      JSON.stringify(fields || []),
      req.user.id
    );

    const template = db.prepare('SELECT * FROM ticket_templates WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(template);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update template
router.put('/:id', auth, adminOnly, (req, res) => {
  try {
    const { name, description, title, description: ticketDescription, priority, category, fields, active } = req.body;

    db.prepare(`
      UPDATE ticket_templates
      SET name = COALESCE(?, name),
          description = COALESCE(?, description),
          template_title = COALESCE(?, template_title),
          template_description = COALESCE(?, template_description),
          template_priority = COALESCE(?, template_priority),
          template_category = COALESCE(?, template_category),
          fields = COALESCE(?, fields),
          active = COALESCE(?, active),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      name,
      description,
      title,
      ticketDescription,
      priority,
      category,
      fields ? JSON.stringify(fields) : null,
      active,
      req.params.id
    );

    const template = db.prepare('SELECT * FROM ticket_templates WHERE id = ?').get(req.params.id);
    res.json(template);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete template
router.delete('/:id', auth, adminOnly, (req, res) => {
  try {
    db.prepare('DELETE FROM ticket_templates WHERE id = ?').run(req.params.id);
    res.json({ message: 'Template deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Use template to create ticket
router.post('/:id/use', auth, (req, res) => {
  try {
    const template = db.prepare('SELECT * FROM ticket_templates WHERE id = ?').get(req.params.id);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Return template data for ticket creation
    res.json({
      title: template.template_title,
      description: template.template_description,
      priority: template.template_priority,
      category: template.template_category,
      fields: JSON.parse(template.fields || '[]'),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
