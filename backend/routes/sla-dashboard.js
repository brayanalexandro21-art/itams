const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

// Dashboard de SLA
router.get('/dashboard', auth, (req, res) => {
  try {
    const total = db.prepare("SELECT COUNT(*) as count FROM tickets WHERE sla_met IS NOT NULL").get().count;
    const met = db.prepare("SELECT COUNT(*) as count FROM tickets WHERE sla_met = 1").get().count;
    const breached = db.prepare("SELECT COUNT(*) as count FROM tickets WHERE sla_met = 0 AND status != 'closed'").get().count;

    const byPriority = db.prepare(`
      SELECT priority,
        COUNT(*) as total,
        SUM(CASE WHEN sla_met = 1 THEN 1 ELSE 0 END) as met,
        SUM(CASE WHEN sla_met = 0 THEN 1 ELSE 0 END) as breached
      FROM tickets WHERE sla_met IS NOT NULL
      GROUP BY priority
    `).all();

    const byTechnician = db.prepare(`
      SELECT u.name,
        COUNT(t.id) as total,
        SUM(CASE WHEN t.sla_met = 1 THEN 1 ELSE 0 END) as met,
        ROUND(SUM(CASE WHEN t.sla_met = 1 THEN 1.0 ELSE 0 END) / COUNT(t.id) * 100, 1) as compliance_rate
      FROM tickets t
      JOIN users u ON t.assigned_to = u.id
      WHERE t.sla_met IS NOT NULL
      GROUP BY u.id
      HAVING total > 0
      ORDER BY compliance_rate ASC
    `).all();

    const recentBreaches = db.prepare(`
      SELECT t.id, t.title, t.priority, t.created_at, u.name as assigned_to
      FROM tickets t
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.sla_met = 0
      ORDER BY t.created_at DESC
      LIMIT 10
    `).all();

    const avgResolution = db.prepare(`
      SELECT AVG(julianday(resolved_at) - julianday(created_at)) as avg_days
      FROM tickets WHERE status = 'resolved' AND resolved_at IS NOT NULL
    `).get();

    res.json({
      summary: {
        total,
        met,
        breached,
        compliance_rate: total > 0 ? Math.round((met / total) * 100) : 100,
      },
      byPriority,
      byTechnician,
      recentBreaches,
      avg_resolution_days: avgResolution?.avg_days ? Math.round(avgResolution.avg_days * 10) / 10 : 0,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Configurar SLA
router.get('/', auth, (req, res) => {
  try {
    const slas = db.prepare('SELECT * FROM slas ORDER BY name').all();
    res.json(slas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear SLA
router.post('/', auth, adminOnly, (req, res) => {
  try {
    const { name, priority, response_time, resolution_time } = req.body;
    const result = db.prepare(`
      INSERT INTO slas (name, priority, response_time, resolution_time, active)
      VALUES (?, ?, ROUND(? * 60), ROUND(? * 60), 1)
    `).run(name, priority, response_time, resolution_time);
    res.json({ id: result.lastInsertRowid, name });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar SLA
router.put('/:id', auth, adminOnly, (req, res) => {
  try {
    const { name, priority, response_time, resolution_time, active } = req.body;
    db.prepare('UPDATE slas SET name = ?, priority = ?, response_time = ROUND(? * 60), resolution_time = ROUND(? * 60), active = ? WHERE id = ?')
      .run(name, priority, response_time, resolution_time, active ? 1 : 0, req.params.id);
    res.json({ message: 'SLA actualizado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;