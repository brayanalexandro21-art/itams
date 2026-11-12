const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

// Listar grupos con conteo de miembros
router.get('/', auth, (req, res) => {
  try {
    const groups = db.prepare(`
      SELECT ug.*,
        (SELECT COUNT(*) FROM user_group_members WHERE group_id = ug.id) as member_count
      FROM user_groups ug
      ORDER BY ug.name
    `).all();
    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear grupo
router.post('/', auth, adminOnly, (req, res) => {
  try {
    const { name, description } = req.body;
    const result = db.prepare(
      'INSERT INTO user_groups (name, description, created_by) VALUES (?, ?, ?)'
    ).run(name, description, req.user.id);
    res.json({ id: result.lastInsertRowid, name });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar grupo
router.put('/:id', auth, adminOnly, (req, res) => {
  try {
    const { name, description } = req.body;
    db.prepare('UPDATE user_groups SET name = ?, description = ? WHERE id = ?')
      .run(name, description, req.params.id);
    res.json({ message: 'Grupo actualizado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar grupo
router.delete('/:id', auth, adminOnly, (req, res) => {
  try {
    db.prepare('DELETE FROM user_group_members WHERE group_id = ?').run(req.params.id);
    db.prepare('DELETE FROM user_group_permissions WHERE group_id = ?').run(req.params.id);
    db.prepare('DELETE FROM user_groups WHERE id = ?').run(req.params.id);
    res.json({ message: 'Grupo eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener miembros del grupo
router.get('/:id/members', auth, (req, res) => {
  try {
    const members = db.prepare(`
      SELECT u.id, u.name, u.email, u.role
      FROM user_group_members ugm
      JOIN users u ON ugm.user_id = u.id
      WHERE ugm.group_id = ?
    `).all(req.params.id);
    res.json(members);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Agregar miembro al grupo
router.post('/:id/members', auth, adminOnly, (req, res) => {
  try {
    const { user_id } = req.body;
    const existing = db.prepare(
      'SELECT * FROM user_group_members WHERE group_id = ? AND user_id = ?'
    ).get(req.params.id, user_id);
    
    if (existing) return res.status(400).json({ error: 'El usuario ya es miembro' });

    db.prepare('INSERT INTO user_group_members (group_id, user_id) VALUES (?, ?)')
      .run(req.params.id, user_id);
    res.json({ message: 'Miembro agregado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Remover miembro del grupo
router.delete('/:id/members/:userId', auth, adminOnly, (req, res) => {
  try {
    db.prepare('DELETE FROM user_group_members WHERE group_id = ? AND user_id = ?')
      .run(req.params.id, req.params.userId);
    res.json({ message: 'Miembro removido' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener permisos del grupo
router.get('/:id/permissions', auth, (req, res) => {
  try {
    const permissions = db.prepare(
      'SELECT * FROM user_group_permissions WHERE group_id = ?'
    ).all(req.params.id);
    res.json(permissions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;