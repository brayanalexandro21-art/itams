const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth } = require('../middleware/auth');
const { createNotification } = require('./notifications');

// Get all tickets
router.get('/', auth, (req, res) => {
  try {
    const { status, priority, assigned_to, asset_id } = req.query;
    let query = `
      SELECT t.*,
        u1.name as created_by_name,
        u2.name as assigned_to_name,
        a.name as asset_name
      FROM tickets t
      LEFT JOIN users u1 ON t.created_by = u1.id
      LEFT JOIN users u2 ON t.assigned_to = u2.id
      LEFT JOIN assets a ON t.asset_id = a.id
    `;

    const params = [];
    const conditions = [];

    if (status) {
      conditions.push('t.status = ?');
      params.push(status);
    }
    if (priority) {
      conditions.push('t.priority = ?');
      params.push(priority);
    }
    if (assigned_to) {
      conditions.push('t.assigned_to = ?');
      params.push(assigned_to);
    }
    if (asset_id) {
      conditions.push('t.asset_id = ?');
      params.push(asset_id);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY t.created_at DESC';

    const tickets = db.prepare(query).all(...params);
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get ticket by ID
router.get('/:id', auth, (req, res) => {
  try {
    const ticket = db.prepare(`
      SELECT t.*,
        u1.name as created_by_name,
        u2.name as assigned_to_name,
        a.name as asset_name,
        a.serial_number as asset_serial,
        a.model as asset_model
      FROM tickets t
      LEFT JOIN users u1 ON t.created_by = u1.id
      LEFT JOIN users u2 ON t.assigned_to = u2.id
      LEFT JOIN assets a ON t.asset_id = a.id
      WHERE t.id = ?
    `).get(req.params.id);

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Get comments
    const comments = db.prepare(`
      SELECT c.*, u.name as user_name
      FROM ticket_comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.ticket_id = ?
      ORDER BY c.created_at DESC
    `).all(req.params.id);

    res.json({ ...ticket, comments });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create ticket
router.post('/', auth, (req, res) => {
  try {
    const { title, description, priority, category, asset_id } = req.body;

    const result = db.prepare(
      'INSERT INTO tickets (title, description, priority, category, created_by, asset_id) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(title, description, priority || 'medium', category, req.user.id, asset_id || null);

    const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(result.lastInsertRowid);

    // Notify admin about new ticket
    const admins = db.prepare("SELECT id FROM users WHERE role = 'admin'").all();
    admins.forEach(admin => {
      if (admin.id !== req.user.id) {
        createNotification(
          admin.id,
          'New Ticket Created',
          `Ticket #${ticket.id}: ${title}`,
          'info',
          `/tickets/${ticket.id}`
        );
      }
    });

    res.status(201).json(ticket);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update ticket
router.put('/:id', auth, (req, res) => {
  try {
    const { title, description, status, priority, assigned_to, asset_id } = req.body;
    const ticketId = req.params.id;

    // Get current ticket for comparison
    const currentTicket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(ticketId);

    db.prepare(`
      UPDATE tickets
      SET title = COALESCE(?, title),
          description = COALESCE(?, description),
          status = COALESCE(?, status),
          priority = COALESCE(?, priority),
          assigned_to = COALESCE(?, assigned_to),
          asset_id = COALESCE(?, asset_id),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(title, description, status, priority, assigned_to, asset_id, ticketId);

    const ticket = db.prepare(`
      SELECT t.*,
        u1.name as created_by_name,
        u2.name as assigned_to_name,
        a.name as asset_name
      FROM tickets t
      LEFT JOIN users u1 ON t.created_by = u1.id
      LEFT JOIN users u2 ON t.assigned_to = u2.id
      LEFT JOIN assets a ON t.asset_id = a.id
      WHERE t.id = ?
    `).get(ticketId);

    // Send notifications based on changes
    if (assigned_to && assigned_to !== currentTicket.assigned_to) {
      createNotification(
        assigned_to,
        'Ticket Assigned',
        `You have been assigned to ticket #${ticketId}: ${ticket.title}`,
        'info',
        `/tickets/${ticketId}`
      );
    }

    if (status && status !== currentTicket.status) {
      // Notify ticket creator about status change
      if (currentTicket.created_by !== req.user.id) {
        createNotification(
          currentTicket.created_by,
          'Ticket Status Updated',
          `Ticket #${ticketId} status changed to: ${status}`,
          'info',
          `/tickets/${ticketId}`
        );
      }
    }

    res.json(ticket);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add comment to ticket
router.post('/:id/comments', auth, (req, res) => {
  try {
    const { comment } = req.body;
    const ticketId = req.params.id;

    const result = db.prepare(
      'INSERT INTO ticket_comments (ticket_id, user_id, comment) VALUES (?, ?, ?)'
    ).run(ticketId, req.user.id, comment);

    const newComment = db.prepare(`
      SELECT c.*, u.name as user_name
      FROM ticket_comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `).get(result.lastInsertRowid);

    // Notify ticket creator and assignee about new comment
    const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(ticketId);
    const notifyUsers = new Set();

    if (ticket.created_by !== req.user.id) notifyUsers.add(ticket.created_by);
    if (ticket.assigned_to && ticket.assigned_to !== req.user.id) notifyUsers.add(ticket.assigned_to);

    notifyUsers.forEach(userId => {
      createNotification(
        userId,
        'New Comment on Ticket',
        `New comment on ticket #${ticketId}: ${ticket.title}`,
        'info',
        `/tickets/${ticketId}`
      );
    });

    res.status(201).json(newComment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete ticket
router.delete('/:id', auth, (req, res) => {
  try {
    db.prepare('DELETE FROM ticket_comments WHERE ticket_id = ?').run(req.params.id);
    db.prepare('DELETE FROM tickets WHERE id = ?').run(req.params.id);
    res.json({ message: 'Ticket deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get stats
router.get('/stats/summary', auth, (req, res) => {
  try {
    const stats = {
      total: db.prepare('SELECT COUNT(*) as count FROM tickets').get().count,
      open: db.prepare("SELECT COUNT(*) as count FROM tickets WHERE status = 'open'").get().count,
      inProgress: db.prepare("SELECT COUNT(*) as count FROM tickets WHERE status = 'in_progress'").get().count,
      resolved: db.prepare("SELECT COUNT(*) as count FROM tickets WHERE status = 'resolved'").get().count,
      closed: db.prepare("SELECT COUNT(*) as count FROM tickets WHERE status = 'closed'").get().count,
      unassigned: db.prepare("SELECT COUNT(*) as count FROM tickets WHERE assigned_to IS NULL AND status != 'closed'").get().count,
    };
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
