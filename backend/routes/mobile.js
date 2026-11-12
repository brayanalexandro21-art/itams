const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth } = require('../middleware/auth');

// Mobile-optimized endpoints

// Get dashboard summary (lightweight)
router.get('/dashboard', auth, (req, res) => {
  try {
    const userId = req.user.id;

    const summary = {
      myTickets: db.prepare(`
        SELECT COUNT(*) as count FROM tickets WHERE assigned_to = ? AND status NOT IN ('closed')
      `).get(userId).count,
      openTickets: db.prepare(`
        SELECT COUNT(*) as count FROM tickets WHERE status = 'open'
      `).get().count,
      unreadNotifications: db.prepare(`
        SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND read = 0
      `).get(userId).count,
      recentTickets: db.prepare(`
        SELECT t.id, t.title, t.status, t.priority, t.updated_at
        FROM tickets t
        ORDER BY t.updated_at DESC
        LIMIT 5
      `).all(),
    };

    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get tickets with pagination (mobile-optimized)
router.get('/tickets', auth, (req, res) => {
  try {
    const { page = 1, limit = 20, status, priority, search } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT t.id, t.title, t.status, t.priority, t.category, t.created_at, t.updated_at,
        u.name as assigned_to_name
      FROM tickets t
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE 1=1
    `;

    const params = [];

    if (status) {
      query += ' AND t.status = ?';
      params.push(status);
    }
    if (priority) {
      query += ' AND t.priority = ?';
      params.push(priority);
    }
    if (search) {
      query += ' AND (t.title LIKE ? OR t.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    const total = db.prepare(query.replace(/SELECT.*FROM/, 'SELECT COUNT(*) as count FROM').replace(/ORDER BY.*$/, '')).get(...params).count;

    query += ' ORDER BY t.updated_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const tickets = db.prepare(query).all(...params);

    res.json({
      tickets,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get ticket detail (mobile-optimized)
router.get('/tickets/:id', auth, (req, res) => {
  try {
    const ticket = db.prepare(`
      SELECT t.*, 
        u1.name as created_by_name,
        u2.name as assigned_to_name
      FROM tickets t
      LEFT JOIN users u1 ON t.created_by = u1.id
      LEFT JOIN users u2 ON t.assigned_to = u2.id
      WHERE t.id = ?
    `).get(req.params.id);

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const comments = db.prepare(`
      SELECT c.id, c.comment, c.created_at, u.name as user_name
      FROM ticket_comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.ticket_id = ?
      ORDER BY c.created_at DESC
      LIMIT 20
    `).all(req.params.id);

    res.json({ ticket, comments });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Quick actions (mobile-optimized)
router.post('/tickets/:id/status', auth, (req, res) => {
  try {
    const { status } = req.body;
    db.prepare('UPDATE tickets SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(status, req.params.id);
    res.json({ message: 'Status updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/tickets/:id/comment', auth, (req, res) => {
  try {
    const { comment } = req.body;
    db.prepare('INSERT INTO ticket_comments (ticket_id, user_id, comment) VALUES (?, ?, ?)')
      .run(req.params.id, req.user.id, comment);
    res.json({ message: 'Comment added' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get notifications (mobile-optimized)
router.get('/notifications', auth, (req, res) => {
  try {
    const notifications = db.prepare(`
      SELECT id, title, message, type, read, link, created_at
      FROM notifications
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 50
    `).all(req.user.id);

    const unreadCount = db.prepare(`
      SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND read = 0
    `).get(req.user.id).count;

    res.json({ notifications, unreadCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark notification as read
router.post('/notifications/:id/read', auth, (req, res) => {
  try {
    db.prepare('UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?')
      .run(req.params.id, req.user.id);
    res.json({ message: 'Marked as read' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get assets (mobile-optimized)
router.get('/assets', auth, (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT id, name, type, status, serial_number, location FROM assets WHERE 1=1';
    const params = [];

    if (search) {
      query += ' AND (name LIKE ? OR serial_number LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    const total = db.prepare(query.replace(/SELECT.*FROM/, 'SELECT COUNT(*) as count FROM')).get(...params).count;

    query += ' ORDER BY name LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const assets = db.prepare(query).all(...params);

    res.json({
      assets,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Scan barcode (mobile-optimized)
router.post('/scan', auth, (req, res) => {
  try {
    const { code } = req.body;

    let asset = null;

    // Try QR format
    try {
      const qrData = JSON.parse(code);
      if (qrData.type === 'ITAMS_ASSET') {
        asset = db.prepare('SELECT * FROM assets WHERE id = ?').get(qrData.id);
      }
    } catch (e) {
      // Try barcode format
      if (code.startsWith('ITAMS-')) {
        const id = parseInt(code.replace('ITAMS-', ''));
        asset = db.prepare('SELECT * FROM assets WHERE id = ?').get(id);
      }
    }

    if (asset) {
      res.json({ found: true, asset });
    } else {
      res.json({ found: false, message: 'Asset not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
