const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

// Obtener configuración de retención
router.get('/', auth, adminOnly, (req, res) => {
  try {
    const retention = db.prepare("SELECT value FROM settings WHERE key = 'data_retention'").get();
    res.json(retention ? JSON.parse(retention.value) : {
      audit_logs_days: 365,
      notifications_days: 90,
      activity_logs_days: 180,
      email_logs_days: 90,
      api_logs_days: 30,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar configuración
router.put('/', auth, adminOnly, (req, res) => {
  try {
    db.prepare("INSERT INTO settings (key, value) VALUES ('data_retention', ?) ON CONFLICT(key) DO UPDATE SET value = ?")
      .run(JSON.stringify(req.body), JSON.stringify(req.body));
    res.json({ message: 'Configuración de retención actualizada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Ejecutar limpieza
router.post('/cleanup', auth, adminOnly, (req, res) => {
  try {
    const retention = db.prepare("SELECT value FROM settings WHERE key = 'data_retention'").get();
    const config = retention ? JSON.parse(retention.value) : { audit_logs_days: 365, notifications_days: 90, activity_logs_days: 180, email_logs_days: 90, api_logs_days: 30 };

    const results = {};
    results.audit_logs = db.prepare(`DELETE FROM audit_logs WHERE created_at < date('now', '-${config.audit_logs_days} days')`).run().changes;
    results.notifications = db.prepare(`DELETE FROM notifications WHERE created_at < date('now', '-${config.notifications_days} days')`).run().changes;
    results.activity_logs = db.prepare(`DELETE FROM activity_log WHERE created_at < date('now', '-${config.activity_logs_days} days')`).run().changes;
    results.email_logs = db.prepare(`DELETE FROM email_logs WHERE created_at < date('now', '-${config.email_logs_days} days')`).run().changes;
    results.api_logs = db.prepare(`DELETE FROM api_request_logs WHERE created_at < date('now', '-${config.api_logs_days} days')`).run().changes;

    const total = Object.values(results).reduce((s, v) => s + v, 0);
    res.json({ results, total_deleted: total });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Estadísticas de retención
router.get('/stats', auth, adminOnly, (req, res) => {
  try {
    res.json({
      audit_logs: db.prepare('SELECT COUNT(*) as c FROM audit_logs').get().c,
      notifications: db.prepare('SELECT COUNT(*) as c FROM notifications').get().c,
      activity_logs: db.prepare('SELECT COUNT(*) as c FROM activity_log').get().c,
      email_logs: db.prepare('SELECT COUNT(*) as c FROM email_logs').get().c,
      api_logs: db.prepare('SELECT COUNT(*) as c FROM api_request_logs').get().c,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;