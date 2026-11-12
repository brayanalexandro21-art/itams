const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

// Búsqueda avanzada v2 con filtros complejos
router.post('/search-v2', auth, (req, res) => {
  try {
    const { query, filters, sort, page = 1, limit = 50 } = req.body;
    
    let sql = '';
    const params = [];
    const conditions = [];

    if (filters.entity === 'tickets') {
      sql = `
        SELECT t.*, u1.name as created_by, u2.name as assigned_to
        FROM tickets t
        LEFT JOIN users u1 ON t.created_by = u1.id
        LEFT JOIN users u2 ON t.assigned_to = u2.id
        WHERE 1=1
      `;
    } else if (filters.entity === 'assets') {
      sql = `
        SELECT a.*, u.name as assigned_to
        FROM assets a
        LEFT JOIN users u ON a.assigned_to = u.id
        WHERE 1=1
      `;
    } else {
      return res.status(400).json({ error: 'Entidad no válida' });
    }

    // Aplicar filtros
    if (filters.status) { conditions.push('status = ?'); params.push(filters.status); }
    if (filters.priority) { conditions.push('priority = ?'); params.push(filters.priority); }
    if (filters.category) { conditions.push('category = ?'); params.push(filters.category); }
    if (filters.date_from) { conditions.push('created_at >= ?'); params.push(filters.date_from); }
    if (filters.date_to) { conditions.push('created_at <= ?'); params.push(filters.date_to); }

    if (conditions.length > 0) {
      sql += ' AND ' + conditions.join(' AND ');
    }

    // Búsqueda por texto
    if (query) {
      sql += ` AND (title LIKE ? OR description LIKE ?)`;
      params.push(`%${query}%`, `%${query}%`);
    }

    // Ordenamiento
    if (sort) {
      sql += ` ORDER BY ${sort.field} ${sort.order || 'DESC'}`;
    } else {
      sql += ' ORDER BY created_at DESC';
    }

    // Paginación
    sql += ` LIMIT ? OFFSET ?`;
    params.push(limit, (page - 1) * limit);

    const results = db.prepare(sql).all(...params);

    res.json({
      results,
      pagination: {
        page,
        limit,
        total: results.length,
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;