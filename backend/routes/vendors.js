const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

// Get all vendors
router.get('/', auth, (req, res) => {
  try {
    const { category, search } = req.query;

    let query = `
      SELECT v.*,
        (SELECT COUNT(*) FROM contracts WHERE vendor_id = v.id) as contract_count,
        (SELECT COUNT(*) FROM purchase_orders WHERE vendor_id = v.id) as po_count
      FROM vendors v
      WHERE 1=1
    `;

    const params = [];

    if (category) {
      query += ' AND v.category = ?';
      params.push(category);
    }
    if (search) {
      query += ' AND (v.name LIKE ? OR v.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY v.name';

    const vendors = db.prepare(query).all(...params);
    res.json(vendors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get vendor by ID
router.get('/:id', auth, (req, res) => {
  try {
    const vendor = db.prepare('SELECT * FROM vendors WHERE id = ?').get(req.params.id);
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    // Get contracts
    const contracts = db.prepare(`
      SELECT id, name, contract_number, status, end_date, value
      FROM contracts WHERE vendor_id = ?
      ORDER BY end_date DESC
    `).all(req.params.id);

    // Get purchase orders
    const purchaseOrders = db.prepare(`
      SELECT id, po_number, status, total, created_at
      FROM purchase_orders WHERE vendor_id = ?
      ORDER BY created_at DESC
      LIMIT 10
    `).all(req.params.id);

    // Get vendor ratings
    const ratings = db.prepare(`
      SELECT AVG(quality_rating) as avg_quality,
             AVG(delivery_rating) as avg_delivery,
             AVG(price_rating) as avg_price,
             COUNT(*) as total_ratings
      FROM vendor_ratings WHERE vendor_id = ?
    `).get(req.params.id);

    res.json({ ...vendor, contracts, purchaseOrders, ratings });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create vendor
router.post('/', auth, adminOnly, (req, res) => {
  try {
    const {
      name, description, category, contact_name, email, phone,
      address, website, tax_id, payment_terms
    } = req.body;

    const result = db.prepare(`
      INSERT INTO vendors (
        name, description, category, contact_name, email, phone,
        address, website, tax_id, payment_terms, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      name, description, category, contact_name, email, phone,
      address, website, tax_id, payment_terms, req.user.id
    );

    const vendor = db.prepare('SELECT * FROM vendors WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(vendor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update vendor
router.put('/:id', auth, adminOnly, (req, res) => {
  try {
    const {
      name, description, category, contact_name, email, phone,
      address, website, tax_id, payment_terms, status
    } = req.body;

    db.prepare(`
      UPDATE vendors
      SET name = COALESCE(?, name),
          description = COALESCE(?, description),
          category = COALESCE(?, category),
          contact_name = COALESCE(?, contact_name),
          email = COALESCE(?, email),
          phone = COALESCE(?, phone),
          address = COALESCE(?, address),
          website = COALESCE(?, website),
          tax_id = COALESCE(?, tax_id),
          payment_terms = COALESCE(?, payment_terms),
          status = COALESCE(?, status),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      name, description, category, contact_name, email, phone,
      address, website, tax_id, payment_terms, status, req.params.id
    );

    const vendor = db.prepare('SELECT * FROM vendors WHERE id = ?').get(req.params.id);
    res.json(vendor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete vendor
router.delete('/:id', auth, adminOnly, (req, res) => {
  try {
    // Check if vendor has contracts
    const contracts = db.prepare('SELECT COUNT(*) as count FROM contracts WHERE vendor_id = ?').get(req.params.id).count;
    if (contracts > 0) {
      return res.status(400).json({ error: 'Cannot delete vendor with active contracts' });
    }

    db.prepare('DELETE FROM vendors WHERE id = ?').run(req.params.id);
    res.json({ message: 'Vendor deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add vendor rating
router.post('/:id/ratings', auth, (req, res) => {
  try {
    const { quality_rating, delivery_rating, price_rating, comment } = req.body;

    const result = db.prepare(`
      INSERT INTO vendor_ratings (vendor_id, user_id, quality_rating, delivery_rating, price_rating, comment)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(req.params.id, req.user.id, quality_rating, delivery_rating, price_rating, comment);

    res.status(201).json({ id: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get vendor categories
router.get('/meta/categories', auth, (req, res) => {
  try {
    const categories = db.prepare(`
      SELECT DISTINCT category FROM vendors WHERE category IS NOT NULL ORDER BY category
    `).all();
    res.json(categories.map(c => c.category));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
