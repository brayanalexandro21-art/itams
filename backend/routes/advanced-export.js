const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

// Exportar a Excel (simulado como JSON estructurado)
router.post('/excel', auth, (req, res) => {
  try {
    const { entity, filters } = req.body;
    
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
        filename = 'tickets_report.xlsx';
        break;
      case 'assets':
        data = db.prepare('SELECT * FROM assets').all();
        filename = 'assets_report.xlsx';
        break;
      case 'contracts':
        data = db.prepare(`
          SELECT c.*, v.name as vendor_name
          FROM contracts c
          LEFT JOIN vendors v ON c.vendor_id = v.id
        `).all();
        filename = 'contracts_report.xlsx';
        break;
      default:
        return res.status(400).json({ error: 'Entidad no válida' });
    }

    // Simular estructura Excel
    const excelData = {
      filename,
      sheets: [{
        name: entity.charAt(0).toUpperCase() + entity.slice(1),
        data: data,
        headers: data.length > 0 ? Object.keys(data[0]) : [],
      }],
      metadata: {
        generated_at: new Date().toISOString(),
        total_records: data.length,
      }
    };

    res.json(excelData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Exportar a PDF (simulado)
router.post('/pdf', auth, (req, res) => {
  try {
    const { type, data } = req.body;
    
    const pdfData = {
      title: `Reporte ${type}`,
      generated_at: new Date().toISOString(),
      content: data || {},
      format: 'pdf',
    };

    res.json(pdfData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;