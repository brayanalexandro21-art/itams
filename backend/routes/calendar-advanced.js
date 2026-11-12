const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

// Obtener eventos del calendario
router.get('/events', auth, (req, res) => {
  try {
    const { start, end } = req.query;
    let query = 'SELECT * FROM calendar_events WHERE user_id = ?';
    const params = [req.user.id];

    if (start) {
      query += ' AND start_date >= ?';
      params.push(start);
    }
    if (end) {
      query += ' AND end_date <= ?';
      params.push(end);
    }

    query += ' ORDER BY start_date ASC';
    const events = db.prepare(query).all(...params);
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear evento
router.post('/events', auth, (req, res) => {
  try {
    const { title, description, start_date, end_date, all_day, color } = req.body;
    const result = db.prepare(
      'INSERT INTO calendar_events (user_id, title, description, start_time, end_time, all_day, color) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(req.user.id, title, description, start_date, end_date, all_day ? 1 : 0, color || '#4f46e5');
    res.json({ id: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Sincronizar con Google Calendar (placeholder)
router.post('/sync/google', auth, (req, res) => {
  try {
    res.json({ message: 'Sincronización con Google Calendar configurada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;