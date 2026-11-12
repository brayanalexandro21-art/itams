const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

// Generar código de barras para activo
router.get('/generate/:assetId', auth, (req, res) => {
  try {
    const asset = db.prepare('SELECT * FROM assets WHERE id = ?').get(req.params.assetId);
    if (!asset) {
      return res.status(404).json({ error: 'Activo no encontrado' });
    }

    const barcodeData = {
      type: 'CODE128',
      value: asset.serial_number || `AST-${asset.id.toString().padStart(6, '0')}`,
      asset: {
        id: asset.id,
        name: asset.name,
        type: asset.type,
        location: asset.location,
      },
    };

    res.json(barcodeData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Escanear código de barras
router.post('/scan', auth, (req, res) => {
  try {
    const { code } = req.body;
    
    // Buscar por número de serie
    let asset = db.prepare('SELECT * FROM assets WHERE serial_number = ?').get(code);
    
    // Si no encuentra, buscar por ID
    if (!asset && code.startsWith('AST-')) {
      const id = parseInt(code.replace('AST-', ''));
      asset = db.prepare('SELECT * FROM assets WHERE id = ?').get(id);
    }

    if (asset) {
      res.json({ found: true, asset });
    } else {
      res.json({ found: false, message: 'Activo no encontrado' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
