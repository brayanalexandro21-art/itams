const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

// Listar órdenes de compra
router.get('/', auth, (req, res) => {
  try {
    const { status, vendor_id } = req.query;
    let query = `
      SELECT po.*, v.name as vendor_name,
        (SELECT SUM(quantity * unit_price) FROM purchase_order_items WHERE order_id = po.id) as total
      FROM purchase_orders po
      LEFT JOIN vendors v ON po.vendor_id = v.id
      WHERE 1=1
    `;
    const params = [];

    if (status) { query += ' AND po.status = ?'; params.push(status); }
    if (vendor_id) { query += ' AND po.vendor_id = ?'; params.push(vendor_id); }

    query += ' ORDER BY po.created_at DESC';
    const orders = db.prepare(query).all(...params);
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener orden por ID con items
router.get('/:id', auth, (req, res) => {
  try {
    const order = db.prepare(`
      SELECT po.*, v.name as vendor_name
      FROM purchase_orders po
      LEFT JOIN vendors v ON po.vendor_id = v.id
      WHERE po.id = ?
    `).get(req.params.id);
    
    if (!order) return res.status(404).json({ error: 'Orden no encontrada' });

    const items = db.prepare('SELECT * FROM purchase_order_items WHERE order_id = ?').all(req.params.id);
    res.json({ ...order, items });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear orden de compra
router.post('/', auth, adminOnly, (req, res) => {
  try {
    const { vendor_id, description, expected_date, items } = req.body;
    
    // Auto-numbering: PO-{year}-{sequence}
    const year = new Date().getFullYear();
    const lastOrder = db.prepare(`
      SELECT order_number FROM purchase_orders WHERE order_number LIKE ?
      ORDER BY id DESC LIMIT 1
    `).get(`PO-${year}-%`);
    
    let sequence = 1;
    if (lastOrder) {
      const lastSeq = parseInt(lastOrder.order_number.split('-')[2]);
      sequence = lastSeq + 1;
    }
    const orderNumber = `PO-${year}-${String(sequence).padStart(4, '0')}`;

    const result = db.prepare(`
      INSERT INTO purchase_orders (po_number, vendor_id, description, expected_delivery, status, created_by)
      VALUES (?, ?, ?, ?, 'pending', ?)
    `).run(orderNumber, vendor_id, description, expected_date, req.user.id);

    if (items && items.length > 0) {
      const insertItem = db.prepare(`
        INSERT INTO purchase_order_items (purchase_order_id, description, quantity, unit_price)
        VALUES (?, ?, ?, ?)
      `);
      items.forEach(item => {
        insertItem.run(result.lastInsertRowid, item.description, item.quantity, item.unit_price);
      });
    }

    res.json({ id: result.lastInsertRowid, order_number: orderNumber });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar estado de orden
router.put('/:id/status', auth, adminOnly, (req, res) => {
  try {
    const { status } = req.body;
    db.prepare('UPDATE purchase_orders SET status = ? WHERE id = ?').run(status, req.params.id);
    res.json({ message: 'Estado actualizado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cancelar orden
router.post('/:id/cancel', auth, adminOnly, (req, res) => {
  try {
    db.prepare("UPDATE purchase_orders SET status = 'cancelled' WHERE id = ?").run(req.params.id);
    res.json({ message: 'Orden cancelada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;