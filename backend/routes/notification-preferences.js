const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth } = require('../middleware/auth');

// Get notification preferences
router.get('/', auth, (req, res) => {
  try {
    let preferences = db.prepare('SELECT * FROM notification_preferences WHERE user_id = ?').get(req.user.id);

    if (!preferences) {
      // Create default preferences
      const defaultPrefs = {
        email_enabled: 1,
        push_enabled: 1,
        ticket_created: 1,
        ticket_assigned: 1,
        ticket_updated: 1,
        ticket_comment: 1,
        ticket_resolved: 1,
        asset_assigned: 1,
        asset_maintenance: 1,
        sla_warning: 1,
        sla_breach: 1,
        system_announcements: 1,
        daily_digest: 0,
        weekly_report: 1,
        quiet_hours_start: '22:00',
        quiet_hours_end: '08:00',
      };

      db.prepare(`
        INSERT INTO notification_preferences (
          user_id, email_enabled, push_enabled, ticket_created, ticket_assigned,
          ticket_updated, ticket_comment, ticket_resolved, asset_assigned,
          asset_maintenance, sla_warning, sla_breach, system_announcements,
          daily_digest, weekly_report, quiet_hours_start, quiet_hours_end
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        req.user.id, defaultPrefs.email_enabled, defaultPrefs.push_enabled,
        defaultPrefs.ticket_created, defaultPrefs.ticket_assigned,
        defaultPrefs.ticket_updated, defaultPrefs.ticket_comment,
        defaultPrefs.ticket_resolved, defaultPrefs.asset_assigned,
        defaultPrefs.asset_maintenance, defaultPrefs.sla_warning,
        defaultPrefs.sla_breach, defaultPrefs.system_announcements,
        defaultPrefs.daily_digest, defaultPrefs.weekly_report,
        defaultPrefs.quiet_hours_start, defaultPrefs.quiet_hours_end
      );

      preferences = db.prepare('SELECT * FROM notification_preferences WHERE user_id = ?').get(req.user.id);
    }

    res.json(preferences);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update notification preferences
router.put('/', auth, (req, res) => {
  try {
    const {
      email_enabled, push_enabled, ticket_created, ticket_assigned,
      ticket_updated, ticket_comment, ticket_resolved, asset_assigned,
      asset_maintenance, sla_warning, sla_breach, system_announcements,
      daily_digest, weekly_report, quiet_hours_start, quiet_hours_end
    } = req.body;

    const existing = db.prepare('SELECT id FROM notification_preferences WHERE user_id = ?').get(req.user.id);

    if (existing) {
      db.prepare(`
        UPDATE notification_preferences
        SET email_enabled = COALESCE(?, email_enabled),
            push_enabled = COALESCE(?, push_enabled),
            ticket_created = COALESCE(?, ticket_created),
            ticket_assigned = COALESCE(?, ticket_assigned),
            ticket_updated = COALESCE(?, ticket_updated),
            ticket_comment = COALESCE(?, ticket_comment),
            ticket_resolved = COALESCE(?, ticket_resolved),
            asset_assigned = COALESCE(?, asset_assigned),
            asset_maintenance = COALESCE(?, asset_maintenance),
            sla_warning = COALESCE(?, sla_warning),
            sla_breach = COALESCE(?, sla_breach),
            system_announcements = COALESCE(?, system_announcements),
            daily_digest = COALESCE(?, daily_digest),
            weekly_report = COALESCE(?, weekly_report),
            quiet_hours_start = COALESCE(?, quiet_hours_start),
            quiet_hours_end = COALESCE(?, quiet_hours_end),
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `).run(
        email_enabled, push_enabled, ticket_created, ticket_assigned,
        ticket_updated, ticket_comment, ticket_resolved, asset_assigned,
        asset_maintenance, sla_warning, sla_breach, system_announcements,
        daily_digest, weekly_report, quiet_hours_start, quiet_hours_end,
        req.user.id
      );
    } else {
      db.prepare(`
        INSERT INTO notification_preferences (
          user_id, email_enabled, push_enabled, ticket_created, ticket_assigned,
          ticket_updated, ticket_comment, ticket_resolved, asset_assigned,
          asset_maintenance, sla_warning, sla_breach, system_announcements,
          daily_digest, weekly_report, quiet_hours_start, quiet_hours_end
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        req.user.id, email_enabled || 1, push_enabled || 1,
        ticket_created || 1, ticket_assigned || 1,
        ticket_updated || 1, ticket_comment || 1,
        ticket_resolved || 1, asset_assigned || 1,
        asset_maintenance || 1, sla_warning || 1,
        sla_breach || 1, system_announcements || 1,
        daily_digest || 0, weekly_report || 1,
        quiet_hours_start || '22:00', quiet_hours_end || '08:00'
      );
    }

    res.json({ message: 'Preferences updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get notification categories
router.get('/categories', (req, res) => {
  try {
    const categories = [
      {
        id: 'tickets',
        name: 'Tickets',
        notifications: [
          { key: 'ticket_created', label: 'Ticket Created' },
          { key: 'ticket_assigned', label: 'Ticket Assigned' },
          { key: 'ticket_updated', label: 'Ticket Updated' },
          { key: 'ticket_comment', label: 'New Comment' },
          { key: 'ticket_resolved', label: 'Ticket Resolved' },
        ],
      },
      {
        id: 'assets',
        name: 'Assets',
        notifications: [
          { key: 'asset_assigned', label: 'Asset Assigned' },
          { key: 'asset_maintenance', label: 'Maintenance Due' },
        ],
      },
      {
        id: 'sla',
        name: 'SLA',
        notifications: [
          { key: 'sla_warning', label: 'SLA Warning' },
          { key: 'sla_breach', label: 'SLA Breach' },
        ],
      },
      {
        id: 'system',
        name: 'System',
        notifications: [
          { key: 'system_announcements', label: 'Announcements' },
          { key: 'daily_digest', label: 'Daily Digest' },
          { key: 'weekly_report', label: 'Weekly Report' },
        ],
      },
    ];

    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
