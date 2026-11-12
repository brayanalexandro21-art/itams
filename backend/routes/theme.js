const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth } = require('../middleware/auth');

// Theme options
const THEMES = {
  light: {
    name: 'Light',
    colors: {
      primary: '#4f46e5',
      secondary: '#7c3aed',
      background: '#ffffff',
      surface: '#f9fafb',
      text: '#111827',
      textSecondary: '#6b7280',
      border: '#e5e7eb',
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
    },
  },
  dark: {
    name: 'Dark',
    colors: {
      primary: '#6366f1',
      secondary: '#8b5cf6',
      background: '#111827',
      surface: '#1f2937',
      text: '#f9fafb',
      textSecondary: '#9ca3af',
      border: '#374151',
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
    },
  },
  midnight: {
    name: 'Midnight',
    colors: {
      primary: '#818cf8',
      secondary: '#a78bfa',
      background: '#0f172a',
      surface: '#1e293b',
      text: '#f1f5f9',
      textSecondary: '#94a3b8',
      border: '#334155',
      success: '#4ade80',
      warning: '#fbbf24',
      error: '#f87171',
    },
  },
  ocean: {
    name: 'Ocean',
    colors: {
      primary: '#0ea5e9',
      secondary: '#06b6d4',
      background: '#f0f9ff',
      surface: '#e0f2fe',
      text: '#0c4a6e',
      textSecondary: '#0369a1',
      border: '#bae6fd',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
    },
  },
};

// Get available themes
router.get('/', auth, (req, res) => {
  try {
    const themes = Object.entries(THEMES).map(([id, theme]) => ({
      id,
      ...theme,
    }));
    res.json(themes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's theme preference
router.get('/preference', auth, (req, res) => {
  try {
    const pref = db.prepare("SELECT value FROM settings WHERE key = ?").get(`theme_${req.user.id}`);
    const themeId = pref?.value || 'light';
    const theme = THEMES[themeId] || THEMES.light;

    res.json({
      themeId,
      theme,
      customizations: getCustomizations(req.user.id),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update theme preference
router.put('/preference', auth, (req, res) => {
  try {
    const { themeId, customizations } = req.body;

    if (!THEMES[themeId]) {
      return res.status(400).json({ error: 'Invalid theme' });
    }

    const upsert = db.prepare(`
      INSERT INTO settings (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = ?
    `);

    upsert.run(`theme_${req.user.id}`, themeId, themeId);

    // Save customizations if provided
    if (customizations) {
      upsert.run(`theme_custom_${req.user.id}`, JSON.stringify(customizations), JSON.stringify(customizations));
    }

    res.json({ message: 'Theme updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get theme CSS variables
router.get('/css', auth, (req, res) => {
  try {
    const pref = db.prepare("SELECT value FROM settings WHERE key = ?").get(`theme_${req.user.id}`);
    const themeId = pref?.value || 'light';
    const theme = THEMES[themeId] || THEMES.light;

    const cssVariables = Object.entries(theme.colors)
      .map(([key, value]) => `--color-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value};`)
      .join('\n');

    res.type('text/css').send(`:root {\n${cssVariables}\n}`);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

function getCustomizations(userId) {
  try {
    const pref = db.prepare("SELECT value FROM settings WHERE key = ?").get(`theme_custom_${userId}`);
    return pref ? JSON.parse(pref.value) : {};
  } catch {
    return {};
  }
}

module.exports = router;
