const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth } = require('../middleware/auth');

// Get user's dashboard widgets
router.get('/', auth, (req, res) => {
  try {
    const widgets = db.prepare(`
      SELECT * FROM dashboard_widgets
      WHERE user_id = ?
      ORDER BY position
    `).all(req.user.id);

    // If no widgets, return default layout
    if (widgets.length === 0) {
      const defaultWidgets = [
        { widget_type: 'ticket_stats', title: 'Ticket Statistics', position: 0, size: 'large', config: '{}' },
        { widget_type: 'recent_tickets', title: 'Recent Tickets', position: 1, size: 'medium', config: '{}' },
        { widget_type: 'asset_stats', title: 'Asset Statistics', position: 2, size: 'medium', config: '{}' },
        { widget_type: 'ai_insights', title: 'AI Insights', position: 3, size: 'large', config: '{}' },
      ];

      // Save default widgets
      const insert = db.prepare(`
        INSERT INTO dashboard_widgets (user_id, widget_type, title, position, size, config)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      defaultWidgets.forEach(w => {
        insert.run(req.user.id, w.widget_type, w.title, w.position, w.size, w.config);
      });

      return res.json(defaultWidgets.map((w, i) => ({ ...w, id: i + 1, user_id: req.user.id })));
    }

    res.json(widgets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Save widget layout
router.post('/save', auth, (req, res) => {
  try {
    const { widgets } = req.body;

    // Delete existing widgets for user
    db.prepare('DELETE FROM dashboard_widgets WHERE user_id = ?').run(req.user.id);

    // Insert new widgets
    const insert = db.prepare(`
      INSERT INTO dashboard_widgets (user_id, widget_type, title, position, size, config)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    widgets.forEach((widget, index) => {
      insert.run(
        req.user.id,
        widget.widget_type,
        widget.title,
        index,
        widget.size || 'medium',
        JSON.stringify(widget.config || {})
      );
    });

    res.json({ message: 'Dashboard saved' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add widget
router.post('/', auth, (req, res) => {
  try {
    const { widget_type, title, size, config } = req.body;

    // Get max position
    const maxPos = db.prepare('SELECT MAX(position) as max FROM dashboard_widgets WHERE user_id = ?')
      .get(req.user.id);
    const position = (maxPos.max || -1) + 1;

    const result = db.prepare(`
      INSERT INTO dashboard_widgets (user_id, widget_type, title, position, size, config)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(req.user.id, widget_type, title, position, size || 'medium', JSON.stringify(config || {}));

    const widget = db.prepare('SELECT * FROM dashboard_widgets WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(widget);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update widget
router.put('/:id', auth, (req, res) => {
  try {
    const { title, size, config } = req.body;

    db.prepare(`
      UPDATE dashboard_widgets
      SET title = COALESCE(?, title),
          size = COALESCE(?, size),
          config = COALESCE(?, config)
      WHERE id = ? AND user_id = ?
    `).run(title, size, config ? JSON.stringify(config) : null, req.params.id, req.user.id);

    res.json({ message: 'Widget updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete widget
router.delete('/:id', auth, (req, res) => {
  try {
    db.prepare('DELETE FROM dashboard_widgets WHERE id = ? AND user_id = ?')
      .run(req.params.id, req.user.id);
    res.json({ message: 'Widget deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get available widget types
router.get('/types', auth, (req, res) => {
  try {
    const types = [
      { type: 'ticket_stats', label: 'Ticket Statistics', description: 'Overview of ticket status' },
      { type: 'recent_tickets', label: 'Recent Tickets', description: 'Latest tickets' },
      { type: 'asset_stats', label: 'Asset Statistics', description: 'Asset status overview' },
      { type: 'ai_insights', label: 'AI Insights', description: 'Smart analytics and trends' },
      { type: 'my_tickets', label: 'My Tickets', description: 'Tickets assigned to you' },
      { type: 'sla_compliance', label: 'SLA Compliance', description: 'SLA performance metrics' },
      { type: 'knowledge_popular', label: 'Popular Articles', description: 'Most viewed KB articles' },
      { type: 'activity_feed', label: 'Activity Feed', description: 'Recent system activity' },
    ];

    res.json(types);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
