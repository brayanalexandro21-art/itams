const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

// Email configuration (in production, use a real email service)
const emailConfig = {
  enabled: false,
  smtp_host: process.env.SMTP_HOST || 'smtp.gmail.com',
  smtp_port: process.env.SMTP_PORT || 587,
  smtp_user: process.env.SMTP_USER || '',
  smtp_pass: process.env.SMTP_PASS || '',
  from_name: 'ITAMS',
  from_email: process.env.SMTP_FROM || 'noreply@itams.com',
};

// Get email settings
router.get('/settings', auth, adminOnly, (req, res) => {
  try {
    const settings = db.prepare(
      "SELECT * FROM settings WHERE key LIKE 'email_%'"
    ).all();

    const config = {};
    settings.forEach(s => {
      config[s.key] = s.value;
    });

    res.json({
      enabled: config.email_enabled === 'true',
      smtp_host: config.email_smtp_host || emailConfig.smtp_host,
      smtp_port: config.email_smtp_port || emailConfig.smtp_port,
      smtp_user: config.email_smtp_user || '',
      from_name: config.email_from_name || emailConfig.from_name,
      from_email: config.email_from_email || emailConfig.from_email,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update email settings
router.put('/settings', auth, adminOnly, (req, res) => {
  try {
    const { enabled, smtp_host, smtp_port, smtp_user, smtp_pass, from_name, from_email } = req.body;

    const upsert = db.prepare(`
      INSERT INTO settings (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = ?
    `);

    upsert.run('email_enabled', enabled.toString(), enabled.toString());
    upsert.run('email_smtp_host', smtp_host, smtp_host);
    upsert.run('email_smtp_port', smtp_port.toString(), smtp_port.toString());
    upsert.run('email_smtp_user', smtp_user, smtp_user);
    if (smtp_pass) upsert.run('email_smtp_pass', smtp_pass, smtp_pass);
    upsert.run('email_from_name', from_name, from_name);
    upsert.run('email_from_email', from_email, from_email);

    res.json({ message: 'Email settings updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send test email
router.post('/test', auth, adminOnly, async (req, res) => {
  try {
    const { to } = req.body;

    // In production, use nodemailer or similar
    // For now, just log the email
    console.log(`[EMAIL] Test email would be sent to: ${to}`);

    res.json({ message: 'Test email sent (check logs)' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper function to send email (used internally)
async function sendEmail(to, subject, html) {
  // In production, implement actual email sending
  console.log(`[EMAIL] To: ${to}, Subject: ${subject}`);
  console.log(`[EMAIL] Body: ${html.substring(0, 100)}...`);
  return true;
}

// Email templates
function ticketCreatedTemplate(ticket) {
  return `
    <h2>New Ticket Created</h2>
    <p><strong>Ticket #${ticket.id}:</strong> ${ticket.title}</p>
    <p><strong>Priority:</strong> ${ticket.priority}</p>
    <p><strong>Category:</strong> ${ticket.category || 'N/A'}</p>
    <p><strong>Description:</strong></p>
    <p>${ticket.description || 'No description'}</p>
    <hr>
    <p><a href="${process.env.APP_URL || 'http://localhost:5173'}/tickets/${ticket.id}">View Ticket</a></p>
  `;
}

function ticketAssignedTemplate(ticket, assignedTo) {
  return `
    <h2>Ticket Assigned to You</h2>
    <p><strong>Ticket #${ticket.id}:</strong> ${ticket.title}</p>
    <p>You have been assigned to this ticket.</p>
    <hr>
    <p><a href="${process.env.APP_URL || 'http://localhost:5173'}/tickets/${ticket.id}">View Ticket</a></p>
  `;
}

function ticketStatusChangedTemplate(ticket, oldStatus, newStatus) {
  return `
    <h2>Ticket Status Updated</h2>
    <p><strong>Ticket #${ticket.id}:</strong> ${ticket.title}</p>
    <p>Status changed from <strong>${oldStatus}</strong> to <strong>${newStatus}</strong></p>
    <hr>
    <p><a href="${process.env.APP_URL || 'http://localhost:5173'}/tickets/${ticket.id}">View Ticket</a></p>
  `;
}

module.exports = router;
module.exports.sendEmail = sendEmail;
module.exports.ticketCreatedTemplate = ticketCreatedTemplate;
module.exports.ticketAssignedTemplate = ticketAssignedTemplate;
module.exports.ticketStatusChangedTemplate = ticketStatusChangedTemplate;
