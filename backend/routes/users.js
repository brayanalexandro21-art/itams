const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

// Get all users (admin only)
router.get('/', auth, adminOnly, (req, res) => {
  try {
    const users = db.prepare(
      'SELECT id, name, email, role, department, created_at FROM users'
    ).all();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user by ID
router.get('/:id', auth, (req, res) => {
  try {
    const user = db.prepare(
      'SELECT id, name, email, role, department, created_at FROM users WHERE id = ?'
    ).get(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user role (admin only)
router.put('/:id/role', auth, adminOnly, (req, res) => {
  try {
    const { role } = req.body;

    if (!['user', 'technician', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, req.params.id);

    const user = db.prepare(
      'SELECT id, name, email, role, department FROM users WHERE id = ?'
    ).get(req.params.id);

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
