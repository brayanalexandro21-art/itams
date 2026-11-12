const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

// Get all email templates
router.get('/', auth, adminOnly, (req, res) => {
  try {
    const templates = db.prepare('SELECT * FROM email_templates ORDER BY name').all();
    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get template by ID
router.get('/:id', auth, adminOnly, (req, res) => {
  try {
    const template = db.prepare('SELECT * FROM email_templates WHERE id = ?').get(req.params.id);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    res.json(template);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create email template
router.post('/', auth, adminOnly, (req, res) => {
  try {
    const { name, subject, body, variables, category } = req.body;

    const result = db.prepare(`
      INSERT INTO email_templates (name, subject, body, variables, category, created_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(name, subject, body, JSON.stringify(variables || []), category, req.user.id);

    const template = db.prepare('SELECT * FROM email_templates WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(template);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update email template
router.put('/:id', auth, adminOnly, (req, res) => {
  try {
    const { name, subject, body, variables, category, active } = req.body;

    db.prepare(`
      UPDATE email_templates
      SET name = COALESCE(?, name),
          subject = COALESCE(?, subject),
          body = COALESCE(?, body),
          variables = COALESCE(?, variables),
          category = COALESCE(?, category),
          active = COALESCE(?, active),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      name,
      subject,
      body,
      variables ? JSON.stringify(variables) : null,
      category,
      active,
      req.params.id
    );

    const template = db.prepare('SELECT * FROM email_templates WHERE id = ?').get(req.params.id);
    res.json(template);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete email template
router.delete('/:id', auth, adminOnly, (req, res) => {
  try {
    db.prepare('DELETE FROM email_templates WHERE id = ?').run(req.params.id);
    res.json({ message: 'Template deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Preview template with variables
router.post('/:id/preview', auth, adminOnly, (req, res) => {
  try {
    const template = db.prepare('SELECT * FROM email_templates WHERE id = ?').get(req.params.id);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const { variables } = req.body;

    // Replace variables in subject and body
    let subject = template.subject;
    let body = template.body;

    if (variables) {
      Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        subject = subject.replace(regex, value);
        body = body.replace(regex, value);
      });
    }

    res.json({
      subject,
      body,
      original_subject: template.subject,
      original_body: template.body,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send email using template
router.post('/:id/send', auth, adminOnly, (req, res) => {
  try {
    const template = db.prepare('SELECT * FROM email_templates WHERE id = ?').get(req.params.id);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const { to, variables } = req.body;

    // Replace variables
    let subject = template.subject;
    let body = template.body;

    if (variables) {
      Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        subject = subject.replace(regex, value);
        body = body.replace(regex, value);
      });
    }

    // Log the email (in production, send via SMTP)
    db.prepare(`
      INSERT INTO email_logs (to_email, subject, body, status, sent_at)
      VALUES (?, ?, ?, 'sent', CURRENT_TIMESTAMP)
    `).run(to, subject, body);

    console.log(`[EMAIL] Sent to ${to}: ${subject}`);

    res.json({ message: 'Email sent successfully', to, subject });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get default templates
router.get('/defaults/list', auth, adminOnly, (req, res) => {
  try {
    const defaultTemplates = [
      {
        name: 'ticket_created',
        subject: 'Ticket #{{ticket_id}} Created',
        body: 'Your support ticket has been created successfully.\n\nTicket ID: #{{ticket_id}}\nTitle: {{title}}\nPriority: {{priority}}\n\nWe will respond shortly.',
        variables: ['ticket_id', 'title', 'priority'],
        category: 'tickets',
      },
      {
        name: 'ticket_assigned',
        subject: 'Ticket #{{ticket_id}} Assigned to You',
        body: 'You have been assigned to ticket #{{ticket_id}}.\n\nTitle: {{title}}\nDescription: {{description}}\n\nPlease review and respond.',
        variables: ['ticket_id', 'title', 'description'],
        category: 'tickets',
      },
      {
        name: 'ticket_resolved',
        subject: 'Ticket #{{ticket_id}} Resolved',
        body: 'Your ticket #{{ticket_id}} has been resolved.\n\nTitle: {{title}}\nResolution: {{resolution}}\n\nPlease rate your experience.',
        variables: ['ticket_id', 'title', 'resolution'],
        category: 'tickets',
      },
      {
        name: 'password_reset',
        subject: 'Password Reset Request',
        body: 'You requested a password reset.\n\nClick the link below to reset your password:\n{{reset_link}}\n\nThis link expires in 24 hours.',
        variables: ['reset_link'],
        category: 'auth',
      },
      {
        name: 'welcome',
        subject: 'Welcome to ITAMS',
        body: 'Welcome {{name}}!\n\nYour account has been created.\n\nEmail: {{email}}\nRole: {{role}}\n\nPlease log in to get started.',
        variables: ['name', 'email', 'role'],
        category: 'auth',
      },
    ];

    res.json(defaultTemplates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
