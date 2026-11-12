const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

// Listar encuestas
router.get('/', auth, (req, res) => {
  try {
    const surveys = db.prepare(`
      SELECT s.*,
        (SELECT COUNT(*) FROM survey_submissions WHERE survey_id = s.id) as response_count
      FROM surveys s
      ORDER BY s.created_at DESC
    `).all();
    res.json(surveys);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener encuesta con preguntas
router.get('/:id', auth, (req, res) => {
  try {
    const survey = db.prepare('SELECT * FROM surveys WHERE id = ?').get(req.params.id);
    if (!survey) return res.status(404).json({ error: 'Encuesta no encontrada' });

    const questions = db.prepare('SELECT * FROM survey_questions WHERE survey_id = ? ORDER BY sort_order').all(req.params.id);
    const responses = db.prepare(`
      SELECT sr.*, u.name as respondent_name
      FROM survey_submissions sr
      LEFT JOIN users u ON sr.user_id = u.id
      WHERE sr.survey_id = ?
      ORDER BY sr.submitted_at DESC
    `).all(req.params.id);

    res.json({ ...survey, questions, responses });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear encuesta
router.post('/', auth, adminOnly, (req, res) => {
  try {
    const { title, description, questions } = req.body;
    const result = db.prepare(`
      INSERT INTO surveys (title, description, status, created_by)
      VALUES (?, ?, 'draft', ?)
    `).run(title, description, req.user.id);

    if (questions && questions.length > 0) {
      const insertQ = db.prepare(`
        INSERT INTO survey_questions (survey_id, question, type, options, sort_order)
        VALUES (?, ?, ?, ?, ?)
      `);
      questions.forEach((q, i) => {
        insertQ.run(result.lastInsertRowid, q.question, q.type, JSON.stringify(q.options || []), i);
      });
    }

    res.json({ id: result.lastInsertRowid, title });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Publicar encuesta
router.post('/:id/publish', auth, adminOnly, (req, res) => {
  try {
    db.prepare("UPDATE surveys SET status = 'active' WHERE id = ?").run(req.params.id);
    res.json({ message: 'Encuesta publicada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Responder encuesta
router.post('/:id/respond', auth, (req, res) => {
  try {
    const { answers } = req.body;
    const result = db.prepare(`
      INSERT INTO survey_submissions (survey_id, user_id, answers, submitted_at)
      VALUES (?, ?, ?, datetime('now'))
    `).run(req.params.id, req.user.id, JSON.stringify(answers));
    res.json({ id: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Estadísticas de encuesta
router.get('/:id/stats', auth, (req, res) => {
  try {
    const survey = db.prepare('SELECT * FROM surveys WHERE id = ?').get(req.params.id);
    const questions = db.prepare('SELECT * FROM survey_questions WHERE survey_id = ?').all(req.params.id);
    const responses = db.prepare('SELECT answers FROM survey_submissions WHERE survey_id = ?').all(req.params.id);

    const stats = questions.map(q => {
      const answers = responses.map(r => {
        try { return JSON.parse(r.answers)[q.id]; } catch { return null; }
      }).filter(a => a !== undefined && a !== null);

      if (q.type === 'rating' || q.type === 'scale') {
        const avg = answers.length > 0 ? answers.reduce((s, a) => s + Number(a), 0) / answers.length : 0;
        return { question: q.question, type: q.type, average: Math.round(avg * 10) / 10, responses: answers.length };
      }
      
      if (q.type === 'multiple_choice') {
        const distribution = {};
        answers.forEach(a => { distribution[a] = (distribution[a] || 0) + 1; });
        return { question: q.question, type: q.type, distribution, responses: answers.length };
      }

      return { question: q.question, type: q.type, responses: answers.length };
    });

    res.json({ total_responses: responses.length, stats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;