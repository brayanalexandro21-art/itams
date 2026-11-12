const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

// Store performance metrics in memory (in production, use Redis or similar)
const metrics = {
  requests: [],
  errors: [],
  responseTimes: [],
};

// Middleware to track request metrics
function trackMetrics(req, res, next) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const metric = {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration,
      timestamp: new Date().toISOString(),
    };

    metrics.requests.push(metric);
    metrics.responseTimes.push(duration);

    // Keep only last 1000 metrics
    if (metrics.requests.length > 1000) {
      metrics.requests.shift();
    }
    if (metrics.responseTimes.length > 1000) {
      metrics.responseTimes.shift();
    }

    // Log slow requests
    if (duration > 1000) {
      console.log(`[SLOW REQUEST] ${req.method} ${req.path} took ${duration}ms`);
    }

    // Log errors
    if (res.statusCode >= 400) {
      metrics.errors.push({
        method: req.method,
        path: req.path,
        status: res.statusCode,
        timestamp: new Date().toISOString(),
      });

      if (metrics.errors.length > 500) {
        metrics.errors.shift();
      }
    }
  });

  next();
}

// Get system health
router.get('/health', (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: '8.0.0',
      database: checkDatabase(),
      services: {
        api: 'operational',
        database: checkDatabase().status === 'ok' ? 'operational' : 'degraded',
      },
    };

    res.json(health);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get performance metrics
router.get('/metrics', auth, adminOnly, (req, res) => {
  try {
    const { period } = req.query;
    const now = new Date();
    let startTime = new Date(0);

    if (period) {
      switch (period) {
        case 'hour':
          startTime = new Date(now - 60 * 60 * 1000);
          break;
        case 'day':
          startTime = new Date(now - 24 * 60 * 60 * 1000);
          break;
        case 'week':
          startTime = new Date(now - 7 * 24 * 60 * 60 * 1000);
          break;
      }
    }

    const filteredRequests = metrics.requests.filter(m => 
      new Date(m.timestamp) >= startTime
    );

    const filteredErrors = metrics.errors.filter(m => 
      new Date(m.timestamp) >= startTime
    );

    const responseTimes = filteredRequests.map(m => m.duration);
    const avgResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
      : 0;

    const performance = {
      period: period || 'all',
      requests: {
        total: filteredRequests.length,
        byMethod: countByField(filteredRequests, 'method'),
        byStatus: countByField(filteredRequests, 'status'),
        perMinute: filteredRequests.length / ((now - startTime) / 60000) || 0,
      },
      errors: {
        total: filteredErrors.length,
        rate: filteredRequests.length > 0 
          ? (filteredErrors.length / filteredRequests.length * 100).toFixed(2) + '%' 
          : '0%',
        byStatus: countByField(filteredErrors, 'status'),
      },
      responseTime: {
        average: Math.round(avgResponseTime),
        min: responseTimes.length > 0 ? Math.min(...responseTimes) : 0,
        max: responseTimes.length > 0 ? Math.max(...responseTimes) : 0,
        p95: calculatePercentile(responseTimes, 95),
        p99: calculatePercentile(responseTimes, 99),
      },
      database: checkDatabase(),
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
      },
    };

    res.json(performance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get error logs
router.get('/errors', auth, adminOnly, (req, res) => {
  try {
    const { limit = 100 } = req.query;
    
    const recentErrors = metrics.errors.slice(-parseInt(limit)).reverse();
    
    res.json(recentErrors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get slow requests
router.get('/slow-requests', auth, adminOnly, (req, res) => {
  try {
    const { threshold = 1000, limit = 50 } = req.query;
    
    const slowRequests = metrics.requests
      .filter(m => m.duration >= parseInt(threshold))
      .slice(-parseInt(limit))
      .reverse();
    
    res.json(slowRequests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get database stats
router.get('/database', auth, adminOnly, (req, res) => {
  try {
    const stats = {
      tables: getTableStats(),
      size: getDatabaseSize(),
      connections: getActiveConnections(),
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

function checkDatabase() {
  try {
    db.prepare('SELECT 1').get();
    return { status: 'ok', message: 'Database connection successful' };
  } catch (error) {
    return { status: 'error', message: error.message };
  }
}

function getTableStats() {
  const tables = [
    'users', 'tickets', 'ticket_comments', 'assets', 'notifications',
    'knowledge_base', 'audit_logs', 'slas', 'workflows', 'time_entries',
  ];

  return tables.map(table => {
    try {
      const count = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get().count;
      return { name: table, rows: count };
    } catch (error) {
      return { name: table, rows: 0, error: error.message };
    }
  });
}

function getDatabaseSize() {
  try {
    const result = db.prepare("SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()").get();
    return {
      bytes: result.size,
      mb: (result.size / 1024 / 1024).toFixed(2) + ' MB',
    };
  } catch (error) {
    return { bytes: 0, mb: '0 MB' };
  }
}

function getActiveConnections() {
  // In production, this would check actual database connections
  return { count: 1, max: 10 };
}

function countByField(array, field) {
  return array.reduce((acc, item) => {
    const key = item[field] || 'unknown';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function calculatePercentile(arr, percentile) {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[index] || 0;
}

module.exports = router;
module.exports.trackMetrics = trackMetrics;
