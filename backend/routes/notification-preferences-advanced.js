const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth } = require('../middleware/auth');

// Columnas booleanas existentes en notification_preferences
const BOOL_FIELDS = [
  'email_enabled', 'push_enabled', 'ticket_created', 'ticket_updated',
  'ticket_assigned', 'ticket_resolved', 'sla_warning', 'sla_breach',
  'daily_digest', 'weekly_report',
];
const TEXT_FIELDS = ['quiet_hours_start', 'quiet_hours_end'];

const DEFAULTS = {
  email_enabled: true,
  push_enabled: true,
  ticket_created: true,
  ticket_updated: true,
  ticket_assigned: true,
  ticket_resolved: true,
  sla_warning: true,
  sla_breach: true,
  daily_digest: false,
  weekly_report: true,
  quiet_hours_start: '22:00',
  quiet_hours_end: '07:00',
};

// Obtener preferencias detalladas
router.get('/detailed', auth, (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM notification_preferences WHERE user_id = ?').get(req.user.id);
    if (!row) return res.json(DEFAULTS);

    const prefs = {};
    BOOL_FIELDS.forEach((f) => { prefs[f] = !!row[f]; });
    TEXT_FIELDS.forEach((f) => { prefs[f] = row[f]; });
    res.json(prefs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar preferencias detalladas
router.put('/detailed', auth, (req, res) => {
  try {
    const body = req.body || {};
    // better-sqlite3 no acepta booleanos: se convierten a 1/0
    const values = [
      ...BOOL_FIELDS.map((f) => ((body[f] ?? DEFAULTS[f]) ? 1 : 0)),
      ...TEXT_FIELDS.map((f) => body[f] ?? DEFAULTS[f]),
    ];
    const cols = [...BOOL_FIELDS, ...TEXT_FIELDS];

    db.prepare(`
      INSERT INTO notification_preferences (user_id, ${cols.join(', ')})
      VALUES (?, ${cols.map(() => '?').join(', ')})
      ON CONFLICT(user_id) DO UPDATE SET ${cols.map((c) => `${c}=excluded.${c}`).join(', ')},
        updated_at = CURRENT_TIMESTAMP
    `).run(req.user.id, ...values);

    res.json({ message: 'Preferencias actualizadas' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
