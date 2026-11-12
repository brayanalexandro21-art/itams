const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

// Get export data with chart configuration
router.post('/with-charts', auth, adminOnly, (req, res) => {
  try {
    const { entity, filters, charts } = req.body;

    let data = [];
    let chartConfigs = [];

    // Get data based on entity
    switch (entity) {
      case 'tickets':
        data = getTicketData(filters);
        chartConfigs = generateTicketCharts(data, charts);
        break;
      case 'assets':
        data = getAssetData(filters);
        chartConfigs = generateAssetCharts(data, charts);
        break;
      case 'contracts':
        data = getContractData(filters);
        chartConfigs = generateContractCharts(data, charts);
        break;
      case 'vendors':
        data = getVendorData(filters);
        chartConfigs = generateVendorCharts(data, charts);
        break;
      default:
        return res.status(400).json({ error: 'Invalid entity' });
    }

    res.json({
      data,
      charts: chartConfigs,
      metadata: {
        entity,
        exported_at: new Date().toISOString(),
        total_records: data.length,
        total_charts: chartConfigs.length,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get chart data for specific visualization
router.post('/chart', auth, adminOnly, (req, res) => {
  try {
    const { type, entity, field, group_by } = req.body;

    let chartData = {};

    switch (type) {
      case 'pie':
        chartData = generatePieChart(entity, field);
        break;
      case 'bar':
        chartData = generateBarChart(entity, field, group_by);
        break;
      case 'line':
        chartData = generateLineChart(entity, field);
        break;
      case 'doughnut':
        chartData = generateDoughnutChart(entity, field);
        break;
      case 'horizontalBar':
        chartData = generateHorizontalBarChart(entity, field);
        break;
      default:
        return res.status(400).json({ error: 'Invalid chart type' });
    }

    res.json(chartData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Export to Excel with embedded charts data
router.post('/excel-with-charts', auth, adminOnly, (req, res) => {
  try {
    const { entity, filters, includeCharts = true } = req.body;

    let data = [];
    let charts = [];

    switch (entity) {
      case 'tickets':
        data = getTicketData(filters);
        if (includeCharts) {
          charts = [
            { type: 'pie', title: 'Tickets by Status', field: 'status' },
            { type: 'bar', title: 'Tickets by Priority', field: 'priority' },
          ];
        }
        break;
      case 'assets':
        data = getAssetData(filters);
        if (includeCharts) {
          charts = [
            { type: 'pie', title: 'Assets by Type', field: 'type' },
            { type: 'bar', title: 'Assets by Status', field: 'status' },
          ];
        }
        break;
    }

    // Generate chart data for each chart
    const chartData = charts.map(chart => ({
      ...chart,
      data: generateChartData(data, chart.field),
    }));

    res.json({
      sheets: [{
        name: entity.charAt(0).toUpperCase() + entity.slice(1),
        data,
      }],
      charts: chartData,
      metadata: {
        entity,
        exported_at: new Date().toISOString(),
        total_records: data.length,
        charts_included: charts.length,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get available chart types
router.get('/chart-types', auth, (req, res) => {
  try {
    const chartTypes = [
      { id: 'pie', name: 'Pie Chart', description: 'Show proportions', icon: '🥧' },
      { id: 'doughnut', name: 'Doughnut Chart', description: 'Show proportions with hole', icon: '🍩' },
      { id: 'bar', name: 'Bar Chart', description: 'Compare values', icon: '📊' },
      { id: 'horizontalBar', name: 'Horizontal Bar', description: 'Compare values horizontally', icon: '📊' },
      { id: 'line', name: 'Line Chart', description: 'Show trends over time', icon: '📈' },
      { id: 'area', name: 'Area Chart', description: 'Show trends with filled area', icon: '📉' },
      { id: 'scatter', name: 'Scatter Plot', description: 'Show correlations', icon: '⚬' },
    ];

    res.json(chartTypes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

function getTicketData(filters) {
  let query = `
    SELECT t.id, t.title, t.status, t.priority, t.category,
      u1.name as created_by, u2.name as assigned_to,
      t.created_at, t.updated_at
    FROM tickets t
    LEFT JOIN users u1 ON t.created_by = u1.id
    LEFT JOIN users u2 ON t.assigned_to = u2.id
    WHERE 1=1
  `;

  const params = [];
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        query += ` AND ${key} = ?`;
        params.push(value);
      }
    });
  }

  return db.prepare(query).all(...params);
}

function getAssetData(filters) {
  let query = `
    SELECT a.id, a.name, a.type, a.status, a.location,
      u.name as assigned_to, a.purchase_date
    FROM assets a
    LEFT JOIN users u ON a.assigned_to = u.id
    WHERE 1=1
  `;

  const params = [];
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        query += ` AND ${key} = ?`;
        params.push(value);
      }
    });
  }

  return db.prepare(query).all(...params);
}

function getContractData(filters) {
  let query = `
    SELECT c.id, c.name, c.contract_number, v.name as vendor,
      c.end_date, c.value, c.status
    FROM contracts c
    LEFT JOIN vendors v ON c.vendor_id = v.id
    WHERE 1=1
  `;

  const params = [];
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        query += ` AND ${key} = ?`;
        params.push(value);
      }
    });
  }

  return db.prepare(query).all(...params);
}

function getVendorData(filters) {
  let query = `
    SELECT v.id, v.name, v.category, v.status,
      (SELECT COUNT(*) FROM contracts WHERE vendor_id = v.id) as contract_count
    FROM vendors v
    WHERE 1=1
  `;

  const params = [];
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        query += ` AND ${key} = ?`;
        params.push(value);
      }
    });
  }

  return db.prepare(query).all(...params);
}

function generateTicketCharts(data, requestedCharts) {
  const charts = [];

  if (!requestedCharts || requestedCharts.includes('status')) {
    charts.push({
      type: 'pie',
      title: 'Tickets by Status',
      data: countByField(data, 'status'),
      colors: ['#f59e0b', '#3b82f6', '#22c55e', '#6b7280'],
    });
  }

  if (!requestedCharts || requestedCharts.includes('priority')) {
    charts.push({
      type: 'bar',
      title: 'Tickets by Priority',
      data: countByField(data, 'priority'),
      colors: ['#ef4444', '#f97316', '#eab308', '#22c55e'],
    });
  }

  if (!requestedCharts || requestedCharts.includes('category')) {
    charts.push({
      type: 'doughnut',
      title: 'Tickets by Category',
      data: countByField(data, 'category'),
    });
  }

  return charts;
}

function generateAssetCharts(data, requestedCharts) {
  const charts = [];

  if (!requestedCharts || requestedCharts.includes('type')) {
    charts.push({
      type: 'pie',
      title: 'Assets by Type',
      data: countByField(data, 'type'),
    });
  }

  if (!requestedCharts || requestedCharts.includes('status')) {
    charts.push({
      type: 'bar',
      title: 'Assets by Status',
      data: countByField(data, 'status'),
    });
  }

  return charts;
}

function generateContractCharts(data, requestedCharts) {
  const charts = [];

  if (!requestedCharts || requestedCharts.includes('status')) {
    charts.push({
      type: 'pie',
      title: 'Contracts by Status',
      data: countByField(data, 'status'),
    });
  }

  return charts;
}

function generateVendorCharts(data, requestedCharts) {
  const charts = [];

  if (!requestedCharts || requestedCharts.includes('category')) {
    charts.push({
      type: 'pie',
      title: 'Vendors by Category',
      data: countByField(data, 'category'),
    });
  }

  return charts;
}

function generatePieChart(entity, field) {
  let data = [];
  switch (entity) {
    case 'tickets':
      data = db.prepare(`SELECT ${field} as label, COUNT(*) as value FROM tickets WHERE ${field} IS NOT NULL GROUP BY ${field}`).all();
      break;
    case 'assets':
      data = db.prepare(`SELECT ${field} as label, COUNT(*) as value FROM assets WHERE ${field} IS NOT NULL GROUP BY ${field}`).all();
      break;
  }

  return { type: 'pie', data };
}

function generateBarChart(entity, field, group_by) {
  let data = [];
  switch (entity) {
    case 'tickets':
      data = db.prepare(`SELECT ${field} as label, COUNT(*) as value FROM tickets WHERE ${field} IS NOT NULL GROUP BY ${field} ORDER BY value DESC`).all();
      break;
  }

  return { type: 'bar', data };
}

function generateLineChart(entity, field) {
  let data = [];
  switch (entity) {
    case 'tickets':
      data = db.prepare(`
        SELECT DATE(created_at) as label, COUNT(*) as value
        FROM tickets
        WHERE created_at >= DATE('now', '-30 days')
        GROUP BY DATE(created_at)
        ORDER BY label
      `).all();
      break;
  }

  return { type: 'line', data };
}

function generateDoughnutChart(entity, field) {
  return generatePieChart(entity, field);
}

function generateHorizontalBarChart(entity, field) {
  return generateBarChart(entity, field);
}

function generateChartData(data, field) {
  const counts = countByField(data, field);
  return Object.entries(counts).map(([label, value]) => ({ label, value }));
}

function countByField(array, field) {
  return array.reduce((acc, item) => {
    const key = item[field] || 'Unknown';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

module.exports = router;
