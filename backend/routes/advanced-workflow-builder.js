const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

// Obtener nodos disponibles para workflows
router.get('/nodes', auth, (req, res) => {
  try {
    const nodes = {
      triggers: [
        { id: 'ticket_created', name: 'Ticket Creado', icon: '🎫', category: 'tickets' },
        { id: 'ticket_updated', name: 'Ticket Actualizado', icon: '✏️', category: 'tickets' },
        { id: 'ticket_assigned', name: 'Ticket Asignado', icon: '👤', category: 'tickets' },
        { id: 'asset_created', name: 'Activo Creado', icon: '💻', category: 'assets' },
        { id: 'scheduled', name: 'Programado', icon: '⏰', category: 'system' },
      ],
      conditions: [
        { id: 'priority_equals', name: 'Prioridad es', icon: '🔴', fields: ['critical', 'high', 'medium', 'low'] },
        { id: 'status_equals', name: 'Estado es', icon: '📋', fields: ['open', 'in_progress', 'resolved', 'closed'] },
        { id: 'category_equals', name: 'Categoría es', icon: '📁', dynamic: true },
      ],
      actions: [
        { id: 'assign_ticket', name: 'Asignar Ticket', icon: '👤', params: ['technician_id'] },
        { id: 'set_priority', name: 'Cambiar Prioridad', icon: '🔴', params: ['priority'] },
        { id: 'send_notification', name: 'Enviar Notificación', icon: '🔔', params: ['message', 'recipients'] },
        { id: 'add_comment', name: 'Agregar Comentario', icon: '💬', params: ['comment'] },
        { id: 'update_status', name: 'Actualizar Estado', icon: '📋', params: ['status'] },
      ]
    };
    res.json(nodes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Guardar workflow visual
router.post('/save', auth, adminOnly, (req, res) => {
  try {
    const { name, description, nodes, connections } = req.body;
    
    const result = db.prepare(`
      INSERT INTO visual_workflows (name, description, nodes, connections, created_by)
      VALUES (?, ?, ?, ?, ?)
    `).run(name, description, JSON.stringify(nodes), JSON.stringify(connections), req.user.id);

    res.json({ id: result.lastInsertRowid, name });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Ejecutar workflow
router.post('/execute/:id', auth, adminOnly, (req, res) => {
  try {
    const workflow = db.prepare('SELECT * FROM visual_workflows WHERE id = ?').get(req.params.id);
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow no encontrado' });
    }

    // Simular ejecución
    const execution = {
      workflow_id: workflow.id,
      status: 'completed',
      executed_at: new Date().toISOString(),
      steps_completed: JSON.parse(workflow.nodes || '[]').length,
    };

    res.json(execution);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;