const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { query } = require('../db/index');

// Helper to generate UUID (for user IDs and session IDs)
function generateUUID() {
  return crypto.randomUUID();
}

// Generate 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ============================================
// EMAIL TRANSPORTER (same as before)
// ============================================
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Verify SMTP connection
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ SMTP Connection Error:', error.message);
  } else {
    console.log('✅ SMTP Server ready to send emails');
  }
});

// ============================================
// SEND VERIFICATION EMAIL
// ============================================
async function sendVerificationEmail(email, otp) {
  try {
    const mailOptions = {
      from: `"PricePulse" <${process.env.FROM_EMAIL || process.env.EMAIL_USER}>`,
      to: email,
      subject: "🔐 Verify Your Email - PricePulse",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #1a1f3a; border-radius: 12px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #00bcd4, #2962ff); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">PricePulse</h1>
            <p style="color: rgba(255,255,255,0.8);">Verification Code</p>
          </div>
          <div style="padding: 30px; text-align: center;">
            <p style="color: #d1d4dc;">Your verification code is:</p>
            <div style="font-size: 36px; letter-spacing: 8px; background: #0a0e27; padding: 20px; border-radius: 8px;">
              <strong style="color: #00ff88;">${otp}</strong>
            </div>
            <p style="color: #787b86; font-size: 12px; margin-top: 20px;">This code expires in 10 minutes.</p>
          </div>
        </div>
      `
    };
    await transporter.sendMail(mailOptions);
    console.log(`✅ OTP sent to ${email}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send email to ${email}:`, error.message);
    return false;
  }
}

// ============================================
// SEND PASSWORD RESET EMAIL
// ============================================
async function sendResetEmail(email, resetUrl) {
  try {
    const mailOptions = {
      from: `"PricePulse" <${process.env.FROM_EMAIL || process.env.EMAIL_USER}>`,
      to: email,
      subject: "🔐 Reset Your Password - PricePulse",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #1a1f3a; border-radius: 12px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #00bcd4, #2962ff); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">PricePulse</h1>
            <p style="color: rgba(255,255,255,0.8);">Password Reset</p>
          </div>
          <div style="padding: 30px; text-align: center;">
            <p style="color: #d1d4dc;">Click the button below to reset your password:</p>
            <a href="${resetUrl}" style="display: inline-block; background: #00ff88; color: #0a0e27; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 20px 0;">Reset Password</a>
            <p style="color: #787b86; font-size: 12px;">This link expires in 1 hour.</p>
          </div>
        </div>
      `
    };
    await transporter.sendMail(mailOptions);
    console.log(`✅ Reset link sent to ${email}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send reset email:`, error.message);
    return false;
  }
}

