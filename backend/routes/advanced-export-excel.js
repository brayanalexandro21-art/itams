const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

// Exportar a Excel con formato avanzado
router.post('/excel-advanced', auth, (req, res) => {
  try {
    const { entity, filters, columns, format } = req.body;
    
    let data = [];
    let headers = [];

    switch (entity) {
      case 'tickets':
        const ticketQuery = `
          SELECT t.id, t.title, t.status, t.priority, t.category,
                 u1.name as created_by, u2.name as assigned_to, 
                 t.created_at, t.updated_at
          FROM tickets t
          LEFT JOIN users u1 ON t.created_by = u1.id
          LEFT JOIN users u2 ON t.assigned_to = u2.id
          ORDER BY t.created_at DESC
        `;
        data = db.prepare(ticketQuery).all();
        headers = ['ID', 'Título', 'Estado', 'Prioridad', 'Categoría', 'Creado por', 'Asignado a', 'Fecha creación', 'Fecha actualización'];
        break;
      case 'assets':
        data = db.prepare('SELECT * FROM assets ORDER BY name').all();
        headers = ['ID', 'Nombre', 'Tipo', 'Serial', 'Estado', 'Ubicación'];
        break;
      case 'knowledge_base':
        data = db.prepare(`
          SELECT kb.id, kb.title, kb.category, kb.views, kb.helpful, kb.created_at
          FROM knowledge_base kb
          ORDER BY kb.views DESC
        `).all();
        headers = ['ID', 'Título', 'Categoría', 'Vistas', 'Útil', 'Fecha'];
        break;
      default:
        return res.status(400).json({ error: 'Entidad no válida' });
    }

    const excelData = {
      filename: `${entity}_export_${Date.now()}.xlsx`,
      data,
      headers,
      metadata: {
        entity,
        total_records: data.length,
        generated_at: new Date().toISOString(),
        generated_by: req.user.id,
      }
    };

    res.json(excelData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;