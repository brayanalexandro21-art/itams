const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

// Get survey settings
router.get('/settings', auth, adminOnly, (req, res) => {
  try {
    const settings = db.prepare("SELECT * FROM settings WHERE key LIKE 'survey_%'").all();
    const config = {};
    settings.forEach(s => {
      config[s.key] = s.value;
    });

    res.json({
      enabled: config.survey_enabled === 'true',
      send_after_resolve: config.survey_send_after_resolve === 'true',
      questions: JSON.parse(config.survey_questions || '[]'),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update survey settings
router.put('/settings', auth, adminOnly, (req, res) => {
  try {
    const { enabled, send_after_resolve, questions } = req.body;

    const upsert = db.prepare(`
      INSERT INTO settings (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = ?
    `);

    upsert.run('survey_enabled', enabled.toString(), enabled.toString());
    upsert.run('survey_send_after_resolve', send_after_resolve.toString(), send_after_resolve.toString());
    upsert.run('survey_questions', JSON.stringify(questions), JSON.stringify(questions));

    res.json({ message: 'Survey settings updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Submit survey response
router.post('/respond', (req, res) => {
  try {
    const { ticket_id, responses, overall_rating, comment } = req.body;

    // Check if already responded
    const existing = db.prepare('SELECT id FROM survey_responses WHERE ticket_id = ?').get(ticket_id);
    if (existing) {
      return res.status(400).json({ error: 'Already responded' });
    }

    const result = db.prepare(`
      INSERT INTO survey_responses (ticket_id, responses, overall_rating, comment)
      VALUES (?, ?, ?, ?)
    `).run(
      ticket_id,
      JSON.stringify(responses),
      overall_rating,
      comment
    );

    res.status(201).json({ message: 'Thank you for your feedback!', id: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get survey responses (admin)
router.get('/responses', auth, adminOnly, (req, res) => {
  try {
    const { ticket_id } = req.query;

    let query = `
      SELECT sr.*, t.title as ticket_title
      FROM survey_responses sr
      LEFT JOIN tickets t ON sr.ticket_id = t.id
    `;

    const params = [];
    if (ticket_id) {
      query += ' WHERE sr.ticket_id = ?';
      params.push(ticket_id);
    }

    query += ' ORDER BY sr.created_at DESC';

    const responses = db.prepare(query).all(...params);
    res.json(responses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get survey statistics
router.get('/stats', auth, adminOnly, (req, res) => {
  try {
    const stats = {
      total_responses: db.prepare('SELECT COUNT(*) as count FROM survey_responses').get().count,
      average_rating: db.prepare('SELECT AVG(overall_rating) as avg FROM survey_responses').get().avg || 0,
      rating_distribution: db.prepare(`
        SELECT overall_rating as rating, COUNT(*) as count
        FROM survey_responses
        GROUP BY overall_rating
        ORDER BY overall_rating DESC
      `).all(),
      recent_responses: db.prepare(`
        SELECT sr.*, t.title as ticket_title
        FROM survey_responses sr
        LEFT JOIN tickets t ON sr.ticket_id = t.id
        ORDER BY sr.created_at DESC
        LIMIT 10
      `).all(),
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
