const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

// Health check completo
router.get('/', auth, adminOnly, (req, res) => {
  try {
    const checks = [];

    // Database check
    try {
      const start = Date.now();
      db.prepare('SELECT 1').get();
      const latency = Date.now() - start;
      checks.push({ name: 'Base de datos', status: latency < 100 ? 'healthy' : 'warning', latency: `${latency}ms`, detail: 'SQLite operativo' });
    } catch (e) {
      checks.push({ name: 'Base de datos', status: 'critical', detail: e.message });
    }

    // Memory check
    const mem = process.memoryUsage();
    const memMB = Math.round(mem.rss / 1024 / 1024);
    checks.push({ name: 'Memoria', status: memMB < 512 ? 'healthy' : memMB < 1024 ? 'warning' : 'critical', detail: `${memMB} MB RSS`, value: memMB });

    // Uptime check
    const uptime = process.uptime();
    checks.push({ name: 'Uptime', status: 'healthy', detail: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m` });

    // Disk check (table counts)
    const tables = db.prepare("SELECT COUNT(*) as c FROM sqlite_master WHERE type='table'").get().c;
    checks.push({ name: 'Tablas DB', status: tables > 0 ? 'healthy' : 'warning', detail: `${tables} tablas` });

    // API key check
    const apiKeys = db.prepare('SELECT COUNT(*) as c FROM api_keys').get().c;
    checks.push({ name: 'API Keys', status: 'healthy', detail: `${apiKeys} claves activas` });

    // User check
    const users = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
    checks.push({ name: 'Usuarios', status: users > 0 ? 'healthy' : 'warning', detail: `${users} usuarios registrados` });

    // Ticket check
    const tickets = db.prepare('SELECT COUNT(*) as c FROM tickets').get().c;
    const openTickets = db.prepare("SELECT COUNT(*) as c FROM tickets WHERE status = 'open'").get().c;
    checks.push({ name: 'Tickets', status: 'healthy', detail: `${tickets} total, ${openTickets} abiertos` });

    // SLA check
    const slaBreaches = db.prepare("SELECT COUNT(*) as c FROM tickets WHERE sla_met = 0 AND status != 'closed'").get().c;
    checks.push({ name: 'SLA', status: slaBreaches === 0 ? 'healthy' : slaBreaches < 5 ? 'warning' : 'critical', detail: slaBreaches === 0 ? 'Sin violaciones' : `${slaBreaches} violaciones activas` });

    const overallStatus = checks.some(c => c.status === 'critical') ? 'critical' : checks.some(c => c.status === 'warning') ? 'warning' : 'healthy';

    res.json({ status: overallStatus, checks, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check rápido (para monitoreo externo)
router.get('/ping', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = router;