// ============================================
// REGISTER
// ============================================
async function register(req, res) {
  try {
    const { email, password, name } = req.body;
    
    // Password validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ 
        error: "Password must be 8+ characters with uppercase, lowercase, number & special character (!@#$%^&*)" 
      });
    }
    
    // Check if user exists
    const existingUser = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0 && existingUser.rows[0].is_email_verified) {
      return res.status(400).json({ error: "Email already registered" });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOTP();
    const userId = generateUUID();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    
    if (existingUser.rows.length > 0) {
      // Update existing unverified user
      await query(
        `UPDATE users SET password = $1, name = $2, email_verify_token = $3, 
         email_verify_expiry = $4, is_email_verified = false, updated_at = NOW() 
         WHERE email = $5`,
        [hashedPassword, name || email.split('@')[0], otp, otpExpiry, email]
      );
    } else {
      // Create new user
      await query(
        `INSERT INTO users (id, email, password, name, email_verify_token, email_verify_expiry) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [userId, email, hashedPassword, name || email.split('@')[0], otp, otpExpiry]
      );
    }
    
    // Send OTP email
    await sendVerificationEmail(email, otp);
    res.json({ message: "Verification code sent to your email" });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: "Registration failed. Please try again." });
  }
}

// ============================================
// VERIFY EMAIL OTP
// ============================================
async function verifyEmail(req, res) {
  try {
    const { email, otp } = req.body;
    
    const result = await query(
      `SELECT * FROM users WHERE email = $1 AND email_verify_token = $2 
       AND email_verify_expiry > NOW()`,
      [email, otp]
    );
    
    if (result.rows.length === 0) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }
    
    const user = result.rows[0];
    
    await query(
      `UPDATE users SET is_email_verified = true, email_verify_token = NULL, 
       email_verify_expiry = NULL, updated_at = NOW() WHERE id = $1`,
      [user.id]
    );
    
    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email }, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' }
    );
    
    res.json({ 
      message: "Email verified successfully", 
      token,
      user: { id: user.id, email: user.email, name: user.name }
    });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ error: "Verification failed" });
  }
}

// ============================================
// LOGIN
// ============================================
async function login(req, res) {
  try {
    const { email, password } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    
    // Rate limiting - check recent failed attempts
    const recentAttempts = await query(
      `SELECT COUNT(*) FROM login_attempts WHERE email = $1 
       AND created_at > NOW() - INTERVAL '15 minutes' AND success = false`,
      [email]
    );
    
    if (parseInt(recentAttempts.rows[0].count) >= 5) {
      return res.status(429).json({ error: "Too many failed attempts. Try again in 15 minutes." });
    }
    
    // Find user
    const userResult = await query(
      `SELECT * FROM users WHERE email = $1 AND is_email_verified = true`,
      [email]
    );
    
    if (userResult.rows.length === 0) {
      await query(
        `INSERT INTO login_attempts (id, email, ip_address, success) VALUES ($1, $2, $3, $4)`,
        [generateUUID(), email, ipAddress, false]
      );
      return res.status(401).json({ error: "Invalid email or password" });
    }
    
    const user = userResult.rows[0];
    
    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      await query(
        `INSERT INTO login_attempts (id, email, ip_address, success) VALUES ($1, $2, $3, $4)`,
        [generateUUID(), email, ipAddress, false]
      );
      return res.status(401).json({ error: "Invalid email or password" });
    }
    
    // Log successful attempt
    await query(
      `INSERT INTO login_attempts (id, email, ip_address, success) VALUES ($1, $2, $3, $4)`,
      [generateUUID(), email, ipAddress, true]
    );
    
    // Create session
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const sessionId = generateUUID();
    
    await query(
      `INSERT INTO sessions (id, user_id, token, ip_address, user_agent, expires_at) 
       VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '7 days')`,
      [sessionId, user.id, sessionToken, ipAddress, req.headers['user-agent']]
    );
    
    // Generate JWT
    const jwtToken = jwt.sign(
      { id: user.id, email: user.email, sessionId: sessionId }, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' }
    );
    
    res.json({
      message: "Login successful",
      token: jwtToken,
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name, 
        theme: user.theme,
        language: user.language,
        twoFactorEnabled: user.two_factor_enabled 
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: "Login failed. Please try again." });
  }
}

// ============================================
// FORGOT PASSWORD
// ============================================
async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    
    const user = await query('SELECT * FROM users WHERE email = $1 AND is_email_verified = true', [email]);
    
    if (user.rows.length === 0) {
      // Don't reveal that email doesn't exist for security
      return res.json({ message: "If your email is registered, you will receive a reset link." });
    }
    
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpiry = new Date(Date.now() + 1 * 60 * 60 * 1000);
    
    await query(
      `UPDATE users SET email_verify_token = $1, email_verify_expiry = $2 WHERE email = $3`,
      [resetToken, resetExpiry, email]
    );
    
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}&email=${email}`;
    await sendResetEmail(email, resetUrl);
    
    res.json({ message: "Password reset link sent to your email" });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: "Failed to send reset email" });
  }
}

