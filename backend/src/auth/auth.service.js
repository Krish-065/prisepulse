const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { query } = require('../db/index');

function generateUUID() {
  return crypto.randomUUID();
}

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: { rejectUnauthorized: false },
});

transporter.verify((error, success) => {
  if (error) console.error('❌ SMTP Error:', error.message);
  else console.log('✅ SMTP Ready');
});

async function sendVerificationEmail(email, otp) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
      <h2>PricePulse Email Verification</h2>
      <p>Your OTP is: <strong>${otp}</strong></p>
      <p>This code expires in 10 minutes.</p>
    </div>
  `;
  await transporter.sendMail({
    from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
    to: email,
    subject: 'Verify your email - PricePulse',
    html,
  });
}

async function sendResetEmail(email, resetUrl) {
  const html = `
    <div style="font-family: Arial, sans-serif;">
      <h2>Reset your PricePulse password</h2>
      <p>Click <a href="${resetUrl}">here</a> to reset your password. This link is valid for 1 hour.</p>
    </div>
  `;
  await transporter.sendMail({
    from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
    to: email,
    subject: 'Reset your password - PricePulse',
    html,
  });
}

// REGISTER
async function register(req, res) {
  try {
    const { email, password, name } = req.body;
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ error: 'Password must be 8+ chars with uppercase, lowercase, number & special character' });
    }

    const existing = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0 && existing.rows[0].is_email_verified) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const otp = generateOTP();
    const userId = generateUUID();
    const expiry = new Date(Date.now() + 10 * 60 * 1000);

    if (existing.rows.length > 0) {
      await query(
        `UPDATE users SET password = $1, name = $2, email_verify_token = $3, email_verify_expiry = $4, is_email_verified = false WHERE email = $5`,
        [hashed, name || email.split('@')[0], otp, expiry, email]
      );
    } else {
      await query(
        `INSERT INTO users (id, email, password, name, email_verify_token, email_verify_expiry) VALUES ($1,$2,$3,$4,$5,$6)`,
        [userId, email, hashed, name || email.split('@')[0], otp, expiry]
      );
    }

    try {
      await sendVerificationEmail(email, otp);
      res.json({ message: 'Verification code sent to email' });
    } catch (mailError) {
      console.error('❌ SMTP Mail Delivery Failed:', mailError);
      console.log(`🔑 [DEBUG FALLBACK] Verification OTP for ${email} is: ${otp}`);
      
      return res.status(500).json({ 
        error: 'Failed to send verification email. Please ensure your SMTP environment variables (SMTP_HOST, SMTP_PORT, EMAIL_USER, EMAIL_PASS) are configured correctly in your Render dashboard.',
        details: mailError.message,
        otpFallback: process.env.NODE_ENV !== 'production' ? otp : undefined
      });
    }
  } catch (error) {
    console.error('❌ Registration system error:', error);
    res.status(500).json({ error: 'Registration failed due to a system error.' });
  }
}

// VERIFY EMAIL
async function verifyEmail(req, res) {
  try {
    const { email, otp } = req.body;
    const user = await query(
      `SELECT * FROM users WHERE email = $1 AND email_verify_token = $2 AND email_verify_expiry > NOW()`,
      [email, otp]
    );
    if (user.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    await query(`UPDATE users SET is_email_verified = true, email_verify_token = NULL, email_verify_expiry = NULL WHERE id = $1`, [user.rows[0].id]);

    const token = jwt.sign({ id: user.rows[0].id, email }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ message: 'Email verified', token, user: { id: user.rows[0].id, email, name: user.rows[0].name } });
  } catch (error) {
    res.status(500).json({ error: 'Verification failed' });
  }
}

// LOGIN
async function login(req, res) {
  try {
    const { email, password } = req.body;
    const ip = req.ip;

    const recent = await query(
      `SELECT COUNT(*) FROM login_attempts WHERE email = $1 AND created_at > NOW() - INTERVAL '15 minutes' AND success = false`,
      [email]
    );
    if (parseInt(recent.rows[0].count) >= 5) {
      return res.status(429).json({ error: 'Too many attempts. Try again later.' });
    }

    const userRes = await query(`SELECT * FROM users WHERE email = $1 AND is_email_verified = true`, [email]);
    if (userRes.rows.length === 0) {
      await query(`INSERT INTO login_attempts (id, email, ip_address, success) VALUES ($1,$2,$3,$4)`, [generateUUID(), email, ip, false]);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = userRes.rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      await query(`INSERT INTO login_attempts (id, email, ip_address, success) VALUES ($1,$2,$3,$4)`, [generateUUID(), email, ip, false]);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    await query(`INSERT INTO login_attempts (id, email, ip_address, success) VALUES ($1,$2,$3,$4)`, [generateUUID(), email, ip, true]);

    const sessionToken = crypto.randomBytes(32).toString('hex');
    const sessionId = generateUUID();
    await query(
      `INSERT INTO sessions (id, user_id, token, ip_address, user_agent, expires_at) VALUES ($1,$2,$3,$4,$5, NOW() + INTERVAL '7 days')`,
      [sessionId, user.id, sessionToken, ip, req.headers['user-agent']]
    );

    const jwtToken = jwt.sign({ id: user.id, email, sessionId }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ message: 'Login successful', token: jwtToken, user: { id: user.id, email, name: user.name } });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
}

// FORGOT PASSWORD
async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    const user = await query(`SELECT * FROM users WHERE email = $1 AND is_email_verified = true`, [email]);
    if (user.rows.length === 0) {
      return res.json({ message: 'If your email is registered, you will receive a reset link.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 60 * 60 * 1000);
    await query(`UPDATE users SET email_verify_token = $1, email_verify_expiry = $2 WHERE email = $3`, [resetToken, expiry, email]);

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}&email=${email}`;
    await sendResetEmail(email, resetUrl);
    res.json({ message: 'Reset link sent to your email' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send reset email' });
  }
}

