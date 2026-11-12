const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth } = require('../middleware/auth');

// Get dashboard statistics
router.get('/dashboard', auth, (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    let dateFilter = '';
    const params = [];

    if (start_date && end_date) {
      dateFilter = 'AND t.created_at BETWEEN ? AND ?';
      params.push(start_date, end_date);
    }

    // Ticket statistics
    const ticketStats = db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved,
        SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed,
        SUM(CASE WHEN priority = 'urgent' THEN 1 ELSE 0 END) as urgent,
        SUM(CASE WHEN priority = 'high' THEN 1 ELSE 0 END) as high,
        SUM(CASE WHEN priority = 'medium' THEN 1 ELSE 0 END) as medium,
        SUM(CASE WHEN priority = 'low' THEN 1 ELSE 0 END) as low
      FROM tickets t
      WHERE 1=1 ${dateFilter}
    `).get(...params);

    // Tickets by category
    const ticketsByCategory = db.prepare(`
      SELECT category, COUNT(*) as count
      FROM tickets t
      WHERE category IS NOT NULL ${dateFilter}
      GROUP BY category
      ORDER BY count DESC
    `).all(...params);

    // Tickets by day (last 30 days)
    const ticketsByDay = db.prepare(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM tickets t
      WHERE created_at >= DATE('now', '-30 days') ${dateFilter}
      GROUP BY DATE(created_at)
      ORDER BY date
    `).all(...params);

    // Top technicians
    const topTechnicians = db.prepare(`
      SELECT u.name, COUNT(t.id) as ticket_count,
        SUM(CASE WHEN t.status = 'resolved' OR t.status = 'closed' THEN 1 ELSE 0 END) as resolved_count
      FROM tickets t
      JOIN users u ON t.assigned_to = u.id
      WHERE t.assigned_to IS NOT NULL ${dateFilter}
      GROUP BY t.assigned_to
      ORDER BY ticket_count DESC
      LIMIT 5
    `).all(...params);

    // Average resolution time (in hours)
    const avgResolutionTime = db.prepare(`
      SELECT AVG(
        (julianday(updated_at) - julianday(created_at)) * 24
      ) as avg_hours
      FROM tickets t
      WHERE status IN ('resolved', 'closed') ${dateFilter}
    `).get(...params);

    // Asset statistics
    const assetStats = db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available,
        SUM(CASE WHEN status = 'in_use' THEN 1 ELSE 0 END) as in_use,
        SUM(CASE WHEN status = 'maintenance' THEN 1 ELSE 0 END) as maintenance,
        SUM(CASE WHEN status = 'retired' THEN 1 ELSE 0 END) as retired
      FROM assets
    `).get();

    // Assets by type
    const assetsByType = db.prepare(`
      SELECT type, COUNT(*) as count
      FROM assets
      GROUP BY type
      ORDER BY count DESC
    `).all();

    // Knowledge base stats
    const kbStats = db.prepare(`
      SELECT
        COUNT(*) as total_articles,
        SUM(views) as total_views,
        SUM(helpful) as total_helpful
      FROM knowledge_base
    `).get();

    res.json({
      tickets: ticketStats,
      ticketsByCategory,
      ticketsByDay,
      topTechnicians,
      avgResolutionTime: avgResolutionTime?.avg_hours || 0,
      assets: assetStats,
      assetsByType,
      knowledgeBase: kbStats,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Export tickets to CSV
router.get('/export/tickets', auth, (req, res) => {
  try {
    const { format } = req.query;

    const tickets = db.prepare(`
      SELECT t.id, t.title, t.description, t.status, t.priority, t.category,
        u1.name as created_by, u2.name as assigned_to,
        t.created_at, t.updated_at
      FROM tickets t
      LEFT JOIN users u1 ON t.created_by = u1.id
      LEFT JOIN users u2 ON t.assigned_to = u2.id
      ORDER BY t.created_at DESC
    `).all();

    if (format === 'csv') {
      const headers = ['ID', 'Title', 'Description', 'Status', 'Priority', 'Category', 'Created By', 'Assigned To', 'Created At', 'Updated At'];
      const csv = [
        headers.join(','),
        ...tickets.map(t => [
          t.id,
          `"${(t.title || '').replace(/"/g, '""')}"`,
          `"${(t.description || '').replace(/"/g, '""')}"`,
          t.status,
          t.priority,
          t.category || '',
          t.created_by || '',
          t.assigned_to || '',
          t.created_at,
          t.updated_at,
        ].join(','))
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=tickets.csv');
      res.send(csv);
    } else {
      res.json(tickets);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Export assets to CSV
router.get('/export/assets', auth, (req, res) => {
  try {
    const { format } = req.query;

    const assets = db.prepare(`
      SELECT a.id, a.name, a.type, a.category, a.serial_number, a.model,
        a.manufacturer, a.status, a.location, a.purchase_date, a.warranty_expiry,
        u.name as assigned_to, a.created_at
      FROM assets a
      LEFT JOIN users u ON a.assigned_to = u.id
      ORDER BY a.created_at DESC
    `).all();

    if (format === 'csv') {
      const headers = ['ID', 'Name', 'Type', 'Category', 'Serial Number', 'Model', 'Manufacturer', 'Status', 'Location', 'Purchase Date', 'Warranty Expiry', 'Assigned To', 'Created At'];
      const csv = [
        headers.join(','),
        ...assets.map(a => [
          a.id,
          `"${(a.name || '').replace(/"/g, '""')}"`,
          a.type,
          a.category || '',
          a.serial_number || '',
          a.model || '',
          a.manufacturer || '',
          a.status,
          a.location || '',
          a.purchase_date || '',
          a.warranty_expiry || '',
          a.assigned_to || '',
          a.created_at,
        ].join(','))
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=assets.csv');
      res.send(csv);
    } else {
      res.json(assets);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
