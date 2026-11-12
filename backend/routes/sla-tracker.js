const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth } = require('../middleware/auth');

// Tracker de SLA por ticket
router.get('/ticket/:id', auth, (req, res) => {
  try {
    const ticket = db.prepare(`
      SELECT t.*, s.response_time_hours, s.resolution_time_hours, s.name as sla_name
      FROM tickets t
      LEFT JOIN slas s ON t.priority = s.priority AND s.active = 1
      WHERE t.id = ?
    `).get(req.params.id);

    if (!ticket) return res.status(404).json({ error: 'Ticket no encontrado' });

    const created = new Date(ticket.created_at);
    const now = new Date();
    const hoursElapsed = (now - created) / (1000 * 60 * 60);

    const responseDeadline = ticket.response_time_hours ? new Date(created.getTime() + ticket.response_time_hours * 3600000) : null;
    const resolutionDeadline = ticket.resolution_time_hours ? new Date(created.getTime() + ticket.resolution_time_hours * 3600000) : null;

    const responseStatus = responseDeadline ? (now > responseDeadline ? 'breached' : 'on_track') : 'no_sla';
    const resolutionStatus = resolutionDeadline ? (now > resolutionDeadline ? 'breached' : 'on_track') : 'no_sla';

    const responseRemaining = responseDeadline ? Math.max(0, (responseDeadline - now) / 3600000) : null;
    const resolutionRemaining = resolutionDeadline ? Math.max(0, (resolutionDeadline - now) / 3600000) : null;

    res.json({
      ticket_id: ticket.id,
      sla_name: ticket.sla_name,
      sla_met: ticket.sla_met,
      elapsed_hours: Math.round(hoursElapsed * 10) / 10,
      response: {
        deadline: responseDeadline?.toISOString(),
        status: responseStatus,
        remaining_hours: responseRemaining ? Math.round(responseRemaining * 10) / 10 : null,
      },
      resolution: {
        deadline: resolutionDeadline?.toISOString(),
        status: resolutionStatus,
        remaining_hours: resolutionRemaining ? Math.round(resolutionRemaining * 10) / 10 : null,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Tickets con SLA en riesgo
router.get('/at-risk', auth, (req, res) => {
  try {
    const tickets = db.prepare(`
      SELECT t.id, t.title, t.priority, t.status, t.created_at, t.sla_met,
        s.response_time_hours, s.resolution_time_hours
      FROM tickets t
      LEFT JOIN slas s ON t.priority = s.priority AND s.active = 1
      WHERE t.status NOT IN ('resolved', 'closed')
        AND t.sla_met != 1
      ORDER BY t.created_at ASC
      LIMIT 20
    `).all();
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;