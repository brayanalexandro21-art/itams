const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

// Generate ticket report PDF data
router.get('/tickets/report', auth, (req, res) => {
  try {
    const { start_date, end_date, status, priority } = req.query;

    let query = `
      SELECT t.*, 
        u1.name as created_by_name,
        u2.name as assigned_to_name
      FROM tickets t
      LEFT JOIN users u1 ON t.created_by = u1.id
      LEFT JOIN users u2 ON t.assigned_to = u2.id
      WHERE 1=1
    `;

    const params = [];

    if (start_date) {
      query += ' AND t.created_at >= ?';
      params.push(start_date);
    }
    if (end_date) {
      query += ' AND t.created_at <= ?';
      params.push(end_date);
    }
    if (status) {
      query += ' AND t.status = ?';
      params.push(status);
    }
    if (priority) {
      query += ' AND t.priority = ?';
      params.push(priority);
    }

    query += ' ORDER BY t.created_at DESC';

    const tickets = db.prepare(query).all(...params);

    // Calculate statistics
    const stats = {
      total: tickets.length,
      open: tickets.filter(t => t.status === 'open').length,
      in_progress: tickets.filter(t => t.status === 'in_progress').length,
      resolved: tickets.filter(t => t.status === 'resolved').length,
      closed: tickets.filter(t => t.status === 'closed').length,
      urgent: tickets.filter(t => t.priority === 'urgent').length,
      high: tickets.filter(t => t.priority === 'high').length,
      medium: tickets.filter(t => t.priority === 'medium').length,
      low: tickets.filter(t => t.priority === 'low').length,
    };

    // Generate PDF-ready data
    const reportData = {
      title: 'ITAMS Ticket Report',
      generated_at: new Date().toISOString(),
      period: {
        start: start_date || 'All time',
        end: end_date || 'Present',
      },
      statistics: stats,
      tickets: tickets.map(t => ({
        id: t.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        category: t.category || 'N/A',
        created_by: t.created_by_name || 'Unknown',
        assigned_to: t.assigned_to_name || 'Unassigned',
        created_at: t.created_at,
        updated_at: t.updated_at,
      })),
      summary: generateSummary(tickets),
    };

    // In production, use a PDF library like pdfkit or puppeteer
    // For now, return JSON that can be converted to PDF on frontend
    res.json(reportData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate asset report PDF data
router.get('/assets/report', auth, (req, res) => {
  try {
    const { type, status, location } = req.query;

    let query = `
      SELECT a.*, u.name as assigned_to_name
      FROM assets a
      LEFT JOIN users u ON a.assigned_to = u.id
      WHERE 1=1
    `;

    const params = [];

    if (type) {
      query += ' AND a.type = ?';
      params.push(type);
    }
    if (status) {
      query += ' AND a.status = ?';
      params.push(status);
    }
    if (location) {
      query += ' AND a.location = ?';
      params.push(location);
    }

    query += ' ORDER BY a.name';

    const assets = db.prepare(query).all(...params);

    const stats = {
      total: assets.length,
      available: assets.filter(a => a.status === 'available').length,
      in_use: assets.filter(a => a.status === 'in_use').length,
      maintenance: assets.filter(a => a.status === 'maintenance').length,
      retired: assets.filter(a => a.status === 'retired').length,
      byType: countByField(assets, 'type'),
      byLocation: countByField(assets, 'location'),
    };

    const reportData = {
      title: 'ITAMS Asset Report',
      generated_at: new Date().toISOString(),
      statistics: stats,
      assets: assets.map(a => ({
        id: a.id,
        name: a.name,
        type: a.type,
        serial_number: a.serial_number || 'N/A',
        model: a.model || 'N/A',
        status: a.status,
        location: a.location || 'N/A',
        assigned_to: a.assigned_to_name || 'Unassigned',
        warranty_expiry: a.warranty_expiry || 'N/A',
      })),
    };

    res.json(reportData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate SLA compliance report
router.get('/sla/report', auth, adminOnly, (req, res) => {
  try {
    const compliance = db.prepare(`
      SELECT 
        s.id,
        s.name,
        s.response_time,
        s.resolution_time,
        COUNT(t.id) as total_tickets,
        SUM(CASE WHEN 
          (julianday(t.first_response_at) - julianday(t.created_at)) * 24 * 60 <= s.response_time 
          OR t.first_response_at IS NULL THEN 0 ELSE 1 
        END) as response_breached,
        SUM(CASE WHEN 
          (julianday(t.resolved_at) - julianday(t.created_at)) * 24 * 60 <= s.resolution_time 
          OR t.resolved_at IS NULL THEN 0 ELSE 1 
        END) as resolution_breached
      FROM slas s
      LEFT JOIN tickets t ON t.sla_id = s.id
      WHERE s.active = 1
      GROUP BY s.id
    `).all();

    const reportData = {
      title: 'ITAMS SLA Compliance Report',
      generated_at: new Date().toISOString(),
      sla_data: compliance.map(s => ({
        name: s.name,
        response_time: `${s.response_time} minutes`,
        resolution_time: `${s.resolution_time} minutes`,
        total_tickets: s.total_tickets,
        response_compliance: s.total_tickets > 0 
          ? ((s.total_tickets - s.response_breached) / s.total_tickets * 100).toFixed(2) + '%'
          : '100%',
        resolution_compliance: s.total_tickets > 0
          ? ((s.total_tickets - s.resolution_breached) / s.total_tickets * 100).toFixed(2) + '%'
          : '100%',
      })),
      overall_compliance: calculateOverallCompliance(compliance),
    };

    res.json(reportData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate user activity report
router.get('/users/report', auth, adminOnly, (req, res) => {
  try {
    const users = db.prepare(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.role,
        u.department,
        (SELECT COUNT(*) FROM tickets WHERE created_by = u.id) as tickets_created,
        (SELECT COUNT(*) FROM tickets WHERE assigned_to = u.id) as tickets_assigned,
        (SELECT COUNT(*) FROM tickets WHERE assigned_to = u.id AND status IN ('resolved', 'closed')) as tickets_resolved,
        (SELECT COUNT(*) FROM knowledge_base WHERE author_id = u.id) as articles_created,
        (SELECT COALESCE(SUM(duration), 0) FROM time_entries WHERE user_id = u.id) as total_time_minutes
      FROM users u
      ORDER BY u.name
    `).all();

    const reportData = {
      title: 'ITAMS User Activity Report',
      generated_at: new Date().toISOString(),
      users: users.map(u => ({
        name: u.name,
        email: u.email,
        role: u.role,
        department: u.department || 'N/A',
        tickets_created: u.tickets_created,
        tickets_assigned: u.tickets_assigned,
        tickets_resolved: u.tickets_resolved,
        articles_created: u.articles_created,
        total_time: `${Math.floor(u.total_time_minutes / 60)}h ${Math.round(u.total_time_minutes % 60)}m`,
        resolution_rate: u.tickets_assigned > 0 
          ? ((u.tickets_resolved / u.tickets_assigned) * 100).toFixed(1) + '%'
          : 'N/A',
      })),
      summary: {
        total_users: users.length,
        total_tickets_created: users.reduce((sum, u) => sum + u.tickets_created, 0),
        total_tickets_resolved: users.reduce((sum, u) => sum + u.tickets_resolved, 0),
      },
    };

    res.json(reportData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

function generateSummary(tickets) {
  const byPriority = countByField(tickets, 'priority');
  const byCategory = countByField(tickets, 'category');
  
  return {
    byPriority,
    byCategory,
  };
}

function countByField(array, field) {
  return array.reduce((acc, item) => {
    const key = item[field] || 'Unknown';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function calculateOverallCompliance(compliance) {
  if (compliance.length === 0) return '100%';
  
  const totalTickets = compliance.reduce((sum, s) => sum + s.total_tickets, 0);
  const totalBreached = compliance.reduce((sum, s) => sum + s.response_breached + s.resolution_breached, 0);
  const totalPossible = totalTickets * 2;
  
  if (totalPossible === 0) return '100%';
  return ((totalPossible - totalBreached) / totalPossible * 100).toFixed(2) + '%';
}

module.exports = router;
