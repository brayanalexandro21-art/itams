const express = require('express');
const router = express.Router();

// API versions information
const API_VERSIONS = {
  v1: {
    version: '1.0.0',
    status: 'stable',
    released: '2026-01-15',
    deprecated: false,
    sunset: null,
    description: 'Initial stable release',
    endpoints: [
      'GET /api/v1/tickets',
      'POST /api/v1/tickets',
      'GET /api/v1/tickets/:id',
      'PUT /api/v1/tickets/:id',
      'DELETE /api/v1/tickets/:id',
      'GET /api/v1/assets',
      'POST /api/v1/assets',
      'GET /api/v1/assets/:id',
      'PUT /api/v1/assets/:id',
      'DELETE /api/v1/assets/:id',
      'GET /api/v1/search',
    ],
  },
  v2: {
    version: '2.0.0',
    status: 'stable',
    released: '2026-04-01',
    deprecated: false,
    sunset: null,
    description: 'Added advanced features, webhooks, and bulk operations',
    endpoints: [
      'GET /api/v2/tickets',
      'POST /api/v2/tickets',
      'GET /api/v2/tickets/:id',
      'PUT /api/v2/tickets/:id',
      'DELETE /api/v2/tickets/:id',
      'POST /api/v2/tickets/bulk',
      'GET /api/v2/assets',
      'POST /api/v2/assets',
      'GET /api/v2/assets/:id',
      'PUT /api/v2/assets/:id',
      'DELETE /api/v2/assets/:id',
      'POST /api/v2/assets/bulk',
      'POST /api/v2/webhooks',
      'GET /api/v2/reports/*',
    ],
  },
  v3: {
    version: '3.0.0',
    status: 'current',
    released: '2026-07-01',
    deprecated: false,
    sunset: null,
    description: 'Complete ITSM platform with all features',
    endpoints: [
      'All v1 and v2 endpoints',
      'GET /api/v3/analytics',
      'GET /api/v3/contracts',
      'GET /api/v3/vendors',
      'GET /api/v3/purchase-orders',
      'GET /api/v3/compliance',
      'POST /api/v3/mobile/*',
      'GET /api/v3/reports/*',
    ],
  },
};

// Get all API versions
router.get('/', (req, res) => {
  try {
    const versions = Object.entries(API_VERSIONS).map(([key, value]) => ({
      id: key,
      ...value,
    }));

    res.json({
      current: 'v3',
      versions,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get specific version info
router.get('/:version', (req, res) => {
  try {
    const version = API_VERSIONS[req.params.version];
    if (!version) {
      return res.status(404).json({ error: 'Version not found' });
    }

    res.json({
      id: req.params.version,
      ...version,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get version changelog
router.get('/:version/changelog', (req, res) => {
  try {
    const changelogs = {
      v1: [
        { type: 'feature', description: 'Initial API release' },
        { type: 'feature', description: 'Ticket management' },
        { type: 'feature', description: 'Asset management' },
        { type: 'feature', description: 'Search functionality' },
      ],
      v2: [
        { type: 'feature', description: 'Bulk operations for tickets and assets' },
        { type: 'feature', description: 'Webhook support' },
        { type: 'feature', description: 'Advanced reporting endpoints' },
        { type: 'improvement', description: 'Improved pagination' },
        { type: 'improvement', description: 'Better error messages' },
      ],
      v3: [
        { type: 'feature', description: 'Contract management API' },
        { type: 'feature', description: 'Vendor management API' },
        { type: 'feature', description: 'Purchase order API' },
        { type: 'feature', description: 'Compliance tracking API' },
        { type: 'feature', description: 'Mobile-optimized endpoints' },
        { type: 'improvement', description: 'Enhanced analytics endpoints' },
        { type: 'improvement', description: 'Better rate limiting' },
      ],
    };

    const changelog = changelogs[req.params.version];
    if (!changelog) {
      return res.status(404).json({ error: 'Changelog not found' });
    }

    res.json(changelog);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Version compatibility check
router.post('/compatibility', (req, res) => {
  try {
    const { client_version, min_version } = req.body;

    const isCompatible = compareVersions(client_version, min_version) >= 0;

    res.json({
      client_version,
      min_version,
      compatible: isCompatible,
      message: isCompatible 
        ? 'Client version is compatible' 
        : 'Client version is too old, please update',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

function compareVersions(v1, v2) {
  const parts1 = v1.replace('v', '').split('.').map(Number);
  const parts2 = v2.replace('v', '').split('.').map(Number);

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }
  return 0;
}

module.exports = router;
