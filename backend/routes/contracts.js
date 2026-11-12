const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

// Get all contracts
router.get('/', auth, (req, res) => {
  try {
    const { status, vendor_id, expiring_soon } = req.query;

    let query = `
      SELECT c.*, v.name as vendor_name,
        (SELECT COUNT(*) FROM contract_assets WHERE contract_id = c.id) as asset_count
      FROM contracts c
      LEFT JOIN vendors v ON c.vendor_id = v.id
      WHERE 1=1
    `;

    const params = [];

    if (status) {
      query += ' AND c.status = ?';
      params.push(status);
    }
    if (vendor_id) {
      query += ' AND c.vendor_id = ?';
      params.push(vendor_id);
    }
    if (expiring_soon === 'true') {
      query += " AND c.end_date <= DATE('now', '+30 days') AND c.end_date >= DATE('now')";
    }

    query += ' ORDER BY c.end_date ASC';

    const contracts = db.prepare(query).all(...params);
    res.json(contracts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get contract by ID
router.get('/:id', auth, (req, res) => {
  try {
    const contract = db.prepare(`
      SELECT c.*, v.name as vendor_name, v.email as vendor_email, v.phone as vendor_phone
      FROM contracts c
      LEFT JOIN vendors v ON c.vendor_id = v.id
      WHERE c.id = ?
    `).get(req.params.id);

    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    // Get associated assets
    const assets = db.prepare(`
      SELECT a.id, a.name, a.type, a.serial_number
      FROM assets a
      JOIN contract_assets ca ON a.id = ca.asset_id
      WHERE ca.contract_id = ?
    `).all(req.params.id);

    // Get contract history
    const history = db.prepare(`
      SELECT * FROM contract_history
      WHERE contract_id = ?
      ORDER BY created_at DESC
      LIMIT 10
    `).all(req.params.id);

    res.json({ ...contract, assets, history });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create contract
router.post('/', auth, adminOnly, (req, res) => {
  try {
    const {
      name, description, vendor_id, contract_number,
      start_date, end_date, value, type, auto_renew,
      renewal_period, notification_days, terms
    } = req.body;

    const result = db.prepare(`
      INSERT INTO contracts (
        name, description, vendor_id, contract_number, start_date, end_date,
        value, type, auto_renew, renewal_period, notification_days, terms, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      name, description, vendor_id, contract_number, start_date, end_date,
      value, type, auto_renew ? 1 : 0, renewal_period, notification_days || 30, terms, req.user.id
    );

    const contract = db.prepare('SELECT * FROM contracts WHERE id = ?').get(result.lastInsertRowid);

    // Log contract creation
    db.prepare(`
      INSERT INTO contract_history (contract_id, action, performed_by, details)
      VALUES (?, 'created', ?, 'Contract created')
    `).run(result.lastInsertRowid, req.user.id);

    res.status(201).json(contract);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update contract
router.put('/:id', auth, adminOnly, (req, res) => {
  try {
    const {
      name, description, vendor_id, contract_number,
      start_date, end_date, value, type, status, auto_renew,
      renewal_period, notification_days, terms
    } = req.body;

    db.prepare(`
      UPDATE contracts
      SET name = COALESCE(?, name),
          description = COALESCE(?, description),
          vendor_id = COALESCE(?, vendor_id),
          contract_number = COALESCE(?, contract_number),
          start_date = COALESCE(?, start_date),
          end_date = COALESCE(?, end_date),
          value = COALESCE(?, value),
          type = COALESCE(?, type),
          status = COALESCE(?, status),
          auto_renew = COALESCE(?, auto_renew),
          renewal_period = COALESCE(?, renewal_period),
          notification_days = COALESCE(?, notification_days),
          terms = COALESCE(?, terms),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      name, description, vendor_id, contract_number, start_date, end_date,
      value, type, status, auto_renew, renewal_period, notification_days, terms, req.params.id
    );

    const contract = db.prepare('SELECT * FROM contracts WHERE id = ?').get(req.params.id);
    res.json(contract);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete contract
router.delete('/:id', auth, adminOnly, (req, res) => {
  try {
    db.prepare('DELETE FROM contract_assets WHERE contract_id = ?').run(req.params.id);
    db.prepare('DELETE FROM contracts WHERE id = ?').run(req.params.id);
    res.json({ message: 'Contract deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Associate asset with contract
router.post('/:id/assets', auth, adminOnly, (req, res) => {
  try {
    const { asset_ids } = req.body;

    const insert = db.prepare('INSERT OR IGNORE INTO contract_assets (contract_id, asset_id) VALUES (?, ?)');
    asset_ids.forEach(assetId => {
      insert.run(req.params.id, assetId);
    });

    res.json({ message: 'Assets associated with contract' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Remove asset from contract
router.delete('/:id/assets/:assetId', auth, adminOnly, (req, res) => {
  try {
    db.prepare('DELETE FROM contract_assets WHERE contract_id = ? AND asset_id = ?')
      .run(req.params.id, req.params.assetId);
    res.json({ message: 'Asset removed from contract' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get contract statistics
router.get('/stats/summary', auth, (req, res) => {
  try {
    const stats = {
      total: db.prepare('SELECT COUNT(*) as count FROM contracts').get().count,
      active: db.prepare("SELECT COUNT(*) as count FROM contracts WHERE status = 'active'").get().count,
      expiring_soon: db.prepare(`
        SELECT COUNT(*) as count FROM contracts
        WHERE end_date <= DATE('now', '+30 days') AND end_date >= DATE('now')
      `).get().count,
      expired: db.prepare("SELECT COUNT(*) as count FROM contracts WHERE end_date < DATE('now')").get().count,
      total_value: db.prepare("SELECT SUM(value) as total FROM contracts WHERE status = 'active'").get().total || 0,
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
