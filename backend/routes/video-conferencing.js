const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth } = require('../middleware/auth');

// Configurar integración de video
router.post('/configure', auth, (req, res) => {
  try {
    const { platform, api_key, webhook_url } = req.body;
    
    // integrations.name no es único: se actualiza si ya existe, si no se crea
    const config = JSON.stringify({ api_key, webhook_url });
    const existing = db.prepare(
      "SELECT id FROM integrations WHERE name = ? AND type = 'video_conferencing'"
    ).get(platform);
    if (existing) {
      db.prepare('UPDATE integrations SET config = ?, user_id = ? WHERE id = ?').run(config, req.user.id, existing.id);
    } else {
      db.prepare(
        "INSERT INTO integrations (name, type, config, user_id) VALUES (?, 'video_conferencing', ?, ?)"
      ).run(platform, config, req.user.id);
    }

    res.json({ message: `Integración con ${platform} configurada` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener integraciones de video
router.get('/list', auth, (req, res) => {
  try {
    const integrations = db.prepare(`
      SELECT id, name, type, config, active
      FROM integrations
      WHERE type = 'video_conferencing'
    `).all();
    res.json(integrations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear reunión
router.post('/create-meeting', auth, (req, res) => {
  try {
    const { title, description, scheduled_time, platform, attendees } = req.body;
    
    // Simular creación de reunión
    const meetingId = `MEET-${Date.now()}`;
    
    db.prepare(`
      INSERT INTO meetings (user_id, title, description, meeting_id, platform, scheduled_time, status)
      VALUES (?, ?, ?, ?, ?, ?, 'scheduled')
    `).run(req.user.id, title, description, meetingId, platform, scheduled_time);

    res.json({ 
      meeting_id: meetingId,
      join_url: `https://${platform}.com/meet/${meetingId}`,
      scheduled_time 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener reuniones programadas
router.get('/meetings', auth, (req, res) => {
  try {
    const meetings = db.prepare(`
      SELECT * FROM meetings 
      WHERE user_id = ? AND scheduled_time >= date('now')
      ORDER BY scheduled_time ASC
    `).all(req.user.id);
    res.json(meetings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;