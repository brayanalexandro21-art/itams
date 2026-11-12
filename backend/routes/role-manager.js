const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

// Listar roles
router.get('/', auth, adminOnly, (req, res) => {
  try {
    const roles = db.prepare(`
      SELECT r.*,
        (SELECT COUNT(*) FROM users WHERE role = r.name) as user_count
      FROM roles r
      ORDER BY r.name
    `).all();
    res.json(roles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear rol
router.post('/', auth, adminOnly, (req, res) => {
  try {
    const { name, description, permissions } = req.body;
    const result = db.prepare(`
      INSERT INTO roles (name, description, permissions, is_system)
      VALUES (?, ?, ?, 0)
    `).run(name, description, JSON.stringify(permissions || []));
    res.json({ id: result.lastInsertRowid, name });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar rol
router.put('/:id', auth, adminOnly, (req, res) => {
  try {
    const { name, description, permissions } = req.body;
    const role = db.prepare('SELECT * FROM roles WHERE id = ?').get(req.params.id);
    if (role?.is_system) return res.status(400).json({ error: 'No se pueden editar roles del sistema' });

    db.prepare('UPDATE roles SET name = ?, description = ?, permissions = ? WHERE id = ?')
      .run(name, description, JSON.stringify(permissions || []), req.params.id);
    res.json({ message: 'Rol actualizado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar rol
router.delete('/:id', auth, adminOnly, (req, res) => {
  try {
    const role = db.prepare('SELECT * FROM roles WHERE id = ?').get(req.params.id);
    if (role?.is_system) return res.status(400).json({ error: 'No se pueden eliminar roles del sistema' });

    const userCount = db.prepare('SELECT COUNT(*) as c FROM users WHERE role = ?').get(role.name).c;
    if (userCount > 0) return res.status(400).json({ error: `${userCount} usuarios usan este rol` });

    db.prepare('DELETE FROM roles WHERE id = ?').run(req.params.id);
    res.json({ message: 'Rol eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Permisos disponibles
router.get('/permissions', auth, (req, res) => {
  res.json([
    'tickets.view', 'tickets.create', 'tickets.edit', 'tickets.delete', 'tickets.assign',
    'assets.view', 'assets.create', 'assets.edit', 'assets.delete',
    'users.view', 'users.create', 'users.edit', 'users.delete',
    'reports.view', 'reports.create', 'reports.export',
    'settings.view', 'settings.edit',
    'workflows.manage', 'integrations.manage',
    'audit.view', 'api.manage',
  ]);
});

module.exports = router;