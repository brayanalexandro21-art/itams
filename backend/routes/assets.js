const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');
const path = require('path');
const { createUpload, persistFile } = require('../storage');

// Fotos propias de cada activo (Cloudinary en la nube, uploads/assets en local)
const subirFotos = createUpload({
  folder: 'assets',
  prefix: 'asset_',
  limits: { fileSize: 3 * 1024 * 1024 }, // 3 MB por foto
  fileFilter: (req, file, cb) => {
    const permitido = /jpeg|jpg|png|gif|webp/;
    cb(null, permitido.test(path.extname(file.originalname).toLowerCase()) && permitido.test(file.mimetype));
  },
});

// Normaliza la lista de fotos del formulario: solo URLs, máximo 8. null = no cambiar.
const listaFotos = (fotos) => {
  if (fotos === undefined || fotos === null) return null;
  let arr = fotos;
  if (!Array.isArray(arr)) {
    try { arr = JSON.parse(arr); } catch { arr = []; }
  }
  if (!Array.isArray(arr)) arr = [];
  return JSON.stringify(arr.filter((u) => typeof u === 'string' && /^(https?:\/\/|\/uploads\/)/.test(u)).slice(0, 8));
};

// Subir fotos de un activo (devuelve las URLs; se guardan al crear o editar el activo)
router.post('/upload-photos', auth, adminOnly, subirFotos.array('images', 8), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No se recibieron imágenes válidas (JPG, PNG, GIF o WEBP de hasta 3 MB)' });
    }
    const guardadas = await Promise.all(req.files.map((f) => persistFile(f, 'assets', 'asset_')));
    res.json({ urls: guardadas.map((g) => g.url) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all assets
router.get('/', auth, (req, res) => {
  try {
    const { type, status, category } = req.query;
    let query = `
      SELECT a.*, u.name as assigned_to_name
      FROM assets a
      LEFT JOIN users u ON a.assigned_to = u.id
    `;

    const params = [];
    const conditions = [];

    if (type) {
      conditions.push('a.type = ?');
      params.push(type);
    }
    if (status) {
      conditions.push('a.status = ?');
      params.push(status);
    }
    if (category) {
      conditions.push('a.category = ?');
      params.push(category);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY a.created_at DESC';

    const assets = db.prepare(query).all(...params);
    res.json(assets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get asset by ID
router.get('/:id', auth, (req, res) => {
  try {
    const asset = db.prepare(`
      SELECT a.*, u.name as assigned_to_name
      FROM assets a
      LEFT JOIN users u ON a.assigned_to = u.id
      WHERE a.id = ?
    `).get(req.params.id);

    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    // Get related tickets
    const tickets = db.prepare(`
      SELECT id, title, status, priority, created_at
      FROM tickets
      WHERE asset_id = ?
      ORDER BY created_at DESC
      LIMIT 5
    `).all(req.params.id);

    res.json({ ...asset, tickets });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create asset
router.post('/', auth, adminOnly, (req, res) => {
  try {
    const { name, type, category, serial_number, model, manufacturer, status, location, purchase_date, warranty_expiry, notes,
      status_id, location_id, type_id, manufacturer_id, model_id, network_id, update_source_id, responsible_group_id, group_id,
      alt_username_number, alt_username, inventory_number, uuid, user_id,
      assigned_to, purchase_cost, currency_code, photos } = req.body;

    const result = db.prepare(`
      INSERT INTO assets (name, type, category, serial_number, model, manufacturer, status, location, purchase_date, warranty_expiry, notes,
        status_id, location_id, type_id, manufacturer_id, model_id, network_id, update_source_id, responsible_group_id, group_id,
        alt_username_number, alt_username, inventory_number, uuid, assigned_to, purchase_cost, currency_code, photos)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(name, type || 'computer', category || 'hardware', serial_number, model, manufacturer, status || 'available', location,
      purchase_date, warranty_expiry, notes,
      status_id || null, location_id || null, type_id || null, manufacturer_id || null, model_id || null, network_id || null,
      update_source_id || null, responsible_group_id || null, group_id || null,
      alt_username_number, alt_username, inventory_number, uuid,
      user_id || assigned_to || null, purchase_cost || null, currency_code || 'USD', listaFotos(photos) || '[]');

    const asset = db.prepare('SELECT * FROM assets WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(asset);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update asset
router.put('/:id', auth, adminOnly, (req, res) => {
  try {
    const { name, type, category, serial_number, model, manufacturer, status, location, purchase_date, warranty_expiry, assigned_to, notes,
      status_id, location_id, type_id, manufacturer_id, model_id, network_id, update_source_id,
      responsible_group_id, group_id, alt_username_number, alt_username, inventory_number, uuid, photos } = req.body;

    db.prepare(`
      UPDATE assets
      SET name = COALESCE(?, name),
          type = COALESCE(?, type),
          category = COALESCE(?, category),
          serial_number = COALESCE(?, serial_number),
          model = COALESCE(?, model),
          manufacturer = COALESCE(?, manufacturer),
          status = COALESCE(?, status),
          location = COALESCE(?, location),
          purchase_date = COALESCE(?, purchase_date),
          warranty_expiry = COALESCE(?, warranty_expiry),
          assigned_to = COALESCE(?, assigned_to),
          notes = COALESCE(?, notes),
          status_id = COALESCE(?, status_id),
          location_id = COALESCE(?, location_id),
          type_id = COALESCE(?, type_id),
          manufacturer_id = COALESCE(?, manufacturer_id),
          model_id = COALESCE(?, model_id),
          network_id = COALESCE(?, network_id),
          update_source_id = COALESCE(?, update_source_id),
          responsible_group_id = COALESCE(?, responsible_group_id),
          group_id = COALESCE(?, group_id),
          alt_username_number = COALESCE(?, alt_username_number),
          alt_username = COALESCE(?, alt_username),
          inventory_number = COALESCE(?, inventory_number),
          uuid = COALESCE(?, uuid),
          photos = COALESCE(?, photos),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(name, type, category, serial_number, model, manufacturer, status, location, purchase_date, warranty_expiry, assigned_to, notes,
      status_id || null, location_id || null, type_id || null, manufacturer_id || null, model_id || null,
      network_id || null, update_source_id || null, responsible_group_id || null, group_id || null,
      alt_username_number, alt_username, inventory_number, uuid, listaFotos(photos), req.params.id);

    const asset = db.prepare(`
      SELECT a.*, u.name as assigned_to_name
      FROM assets a
      LEFT JOIN users u ON a.assigned_to = u.id
      WHERE a.id = ?
    `).get(req.params.id);

    res.json(asset);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete asset
router.delete('/:id', auth, adminOnly, (req, res) => {
  try {
    db.prepare('DELETE FROM assets WHERE id = ?').run(req.params.id);
    res.json({ message: 'Asset deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get asset stats
router.get('/stats/summary', auth, (req, res) => {
  try {
    const stats = {
      total: db.prepare('SELECT COUNT(*) as count FROM assets').get().count,
      available: db.prepare("SELECT COUNT(*) as count FROM assets WHERE status = 'available'").get().count,
      in_use: db.prepare("SELECT COUNT(*) as count FROM assets WHERE status = 'in_use'").get().count,
      maintenance: db.prepare("SELECT COUNT(*) as count FROM assets WHERE status = 'maintenance'").get().count,
      retired: db.prepare("SELECT COUNT(*) as count FROM assets WHERE status = 'retired'").get().count,
    };
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
