const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

// Operaciones masivas en tickets
router.post('/tickets/status', auth, adminOnly, (req, res) => {
  try {
    const { ticket_ids, status } = req.body;
    
    if (!ticket_ids || ticket_ids.length === 0) {
      return res.status(400).json({ error: 'No se seleccionaron tickets' });
    }

    const placeholders = ticket_ids.map(() => '?').join(',');
    const result = db.prepare(`
      UPDATE tickets SET status = ?, updated_at = datetime('now')
      WHERE id IN (${placeholders})
    `).run(status, ...ticket_ids);

    res.json({ 
      message: `${result.changes} tickets actualizados`,
      updated: result.changes 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Asignación masiva
router.post('/tickets/assign', auth, adminOnly, (req, res) => {
  try {
    const { ticket_ids, assigned_to } = req.body;
    
    if (!ticket_ids || ticket_ids.length === 0) {
      return res.status(400).json({ error: 'No se seleccionaron tickets' });
    }

    const placeholders = ticket_ids.map(() => '?').join(',');
    const result = db.prepare(`
      UPDATE tickets SET assigned_to = ?, updated_at = datetime('now')
      WHERE id IN (${placeholders})
    `).run(assigned_to, ...ticket_ids);

    res.json({ 
      message: `${result.changes} tickets asignados`,
      updated: result.changes 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminación masiva
router.post('/tickets/delete', auth, adminOnly, (req, res) => {
  try {
    const { ticket_ids } = req.body;
    
    if (!ticket_ids || ticket_ids.length === 0) {
      return res.status(400).json({ error: 'No se seleccionaron tickets' });
    }

    const placeholders = ticket_ids.map(() => '?').join(',');
    const result = db.prepare(`DELETE FROM tickets WHERE id IN (${placeholders})`).run(...ticket_ids);

    res.json({ 
      message: `${result.changes} tickets eliminados`,
      deleted: result.changes 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;