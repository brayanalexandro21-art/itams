const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Los usuarios importados reciben una contraseña aleatoria (deben restablecerla un admin)
const randomPasswordHash = () => bcrypt.hashSync(crypto.randomBytes(18).toString('base64url'), 10);

// Importar datos desde CSV
router.post('/import', auth, adminOnly, (req, res) => {
  try {
    const { entity, data, mappings } = req.body;
    
    let imported = 0;
    let errors = [];

    data.forEach((row, index) => {
      try {
        switch (entity) {
          case 'tickets':
            db.prepare(`
              INSERT INTO tickets (title, description, priority, category, created_by)
              VALUES (?, ?, ?, ?, ?)
            `).run(
              row[mappings.title] || 'Sin título',
              row[mappings.description] || '',
              row[mappings.priority] || 'medium',
              row[mappings.category] || null,
              req.user.id
            );
            break;
          case 'assets':
            db.prepare(`
              INSERT INTO assets (name, type, serial_number, status, location)
              VALUES (?, ?, ?, ?, ?)
            `).run(
              row[mappings.name] || 'Sin nombre',
              row[mappings.type] || 'other',
              row[mappings.serial_number] || null,
              row[mappings.status] || 'available',
              row[mappings.location] || null
            );
            break;
          case 'users':
            db.prepare(`
              INSERT INTO users (name, email, role, department, password)
              VALUES (?, ?, ?, ?, ?)
            `).run(
              row[mappings.name] || 'Sin nombre',
              row[mappings.email] || '',
              row[mappings.role] || 'user',
              row[mappings.department] || null,
              randomPasswordHash()
            );
            break;
        }
        imported++;
      } catch (error) {
        errors.push({ row: index + 1, error: error.message });
      }
    });

    res.json({ imported, errors, total: data.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Validar formato CSV
router.post('/validate', auth, (req, res) => {
  try {
    const { data, entity } = req.body;
    const validation = { valid: true, errors: [], warnings: [] };

    data.forEach((row, index) => {
      if (entity === 'tickets' && !row.title) {
        validation.errors.push({ row: index + 1, field: 'title', error: 'Título requerido' });
      }
      if (entity === 'assets' && (!row.name || !row.type)) {
        validation.errors.push({ row: index + 1, field: 'name/type', error: 'Nombre y tipo requeridos' });
      }
      if (entity === 'users' && !row.email) {
        validation.errors.push({ row: index + 1, field: 'email', error: 'Email requerido' });
      }
    });

    validation.valid = validation.errors.length === 0;
    res.json(validation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;