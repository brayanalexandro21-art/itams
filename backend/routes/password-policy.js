const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

// Obtener política de contraseñas
router.get('/', auth, adminOnly, (req, res) => {
  try {
    const policy = db.prepare("SELECT value FROM settings WHERE key = 'password_policy'").get();
    res.json(policy ? JSON.parse(policy.value) : {
      min_length: 8,
      require_uppercase: true,
      require_lowercase: true,
      require_numbers: true,
      require_special: false,
      max_age_days: 90,
      prevent_reuse: 5,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar política
router.put('/', auth, adminOnly, (req, res) => {
  try {
    db.prepare("INSERT INTO settings (key, value) VALUES ('password_policy', ?) ON CONFLICT(key) DO UPDATE SET value = ?")
      .run(JSON.stringify(req.body), JSON.stringify(req.body));
    res.json({ message: 'Política actualizada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Validar contraseña contra la política
router.post('/validate', auth, (req, res) => {
  try {
    const policy = db.prepare("SELECT value FROM settings WHERE key = 'password_policy'").get();
    const config = policy ? JSON.parse(policy.value) : { min_length: 8, require_uppercase: true, require_lowercase: true, require_numbers: true };
    const { password } = req.body;
    const errors = [];

    if (password.length < config.min_length) errors.push(`Mínimo ${config.min_length} caracteres`);
    if (config.require_uppercase && !/[A-Z]/.test(password)) errors.push('Requiere mayúsculas');
    if (config.require_lowercase && !/[a-z]/.test(password)) errors.push('Requiere minúsculas');
    if (config.require_numbers && !/[0-9]/.test(password)) errors.push('Requiere números');
    if (config.require_special && !/[!@#$%^&*]/.test(password)) errors.push('Requiere caracteres especiales');

    res.json({ valid: errors.length === 0, errors });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;