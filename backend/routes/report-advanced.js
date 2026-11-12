const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

// Reporte de rendimiento de técnicos
router.get('/technician-performance', auth, (req, res) => {
  try {
    const performance = db.prepare(`
      SELECT 
        u.id,
        u.name,
        COUNT(t.id) as tickets_assigned,
        SUM(CASE WHEN t.status = 'resolved' THEN 1 ELSE 0 END) as tickets_resolved,
        AVG(CASE WHEN t.status = 'resolved' 
          THEN julianday(t.resolved_at) - julianday(t.created_at) 
          ELSE NULL END) as avg_resolution_days
      FROM users u
      LEFT JOIN tickets t ON u.id = t.assigned_to
      WHERE u.role = 'technician'
      GROUP BY u.id
      ORDER BY tickets_resolved DESC
    `).all();
    res.json(performance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reporte de satisfacción del cliente
router.get('/satisfaction', auth, (req, res) => {
  try {
    const satisfaction = db.prepare(`
      SELECT 
        rating,
        COUNT(*) as count
      FROM ticket_ratings
      GROUP BY rating
      ORDER BY rating
    `).all();
    
    const average = db.prepare('SELECT AVG(rating) as avg FROM ticket_ratings').get();
    
    res.json({ ratings: satisfaction, average: average?.avg || 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reporte de uso de activos
router.get('/asset-usage', auth, (req, res) => {
  try {
    const usage = db.prepare(`
      SELECT 
        a.type,
        COUNT(*) as count,
        SUM(CASE WHEN a.status = 'in_use' THEN 1 ELSE 0 END) as in_use,
        SUM(CASE WHEN a.status = 'available' THEN 1 ELSE 0 END) as available
      FROM assets a
      GROUP BY a.type
    `).all();
    res.json(usage);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reporte de SLA
router.get('/sla-compliance', auth, (req, res) => {
  try {
    // Un ticket cumple el SLA si se resolvió dentro de resolution_time (en minutos)
    const compliance = db.prepare(`
      SELECT
        sla.name,
        COUNT(t.id) as total_tickets,
        SUM(CASE WHEN t.resolved_at IS NOT NULL
                  AND (julianday(t.resolved_at) - julianday(t.created_at)) * 1440 <= sla.resolution_time
             THEN 1 ELSE 0 END) as met,
        ROUND(SUM(CASE WHEN t.resolved_at IS NOT NULL
                  AND (julianday(t.resolved_at) - julianday(t.created_at)) * 1440 <= sla.resolution_time
             THEN 1.0 ELSE 0 END) / COUNT(t.id) * 100, 2) as compliance_rate
      FROM tickets t
      JOIN slas sla ON t.sla_id = sla.id
      GROUP BY sla.id
    `).all();
    res.json(compliance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
