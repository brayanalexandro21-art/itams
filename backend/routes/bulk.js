const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

// Bulk update tickets
router.post('/tickets/update', auth, adminOnly, (req, res) => {
  try {
    const { ticket_ids, updates } = req.body;

    if (!ticket_ids || ticket_ids.length === 0) {
      return res.status(400).json({ error: 'No tickets selected' });
    }

    const { status, priority, assigned_to, category } = updates;

    let query = 'UPDATE tickets SET updated_at = CURRENT_TIMESTAMP';
    const params = [];

    if (status) {
      query += ', status = ?';
      params.push(status);
    }
    if (priority) {
      query += ', priority = ?';
      params.push(priority);
    }
    if (assigned_to !== undefined) {
      query += ', assigned_to = ?';
      params.push(assigned_to);
    }
    if (category) {
      query += ', category = ?';
      params.push(category);
    }

    query += ` WHERE id IN (${ticket_ids.map(() => '?').join(',')})`;
    params.push(...ticket_ids);

    const result = db.prepare(query).run(...params);

    res.json({
      message: `${result.changes} tickets updated`,
      affected: result.changes,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bulk delete tickets
router.post('/tickets/delete', auth, adminOnly, (req, res) => {
  try {
    const { ticket_ids } = req.body;

    if (!ticket_ids || ticket_ids.length === 0) {
      return res.status(400).json({ error: 'No tickets selected' });
    }

    // Delete comments first
    db.prepare(`DELETE FROM ticket_comments WHERE ticket_id IN (${ticket_ids.map(() => '?').join(',')})`)
      .run(...ticket_ids);

    // Delete tickets
    const result = db.prepare(`DELETE FROM tickets WHERE id IN (${ticket_ids.map(() => '?').join(',')})`)
      .run(...ticket_ids);

    res.json({
      message: `${result.changes} tickets deleted`,
      affected: result.changes,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bulk assign tickets
router.post('/tickets/assign', auth, adminOnly, (req, res) => {
  try {
    const { ticket_ids, assigned_to } = req.body;

    if (!ticket_ids || ticket_ids.length === 0) {
      return res.status(400).json({ error: 'No tickets selected' });
    }

    const result = db.prepare(`
      UPDATE tickets SET assigned_to = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id IN (${ticket_ids.map(() => '?').join(',')})
    `).run(assigned_to, ...ticket_ids);

    // Notify assigned user
    if (assigned_to) {
      const insertNotif = db.prepare('INSERT INTO notifications (user_id, title, message, type, link) VALUES (?, ?, ?, ?, ?)');
      ticket_ids.forEach(ticketId => {
        insertNotif.run(
          assigned_to,
          'Tickets Assigned',
          `You have been assigned to ticket #${ticketId}`,
          'info',
          `/tickets/${ticketId}`
        );
      });
    }

    res.json({
      message: `${result.changes} tickets assigned`,
      affected: result.changes,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bulk update assets
router.post('/assets/update', auth, adminOnly, (req, res) => {
  try {
    const { asset_ids, updates } = req.body;

    if (!asset_ids || asset_ids.length === 0) {
      return res.status(400).json({ error: 'No assets selected' });
    }

    const { status, assigned_to, location } = updates;

    let query = 'UPDATE assets SET updated_at = CURRENT_TIMESTAMP';
    const params = [];

    if (status) {
      query += ', status = ?';
      params.push(status);
    }
    if (assigned_to !== undefined) {
      query += ', assigned_to = ?';
      params.push(assigned_to);
    }
    if (location) {
      query += ', location = ?';
      params.push(location);
    }

    query += ` WHERE id IN (${asset_ids.map(() => '?').join(',')})`;
    params.push(...asset_ids);

    const result = db.prepare(query).run(...params);

    res.json({
      message: `${result.changes} assets updated`,
      affected: result.changes,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bulk delete assets
router.post('/assets/delete', auth, adminOnly, (req, res) => {
  try {
    const { asset_ids } = req.body;

    if (!asset_ids || asset_ids.length === 0) {
      return res.status(400).json({ error: 'No assets selected' });
    }

    const result = db.prepare(`DELETE FROM assets WHERE id IN (${asset_ids.map(() => '?').join(',')})`)
      .run(...asset_ids);

    res.json({
      message: `${result.changes} assets deleted`,
      affected: result.changes,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bulk export
router.post('/export', auth, adminOnly, (req, res) => {
  try {
    const { entity_type, ids, format } = req.body;

    let data = [];

    switch (entity_type) {
      case 'tickets':
        data = db.prepare(`
          SELECT t.*, u1.name as created_by_name, u2.name as assigned_to_name
          FROM tickets t
          LEFT JOIN users u1 ON t.created_by = u1.id
          LEFT JOIN users u2 ON t.assigned_to = u2.id
          ${ids && ids.length > 0 ? `WHERE t.id IN (${ids.map(() => '?').join(',')})` : ''}
          ORDER BY t.created_at DESC
        `).all(...(ids || []));
        break;

      case 'assets':
        data = db.prepare(`
          SELECT a.*, u.name as assigned_to_name
          FROM assets a
          LEFT JOIN users u ON a.assigned_to = u.id
          ${ids && ids.length > 0 ? `WHERE a.id IN (${ids.map(() => '?').join(',')})` : ''}
          ORDER BY a.created_at DESC
        `).all(...(ids || []));
        break;

      default:
        return res.status(400).json({ error: 'Invalid entity type' });
    }

    if (format === 'csv') {
      if (data.length === 0) {
        return res.status(404).json({ error: 'No data to export' });
      }

      const headers = Object.keys(data[0]).join(',');
      const rows = data.map(row => Object.values(row).map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(','));
      const csv = [headers, ...rows].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${entity_type}_export.csv`);
      res.send(csv);
    } else {
      res.json(data);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
