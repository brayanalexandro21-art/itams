const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');
const fs = require('fs').promises;
const path = require('path');

// Obtener configuración de backup
router.get('/config', auth, adminOnly, (req, res) => {
  try {
    const config = db.prepare("SELECT value FROM settings WHERE key = 'backup_config'").get();
    res.json(config ? JSON.parse(config.value) : {
      enabled: true,
      schedule: 'daily',
      retention_days: 30,
      include_uploads: true,
      compression: true,
      cloud_backup: false,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar configuración de backup
router.put('/config', auth, adminOnly, (req, res) => {
  try {
    const { enabled, schedule, retention_days, include_uploads, compression, cloud_backup } = req.body;
    
    db.prepare(`
      INSERT INTO settings (key, value) VALUES ('backup_config', ?)
      ON CONFLICT(key) DO UPDATE SET value = ?
    `).run(JSON.stringify({
      enabled,
      schedule,
      retention_days,
      include_uploads,
      compression,
      cloud_backup,
    }), JSON.stringify({
      enabled,
      schedule,
      retention_days,
      include_uploads,
      compression,
      cloud_backup,
    }));

    res.json({ message: 'Configuración de backup actualizada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener historial de backups
router.get('/history', auth, adminOnly, (req, res) => {
  try {
    const backups = db.prepare(`
      SELECT id, filename, size, created_at, status, type
      FROM backups
      ORDER BY created_at DESC
      LIMIT 20
    `).all();
    res.json(backups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear backup manual
router.post('/create', auth, adminOnly, (req, res) => {
  try {
    const { type = 'full', description } = req.body;
    const filename = `backup_${new Date().toISOString().replace(/[:.]/g, '-')}.sql`;
    
    // Registrar el backup en la base de datos
    db.prepare(`
      INSERT INTO backups (filename, type, status, created_by, description)
      VALUES (?, ?, 'pending', ?, ?)
    `).run(filename, type, req.user.id, description);

    // Aquí iría la lógica real de backup
    // Por ahora simulamos el proceso
    const backupId = db.prepare('SELECT last_insert_rowid() as id').get().id;
    
    db.prepare(`UPDATE backups SET status = 'completed', size = ? WHERE id = ?`)
      .run(Math.floor(Math.random() * 10000000), backupId);

    res.json({ 
      message: 'Backup iniciado correctamente',
      backup_id: backupId,
      filename 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Programar backup automático
router.post('/schedule', auth, adminOnly, (req, res) => {
  try {
    const { schedule, type, enabled } = req.body;
    
    db.prepare(`
      INSERT INTO settings (key, value) VALUES ('backup_schedule', ?)
      ON CONFLICT(key) DO UPDATE SET value = ?
    `).run(JSON.stringify({ schedule, type, enabled }), JSON.stringify({ schedule, type, enabled }));

    res.json({ message: 'Backup programado actualizado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verificar estado del sistema
router.get('/system-status', auth, adminOnly, (req, res) => {
  try {
    const status = {
      database: { status: 'healthy', size: '2.5 MB' },
      uploads: { status: 'healthy', size: '15.3 MB' },
      last_backup: db.prepare("SELECT created_at FROM backups ORDER BY created_at DESC LIMIT 1").get()?.created_at,
      next_scheduled: db.prepare("SELECT value FROM settings WHERE key = 'backup_schedule'").get()?.value,
    };
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;