const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

// Exportar audit logs a CSV
router.get('/export/csv', auth, adminOnly, (req, res) => {
  try {
    const { date_from, date_to, action, user_id } = req.query;
    let query = 'SELECT al.*, u.name as user_name, u.email as user_email FROM audit_logs al LEFT JOIN users u ON al.user_id = u.id WHERE 1=1';
    const params = [];

    if (date_from) { query += ' AND al.created_at >= ?'; params.push(date_from); }
    if (date_to) { query += ' AND al.created_at <= ?'; params.push(date_to + ' 23:59:59'); }
    if (action) { query += ' AND al.action LIKE ?'; params.push(`%${action}%`); }
    if (user_id) { query += ' AND al.user_id = ?'; params.push(user_id); }

    query += ' ORDER BY al.created_at DESC';
    const logs = db.prepare(query).all(...params);

    const csv = [
      'Fecha,Usuario,Email,Acción,Entidad,Detalles',
      ...logs.map(l => `"${l.created_at}","${l.user_name || ''}","${l.user_email || ''}","${l.action}","${l.entity_type || ''}","${(l.details || '').replace(/"/g, '""')}"`)
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Exportar audit logs a JSON
router.get('/export/json', auth, adminOnly, (req, res) => {
  try {
    const { date_from, date_to, action, user_id } = req.query;
    let query = 'SELECT al.*, u.name as user_name, u.email as user_email FROM audit_logs al LEFT JOIN users u ON al.user_id = u.id WHERE 1=1';
    const params = [];

    if (date_from) { query += ' AND al.created_at >= ?'; params.push(date_from); }
    if (date_to) { query += ' AND al.created_at <= ?'; params.push(date_to + ' 23:59:59'); }
    if (action) { query += ' AND al.action LIKE ?'; params.push(`%${action}%`); }
    if (user_id) { query += ' AND al.user_id = ?'; params.push(user_id); }

    query += ' ORDER BY al.created_at DESC LIMIT 10000';
    const logs = db.prepare(query).all(...params);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=audit_logs_${new Date().toISOString().split('T')[0]}.json`);
    res.json({ exported_at: new Date().toISOString(), count: logs.length, logs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Estadísticas de exportación
router.get('/stats', auth, adminOnly, (req, res) => {
  try {
    const total = db.prepare('SELECT COUNT(*) as c FROM audit_logs').get().c;
    const oldest = db.prepare('SELECT MIN(created_at) as d FROM audit_logs').get().d;
    const newest = db.prepare('SELECT MAX(created_at) as d FROM audit_logs').get().d;
    const actions = db.prepare('SELECT DISTINCT action FROM audit_logs ORDER BY action').all().map(a => a.action);
    res.json({ total, oldest, newest, actions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;