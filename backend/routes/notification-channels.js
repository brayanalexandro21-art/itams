const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

// Get all notification channels
router.get('/', auth, adminOnly, (req, res) => {
  try {
    const channels = db.prepare('SELECT * FROM notification_channels ORDER BY name').all();
    res.json(channels);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create notification channel
router.post('/', auth, adminOnly, (req, res) => {
  try {
    const { name, type, config, active } = req.body;

    const result = db.prepare(`
      INSERT INTO notification_channels (name, type, config, active, created_by)
      VALUES (?, ?, ?, ?, ?)
    `).run(name, type, JSON.stringify(config), active !== false ? 1 : 0, req.user.id);

    const channel = db.prepare('SELECT * FROM notification_channels WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(channel);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update notification channel
router.put('/:id', auth, adminOnly, (req, res) => {
  try {
    const { name, type, config, active } = req.body;

    db.prepare(`
      UPDATE notification_channels
      SET name = COALESCE(?, name),
          type = COALESCE(?, type),
          config = COALESCE(?, config),
          active = COALESCE(?, active),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(name, type, config ? JSON.stringify(config) : null, active, req.params.id);

    const channel = db.prepare('SELECT * FROM notification_channels WHERE id = ?').get(req.params.id);
    res.json(channel);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete notification channel
router.delete('/:id', auth, adminOnly, (req, res) => {
  try {
    db.prepare('DELETE FROM notification_channels WHERE id = ?').run(req.params.id);
    res.json({ message: 'Channel deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Test notification channel
router.post('/:id/test', auth, adminOnly, (req, res) => {
  try {
    const channel = db.prepare('SELECT * FROM notification_channels WHERE id = ?').get(req.params.id);
    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    const config = JSON.parse(channel.config || '{}');

    // Simulate sending test notification
    console.log(`[NOTIFICATION] Test to ${channel.type}:`, config);

    // Log the test
    db.prepare(`
      INSERT INTO notification_channel_logs (channel_id, status, message)
      VALUES (?, 'sent', 'Test notification sent')
    `).run(channel.id);

    res.json({ message: 'Test notification sent' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get notification channel types
router.get('/types', auth, (req, res) => {
  try {
    const types = [
      {
        id: 'email',
        name: 'Email',
        icon: '📧',
        config_fields: [
          { key: 'smtp_host', label: 'SMTP Host', type: 'text', required: true },
          { key: 'smtp_port', label: 'SMTP Port', type: 'number', required: true },
          { key: 'smtp_user', label: 'Username', type: 'text', required: true },
          { key: 'smtp_pass', label: 'Password', type: 'password', required: true },
          { key: 'from_email', label: 'From Email', type: 'email', required: true },
        ],
      },
      {
        id: 'slack',
        name: 'Slack',
        icon: '💬',
        config_fields: [
          { key: 'webhook_url', label: 'Webhook URL', type: 'url', required: true },
          { key: 'channel', label: 'Channel', type: 'text', required: false },
        ],
      },
      {
        id: 'discord',
        name: 'Discord',
        icon: '🎮',
        config_fields: [
          { key: 'webhook_url', label: 'Webhook URL', type: 'url', required: true },
        ],
      },
      {
        id: 'teams',
        name: 'Microsoft Teams',
        icon: '👥',
        config_fields: [
          { key: 'webhook_url', label: 'Webhook URL', type: 'url', required: true },
        ],
      },
      {
        id: 'sms',
        name: 'SMS',
        icon: '📱',
        config_fields: [
          { key: 'provider', label: 'Provider', type: 'select', options: ['twilio', 'nexmo'], required: true },
          { key: 'api_key', label: 'API Key', type: 'password', required: true },
          { key: 'api_secret', label: 'API Secret', type: 'password', required: true },
          { key: 'from_number', label: 'From Number', type: 'tel', required: true },
        ],
      },
      {
        id: 'webhook',
        name: 'Custom Webhook',
        icon: '🔗',
        config_fields: [
          { key: 'url', label: 'Webhook URL', type: 'url', required: true },
          { key: 'method', label: 'Method', type: 'select', options: ['POST', 'PUT'], required: true },
          { key: 'headers', label: 'Headers (JSON)', type: 'textarea', required: false },
        ],
      },
    ];

    res.json(types);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send notification through channel
router.post('/send', auth, adminOnly, (req, res) => {
  try {
    const { channel_id, title, message, data } = req.body;

    const channel = db.prepare('SELECT * FROM notification_channels WHERE id = ? AND active = 1').get(channel_id);
    if (!channel) {
      return res.status(404).json({ error: 'Channel not found or inactive' });
    }

    // Log the notification
    db.prepare(`
      INSERT INTO notification_channel_logs (channel_id, status, message, data)
      VALUES (?, 'sent', ?, ?)
    `).run(channel_id, `${title}: ${message}`, JSON.stringify(data));

    // In production, actually send the notification
    console.log(`[NOTIFICATION] Sent via ${channel.type}:`, { title, message });

    res.json({ message: 'Notification sent' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get notification logs
router.get('/:id/logs', auth, adminOnly, (req, res) => {
  try {
    const logs = db.prepare(`
      SELECT * FROM notification_channel_logs
      WHERE channel_id = ?
      ORDER BY created_at DESC
      LIMIT 50
    `).all(req.params.id);

    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
