const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

// Obtener widgets del usuario
router.get('/', auth, (req, res) => {
  try {
    const widgets = db.prepare(`
      SELECT * FROM dashboard_widgets WHERE user_id = ? ORDER BY sort_order
    `).all(req.user.id);
    res.json(widgets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear widget
router.post('/', auth, (req, res) => {
  try {
    const { title, widget_type, config, position_x, position_y, width, height } = req.body;
    const result = db.prepare(`
      INSERT INTO dashboard_widgets (user_id, title, widget_type, config, position_x, position_y, width, height, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(req.user.id, title, widget_type, JSON.stringify(config || {}), position_x || 0, position_y || 0, width || 1, height || 1, Date.now());
    res.json({ id: result.lastInsertRowid, title });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar widget
router.put('/:id', auth, (req, res) => {
  try {
    const { title, config, position_x, position_y, width, height } = req.body;
    db.prepare(`
      UPDATE dashboard_widgets SET title = ?, config = ?, position_x = ?, position_y = ?, width = ?, height = ?
      WHERE id = ? AND user_id = ?
    `).run(title, JSON.stringify(config), position_x, position_y, width, height, req.params.id, req.user.id);
    res.json({ message: 'Widget actualizado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar widget
router.delete('/:id', auth, (req, res) => {
  try {
    db.prepare('DELETE FROM dashboard_widgets WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
    res.json({ message: 'Widget eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Datos del widget
router.get('/:id/data', auth, (req, res) => {
  try {
    const widget = db.prepare('SELECT * FROM dashboard_widgets WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!widget) return res.status(404).json({ error: 'Widget no encontrado' });

    let data = {};
    switch (widget.widget_type) {
      case 'ticket_stats':
        data = {
          open: db.prepare("SELECT COUNT(*) as c FROM tickets WHERE status='open'").get().c,
          in_progress: db.prepare("SELECT COUNT(*) as c FROM tickets WHERE status='in_progress'").get().c,
          resolved: db.prepare("SELECT COUNT(*) as c FROM tickets WHERE status='resolved'").get().c,
          total: db.prepare("SELECT COUNT(*) as c FROM tickets").get().c,
        };
        break;
      case 'asset_stats':
        data = {
          total: db.prepare("SELECT COUNT(*) as c FROM assets").get().c,
          available: db.prepare("SELECT COUNT(*) as c FROM assets WHERE status='available'").get().c,
          in_use: db.prepare("SELECT COUNT(*) as c FROM assets WHERE status='in_use'").get().c,
        };
        break;
      case 'recent_tickets':
        data = db.prepare("SELECT id, title, status, priority, created_at FROM tickets ORDER BY created_at DESC LIMIT 5").all();
        break;
      case 'user_stats':
        data = { total: db.prepare("SELECT COUNT(*) as c FROM users").get().c };
        break;
      default:
        data = {};
    }

    res.json({ widget, data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Tipos de widgets disponibles
router.get('/types', auth, (req, res) => {
  res.json([
    { type: 'ticket_stats', name: 'Estadísticas de Tickets', icon: '🎫' },
    { type: 'asset_stats', name: 'Estadísticas de Activos', icon: '💻' },
    { type: 'recent_tickets', name: 'Tickets Recientes', icon: '📋' },
    { type: 'user_stats', name: 'Estadísticas de Usuarios', icon: '👥' },
    { type: 'sla_compliance', name: 'Cumplimiento SLA', icon: '⏱️' },
    { type: 'chart_bar', name: 'Gráfica de Barras', icon: '📊' },
    { type: 'chart_pie', name: 'Gráfica Circular', icon: '🥧' },
    { type: 'activity_feed', name: 'Feed de Actividad', icon: '📰' },
  ]);
});

module.exports = router;