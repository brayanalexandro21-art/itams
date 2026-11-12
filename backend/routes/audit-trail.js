const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

// Visor avanzado de auditoría
router.get('/', auth, adminOnly, (req, res) => {
  try {
    const { action, user_id, entity_type, date_from, date_to, page = 1, limit = 50 } = req.query;
    let query = `
      SELECT al.*, u.name as user_name, u.email as user_email
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (action) { query += ' AND al.action LIKE ?'; params.push(`%${action}%`); }
    if (user_id) { query += ' AND al.user_id = ?'; params.push(user_id); }
    if (entity_type) { query += ' AND al.entity_type = ?'; params.push(entity_type); }
    if (date_from) { query += ' AND al.created_at >= ?'; params.push(date_from); }
    if (date_to) { query += ' AND al.created_at <= ?'; params.push(date_to + ' 23:59:59'); }

    const total = db.prepare(query.replace('al.*, u.name as user_name, u.email as user_email', 'COUNT(*) as count')).get(...params).count;

    query += ' ORDER BY al.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, (page - 1) * limit);

    const logs = db.prepare(query).all(...params);
    res.json({ logs, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Resumen de auditoría
router.get('/summary', auth, adminOnly, (req, res) => {
  try {
    const total = db.prepare('SELECT COUNT(*) as count FROM audit_logs').get().count;
    const today = db.prepare("SELECT COUNT(*) as count FROM audit_logs WHERE created_at >= date('now')").get().count;
    
    const byAction = db.prepare(`
      SELECT action, COUNT(*) as count
      FROM audit_logs
      GROUP BY action
      ORDER BY count DESC
      LIMIT 10
    `).all();

    const byUser = db.prepare(`
      SELECT u.name, COUNT(*) as count
      FROM audit_logs al
      JOIN users u ON al.user_id = u.id
      GROUP BY al.user_id
      ORDER BY count DESC
      LIMIT 10
    `).all();

    const recentCritical = db.prepare(`
      SELECT al.*, u.name as user_name
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.action IN ('delete', 'login_failed', 'password_change', 'role_change')
      ORDER BY al.created_at DESC
      LIMIT 10
    `).all();

    res.json({ total, today, byAction, byUser, recentCritical });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;