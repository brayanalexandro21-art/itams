const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

// Get all tenants
router.get('/', auth, adminOnly, (req, res) => {
  try {
    const tenants = db.prepare(`
      SELECT t.*, 
        (SELECT COUNT(*) FROM users WHERE tenant_id = t.id) as user_count,
        (SELECT COUNT(*) FROM tickets WHERE tenant_id = t.id) as ticket_count,
        (SELECT COUNT(*) FROM assets WHERE tenant_id = t.id) as asset_count
      FROM tenants t
      ORDER BY t.created_at DESC
    `).all();

    res.json(tenants);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get tenant by ID
router.get('/:id', auth, adminOnly, (req, res) => {
  try {
    const tenant = db.prepare('SELECT * FROM tenants WHERE id = ?').get(req.params.id);

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    res.json(tenant);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create tenant
router.post('/', auth, adminOnly, (req, res) => {
  try {
    const { name, slug, domain, plan, settings } = req.body;

    // Check if slug is unique
    const existing = db.prepare('SELECT id FROM tenants WHERE slug = ?').get(slug);
    if (existing) {
      return res.status(400).json({ error: 'Tenant slug already exists' });
    }

    const result = db.prepare(`
      INSERT INTO tenants (name, slug, domain, plan, settings)
      VALUES (?, ?, ?, ?, ?)
    `).run(name, slug, domain, plan || 'free', JSON.stringify(settings || {}));

    const tenant = db.prepare('SELECT * FROM tenants WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(tenant);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update tenant
router.put('/:id', auth, adminOnly, (req, res) => {
  try {
    const { name, domain, plan, settings, active } = req.body;

    db.prepare(`
      UPDATE tenants
      SET name = COALESCE(?, name),
          domain = COALESCE(?, domain),
          plan = COALESCE(?, plan),
          settings = COALESCE(?, settings),
          active = COALESCE(?, active),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(name, domain, plan, settings ? JSON.stringify(settings) : null, active, req.params.id);

    const tenant = db.prepare('SELECT * FROM tenants WHERE id = ?').get(req.params.id);
    res.json(tenant);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete tenant
router.delete('/:id', auth, adminOnly, (req, res) => {
  try {
    // Soft delete - set active to false
    db.prepare('UPDATE tenants SET active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(req.params.id);
    res.json({ message: 'Tenant deactivated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get tenant stats
router.get('/:id/stats', auth, adminOnly, (req, res) => {
  try {
    const tenantId = req.params.id;

    const stats = {
      users: db.prepare('SELECT COUNT(*) as count FROM users WHERE tenant_id = ?').get(tenantId).count,
      tickets: db.prepare('SELECT COUNT(*) as count FROM tickets WHERE tenant_id = ?').get(tenantId).count,
      assets: db.prepare('SELECT COUNT(*) as count FROM assets WHERE tenant_id = ?').get(tenantId).count,
      openTickets: db.prepare("SELECT COUNT(*) as count FROM tickets WHERE tenant_id = ? AND status = 'open'").get(tenantId).count,
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
