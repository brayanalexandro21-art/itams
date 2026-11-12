const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth } = require('../middleware/auth');

// Get notifications for current user
router.get('/', auth, (req, res) => {
  try {
    const { unread_only } = req.query;
    let query = 'SELECT * FROM notifications WHERE user_id = ?';

    if (unread_only === 'true') {
      query += ' AND read = 0';
    }

    query += ' ORDER BY created_at DESC LIMIT 50';

    const notifications = db.prepare(query).all(req.user.id);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get unread count
router.get('/unread-count', auth, (req, res) => {
  try {
    const count = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND read = 0').get(req.user.id);
    res.json({ count: count.count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark notification as read
router.put('/:id/read', auth, (req, res) => {
  try {
    db.prepare('UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark all as read
router.put('/read-all', auth, (req, res) => {
  try {
    db.prepare('UPDATE notifications SET read = 1 WHERE user_id = ? AND read = 0').run(req.user.id);
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete notification
router.delete('/:id', auth, (req, res) => {
  try {
    db.prepare('DELETE FROM notifications WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
    res.json({ message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper function to create notification (used internally)
function createNotification(userId, title, message, type = 'info', link = null) {
  return db.prepare(
    'INSERT INTO notifications (user_id, title, message, type, link) VALUES (?, ?, ?, ?, ?)'
  ).run(userId, title, message, type, link);
}

module.exports = router;
module.exports.createNotification = createNotification;
