const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

// Listar items de compliance
router.get('/', auth, (req, res) => {
  try {
    const { category, status } = req.query;
    let query = 'SELECT * FROM compliance_items WHERE 1=1';
    const params = [];

    if (category) { query += ' AND category = ?'; params.push(category); }
    if (status) { query += ' AND status = ?'; params.push(status); }

    query += ' ORDER BY due_date ASC';
    const items = db.prepare(query).all(...params);
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear item de compliance
router.post('/', auth, adminOnly, (req, res) => {
  try {
    const { title, description, category, due_date, priority } = req.body;
    const result = db.prepare(`
      INSERT INTO compliance_items (name, description, category, due_date, priority, status, created_by)
      VALUES (?, ?, ?, ?, ?, 'pending', ?)
    `).run(title, description, category, due_date, priority || 'medium', req.user.id);
    res.json({ id: result.lastInsertRowid, title });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar estado de compliance
router.put('/:id', auth, adminOnly, (req, res) => {
  try {
    const { status, notes } = req.body;
    db.prepare('UPDATE compliance_items SET status = ?, notes = ? WHERE id = ?')
      .run(status, notes, req.params.id);

    db.prepare(`
      INSERT INTO compliance_history (compliance_id, action, notes, performed_by)
      VALUES (?, ?, ?, ?)
    `).run(req.params.id, status, notes, req.user.id);

    res.json({ message: 'Compliance actualizado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Dashboard de compliance
router.get('/dashboard', auth, (req, res) => {
  try {
    const total = db.prepare('SELECT COUNT(*) as count FROM compliance_items').get().count;
    const compliant = db.prepare("SELECT COUNT(*) as count FROM compliance_items WHERE status = 'compliant'").get().count;
    const nonCompliant = db.prepare("SELECT COUNT(*) as count FROM compliance_items WHERE status = 'non_compliant'").get().count;
    const pending = db.prepare("SELECT COUNT(*) as count FROM compliance_items WHERE status = 'pending'").get().count;

    const byCategory = db.prepare(`
      SELECT category, COUNT(*) as total,
        SUM(CASE WHEN status = 'compliant' THEN 1 ELSE 0 END) as compliant,
        SUM(CASE WHEN status = 'non_compliant' THEN 1 ELSE 0 END) as non_compliant
      FROM compliance_items
      GROUP BY category
    `).all();

    const upcoming = db.prepare(`
      SELECT * FROM compliance_items
      WHERE due_date >= date('now')
      ORDER BY due_date ASC
      LIMIT 5
    `).all();

    res.json({
      score: total > 0 ? Math.round((compliant / total) * 100) : 100,
      total,
      compliant,
      non_compliant: nonCompliant,
      pending,
      byCategory,
      upcoming,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Checklist por categoría
router.get('/checklist', auth, (req, res) => {
  try {
    const { category } = req.query;
    let query = `
      SELECT id, title, description, status, due_date, priority
      FROM compliance_items
    `;
    if (category) {
      query += ' WHERE category = ?';
      const items = db.prepare(query).all(category);
      return res.json(items);
    }
    const items = db.prepare(query).all();
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;