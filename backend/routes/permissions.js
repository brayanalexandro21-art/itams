const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

// Permission definitions
const PERMISSIONS = {
  // Tickets
  'tickets.create': 'Create tickets',
  'tickets.read': 'View tickets',
  'tickets.update': 'Update tickets',
  'tickets.delete': 'Delete tickets',
  'tickets.assign': 'Assign tickets',
  'tickets.close': 'Close tickets',
  
  // Assets
  'assets.create': 'Create assets',
  'assets.read': 'View assets',
  'assets.update': 'Update assets',
  'assets.delete': 'Delete assets',
  'assets.assign': 'Assign assets',
  
  // Knowledge Base
  'kb.create': 'Create articles',
  'kb.read': 'View articles',
  'kb.update': 'Update articles',
  'kb.delete': 'Delete articles',
  
  // Reports
  'reports.view': 'View reports',
  'reports.export': 'Export reports',
  
  // Settings
  'settings.manage': 'Manage settings',
  'users.manage': 'Manage users',
  'roles.manage': 'Manage roles',
  
  // Admin
  'admin.full': 'Full admin access',
};

// Role definitions with default permissions
const ROLES = {
  user: {
    name: 'User',
    permissions: ['tickets.create', 'tickets.read', 'kb.read', 'assets.read'],
  },
  technician: {
    name: 'Technician',
    permissions: ['tickets.create', 'tickets.read', 'tickets.update', 'tickets.close', 'kb.create', 'kb.read', 'kb.update', 'assets.read', 'assets.update', 'reports.view'],
  },
  manager: {
    name: 'Manager',
    permissions: ['tickets.create', 'tickets.read', 'tickets.update', 'tickets.assign', 'tickets.close', 'tickets.delete', 'kb.create', 'kb.read', 'kb.update', 'kb.delete', 'assets.create', 'assets.read', 'assets.update', 'assets.delete', 'assets.assign', 'reports.view', 'reports.export', 'users.manage'],
  },
  admin: {
    name: 'Administrator',
    permissions: Object.keys(PERMISSIONS),
  },
};

// Get all permissions
router.get('/', auth, adminOnly, (req, res) => {
  try {
    const permissions = Object.entries(PERMISSIONS).map(([key, description]) => ({
      key,
      description,
    }));
    res.json(permissions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all roles
router.get('/roles', auth, adminOnly, (req, res) => {
  try {
    // Get custom roles from database
    const customRoles = db.prepare('SELECT * FROM roles ORDER BY name').all();
    
    // Merge with default roles
    const allRoles = Object.entries(ROLES).map(([key, role]) => ({
      id: key,
      name: role.name,
      permissions: role.permissions,
      is_custom: false,
    }));

    customRoles.forEach(role => {
      allRoles.push({
        id: role.id,
        name: role.name,
        permissions: JSON.parse(role.permissions || '[]'),
        is_custom: true,
      });
    });

    res.json(allRoles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create custom role
router.post('/roles', auth, adminOnly, (req, res) => {
  try {
    const { name, permissions } = req.body;

    // Check if role name exists
    if (ROLES[name]) {
      return res.status(400).json({ error: 'Role name already exists' });
    }

    const result = db.prepare(`
      INSERT INTO roles (name, permissions, created_by)
      VALUES (?, ?, ?)
    `).run(name, JSON.stringify(permissions || []), req.user.id);

    const role = db.prepare('SELECT * FROM roles WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({
      ...role,
      permissions: JSON.parse(role.permissions),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update custom role
router.put('/roles/:id', auth, adminOnly, (req, res) => {
  try {
    const { name, permissions } = req.body;

    db.prepare(`
      UPDATE roles
      SET name = COALESCE(?, name),
          permissions = COALESCE(?, permissions),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(name, permissions ? JSON.stringify(permissions) : null, req.params.id);

    const role = db.prepare('SELECT * FROM roles WHERE id = ?').get(req.params.id);
    res.json({
      ...role,
      permissions: JSON.parse(role.permissions),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete custom role
router.delete('/roles/:id', auth, adminOnly, (req, res) => {
  try {
    // Check if role is in use
    const usersWithRole = db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ?').get(req.params.id).count;
    if (usersWithRole > 0) {
      return res.status(400).json({ error: 'Cannot delete role that is in use' });
    }

    db.prepare('DELETE FROM roles WHERE id = ?').run(req.params.id);
    res.json({ message: 'Role deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Check if user has permission
router.get('/check', auth, (req, res) => {
  try {
    const { permission } = req.query;
    const userRole = req.user.role;

    // Get role permissions
    let rolePermissions = [];
    if (ROLES[userRole]) {
      rolePermissions = ROLES[userRole].permissions;
    } else {
      const customRole = db.prepare('SELECT permissions FROM roles WHERE name = ?').get(userRole);
      if (customRole) {
        rolePermissions = JSON.parse(customRole.permissions);
      }
    }

    const hasPermission = rolePermissions.includes(permission) || rolePermissions.includes('admin.full');

    res.json({ hasPermission, permission, role: userRole });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user permissions
router.get('/user/:userId', auth, adminOnly, (req, res) => {
  try {
    const user = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(req.params.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let permissions = [];
    if (ROLES[user.role]) {
      permissions = ROLES[user.role].permissions;
    } else {
      const customRole = db.prepare('SELECT permissions FROM roles WHERE name = ?').get(user.role);
      if (customRole) {
        permissions = JSON.parse(customRole.permissions);
      }
    }

    res.json({
      user,
      permissions,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
module.exports.PERMISSIONS = PERMISSIONS;
module.exports.ROLES = ROLES;
