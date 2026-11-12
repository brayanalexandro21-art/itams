const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

// Get all custom fields
router.get('/', auth, adminOnly, (req, res) => {
  try {
    const fields = db.prepare(`
      SELECT * FROM custom_fields ORDER BY entity_type, position
    `).all();
    res.json(fields);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get custom fields by entity type
router.get('/:entity_type', auth, (req, res) => {
  try {
    const fields = db.prepare(`
      SELECT * FROM custom_fields
      WHERE entity_type = ? AND active = 1
      ORDER BY position
    `).all(req.params.entity_type);
    res.json(fields);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create custom field
router.post('/', auth, adminOnly, (req, res) => {
  try {
    const { name, entity_type, field_type, required, options, position } = req.body;

    // Get max position
    const maxPos = db.prepare('SELECT MAX(position) as max FROM custom_fields WHERE entity_type = ?')
      .get(entity_type);
    const finalPosition = position ?? ((maxPos.max || -1) + 1);

    const result = db.prepare(`
      INSERT INTO custom_fields (name, entity_type, field_type, required, options, position)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(name, entity_type, field_type, required ? 1 : 0, JSON.stringify(options || []), finalPosition);

    const field = db.prepare('SELECT * FROM custom_fields WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(field);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update custom field
router.put('/:id', auth, adminOnly, (req, res) => {
  try {
    const { name, field_type, required, options, position, active } = req.body;

    db.prepare(`
      UPDATE custom_fields
      SET name = COALESCE(?, name),
          field_type = COALESCE(?, field_type),
          required = COALESCE(?, required),
          options = COALESCE(?, options),
          position = COALESCE(?, position),
          active = COALESCE(?, active),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      name,
      field_type,
      required !== undefined ? (required ? 1 : 0) : null,
      options ? JSON.stringify(options) : null,
      position,
      active !== undefined ? (active ? 1 : 0) : null,
      req.params.id
    );

    const field = db.prepare('SELECT * FROM custom_fields WHERE id = ?').get(req.params.id);
    res.json(field);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete custom field
router.delete('/:id', auth, adminOnly, (req, res) => {
  try {
    db.prepare('DELETE FROM custom_fields WHERE id = ?').run(req.params.id);
    res.json({ message: 'Custom field deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Save custom field values for entity
router.post('/values/:entity_type/:entity_id', auth, (req, res) => {
  try {
    const { entity_type, entity_id } = req.params;
    const { values } = req.body;

    const upsert = db.prepare(`
      INSERT INTO custom_field_values (entity_type, entity_id, field_id, value)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(entity_type, entity_id, field_id) DO UPDATE SET value = ?
    `);

    Object.entries(values).forEach(([field_id, value]) => {
      upsert.run(entity_type, entity_id, field_id, value, value);
    });

    res.json({ message: 'Values saved' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get custom field values for entity
router.get('/values/:entity_type/:entity_id', auth, (req, res) => {
  try {
    const { entity_type, entity_id } = req.params;

    const values = db.prepare(`
      SELECT cf.name, cf.field_type, cfv.value, cf.id as field_id
      FROM custom_field_values cfv
      JOIN custom_fields cf ON cfv.field_id = cf.id
      WHERE cfv.entity_type = ? AND cfv.entity_id = ?
    `).all(entity_type, entity_id);

    res.json(values);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