// RESET PASSWORD
async function resetPassword(req, res) {
  try {
    const { email, token, newPassword } = req.body;
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({ error: 'Password must be 8+ chars with uppercase, lowercase, number & special character' });
    }

    const user = await query(
      `SELECT * FROM users WHERE email = $1 AND email_verify_token = $2 AND email_verify_expiry > NOW()`,
      [email, token]
    );
    if (user.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired reset link' });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await query(`UPDATE users SET password = $1, email_verify_token = NULL, email_verify_expiry = NULL WHERE email = $2`, [hashed, email]);
    await query(`UPDATE sessions SET is_valid = false WHERE user_id = $1`, [user.rows[0].id]);

    res.json({ message: 'Password reset successful. Please login.' });
  } catch (error) {
    res.status(500).json({ error: 'Password reset failed' });
  }
}

// GET SESSIONS
async function getSessions(req, res) {
  try {
    const result = await query(
      `SELECT id, ip_address, user_agent, last_active, created_at, expires_at FROM sessions WHERE user_id = $1 AND is_valid = true ORDER BY last_active DESC`,
      [req.user.id]
    );
    res.json({ sessions: result.rows });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
}

// LOGOUT SESSION
async function logoutSession(req, res) {
  try {
    await query(`UPDATE sessions SET is_valid = false WHERE id = $1 AND user_id = $2`, [req.params.sessionId, req.user.id]);
    res.json({ message: 'Logged out' });
  } catch (error) {
    res.status(500).json({ error: 'Logout failed' });
  }
}

// 2FA SETUP
async function setupTwoFactor(req, res) {
  try {
    const secret = speakeasy.generateSecret({ name: `PricePulse (${req.user.email})` });
    await query(`UPDATE users SET two_factor_secret = $1 WHERE id = $2`, [secret.base32, req.user.id]);
    res.json({
      secret: secret.base32,
      otpauthUrl: secret.otpauth_url,
      qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(secret.otpauth_url)}`,
    });
  } catch (error) {
    res.status(500).json({ error: '2FA setup failed' });
  }
}

// VERIFY AND ENABLE 2FA
async function verifyAndEnableTwoFactor(req, res) {
  try {
    const { token } = req.body;
    const user = await query(`SELECT two_factor_secret FROM users WHERE id = $1`, [req.user.id]);
    const verified = speakeasy.totp.verify({
      secret: user.rows[0].two_factor_secret,
      encoding: 'base32',
      token,
      window: 1,
    });
    if (!verified) return res.status(400).json({ error: 'Invalid 2FA code' });
    await query(`UPDATE users SET two_factor_enabled = true WHERE id = $1`, [req.user.id]);
    res.json({ message: '2FA enabled successfully' });
  } catch (error) {
    res.status(500).json({ error: '2FA verification failed' });
  }
}

// DISABLE 2FA
async function disableTwoFactor(req, res) {
  try {
    const { token } = req.body;
    const user = await query(`SELECT two_factor_secret FROM users WHERE id = $1`, [req.user.id]);
    const verified = speakeasy.totp.verify({
      secret: user.rows[0].two_factor_secret,
      encoding: 'base32',
      token,
      window: 1,
    });
    if (!verified) return res.status(400).json({ error: 'Invalid 2FA code' });
    await query(`UPDATE users SET two_factor_enabled = false, two_factor_secret = NULL WHERE id = $1`, [req.user.id]);
    res.json({ message: '2FA disabled' });
  } catch (error) {
    res.status(500).json({ error: 'Disable 2FA failed' });
  }
}

module.exports = {
  register,
  verifyEmail,
  login,
  forgotPassword,
  resetPassword,
  getSessions,
  logoutSession,
  setupTwoFactor,
  verifyAndEnableTwoFactor,
  disableTwoFactor,
};