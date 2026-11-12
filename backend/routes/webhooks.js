const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');
const crypto = require('crypto');

// Get all webhooks
router.get('/', auth, adminOnly, (req, res) => {
  try {
    const webhooks = db.prepare('SELECT * FROM webhooks ORDER BY name').all();
    res.json(webhooks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create webhook
router.post('/', auth, adminOnly, (req, res) => {
  try {
    const { name, url, events, secret, active } = req.body;

    const webhookSecret = secret || crypto.randomBytes(32).toString('hex');

    const result = db.prepare(`
      INSERT INTO webhooks (name, url, events, secret, active, created_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(name, url, JSON.stringify(events || []), webhookSecret, active !== false ? 1 : 0, req.user.id);

    const webhook = db.prepare('SELECT * FROM webhooks WHERE id = ?').get(result.lastInsertRowid);
    
    // Return webhook with secret (only shown once)
    res.status(201).json({
      ...webhook,
      secret: webhookSecret,
      message: 'Save this secret - it will not be shown again',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update webhook
router.put('/:id', auth, adminOnly, (req, res) => {
  try {
    const { name, url, events, active } = req.body;

    db.prepare(`
      UPDATE webhooks
      SET name = COALESCE(?, name),
          url = COALESCE(?, url),
          events = COALESCE(?, events),
          active = COALESCE(?, active),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(name, url, events ? JSON.stringify(events) : null, active, req.params.id);

    const webhook = db.prepare('SELECT * FROM webhooks WHERE id = ?').get(req.params.id);
    res.json(webhook);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete webhook
router.delete('/:id', auth, adminOnly, (req, res) => {
  try {
    db.prepare('DELETE FROM webhooks WHERE id = ?').run(req.params.id);
    res.json({ message: 'Webhook deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Test webhook
router.post('/:id/test', auth, adminOnly, async (req, res) => {
  try {
    const webhook = db.prepare('SELECT * FROM webhooks WHERE id = ?').get(req.params.id);
    if (!webhook) {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    // Generate test payload
    const payload = {
      event: 'test',
      timestamp: new Date().toISOString(),
      data: {
        message: 'This is a test webhook from ITAMS',
      },
    };

    // Generate signature
    const signature = crypto
      .createHmac('sha256', webhook.secret)
      .update(JSON.stringify(payload))
      .digest('hex');

    // Log the webhook call
    db.prepare(`
      INSERT INTO webhook_logs (webhook_id, event, payload, status, response)
      VALUES (?, 'test', ?, 'sent', 'Test sent successfully')
    `).run(webhook.id, JSON.stringify(payload));

    console.log(`[WEBHOOK] Test to ${webhook.url}`);
    console.log(`[WEBHOOK] Signature: ${signature}`);

    res.json({
      message: 'Test webhook sent',
      payload,
      signature,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get webhook logs
router.get('/:id/logs', auth, adminOnly, (req, res) => {
  try {
    const logs = db.prepare(`
      SELECT * FROM webhook_logs
      WHERE webhook_id = ?
      ORDER BY created_at DESC
      LIMIT 50
    `).all(req.params.id);

    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Trigger webhooks for event
async function triggerWebhooks(event, data) {
  try {
    const webhooks = db.prepare(`
      SELECT * FROM webhooks
      WHERE active = 1 AND (events LIKE ? OR events LIKE '%"*"*%')
    `).all(`%"${event}"%`);

    for (const webhook of webhooks) {
      const payload = {
        event,
        timestamp: new Date().toISOString(),
        data,
      };

      const signature = crypto
        .createHmac('sha256', webhook.secret)
        .update(JSON.stringify(payload))
        .digest('hex');

      // Log the webhook call
      db.prepare(`
        INSERT INTO webhook_logs (webhook_id, event, payload, status)
        VALUES (?, ?, ?, 'pending')
      `).run(webhook.id, event, JSON.stringify(payload));

      console.log(`[WEBHOOK] Triggered ${event} to ${webhook.url}`);

      // In production, make actual HTTP request here
      // await fetch(webhook.url, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'X-Webhook-Signature': signature,
      //   },
      //   body: JSON.stringify(payload),
      // });
    }
  } catch (error) {
    console.error('Webhook trigger error:', error);
  }
}

module.exports = router;
module.exports.triggerWebhooks = triggerWebhooks;
