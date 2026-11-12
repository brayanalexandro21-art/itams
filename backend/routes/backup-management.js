const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');
const path = require('path');
const fs = require('fs');

// Listar backups
router.get('/', auth, adminOnly, (req, res) => {
  try {
    const backupsDir = path.join(__dirname, '../backups');
    const backups = [];
    
    if (fs.existsSync(backupsDir)) {
      const files = fs.readdirSync(backupsDir);
      files.forEach(file => {
        if (file.endsWith('.json')) {
          const stats = fs.statSync(path.join(backupsDir, file));
          backups.push({
            filename: file,
            size: Math.round(stats.size / 1024),
            created_at: stats.mtime,
          });
        }
      });
    }

    res.json(backups.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear backup
router.post('/create', auth, adminOnly, (req, res) => {
  try {
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    const backup = { created_at: new Date().toISOString(), version: 'ITAMS Backup v1', tables: {} };

    tables.forEach(t => {
      try {
        backup.tables[t.name] = db.prepare(`SELECT * FROM ${t.name}`).all();
      } catch (e) {
        backup.tables[t.name] = [];
      }
    });

    const backupsDir = path.join(__dirname, '../backups');
    if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir, { recursive: true });

    const filename = `backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    fs.writeFileSync(path.join(backupsDir, filename), JSON.stringify(backup, null, 2));

    // Redact sensitive data
    res.json({ filename, size: Math.round(JSON.stringify(backup).length / 1024) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar backup
router.delete('/:filename', auth, adminOnly, (req, res) => {
  try {
    const filepath = path.join(__dirname, '../backups', req.params.filename);
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }
    res.json({ message: 'Backup eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;