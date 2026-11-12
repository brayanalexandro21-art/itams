const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth } = require('../middleware/auth');

// AI-powered ticket categorization (simulated)
router.post('/categorize', auth, (req, res) => {
  try {
    const { title, description } = req.body;
    const text = `${title} ${description}`.toLowerCase();

    // Simple keyword-based categorization (in production, use ML model)
    const categories = {
      hardware: ['computer', 'laptop', 'printer', 'monitor', 'keyboard', 'mouse', 'hardware', 'pc', 'desktop', 'screen'],
      software: ['software', 'install', 'update', 'application', 'program', 'windows', 'office', 'browser', 'email'],
      network: ['network', 'internet', 'wifi', 'connection', 'router', 'switch', 'vpn', 'lan', 'wan'],
      access: ['password', 'login', 'access', 'permission', 'account', 'locked', 'reset', 'forgot'],
      email: ['email', 'outlook', 'gmail', 'mail', 'inbox', 'smtp', 'exchange'],
      security: ['virus', 'malware', 'security', 'firewall', 'antivirus', 'hack', 'breach'],
    };

    const priorities = {
      urgent: ['urgent', 'critical', 'down', 'broken', 'emergency', 'cannot work', 'not working'],
      high: ['important', 'asap', 'quickly', 'priority', 'affecting work', 'deadline'],
      medium: ['issue', 'problem', 'help', 'need', 'request', 'question'],
      low: ['when possible', 'minor', 'small', 'suggestion', 'enhancement'],
    };

    // Detect category
    let detectedCategory = 'other';
    let maxScore = 0;

    for (const [category, keywords] of Object.entries(categories)) {
      const score = keywords.filter(kw => text.includes(kw)).length;
      if (score > maxScore) {
        maxScore = score;
        detectedCategory = category;
      }
    }

    // Detect priority
    let detectedPriority = 'medium';
    let priorityScore = 0;

    for (const [priority, keywords] of Object.entries(priorities)) {
      const score = keywords.filter(kw => text.includes(kw)).length;
      if (score > priorityScore) {
        priorityScore = score;
        detectedPriority = priority;
      }
    }

    // Generate suggested solution based on category
    const solutions = {
      hardware: 'Check physical connections, restart the device, check for driver updates.',
      software: 'Try restarting the application, check for updates, reinstall if necessary.',
      network: 'Check network cables, restart router/modem, verify network settings.',
      access: 'Reset password through self-service portal, check account status.',
      email: 'Check email client settings, verify server connection, clear cache.',
      security: 'Run antivirus scan, change passwords, contact security team.',
      other: 'Please provide more details about the issue.',
    };

    res.json({
      category: detectedCategory,
      priority: detectedPriority,
      confidence: Math.min(0.95, 0.5 + (maxScore * 0.1)),
      suggestedSolution: solutions[detectedCategory],
      keywords: text.split(' ').filter(word => word.length > 3).slice(0, 5),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// AI-powered ticket summary (simulated)
router.post('/summarize', auth, (req, res) => {
  try {
    const { ticketId } = req.body;
    const ticket = db.prepare(`
      SELECT t.*, GROUP_CONCAT(c.comment, ' ') as comments
      FROM tickets t
      LEFT JOIN ticket_comments c ON t.id = c.ticket_id
      WHERE t.id = ?
      GROUP BY t.id
    `).get(ticketId);

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Simple summarization (in production, use NLP/LLM)
    const summary = {
      title: ticket.title,
      status: ticket.status,
      priority: ticket.priority,
      category: ticket.category,
      commentCount: ticket.comments ? ticket.comments.split(' ').length : 0,
      suggestedAction: ticket.status === 'open' ? 'Assign to technician' : 'Review progress',
    };

    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// AI-powered similar tickets (simulated)
router.post('/similar', auth, (req, res) => {
  try {
    const { ticketId } = req.body;
    const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(ticketId);

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Find similar tickets based on category and keywords
    const similar = db.prepare(`
      SELECT id, title, status, priority, category,
        CASE 
          WHEN category = ? THEN 10
          ELSE 0
        END as relevance
      FROM tickets
      WHERE id != ? AND (category = ? OR title LIKE ?)
      ORDER BY relevance DESC, created_at DESC
      LIMIT 5
    `).all(ticket.category, ticketId, ticket.category, `%${ticket.title.split(' ')[0]}%`);

    res.json({
      similarTickets: similar,
      suggestion: similar.length > 0 
        ? 'This ticket may be related to previous issues. Check the similar tickets above.'
        : 'No similar tickets found.',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get AI insights for dashboard
router.get('/insights', auth, (req, res) => {
  try {
    // Analyze ticket patterns
    const categoryStats = db.prepare(`
      SELECT category, COUNT(*) as count
      FROM tickets
      WHERE category IS NOT NULL
      GROUP BY category
      ORDER BY count DESC
    `).all();

    const priorityStats = db.prepare(`
      SELECT priority, COUNT(*) as count
      FROM tickets
      GROUP BY priority
      ORDER BY 
        CASE priority
          WHEN 'urgent' THEN 1
          WHEN 'high' THEN 2
          WHEN 'medium' THEN 3
          WHEN 'low' THEN 4
        END
    `).all();

    const recentTrends = db.prepare(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM tickets
      WHERE created_at >= DATE('now', '-7 days')
      GROUP BY DATE(created_at)
      ORDER BY date
    `).all();

    // Generate insights
    const insights = [];

    if (categoryStats.length > 0) {
      insights.push({
        type: 'info',
        message: `Most common issue: ${categoryStats[0].category} (${categoryStats[0].count} tickets)`,
      });
    }

    const urgentCount = priorityStats.find(p => p.priority === 'urgent')?.count || 0;
    if (urgentCount > 0) {
      insights.push({
        type: 'warning',
        message: `${urgentCount} urgent tickets need immediate attention`,
      });
    }

    if (recentTrends.length >= 2) {
      const lastTwo = recentTrends.slice(-2);
      const trend = lastTwo[1].count - lastTwo[0].count;
      if (trend > 0) {
        insights.push({
          type: 'trend',
          message: `Ticket volume increased by ${trend} yesterday`,
        });
      }
    }

    res.json({
      insights,
      categoryStats,
      priorityStats,
      recentTrends,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
