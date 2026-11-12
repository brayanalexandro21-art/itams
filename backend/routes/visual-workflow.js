const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

// Get workflow templates
router.get('/templates', auth, (req, res) => {
  try {
    const templates = [
      {
        id: 'auto_assign',
        name: 'Auto-assign by Category',
        description: 'Automatically assign tickets based on category',
        trigger: 'ticket_created',
        conditions: [{ field: 'category', operator: 'equals', value: 'hardware' }],
        actions: [{ type: 'assign', value: 'technician_group_hardware' }],
        icon: '🔄',
      },
      {
        id: 'priority_escalation',
        name: 'Priority Escalation',
        description: 'Escalate urgent tickets to manager',
        trigger: 'ticket_created',
        conditions: [{ field: 'priority', operator: 'equals', value: 'urgent' }],
        actions: [
          { type: 'set_priority', value: 'urgent' },
          { type: 'notify', value: 'manager' },
        ],
        icon: '🚨',
      },
      {
        id: 'auto_resolve',
        name: 'Auto-resolve Stale Tickets',
        description: 'Resolve tickets with no activity for 7 days',
        trigger: 'scheduled',
        conditions: [{ field: 'last_activity', operator: 'older_than', value: '7d' }],
        actions: [
          { type: 'set_status', value: 'resolved' },
          { type: 'add_comment', value: 'Auto-resolved due to inactivity' },
        ],
        icon: '⏰',
      },
      {
        id: 'sla_notification',
        name: 'SLA Breach Notification',
        description: 'Notify when SLA is about to breach',
        trigger: 'sla_warning',
        conditions: [],
        actions: [
          { type: 'notify', value: 'assigned_user' },
          { type: 'set_priority', value: 'high' },
        ],
        icon: '⚠️',
      },
      {
        id: 'welcome_new_user',
        name: 'Welcome New User',
        description: 'Send welcome email to new users',
        trigger: 'user_created',
        conditions: [],
        actions: [
          { type: 'send_email', value: 'welcome_template' },
          { type: 'assign_role', value: 'user' },
        ],
        icon: '👋',
      },
    ];

    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get workflow builder nodes
router.get('/nodes', auth, (req, res) => {
  try {
    const nodes = {
      triggers: [
        { id: 'ticket_created', label: 'Ticket Created', icon: '🎫', category: 'tickets' },
        { id: 'ticket_updated', label: 'Ticket Updated', icon: '✏️', category: 'tickets' },
        { id: 'ticket_assigned', label: 'Ticket Assigned', icon: '👤', category: 'tickets' },
        { id: 'ticket_resolved', label: 'Ticket Resolved', icon: '✅', category: 'tickets' },
        { id: 'asset_created', label: 'Asset Created', icon: '💻', category: 'assets' },
        { id: 'asset_maintenance_due', label: 'Maintenance Due', icon: '🔧', category: 'assets' },
        { id: 'sla_warning', label: 'SLA Warning', icon: '⚠️', category: 'sla' },
        { id: 'sla_breach', label: 'SLA Breach', icon: '🚨', category: 'sla' },
        { id: 'user_created', label: 'User Created', icon: '👤', category: 'users' },
        { id: 'scheduled', label: 'Scheduled', icon: '⏰', category: 'system' },
      ],
      conditions: [
        { id: 'equals', label: 'Equals', icon: '=', type: 'comparison' },
        { id: 'not_equals', label: 'Not Equals', icon: '≠', type: 'comparison' },
        { id: 'contains', label: 'Contains', icon: '⊂', type: 'comparison' },
        { id: 'greater_than', label: 'Greater Than', icon: '>', type: 'comparison' },
        { id: 'less_than', label: 'Less Than', icon: '<', type: 'comparison' },
        { id: 'and', label: 'AND', icon: '&&', type: 'logic' },
        { id: 'or', label: 'OR', icon: '||', type: 'logic' },
      ],
      actions: [
        { id: 'assign', label: 'Assign Ticket', icon: '👤', category: 'tickets' },
        { id: 'set_status', label: 'Set Status', icon: '📝', category: 'tickets' },
        { id: 'set_priority', label: 'Set Priority', icon: '🔴', category: 'tickets' },
        { id: 'add_comment', label: 'Add Comment', icon: '💬', category: 'tickets' },
        { id: 'notify', label: 'Send Notification', icon: '🔔', category: 'communication' },
        { id: 'send_email', label: 'Send Email', icon: '📧', category: 'communication' },
        { id: 'create_ticket', label: 'Create Ticket', icon: '➕', category: 'tickets' },
        { id: 'update_asset', label: 'Update Asset', icon: '💻', category: 'assets' },
        { id: 'webhook', label: 'Call Webhook', icon: '🔗', category: 'integration' },
        { id: 'wait', label: 'Wait', icon: '⏳', category: 'flow' },
      ],
    };

    res.json(nodes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Save visual workflow
router.post('/save', auth, adminOnly, (req, res) => {
  try {
    const { name, description, nodes, connections } = req.body;

    // Convert visual workflow to executable format
    const workflow = convertVisualToExecutable(nodes, connections);

    const result = db.prepare(`
      INSERT INTO visual_workflows (name, description, nodes, connections, executable, created_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      name,
      description,
      JSON.stringify(nodes),
      JSON.stringify(connections),
      JSON.stringify(workflow),
      req.user.id
    );

    res.status(201).json({ id: result.lastInsertRowid, message: 'Workflow saved' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get visual workflows
router.get('/', auth, adminOnly, (req, res) => {
  try {
    const workflows = db.prepare(`
      SELECT vw.*, u.name as created_by_name
      FROM visual_workflows vw
      LEFT JOIN users u ON vw.created_by = u.id
      ORDER BY vw.created_at DESC
    `).all();

    res.json(workflows.map(w => ({
      ...w,
      nodes: JSON.parse(w.nodes),
      connections: JSON.parse(w.connections),
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Execute visual workflow
router.post('/:id/execute', auth, adminOnly, (req, res) => {
  try {
    const workflow = db.prepare('SELECT * FROM visual_workflows WHERE id = ?').get(req.params.id);
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    const executable = JSON.parse(workflow.executable);

    // Log execution
    db.prepare(`
      INSERT INTO workflow_executions (workflow_id, status, triggered_by)
      VALUES (?, 'running', ?)
    `).run(workflow.id, req.user.id);

    // In production, execute the workflow steps
    console.log(`[WORKFLOW] Executing: ${workflow.name}`);

    res.json({ message: 'Workflow execution started', workflow_id: workflow.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete visual workflow
router.delete('/:id', auth, adminOnly, (req, res) => {
  try {
    db.prepare('DELETE FROM visual_workflows WHERE id = ?').run(req.params.id);
    res.json({ message: 'Workflow deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

function convertVisualToExecutable(nodes, connections) {
  // Convert visual nodes to executable format
  const executable = {
    trigger: null,
    steps: [],
  };

  // Find trigger node
  const triggerNode = nodes.find(n => n.type === 'trigger');
  if (triggerNode) {
    executable.trigger = triggerNode.data.event;
  }

  // Convert action nodes to steps
  const actionNodes = nodes.filter(n => n.type === 'action');
  actionNodes.forEach((node, index) => {
    executable.steps.push({
      order: index + 1,
      action: node.data.action,
      config: node.data.config || {},
    });
  });

  return executable;
}

module.exports = router;
