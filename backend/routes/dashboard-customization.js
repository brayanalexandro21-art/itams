const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth } = require('../middleware/auth');

// Get available widget types
router.get('/widgets/types', auth, (req, res) => {
  try {
    const widgetTypes = [
      { type: 'ticket_stats', label: 'Ticket Statistics', description: 'Overview of ticket status', icon: '📊', size: 'medium' },
      { type: 'recent_tickets', label: 'Recent Tickets', description: 'Latest tickets', icon: '🎫', size: 'medium' },
      { type: 'asset_stats', label: 'Asset Statistics', description: 'Asset status overview', icon: '💻', size: 'medium' },
      { type: 'ai_insights', label: 'AI Insights', description: 'Smart analytics and trends', icon: '🤖', size: 'large' },
      { type: 'my_tickets', label: 'My Tickets', description: 'Tickets assigned to you', icon: '📋', size: 'medium' },
      { type: 'sla_compliance', label: 'SLA Compliance', description: 'SLA performance metrics', icon: '⏱️', size: 'medium' },
      { type: 'knowledge_popular', label: 'Popular Articles', description: 'Most viewed KB articles', icon: '📚', size: 'medium' },
      { type: 'activity_feed', label: 'Activity Feed', description: 'Recent system activity', icon: '📰', size: 'large' },
      { type: 'calendar', label: 'Calendar', description: 'Upcoming events', icon: '📅', size: 'medium' },
      { type: 'time_tracking', label: 'Time Tracking', description: 'Your time entries', icon: '⏱️', size: 'small' },
      { type: 'notifications', label: 'Notifications', description: 'Recent notifications', icon: '🔔', size: 'small' },
      { type: 'quick_actions', label: 'Quick Actions', description: 'Common actions', icon: '⚡', size: 'small' },
    ];

    res.json(widgetTypes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's dashboard layout
router.get('/layout', auth, (req, res) => {
  try {
    let layout = db.prepare('SELECT * FROM dashboard_layouts WHERE user_id = ?').get(req.user.id);

    if (!layout) {
      // Create default layout
      const defaultWidgets = [
        { type: 'ticket_stats', title: 'Ticket Statistics', position: 0, size: 'large', config: {} },
        { type: 'recent_tickets', title: 'Recent Tickets', position: 1, size: 'medium', config: {} },
        { type: 'my_tickets', title: 'My Tickets', position: 2, size: 'medium', config: {} },
        { type: 'quick_actions', title: 'Quick Actions', position: 3, size: 'small', config: {} },
      ];

      db.prepare(`
        INSERT INTO dashboard_layouts (user_id, layout, theme)
        VALUES (?, ?, 'default')
      `).run(req.user.id, JSON.stringify(defaultWidgets));

      layout = {
        user_id: req.user.id,
        layout: defaultWidgets,
        theme: 'default',
      };
    } else {
      layout.layout = JSON.parse(layout.layout);
    }

    res.json(layout);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Save dashboard layout
router.put('/layout', auth, (req, res) => {
  try {
    const { layout, theme } = req.body;

    const existing = db.prepare('SELECT id FROM dashboard_layouts WHERE user_id = ?').get(req.user.id);

    if (existing) {
      db.prepare(`
        UPDATE dashboard_layouts
        SET layout = ?, theme = ?, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `).run(JSON.stringify(layout), theme || 'default', req.user.id);
    } else {
      db.prepare(`
        INSERT INTO dashboard_layouts (user_id, layout, theme)
        VALUES (?, ?, ?)
      `).run(req.user.id, JSON.stringify(layout), theme || 'default');
    }

    res.json({ message: 'Dashboard layout saved' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get widget data
router.get('/widget/:type', auth, (req, res) => {
  try {
    const { type } = req.params;
    let data = {};

    switch (type) {
      case 'ticket_stats':
        data = {
          total: db.prepare('SELECT COUNT(*) as count FROM tickets').get().count,
          open: db.prepare("SELECT COUNT(*) as count FROM tickets WHERE status = 'open'").get().count,
          inProgress: db.prepare("SELECT COUNT(*) as count FROM tickets WHERE status = 'in_progress'").get().count,
          resolved: db.prepare("SELECT COUNT(*) as count FROM tickets WHERE status = 'resolved'").get().count,
        };
        break;

      case 'recent_tickets':
        data = db.prepare(`
          SELECT id, title, status, priority, created_at
          FROM tickets
          ORDER BY created_at DESC
          LIMIT 5
        `).all();
        break;

      case 'my_tickets':
        data = db.prepare(`
          SELECT id, title, status, priority, created_at
          FROM tickets
          WHERE assigned_to = ? AND status NOT IN ('closed')
          ORDER BY updated_at DESC
          LIMIT 5
        `).all(req.user.id);
        break;

      case 'asset_stats':
        data = {
          total: db.prepare('SELECT COUNT(*) as count FROM assets').get().count,
          available: db.prepare("SELECT COUNT(*) as count FROM assets WHERE status = 'available'").get().count,
          inUse: db.prepare("SELECT COUNT(*) as count FROM assets WHERE status = 'in_use'").get().count,
          maintenance: db.prepare("SELECT COUNT(*) as count FROM assets WHERE status = 'maintenance'").get().count,
        };
        break;

      case 'notifications':
        data = db.prepare(`
          SELECT id, title, message, type, read, created_at
          FROM notifications
          WHERE user_id = ?
          ORDER BY created_at DESC
          LIMIT 5
        `).all(req.user.id);
        break;

      case 'quick_actions':
        data = [
          { label: 'New Ticket', icon: '➕', url: '/tickets/new' },
          { label: 'New Asset', icon: '💻', url: '/assets/new' },
          { label: 'Search', icon: '🔍', url: '/search' },
          { label: 'Reports', icon: '📊', url: '/reports' },
        ];
        break;

      case 'time_tracking':
        data = db.prepare(`
          SELECT t.ticket_id, t.duration, t.description, t.start_time
          FROM time_entries t
          WHERE t.user_id = ? AND t.end_time IS NULL
          LIMIT 1
        `).get(req.user.id);
        break;

      case 'sla_compliance':
        data = db.prepare(`
          SELECT 
            s.name,
            COUNT(t.id) as total,
            SUM(CASE WHEN 
              (julianday(t.first_response_at) - julianday(t.created_at)) * 24 * 60 <= s.response_time 
              OR t.first_response_at IS NULL THEN 0 ELSE 1 
            END) as breached
          FROM tickets t
          JOIN slas s ON t.sla_id = s.id
          GROUP BY s.id
          LIMIT 5
        `).all();
        break;

      default:
        return res.status(400).json({ error: 'Invalid widget type' });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add widget to dashboard
router.post('/widget', auth, (req, res) => {
  try {
    const { widget_type, title, size, config } = req.body;

    const layout = db.prepare('SELECT layout FROM dashboard_layouts WHERE user_id = ?').get(req.user.id);
    const widgets = layout ? JSON.parse(layout.layout) : [];

    const newWidget = {
      type: widget_type,
      title,
      position: widgets.length,
      size: size || 'medium',
      config: config || {},
    };

    widgets.push(newWidget);

    if (layout) {
      db.prepare('UPDATE dashboard_layouts SET layout = ? WHERE user_id = ?')
        .run(JSON.stringify(widgets), req.user.id);
    } else {
      db.prepare('INSERT INTO dashboard_layouts (user_id, layout) VALUES (?, ?)')
        .run(req.user.id, JSON.stringify(widgets));
    }

    res.json(newWidget);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Remove widget from dashboard
router.delete('/widget/:index', auth, (req, res) => {
  try {
    const layout = db.prepare('SELECT layout FROM dashboard_layouts WHERE user_id = ?').get(req.user.id);
    if (!layout) {
      return res.status(404).json({ error: 'Layout not found' });
    }

    const widgets = JSON.parse(layout.layout);
    widgets.splice(parseInt(req.params.index), 1);

    // Update positions
    widgets.forEach((w, i) => w.position = i);

    db.prepare('UPDATE dashboard_layouts SET layout = ? WHERE user_id = ?')
      .run(JSON.stringify(widgets), req.user.id);

    res.json({ message: 'Widget removed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
