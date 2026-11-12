const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth } = require('../middleware/auth');

// Portal del cliente - mis tickets
router.get('/my-tickets', auth, (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    let query = `
      SELECT t.id, t.title, t.description, t.status, t.priority, t.created_at,
        (SELECT content FROM ticket_comments WHERE ticket_id = t.id ORDER BY created_at DESC LIMIT 1) as last_comment
      FROM tickets t
      WHERE t.created_by = ?
    `;
    const params = [req.user.id];

    if (status) { query += ' AND t.status = ?'; params.push(status); }

    query += ' ORDER BY t.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, (page - 1) * limit);

    const tickets = db.prepare(query).all(...params);
    const total = db.prepare('SELECT COUNT(*) as count FROM tickets WHERE created_by = ?').get(req.user.id).count;

    res.json({ tickets, total });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Detalle de ticket del cliente
router.get('/my-tickets/:id', auth, (req, res) => {
  try {
    const ticket = db.prepare(`
      SELECT t.*, u.name as assigned_to_name
      FROM tickets t
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.id = ? AND t.created_by = ?
    `).get(req.params.id, req.user.id);

    if (!ticket) return res.status(404).json({ error: 'Ticket no encontrado' });

    const comments = db.prepare(`
      SELECT tc.*, u.name as user_name
      FROM ticket_comments tc
      JOIN users u ON tc.user_id = u.id
      WHERE tc.ticket_id = ?
      ORDER BY tc.created_at ASC
    `).all(req.params.id);

    res.json({ ticket, comments });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear ticket desde portal
router.post('/create-ticket', auth, (req, res) => {
  try {
    const { title, description, priority, category } = req.body;
    const result = db.prepare(`
      INSERT INTO tickets (title, description, priority, category, created_by, status, source)
      VALUES (?, ?, ?, ?, ?, 'open', 'portal')
    `).run(title, description, priority || 'medium', category, req.user.id);
    res.json({ id: result.lastInsertRowid, message: 'Ticket creado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Comentar en ticket
router.post('/my-tickets/:id/comment', auth, (req, res) => {
  try {
    const { content } = req.body;
    const result = db.prepare(`
      INSERT INTO ticket_comments (ticket_id, user_id, comment)
      VALUES (?, ?, ?)
    `).run(req.params.id, req.user.id, content);
    res.json({ id: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Estadísticas del portal
router.get('/stats', auth, (req, res) => {
  try {
    const stats = {
      total: db.prepare('SELECT COUNT(*) as c FROM tickets WHERE created_by = ?').get(req.user.id).c,
      open: db.prepare("SELECT COUNT(*) as c FROM tickets WHERE created_by = ? AND status = 'open'").get(req.user.id).c,
      in_progress: db.prepare("SELECT COUNT(*) as c FROM tickets WHERE created_by = ? AND status = 'in_progress'").get(req.user.id).c,
      resolved: db.prepare("SELECT COUNT(*) as c FROM tickets WHERE created_by = ? AND status = 'resolved'").get(req.user.id).c,
    };
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;