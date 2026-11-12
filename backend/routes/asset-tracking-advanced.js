const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

// Historial completo de activos
router.get('/:id/history', auth, (req, res) => {
  try {
    const history = db.prepare(`
      SELECT al.*, u.name as performed_by_name
      FROM asset_history al
      LEFT JOIN users u ON al.performed_by = u.id
      WHERE al.asset_id = ?
      ORDER BY al.created_at DESC
    `).all(req.params.id);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Agregar evento al historial
router.post('/:id/history', auth, (req, res) => {
  try {
    const { event_type, description, details } = req.body;
    const result = db.prepare(
      'INSERT INTO asset_history (asset_id, event_type, description, details, performed_by) VALUES (?, ?, ?, ?, ?)'
    ).run(req.params.id, event_type, description, details, req.user.id);
    res.json({ id: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mantenimiento programado
router.get('/maintenance/scheduled', auth, (req, res) => {
  try {
    const scheduled = db.prepare(`
      SELECT am.*, a.name as asset_name, a.location
      FROM asset_maintenance am
      JOIN assets a ON am.asset_id = a.id
      WHERE am.scheduled_date >= date('now')
      ORDER BY am.scheduled_date ASC
      LIMIT 20
    `).all();
    res.json(scheduled);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;