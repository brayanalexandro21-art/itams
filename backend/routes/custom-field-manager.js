const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

// Listar campos personalizados
router.get('/', auth, adminOnly, (req, res) => {
  try {
    const { entity } = req.query;
    let query = 'SELECT * FROM custom_fields';
    const params = [];
    if (entity) { query += ' WHERE entity_type = ?'; params.push(entity); }
    query += ' ORDER BY sort_order';
    const fields = db.prepare(query).all(...params);
    res.json(fields);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear campo personalizado
router.post('/', auth, adminOnly, (req, res) => {
  try {
    const { name, entity_type, field_type, options, required, sort_order } = req.body;
    const result = db.prepare(`
      INSERT INTO custom_fields (name, entity_type, field_type, options, required, position, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(name, entity_type, field_type || 'text', JSON.stringify(options || []), required ? 1 : 0, sort_order || 0, req.user.id);
    res.json({ id: result.lastInsertRowid, name });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar campo
router.put('/:id', auth, adminOnly, (req, res) => {
  try {
    const { name, field_type, options, required, sort_order } = req.body;
    db.prepare('UPDATE custom_fields SET name = ?, field_type = ?, options = ?, required = ?, position = ? WHERE id = ?')
      .run(name, field_type, JSON.stringify(options || []), required ? 1 : 0, sort_order || 0, req.params.id);
    res.json({ message: 'Campo actualizado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar campo
router.delete('/:id', auth, adminOnly, (req, res) => {
  try {
    db.prepare('DELETE FROM custom_field_values WHERE field_id = ?').run(req.params.id);
    db.prepare('DELETE FROM custom_fields WHERE id = ?').run(req.params.id);
    res.json({ message: 'Campo eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener valores de campos personalizados de una entidad
router.get('/values/:entity/:entityId', auth, (req, res) => {
  try {
    const values = db.prepare(`
      SELECT cfv.*, cf.name, cf.field_type, cf.options
      FROM custom_field_values cfv
      JOIN custom_fields cf ON cfv.field_id = cf.id
      WHERE cfv.entity_type = ? AND cfv.entity_id = ?
    `).all(req.params.entity, req.params.entityId);
    res.json(values);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Guardar valores de campos personalizados
router.post('/values/:entity/:entityId', auth, (req, res) => {
  try {
    const { values } = req.body;
    Object.entries(values).forEach(([fieldId, value]) => {
      db.prepare(`
        INSERT INTO custom_field_values (entity_type, entity_id, field_id, value, created_by)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(entity_type, entity_id, field_id) DO UPDATE SET value = ?
      `).run(req.params.entity, req.params.entityId, fieldId, value, req.user.id, value);
    });
    res.json({ message: 'Valores guardados' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Tipos de campo disponibles
router.get('/types', auth, (req, res) => {
  res.json([
    { type: 'text', name: 'Texto', icon: '📝' },
    { type: 'number', name: 'Número', icon: '🔢' },
    { type: 'date', name: 'Fecha', icon: '📅' },
    { type: 'select', name: 'Selección', icon: '📋' },
    { type: 'multiselect', name: 'Multi-selección', icon: '☑️' },
    { type: 'checkbox', name: 'Casilla', icon: '✅' },
    { type: 'textarea', name: 'Texto largo', icon: '📄' },
  ]);
});

module.exports = router;