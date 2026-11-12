const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

// Get all workflows
router.get('/', auth, adminOnly, (req, res) => {
  try {
    const workflows = db.prepare('SELECT * FROM workflows ORDER BY name').all();
    res.json(workflows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get workflow by ID
router.get('/:id', auth, adminOnly, (req, res) => {
  try {
    const workflow = db.prepare('SELECT * FROM workflows WHERE id = ?').get(req.params.id);
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }
    res.json(workflow);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create workflow
router.post('/', auth, adminOnly, (req, res) => {
  try {
    const { name, description, trigger, conditions, actions, active } = req.body;

    const result = db.prepare(`
      INSERT INTO workflows (name, description, trigger_event, conditions, actions, active)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      name,
      description,
      trigger,
      JSON.stringify(conditions || []),
      JSON.stringify(actions || []),
      active !== false ? 1 : 0
    );

    const workflow = db.prepare('SELECT * FROM workflows WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(workflow);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update workflow
router.put('/:id', auth, adminOnly, (req, res) => {
  try {
    const { name, description, trigger, conditions, actions, active } = req.body;

    db.prepare(`
      UPDATE workflows
      SET name = COALESCE(?, name),
          description = COALESCE(?, description),
          trigger_event = COALESCE(?, trigger_event),
          conditions = COALESCE(?, conditions),
          actions = COALESCE(?, actions),
          active = COALESCE(?, active),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      name,
      description,
      trigger,
      conditions ? JSON.stringify(conditions) : null,
      actions ? JSON.stringify(actions) : null,
      active,
      req.params.id
    );

    const workflow = db.prepare('SELECT * FROM workflows WHERE id = ?').get(req.params.id);
    res.json(workflow);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete workflow
router.delete('/:id', auth, adminOnly, (req, res) => {
  try {
    db.prepare('DELETE FROM workflows WHERE id = ?').run(req.params.id);
    res.json({ message: 'Workflow deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Execute workflow manually
router.post('/:id/execute', auth, adminOnly, (req, res) => {
  try {
    const workflow = db.prepare('SELECT * FROM workflows WHERE id = ?').get(req.params.id);
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    // Log workflow execution
    db.prepare(`
      INSERT INTO workflow_logs (workflow_id, status, triggered_by)
      VALUES (?, 'manual', ?)
    `).run(workflow.id, req.user.id);

    res.json({ message: 'Workflow executed', workflow: workflow.name });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get workflow logs
router.get('/:id/logs', auth, adminOnly, (req, res) => {
  try {
    const logs = db.prepare(`
      SELECT wl.*, u.name as triggered_by_name
      FROM workflow_logs wl
      LEFT JOIN users u ON wl.triggered_by = u.id
      WHERE wl.workflow_id = ?
      ORDER BY wl.executed_at DESC
      LIMIT 50
    `).all(req.params.id);

    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper function to execute workflow actions
function executeWorkflowActions(workflowId, context) {
  try {
    const workflow = db.prepare('SELECT * FROM workflows WHERE id = ? AND active = 1').get(workflowId);
    if (!workflow) return;

    const conditions = JSON.parse(workflow.conditions || '[]');
    const actions = JSON.parse(workflow.actions || '[]');

    // Check conditions
    const conditionsMet = conditions.every(condition => {
      switch (condition.field) {
        case 'priority':
          return evaluateCondition(context.priority, condition.operator, condition.value);
        case 'status':
          return evaluateCondition(context.status, condition.operator, condition.value);
        case 'category':
          return evaluateCondition(context.category, condition.operator, condition.value);
        default:
          return true;
      }
    });

    if (!conditionsMet) return;

    // Execute actions
    actions.forEach(action => {
      switch (action.type) {
        case 'assign':
          db.prepare('UPDATE tickets SET assigned_to = ? WHERE id = ?').run(action.value, context.ticketId);
          break;
        case 'set_priority':
          db.prepare('UPDATE tickets SET priority = ? WHERE id = ?').run(action.value, context.ticketId);
          break;
        case 'set_status':
          db.prepare('UPDATE tickets SET status = ? WHERE id = ?').run(action.value, context.ticketId);
          break;
        case 'add_comment':
          db.prepare('INSERT INTO ticket_comments (ticket_id, user_id, comment) VALUES (?, 0, ?)').run(context.ticketId, action.value);
          break;
        case 'notify':
          db.prepare('INSERT INTO notifications (user_id, title, message, type, link) VALUES (?, ?, ?, ?, ?)').run(
            action.userId || context.createdBy,
            action.title || 'Workflow Notification',
            action.message || 'A workflow was triggered',
            'info',
            `/tickets/${context.ticketId}`
          );
          break;
      }
    });

    // Log execution
    db.prepare(`
      INSERT INTO workflow_logs (workflow_id, status, context, triggered_by)
      VALUES (?, 'success', ?, ?)
    `).run(workflowId, JSON.stringify(context), context.userId || 0);

  } catch (error) {
    console.error('Workflow execution error:', error);
  }
}

function evaluateCondition(actual, operator, expected) {
  switch (operator) {
    case 'equals': return actual === expected;
    case 'not_equals': return actual !== expected;
    case 'contains': return actual?.includes(expected);
    case 'gt': return actual > expected;
    case 'lt': return actual < expected;
    default: return true;
  }
}

module.exports = router;
module.exports.executeWorkflowActions = executeWorkflowActions;
