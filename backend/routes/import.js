const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

// Configure multer for CSV uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `import-${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  }
});

// Import tickets from CSV
router.post('/tickets', auth, adminOnly, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const results = [];
    const errors = [];

    const parseCSV = () => {
      return new Promise((resolve, reject) => {
        fs.createReadStream(req.file.path)
          .pipe(csv())
          .on('data', (row) => results.push(row))
          .on('end', () => resolve())
          .on('error', reject);
      });
    };

    await parseCSV();

    // Process each row
    let imported = 0;
    for (const row of results) {
      try {
        if (!row.title) {
          errors.push({ row: imported + 1, error: 'Title is required' });
          continue;
        }

        db.prepare(`
          INSERT INTO tickets (title, description, priority, category, status, created_by, source)
          VALUES (?, ?, ?, ?, ?, ?, 'import')
        `).run(
          row.title,
          row.description || '',
          row.priority || 'medium',
          row.category || null,
          row.status || 'open',
          req.user.id
        );

        imported++;
      } catch (error) {
        errors.push({ row: imported + 1, error: error.message });
      }
    }

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.json({
      message: 'Import completed',
      imported,
      errors: errors.length,
      errorDetails: errors.slice(0, 10), // Return first 10 errors
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Import assets from CSV
router.post('/assets', auth, adminOnly, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const results = [];
    const errors = [];

    const parseCSV = () => {
      return new Promise((resolve, reject) => {
        fs.createReadStream(req.file.path)
          .pipe(csv())
          .on('data', (row) => results.push(row))
          .on('end', () => resolve())
          .on('error', reject);
      });
    };

    await parseCSV();

    let imported = 0;
    for (const row of results) {
      try {
        if (!row.name || !row.type) {
          errors.push({ row: imported + 1, error: 'Name and type are required' });
          continue;
        }

        db.prepare(`
          INSERT INTO assets (name, type, category, serial_number, model, manufacturer, status, location)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          row.name,
          row.type,
          row.category || null,
          row.serial_number || null,
          row.model || null,
          row.manufacturer || null,
          row.status || 'available',
          row.location || null
        );

        imported++;
      } catch (error) {
        errors.push({ row: imported + 1, error: error.message });
      }
    }

    fs.unlinkSync(req.file.path);

    res.json({
      message: 'Import completed',
      imported,
      errors: errors.length,
      errorDetails: errors.slice(0, 10),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Import users from CSV
router.post('/users', auth, adminOnly, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const results = [];
    const errors = [];
    const bcrypt = require('bcryptjs');

    const parseCSV = () => {
      return new Promise((resolve, reject) => {
        fs.createReadStream(req.file.path)
          .pipe(csv())
          .on('data', (row) => results.push(row))
          .on('end', () => resolve())
          .on('error', reject);
      });
    };

    await parseCSV();

    let imported = 0;
    for (const row of results) {
      try {
        if (!row.name || !row.email) {
          errors.push({ row: imported + 1, error: 'Name and email are required' });
          continue;
        }

        // Check if user exists
        const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(row.email);
        if (existing) {
          errors.push({ row: imported + 1, error: 'Email already exists' });
          continue;
        }

        const password = row.password || 'changeme123';
        const hashedPassword = await bcrypt.hash(password, 10);

        db.prepare(`
          INSERT INTO users (name, email, password, role, department)
          VALUES (?, ?, ?, ?, ?)
        `).run(
          row.name,
          row.email,
          hashedPassword,
          row.role || 'user',
          row.department || null
        );

        imported++;
      } catch (error) {
        errors.push({ row: imported + 1, error: error.message });
      }
    }

    fs.unlinkSync(req.file.path);

    res.json({
      message: 'Import completed',
      imported,
      errors: errors.length,
      errorDetails: errors.slice(0, 10),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get import template
router.get('/template/:type', auth, adminOnly, (req, res) => {
  try {
    const templates = {
      tickets: 'title,description,priority,category,status',
      assets: 'name,type,category,serial_number,model,manufacturer,status,location',
      users: 'name,email,password,role,department',
    };

    const template = templates[req.params.type];
    if (!template) {
      return res.status(400).json({ error: 'Invalid type' });
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${req.params.type}_template.csv`);
    res.send(template);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
