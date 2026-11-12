const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

// Listar reportes programados
router.get('/', auth, (req, res) => {
  try {
    const reports = db.prepare(`
      SELECT * FROM custom_reports WHERE created_by = ? ORDER BY created_at DESC
    `).all(req.user.id);
    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear reporte programado
router.post('/', auth, (req, res) => {
  try {
    const { name, description, type, schedule, filters, recipients } = req.body;
    const result = db.prepare(`
      INSERT INTO custom_reports (template_id, name, description, type, config, created_by)
      VALUES ('custom', ?, ?, ?, ?, ?)
    `).run(name, description, type || 'ticket_summary', JSON.stringify({ schedule, filters, recipients }), req.user.id);
    res.json({ id: result.lastInsertRowid, name });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener reporte
router.get('/:id', auth, (req, res) => {
  try {
    const report = db.prepare('SELECT * FROM custom_reports WHERE id = ? AND created_by = ?').get(req.params.id, req.user.id);
    if (!report) return res.status(404).json({ error: 'Reporte no encontrado' });
    const config = JSON.parse(report.config || '{}');
    res.json({ ...report, config });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar reporte
router.put('/:id', auth, (req, res) => {
  try {
    const { name, description, schedule, filters, recipients } = req.body;
    db.prepare('UPDATE custom_reports SET name = ?, description = ?, config = ? WHERE id = ? AND created_by = ?')
      .run(name, description, JSON.stringify({ schedule, filters, recipients }), req.params.id, req.user.id);
    res.json({ message: 'Reporte actualizado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar reporte
router.delete('/:id', auth, (req, res) => {
  try {
    db.prepare('DELETE FROM custom_reports WHERE id = ? AND created_by = ?').run(req.params.id, req.user.id);
    res.json({ message: 'Reporte eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Ejecutar reporte ahora
router.post('/:id/run', auth, (req, res) => {
  try {
    const report = db.prepare('SELECT * FROM custom_reports WHERE id = ?').get(req.params.id);
    if (!report) return res.status(404).json({ error: 'Reporte no encontrado' });

    let data = {};
    switch (report.type) {
      case 'ticket_summary':
        data = {
          total: db.prepare('SELECT COUNT(*) as c FROM tickets').get().c,
          open: db.prepare("SELECT COUNT(*) as c FROM tickets WHERE status='open'").get().c,
          by_priority: db.prepare('SELECT priority, COUNT(*) as count FROM tickets GROUP BY priority').all(),
        };
        break;
      case 'asset_inventory':
        data = {
          total: db.prepare('SELECT COUNT(*) as c FROM assets').get().c,
          by_type: db.prepare('SELECT type, COUNT(*) as count FROM assets GROUP BY type').all(),
        };
        break;
      case 'sla_compliance':
        data = {
          compliance: db.prepare("SELECT COUNT(CASE WHEN sla_met=1 THEN 1 END)*100.0/COUNT(*) as rate FROM tickets WHERE sla_met IS NOT NULL").get().rate,
        };
        break;
      default:
        data = {};
    }

    res.json({ report: report.name, type: report.type, generated_at: new Date().toISOString(), data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;