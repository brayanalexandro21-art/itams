const express = require('express');
const router = express.Router();
const { auth, adminOnly } = require('../middleware/auth');

// Validar datos de entrada
router.post('/validate', auth, (req, res) => {
  try {
    const { entity, data } = req.body;
    const errors = [];

    switch (entity) {
      case 'ticket':
        if (!data.title || data.title.length < 3) errors.push('Título debe tener al menos 3 caracteres');
        if (!data.description || data.description.length < 10) errors.push('Descripción debe tener al menos 10 caracteres');
        if (!['low', 'medium', 'high', 'critical'].includes(data.priority)) errors.push('Prioridad inválida');
        break;
      case 'asset':
        if (!data.name || data.name.length < 2) errors.push('Nombre debe tener al menos 2 caracteres');
        if (!data.type) errors.push('Tipo es requerido');
        if (data.serial_number && data.serial_number.length < 5) errors.push('Número de serie muy corto');
        break;
      case 'user':
        if (!data.name || data.name.length < 2) errors.push('Nombre debe tener al menos 2 caracteres');
        if (!data.email || !data.email.includes('@')) errors.push('Email inválido');
        if (data.password && data.password.length < 8) errors.push('Contraseña debe tener al menos 8 caracteres');
        break;
    }

    res.json({ valid: errors.length === 0, errors });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;