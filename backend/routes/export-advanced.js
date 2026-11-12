const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

// Exportar a CSV
router.get('/csv/:entity', auth, (req, res) => {
  try {
    const { entity } = req.params;
    let data;
    let filename;

    switch (entity) {
      case 'tickets':
        data = db.prepare(`
          SELECT t.id, t.title, t.status, t.priority, t.category, 
                 u1.name as created_by, u2.name as assigned_to, t.created_at
          FROM tickets t
          LEFT JOIN users u1 ON t.created_by = u1.id
          LEFT JOIN users u2 ON t.assigned_to = u2.id
        `).all();
        filename = 'tickets_export.csv';
        break;
      case 'assets':
        data = db.prepare('SELECT * FROM assets').all();
        filename = 'assets_export.csv';
        break;
      default:
        return res.status(400).json({ error: 'Entidad no válida' });
    }

    if (data.length === 0) {
      return res.status(404).json({ error: 'No hay datos para exportar' });
    }

    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).map(v => `"${v}"`).join(',')).join('\n');
    const csv = `${headers}\n${rows}`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
