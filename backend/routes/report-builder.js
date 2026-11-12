const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

// Get available report templates
router.get('/templates', auth, (req, res) => {
  try {
    const templates = [
      {
        id: 'ticket_summary',
        name: 'Ticket Summary',
        description: 'Overview of all tickets',
        entity: 'tickets',
        fields: ['id', 'title', 'status', 'priority', 'category', 'created_by', 'assigned_to', 'created_at'],
        filters: ['status', 'priority', 'category', 'date_range'],
      },
      {
        id: 'asset_inventory',
        name: 'Asset Inventory',
        description: 'Complete asset list',
        entity: 'assets',
        fields: ['id', 'name', 'type', 'serial_number', 'status', 'location', 'assigned_to', 'purchase_date'],
        filters: ['type', 'status', 'location', 'category'],
      },
      {
        id: 'sla_compliance',
        name: 'SLA Compliance',
        description: 'SLA performance report',
        entity: 'sla',
        fields: ['name', 'total_tickets', 'compliance_rate', 'avg_response_time'],
        filters: ['sla_id', 'date_range'],
      },
      {
        id: 'technician_performance',
        name: 'Technician Performance',
        description: 'Individual technician metrics',
        entity: 'users',
        fields: ['name', 'tickets_assigned', 'tickets_resolved', 'avg_resolution_time'],
        filters: ['user_id', 'date_range'],
      },
      {
        id: 'contract_expiry',
        name: 'Contract Expiry Report',
        description: 'Contracts expiring soon',
        entity: 'contracts',
        fields: ['name', 'vendor', 'end_date', 'value', 'status'],
        filters: ['days_ahead', 'vendor_id'],
      },
      {
        id: 'asset_depreciation',
        name: 'Asset Depreciation',
        description: 'Asset value over time',
        entity: 'assets',
        fields: ['name', 'purchase_cost', 'current_value', 'depreciation_rate', 'years_old'],
        filters: ['category', 'date_range'],
      },
    ];

    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate custom report
router.post('/generate', auth, adminOnly, (req, res) => {
  try {
    const { template_id, filters, group_by, sort_by, sort_order, limit } = req.body;

    let query = '';
    let params = [];

    switch (template_id) {
      case 'ticket_summary':
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

      case 'asset_inventory':
        query = `
          SELECT a.id, a.name, a.type, a.serial_number, a.status, a.location,
            u.name as assigned_to, a.purchase_date, a.warranty_expiry
          FROM assets a
          LEFT JOIN users u ON a.assigned_to = u.id
          WHERE 1=1
        `;
        break;

      case 'technician_performance':
        query = `
          SELECT u.id, u.name, u.email,
            COUNT(t.id) as tickets_assigned,
            SUM(CASE WHEN t.status IN ('resolved', 'closed') THEN 1 ELSE 0 END) as tickets_resolved,
            AVG(CASE WHEN t.status IN ('resolved', 'closed') 
              THEN (julianday(t.resolved_at) - julianday(t.created_at)) * 24 
              ELSE NULL END) as avg_resolution_hours
          FROM users u
          LEFT JOIN tickets t ON u.id = t.assigned_to
          WHERE u.role IN ('technician', 'admin')
          GROUP BY u.id
        `;
        break;

      case 'contract_expiry':
        query = `
          SELECT c.id, c.name, c.contract_number, v.name as vendor,
            c.end_date, c.value, c.status
          FROM contracts c
          LEFT JOIN vendors v ON c.vendor_id = v.id
          WHERE c.status = 'active'
        `;
        break;

      case 'asset_depreciation':
        query = `
          SELECT a.id, a.name, a.purchase_cost, a.purchase_date,
            ROUND(a.purchase_cost * (1 - (julianday('now') - julianday(a.purchase_date)) / (365.25 * 5)), 2) as current_value,
            ROUND((1 - (1 - (julianday('now') - julianday(a.purchase_date)) / (365.25 * 5))) * 100, 1) as depreciation_rate,
            ROUND((julianday('now') - julianday(a.purchase_date)) / 365.25, 1) as years_old
          FROM assets a
          WHERE a.purchase_date IS NOT NULL AND a.purchase_cost IS NOT NULL
        `;
        break;

      default:
        return res.status(400).json({ error: 'Invalid template' });
    }

    // Apply filters
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          if (key === 'date_range' && value.start && value.end) {
            query += ` AND t.created_at BETWEEN ? AND ?`;
            params.push(value.start, value.end);
          } else if (key === 'days_ahead') {
            query += ` AND c.end_date <= DATE('now', '+' || ? || ' days')`;
            params.push(value);
          } else {
            query += ` AND ${key} = ?`;
            params.push(value);
          }
        }
      });
    }

    // Apply sorting
    if (sort_by) {
      query += ` ORDER BY ${sort_by} ${sort_order === 'desc' ? 'DESC' : 'ASC'}`;
    } else {
      query += ' ORDER BY 1';
    }

    // Apply limit
    if (limit) {
      query += ' LIMIT ?';
      params.push(parseInt(limit));
    }

    const data = db.prepare(query).all(...params);

    // Calculate summary
    const summary = calculateReportSummary(data, template_id);

    res.json({
      report: {
        template_id,
        generated_at: new Date().toISOString(),
        filters,
        total_records: data.length,
      },
      data,
      summary,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Save custom report
router.post('/save', auth, adminOnly, (req, res) => {
  try {
    const { name, description, template_id, filters, columns, schedule } = req.body;

    const result = db.prepare(`
      INSERT INTO custom_reports (name, description, template_id, filters, columns, schedule, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      name, description, template_id,
      JSON.stringify(filters), JSON.stringify(columns),
      JSON.stringify(schedule), req.user.id
    );

    res.status(201).json({ id: result.lastInsertRowid, message: 'Report saved' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get saved reports
router.get('/saved', auth, adminOnly, (req, res) => {
  try {
    const reports = db.prepare(`
      SELECT cr.*, u.name as created_by_name
      FROM custom_reports cr
      LEFT JOIN users u ON cr.created_by = u.id
      ORDER BY cr.created_at DESC
    `).all();

    res.json(reports.map(r => ({
      ...r,
      filters: JSON.parse(r.filters),
      columns: JSON.parse(r.columns),
      schedule: JSON.parse(r.schedule),
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete saved report
router.delete('/saved/:id', auth, adminOnly, (req, res) => {
  try {
    db.prepare('DELETE FROM custom_reports WHERE id = ?').run(req.params.id);
    res.json({ message: 'Report deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

function calculateReportSummary(data, template_id) {
  if (!data || data.length === 0) return {};

  switch (template_id) {
    case 'ticket_summary':
      return {
        total: data.length,
        by_status: countByField(data, 'status'),
        by_priority: countByField(data, 'priority'),
      };
    case 'asset_inventory':
      return {
        total: data.length,
        by_type: countByField(data, 'type'),
        by_status: countByField(data, 'status'),
      };
    case 'technician_performance':
      return {
        total_technicians: data.length,
        total_tickets: data.reduce((sum, t) => sum + (t.tickets_assigned || 0), 0),
        total_resolved: data.reduce((sum, t) => sum + (t.tickets_resolved || 0), 0),
      };
    default:
      return { total: data.length };
  }
}

function countByField(array, field) {
  return array.reduce((acc, item) => {
    const key = item[field] || 'Unknown';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

module.exports = router;
