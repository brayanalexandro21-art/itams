const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth } = require('../middleware/auth');

// Listar eventos del calendario
router.get('/', auth, (req, res) => {
  try {
    const { start_date, end_date, type } = req.query;
    let query = `
      SELECT ce.*, u.name as created_by_name
      FROM calendar_events ce
      LEFT JOIN users u ON ce.created_by = u.id
      WHERE 1=1
    `;
    const params = [];

    if (start_date) { query += ' AND ce.start_date >= ?'; params.push(start_date); }
    if (end_date) { query += ' AND ce.end_date <= ?'; params.push(end_date); }
    if (type) { query += ' AND ce.type = ?'; params.push(type); }

    query += ' ORDER BY ce.start_date ASC';
    const events = db.prepare(query).all(...params);
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener evento por ID
router.get('/:id', auth, (req, res) => {
  try {
    const event = db.prepare(`
      SELECT ce.*, u.name as created_by_name
      FROM calendar_events ce
      LEFT JOIN users u ON ce.created_by = u.id
      WHERE ce.id = ?
    `).get(req.params.id);
    if (!event) return res.status(404).json({ error: 'Evento no encontrado' });
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear evento
router.post('/', auth, (req, res) => {
  try {
    const { title, description, start_date, end_date, type, reminder } = req.body;
    const result = db.prepare(`
      INSERT INTO calendar_events (title, description, start_time, end_time, type, reminder, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(title, description, start_date, end_date, type || 'meeting', reminder || 0, req.user.id);
    res.json({ id: result.lastInsertRowid, title });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar evento
router.put('/:id', auth, (req, res) => {
  try {
    const { title, description, start_date, end_date, type, reminder } = req.body;
    db.prepare(`
      UPDATE calendar_events SET title = ?, description = ?, start_time = ?, end_time = ?, type = ?, reminder = ?
      WHERE id = ?
    `).run(title, description, start_date, end_date, type, reminder, req.params.id);
    res.json({ message: 'Evento actualizado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar evento
router.delete('/:id', auth, (req, res) => {
  try {
    db.prepare('DELETE FROM calendar_events WHERE id = ?').run(req.params.id);
    res.json({ message: 'Evento eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Eventos de esta semana
router.get('/this-week', auth, (req, res) => {
  try {
    const events = db.prepare(`
      SELECT * FROM calendar_events
      WHERE start_date >= date('now', 'weekday 1', '-7 days')
        AND start_date <= date('now', 'weekday 0')
      ORDER BY start_date
    `).all();
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;