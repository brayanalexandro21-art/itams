const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

// Get audit logs
router.get('/', auth, adminOnly, (req, res) => {
  try {
    const { entity_type, entity_id, user_id, action, start_date, end_date, limit } = req.query;

    let query = `
      SELECT al.*, u.name as user_name
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE 1=1
    `;

    const params = [];

    if (entity_type) {
      query += ' AND al.entity_type = ?';
      params.push(entity_type);
    }
    if (entity_id) {
      query += ' AND al.entity_id = ?';
      params.push(entity_id);
    }
    if (user_id) {
      query += ' AND al.user_id = ?';
      params.push(user_id);
    }
    if (action) {
      query += ' AND al.action = ?';
      params.push(action);
    }
    if (start_date) {
      query += ' AND al.created_at >= ?';
      params.push(start_date);
    }
    if (end_date) {
      query += ' AND al.created_at <= ?';
      params.push(end_date);
    }

    query += ' ORDER BY al.created_at DESC LIMIT ?';
    params.push(parseInt(limit) || 100);

    const logs = db.prepare(query).all(...params);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get audit log stats
router.get('/stats', auth, adminOnly, (req, res) => {
  try {
    const stats = {
      total: db.prepare('SELECT COUNT(*) as count FROM audit_logs').get().count,
      today: db.prepare("SELECT COUNT(*) as count FROM audit_logs WHERE DATE(created_at) = DATE('now')").get().count,
      byAction: db.prepare(`
        SELECT action, COUNT(*) as count
        FROM audit_logs
        GROUP BY action
        ORDER BY count DESC
      `).all(),
      byEntity: db.prepare(`
        SELECT entity_type, COUNT(*) as count
        FROM audit_logs
        GROUP BY entity_type
        ORDER BY count DESC
      `).all(),
      recentActivity: db.prepare(`
        SELECT al.*, u.name as user_name
        FROM audit_logs al
        LEFT JOIN users u ON al.user_id = u.id
        ORDER BY al.created_at DESC
        LIMIT 10
      `).all(),
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper function to log audit events
function logAudit(userId, action, entityType, entityId, oldValues, newValues, ipAddress) {
  try {
    db.prepare(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      action,
      entityType,
      entityId,
      oldValues ? JSON.stringify(oldValues) : null,
      newValues ? JSON.stringify(newValues) : null,
      ipAddress
    );
  } catch (error) {
    console.error('Audit log error:', error);
  }
}

module.exports = router;
module.exports.logAudit = logAudit;
