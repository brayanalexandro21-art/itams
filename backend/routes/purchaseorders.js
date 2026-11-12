const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

// Get all purchase orders
router.get('/', auth, (req, res) => {
  try {
    const { status, vendor_id } = req.query;

    let query = `
      SELECT po.*, v.name as vendor_name, u.name as created_by_name
      FROM purchase_orders po
      LEFT JOIN vendors v ON po.vendor_id = v.id
      LEFT JOIN users u ON po.created_by = u.id
      WHERE 1=1
    `;

    const params = [];

    if (status) {
      query += ' AND po.status = ?';
      params.push(status);
    }
    if (vendor_id) {
      query += ' AND po.vendor_id = ?';
      params.push(vendor_id);
    }

    query += ' ORDER BY po.created_at DESC';

    const orders = db.prepare(query).all(...params);
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get purchase order by ID
router.get('/:id', auth, (req, res) => {
  try {
    const order = db.prepare(`
      SELECT po.*, v.name as vendor_name, v.email as vendor_email,
        u.name as created_by_name, ap.name as approved_by_name
      FROM purchase_orders po
      LEFT JOIN vendors v ON po.vendor_id = v.id
      LEFT JOIN users u ON po.created_by = u.id
      LEFT JOIN users ap ON po.approved_by = ap.id
      WHERE po.id = ?
    `).get(req.params.id);

    if (!order) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }

    // Get order items
    const items = db.prepare(`
      SELECT poi.*, a.name as asset_name, a.serial_number
      FROM purchase_order_items poi
      LEFT JOIN assets a ON poi.asset_id = a.id
      WHERE poi.purchase_order_id = ?
    `).all(req.params.id);

    res.json({ ...order, items });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create purchase order
router.post('/', auth, adminOnly, (req, res) => {
  try {
    const {
      vendor_id, description, expected_delivery, items,
      shipping_address, payment_terms, notes
    } = req.body;

    // Generate PO number
    const poCount = db.prepare('SELECT COUNT(*) as count FROM purchase_orders').get().count;
    const poNumber = `PO-${new Date().getFullYear()}-${(poCount + 1).toString().padStart(4, '0')}`;

    // Calculate total
    const total = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

    const result = db.prepare(`
      INSERT INTO purchase_orders (
        po_number, vendor_id, description, expected_delivery, total,
        shipping_address, payment_terms, notes, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      poNumber, vendor_id, description, expected_delivery, total,
      shipping_address, payment_terms, notes, req.user.id
    );

    const orderId = result.lastInsertRowid;

    // Insert order items
    const insertItem = db.prepare(`
      INSERT INTO purchase_order_items (
        purchase_order_id, description, quantity, unit_price, total, asset_id
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);

    items.forEach(item => {
      insertItem.run(
        orderId,
        item.description,
        item.quantity,
        item.unit_price,
        item.quantity * item.unit_price,
        item.asset_id || null
      );
    });

    const order = db.prepare('SELECT * FROM purchase_orders WHERE id = ?').get(orderId);
    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update purchase order status
router.put('/:id/status', auth, adminOnly, (req, res) => {
  try {
    const { status, approved_by } = req.body;

    let updateQuery = 'UPDATE purchase_orders SET status = ?, updated_at = CURRENT_TIMESTAMP';
    const params = [status];

    if (status === 'approved' && approved_by) {
      updateQuery += ', approved_by = ?, approved_at = CURRENT_TIMESTAMP';
      params.push(approved_by);
    }

    updateQuery += ' WHERE id = ?';
    params.push(req.params.id);

    db.prepare(updateQuery).run(...params);

    const order = db.prepare('SELECT * FROM purchase_orders WHERE id = ?').get(req.params.id);
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete purchase order
router.delete('/:id', auth, adminOnly, (req, res) => {
  try {
    const order = db.prepare('SELECT * FROM purchase_orders WHERE id = ?').get(req.params.id);
    if (order && order.status !== 'draft') {
      return res.status(400).json({ error: 'Can only delete draft orders' });
    }

    db.prepare('DELETE FROM purchase_order_items WHERE purchase_order_id = ?').run(req.params.id);
    db.prepare('DELETE FROM purchase_orders WHERE id = ?').run(req.params.id);
    res.json({ message: 'Purchase order deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get PO statistics
router.get('/stats/summary', auth, (req, res) => {
  try {
    const stats = {
      total: db.prepare('SELECT COUNT(*) as count FROM purchase_orders').get().count,
      draft: db.prepare("SELECT COUNT(*) as count FROM purchase_orders WHERE status = 'draft'").get().count,
      pending: db.prepare("SELECT COUNT(*) as count FROM purchase_orders WHERE status = 'pending'").get().count,
      approved: db.prepare("SELECT COUNT(*) as count FROM purchase_orders WHERE status = 'approved'").get().count,
      delivered: db.prepare("SELECT COUNT(*) as count FROM purchase_orders WHERE status = 'delivered'").get().count,
      total_value: db.prepare("SELECT SUM(total) as total FROM purchase_orders WHERE status != 'cancelled'").get().total || 0,
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
