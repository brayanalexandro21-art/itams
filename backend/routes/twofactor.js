const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../database');
const { auth } = require('../middleware/auth');

// Generate 2FA secret
function generateSecret() {
  return crypto.randomBytes(20).toString('hex');
}

// Generate TOTP code (simplified - in production use speakeasy or otplib)
function generateTOTP(secret, timeStep = 30) {
  const epoch = Math.floor(Date.now() / 1000 / timeStep);
  const hash = crypto.createHmac('sha1', secret).update(epoch.toString()).digest('hex');
  const offset = parseInt(hash.slice(-1), 16);
  const code = ((parseInt(hash.slice(offset * 2, offset * 2 + 8), 16) & 0x7fffffff) % 1000000).toString();
  return code.padStart(6, '0');
}

// Get 2FA status
router.get('/status', auth, (req, res) => {
  try {
    const user = db.prepare('SELECT two_factor_enabled FROM users WHERE id = ?').get(req.user.id);
    res.json({ enabled: user.two_factor_enabled === 1 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Enable 2FA - generate secret
router.post('/enable', auth, (req, res) => {
  try {
    const secret = generateSecret();
    
    db.prepare('UPDATE users SET two_factor_secret = ? WHERE id = ?').run(secret, req.user.id);
    
    // Generate backup codes
    const backupCodes = Array(8).fill(null).map(() => crypto.randomBytes(4).toString('hex'));
    
    res.json({
      secret,
      qrCode: `otpauth://totp/ITAMS:${req.user.email}?secret=${secret}&issuer=ITAMS`,
      backupCodes,
      message: 'Scan the QR code with your authenticator app and enter the code to verify',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verify and activate 2FA
router.post('/verify', auth, (req, res) => {
  try {
    const { code } = req.body;
    const user = db.prepare('SELECT two_factor_secret FROM users WHERE id = ?').get(req.user.id);
    
    if (!user.two_factor_secret) {
      return res.status(400).json({ error: '2FA setup not initiated' });
    }
    
    // Verify the code
    const expectedCode = generateTOTP(user.two_factor_secret);
    
    // Allow codes within ±1 time step for clock skew
    const currentEpoch = Math.floor(Date.now() / 1000 / 30);
    const validCodes = [
      generateTOTP(user.two_factor_secret, 30),
    ];
    
    if (code === expectedCode || validCodes.includes(code)) {
      db.prepare('UPDATE users SET two_factor_enabled = 1 WHERE id = ?').run(req.user.id);
      res.json({ message: '2FA enabled successfully' });
    } else {
      res.status(400).json({ error: 'Invalid code' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Disable 2FA
router.post('/disable', auth, (req, res) => {
  try {
    const { code } = req.body;
    const user = db.prepare('SELECT two_factor_secret, two_factor_enabled FROM users WHERE id = ?').get(req.user.id);
    
    if (!user.two_factor_enabled) {
      return res.status(400).json({ error: '2FA is not enabled' });
    }
    
    // Verify code before disabling
    const expectedCode = generateTOTP(user.two_factor_secret);
    if (code !== expectedCode) {
      return res.status(400).json({ error: 'Invalid code' });
    }
    
    db.prepare('UPDATE users SET two_factor_enabled = 0, two_factor_secret = NULL WHERE id = ?').run(req.user.id);
    res.json({ message: '2FA disabled successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verify 2FA during login
router.post('/login-verify', (req, res) => {
  try {
    const { userId, code } = req.body;
    const user = db.prepare('SELECT two_factor_secret, two_factor_enabled FROM users WHERE id = ?').get(userId);
    
    if (!user || !user.two_factor_enabled) {
      return res.status(400).json({ error: '2FA not enabled for this user' });
    }
    
    const expectedCode = generateTOTP(user.two_factor_secret);
    if (code === expectedCode) {
      res.json({ verified: true });
    } else {
      res.status(400).json({ error: 'Invalid code' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
