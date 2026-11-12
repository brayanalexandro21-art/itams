const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth } = require('../middleware/auth');

// Obtener progreso de onboarding del usuario
router.get('/progress', auth, (req, res) => {
  try {
    let onboarding = db.prepare('SELECT * FROM user_onboarding WHERE user_id = ?').get(req.user.id);
    
    if (!onboarding) {
      db.prepare(`
        INSERT INTO user_onboarding (user_id, current_step, completed_steps, completed)
        VALUES (?, 0, '[]', 0)
      `).run(req.user.id);
      onboarding = db.prepare('SELECT * FROM user_onboarding WHERE user_id = ?').get(req.user.id);
    }

    const steps = [
      { id: 0, name: 'Bienvenida', description: 'Bienvenido a ITAMS', icon: '👋' },
      { id: 1, name: 'Perfil', description: 'Completa tu perfil de usuario', icon: '👤' },
      { id: 2, name: 'Primer Ticket', description: 'Crea tu primer ticket de soporte', icon: '🎫' },
      { id: 3, name: 'Primer Activo', description: 'Registra tu primer activo de TI', icon: '💻' },
      { id: 4, name: 'Búsqueda', description: 'Prueba la búsqueda avanzada', icon: '🔍' },
      { id: 5, name: 'Knowledge Base', description: 'Explora la base de conocimiento', icon: '📚' },
      { id: 6, name: 'Atajos de Teclado', description: 'Aprende los atajos de teclado', icon: '⌨️' },
      { id: 7, name: 'Notificaciones', description: 'Configura tus preferencias de notificación', icon: '🔔' },
    ];

    const completedSteps = JSON.parse(onboarding.completed_steps || '[]');

    res.json({
      current_step: onboarding.current_step,
      completed: onboarding.completed === 1,
      steps: steps.map(s => ({
        ...s,
        completed: completedSteps.includes(s.id),
      })),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Completar un paso
router.post('/step/:stepId', auth, (req, res) => {
  try {
    const stepId = parseInt(req.params.stepId);
    const onboarding = db.prepare('SELECT * FROM user_onboarding WHERE user_id = ?').get(req.user.id);
    
    if (!onboarding) {
      db.prepare('INSERT INTO user_onboarding (user_id, current_step, completed_steps, completed) VALUES (?, 0, \'[]\', 0)').run(req.user.id);
    }

    const current = db.prepare('SELECT * FROM user_onboarding WHERE user_id = ?').get(req.user.id);
    const completedSteps = JSON.parse(current.completed_steps || '[]');
    
    if (!completedSteps.includes(stepId)) {
      completedSteps.push(stepId);
    }

    const nextStep = Math.max(current.current_step, stepId + 1);
    const isComplete = completedSteps.length >= 7;

    db.prepare('UPDATE user_onboarding SET current_step = ?, completed_steps = ?, completed = ? WHERE user_id = ?')
      .run(nextStep, JSON.stringify(completedSteps), isComplete ? 1 : 0, req.user.id);

    res.json({ step: stepId, nextStep, completed: isComplete });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Resetear onboarding
router.post('/reset', auth, (req, res) => {
  try {
    db.prepare('UPDATE user_onboarding SET current_step = 0, completed_steps = \'[]\', completed = 0 WHERE user_id = ?')
      .run(req.user.id);
    res.json({ message: 'Onboarding reiniciado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;