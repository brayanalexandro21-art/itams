const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');
const path = require('path');
const { createUpload, persistFile } = require('../storage');

// Uploads de logo/favicon (Cloudinary en la nube, uploads/branding en local)
const upload = createUpload({
  folder: 'branding',
  prefix: 'logo-',
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|svg/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname || mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Get branding settings
router.get('/', auth, (req, res) => {
  try {
    const branding = db.prepare('SELECT * FROM branding_settings LIMIT 1').get();

    if (!branding) {
      // Return default branding
      return res.json({
        company_name: 'ITAMS',
        logo_url: null,
        favicon_url: null,
        primary_color: '#4f46e5',
        secondary_color: '#7c3aed',
        accent_color: '#06b6d4',
        background_color: '#ffffff',
        text_color: '#111827',
        font_family: 'Inter, system-ui, sans-serif',
        login_message: 'Welcome to ITAMS',
        footer_text: 'Powered by ITAMS',
        custom_css: '',
      });
    }

    res.json(branding);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update branding settings
router.put('/', auth, adminOnly, (req, res) => {
  try {
    const {
      company_name, logo_url, favicon_url, primary_color, secondary_color,
      accent_color, background_color, text_color, font_family,
      login_message, footer_text, custom_css
    } = req.body;

    const existing = db.prepare('SELECT id FROM branding_settings LIMIT 1').get();

    if (existing) {
      db.prepare(`
        UPDATE branding_settings
        SET company_name = COALESCE(?, company_name),
            logo_url = COALESCE(?, logo_url),
            favicon_url = COALESCE(?, favicon_url),
            primary_color = COALESCE(?, primary_color),
            secondary_color = COALESCE(?, secondary_color),
            accent_color = COALESCE(?, accent_color),
            background_color = COALESCE(?, background_color),
            text_color = COALESCE(?, text_color),
            font_family = COALESCE(?, font_family),
            login_message = COALESCE(?, login_message),
            footer_text = COALESCE(?, footer_text),
            custom_css = COALESCE(?, custom_css),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        company_name, logo_url, favicon_url, primary_color, secondary_color,
        accent_color, background_color, text_color, font_family,
        login_message, footer_text, custom_css, existing.id
      );
    } else {
      db.prepare(`
        INSERT INTO branding_settings (
          company_name, logo_url, favicon_url, primary_color, secondary_color,
          accent_color, background_color, text_color, font_family,
          login_message, footer_text, custom_css, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        company_name, logo_url, favicon_url, primary_color, secondary_color,
        accent_color, background_color, text_color, font_family,
        login_message, footer_text, custom_css, req.user.id
      );
    }

    res.json({ message: 'Branding updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload logo
router.post('/logo', auth, adminOnly, upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const logoUrl = (await persistFile(req.file, 'branding', 'logo-')).url;

    // Update branding with new logo URL
    const existing = db.prepare('SELECT id FROM branding_settings LIMIT 1').get();
    if (existing) {
      db.prepare('UPDATE branding_settings SET logo_url = ? WHERE id = ?')
        .run(logoUrl, existing.id);
    } else {
      db.prepare('INSERT INTO branding_settings (logo_url, created_by) VALUES (?, ?)')
        .run(logoUrl, req.user.id);
    }

    res.json({ url: logoUrl });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload favicon
router.post('/favicon', auth, adminOnly, upload.single('favicon'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const faviconUrl = (await persistFile(req.file, 'branding', 'favicon-')).url;

    const existing = db.prepare('SELECT id FROM branding_settings LIMIT 1').get();
    if (existing) {
      db.prepare('UPDATE branding_settings SET favicon_url = ? WHERE id = ?')
        .run(faviconUrl, existing.id);
    } else {
      db.prepare('INSERT INTO branding_settings (favicon_url, created_by) VALUES (?, ?)')
        .run(faviconUrl, req.user.id);
    }

    res.json({ url: faviconUrl });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate CSS variables from branding
router.get('/css', (req, res) => {
  try {
    const branding = db.prepare('SELECT * FROM branding_settings LIMIT 1').get() || {
      primary_color: '#4f46e5',
      secondary_color: '#7c3aed',
      accent_color: '#06b6d4',
      background_color: '#ffffff',
      text_color: '#111827',
      font_family: 'Inter, system-ui, sans-serif',
    };

    const css = `
:root {
  --brand-primary: ${branding.primary_color};
  --brand-secondary: ${branding.secondary_color};
  --brand-accent: ${branding.accent_color};
  --brand-background: ${branding.background_color};
  --brand-text: ${branding.text_color};
  --brand-font: ${branding.font_family};
}

body {
  font-family: var(--brand-font);
  background-color: var(--brand-background);
  color: var(--brand-text);
}

.btn-primary {
  background-color: var(--brand-primary);
}

.btn-secondary {
  background-color: var(--brand-secondary);
}

.text-brand {
  color: var(--brand-primary);
}

.bg-brand {
  background-color: var(--brand-primary);
}

${branding.custom_css || ''}
`;

    res.type('text/css').send(css);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get branding presets
router.get('/presets', (req, res) => {
  try {
    const presets = [
      {
        name: 'Default',
        primary_color: '#4f46e5',
        secondary_color: '#7c3aed',
        accent_color: '#06b6d4',
      },
      {
        name: 'Ocean',
        primary_color: '#0ea5e9',
        secondary_color: '#0284c7',
        accent_color: '#06b6d4',
      },
      {
        name: 'Forest',
        primary_color: '#22c55e',
        secondary_color: '#16a34a',
        accent_color: '#10b981',
      },
      {
        name: 'Sunset',
        primary_color: '#f97316',
        secondary_color: '#ea580c',
        accent_color: '#f59e0b',
      },
      {
        name: 'Royal',
        primary_color: '#8b5cf6',
        secondary_color: '#7c3aed',
        accent_color: '#a78bfa',
      },
      {
        name: 'Midnight',
        primary_color: '#6366f1',
        secondary_color: '#4f46e5',
        accent_color: '#818cf8',
      },
    ];

    res.json(presets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
