const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

// Get all integrations
router.get('/', auth, adminOnly, (req, res) => {
  try {
    const integrations = db.prepare('SELECT * FROM integrations ORDER BY name').all();
    res.json(integrations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get integration by ID
router.get('/:id', auth, adminOnly, (req, res) => {
  try {
    const integration = db.prepare('SELECT * FROM integrations WHERE id = ?').get(req.params.id);
    if (!integration) {
      return res.status(404).json({ error: 'Integration not found' });
    }
    res.json(integration);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create/update integration
router.post('/', auth, adminOnly, (req, res) => {
  try {
    const { name, type, config, active } = req.body;

    const existing = db.prepare('SELECT id FROM integrations WHERE name = ?').get(name);

    if (existing) {
      db.prepare(`
        UPDATE integrations
        SET config = ?, active = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(JSON.stringify(config), active !== false ? 1 : 0, existing.id);
    } else {
      db.prepare(`
        INSERT INTO integrations (name, type, config, active)
        VALUES (?, ?, ?, ?)
      `).run(name, type, JSON.stringify(config), active !== false ? 1 : 0);
    }

    res.json({ message: 'Integration saved' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Test integration
router.post('/:id/test', auth, adminOnly, async (req, res) => {
  try {
    const integration = db.prepare('SELECT * FROM integrations WHERE id = ?').get(req.params.id);
    if (!integration) {
      return res.status(404).json({ error: 'Integration not found' });
    }

    const config = JSON.parse(integration.config || '{}');

    // Simulate test based on type
    switch (integration.type) {
      case 'slack':
        // In production, use Slack API
        console.log(`[SLACK] Test message would be sent to: ${config.channel}`);
        break;
      case 'discord':
        console.log(`[DISCORD] Test message would be sent to webhook`);
        break;
      case 'whatsapp':
        console.log(`[WHATSAPP] Test message would be sent to: ${config.phone}`);
        break;
    }

    res.json({ message: 'Test sent successfully', integration: integration.name });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle integration
router.put('/:id/toggle', auth, adminOnly, (req, res) => {
  try {
    const integration = db.prepare('SELECT * FROM integrations WHERE id = ?').get(req.params.id);
    if (!integration) {
      return res.status(404).json({ error: 'Integration not found' });
    }

    db.prepare('UPDATE integrations SET active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(integration.active ? 0 : 1, req.params.id);

    res.json({ message: 'Integration toggled', active: !integration.active });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete integration
router.delete('/:id', auth, adminOnly, (req, res) => {
  try {
    db.prepare('DELETE FROM integrations WHERE id = ?').run(req.params.id);
    res.json({ message: 'Integration deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send notification to integration
async function sendToIntegration(integrationId, message, data) {
  try {
    const integration = db.prepare('SELECT * FROM integrations WHERE id = ? AND active = 1').get(integrationId);
    if (!integration) return;

    const config = JSON.parse(integration.config || '{}');

    console.log(`[${integration.type.toUpperCase()}] Sending: ${message}`);

    // Log the notification
    db.prepare(`
      INSERT INTO integration_logs (integration_id, message, data, status)
      VALUES (?, ?, ?, 'sent')
    `).run(integrationId, message, JSON.stringify(data));
  } catch (error) {
    console.error('Integration send error:', error);
  }
}

module.exports = router;
module.exports.sendToIntegration = sendToIntegration;
