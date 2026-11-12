const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

// Obtener widgets del dashboard
router.get('/widgets', auth, (req, res) => {
  try {
    const widgets = db.prepare(
      'SELECT * FROM dashboard_widgets WHERE user_id = ? ORDER BY position'
    ).all(req.user.id);
    res.json(widgets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Guardar layout del dashboard
router.put('/widgets', auth, (req, res) => {
  try {
    const { widgets } = req.body;
    db.prepare('DELETE FROM dashboard_widgets WHERE user_id = ?').run(req.user.id);
    
    const insert = db.prepare(
      'INSERT INTO dashboard_widgets (user_id, widget_type, title, position, config) VALUES (?, ?, ?, ?, ?)'
    );
    
    widgets.forEach((widget, index) => {
      insert.run(req.user.id, widget.type, widget.title, index, JSON.stringify(widget.config || {}));
    });
    
    res.json({ message: 'Layout guardado', widgets });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Widgets disponibles
router.get('/available', auth, (req, res) => {
  try {
    const available = [
      { type: 'ticket_stats', name: 'Estadísticas de Tickets', icon: '🎫' },
      { type: 'asset_stats', name: 'Estadísticas de Activos', icon: '💻' },
      { type: 'recent_activity', name: 'Actividad Reciente', icon: '📰' },
      { type: 'pending_tasks', name: 'Tareas Pendientes', icon: '📋' },
      { type: 'performance', name: 'Rendimiento', icon: '📈' },
      { type: 'notifications', name: 'Notificaciones', icon: '🔔' },
    ];
    res.json(available);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
