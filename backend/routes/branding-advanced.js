const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

// Configuración de branding avanzada
router.get('/config', auth, (req, res) => {
  try {
    const config = db.prepare("SELECT value FROM settings WHERE key = 'branding_config'").get();
    res.json(config ? JSON.parse(config.value) : {
      company_name: 'ITAMS',
      logo_url: null,
      favicon_url: null,
      primary_color: '#4f46e5',
      secondary_color: '#7c3aed',
      accent_color: '#06b6d4',
      font_family: 'Inter, system-ui, sans-serif',
      custom_css: '',
      login_background: null,
      email_footer: '© 2024 ITAMS - Sistema de Gestión de Activos',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar branding
router.put('/config', auth, adminOnly, (req, res) => {
  try {
    const config = req.body;
    db.prepare(`
      INSERT INTO settings (key, value) VALUES ('branding_config', ?)
      ON CONFLICT(key) DO UPDATE SET value = ?
    `).run(JSON.stringify(config), JSON.stringify(config));
    res.json({ message: 'Branding actualizado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;