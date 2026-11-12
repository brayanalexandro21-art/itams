const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

// Centro de notificaciones mejorado
router.get('/', auth, (req, res) => {
  try {
    const { type, read, page = 1, limit = 50 } = req.query;
    let query = 'SELECT * FROM notifications WHERE user_id = ?';
    const params = [req.user.id];

    if (type) { query += ' AND type = ?'; params.push(type); }
    if (read !== undefined) { query += ' AND is_read = ?'; params.push(read === 'true' ? 1 : 0); }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, (page - 1) * limit);

    const notifications = db.prepare(query).all(...params);
    const total = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ?').get(req.user.id).count;
    const unread = db.prepare("SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0").get(req.user.id).count;

    res.json({ notifications, total, unread });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Marcar como leída
router.post('/:id/read', auth, (req, res) => {
  try {
    db.prepare('UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?')
      .run(req.params.id, req.user.id);
    res.json({ message: 'Marcada como leída' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Marcar todas como leídas
router.post('/read-all', auth, (req, res) => {
  try {
    const result = db.prepare('UPDATE notifications SET read = 1 WHERE user_id = ? AND read = 0')
      .run(req.user.id);
    res.json({ marked: result.changes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar notificación
router.delete('/:id', auth, (req, res) => {
  try {
    db.prepare('DELETE FROM notifications WHERE id = ? AND user_id = ?')
      .run(req.params.id, req.user.id);
    res.json({ message: 'Eliminada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Estadísticas
router.get('/stats', auth, (req, res) => {
  try {
    const total = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ?').get(req.user.id).count;
    const unread = db.prepare("SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0").get(req.user.id).count;
    const byType = db.prepare(`
      SELECT type, COUNT(*) as count
      FROM notifications WHERE user_id = ?
      GROUP BY type ORDER BY count DESC
    `).all(req.user.id);

    res.json({ total, unread, byType });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;