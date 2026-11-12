const express = require('express');
const router = express.Router();
const path = require('path');
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');
const { createUpload, persistFile } = require('../storage');

// Uploads de modelos (Cloudinary en la nube, uploads/models en local)
const upload = createUpload({
  folder: 'models',
  prefix: 'model_',
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    cb(null, ext && mime);
  }
});

// Upload de imagen individual
router.post('/upload', auth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No se proporcionó imagen o formato no válido' });
    const saved = await persistFile(req.file, 'models', 'model_');
    res.json({ url: saved.url, filename: saved.filename });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload múltiple
router.post('/upload-multiple', auth, upload.array('images', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'No se proporcionaron imágenes' });
    const saved = await Promise.all(req.files.map((f) => persistFile(f, 'models', 'model_')));
    const urls = saved.map((s) => s.url);
    res.json({ urls });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Listar modelos de computadora
router.get('/', auth, (req, res) => {
  try {
    const models = db.prepare(`
      SELECT acm.*, am.name as manufacturer_name
      FROM asset_computer_models acm
      LEFT JOIN asset_manufacturers am ON acm.manufacturer_id = am.id
      ORDER BY acm.name
    `).all();
    res.json(models);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener modelo por ID
router.get('/:id', auth, (req, res) => {
  try {
    const model = db.prepare(`
      SELECT acm.*, am.name as manufacturer_name
      FROM asset_computer_models acm
      LEFT JOIN asset_manufacturers am ON acm.manufacturer_id = am.id
      WHERE acm.id = ?
    `).get(req.params.id);
    if (!model) return res.status(404).json({ error: 'Modelo no encontrado' });
    res.json(model);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear modelo de computadora
router.post('/', auth, adminOnly, (req, res) => {
  try {
    const { name, comments, product_number, weight, required_units, depth, power_connections, power_consumption, is_half_rack, manufacturer_id, photo_front, photo_back, other_photos } = req.body;
    const mid = manufacturer_id && manufacturer_id !== '' ? manufacturer_id : null;
    const result = db.prepare(`
      INSERT INTO asset_computer_models (name, comments, product_number, weight, required_units, depth, power_connections, power_consumption, is_half_rack, manufacturer_id, photo_front, photo_back, other_photos)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(name, comments, product_number, weight || 0, required_units || 1, depth || '1', power_connections || 0, power_consumption || 0, is_half_rack ? 1 : 0, mid, photo_front, photo_back, other_photos);
    res.json({ id: result.lastInsertRowid, name });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar modelo
router.put('/:id', auth, adminOnly, (req, res) => {
  try {
    const { name, comments, product_number, weight, required_units, depth, power_connections, power_consumption, is_half_rack, manufacturer_id, photo_front, photo_back, other_photos } = req.body;
    db.prepare(`
      UPDATE asset_computer_models SET name=?, comments=?, product_number=?, weight=?, required_units=?, depth=?, power_connections=?, power_consumption=?, is_half_rack=?, manufacturer_id=?, photo_front=?, photo_back=?, other_photos=?
      WHERE id = ?
    `).run(name, comments, product_number, weight, required_units, depth, power_connections, power_consumption, is_half_rack ? 1 : 0, manufacturer_id, photo_front, photo_back, other_photos, req.params.id);
    res.json({ message: 'Modelo actualizado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar modelo
router.delete('/:id', auth, adminOnly, (req, res) => {
  try {
    db.prepare('DELETE FROM asset_computer_models WHERE id = ?').run(req.params.id);
    res.json({ message: 'Modelo eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;