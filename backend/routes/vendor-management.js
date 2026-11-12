const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

// Listar proveedores
router.get('/', auth, (req, res) => {
  try {
    const { category, search } = req.query;
    let query = 'SELECT * FROM vendors WHERE 1=1';
    const params = [];

    if (category) { query += ' AND category = ?'; params.push(category); }
    if (search) { query += ' AND (name LIKE ? OR email LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }

    query += ' ORDER BY name';
    const vendors = db.prepare(query).all(...params);
    res.json(vendors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener proveedor por ID
router.get('/:id', auth, (req, res) => {
  try {
    const vendor = db.prepare('SELECT * FROM vendors WHERE id = ?').get(req.params.id);
    if (!vendor) return res.status(404).json({ error: 'Proveedor no encontrado' });

    const ratings = db.prepare(`
      SELECT AVG(quality) as avg_quality, AVG(delivery) as avg_delivery, AVG(price) as avg_price
      FROM vendor_ratings WHERE vendor_id = ?
    `).get(req.params.id);

    const contracts = db.prepare('SELECT * FROM contracts WHERE vendor_id = ?').all(req.params.id);

    res.json({ ...vendor, ratings, contracts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear proveedor
router.post('/', auth, adminOnly, (req, res) => {
  try {
    const { name, email, phone, address, category, website, notes } = req.body;
    const result = db.prepare(`
      INSERT INTO vendors (name, email, phone, address, category, website, notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(name, email, phone, address, category, website, notes, req.user.id);
    res.json({ id: result.lastInsertRowid, name });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar proveedor
router.put('/:id', auth, adminOnly, (req, res) => {
  try {
    const { name, email, phone, address, category, website, notes } = req.body;
    db.prepare(`
      UPDATE vendors SET name = ?, email = ?, phone = ?, address = ?, category = ?, website = ?, notes = ?
      WHERE id = ?
    `).run(name, email, phone, address, category, website, notes, req.params.id);
    res.json({ message: 'Proveedor actualizado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar proveedor
router.delete('/:id', auth, adminOnly, (req, res) => {
  try {
    db.prepare('DELETE FROM vendors WHERE id = ?').run(req.params.id);
    res.json({ message: 'Proveedor eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Calificar proveedor
router.post('/:id/rate', auth, (req, res) => {
  try {
    const { quality, delivery, price, comments } = req.body;
    const result = db.prepare(`
      INSERT INTO vendor_ratings (vendor_id, quality_rating, delivery_rating, price_rating, comment, user_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(req.params.id, quality, delivery, price, comments, req.user.id);
    res.json({ id: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener calificaciones del proveedor
router.get('/:id/ratings', auth, (req, res) => {
  try {
    const ratings = db.prepare(`
      SELECT vr.*, u.name as rated_by_name
      FROM vendor_ratings vr
      LEFT JOIN users u ON vr.rated_by = u.id
      WHERE vr.vendor_id = ?
      ORDER BY vr.created_at DESC
    `).all(req.params.id);
    res.json(ratings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;