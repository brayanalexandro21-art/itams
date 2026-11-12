const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

// Obtener configuración de branding global
router.get('/', auth, adminOnly, (req, res) => {
  try {
    const config = db.prepare("SELECT value FROM settings WHERE key = 'branding_config'").get();
    res.json(config ? JSON.parse(config.value) : {
      company_name: 'ITAMS',
      logo_url: '',
      primary_color: '#4f46e5',
      secondary_color: '#7c3aed',
      accent_color: '#06b6d4',
      bg_color: '#ffffff',
      text_color: '#1f2937',
      font_family: 'Inter, system-ui, sans-serif',
      border_radius: '8px',
      sidebar_style: 'dark',
      custom_css: '',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar branding
router.put('/', auth, adminOnly, (req, res) => {
  try {
    db.prepare("INSERT INTO settings (key, value) VALUES ('branding_config', ?) ON CONFLICT(key) DO UPDATE SET value = ?")
      .run(JSON.stringify(req.body), JSON.stringify(req.body));
    res.json({ message: 'Branding actualizado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Preview de theme
router.post('/preview', auth, (req, res) => {
  try {
    const config = req.body;
    const css = `
      :root {
        --primary: ${config.primary_color};
        --secondary: ${config.secondary_color};
        --accent: ${config.accent_color};
        --bg: ${config.bg_color};
        --text: ${config.text_color};
        --radius: ${config.border_radius};
      }
    `;
    res.json({ css, config });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Presets de theme
router.get('/presets', auth, (req, res) => {
  res.json([
    { name: 'Indigo (Default)', primary: '#4f46e5', secondary: '#7c3aed', accent: '#06b6d4', bg: '#ffffff', text: '#1f2937' },
    { name: 'Emerald', primary: '#059669', secondary: '#10b981', accent: '#34d399', bg: '#ffffff', text: '#1f2937' },
    { name: 'Rose', primary: '#e11d48', secondary: '#f43f5e', accent: '#fb7185', bg: '#ffffff', text: '#1f2937' },
    { name: 'Amber', primary: '#d97706', secondary: '#f59e0b', accent: '#fbbf24', bg: '#ffffff', text: '#1f2937' },
    { name: 'Slate Dark', primary: '#64748b', secondary: '#94a3b8', accent: '#cbd5e1', bg: '#0f172a', text: '#e2e8f0' },
    { name: 'Midnight', primary: '#6366f1', secondary: '#818cf8', accent: '#a5b4fc', bg: '#1e1b4b', text: '#e0e7ff' },
  ]);
});

module.exports = router;