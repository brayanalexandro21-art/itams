const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

// Listar contratos con filtros
router.get('/', auth, (req, res) => {
  try {
    const { status, vendor_id } = req.query;
    let query = `
      SELECT c.*, v.name as vendor_name,
        (SELECT COUNT(*) FROM contract_assets WHERE contract_id = c.id) as asset_count
      FROM contracts c
      LEFT JOIN vendors v ON c.vendor_id = v.id
      WHERE 1=1
    `;
    const params = [];

    if (status) { query += ' AND c.status = ?'; params.push(status); }
    if (vendor_id) { query += ' AND c.vendor_id = ?'; params.push(vendor_id); }

    query += ' ORDER BY c.end_date ASC';
    const contracts = db.prepare(query).all(...params);
    res.json(contracts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear contrato
router.post('/', auth, adminOnly, (req, res) => {
  try {
    const { name, vendor_id, start_date, end_date, value, type, description, renewal_period } = req.body;
    const result = db.prepare(`
      INSERT INTO contracts (name, vendor_id, start_date, end_date, value, type, description, renewal_period, status, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)
    `).run(name, vendor_id, start_date, end_date, value, type, description, renewal_period || 12, req.user.id);
    res.json({ id: result.lastInsertRowid, name });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar contrato
router.put('/:id', auth, adminOnly, (req, res) => {
  try {
    const { name, vendor_id, end_date, value, type, description, status } = req.body;
    db.prepare(`
      UPDATE contracts SET name = ?, vendor_id = ?, end_date = ?, value = ?, type = ?, description = ?, status = ?
      WHERE id = ?
    `).run(name, vendor_id, end_date, value, type, description, status, req.params.id);
    res.json({ message: 'Contrato actualizado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Contratos próximos a vencer
router.get('/expiring', auth, (req, res) => {
  try {
    const { days = 30 } = req.query;
    const contracts = db.prepare(`
      SELECT c.*, v.name as vendor_name
      FROM contracts c
      LEFT JOIN vendors v ON c.vendor_id = v.id
      WHERE c.end_date <= date('now', '+' || ? || ' days')
        AND c.end_date >= date('now')
        AND c.status = 'active'
      ORDER BY c.end_date ASC
    `).all(days);
    res.json(contracts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Renovar contrato
router.post('/:id/renew', auth, adminOnly, (req, res) => {
  try {
    const contract = db.prepare('SELECT * FROM contracts WHERE id = ?').get(req.params.id);
    if (!contract) return res.status(404).json({ error: 'Contrato no encontrado' });

    const newEndDate = new Date(contract.end_date);
    newEndDate.setMonth(newEndDate.getMonth() + contract.renewal_period);

    db.prepare(`
      UPDATE contracts SET end_date = ?, status = 'active' WHERE id = ?
    `).run(newEndDate.toISOString().split('T')[0], req.params.id);

    db.prepare(`
      INSERT INTO contract_history (contract_id, action, details, performed_by)
      VALUES (?, 'renewed', ?, ?)
    `).run(req.params.id, `Renovado hasta ${newEndDate.toISOString().split('T')[0]}`, req.user.id);

    res.json({ message: 'Contrato renovado', new_end_date: newEndDate.toISOString().split('T')[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;