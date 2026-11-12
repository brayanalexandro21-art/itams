const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

// Chat en tiempo real
router.get('/chat/rooms', auth, (req, res) => {
  try {
    const rooms = db.prepare(`
      SELECT cr.*, 
        (SELECT COUNT(*) FROM chat_messages WHERE room_id = cr.id) as message_count
      FROM chat_rooms cr
      JOIN chat_members cm ON cr.id = cm.room_id
      WHERE cm.user_id = ?
      ORDER BY cr.updated_at DESC
    `).all(req.user.id);
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear sala de chat
router.post('/chat/rooms', auth, (req, res) => {
  try {
    const { name, description, members } = req.body;
    const result = db.prepare(
      'INSERT INTO chat_rooms (name, description, created_by) VALUES (?, ?, ?)'
    ).run(name, description, req.user.id);

    // Agregar miembros
    const insertMember = db.prepare('INSERT INTO chat_members (room_id, user_id) VALUES (?, ?)');
    insertMember.run(result.lastInsertRowid, req.user.id);
    
    if (members) {
      members.forEach(userId => {
        insertMember.run(result.lastInsertRowid, userId);
      });
    }

    res.json({ id: result.lastInsertRowid, name });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener mensajes del chat
router.get('/chat/rooms/:roomId/messages', auth, (req, res) => {
  try {
    const messages = db.prepare(`
      SELECT cm.*, u.name as user_name
      FROM chat_messages cm
      JOIN users u ON cm.user_id = u.id
      WHERE cm.room_id = ?
      ORDER BY cm.created_at ASC
      LIMIT 100
    `).all(req.params.roomId);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Enviar mensaje
router.post('/chat/rooms/:roomId/messages', auth, (req, res) => {
  try {
    const { content, type } = req.body;
    const result = db.prepare(
      'INSERT INTO chat_messages (room_id, user_id, content, type) VALUES (?, ?, ?, ?)'
    ).run(req.params.roomId, req.user.id, content, type || 'text');
    res.json({ id: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;