const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth } = require('../middleware/auth');

// Get all chat rooms
router.get('/rooms', auth, (req, res) => {
  try {
    const rooms = db.prepare(`
      SELECT cr.*, 
        u1.name as created_by_name,
        (SELECT COUNT(*) FROM chat_members WHERE room_id = cr.id) as member_count,
        (SELECT content FROM chat_messages WHERE room_id = cr.id ORDER BY created_at DESC LIMIT 1) as last_message,
        (SELECT created_at FROM chat_messages WHERE room_id = cr.id ORDER BY created_at DESC LIMIT 1) as last_message_at
      FROM chat_rooms cr
      LEFT JOIN users u1 ON cr.created_by = u1.id
      LEFT JOIN chat_members cm ON cr.id = cm.room_id AND cm.user_id = ?
      WHERE cm.user_id IS NOT NULL OR cr.is_public = 1
      ORDER BY last_message_at DESC
    `).all(req.user.id);

    res.json(rooms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create chat room
router.post('/rooms', auth, (req, res) => {
  try {
    const { name, description, is_public, members } = req.body;

    const result = db.prepare(`
      INSERT INTO chat_rooms (name, description, created_by, is_public)
      VALUES (?, ?, ?, ?)
    `).run(name, description, req.user.id, is_public ? 1 : 0);

    const roomId = result.lastInsertRowid;

    // Add creator as member
    db.prepare('INSERT INTO chat_members (room_id, user_id) VALUES (?, ?)').run(roomId, req.user.id);

    // Add other members
    if (members && members.length > 0) {
      const insertMember = db.prepare('INSERT INTO chat_members (room_id, user_id) VALUES (?, ?)');
      members.forEach(userId => {
        insertMember.run(roomId, userId);
      });
    }

    const room = db.prepare('SELECT * FROM chat_rooms WHERE id = ?').get(roomId);
    res.status(201).json(room);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get messages in room
router.get('/rooms/:roomId/messages', auth, (req, res) => {
  try {
    const { limit, before } = req.query;

    let query = `
      SELECT cm.*, u.name as user_name, u.avatar
      FROM chat_messages cm
      LEFT JOIN users u ON cm.user_id = u.id
      WHERE cm.room_id = ?
    `;

    const params = [req.params.roomId];

    if (before) {
      query += ' AND cm.id < ?';
      params.push(before);
    }

    query += ' ORDER BY cm.created_at DESC LIMIT ?';
    params.push(parseInt(limit) || 50);

    const messages = db.prepare(query).all(...params);

    res.json(messages.reverse());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send message
router.post('/rooms/:roomId/messages', auth, (req, res) => {
  try {
    const { content, type, reply_to } = req.body;

    const result = db.prepare(`
      INSERT INTO chat_messages (room_id, user_id, content, type, reply_to)
      VALUES (?, ?, ?, ?, ?)
    `).run(req.params.roomId, req.user.id, content, type || 'text', reply_to);

    const message = db.prepare(`
      SELECT cm.*, u.name as user_name
      FROM chat_messages cm
      LEFT JOIN users u ON cm.user_id = u.id
      WHERE cm.id = ?
    `).get(result.lastInsertRowid);

    // Update room's last message time
    db.prepare('UPDATE chat_rooms SET updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(req.params.roomId);

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get unread message count per room
router.get('/unread', auth, (req, res) => {
  try {
    const unread = db.prepare(`
      SELECT cm.room_id, COUNT(*) as count
      FROM chat_messages cm
      LEFT JOIN chat_read_status crs ON cm.id = crs.message_id AND crs.user_id = ?
      WHERE crs.message_id IS NULL AND cm.user_id != ?
      GROUP BY cm.room_id
    `).all(req.user.id, req.user.id);

    res.json(unread);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark room as read
router.post('/rooms/:roomId/read', auth, (req, res) => {
  try {
    db.prepare(`
      INSERT OR IGNORE INTO chat_read_status (message_id, user_id)
      SELECT id, ? FROM chat_messages WHERE room_id = ? AND user_id != ?
    `).run(req.user.id, req.params.roomId, req.user.id);

    res.json({ message: 'Marked as read' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
