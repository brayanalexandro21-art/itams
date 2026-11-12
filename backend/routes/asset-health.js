const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth } = require('../middleware/auth');

// Dashboard de salud de activos
router.get('/dashboard', auth, (req, res) => {
  try {
    const total = db.prepare('SELECT COUNT(*) as count FROM assets').get().count;
    const healthy = db.prepare("SELECT COUNT(*) as count FROM assets WHERE status = 'available'").get().count;
    const inUse = db.prepare("SELECT COUNT(*) as count FROM assets WHERE status = 'in_use'").get().count;
    const maintenance = db.prepare("SELECT COUNT(*) as count FROM assets WHERE status = 'maintenance'").get().count;
    const retired = db.prepare("SELECT COUNT(*) as count FROM assets WHERE status = 'retired'").get().count;

    const byAge = db.prepare(`
      SELECT 
        CASE
          WHEN julianday('now') - julianday(purchase_date) < 365 THEN 'new'
          WHEN julianday('now') - julianday(purchase_date) < 1095 THEN 'mid'
          ELSE 'old'
        END as age_group,
        COUNT(*) as count
      FROM assets WHERE purchase_date IS NOT NULL
      GROUP BY age_group
    `).all();

    const byType = db.prepare('SELECT type, COUNT(*) as count FROM assets GROUP BY type ORDER BY count DESC').all();

    const needsMaintenance = db.prepare(`
      SELECT a.id, a.name, a.type, a.location, a.last_maintenance,
        julianday('now') - julianday(a.last_maintenance) as days_since_maintenance
      FROM assets a
      WHERE a.last_maintenance IS NOT NULL
        AND julianday('now') - julianday(a.last_maintenance) > 180
      ORDER BY days_since_maintenance DESC
      LIMIT 10
    `).all();

    const expiringWarranty = db.prepare(`
      SELECT a.id, a.name, a.type, a.warranty_expiry,
        julianday(a.warranty_expiry) - julianday('now') as days_left
      FROM assets a
      WHERE a.warranty_expiry IS NOT NULL
        AND a.warranty_expiry >= date('now')
        AND julianday(a.warranty_expiry) - julianday('now') < 90
      ORDER BY days_left ASC
      LIMIT 10
    `).all();

    const avgHealth = db.prepare(`
      SELECT 
        AVG(CASE 
          WHEN julianday('now') - julianday(purchase_date) > 1825 THEN 30
          WHEN julianday('now') - julianday(purchase_date) > 1095 THEN 60
          ELSE 90
        END) as score
      FROM assets WHERE purchase_date IS NOT NULL
    `).get();

    res.json({
      summary: { total, healthy, in_use: inUse, maintenance, retired },
      health_score: Math.round(avgHealth?.score || 75),
      byAge,
      byType,
      needsMaintenance,
      expiringWarranty,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health score de un activo específico
router.get('/:id', auth, (req, res) => {
  try {
    const asset = db.prepare('SELECT * FROM assets WHERE id = ?').get(req.params.id);
    if (!asset) return res.status(404).json({ error: 'Activo no encontrado' });

    let score = 100;
    const ageDays = asset.purchase_date ? Math.max(0, julianday('now') - julianday(asset.purchase_date)) : 0;
    
    if (ageDays > 1825) score -= 30;
    else if (ageDays > 1095) score -= 15;
    else if (ageDays > 365) score -= 5;

    if (asset.warranty_expiry && new Date(asset.warranty_expiry) < new Date()) score -= 15;
    if (asset.status === 'maintenance') score -= 20;
    if (asset.last_maintenance) {
      const daysSince = julianday('now') - julianday(asset.last_maintenance);
      if (daysSince > 180) score -= 15;
    }

    const history = db.prepare(`
      SELECT * FROM asset_lifecycle_events WHERE asset_id = ?
      ORDER BY created_at DESC LIMIT 10
    `).all(req.params.id);

    res.json({ asset, health_score: Math.max(0, Math.min(100, score)), age_days: Math.round(ageDays), history });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;