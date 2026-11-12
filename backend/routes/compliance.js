const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

// Get all compliance items
router.get('/', auth, (req, res) => {
  try {
    const { category, status } = req.query;

    let query = `
      SELECT c.*, u.name as assigned_to_name,
        (SELECT COUNT(*) FROM compliance_documents WHERE compliance_id = c.id) as document_count
      FROM compliance_items c
      LEFT JOIN users u ON c.assigned_to = u.id
      WHERE 1=1
    `;

    const params = [];

    if (category) {
      query += ' AND c.category = ?';
      params.push(category);
    }
    if (status) {
      query += ' AND c.status = ?';
      params.push(status);
    }

    query += ' ORDER BY c.due_date ASC';

    const items = db.prepare(query).all(...params);
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get compliance item by ID
router.get('/:id', auth, (req, res) => {
  try {
    const item = db.prepare(`
      SELECT c.*, u.name as assigned_to_name
      FROM compliance_items c
      LEFT JOIN users u ON c.assigned_to = u.id
      WHERE c.id = ?
    `).get(req.params.id);

    if (!item) {
      return res.status(404).json({ error: 'Compliance item not found' });
    }

    // Get documents
    const documents = db.prepare(`
      SELECT cd.*, d.original_name, d.mime_type, d.size
      FROM compliance_documents cd
      LEFT JOIN documents d ON cd.document_id = d.id
      WHERE cd.compliance_id = ?
    `).all(req.params.id);

    // Get history
    const history = db.prepare(`
      SELECT ch.*, u.name as performed_by_name
      FROM compliance_history ch
      LEFT JOIN users u ON ch.performed_by = u.id
      WHERE ch.compliance_id = ?
      ORDER BY ch.created_at DESC
    `).all(req.params.id);

    res.json({ ...item, documents, history });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create compliance item
router.post('/', auth, adminOnly, (req, res) => {
  try {
    const {
      name, description, category, regulation, due_date,
      recurrence, assigned_to, priority, notes
    } = req.body;

    const result = db.prepare(`
      INSERT INTO compliance_items (
        name, description, category, regulation, due_date,
        recurrence, assigned_to, priority, notes, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      name, description, category, regulation, due_date,
      recurrence, assigned_to, priority || 'medium', notes, req.user.id
    );

    const item = db.prepare('SELECT * FROM compliance_items WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update compliance item
router.put('/:id', auth, adminOnly, (req, res) => {
  try {
    const {
      name, description, category, regulation, due_date,
      recurrence, assigned_to, priority, status, notes
    } = req.body;

    db.prepare(`
      UPDATE compliance_items
      SET name = COALESCE(?, name),
          description = COALESCE(?, description),
          category = COALESCE(?, category),
          regulation = COALESCE(?, regulation),
          due_date = COALESCE(?, due_date),
          recurrence = COALESCE(?, recurrence),
          assigned_to = COALESCE(?, assigned_to),
          priority = COALESCE(?, priority),
          status = COALESCE(?, status),
          notes = COALESCE(?, notes),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      name, description, category, regulation, due_date,
      recurrence, assigned_to, priority, status, notes, req.params.id
    );

    const item = db.prepare('SELECT * FROM compliance_items WHERE id = ?').get(req.params.id);
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete compliance item
router.delete('/:id', auth, adminOnly, (req, res) => {
  try {
    db.prepare('DELETE FROM compliance_documents WHERE compliance_id = ?').run(req.params.id);
    db.prepare('DELETE FROM compliance_history WHERE compliance_id = ?').run(req.params.id);
    db.prepare('DELETE FROM compliance_items WHERE id = ?').run(req.params.id);
    res.json({ message: 'Compliance item deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark compliance as complete
router.post('/:id/complete', auth, (req, res) => {
  try {
    const { notes, next_due_date } = req.body;

    db.prepare(`
      UPDATE compliance_items
      SET status = 'completed', completed_at = CURRENT_TIMESTAMP, completed_by = ?
      WHERE id = ?
    `).run(req.user.id, req.params.id);

    // Log completion
    db.prepare(`
      INSERT INTO compliance_history (compliance_id, action, notes, performed_by)
      VALUES (?, 'completed', ?, ?)
    `).run(req.params.id, notes, req.user.id);

    // If recurring, create next item
    const item = db.prepare('SELECT * FROM compliance_items WHERE id = ?').get(req.params.id);
    if (item.recurrence && next_due_date) {
      db.prepare(`
        INSERT INTO compliance_items (
          name, description, category, regulation, due_date,
          recurrence, assigned_to, priority, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        item.name, item.description, item.category, item.regulation,
        next_due_date, item.recurrence, item.assigned_to, item.priority, req.user.id
      );
    }

    res.json({ message: 'Compliance marked as complete' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get compliance statistics
router.get('/stats/summary', auth, (req, res) => {
  try {
    const stats = {
      total: db.prepare('SELECT COUNT(*) as count FROM compliance_items').get().count,
      pending: db.prepare("SELECT COUNT(*) as count FROM compliance_items WHERE status = 'pending'").get().count,
      completed: db.prepare("SELECT COUNT(*) as count FROM compliance_items WHERE status = 'completed'").get().count,
      overdue: db.prepare("SELECT COUNT(*) as count FROM compliance_items WHERE due_date < DATE('now') AND status != 'completed'").get().count,
      due_soon: db.prepare(`
        SELECT COUNT(*) as count FROM compliance_items
        WHERE due_date BETWEEN DATE('now') AND DATE('now', '+7 days') AND status != 'completed'
      `).get().count,
      by_category: db.prepare(`
        SELECT category, COUNT(*) as count
        FROM compliance_items
        GROUP BY category
        ORDER BY count DESC
      `).all(),
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get compliance categories
router.get('/meta/categories', auth, (req, res) => {
  try {
    const categories = [
      { id: 'security', name: 'Security', icon: '🔒' },
      { id: 'privacy', name: 'Privacy (GDPR)', icon: '🛡️' },
      { id: 'audit', name: 'Audit', icon: '📋' },
      { id: 'regulatory', name: 'Regulatory', icon: '📜' },
      { id: 'internal', name: 'Internal Policy', icon: '📝' },
      { id: 'industry', name: 'Industry Standards', icon: '🏭' },
    ];
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
