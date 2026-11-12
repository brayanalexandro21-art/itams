const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

// Get available widget types
router.get('/types', auth, (req, res) => {
  try {
    const types = [
      {
        id: 'ticket_stats',
        name: 'Ticket Statistics',
        description: 'Overview of ticket status',
        icon: '📊',
        size: 'medium',
        refreshInterval: 60,
      },
      {
        id: 'recent_tickets',
        name: 'Recent Tickets',
        description: 'Latest tickets list',
        icon: '🎫',
        size: 'medium',
        refreshInterval: 30,
      },
      {
        id: 'my_tickets',
        name: 'My Tickets',
        description: 'Tickets assigned to you',
        icon: '📋',
        size: 'medium',
        refreshInterval: 30,
      },
      {
        id: 'asset_stats',
        name: 'Asset Statistics',
        description: 'Asset status overview',
        icon: '💻',
        size: 'medium',
        refreshInterval: 120,
      },
      {
        id: 'ai_insights',
        name: 'AI Insights',
        description: 'Smart analytics and trends',
        icon: '🤖',
        size: 'large',
        refreshInterval: 300,
      },
      {
        id: 'sla_compliance',
        name: 'SLA Compliance',
        description: 'SLA performance metrics',
        icon: '⏱️',
        size: 'medium',
        refreshInterval: 60,
      },
      {
        id: 'calendar',
        name: 'Calendar',
        description: 'Upcoming events',
        icon: '📅',
        size: 'medium',
        refreshInterval: 300,
      },
      {
        id: 'time_tracking',
        name: 'Time Tracking',
        description: 'Your time entries',
        icon: '⏱️',
        size: 'small',
        refreshInterval: 30,
      },
      {
        id: 'notifications',
        name: 'Notifications',
        description: 'Recent notifications',
        icon: '🔔',
        size: 'small',
        refreshInterval: 15,
      },
      {
        id: 'quick_actions',
        name: 'Quick Actions',
        description: 'Common actions',
        icon: '⚡',
        size: 'small',
        refreshInterval: 0,
      },
      {
        id: 'knowledge_popular',
        name: 'Popular Articles',
        description: 'Most viewed KB articles',
        icon: '📚',
        size: 'medium',
        refreshInterval: 300,
      },
      {
        id: 'activity_feed',
        name: 'Activity Feed',
        description: 'Recent system activity',
        icon: '📰',
        size: 'large',
        refreshInterval: 30,
      },
      {
        id: 'contract_expiry',
        name: 'Contract Expiry',
        description: 'Contracts expiring soon',
        icon: '📄',
        size: 'medium',
        refreshInterval: 600,
      },
      {
        id: 'vendor_stats',
        name: 'Vendor Statistics',
        description: 'Vendor performance overview',
        icon: '🏭',
        size: 'medium',
        refreshInterval: 600,
      },
      {
        id: 'compliance_status',
        name: 'Compliance Status',
        description: 'Compliance overview',
        icon: '✅',
        size: 'medium',
        refreshInterval: 300,
      },
      {
        id: 'custom_chart',
        name: 'Custom Chart',
        description: 'Build your own chart',
        icon: '📈',
        size: 'large',
        refreshInterval: 60,
      },
    ];

    res.json(types);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get widget data by type
router.get('/data/:type', auth, (req, res) => {
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
          closed: db.prepare("SELECT COUNT(*) as count FROM tickets WHERE status = 'closed'").get().count,
        };
        break;

      case 'recent_tickets':
        data = db.prepare(`
          SELECT id, title, status, priority, created_at
          FROM tickets
          ORDER BY created_at DESC
          LIMIT 10
        `).all();
        break;

      case 'my_tickets':
        data = db.prepare(`
          SELECT id, title, status, priority, created_at
          FROM tickets
          WHERE assigned_to = ? AND status NOT IN ('closed')
          ORDER BY updated_at DESC
          LIMIT 10
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
          LIMIT 10
        `).all(req.user.id);
        break;

      case 'quick_actions':
        data = [
          { label: 'New Ticket', icon: '➕', url: '/tickets/new' },
          { label: 'New Asset', icon: '💻', url: '/assets/new' },
          { label: 'Search', icon: '🔍', url: '/search' },
          { label: 'Reports', icon: '📊', url: '/reports' },
          { label: 'Knowledge Base', icon: '📚', url: '/knowledgebase' },
        ];
        break;

      case 'calendar':
        data = db.prepare(`
          SELECT id, title, start_time, type
          FROM calendar_events
          WHERE start_time >= DATE('now')
          ORDER BY start_time
          LIMIT 10
        `).all();
        break;

      case 'time_tracking':
        data = db.prepare(`
          SELECT te.*, t.title as ticket_title
          FROM time_entries te
          LEFT JOIN tickets t ON te.ticket_id = t.id
          WHERE te.user_id = ? AND te.end_time IS NULL
          LIMIT 1
        `).get(req.user.id);
        break;

      case 'knowledge_popular':
        data = db.prepare(`
          SELECT id, title, category, views, helpful
          FROM knowledge_base
          ORDER BY views DESC
          LIMIT 10
        `).all();
        break;

      case 'activity_feed':
        data = db.prepare(`
          SELECT al.*, u.name as user_name
          FROM audit_logs al
          LEFT JOIN users u ON al.user_id = u.id
          ORDER BY al.created_at DESC
          LIMIT 10
        `).all();
        break;

      case 'contract_expiry':
        data = db.prepare(`
          SELECT c.id, c.name, c.end_date, v.name as vendor_name
          FROM contracts c
          LEFT JOIN vendors v ON c.vendor_id = v.id
          WHERE c.end_date BETWEEN DATE('now') AND DATE('now', '+90 days')
          AND c.status = 'active'
          ORDER BY c.end_date
          LIMIT 10
        `).all();
        break;

      case 'vendor_stats':
        data = db.prepare(`
          SELECT v.id, v.name,
            (SELECT COUNT(*) FROM contracts WHERE vendor_id = v.id) as contract_count,
            (SELECT AVG(quality_rating) FROM vendor_ratings WHERE vendor_id = v.id) as avg_rating
          FROM vendors v
          WHERE v.status = 'active'
          ORDER BY contract_count DESC
          LIMIT 10
        `).all();
        break;

      case 'compliance_status':
        data = {
          total: db.prepare('SELECT COUNT(*) as count FROM compliance_items').get().count,
          pending: db.prepare("SELECT COUNT(*) as count FROM compliance_items WHERE status = 'pending'").get().count,
          completed: db.prepare("SELECT COUNT(*) as count FROM compliance_items WHERE status = 'completed'").get().count,
          overdue: db.prepare("SELECT COUNT(*) as count FROM compliance_items WHERE due_date < DATE('now') AND status != 'completed'").get().count,
        };
        break;

      default:
        return res.status(400).json({ error: 'Invalid widget type' });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's saved widgets
router.get('/saved', auth, (req, res) => {
  try {
    const widgets = db.prepare(`
      SELECT * FROM dashboard_widgets
      WHERE user_id = ?
      ORDER BY position
    `).all(req.user.id);

    res.json(widgets.map(w => ({
      ...w,
      config: JSON.parse(w.config || '{}'),
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Save widget configuration
router.post('/saved', auth, (req, res) => {
  try {
    const { widget_type, title, position, size, config } = req.body;

    const result = db.prepare(`
      INSERT INTO dashboard_widgets (user_id, widget_type, title, position, size, config)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(req.user.id, widget_type, title, position || 0, size || 'medium', JSON.stringify(config || {}));

    res.status(201).json({ id: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update widget configuration
router.put('/saved/:id', auth, (req, res) => {
  try {
    const { title, position, size, config } = req.body;

    db.prepare(`
      UPDATE dashboard_widgets
      SET title = COALESCE(?, title),
          position = COALESCE(?, position),
          size = COALESCE(?, size),
          config = COALESCE(?, config)
      WHERE id = ? AND user_id = ?
    `).run(title, position, size, config ? JSON.stringify(config) : null, req.params.id, req.user.id);

    res.json({ message: 'Widget updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete widget
router.delete('/saved/:id', auth, (req, res) => {
  try {
    db.prepare('DELETE FROM dashboard_widgets WHERE id = ? AND user_id = ?')
      .run(req.params.id, req.user.id);
    res.json({ message: 'Widget deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
