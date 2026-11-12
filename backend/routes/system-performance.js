const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

// Dashboard de rendimiento del sistema
router.get('/dashboard', auth, adminOnly, (req, res) => {
  try {
    const dbStats = {
      tables: db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().length,
      totalRecords: {},
    };

    // Count records in key tables
    const keyTables = ['users', 'tickets', 'assets', 'knowledge_base', 'audit_logs', 'notifications'];
    keyTables.forEach(table => {
      try {
        dbStats.totalRecords[table] = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get().count;
      } catch (e) {
        dbStats.totalRecords[table] = 0;
      }
    });

    const memUsage = process.memoryUsage();
    const system = {
      uptime: Math.round(process.uptime()),
      memory_mb: Math.round(memUsage.rss / 1024 / 1024),
      heap_mb: Math.round(memUsage.heapUsed / 1024 / 1024),
      pid: process.pid,
      node_version: process.version,
    };

    const recentErrors = db.prepare(`
      SELECT * FROM audit_logs
      WHERE action LIKE '%error%' OR action LIKE '%fail%'
      ORDER BY created_at DESC LIMIT 10
    `).all();

    const apiStats = db.prepare(`
      SELECT endpoint, COUNT(*) as count, AVG(response_time) as avg_time
      FROM api_request_logs
      WHERE created_at >= datetime('now', '-24 hours')
      GROUP BY endpoint
      ORDER BY count DESC
      LIMIT 10
    `).all();

    res.json({ database: dbStats, system, recentErrors, apiStats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Optimizar base de datos
router.post('/optimize', auth, adminOnly, (req, res) => {
  try {
    db.exec('VACUUM');
    db.exec('ANALYZE');
    res.json({ message: 'Base de datos optimizada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Estadísticas de tablas
router.get('/tables', auth, adminOnly, (req, res) => {
  try {
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
    const stats = tables.map(t => {
      try {
        const count = db.prepare(`SELECT COUNT(*) as count FROM ${t.name}`).get().count;
        return { name: t.name, records: count };
      } catch (e) {
        return { name: t.name, records: 0 };
      }
    });
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;