// ============================================
// RESET PASSWORD
// ============================================
async function resetPassword(req, res) {
  try {
    const { email, token, newPassword } = req.body;
    
    // Password validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({ 
        error: "Password must be 8+ characters with uppercase, lowercase, number & special character" 
      });
    }
    
    const user = await query(
      `SELECT * FROM users WHERE email = $1 AND email_verify_token = $2 
       AND email_verify_expiry > NOW()`,
      [email, token]
    );
    
    if (user.rows.length === 0) {
      return res.status(400).json({ error: "Invalid or expired reset link" });
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await query(
      `UPDATE users SET password = $1, email_verify_token = NULL, 
       email_verify_expiry = NULL, updated_at = NOW() WHERE email = $2`,
      [hashedPassword, email]
    );
    
    // Invalidate all sessions
    await query(
      `UPDATE sessions SET is_valid = false WHERE user_id = $1`,
      [user.rows[0].id]
    );
    
    res.json({ message: "Password reset successful. Please login with your new password." });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: "Password reset failed" });
  }
}

// ============================================
// GET SESSIONS
// ============================================
async function getSessions(req, res) {
  try {
    const result = await query(
      `SELECT id, ip_address, user_agent, last_active, created_at, expires_at 
       FROM sessions WHERE user_id = $1 AND is_valid = true ORDER BY last_active DESC`,
      [req.user.id]
    );
    
    res.json({ sessions: result.rows });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ error: "Failed to fetch sessions" });
  }
}

// ============================================
// LOGOUT SESSION
// ============================================
async function logoutSession(req, res) {
  try {
    const { sessionId } = req.params;
    
    await query(`UPDATE sessions SET is_valid = false WHERE id = $1 AND user_id = $2`, 
      [sessionId, req.user.id]);
    
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: "Failed to logout" });
  }
}

// ============================================
// 2FA SETUP
// ============================================
async function setupTwoFactor(req, res) {
  try {
    const userId = req.user.id;
    
    const secret = speakeasy.generateSecret({
      name: `${process.env.TWO_FACTOR_APP_NAME || 'PricePulse'} (${req.user.email})`
    });
    
    await query(
      `UPDATE users SET two_factor_secret = $1 WHERE id = $2`,
      [secret.base32, userId]
    );
    
    res.json({
      secret: secret.base32,
      otpauthUrl: secret.otpauth_url,
      qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(secret.otpauth_url)}`
    });
  } catch (error) {
    console.error('2FA setup error:', error);
    res.status(500).json({ error: "Failed to setup 2FA" });
  }
}

// ============================================
// VERIFY 2FA AND ENABLE
// ============================================
async function verifyAndEnableTwoFactor(req, res) {
  try {
    const userId = req.user.id;
    const { token } = req.body;
    
    const user = await query(`SELECT two_factor_secret FROM users WHERE id = $1`, [userId]);
    
    if (user.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    
    const verified = speakeasy.totp.verify({
      secret: user.rows[0].two_factor_secret,
      encoding: 'base32',
      token: token,
      window: 1
    });
    
    if (!verified) {
      return res.status(400).json({ error: "Invalid 2FA code" });
    }
    
    await query(
      `UPDATE users SET two_factor_enabled = true WHERE id = $1`,
      [userId]
    );
    
    res.json({ message: "2FA enabled successfully" });
  } catch (error) {
    console.error('2FA verify error:', error);
    res.status(500).json({ error: "Failed to verify 2FA" });
  }
}

// ============================================
// DISABLE 2FA
// ============================================
async function disableTwoFactor(req, res) {
  try {
    const userId = req.user.id;
    const { token } = req.body;
    
    const user = await query(`SELECT two_factor_secret FROM users WHERE id = $1`, [userId]);
    
    if (user.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    
    const verified = speakeasy.totp.verify({
      secret: user.rows[0].two_factor_secret,
      encoding: 'base32',
      token: token,
      window: 1
    });
    
    if (!verified) {
      return res.status(400).json({ error: "Invalid 2FA code" });
    }
    
    await query(
      `UPDATE users SET two_factor_enabled = false, two_factor_secret = NULL WHERE id = $1`,
      [userId]
    );
    
    res.json({ message: "2FA disabled successfully" });
  } catch (error) {
    console.error('2FA disable error:', error);
    res.status(500).json({ error: "Failed to disable 2FA" });
  }
}

// ============================================
// EXPORTS (all functions required by index.js)
// ============================================
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
  disableTwoFactor
};