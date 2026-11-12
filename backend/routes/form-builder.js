const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

// Obtener formularios personalizados
router.get('/', auth, (req, res) => {
  try {
    const forms = db.prepare('SELECT * FROM custom_forms ORDER BY name').all();
    res.json(forms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear formulario personalizado
router.post('/', auth, adminOnly, (req, res) => {
  try {
    const { name, description, fields, entity_type } = req.body;
    const result = db.prepare(
      'INSERT INTO custom_forms (name, description, fields, entity_type, created_by) VALUES (?, ?, ?, ?, ?)'
    ).run(name, description, JSON.stringify(fields), entity_type, req.user.id);
    res.json({ id: result.lastInsertRowid, name });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener tipos de campos disponibles
router.get('/field-types', auth, (req, res) => {
  try {
    const fieldTypes = [
      { type: 'text', label: 'Texto', icon: '📝' },
      { type: 'textarea', label: 'Área de texto', icon: '📄' },
      { type: 'number', label: 'Número', icon: '🔢' },
      { type: 'email', label: 'Email', icon: '📧' },
      { type: 'date', label: 'Fecha', icon: '📅' },
      { type: 'select', label: 'Selección', icon: '📋' },
      { type: 'checkbox', label: 'Casilla', icon: '☑️' },
      { type: 'radio', label: 'Opción múltiple', icon: '🔘' },
    ];
    res.json(fieldTypes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;