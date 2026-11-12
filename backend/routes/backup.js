const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');
const fs = require('fs');
const path = require('path');

const BACKUP_DIR = path.join(__dirname, '../backups');

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Get backup settings
router.get('/settings', auth, adminOnly, (req, res) => {
  try {
    const settings = db.prepare("SELECT * FROM settings WHERE key LIKE 'backup_%'").all();
    const config = {};
    settings.forEach(s => {
      config[s.key] = s.value;
    });

    res.json({
      enabled: config.backup_enabled === 'true',
      frequency: config.backup_frequency || 'daily',
      retention_days: parseInt(config.backup_retention_days || '30'),
      last_backup: config.backup_last_backup,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update backup settings
router.put('/settings', auth, adminOnly, (req, res) => {
  try {
    const { enabled, frequency, retention_days } = req.body;

    const upsert = db.prepare(`
      INSERT INTO settings (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = ?
    `);

    upsert.run('backup_enabled', enabled.toString(), enabled.toString());
    upsert.run('backup_frequency', frequency, frequency);
    upsert.run('backup_retention_days', retention_days.toString(), retention_days.toString());

    res.json({ message: 'Backup settings updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create manual backup
router.post('/create', auth, adminOnly, (req, res) => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(BACKUP_DIR, `itams-backup-${timestamp}.json`);

    // Export all tables
    const backup = {
      timestamp: new Date().toISOString(),
      version: '4.0',
      data: {
        users: db.prepare('SELECT * FROM users').all(),
        tickets: db.prepare('SELECT * FROM tickets').all(),
        ticket_comments: db.prepare('SELECT * FROM ticket_comments').all(),
        assets: db.prepare('SELECT * FROM assets').all(),
        notifications: db.prepare('SELECT * FROM notifications').all(),
        knowledge_base: db.prepare('SELECT * FROM knowledge_base').all(),
        kb_comments: db.prepare('SELECT * FROM kb_comments').all(),
        tenants: db.prepare('SELECT * FROM tenants').all(),
        api_keys: db.prepare('SELECT * FROM api_keys').all(),
        audit_logs: db.prepare('SELECT * FROM audit_logs').all(),
        slas: db.prepare('SELECT * FROM slas').all(),
        workflows: db.prepare('SELECT * FROM workflows').all(),
        ticket_templates: db.prepare('SELECT * FROM ticket_templates').all(),
        settings: db.prepare('SELECT * FROM settings').all(),
      },
    };

    // Remove sensitive data from backup
    backup.data.users = backup.data.users.map(u => ({
      ...u,
      password: '[REDACTED]',
      two_factor_secret: u.two_factor_secret ? '[REDACTED]' : null,
    }));
    backup.data.api_keys = backup.data.api_keys.map(k => ({
      ...k,
      key: '[REDACTED]',
    }));

    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));

    // Update last backup time
    db.prepare("INSERT INTO settings (key, value) VALUES ('backup_last_backup', ?) ON CONFLICT(key) DO UPDATE SET value = ?")
      .run(new Date().toISOString(), new Date().toISOString());

    res.json({
      message: 'Backup created successfully',
      file: path.basename(backupFile),
      size: fs.statSync(backupFile).size,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// List backups
router.get('/list', auth, adminOnly, (req, res) => {
  try {
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.endsWith('.json'))
      .map(f => ({
        name: f,
        size: fs.statSync(path.join(BACKUP_DIR, f)).size,
        created: fs.statSync(path.join(BACKUP_DIR, f)).birthtime,
      }))
      .sort((a, b) => new Date(b.created) - new Date(a.created));

    res.json(files);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Download backup
router.get('/download/:filename', auth, adminOnly, (req, res) => {
  try {
    const filePath = path.join(BACKUP_DIR, req.params.filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Backup not found' });
    }

    res.download(filePath);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete backup
router.delete('/:filename', auth, adminOnly, (req, res) => {
  try {
    const filePath = path.join(BACKUP_DIR, req.params.filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Backup not found' });
    }

    fs.unlinkSync(filePath);
    res.json({ message: 'Backup deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
