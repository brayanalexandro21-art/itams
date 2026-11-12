const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

// Rate limiting por endpoint
const rateLimits = new Map();

router.use((req, res, next) => {
  const ip = req.ip;
  const now = Date.now();
  const windowMs = 60000; // 1 minuto
  const maxRequests = 100;

  if (!rateLimits.has(ip)) {
    rateLimits.set(ip, { count: 1, resetTime: now + windowMs });
  } else {
    const limit = rateLimits.get(ip);
    if (now > limit.resetTime) {
      limit.count = 1;
      limit.resetTime = now + windowMs;
    } else {
      limit.count++;
    }

    if (limit.count > maxRequests) {
      return res.status(429).json({ error: 'Demasiadas solicitudes. Intenta de nuevo más tarde.' });
    }
  }
  next();
});

// Documentación de API
router.get('/docs', (req, res) => {
  const docs = {
    version: '1.0.0',
    endpoints: [
      { method: 'GET', path: '/api/tickets', description: 'Obtener todos los tickets' },
      { method: 'POST', path: '/api/tickets', description: 'Crear un ticket' },
      { method: 'GET', path: '/api/tickets/:id', description: 'Obtener ticket por ID' },
      { method: 'PUT', path: '/api/tickets/:id', description: 'Actualizar ticket' },
      { method: 'DELETE', path: '/api/tickets/:id', description: 'Eliminar ticket' },
      { method: 'GET', path: '/api/assets', description: 'Obtener todos los activos' },
      { method: 'POST', path: '/api/assets', description: 'Crear un activo' },
      { method: 'GET', path: '/api/reports', description: 'Obtener reportes' },
    ],
  };
  res.json(docs);
});

// Health check detallado
router.get('/health/detailed', auth, adminOnly, (req, res) => {
  try {
    const dbCheck = db.prepare('SELECT 1').get();
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: dbCheck ? 'connected' : 'disconnected',
        api: 'running',
      },
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };
    res.json(health);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
