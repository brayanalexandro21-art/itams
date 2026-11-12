const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

// Get contracts expiring soon
router.get('/expiring', auth, (req, res) => {
  try {
    const { days = 30 } = req.query;

    const contracts = db.prepare(`
      SELECT c.*, v.name as vendor_name,
        CASE 
          WHEN c.end_date < DATE('now') THEN 'expired'
          WHEN c.end_date <= DATE('now', '+' || ? || ' days') THEN 'expiring_soon'
          ELSE 'active'
        END as status_label
      FROM contracts c
      LEFT JOIN vendors v ON c.vendor_id = v.id
      WHERE c.end_date <= DATE('now', '+' || ? || ' days')
        AND c.status = 'active'
      ORDER BY c.end_date ASC
    `).all(parseInt(days), parseInt(days));

    res.json(contracts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get renewal statistics
router.get('/stats', auth, adminOnly, (req, res) => {
  try {
    const stats = {
      expiring_30_days: db.prepare(`
        SELECT COUNT(*) as count FROM contracts
        WHERE end_date BETWEEN DATE('now') AND DATE('now', '+30 days')
        AND status = 'active'
      `).get().count,
      expiring_60_days: db.prepare(`
        SELECT COUNT(*) as count FROM contracts
        WHERE end_date BETWEEN DATE('now') AND DATE('now', '+60 days')
        AND status = 'active'
      `).get().count,
      expiring_90_days: db.prepare(`
        SELECT COUNT(*) as count FROM contracts
        WHERE end_date BETWEEN DATE('now') AND DATE('now', '+90 days')
        AND status = 'active'
      `).get().count,
      auto_renew_enabled: db.prepare(`
        SELECT COUNT(*) as count FROM contracts
        WHERE auto_renew = 1 AND status = 'active'
      `).get().count,
      total_value_expiring: db.prepare(`
        SELECT SUM(value) as total FROM contracts
        WHERE end_date BETWEEN DATE('now') AND DATE('now', '+90 days')
        AND status = 'active'
      `).get().total || 0,
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Process auto-renewals
router.post('/process-renewals', auth, adminOnly, (req, res) => {
  try {
    const contracts = db.prepare(`
      SELECT * FROM contracts
      WHERE auto_renew = 1
        AND end_date <= DATE('now', '+' || COALESCE(renewal_period, 30) || ' days')
        AND status = 'active'
    `).all();

    let renewed = 0;

    contracts.forEach(contract => {
      try {
        // Calculate new end date
        const currentEnd = new Date(contract.end_date);
        const renewalPeriod = contract.renewal_period || 30;
        currentEnd.setDate(currentEnd.getDate() + renewalPeriod);

        // Update contract
        db.prepare(`
          UPDATE contracts
          SET end_date = ?, status = 'active', updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(currentEnd.toISOString().split('T')[0], contract.id);

        // Log renewal
        db.prepare(`
          INSERT INTO contract_history (contract_id, action, details, performed_by)
          VALUES (?, 'auto_renewed', ?, ?)
        `).run(
          contract.id,
          `Auto-renewed for ${renewalPeriod} days`,
          req.user.id
        );

        renewed++;
      } catch (error) {
        console.error(`Error renewing contract ${contract.id}:`, error);
      }
    });

    res.json({
      message: `Processed ${renewed} contract renewals`,
      renewed,
      total_checked: contracts.length,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send renewal reminders
router.post('/send-reminders', auth, adminOnly, (req, res) => {
  try {
    const contracts = db.prepare(`
      SELECT c.*, v.name as vendor_name, v.email as vendor_email,
        u.name as assigned_name, u.email as assigned_email
      FROM contracts c
      LEFT JOIN vendors v ON c.vendor_id = v.id
      LEFT JOIN users u ON c.assigned_to = u.id
      WHERE c.end_date <= DATE('now', '+' || COALESCE(c.notification_days, 30) || ' days')
        AND c.end_date >= DATE('now')
        AND c.status = 'active'
    `).all();

    let remindersSent = 0;

    contracts.forEach(contract => {
      // In production, send actual email notifications
      console.log(`[REMINDER] Contract ${contract.contract_number} expires on ${contract.end_date}`);

      // Log the reminder
      db.prepare(`
        INSERT INTO contract_history (contract_id, action, details, performed_by)
        VALUES (?, 'reminder_sent', ?, ?)
      `).run(
        contract.id,
        `Reminder sent - expires ${contract.end_date}`,
        req.user.id
      );

      remindersSent++;
    });

    res.json({
      message: `Sent ${remindersSent} renewal reminders`,
      reminders_sent: remindersSent,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get renewal timeline
router.get('/timeline', auth, (req, res) => {
  try {
    const { months = 12 } = req.query;

    const timeline = db.prepare(`
      SELECT 
        strftime('%Y-%m', end_date) as month,
        COUNT(*) as contracts_count,
        SUM(value) as total_value
      FROM contracts
      WHERE end_date BETWEEN DATE('now') AND DATE('now', '+' || ? || ' months')
        AND status = 'active'
      GROUP BY strftime('%Y-%m', end_date)
      ORDER BY month
    `).all(parseInt(months));

    res.json(timeline);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
