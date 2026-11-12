const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

// Métricas de rendimiento del sistema
router.get('/system', auth, adminOnly, (req, res) => {
  try {
    const metrics = {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      nodeVersion: process.version,
      platform: process.platform,
      timestamp: new Date().toISOString(),
    };
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Estadísticas de base de datos
router.get('/database', auth, adminOnly, (req, res) => {
  try {
    const tables = [
      'users', 'tickets', 'assets', 'knowledge_base',
      'workflows', 'audit_logs', 'activity_log'
    ];

    const stats = tables.map(table => {
      const count = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get().count;
      return { table, count };
    });

    res.json({ tables: stats, total_records: stats.reduce((sum, t) => sum + t.count, 0) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Logs de errores recientes
router.get('/errors', auth, adminOnly, (req, res) => {
  try {
    const errors = db.prepare(`
      SELECT * FROM error_logs ORDER BY created_at DESC LIMIT 50
    `).all();
    res.json(errors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;