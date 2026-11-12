const express = require('express');
const router = express.Router();
const db = require('../database');

// Store connected clients
const clients = new Map();

// WebSocket simulation endpoint (in production, use socket.io or ws)
router.get('/ws', (req, res) => {
  res.json({
    message: 'WebSocket endpoint',
    note: 'In production, this would be a WebSocket connection. For now, use polling.',
    pollingEndpoint: '/api/realtime/poll',
  });
});

// Polling endpoint for real-time updates
router.get('/poll', (req, res) => {
  const { last_check } = req.query;
  const lastCheck = last_check ? new Date(last_check) : new Date(Date.now() - 60000);

  try {
    const updates = {
      tickets: db.prepare(`
        SELECT id, title, status, priority, updated_at
        FROM tickets
        WHERE updated_at > ?
        ORDER BY updated_at DESC
        LIMIT 10
      `).all(lastCheck.toISOString()),
      notifications: db.prepare(`
        SELECT id, title, message, type, read, created_at
        FROM notifications
        WHERE created_at > ?
        ORDER BY created_at DESC
        LIMIT 10
      `).all(lastCheck.toISOString()),
      timestamp: new Date().toISOString(),
    };

    res.json(updates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Broadcast to all connected clients (simulated)
function broadcast(event, data) {
  console.log(`[BROADCAST] ${event}:`, JSON.stringify(data).substring(0, 100));
  // In production, this would send to all WebSocket clients
}

// Subscribe to events (simulated)
router.post('/subscribe', (req, res) => {
  const { events } = req.body;
  console.log(`[SUBSCRIBE] Client subscribed to:`, events);
  res.json({ message: 'Subscribed to events', events });
});

module.exports = router;
module.exports.broadcast = broadcast;
