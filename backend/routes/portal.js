const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth } = require('../middleware/auth');

// Client portal - submit ticket (public)
router.post('/tickets', (req, res) => {
  try {
    const { name, email, company, phone, subject, description, priority, category } = req.body;

    // Validate required fields
    if (!name || !email || !subject) {
      return res.status(400).json({ error: 'Name, email, and subject are required' });
    }

    // Find or create client user
    let user = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    
    if (!user) {
      const result = db.prepare(`
        INSERT INTO users (name, email, password, role, department)
        VALUES (?, ?, ?, 'client', ?)
      `).run(name, email, 'temp_password_' + Date.now(), company);
      
      user = { id: result.lastInsertRowid };
    }

    // Create ticket
    const ticketResult = db.prepare(`
      INSERT INTO tickets (title, description, priority, category, created_by, status, source)
      VALUES (?, ?, ?, ?, ?, 'open', 'portal')
    `).run(subject, description, priority || 'medium', category, user.id);

    const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(ticketResult.lastInsertRowid);

    // Send confirmation email (simulated)
    console.log(`[PORTAL] Ticket #${ticket.id} created by ${email}`);

    res.status(201).json({
      ticket_id: ticket.id,
      message: 'Your support request has been submitted successfully',
      reference: `TKT-${ticket.id.toString().padStart(6, '0')}`,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Client portal - track ticket
router.get('/track/:reference', (req, res) => {
  try {
    const reference = req.params.reference;
    const ticketId = parseInt(reference.replace('TKT-', ''));

    const ticket = db.prepare(`
      SELECT t.id, t.title, t.status, t.priority, t.created_at, t.updated_at,
        (SELECT comment FROM ticket_comments WHERE ticket_id = t.id ORDER BY created_at DESC LIMIT 1) as latest_update
      FROM tickets t
      WHERE t.id = ?
    `).get(ticketId);

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Get status history
    const history = db.prepare(`
      SELECT al.action, al.created_at, al.new_values
      FROM audit_logs al
      WHERE al.entity_type = 'ticket' AND al.entity_id = ?
      ORDER BY al.created_at DESC
      LIMIT 10
    `).all(ticketId);

    res.json({
      ticket: {
        reference: `TKT-${ticket.id.toString().padStart(6, '0')}`,
        title: ticket.title,
        status: ticket.status,
        priority: ticket.priority,
        created_at: ticket.created_at,
        updated_at: ticket.updated_at,
        latest_update: ticket.latest_update,
      },
      history,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Client portal - add update to ticket
router.post('/track/:reference/update', (req, res) => {
  try {
    const reference = req.params.reference;
    const ticketId = parseInt(reference.replace('TKT-', ''));
    const { comment, email } = req.body;

    const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(ticketId);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Find user by email
    const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (!user) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Add comment
    db.prepare(`
      INSERT INTO ticket_comments (ticket_id, user_id, comment)
      VALUES (?, ?, ?)
    `).run(ticketId, user.id, comment);

    res.json({ message: 'Update added successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get portal statistics (admin)
router.get('/stats', auth, (req, res) => {
  try {
    const stats = {
      total_tickets: db.prepare("SELECT COUNT(*) as count FROM tickets WHERE source = 'portal'").get().count,
      open_tickets: db.prepare("SELECT COUNT(*) as count FROM tickets WHERE source = 'portal' AND status = 'open'").get().count,
      resolved_tickets: db.prepare("SELECT COUNT(*) as count FROM tickets WHERE source = 'portal' AND status IN ('resolved', 'closed')").get().count,
      avg_response_time: db.prepare(`
        SELECT AVG(
          (julianday(first_response_at) - julianday(created_at)) * 24 * 60
        ) as avg_minutes
        FROM tickets
        WHERE source = 'portal' AND first_response_at IS NOT NULL
      `).get().avg_minutes || 0,
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
