const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth } = require('../middleware/auth');

// Generate QR code data for asset
router.get('/asset/:id/qr', auth, (req, res) => {
  try {
    const asset = db.prepare('SELECT * FROM assets WHERE id = ?').get(req.params.id);
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    // Generate QR code data (in production, use a QR code library)
    const qrData = {
      type: 'ITAMS_ASSET',
      id: asset.id,
      name: asset.name,
      serial: asset.serial_number,
      url: `${process.env.APP_URL || 'http://localhost:5173'}/assets/${asset.id}`,
    };

    res.json({
      data: JSON.stringify(qrData),
      format: 'json',
      asset: {
        id: asset.id,
        name: asset.name,
        serial_number: asset.serial_number,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate barcode data
router.get('/asset/:id/barcode', auth, (req, res) => {
  try {
    const asset = db.prepare('SELECT * FROM assets WHERE id = ?').get(req.params.id);
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    // Generate barcode value (CODE128 format)
    const barcodeValue = `ITAMS-${asset.id.toString().padStart(6, '0')}`;

    res.json({
      value: barcodeValue,
      format: 'CODE128',
      asset: {
        id: asset.id,
        name: asset.name,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate labels for multiple assets
router.post('/labels', auth, (req, res) => {
  try {
    const { asset_ids, format } = req.body;

    const assets = db.prepare(`
      SELECT id, name, serial_number, type, model, manufacturer
      FROM assets
      WHERE id IN (${asset_ids.map(() => '?').join(',')})
    `).all(...asset_ids);

    const labels = assets.map(asset => ({
      asset_id: asset.id,
      barcode: `ITAMS-${asset.id.toString().padStart(6, '0')}`,
      name: asset.name,
      serial: asset.serial_number,
      info: `${asset.type} - ${asset.manufacturer || ''} ${asset.model || ''}`.trim(),
    }));

    res.json({
      labels,
      format: format || 'pdf',
      count: labels.length,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Scan barcode/QR (lookup asset)
router.post('/scan', auth, (req, res) => {
  try {
    const { code } = req.body;

    // Try to parse as QR data
    try {
      const qrData = JSON.parse(code);
      if (qrData.type === 'ITAMS_ASSET' && qrData.id) {
        const asset = db.prepare('SELECT * FROM assets WHERE id = ?').get(qrData.id);
        if (asset) {
          return res.json({ found: true, type: 'asset', data: asset });
        }
      }
    } catch (e) {
      // Not JSON, try as barcode
    }

    // Try as barcode
    if (code.startsWith('ITAMS-')) {
      const id = parseInt(code.replace('ITAMS-', ''));
      const asset = db.prepare('SELECT * FROM assets WHERE id = ?').get(id);
      if (asset) {
        return res.json({ found: true, type: 'asset', data: asset });
      }
    }

    res.json({ found: false, message: 'No asset found for this code' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
