const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

// Get asset lifecycle dashboard
router.get('/dashboard', auth, (req, res) => {
  try {
    const dashboard = {
      summary: {
        total_assets: db.prepare('SELECT COUNT(*) as count FROM assets').get().count,
        total_value: db.prepare('SELECT SUM(purchase_cost) as total FROM assets WHERE purchase_cost IS NOT NULL').get().total || 0,
        average_age: calculateAverageAge(),
        warranty_expiring: db.prepare(`
          SELECT COUNT(*) as count FROM assets
          WHERE warranty_expiry BETWEEN DATE('now') AND DATE('now', '+90 days')
        `).get().count,
      },
      by_status: db.prepare(`
        SELECT status, COUNT(*) as count
        FROM assets
        GROUP BY status
      `).all(),
      by_type: db.prepare(`
        SELECT type, COUNT(*) as count
        FROM assets
        GROUP BY type
        ORDER BY count DESC
      `).all(),
      recent_events: db.prepare(`
        SELECT ale.*, a.name as asset_name, u.name as performed_by_name
        FROM asset_lifecycle_events ale
        LEFT JOIN assets a ON ale.asset_id = a.id
        LEFT JOIN users u ON ale.performed_by = u.id
        ORDER BY ale.event_date DESC
        LIMIT 10
      `).all(),
      upcoming_maintenance: db.prepare(`
        SELECT am.*, a.name as asset_name, a.location
        FROM asset_maintenance am
        JOIN assets a ON am.asset_id = a.id
        WHERE am.next_maintenance_date BETWEEN DATE('now') AND DATE('now', '+30 days')
        ORDER BY am.next_maintenance_date
        LIMIT 10
      `).all(),
    };

    res.json(dashboard);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get asset timeline
router.get('/:assetId/timeline', auth, (req, res) => {
  try {
    const timeline = db.prepare(`
      SELECT 
        'event' as item_type,
        ale.event_type as type,
        ale.description,
        ale.event_date as date,
        ale.cost,
        u.name as performed_by_name
      FROM asset_lifecycle_events ale
      LEFT JOIN users u ON ale.performed_by = u.id
      WHERE ale.asset_id = ?
      
      UNION ALL
      
      SELECT
        'maintenance' as item_type,
        am.maintenance_type as type,
        am.description,
        am.maintenance_date as date,
        am.cost,
        u.name as performed_by_name
      FROM asset_maintenance am
      LEFT JOIN users u ON am.performed_by = u.id
      WHERE am.asset_id = ?
      
      ORDER BY date DESC
    `).all(req.params.assetId, req.params.assetId);

    res.json(timeline);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bulk update assets
router.post('/bulk-update', auth, adminOnly, (req, res) => {
  try {
    const { asset_ids, updates } = req.body;

    if (!asset_ids || asset_ids.length === 0) {
      return res.status(400).json({ error: 'No assets selected' });
    }

    const { status, assigned_to, location, notes } = updates;

    let query = 'UPDATE assets SET updated_at = CURRENT_TIMESTAMP';
    const params = [];

    if (status) {
      query += ', status = ?';
      params.push(status);
    }
    if (assigned_to !== undefined) {
      query += ', assigned_to = ?';
      params.push(assigned_to);
    }
    if (location) {
      query += ', location = ?';
      params.push(location);
    }
    if (notes) {
      query += ', notes = ?';
      params.push(notes);
    }

    query += ` WHERE id IN (${asset_ids.map(() => '?').join(',')})`;
    params.push(...asset_ids);

    const result = db.prepare(query).run(...params);

    // Log bulk update
    db.prepare(`
      INSERT INTO audit_logs (user_id, action, entity_type, new_values)
      VALUES (?, 'bulk_update', 'assets', ?)
    `).run(req.user.id, JSON.stringify({ asset_ids, updates }));

    res.json({
      message: `${result.changes} assets updated`,
      affected: result.changes,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get asset health score
router.get('/:assetId/health', auth, (req, res) => {
  try {
    const asset = db.prepare('SELECT * FROM assets WHERE id = ?').get(req.params.assetId);
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    const health = calculateAssetHealth(asset);
    res.json(health);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get maintenance schedule
router.get('/maintenance/schedule', auth, (req, res) => {
  try {
    const { days_ahead = 30, asset_type } = req.query;

    let query = `
      SELECT am.*, a.name as asset_name, a.type as asset_type, a.location
      FROM asset_maintenance am
      JOIN assets a ON am.asset_id = a.id
      WHERE am.next_maintenance_date BETWEEN DATE('now') AND DATE('now', '+' || ? || ' days')
    `;

    const params = [parseInt(days_ahead)];

    if (asset_type) {
      query += ' AND a.type = ?';
      params.push(asset_type);
    }

    query += ' ORDER BY am.next_maintenance_date';

    const schedule = db.prepare(query).all(...params);
    res.json(schedule);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get asset cost analysis
router.get('/analysis/costs', auth, adminOnly, (req, res) => {
  try {
    const analysis = {
      total_purchase_cost: db.prepare('SELECT SUM(purchase_cost) as total FROM assets WHERE purchase_cost IS NOT NULL').get().total || 0,
      total_maintenance_cost: db.prepare('SELECT SUM(cost) as total FROM asset_maintenance WHERE cost IS NOT NULL').get().total || 0,
      cost_by_type: db.prepare(`
        SELECT type, SUM(purchase_cost) as total_cost, COUNT(*) as count
        FROM assets
        WHERE purchase_cost IS NOT NULL
        GROUP BY type
        ORDER BY total_cost DESC
      `).all(),
      cost_by_year: db.prepare(`
        SELECT strftime('%Y', purchase_date) as year, SUM(purchase_cost) as total_cost, COUNT(*) as count
        FROM assets
        WHERE purchase_date IS NOT NULL AND purchase_cost IS NOT NULL
        GROUP BY strftime('%Y', purchase_date)
        ORDER BY year DESC
      `).all(),
      maintenance_cost_by_type: db.prepare(`
        SELECT a.type, SUM(am.cost) as total_cost, COUNT(*) as count
        FROM asset_maintenance am
        JOIN assets a ON am.asset_id = a.id
        WHERE am.cost IS NOT NULL
        GROUP BY a.type
        ORDER BY total_cost DESC
      `).all(),
    };

    res.json(analysis);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

function calculateAverageAge() {
  const assets = db.prepare('SELECT purchase_date FROM assets WHERE purchase_date IS NOT NULL').all();
  if (assets.length === 0) return 0;

  const now = new Date();
  const totalAge = assets.reduce((sum, asset) => {
    const age = (now - new Date(asset.purchase_date)) / (365.25 * 24 * 60 * 60 * 1000);
    return sum + age;
  }, 0);

  return Math.round((totalAge / assets.length) * 10) / 10;
}

function calculateAssetHealth(asset) {
  let score = 100;
  const issues = [];

  // Check age
  if (asset.purchase_date) {
    const age = (new Date() - new Date(asset.purchase_date)) / (365.25 * 24 * 60 * 60 * 1000);
    if (age > 5) {
      score -= 20;
      issues.push('Asset is over 5 years old');
    } else if (age > 3) {
      score -= 10;
      issues.push('Asset is over 3 years old');
    }
  }

  // Check warranty
  if (asset.warranty_expiry) {
    const warrantyEnd = new Date(asset.warranty_expiry);
    if (warrantyEnd < new Date()) {
      score -= 15;
      issues.push('Warranty has expired');
    } else if (warrantyEnd < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)) {
      score -= 5;
      issues.push('Warranty expiring soon');
    }
  }

  // Check status
  if (asset.status === 'maintenance') {
    score -= 25;
    issues.push('Asset is under maintenance');
  } else if (asset.status === 'retired') {
    score = 0;
    issues.push('Asset is retired');
  }

  // Check last maintenance
  const lastMaintenance = db.prepare(`
    SELECT maintenance_date FROM asset_maintenance
    WHERE asset_id = ?
    ORDER BY maintenance_date DESC
    LIMIT 1
  `).get(asset.id);

  if (lastMaintenance) {
    const daysSinceMaintenance = (new Date() - new Date(lastMaintenance.maintenance_date)) / (24 * 60 * 60 * 1000);
    if (daysSinceMaintenance > 365) {
      score -= 10;
      issues.push('No maintenance in over a year');
    }
  }

  return {
    score: Math.max(0, score),
    issues,
    recommendation: score < 50 ? 'Consider replacement' : score < 75 ? 'Schedule maintenance' : 'Good condition',
  };
}

module.exports = router;
