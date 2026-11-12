const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth } = require('../middleware/auth');

// Get real-time dashboard data
router.get('/', auth, (req, res) => {
  try {
    const dashboardData = {
      timestamp: new Date().toISOString(),
      tickets: {
        total: db.prepare('SELECT COUNT(*) as count FROM tickets').get().count,
        open: db.prepare("SELECT COUNT(*) as count FROM tickets WHERE status = 'open'").get().count,
        inProgress: db.prepare("SELECT COUNT(*) as count FROM tickets WHERE status = 'in_progress'").get().count,
        resolved: db.prepare("SELECT COUNT(*) as count FROM tickets WHERE status = 'resolved'").get().count,
        closed: db.prepare("SELECT COUNT(*) as count FROM tickets WHERE status = 'closed'").get().count,
        myAssigned: db.prepare(`
          SELECT COUNT(*) as count FROM tickets 
          WHERE assigned_to = ? AND status NOT IN ('closed')
        `).get(req.user.id).count,
      },
      assets: {
        total: db.prepare('SELECT COUNT(*) as count FROM assets').get().count,
        available: db.prepare("SELECT COUNT(*) as count FROM assets WHERE status = 'available'").get().count,
        inUse: db.prepare("SELECT COUNT(*) as count FROM assets WHERE status = 'in_use'").get().count,
        maintenance: db.prepare("SELECT COUNT(*) as count FROM assets WHERE status = 'maintenance'").get().count,
      },
      notifications: {
        unread: db.prepare(`
          SELECT COUNT(*) as count FROM notifications 
          WHERE user_id = ? AND read = 0
        `).get(req.user.id).count,
      },
      recentActivity: getRecentActivity(),
      urgentItems: getUrgentItems(),
      upcomingDeadlines: getUpcomingDeadlines(),
    };

    res.json(dashboardData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get live ticket updates
router.get('/tickets/live', auth, (req, res) => {
  try {
    const { since } = req.query;

    let query = `
      SELECT t.id, t.title, t.status, t.priority, t.updated_at, t.created_at,
        u.name as assigned_to_name
      FROM tickets t
      LEFT JOIN users u ON t.assigned_to = u.id
    `;

    const params = [];

    if (since) {
      query += ' WHERE t.updated_at > ?';
      params.push(since);
    }

    query += ' ORDER BY t.updated_at DESC LIMIT 20';

    const tickets = db.prepare(query).all(...params);
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get live asset updates
router.get('/assets/live', auth, (req, res) => {
  try {
    const { since } = req.query;

    let query = `
      SELECT a.id, a.name, a.type, a.status, a.updated_at,
        u.name as assigned_to_name
      FROM assets a
      LEFT JOIN users u ON a.assigned_to = u.id
    `;

    const params = [];

    if (since) {
      query += ' WHERE a.updated_at > ?';
      params.push(since);
    }

    query += ' ORDER BY a.updated_at DESC LIMIT 20';

    const assets = db.prepare(query).all(...params);
    res.json(assets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get performance metrics
router.get('/metrics', auth, (req, res) => {
  try {
    const metrics = {
      ticketMetrics: {
        avgResolutionTime: db.prepare(`
          SELECT AVG((julianday(resolved_at) - julianday(created_at)) * 24) as hours
          FROM tickets
          WHERE status IN ('resolved', 'closed') AND resolved_at IS NOT NULL
        `).get().hours || 0,
        avgResponseTime: db.prepare(`
          SELECT AVG((julianday(first_response_at) - julianday(created_at)) * 24 * 60) as minutes
          FROM tickets
          WHERE first_response_at IS NOT NULL
        `).get().minutes || 0,
        resolutionRate: calculateResolutionRate(),
      },
      slaMetrics: getSLAMetrics(),
      userMetrics: {
        totalUsers: db.prepare('SELECT COUNT(*) as count FROM users').get().count,
        activeToday: db.prepare(`
          SELECT COUNT(DISTINCT user_id) as count FROM user_sessions
          WHERE DATE(last_active) = DATE('now')
        `).get().count,
      },
    };

    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

function getRecentActivity() {
  const activities = [];

  // Recent tickets
  const recentTickets = db.prepare(`
    SELECT t.id, t.title, t.status, t.created_at,
      u.name as user_name
    FROM tickets t
    LEFT JOIN users u ON t.created_by = u.id
    ORDER BY t.created_at DESC
    LIMIT 5
  `).all();

  recentTickets.forEach(ticket => {
    activities.push({
      type: 'ticket_created',
      title: `New ticket: ${ticket.title}`,
      user: ticket.user_name,
      timestamp: ticket.created_at,
      link: `/tickets/${ticket.id}`,
    });
  });

  // Recent comments
  const recentComments = db.prepare(`
    SELECT tc.comment, tc.created_at,
      u.name as user_name,
      t.id as ticket_id, t.title as ticket_title
    FROM ticket_comments tc
    JOIN tickets t ON tc.ticket_id = t.id
    LEFT JOIN users u ON tc.user_id = u.id
    ORDER BY tc.created_at DESC
    LIMIT 5
  `).all();

  recentComments.forEach(comment => {
    activities.push({
      type: 'ticket_comment',
      title: `Comment on ticket #${comment.ticket_id}`,
      user: comment.user_name,
      timestamp: comment.created_at,
      link: `/tickets/${comment.ticket_id}`,
    });
  });

  // Sort by timestamp
  activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return activities.slice(0, 10);
}

function getUrgentItems() {
  const items = [];

  // Urgent tickets
  const urgentTickets = db.prepare(`
    SELECT id, title, priority, created_at
    FROM tickets
    WHERE priority = 'urgent' AND status NOT IN ('closed', 'resolved')
    ORDER BY created_at DESC
    LIMIT 5
  `).all();

  urgentTickets.forEach(ticket => {
    items.push({
      type: 'urgent_ticket',
      title: ticket.title,
      id: ticket.id,
      link: `/tickets/${ticket.id}`,
    });
  });

  // Overdue SLAs
  const overdueSLAs = db.prepare(`
    SELECT t.id, t.title, t.created_at,
      s.name as sla_name, s.response_time
    FROM tickets t
    JOIN slas s ON t.sla_id = s.id
    WHERE t.status IN ('open', 'in_progress')
      AND (julianday('now') - julianday(t.created_at)) * 24 * 60 > s.response_time
    LIMIT 5
  `).all();

  overdueSLAs.forEach(ticket => {
    items.push({
      type: 'sla_breach',
      title: `SLA breach: ${ticket.title}`,
      id: ticket.id,
      link: `/tickets/${ticket.id}`,
    });
  });

  return items;
}

function getUpcomingDeadlines() {
  const deadlines = [];

  // Contract expirations
  const contractExpirations = db.prepare(`
    SELECT id, name, end_date, value
    FROM contracts
    WHERE end_date BETWEEN DATE('now') AND DATE('now', '+30 days')
      AND status = 'active'
    ORDER BY end_date
    LIMIT 5
  `).all();

  contractExpirations.forEach(contract => {
    deadlines.push({
      type: 'contract_expiration',
      title: contract.name,
      date: contract.end_date,
      link: `/contracts/${contract.id}`,
    });
  });

  // Warranty expirations
  const warrantyExpirations = db.prepare(`
    SELECT id, name, warranty_expiry
    FROM assets
    WHERE warranty_expiry BETWEEN DATE('now') AND DATE('now', '+30 days')
    ORDER BY warranty_expiry
    LIMIT 5
  `).all();

  warrantyExpirations.forEach(asset => {
    deadlines.push({
      type: 'warranty_expiration',
      title: asset.name,
      date: asset.warranty_expiry,
      link: `/assets/${asset.id}`,
    });
  });

  // Sort by date
  deadlines.sort((a, b) => new Date(a.date) - new Date(b.date));

  return deadlines.slice(0, 10);
}

function calculateResolutionRate() {
  const total = db.prepare('SELECT COUNT(*) as count FROM tickets').get().count;
  const resolved = db.prepare(`
    SELECT COUNT(*) as count FROM tickets
    WHERE status IN ('resolved', 'closed')
  `).get().count;

  return total > 0 ? Math.round((resolved / total) * 100) : 0;
}

function getSLAMetrics() {
  try {
    const slaData = db.prepare(`
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
    `).all();

    return slaData.map(sla => ({
      name: sla.name,
      compliance: sla.total > 0 ? Math.round(((sla.total - sla.breached) / sla.total) * 100) : 100,
      total: sla.total,
      breached: sla.breached,
    }));
  } catch (error) {
    return [];
  }
}

module.exports = router;
