const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

// Reporte ejecutivo
router.get('/executive', auth, (req, res) => {
  try {
    const executive = {
      summary: {
        total_tickets: db.prepare('SELECT COUNT(*) as count FROM tickets').get().count,
        total_assets: db.prepare('SELECT COUNT(*) as count FROM assets').get().count,
        total_users: db.prepare('SELECT COUNT(*) as count FROM users').get().count,
        sla_compliance: calculateSLACompliance(),
        avg_resolution_time: calculateAvgResolutionTime(),
      },
      trends: {
        tickets_this_week: db.prepare("SELECT COUNT(*) as count FROM tickets WHERE created_at >= date('now', '-7 days')").get().count,
        tickets_last_week: db.prepare("SELECT COUNT(*) as count FROM tickets WHERE created_at BETWEEN date('now', '-14 days') AND date('now', '-7 days')").get().count,
        growth_rate: 0,
      },
      alerts: getAlerts(),
    };

    // Calculate growth rate
    if (executive.trends.tickets_last_week > 0) {
      executive.trends.growth_rate = Math.round(
        ((executive.trends.tickets_this_week - executive.trends.tickets_last_week) / executive.trends.tickets_last_week) * 100
      );
    }

    res.json(executive);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reporte de rendimiento por técnico
router.get('/technician-performance', auth, (req, res) => {
  try {
    const performance = db.prepare(`
      SELECT 
        u.id, u.name, u.email,
        COUNT(t.id) as tickets_assigned,
        SUM(CASE WHEN t.status = 'resolved' THEN 1 ELSE 0 END) as tickets_resolved,
        AVG(CASE WHEN t.status = 'resolved' 
          THEN julianday(t.resolved_at) - julianday(t.created_at) 
          ELSE NULL END) as avg_resolution_days,
        ROUND(SUM(CASE WHEN t.status = 'resolved' THEN 1.0 ELSE 0 END) / COUNT(t.id) * 100, 2) as resolution_rate
      FROM users u
      LEFT JOIN tickets t ON u.id = t.assigned_to
      WHERE u.role IN ('technician', 'admin')
      GROUP BY u.id
      ORDER BY tickets_resolved DESC
    `).all();

    res.json(performance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reporte de satisfacción
router.get('/satisfaction', auth, (req, res) => {
  try {
    const satisfaction = db.prepare(`
      SELECT 
        rating,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM ticket_ratings), 2) as percentage
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

function calculateSLACompliance() {
  try {
    const result = db.prepare(`
      SELECT 
        COUNT(CASE WHEN sla_met = 1 THEN 1 END) as met,
        COUNT(*) as total
      FROM tickets WHERE sla_met IS NOT NULL
    `).get();
    return result.total > 0 ? Math.round((result.met / result.total) * 100) : 100;
  } catch (error) {
    return 0;
  }
}

function calculateAvgResolutionTime() {
  try {
    const result = db.prepare(`
      SELECT AVG(julianday(resolved_at) - julianday(created_at)) as avg_days
      FROM tickets WHERE status = 'resolved' AND resolved_at IS NOT NULL
    `).get();
    return result.avg_days ? Math.round(result.avg_days * 10) / 10 : 0;
  } catch (error) {
    return 0;
  }
}

function getAlerts() {
  const alerts = [];
  
  const highPriority = db.prepare("SELECT COUNT(*) as count FROM tickets WHERE priority = 'critical' AND status != 'closed'").get().count;
  if (highPriority > 0) alerts.push({ type: 'critical', message: `${highPriority} tickets críticos abiertos` });

  const slaBreaches = db.prepare("SELECT COUNT(*) as count FROM tickets WHERE sla_met = 0 AND status != 'closed'").get().count;
  if (slaBreaches > 0) alerts.push({ type: 'warning', message: `${slaBreaches} violaciones de SLA` });

  return alerts;
}

module.exports = router;