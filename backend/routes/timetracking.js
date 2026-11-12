const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth } = require('../middleware/auth');

// Start time tracking
router.post('/start', auth, (req, res) => {
  try {
    const { ticket_id, description } = req.body;

    // Check if already tracking for this ticket
    const active = db.prepare(
      'SELECT id FROM time_entries WHERE user_id = ? AND ticket_id = ? AND end_time IS NULL'
    ).get(req.user.id, ticket_id);

    if (active) {
      return res.status(400).json({ error: 'Already tracking time for this ticket' });
    }

    const result = db.prepare(`
      INSERT INTO time_entries (ticket_id, user_id, description, start_time)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `).run(ticket_id, req.user.id, description);

    res.status(201).json({
      id: result.lastInsertRowid,
      message: 'Time tracking started',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Stop time tracking
router.post('/stop', auth, (req, res) => {
  try {
    const { entry_id } = req.body;

    const entry = db.prepare(
      'SELECT * FROM time_entries WHERE id = ? AND user_id = ? AND end_time IS NULL'
    ).get(entry_id, req.user.id);

    if (!entry) {
      return res.status(404).json({ error: 'Active time entry not found' });
    }

    db.prepare(`
      UPDATE time_entries
      SET end_time = CURRENT_TIMESTAMP,
          duration = (julianday(CURRENT_TIMESTAMP) - julianday(start_time)) * 24 * 60
      WHERE id = ?
    `).run(entry_id);

    const updated = db.prepare('SELECT * FROM time_entries WHERE id = ?').get(entry_id);

    res.json({
      message: 'Time tracking stopped',
      duration: updated.duration,
      duration_formatted: formatDuration(updated.duration),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add manual time entry
router.post('/manual', auth, (req, res) => {
  try {
    const { ticket_id, description, duration_minutes, date } = req.body;

    const result = db.prepare(`
      INSERT INTO time_entries (ticket_id, user_id, description, start_time, end_time, duration)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      ticket_id,
      req.user.id,
      description,
      date || new Date().toISOString(),
      date || new Date().toISOString(),
      duration_minutes
    );

    res.status(201).json({
      id: result.lastInsertRowid,
      message: 'Time entry added',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get time entries for ticket
router.get('/ticket/:ticket_id', auth, (req, res) => {
  try {
    const entries = db.prepare(`
      SELECT te.*, u.name as user_name
      FROM time_entries te
      LEFT JOIN users u ON te.user_id = u.id
      WHERE te.ticket_id = ?
      ORDER BY te.start_time DESC
    `).all(req.params.ticket_id);

    const total_minutes = entries.reduce((sum, e) => sum + (e.duration || 0), 0);

    res.json({
      entries,
      total: total_minutes,
      total_formatted: formatDuration(total_minutes),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's time entries
router.get('/my', auth, (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    let query = `
      SELECT te.*, t.title as ticket_title
      FROM time_entries te
      LEFT JOIN tickets t ON te.ticket_id = t.id
      WHERE te.user_id = ?
    `;

    const params = [req.user.id];

    if (start_date) {
      query += ' AND te.start_time >= ?';
      params.push(start_date);
    }
    if (end_date) {
      query += ' AND te.start_time <= ?';
      params.push(end_date);
    }

    query += ' ORDER BY te.start_time DESC';

    const entries = db.prepare(query).all(...params);

    const total_minutes = entries.reduce((sum, e) => sum + (e.duration || 0), 0);

    res.json({
      entries,
      total: total_minutes,
      total_formatted: formatDuration(total_minutes),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get time report
router.get('/report', auth, (req, res) => {
  try {
    const { start_date, end_date, user_id } = req.query;

    let query = `
      SELECT 
        u.name as user_name,
        COUNT(te.id) as entry_count,
        SUM(te.duration) as total_minutes,
        AVG(te.duration) as avg_minutes
      FROM time_entries te
      LEFT JOIN users u ON te.user_id = u.id
      WHERE 1=1
    `;

    const params = [];

    if (user_id) {
      query += ' AND te.user_id = ?';
      params.push(user_id);
    }
    if (start_date) {
      query += ' AND te.start_time >= ?';
      params.push(start_date);
    }
    if (end_date) {
      query += ' AND te.start_time <= ?';
      params.push(end_date);
    }

    query += ' GROUP BY te.user_id ORDER BY total_minutes DESC';

    const report = db.prepare(query).all(...params);

    res.json(report.map(r => ({
      ...r,
      total_formatted: formatDuration(r.total_minutes || 0),
      avg_formatted: formatDuration(r.avg_minutes || 0),
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete time entry
router.delete('/:id', auth, (req, res) => {
  try {
    const entry = db.prepare('SELECT * FROM time_entries WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!entry) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    db.prepare('DELETE FROM time_entries WHERE id = ?').run(req.params.id);
    res.json({ message: 'Time entry deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

function formatDuration(minutes) {
  if (!minutes) return '0h 0m';
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return `${hours}h ${mins}m`;
}

module.exports = router;
