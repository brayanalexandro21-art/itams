const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

// Get chart data for different metrics
router.get('/charts/:metric', auth, (req, res) => {
  try {
    const { metric } = req.params;
    const { period, start_date, end_date, group_by } = req.query;

    let chartData = {};

    switch (metric) {
      case 'tickets-by-status':
        chartData = {
          type: 'pie',
          labels: ['Open', 'In Progress', 'Resolved', 'Closed'],
          datasets: [{
            data: [
              db.prepare("SELECT COUNT(*) as count FROM tickets WHERE status = 'open'").get().count,
              db.prepare("SELECT COUNT(*) as count FROM tickets WHERE status = 'in_progress'").get().count,
              db.prepare("SELECT COUNT(*) as count FROM tickets WHERE status = 'resolved'").get().count,
              db.prepare("SELECT COUNT(*) as count FROM tickets WHERE status = 'closed'").get().count,
            ],
            backgroundColor: ['#f59e0b', '#3b82f6', '#22c55e', '#6b7280'],
          }],
        };
        break;

      case 'tickets-by-priority':
        chartData = {
          type: 'bar',
          labels: ['Urgent', 'High', 'Medium', 'Low'],
          datasets: [{
            label: 'Tickets',
            data: [
              db.prepare("SELECT COUNT(*) as count FROM tickets WHERE priority = 'urgent'").get().count,
              db.prepare("SELECT COUNT(*) as count FROM tickets WHERE priority = 'high'").get().count,
              db.prepare("SELECT COUNT(*) as count FROM tickets WHERE priority = 'medium'").get().count,
              db.prepare("SELECT COUNT(*) as count FROM tickets WHERE priority = 'low'").get().count,
            ],
            backgroundColor: ['#ef4444', '#f97316', '#eab308', '#22c55e'],
          }],
        };
        break;

      case 'tickets-over-time':
        const timeData = db.prepare(`
          SELECT DATE(created_at) as date, COUNT(*) as count
          FROM tickets
          WHERE created_at >= DATE('now', '-30 days')
          GROUP BY DATE(created_at)
          ORDER BY date
        `).all();
        chartData = {
          type: 'line',
          labels: timeData.map(d => d.date),
          datasets: [{
            label: 'Tickets',
            data: timeData.map(d => d.count),
            borderColor: '#4f46e5',
            backgroundColor: 'rgba(79, 70, 229, 0.1)',
            fill: true,
          }],
        };
        break;

      case 'tickets-by-category':
        const catData = db.prepare(`
          SELECT category, COUNT(*) as count
          FROM tickets
          WHERE category IS NOT NULL
          GROUP BY category
          ORDER BY count DESC
        `).all();
        chartData = {
          type: 'doughnut',
          labels: catData.map(c => c.category),
          datasets: [{
            data: catData.map(c => c.count),
            backgroundColor: [
              '#4f46e5', '#7c3aed', '#ec4899', '#ef4444',
              '#f97316', '#eab308', '#22c55e', '#06b6d4',
            ],
          }],
        };
        break;

      case 'resolution-time':
        const resolutionData = db.prepare(`
          SELECT 
            DATE(resolved_at) as date,
            AVG((julianday(resolved_at) - julianday(created_at)) * 24) as avg_hours
          FROM tickets
          WHERE status IN ('resolved', 'closed') AND resolved_at IS NOT NULL
          GROUP BY DATE(resolved_at)
          ORDER BY date DESC
          LIMIT 30
        `).all();
        chartData = {
          type: 'line',
          labels: resolutionData.map(d => d.date),
          datasets: [{
            label: 'Avg Hours',
            data: resolutionData.map(d => Math.round(d.avg_hours * 10) / 10),
            borderColor: '#22c55e',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            fill: true,
          }],
        };
        break;

      case 'technician-performance':
        const techData = db.prepare(`
          SELECT 
            u.name,
            COUNT(t.id) as tickets_handled,
            SUM(CASE WHEN t.status IN ('resolved', 'closed') THEN 1 ELSE 0 END) as resolved
          FROM tickets t
          JOIN users u ON t.assigned_to = u.id
          WHERE t.assigned_to IS NOT NULL
          GROUP BY t.assigned_to
          ORDER BY tickets_handled DESC
          LIMIT 10
        `).all();
        chartData = {
          type: 'bar',
          labels: techData.map(t => t.name),
          datasets: [
            {
              label: 'Total',
              data: techData.map(t => t.tickets_handled),
              backgroundColor: '#3b82f6',
            },
            {
              label: 'Resolved',
              data: techData.map(t => t.resolved),
              backgroundColor: '#22c55e',
            },
          ],
        };
        break;

      case 'sla-compliance':
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
        chartData = {
          type: 'bar',
          labels: slaData.map(s => s.name),
          datasets: [
            {
              label: 'Compliant',
              data: slaData.map(s => s.total - s.breached),
              backgroundColor: '#22c55e',
            },
            {
              label: 'Breached',
              data: slaData.map(s => s.breached),
              backgroundColor: '#ef4444',
            },
          ],
        };
        break;

      case 'satisfaction-trend':
        const satData = db.prepare(`
          SELECT 
            DATE(created_at) as date,
            AVG(overall_rating) as avg_rating
          FROM survey_responses
          GROUP BY DATE(created_at)
          ORDER BY date DESC
          LIMIT 30
        `).all();
        chartData = {
          type: 'line',
          labels: satData.map(d => d.date),
          datasets: [{
            label: 'Avg Rating',
            data: satData.map(d => Math.round(d.avg_rating * 10) / 10),
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            fill: true,
          }],
        };
        break;

      default:
        return res.status(400).json({ error: 'Invalid metric' });
    }

    res.json(chartData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get custom report data
router.post('/custom', auth, adminOnly, (req, res) => {
  try {
    const { entity, metrics, filters, group_by, date_range } = req.body;

    let data = {};
    let query = '';
    const params = [];

    switch (entity) {
      case 'tickets':
        query = 'SELECT * FROM tickets WHERE 1=1';
        break;
      case 'assets':
        query = 'SELECT * FROM assets WHERE 1=1';
        break;
      default:
        return res.status(400).json({ error: 'Invalid entity' });
    }

    // Apply filters
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          query += ` AND ${key} = ?`;
          params.push(value);
        }
      });
    }

    // Apply date range
    if (date_range) {
      if (date_range.start) {
        query += ' AND created_at >= ?';
        params.push(date_range.start);
      }
      if (date_range.end) {
        query += ' AND created_at <= ?';
        params.push(date_range.end);
      }
    }

    const results = db.prepare(query).all(...params);

    // Process metrics
    if (metrics && metrics.length > 0) {
      data.summary = {};
      metrics.forEach(metric => {
        switch (metric) {
          case 'count':
            data.summary.total = results.length;
            break;
          case 'by_status':
            data.summary.byStatus = countByField(results, 'status');
            break;
          case 'by_priority':
            data.summary.byPriority = countByField(results, 'priority');
            break;
          case 'by_category':
            data.summary.byCategory = countByField(results, 'category');
            break;
        }
      });
    }

    data.results = results;
    data.count = results.length;

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Export report to CSV
router.post('/export', auth, adminOnly, (req, res) => {
  try {
    const { entity, filters, format } = req.body;

    let query = '';
    const params = [];

    switch (entity) {
      case 'tickets':
        query = `
          SELECT t.id, t.title, t.status, t.priority, t.category,
            u1.name as created_by, u2.name as assigned_to,
            t.created_at, t.updated_at
          FROM tickets t
          LEFT JOIN users u1 ON t.created_by = u1.id
          LEFT JOIN users u2 ON t.assigned_to = u2.id
          WHERE 1=1
        `;
        break;
      case 'assets':
        query = `
          SELECT a.id, a.name, a.type, a.serial_number, a.status, a.location,
            u.name as assigned_to
          FROM assets a
          LEFT JOIN users u ON a.assigned_to = u.id
          WHERE 1=1
        `;
        break;
      default:
        return res.status(400).json({ error: 'Invalid entity' });
    }

    // Apply filters
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          query += ` AND t.${key} = ?`;
          params.push(value);
        }
      });
    }

    const results = db.prepare(query).all(...params);

    if (format === 'csv') {
      if (results.length === 0) {
        return res.status(404).json({ error: 'No data to export' });
      }

      const headers = Object.keys(results[0]).join(',');
      const rows = results.map(row => 
        Object.values(row).map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(',')
      );
      const csv = [headers, ...rows].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${entity}_report.csv`);
      res.send(csv);
    } else {
      res.json(results);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

function countByField(array, field) {
  return array.reduce((acc, item) => {
    const key = item[field] || 'Unknown';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

module.exports = router;
