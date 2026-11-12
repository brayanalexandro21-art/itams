const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

// Get asset lifecycle
router.get('/:assetId', auth, (req, res) => {
  try {
    const asset = db.prepare('SELECT * FROM assets WHERE id = ?').get(req.params.assetId);
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    // Get lifecycle events
    const events = db.prepare(`
      SELECT ale.*, u.name as performed_by_name
      FROM asset_lifecycle_events ale
      LEFT JOIN users u ON ale.performed_by = u.id
      WHERE ale.asset_id = ?
      ORDER BY ale.event_date DESC
    `).all(req.params.assetId);

    // Calculate current value (depreciation)
    const depreciation = calculateDepreciation(asset);

    // Get maintenance history
    const maintenance = db.prepare(`
      SELECT am.*, u.name as performed_by_name
      FROM asset_maintenance am
      LEFT JOIN users u ON am.performed_by = u.id
      WHERE am.asset_id = ?
      ORDER BY am.maintenance_date DESC
    `).all(req.params.assetId);

    // Get related contracts
    const contracts = db.prepare(`
      SELECT c.id, c.name, c.contract_number, c.end_date
      FROM contracts c
      JOIN contract_assets ca ON c.id = ca.contract_id
      WHERE ca.asset_id = ?
    `).all(req.params.assetId);

    res.json({
      asset,
      lifecycle: events,
      depreciation,
      maintenance,
      contracts,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add lifecycle event
router.post('/:assetId/events', auth, (req, res) => {
  try {
    const { event_type, description, event_date, cost, notes } = req.body;

    const result = db.prepare(`
      INSERT INTO asset_lifecycle_events (asset_id, event_type, description, event_date, cost, notes, performed_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(req.params.assetId, event_type, description, event_date || new Date().toISOString(), cost, notes, req.user.id);

    const event = db.prepare('SELECT * FROM asset_lifecycle_events WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add maintenance record
router.post('/:assetId/maintenance', auth, (req, res) => {
  try {
    const {
      maintenance_type, description, maintenance_date,
      cost, performed_by_external, next_maintenance_date, notes
    } = req.body;

    const result = db.prepare(`
      INSERT INTO asset_maintenance (
        asset_id, maintenance_type, description, maintenance_date,
        cost, performed_by_external, next_maintenance_date, notes, performed_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.params.assetId, maintenance_type, description, maintenance_date,
      cost, performed_by_external, next_maintenance_date, notes, req.user.id
    );

    const maintenance = db.prepare('SELECT * FROM asset_maintenance WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(maintenance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get maintenance schedule
router.get('/maintenance/schedule', auth, (req, res) => {
  try {
    const { days_ahead = 30 } = req.query;

    const schedule = db.prepare(`
      SELECT am.*, a.name as asset_name, a.location
      FROM asset_maintenance am
      JOIN assets a ON am.asset_id = a.id
      WHERE am.next_maintenance_date BETWEEN DATE('now') AND DATE('now', '+' || ? || ' days')
      ORDER BY am.next_maintenance_date
    `).all(parseInt(days_ahead));

    res.json(schedule);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get depreciation report
router.get('/reports/depreciation', auth, adminOnly, (req, res) => {
  try {
    const assets = db.prepare(`
      SELECT id, name, type, purchase_date, purchase_cost, status
      FROM assets
      WHERE purchase_date IS NOT NULL AND purchase_cost IS NOT NULL
      ORDER BY purchase_date
    `).all();

    const report = assets.map(asset => ({
      ...asset,
      depreciation: calculateDepreciation(asset),
    }));

    const totalOriginalValue = report.reduce((sum, a) => sum + (a.purchase_cost || 0), 0);
    const totalCurrentValue = report.reduce((sum, a) => sum + (a.depreciation.currentValue || 0), 0);

    res.json({
      assets: report,
      summary: {
        total_assets: report.length,
        total_original_value: totalOriginalValue,
        total_current_value: totalCurrentValue,
        total_depreciation: totalOriginalValue - totalCurrentValue,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

function calculateDepreciation(asset) {
  if (!asset.purchase_date || !asset.purchase_cost) {
    return { currentValue: null, depreciation: null, yearsOld: null };
  }

  const purchaseDate = new Date(asset.purchase_date);
  const now = new Date();
  const yearsOld = (now - purchaseDate) / (365.25 * 24 * 60 * 60 * 1000);

  // Straight-line depreciation over 5 years
  const depreciationRate = 0.2; // 20% per year
  const currentValue = Math.max(0, asset.purchase_cost * (1 - (yearsOld * depreciationRate)));
  const totalDepreciation = asset.purchase_cost - currentValue;

  return {
    currentValue: Math.round(currentValue * 100) / 100,
    depreciation: Math.round(totalDepreciation * 100) / 100,
    yearsOld: Math.round(yearsOld * 10) / 10,
    depreciationRate: depreciationRate * 100,
  };
}

module.exports = router;
