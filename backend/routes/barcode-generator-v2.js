const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth } = require('../middleware/auth');

// Generar datos de código de barras para activo
router.get('/asset/:id', auth, (req, res) => {
  try {
    const asset = db.prepare('SELECT * FROM assets WHERE id = ?').get(req.params.id);
    if (!asset) return res.status(404).json({ error: 'Activo no encontrado' });

    const barcode = `ITAMS-${String(asset.id).padStart(6, '0')}`;

    res.json({
      asset_id: asset.id,
      name: asset.name,
      type: asset.type,
      serial_number: asset.serial_number,
      barcode,
      format: 'CODE128',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generar datos de código QR
router.get('/asset/:id/qr', auth, (req, res) => {
  try {
    const asset = db.prepare('SELECT * FROM assets WHERE id = ?').get(req.params.id);
    if (!asset) return res.status(404).json({ error: 'Activo no encontrado' });

    const qrData = JSON.stringify({
      type: 'ITAMS_ASSET',
      id: asset.id,
      name: asset.name,
      serial: asset.serial_number,
      barcode: `ITAMS-${String(asset.id).padStart(6, '0')}`,
    });

    res.json({ asset_id: asset.id, qr_data: qrData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Escanear código de barras
router.post('/scan', auth, (req, res) => {
  try {
    const { code } = req.body;

    // Intentar formato ITAMS-XXXXXX
    if (code && code.startsWith('ITAMS-')) {
      const id = parseInt(code.replace('ITAMS-', ''));
      const asset = db.prepare('SELECT * FROM assets WHERE id = ?').get(id);
      if (asset) {
        db.prepare(`INSERT INTO asset_scan_logs (asset_id, scanned_by, scanned_at) VALUES (?, ?, datetime('now'))`).run(id, req.user.id);
        return res.json({ found: true, type: 'barcode', asset });
      }
    }

    // Intentar formato JSON (QR)
    try {
      const data = JSON.parse(code);
      if (data.type === 'ITAMS_ASSET') {
        const asset = db.prepare('SELECT * FROM assets WHERE id = ?').get(data.id);
        if (asset) {
          db.prepare(`INSERT INTO asset_scan_logs (asset_id, scanned_by, scanned_at) VALUES (?, ?, datetime('now'))`).run(data.id, req.user.id);
          return res.json({ found: true, type: 'qr', asset });
        }
      }
    } catch (e) {}

    // Buscar por serial number
    const asset = db.prepare('SELECT * FROM assets WHERE serial_number = ?').get(code);
    if (asset) {
      db.prepare(`INSERT INTO asset_scan_logs (asset_id, scanned_by, scanned_at) VALUES (?, ?, datetime('now'))`).run(asset.id, req.user.id);
      return res.json({ found: true, type: 'serial', asset });
    }

    res.json({ found: false });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Historial de escaneos
router.get('/scan-history', auth, (req, res) => {
  try {
    const history = db.prepare(`
      SELECT asl.*, a.name as asset_name, u.name as scanned_by_name
      FROM asset_scan_logs asl
      LEFT JOIN assets a ON asl.asset_id = a.id
      LEFT JOIN users u ON asl.scanned_by = u.id
      ORDER BY asl.scanned_at DESC
      LIMIT 50
    `).all();
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;