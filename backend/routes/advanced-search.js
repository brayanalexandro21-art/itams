const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth } = require('../middleware/auth');

// Advanced search with complex filters
router.post('/', auth, (req, res) => {
  try {
    const { entity, filters, sort, page = 1, limit = 50 } = req.body;
    const offset = (page - 1) * limit;

    let query = '';
    let countQuery = '';
    const params = [];

    switch (entity) {
      case 'tickets':
        query = `
          SELECT t.*, 
            u1.name as created_by_name,
            u2.name as assigned_to_name,
            a.name as asset_name
          FROM tickets t
          LEFT JOIN users u1 ON t.created_by = u1.id
          LEFT JOIN users u2 ON t.assigned_to = u2.id
          LEFT JOIN assets a ON t.asset_id = a.id
          WHERE 1=1
        `;
        countQuery = 'SELECT COUNT(*) as count FROM tickets t WHERE 1=1';
        break;

      case 'assets':
        query = `
          SELECT a.*, u.name as assigned_to_name
          FROM assets a
          LEFT JOIN users u ON a.assigned_to = u.id
          WHERE 1=1
        `;
        countQuery = 'SELECT COUNT(*) as count FROM assets a WHERE 1=1';
        break;

      case 'knowledge_base':
        query = `
          SELECT kb.*, u.name as author_name
          FROM knowledge_base kb
          LEFT JOIN users u ON kb.author_id = u.id
          WHERE 1=1
        `;
        countQuery = 'SELECT COUNT(*) as count FROM knowledge_base kb WHERE 1=1';
        break;

      case 'users':
        query = 'SELECT id, name, email, role, department, created_at FROM users WHERE 1=1';
        countQuery = 'SELECT COUNT(*) as count FROM users WHERE 1=1';
        break;

      default:
        return res.status(400).json({ error: 'Invalid entity type' });
    }

    // Apply filters
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value === null || value === undefined || value === '') return;

        if (typeof value === 'object' && value.operator) {
          // Advanced filter with operator
          switch (value.operator) {
            case 'contains':
              query += ` AND ${key} LIKE ?`;
              params.push(`%${value.value}%`);
              break;
            case 'equals':
              query += ` AND ${key} = ?`;
              params.push(value.value);
              break;
            case 'not_equals':
              query += ` AND ${key} != ?`;
              params.push(value.value);
              break;
            case 'greater_than':
              query += ` AND ${key} > ?`;
              params.push(value.value);
              break;
            case 'less_than':
              query += ` AND ${key} < ?`;
              params.push(value.value);
              break;
            case 'in':
              query += ` AND ${key} IN (${value.value.map(() => '?').join(',')})`;
              params.push(...value.value);
              break;
            case 'between':
              query += ` AND ${key} BETWEEN ? AND ?`;
              params.push(value.value[0], value.value[1]);
              break;
            case 'is_null':
              query += ` AND ${key} IS NULL`;
              break;
            case 'is_not_null':
              query += ` AND ${key} IS NOT NULL`;
              break;
          }
        } else {
          // Simple filter
          query += ` AND ${key} = ?`;
          params.push(value);
        }
      });
    }

    // Get total count
    const total = db.prepare(countQuery.replace(/SELECT.*FROM/, 'SELECT COUNT(*) as count FROM')).get(...params).count;

    // Apply sorting
    if (sort && sort.field) {
      const direction = sort.direction === 'desc' ? 'DESC' : 'ASC';
      query += ` ORDER BY t.${sort.field} ${direction}`;
    } else {
      query += ' ORDER BY created_at DESC';
    }

    // Apply pagination
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const results = db.prepare(query).all(...params);

    res.json({
      results,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Save search filter
router.post('/filters', auth, (req, res) => {
  try {
    const { name, entity, filters } = req.body;

    const result = db.prepare(`
      INSERT INTO saved_searches (name, entity, filters, user_id)
      VALUES (?, ?, ?, ?)
    `).run(name, entity, JSON.stringify(filters), req.user.id);

    res.status(201).json({ id: result.lastInsertRowid, name });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get saved filters
router.get('/filters', auth, (req, res) => {
  try {
    const filters = db.prepare(`
      SELECT * FROM saved_searches WHERE user_id = ? ORDER BY name
    `).all(req.user.id);

    res.json(filters.map(f => ({
      ...f,
      filters: JSON.parse(f.filters),
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete saved filter
router.delete('/filters/:id', auth, (req, res) => {
  try {
    db.prepare('DELETE FROM saved_searches WHERE id = ? AND user_id = ?')
      .run(req.params.id, req.user.id);
    res.json({ message: 'Filter deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
