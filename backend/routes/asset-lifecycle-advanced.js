const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

// Obtener historial de ciclo de vida del activo
router.get('/:assetId/lifecycle', auth, (req, res) => {
  try {
    const lifecycle = db.prepare(`
      SELECT * FROM asset_lifecycle 
      WHERE asset_id = ?
      ORDER BY event_date DESC
    `).all(req.params.assetId);
    res.json(lifecycle);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Agregar evento al ciclo de vida
router.post('/:assetId/lifecycle', auth, (req, res) => {
  try {
    const { event_type, description, event_date, performed_by } = req.body;
    const result = db.prepare(
      'INSERT INTO asset_lifecycle (asset_id, event_type, description, event_date, performed_by) VALUES (?, ?, ?, ?, ?)'
    ).run(req.params.assetId, event_type, description, event_date, req.user.id);
    res.json({ id: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener mantenimiento programado
router.get('/maintenance/scheduled', auth, (req, res) => {
  try {
    const maintenance = db.prepare(`
      SELECT am.*, a.name as asset_name, a.location
      FROM asset_maintenance am
      JOIN assets a ON am.asset_id = a.id
      WHERE am.scheduled_date >= date('now')
      ORDER BY am.scheduled_date ASC
      LIMIT 20
    `).all();
    res.json(maintenance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Programar mantenimiento
router.post('/maintenance', auth, (req, res) => {
  try {
    const { asset_id, type, description, scheduled_date, assigned_to } = req.body;
    const result = db.prepare(
      'INSERT INTO asset_maintenance (asset_id, type, description, scheduled_date, assigned_to, created_by) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(asset_id, type, description, scheduled_date, assigned_to, req.user.id);
    res.json({ id: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
