const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

// Get all user groups
router.get('/', auth, (req, res) => {
  try {
    const groups = db.prepare(`
      SELECT ug.*, u.name as created_by_name,
        (SELECT COUNT(*) FROM user_group_members WHERE group_id = ug.id) as member_count
      FROM user_groups ug
      LEFT JOIN users u ON ug.created_by = u.id
      ORDER BY ug.name
    `).all();

    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get group by ID
router.get('/:id', auth, (req, res) => {
  try {
    const group = db.prepare(`
      SELECT ug.*, u.name as created_by_name
      FROM user_groups ug
      LEFT JOIN users u ON ug.created_by = u.id
      WHERE ug.id = ?
    `).get(req.params.id);

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Get members
    const members = db.prepare(`
      SELECT u.id, u.name, u.email, u.role
      FROM users u
      JOIN user_group_members ugm ON u.id = ugm.user_id
      WHERE ugm.group_id = ?
      ORDER BY u.name
    `).all(req.params.id);

    // Get permissions
    const permissions = db.prepare(`
      SELECT * FROM user_group_permissions WHERE group_id = ?
    `).all(req.params.id);

    res.json({ ...group, members, permissions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create user group
router.post('/', auth, adminOnly, (req, res) => {
  try {
    const { name, description, type, permissions } = req.body;

    const result = db.prepare(`
      INSERT INTO user_groups (name, description, type, created_by)
      VALUES (?, ?, ?, ?)
    `).run(name, description, type || 'custom', req.user.id);

    // Add permissions
    if (permissions && permissions.length > 0) {
      const insertPerm = db.prepare(`
        INSERT INTO user_group_permissions (group_id, permission, value)
        VALUES (?, ?, ?)
      `);
      permissions.forEach(perm => {
        insertPerm.run(result.lastInsertRowid, perm.key, perm.value);
      });
    }

    const group = db.prepare('SELECT * FROM user_groups WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(group);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user group
router.put('/:id', auth, adminOnly, (req, res) => {
  try {
    const { name, description, type, active } = req.body;

    db.prepare(`
      UPDATE user_groups
      SET name = COALESCE(?, name),
          description = COALESCE(?, description),
          type = COALESCE(?, type),
          active = COALESCE(?, active),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(name, description, type, active, req.params.id);

    const group = db.prepare('SELECT * FROM user_groups WHERE id = ?').get(req.params.id);
    res.json(group);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete user group
router.delete('/:id', auth, adminOnly, (req, res) => {
  try {
    db.prepare('DELETE FROM user_group_permissions WHERE group_id = ?').run(req.params.id);
    db.prepare('DELETE FROM user_group_members WHERE group_id = ?').run(req.params.id);
    db.prepare('DELETE FROM user_groups WHERE id = ?').run(req.params.id);
    res.json({ message: 'Group deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add member to group
router.post('/:id/members', auth, adminOnly, (req, res) => {
  try {
    const { user_ids } = req.body;

    const insert = db.prepare('INSERT OR IGNORE INTO user_group_members (group_id, user_id) VALUES (?, ?)');
    user_ids.forEach(userId => {
      insert.run(req.params.id, userId);
    });

    res.json({ message: 'Members added' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Remove member from group
router.delete('/:id/members/:userId', auth, adminOnly, (req, res) => {
  try {
    db.prepare('DELETE FROM user_group_members WHERE group_id = ? AND user_id = ?')
      .run(req.params.id, req.params.userId);
    res.json({ message: 'Member removed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's groups
router.get('/my/groups', auth, (req, res) => {
  try {
    const groups = db.prepare(`
      SELECT ug.id, ug.name, ug.type
      FROM user_groups ug
      JOIN user_group_members ugm ON ug.id = ugm.group_id
      WHERE ugm.user_id = ? AND ug.active = 1
    `).all(req.user.id);

    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get group statistics
router.get('/stats/summary', auth, adminOnly, (req, res) => {
  try {
    const stats = {
      total: db.prepare('SELECT COUNT(*) as count FROM user_groups').get().count,
      active: db.prepare("SELECT COUNT(*) as count FROM user_groups WHERE active = 1").get().count,
      total_members: db.prepare('SELECT COUNT(*) as count FROM user_group_members').get().count,
      by_type: db.prepare(`
        SELECT type, COUNT(*) as count
        FROM user_groups
        GROUP BY type
      `).all(),
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
