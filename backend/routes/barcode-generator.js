const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth } = require('../middleware/auth');

// Generate barcode data for asset
router.get('/asset/:id', auth, (req, res) => {
  try {
    const asset = db.prepare('SELECT * FROM assets WHERE id = ?').get(req.params.id);
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    const barcodeData = {
      format: 'CODE128',
      value: `ITAMS-${asset.id.toString().padStart(6, '0')}`,
      asset: {
        id: asset.id,
        name: asset.name,
        type: asset.type,
        serial_number: asset.serial_number,
        model: asset.model,
        manufacturer: asset.manufacturer,
      },
      // SVG generation options
      options: {
        width: 2,
        height: 100,
        displayValue: true,
        font: 'monospace',
        fontSize: 20,
        textAlign: 'center',
        textPosition: 'bottom',
        background: '#ffffff',
        lineColor: '#000000',
      },
    };

    res.json(barcodeData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate QR code data for asset
router.get('/qr/:id', auth, (req, res) => {
  try {
    const asset = db.prepare('SELECT * FROM assets WHERE id = ?').get(req.params.id);
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    const qrData = {
      format: 'QR_CODE',
      value: JSON.stringify({
        type: 'ITAMS_ASSET',
        id: asset.id,
        name: asset.name,
        serial: asset.serial_number,
        url: `${process.env.APP_URL || 'http://localhost:5173'}/assets/${asset.id}`,
      }),
      asset: {
        id: asset.id,
        name: asset.name,
        serial_number: asset.serial_number,
      },
      options: {
        width: 200,
        height: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      },
    };

    res.json(qrData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate batch barcodes
router.post('/batch', auth, (req, res) => {
  try {
    const { asset_ids, format = 'barcode' } = req.body;

    if (!asset_ids || asset_ids.length === 0) {
      return res.status(400).json({ error: 'No assets selected' });
    }

    const assets = db.prepare(`
      SELECT id, name, type, serial_number, model, manufacturer
      FROM assets
      WHERE id IN (${asset_ids.map(() => '?').join(',')})
    `).all(...asset_ids);

    const barcodes = assets.map(asset => ({
      asset_id: asset.id,
      format: format === 'qr' ? 'QR_CODE' : 'CODE128',
      value: format === 'qr'
        ? JSON.stringify({ type: 'ITAMS_ASSET', id: asset.id, name: asset.name })
        : `ITAMS-${asset.id.toString().padStart(6, '0')}`,
      asset: {
        name: asset.name,
        type: asset.type,
        serial_number: asset.serial_number,
      },
    }));

    res.json({
      barcodes,
      count: barcodes.length,
      format,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Scan barcode
router.post('/scan', auth, (req, res) => {
  try {
    const { code } = req.body;

    let asset = null;

    // Try QR format
    try {
      const qrData = JSON.parse(code);
      if (qrData.type === 'ITAMS_ASSET') {
        asset = db.prepare('SELECT * FROM assets WHERE id = ?').get(qrData.id);
      }
    } catch (e) {
      // Try barcode format
      if (code.startsWith('ITAMS-')) {
        const id = parseInt(code.replace('ITAMS-', ''));
        asset = db.prepare('SELECT * FROM assets WHERE id = ?').get(id);
      }
    }

    if (asset) {
      // Log scan
      db.prepare(`
        INSERT INTO asset_scan_logs (asset_id, user_id, scan_type)
        VALUES (?, ?, ?)
      `).run(asset.id, req.user.id, code.startsWith('{') ? 'qr' : 'barcode');

      res.json({ found: true, asset });
    } else {
      res.json({ found: false, message: 'Asset not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get scan history
router.get('/scan-history', auth, (req, res) => {
  try {
    const history = db.prepare(`
      SELECT asl.*, a.name as asset_name, u.name as user_name
      FROM asset_scan_logs asl
      LEFT JOIN assets a ON asl.asset_id = a.id
      LEFT JOIN users u ON asl.user_id = u.id
      ORDER BY asl.created_at DESC
      LIMIT 50
    `).all();

    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get barcode templates
router.get('/templates', auth, (req, res) => {
  try {
    const templates = [
      {
        id: 'standard',
        name: 'Standard Barcode',
        description: 'Simple barcode with asset ID',
        format: 'CODE128',
        includeFields: ['id', 'name'],
      },
      {
        id: 'detailed',
        name: 'Detailed Barcode',
        description: 'Barcode with full asset info',
        format: 'CODE128',
        includeFields: ['id', 'name', 'serial_number', 'model'],
      },
      {
        id: 'qr-simple',
        name: 'Simple QR Code',
        description: 'QR code with asset link',
        format: 'QR_CODE',
        includeFields: ['id', 'name', 'url'],
      },
      {
        id: 'qr-full',
        name: 'Full QR Code',
        description: 'QR code with all asset data',
        format: 'QR_CODE',
        includeFields: ['id', 'name', 'serial_number', 'model', 'manufacturer', 'location'],
      },
    ];

    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
