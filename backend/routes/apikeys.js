const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

// Generate API key
function generateApiKey() {
  return 'itams_' + crypto.randomBytes(32).toString('hex');
}

// Get all API keys
router.get('/', auth, adminOnly, (req, res) => {
  try {
    const keys = db.prepare(`
      SELECT id, name, key_prefix, permissions, last_used, expires_at, created_at
      FROM api_keys
      ORDER BY created_at DESC
    `).all();

    res.json(keys);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create API key
router.post('/', auth, adminOnly, (req, res) => {
  try {
    const { name, permissions, expires_at } = req.body;

    const fullKey = generateApiKey();
    const keyPrefix = fullKey.substring(0, 12) + '...';

    const result = db.prepare(`
      INSERT INTO api_keys (name, key, key_prefix, permissions, expires_at, created_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(name, fullKey, keyPrefix, JSON.stringify(permissions || ['read']), expires_at, req.user.id);

    res.status(201).json({
      id: result.lastInsertRowid,
      name,
      key: fullKey,
      keyPrefix,
      permissions,
      expires_at,
      message: 'Save this key securely. It will not be shown again.',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete API key
router.delete('/:id', auth, adminOnly, (req, res) => {
  try {
    db.prepare('DELETE FROM api_keys WHERE id = ?').run(req.params.id);
    res.json({ message: 'API key deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Middleware to authenticate API key
function authenticateApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }

  const key = db.prepare('SELECT * FROM api_keys WHERE key = ?').get(apiKey);

  if (!key) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  // Check expiry
  if (key.expires_at && new Date(key.expires_at) < new Date()) {
    return res.status(401).json({ error: 'API key expired' });
  }

  // Update last used
  db.prepare('UPDATE api_keys SET last_used = CURRENT_TIMESTAMP WHERE id = ?').run(key.id);

  req.apiKey = key;
  req.permissions = JSON.parse(key.permissions || '[]');
  next();
}

// Public API endpoints (using API key authentication)
const publicRouter = express.Router();
publicRouter.use(authenticateApiKey);

// Get tickets (read-only)
publicRouter.get('/tickets', (req, res) => {
  if (!req.permissions.includes('read')) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }

  const tickets = db.prepare(`
    SELECT t.id, t.title, t.status, t.priority, t.category, t.created_at
    FROM tickets t
    ORDER BY t.created_at DESC
    LIMIT 100
  `).all();

  res.json(tickets);
});

// Get assets (read-only)
publicRouter.get('/assets', (req, res) => {
  if (!req.permissions.includes('read')) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }

  const assets = db.prepare(`
    SELECT a.id, a.name, a.type, a.status, a.serial_number, a.location
    FROM assets a
    ORDER BY a.created_at DESC
    LIMIT 100
  `).all();

  res.json(assets);
});

// Create ticket (write permission required)
publicRouter.post('/tickets', (req, res) => {
  if (!req.permissions.includes('write')) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }

  const { title, description, priority, category } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  const result = db.prepare(
    'INSERT INTO tickets (title, description, priority, category) VALUES (?, ?, ?, ?)'
  ).run(title, description, priority || 'medium', category);

  const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(ticket);
});

module.exports = router;
module.exports.publicRouter = publicRouter;
module.exports.authenticateApiKey = authenticateApiKey;
