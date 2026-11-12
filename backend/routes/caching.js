const express = require('express');
const router = express.Router();
const { auth, adminOnly } = require('../middleware/auth');

// Cache simple en memoria
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

// Obtener datos con cache
router.get('/:key', auth, (req, res) => {
  try {
    const cached = cache.get(req.params.key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      res.json({ data: cached.data, cached: true, timestamp: cached.timestamp });
    } else {
      res.json({ data: null, cached: false });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Guardar en cache
router.post('/:key', auth, (req, res) => {
  try {
    const { data } = req.body;
    cache.set(req.params.key, { data, timestamp: Date.now() });
    res.json({ message: 'Datos guardados en cache' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Limpiar cache
router.delete('/clear', auth, adminOnly, (req, res) => {
  try {
    cache.clear();
    res.json({ message: 'Cache limpiado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Estadísticas del cache
router.get('/stats/info', auth, adminOnly, (req, res) => {
  try {
    res.json({
      size: cache.size,
      keys: Array.from(cache.keys()),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;