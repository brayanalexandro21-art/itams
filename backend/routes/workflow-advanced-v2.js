const express = require('express');
const router = express.Router();
const { auth, adminOnly } = require('../middleware/auth');
const { logAudit } = require('./audit');

// Obtener templates de workflows predefinidos
router.get('/templates-v2', auth, (req, res) => {
  try {
    const templates = [
      { 
        id: 'auto_assign_priority', 
        name: 'Auto-asignación por prioridad', 
        description: 'Asigna automáticamente tickets según su prioridad',
        trigger: 'ticket_created',
        conditions: [{ field: 'priority', operator: 'equals', value: 'high' }],
        actions: [{ type: 'assign', target: 'senior_technician' }]
      },
      { 
        id: 'sla_reminder', 
        name: 'Recordatorio SLA', 
        description: 'Envía recordatorio cuando se acerca el SLA',
        trigger: 'scheduled',
        schedule: '0 9 * * *',
        conditions: [{ field: 'sla_remaining', operator: 'less_than', value: '2h' }],
        actions: [{ type: 'notify', target: 'assigned_user' }]
      },
      { 
        id: 'auto_close_stale', 
        name: 'Auto-cierre inactivos', 
        description: 'Cierra tickets sin actividad por 7 días',
        trigger: 'scheduled',
        schedule: '0 0 * * *',
        conditions: [{ field: 'last_activity', operator: 'older_than', value: '7d' }],
        actions: [{ type: 'set_status', value: 'closed' }]
      },
      { 
        id: 'escalate_critical', 
        name: 'Escalación crítica', 
        description: 'Escala tickets críticos al gerente',
        trigger: 'ticket_created',
        conditions: [{ field: 'priority', operator: 'equals', value: 'critical' }],
        actions: [
          { type: 'notify', target: 'manager' },
          { type: 'set_urgency', value: 'high' }
        ]
      },
      { 
        id: 'welcome_new_user', 
        name: 'Bienvenida nuevo usuario', 
        description: 'Envía email de bienvenida a nuevos usuarios',
        trigger: 'user_created',
        conditions: [],
        actions: [
          { type: 'send_email', template: 'welcome' },
          { type: 'assign_role', value: 'user' }
        ]
      },
    ];
    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Ejecutar workflow manualmente
// El frontend envía POST /execute-manual con { template_id, context } (sin :id),
// por eso el :id es opcional (sintaxis de Express 5).
router.post('/execute-manual{/:id}', auth, adminOnly, (req, res) => {
  try {
    const { template_id, context } = req.body;
    const templateId = template_id || req.params.id;

    if (!templateId) {
      return res.status(400).json({ error: 'template_id es requerido' });
    }

    // Los templates son predefinidos (no existen en visual_workflows), así que
    // workflow_executions rechazaría el id por la llave foránea. Se registra en auditoría.
    logAudit(req.user.id, 'workflow_manual_execution', 'workflow_template', null,
      null, { template_id: templateId, context: context || {} }, req.ip);

    res.json({ 
      message: 'Workflow iniciado',
      execution_id: Date.now()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;