const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth } = require('../middleware/auth');

// Comandos de voz disponibles
const VOICE_COMMANDS = [
  { command: 'crear ticket', action: 'create_ticket', description: 'Abrir formulario de nuevo ticket' },
  { command: 'buscar', action: 'search', description: 'Abrir búsqueda' },
  { command: 'dashboard', action: 'go_dashboard', description: 'Ir al dashboard' },
  { command: 'tickets', action: 'go_tickets', description: 'Ver lista de tickets' },
  { command: 'activos', action: 'go_assets', description: 'Ver lista de activos' },
  { command: 'notificaciones', action: 'go_notifications', description: 'Ver notificaciones' },
  { command: 'ayuda', action: 'show_help', description: 'Mostrar ayuda' },
];

// Obtener comandos disponibles
router.get('/commands', auth, (req, res) => {
  try {
    res.json(VOICE_COMMANDS);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Procesar comando de voz
router.post('/process', auth, (req, res) => {
  try {
    const { transcript } = req.body;
    const lowerTranscript = transcript.toLowerCase();

    // Buscar comando coincidente
    let matchedCommand = null;
    for (const cmd of VOICE_COMMANDS) {
      if (lowerTranscript.includes(cmd.command)) {
        matchedCommand = cmd;
        break;
      }
    }

    if (matchedCommand) {
      res.json({ 
        success: true, 
        action: matchedCommand.action,
        message: `Ejecutando: ${matchedCommand.description}` 
      });
    } else {
      res.json({ 
        success: false, 
        message: 'Comando no reconocido. Intenta: "crear ticket", "buscar", "dashboard"' 
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Configurar comandos personalizados
router.post('/custom-commands', auth, (req, res) => {
  try {
    const { command, action, description } = req.body;
    
    db.prepare(`
      INSERT INTO voice_commands (user_id, command, action, description)
      VALUES (?, ?, ?, ?)
    `).run(req.user.id, command, action, description);

    res.json({ message: 'Comando personalizado creado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;