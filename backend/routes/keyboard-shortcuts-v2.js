const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');

// Atajos de teclado configurables
const SHORTCUTS = {
  global: [
    { key: 'ctrl+k', action: 'search', description: 'Abrir búsqueda' },
    { key: 'ctrl+n', action: 'new_ticket', description: 'Crear ticket' },
    { key: 'ctrl+d', action: 'dashboard', description: 'Ir al dashboard' },
    { key: 'ctrl+s', action: 'save', description: 'Guardar cambios' },
    { key: 'escape', action: 'close', description: 'Cerrar modal' },
  ],
  tickets: [
    { key: 'n', action: 'new_ticket', description: 'Nuevo ticket' },
    { key: 'e', action: 'edit', description: 'Editar ticket' },
    { key: 'd', action: 'delete', description: 'Eliminar ticket' },
    { key: 'a', action: 'assign', description: 'Asignar ticket' },
  ],
  navigation: [
    { key: 'g+d', action: 'go_dashboard', description: 'Ir al dashboard' },
    { key: 'g+t', action: 'go_tickets', description: 'Ir a tickets' },
    { key: 'g+a', action: 'go_assets', description: 'Ir a activos' },
    { key: 'g+k', action: 'go_kb', description: 'Ir a knowledge base' },
  ]
};

// Obtener todos los atajos
router.get('/', auth, (req, res) => {
  try {
    res.json(SHORTCUTS);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener atajos por contexto
router.get('/:context', auth, (req, res) => {
  try {
    const shortcuts = SHORTCUTS[req.params.context] || SHORTCUTS.global;
    res.json(shortcuts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;