const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

// Get all SLAs
router.get('/', auth, (req, res) => {
  try {
    const slas = db.prepare('SELECT * FROM slas ORDER BY name').all();
    res.json(slas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get SLA by ID
router.get('/:id', auth, (req, res) => {
  try {
    const sla = db.prepare('SELECT * FROM slas WHERE id = ?').get(req.params.id);
    if (!sla) {
      return res.status(404).json({ error: 'SLA not found' });
    }
    res.json(sla);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create SLA
router.post('/', auth, adminOnly, (req, res) => {
  try {
    const { name, description, response_time, resolution_time, priority, active } = req.body;

    const result = db.prepare(`
      INSERT INTO slas (name, description, response_time, resolution_time, priority, active)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(name, description, response_time, resolution_time, priority, active !== false ? 1 : 0);

    const sla = db.prepare('SELECT * FROM slas WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(sla);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update SLA
router.put('/:id', auth, adminOnly, (req, res) => {
  try {
    const { name, description, response_time, resolution_time, priority, active } = req.body;

    db.prepare(`
      UPDATE slas
      SET name = COALESCE(?, name),
          description = COALESCE(?, description),
          response_time = COALESCE(?, response_time),
          resolution_time = COALESCE(?, resolution_time),
          priority = COALESCE(?, priority),
          active = COALESCE(?, active),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(name, description, response_time, resolution_time, priority, active, req.params.id);

    const sla = db.prepare('SELECT * FROM slas WHERE id = ?').get(req.params.id);
    res.json(sla);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete SLA
router.delete('/:id', auth, adminOnly, (req, res) => {
  try {
    db.prepare('DELETE FROM slas WHERE id = ?').run(req.params.id);
    res.json({ message: 'SLA deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get SLA compliance report
router.get('/report/compliance', auth, (req, res) => {
  try {
    const report = db.prepare(`
      SELECT 
        s.id,
        s.name,
        s.response_time,
        s.resolution_time,
        COUNT(t.id) as total_tickets,
        SUM(CASE WHEN 
          (julianday(t.first_response_at) - julianday(t.created_at)) * 24 * 60 <= s.response_time 
          OR t.first_response_at IS NULL 
          THEN 0 ELSE 1 
        END) as response_breached,
        SUM(CASE WHEN 
          (julianday(t.resolved_at) - julianday(t.created_at)) * 24 * 60 <= s.resolution_time 
          OR t.resolved_at IS NULL 
          THEN 0 ELSE 1 
        END) as resolution_breached
      FROM slas s
      LEFT JOIN tickets t ON t.sla_id = s.id
      WHERE s.active = 1
      GROUP BY s.id
    `).all();

    const result = report.map(r => ({
      ...r,
      response_compliance: r.total_tickets > 0 
        ? ((r.total_tickets - r.response_breached) / r.total_tickets * 100).toFixed(2)
        : 100,
      resolution_compliance: r.total_tickets > 0
        ? ((r.total_tickets - r.resolution_breached) / r.total_tickets * 100).toFixed(2)
        : 100,
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
