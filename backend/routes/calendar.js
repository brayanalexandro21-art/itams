const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth } = require('../middleware/auth');

// Get calendar events
router.get('/events', auth, (req, res) => {
  try {
    const { start, end, type } = req.query;

    let events = [];

    // Get tickets as events
    if (!type || type === 'tickets') {
      const ticketEvents = db.prepare(`
        SELECT 
          t.id,
          t.title,
          t.status,
          t.priority,
          t.created_at as start,
          t.updated_at as end,
          'ticket' as type,
          u.name as assigned_to_name
        FROM tickets t
        LEFT JOIN users u ON t.assigned_to = u.id
        WHERE t.status NOT IN ('closed')
        ${start ? 'AND t.created_at >= ?' : ''}
        ${end ? 'AND t.created_at <= ?' : ''}
        ORDER BY t.created_at
      `).all(...[start, end].filter(Boolean));

      events.push(...ticketEvents.map(t => ({
        id: `ticket-${t.id}`,
        title: `#${t.id} ${t.title}`,
        start: t.start,
        end: t.end,
        color: getPriorityColor(t.priority),
        type: 'ticket',
        data: t,
      })));
    }

    // Get SLA deadlines
    if (!type || type === 'sla') {
      const slaEvents = db.prepare(`
        SELECT 
          t.id as ticket_id,
          t.title,
          t.priority,
          t.created_at,
          s.response_time,
          s.resolution_time,
          datetime(t.created_at, '+' || s.response_time || ' minutes') as response_deadline,
          datetime(t.created_at, '+' || s.resolution_time || ' minutes') as resolution_deadline
        FROM tickets t
        LEFT JOIN slas s ON t.sla_id = s.id
        WHERE t.status IN ('open', 'in_progress') AND t.sla_id IS NOT NULL
      `).all();

      slaEvents.forEach(sla => {
        events.push({
          id: `sla-response-${sla.ticket_id}`,
          title: `SLA Response: #${sla.ticket_id}`,
          start: sla.response_deadline,
          color: '#f59e0b',
          type: 'sla',
        });
        events.push({
          id: `sla-resolution-${sla.ticket_id}`,
          title: `SLA Resolution: #${sla.ticket_id}`,
          start: sla.resolution_deadline,
          color: '#ef4444',
          type: 'sla',
        });
      });
    }

    // Get scheduled maintenance (from assets)
    if (!type || type === 'maintenance') {
      const maintenanceEvents = db.prepare(`
        SELECT 
          a.id,
          a.name,
          a.warranty_expiry,
          'maintenance' as type
        FROM assets a
        WHERE a.warranty_expiry IS NOT NULL
        ${start ? 'AND a.warranty_expiry >= ?' : ''}
        ${end ? 'AND a.warranty_expiry <= ?' : ''}
      `).all(...[start, end].filter(Boolean));

      events.push(...maintenanceEvents.map(m => ({
        id: `maintenance-${m.id}`,
        title: `Warranty Expiry: ${m.name}`,
        start: m.warranty_expiry,
        color: '#8b5cf6',
        type: 'maintenance',
      })));
    }

    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create calendar event
router.post('/events', auth, (req, res) => {
  try {
    const { title, description, start, end, type, related_ticket_id } = req.body;

    const result = db.prepare(`
      INSERT INTO calendar_events (title, description, start_time, end_time, type, related_ticket_id, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(title, description, start, end, type || 'custom', related_ticket_id, req.user.id);

    const event = db.prepare('SELECT * FROM calendar_events WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update calendar event
router.put('/events/:id', auth, (req, res) => {
  try {
    const { title, description, start, end } = req.body;

    db.prepare(`
      UPDATE calendar_events
      SET title = COALESCE(?, title),
          description = COALESCE(?, description),
          start_time = COALESCE(?, start_time),
          end_time = COALESCE(?, end_time),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(title, description, start, end, req.params.id);

    res.json({ message: 'Event updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete calendar event
router.delete('/events/:id', auth, (req, res) => {
  try {
    db.prepare('DELETE FROM calendar_events WHERE id = ? AND created_by = ?')
      .run(req.params.id, req.user.id);
    res.json({ message: 'Event deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

function getPriorityColor(priority) {
  const colors = {
    urgent: '#ef4444',
    high: '#f97316',
    medium: '#eab308',
    low: '#22c55e',
  };
  return colors[priority] || '#6b7280';
}

module.exports = router;
