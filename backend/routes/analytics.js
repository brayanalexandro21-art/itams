const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

// Get comprehensive analytics
router.get('/dashboard', auth, (req, res) => {
  try {
    const { period, start_date, end_date } = req.query;

    let dateFilter = '';
    const params = [];

    if (start_date && end_date) {
      dateFilter = 'AND created_at BETWEEN ? AND ?';
      params.push(start_date, end_date);
    } else if (period) {
      switch (period) {
        case 'today':
          dateFilter = "AND DATE(created_at) = DATE('now')";
          break;
        case 'week':
          dateFilter = "AND created_at >= DATE('now', '-7 days')";
          break;
        case 'month':
          dateFilter = "AND created_at >= DATE('now', '-30 days')";
          break;
        case 'quarter':
          dateFilter = "AND created_at >= DATE('now', '-90 days')";
          break;
        case 'year':
          dateFilter = "AND created_at >= DATE('now', '-365 days')";
          break;
      }
    }

    // Ticket metrics
    const ticketMetrics = db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved,
        SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed,
        AVG(CASE WHEN status IN ('resolved', 'closed') 
          THEN (julianday(resolved_at) - julianday(created_at)) * 24 
          ELSE NULL END) as avg_resolution_hours
      FROM tickets
      WHERE 1=1 ${dateFilter}
    `).get(...params);

    // Priority breakdown
    const priorityBreakdown = db.prepare(`
      SELECT priority, COUNT(*) as count
      FROM tickets
      WHERE 1=1 ${dateFilter}
      GROUP BY priority
    `).all(...params);

    // Category breakdown
    const categoryBreakdown = db.prepare(`
      SELECT category, COUNT(*) as count
      FROM tickets
      WHERE category IS NOT NULL ${dateFilter}
      GROUP BY category
      ORDER BY count DESC
    `).all(...params);

    // Daily trend (last 30 days)
    const dailyTrend = db.prepare(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM tickets
      WHERE created_at >= DATE('now', '-30 days')
      GROUP BY DATE(created_at)
      ORDER BY date
    `).all();

    // Hourly distribution
    const hourlyDistribution = db.prepare(`
      SELECT strftime('%H', created_at) as hour, COUNT(*) as count
      FROM tickets
      WHERE 1=1 ${dateFilter}
      GROUP BY strftime('%H', created_at)
      ORDER BY hour
    `).all(...params);

    // Technician performance
    const technicianPerformance = db.prepare(`
      SELECT 
        u.name,
        COUNT(t.id) as tickets_handled,
        SUM(CASE WHEN t.status IN ('resolved', 'closed') THEN 1 ELSE 0 END) as resolved,
        AVG(CASE WHEN t.status IN ('resolved', 'closed') 
          THEN (julianday(t.resolved_at) - julianday(t.created_at)) * 24 
          ELSE NULL END) as avg_hours
      FROM tickets t
      JOIN users u ON t.assigned_to = u.id
      WHERE t.assigned_to IS NOT NULL ${dateFilter}
      GROUP BY t.assigned_to
      ORDER BY tickets_handled DESC
    `).all(...params);

    // SLA compliance
    const slaCompliance = db.prepare(`
      SELECT 
        s.name,
        COUNT(t.id) as total,
        SUM(CASE WHEN 
          (julianday(t.first_response_at) - julianday(t.created_at)) * 24 * 60 <= s.response_time 
          OR t.first_response_at IS NULL THEN 0 ELSE 1 
        END) as response_breached
      FROM tickets t
      JOIN slas s ON t.sla_id = s.id
      WHERE t.sla_id IS NOT NULL
      GROUP BY s.id
    `).all();

    // Satisfaction scores
    const satisfactionScores = db.prepare(`
      SELECT 
        AVG(overall_rating) as avg_rating,
        COUNT(*) as total_responses,
        SUM(CASE WHEN overall_rating >= 4 THEN 1 ELSE 0 END) as positive,
        SUM(CASE WHEN overall_rating <= 2 THEN 1 ELSE 0 END) as negative
      FROM survey_responses
    `).get();

    // Top issues (by category count)
    const topIssues = db.prepare(`
      SELECT title, COUNT(*) as occurrences
      FROM tickets
      WHERE 1=1 ${dateFilter}
      GROUP BY title
      HAVING COUNT(*) > 1
      ORDER BY occurrences DESC
      LIMIT 5
    `).all(...params);

    res.json({
      period: period || 'all',
      ticketMetrics,
      priorityBreakdown,
      categoryBreakdown,
      dailyTrend,
      hourlyDistribution,
      technicianPerformance,
      slaCompliance,
      satisfactionScores,
      topIssues,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get chart data for specific metric
router.get('/charts/:metric', auth, (req, res) => {
  try {
    const { metric } = req.params;
    const { period, start_date, end_date } = req.query;

    let chartData = {};

    switch (metric) {
      case 'tickets-by-status':
        chartData = {
          labels: ['Open', 'In Progress', 'Resolved', 'Closed'],
          data: [
            db.prepare("SELECT COUNT(*) as count FROM tickets WHERE status = 'open'").get().count,
            db.prepare("SELECT COUNT(*) as count FROM tickets WHERE status = 'in_progress'").get().count,
            db.prepare("SELECT COUNT(*) as count FROM tickets WHERE status = 'resolved'").get().count,
            db.prepare("SELECT COUNT(*) as count FROM tickets WHERE status = 'closed'").get().count,
          ],
          colors: ['#f59e0b', '#3b82f6', '#22c55e', '#6b7280'],
        };
        break;

      case 'tickets-by-priority':
        chartData = {
          labels: ['Urgent', 'High', 'Medium', 'Low'],
          data: [
            db.prepare("SELECT COUNT(*) as count FROM tickets WHERE priority = 'urgent'").get().count,
            db.prepare("SELECT COUNT(*) as count FROM tickets WHERE priority = 'high'").get().count,
            db.prepare("SELECT COUNT(*) as count FROM tickets WHERE priority = 'medium'").get().count,
            db.prepare("SELECT COUNT(*) as count FROM tickets WHERE priority = 'low'").get().count,
          ],
          colors: ['#ef4444', '#f97316', '#eab308', '#22c55e'],
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
          labels: timeData.map(d => d.date),
          data: timeData.map(d => d.count),
          type: 'line',
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
          labels: catData.map(c => c.category),
          data: catData.map(c => c.count),
          type: 'pie',
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
          labels: resolutionData.map(d => d.date),
          data: resolutionData.map(d => d.avg_hours),
          type: 'line',
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

module.exports = router;
