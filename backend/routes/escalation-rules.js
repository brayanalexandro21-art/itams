const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

// Listar reglas de escalación
router.get('/', auth, adminOnly, (req, res) => {
  try {
    const rules = db.prepare('SELECT * FROM escalation_rules ORDER BY priority ASC').all();
    res.json(rules);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear regla de escalación
router.post('/', auth, adminOnly, (req, res) => {
  try {
    const { name, priority, trigger_condition, action_type, target_role, target_user, message, active } = req.body;
    const result = db.prepare(`
      INSERT INTO escalation_rules (name, priority, trigger_condition, action_type, target_role, target_user, message, active, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(name, priority || 0, trigger_condition, action_type, target_role, target_user, message, active !== false ? 1 : 0, req.user.id);
    res.json({ id: result.lastInsertRowid, name });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar regla
router.put('/:id', auth, adminOnly, (req, res) => {
  try {
    const { name, priority, trigger_condition, action_type, target_role, target_user, message, active } = req.body;
    db.prepare(`
      UPDATE escalation_rules SET name = ?, priority = ?, trigger_condition = ?, action_type = ?, target_role = ?, target_user = ?, message = ?, active = ?
      WHERE id = ?
    `).run(name, priority, trigger_condition, action_type, target_role, target_user, message, active ? 1 : 0, req.params.id);
    res.json({ message: 'Regla actualizada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar regla
router.delete('/:id', auth, adminOnly, (req, res) => {
  try {
    db.prepare('DELETE FROM escalation_rules WHERE id = ?').run(req.params.id);
    res.json({ message: 'Regla eliminada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle regla
router.post('/:id/toggle', auth, adminOnly, (req, res) => {
  try {
    const rule = db.prepare('SELECT active FROM escalation_rules WHERE id = ?').get(req.params.id);
    if (!rule) return res.status(404).json({ error: 'Regla no encontrada' });
    db.prepare('UPDATE escalation_rules SET active = ? WHERE id = ?').run(rule.active ? 0 : 1, req.params.id);
    res.json({ active: !rule.active });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verificar y ejecutar escalaciones pendientes
router.post('/process', auth, adminOnly, (req, res) => {
  try {
    const rules = db.prepare('SELECT * FROM escalation_rules WHERE active = 1 ORDER BY priority ASC').all();
    let escalated = 0;

    rules.forEach(rule => {
      try {
        const condition = JSON.parse(rule.trigger_condition || '{}');
        let query = 'SELECT id, title, assigned_to FROM tickets WHERE status NOT IN (\'resolved\', \'closed\')';
        const params = [];

        if (condition.priority) { query += ' AND priority = ?'; params.push(condition.priority); }
        if (condition.hours_open) {
          query += ` AND julianday('now') - julianday(created_at) > ?`;
          params.push(condition.hours_open);
        }
        if (condition.sla_breach) { query += ' AND sla_met = 0'; }

        const tickets = db.prepare(query).all(...params);

        tickets.forEach(ticket => {
          if (rule.action_type === 'notify') {
            const targetUserId = rule.target_user || ticket.assigned_to;
            if (targetUserId) {
              db.prepare('INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)')
                .run(targetUserId, `Escalación: Ticket #${ticket.id}`, rule.message || `Ticket #${ticket.id} requiere atención`, 'escalation');
              escalated++;
            }
          }
        });
      } catch (e) {}
    });

    res.json({ rules_evaluated: rules.length, tickets_escalated: escalated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;