const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

// Obtener workflows disponibles
router.get('/', auth, (req, res) => {
  try {
    const workflows = db.prepare('SELECT * FROM workflows ORDER BY name').all();
    res.json(workflows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear workflow
router.post('/', auth, adminOnly, (req, res) => {
  try {
    const { name, description, trigger, conditions, actions } = req.body;
    const result = db.prepare(
      'INSERT INTO workflows (name, description, trigger_event, conditions, actions, created_by) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(name, description, trigger, JSON.stringify(conditions), JSON.stringify(actions), req.user.id);
    res.json({ id: result.lastInsertRowid, name });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener templates de workflow
router.get('/templates', auth, (req, res) => {
  try {
    const templates = [
      { id: 'auto_assign', name: 'Auto-asignación por categoría', description: 'Asigna automáticamente tickets según categoría' },
      { id: 'sla_escalation', name: 'Escalación SLA', description: 'Escala tickets cuando se acerca el SLA' },
      { id: 'notify_manager', name: 'Notificar gerente', description: 'Envía notificación al gerente para tickets críticos' },
      { id: 'auto_close', name: 'Auto-cierre', description: 'Cierra tickets inactivos después de 7 días' },
    ];
    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
