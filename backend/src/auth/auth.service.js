const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const https = require('https');
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
    <div style="font-family: Arial, sans-serif; max-width: 500px; padding: 24px; border: 1px solid rgba(0, 255, 136, 0.25); border-radius: 16px; background-color: #0a0e27; color: #ffffff; margin: 0 auto; box-shadow: 0 4px 20px rgba(0,0,0,0.35);">
      <h2 style="color: #00ff88; margin-top: 0; font-size: 22px; font-weight: 800; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 12px; text-align: center;">NonStock Verification</h2>
      <p style="font-size: 15px; color: #e1e3e6; line-height: 1.5; text-align: center; margin-top: 16px;">
        Please verify your email address to complete your registration. Your one-time verification password (OTP) is:
      </p>
      <div style="background: rgba(0, 255, 136, 0.08); border: 1px dashed #00ff88; border-radius: 12px; padding: 16px; font-size: 26px; font-weight: 800; letter-spacing: 6px; text-align: center; color: #00ff88; margin: 24px 0; font-family: monospace;">
        ${otp}
      </div>
      <p style="font-size: 13px; color: #9b9eac; text-align: center; margin-bottom: 0; line-height: 1.4;">
        This code is valid for <strong>10 minutes</strong>. <br />
        If you did not initiate this request, you can safely ignore this email.
      </p>
    </div>
  `;

  // 1. Try sending via Brevo's HTTP API (bypasses Render free tier port 587 outgoing firewall!)
  if (process.env.EMAIL_PASS && process.env.EMAIL_PASS.startsWith('xsmtpsib-')) {
    try {
      console.log('Attempting to send verification email via Brevo HTTP API...');
      const apiResult = await new Promise((resolve, reject) => {
        const postData = JSON.stringify({
          sender: {
            name: process.env.FROM_NAME || 'NonStock',
            email: process.env.FROM_EMAIL
          },
          to: [{ email }],
          subject: 'Verify your email - NonStock',
          htmlContent: html
        });

        const options = {
          hostname: 'api.brevo.com',
          port: 443,
          path: '/v3/smtp/email',
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'api-key': process.env.EMAIL_PASS,
            'content-type': 'application/json',
            'content-length': Buffer.byteLength(postData)
          }
        };

        const req = https.request(options, (res) => {
          let body = '';
          res.on('data', (chunk) => { body += chunk; });
          res.on('end', () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              try {
                resolve({ success: true, body: JSON.parse(body) });
              } catch (e) {
                resolve({ success: true, body: { messageId: 'unknown' } });
              }
            } else {
              resolve({ success: false, error: body });
            }
          });
        });

        req.on('error', (err) => { reject(err); });
        req.write(postData);
        req.end();
      });

      if (apiResult.success) {
        console.log('✅ Email successfully delivered via Brevo HTTP API! Message ID:', apiResult.body.messageId);
        return;
      } else {
        console.warn('⚠️ Brevo HTTP API rejected request, trying standard SMTP backup. Error:', apiResult.error);
      }
    } catch (apiError) {
      console.warn('⚠️ Brevo HTTP API request failed, trying standard SMTP backup. Error:', apiError.message);
    }
  }

  // 2. Fallback to standard SMTP (works locally)
  console.log('Sending verification email via traditional SMTP...');
  await transporter.sendMail({
    from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
    to: email,
    subject: 'Verify your email - NonStock',
    html,
  });
}

async function sendResetEmail(email, resetUrl) {
  const html = `
    <div style="font-family: Arial, sans-serif;">
      <h2>Reset your NonStock password</h2>
      <p>Click <a href="${resetUrl}">here</a> to reset your password. This link is valid for 1 hour.</p>
    </div>
  `;
  await transporter.sendMail({
    from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
    to: email,
    subject: 'Reset your password - NonStock',
    html,
  });
}

async function sendPasswordChangeNotificationEmail(email, userName) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; padding: 24px; border: 1px solid rgba(255, 51, 102, 0.25); border-radius: 16px; background-color: #0a0e27; color: #ffffff; margin: 0 auto; box-shadow: 0 4px 20px rgba(0,0,0,0.35);">
      <h2 style="color: #ff3366; margin-top: 0; font-size: 22px; font-weight: 800; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 12px; text-align: center;">Security Alert: Password Changed</h2>
      <p style="font-size: 15px; color: #e1e3e6; line-height: 1.5;">
        Hello ${userName || 'Investor'},
      </p>
      <p style="font-size: 15px; color: #e1e3e6; line-height: 1.5;">
        This email confirms that the password for your <strong>NonStock</strong> account has been successfully updated.
      </p>
      <div style="background: rgba(255, 51, 102, 0.08); border-left: 4px solid #ff3366; border-radius: 4px; padding: 12px; margin: 20px 0; color: #e1e3e6; font-size: 14px;">
        <strong>Details:</strong><br />
        • Date/Time: ${new Date().toUTCString()}<br />
        • Action: Password Update
      </div>
      <p style="font-size: 14px; color: #e1e3e6; line-height: 1.5;">
        If you performed this action, no further steps are required.
      </p>
      <p style="font-size: 14px; color: #ff3366; line-height: 1.5; font-weight: 700;">
        If you did NOT perform this action, please reset your password immediately or contact our support team to secure your account.
      </p>
      <p style="font-size: 13px; color: #9b9eac; text-align: center; margin-top: 24px; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 12px; margin-bottom: 0;">
        This is an automated security notification. Please do not reply directly to this email.
      </p>
    </div>
  `;

  if (process.env.EMAIL_PASS && process.env.EMAIL_PASS.startsWith('xsmtpsib-')) {
    try {
      console.log('Attempting to send password change notification via Brevo HTTP API...');
      const postData = JSON.stringify({
        sender: {
          name: process.env.FROM_NAME || 'NonStock',
          email: process.env.FROM_EMAIL
        },
        to: [{ email }],
        subject: 'Security Alert: Password Changed - NonStock',
        htmlContent: html
      });

      const apiResult = await new Promise((resolve, reject) => {
        const options = {
          hostname: 'api.brevo.com',
          port: 443,
          path: '/v3/smtp/email',
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'api-key': process.env.EMAIL_PASS,
            'content-type': 'application/json',
            'content-length': Buffer.byteLength(postData)
          }
        };

        const req = https.request(options, (res) => {
          let body = '';
          res.on('data', (chunk) => { body += chunk; });
          res.on('end', () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              try {
                resolve({ success: true, body: JSON.parse(body) });
              } catch (e) {
                resolve({ success: true, body: { messageId: 'unknown' } });
              }
            } else {
              resolve({ success: false, error: body });
            }
          });
        });

        req.on('error', (err) => { reject(err); });
        req.write(postData);
        req.end();
      });

      if (apiResult.success) {
        console.log('✅ Password change email delivered via Brevo HTTP API!');
        return;
      } else {
        console.warn('⚠️ Brevo HTTP API rejected request, trying standard SMTP backup. Error:', apiResult.error);
      }
    } catch (apiError) {
      console.warn('⚠️ Brevo HTTP API request failed, trying standard SMTP backup. Error:', apiError.message);
    }
  }

  console.log('Sending password change email via traditional SMTP...');
  await transporter.sendMail({
    from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
    to: email,
    subject: 'Security Alert: Password Changed - NonStock',
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
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const userId = generateUUID();
    const userName = name || email.split('@')[0];
    const isAdmin = email.toLowerCase().startsWith('admin@');
    const isPro = email.toLowerCase() === 'krishshah8201@gmail.com';
    const proPlan = isPro ? 'lifetime' : null;

    // Set is_email_verified = false to require email verification
    await query(
      `INSERT INTO users (id, email, password, name, is_email_verified, is_admin, is_pro, pro_plan) VALUES ($1, $2, $3, $4, false, $5, $6, $7)`,
      [userId, email, hashed, userName, isAdmin, isPro, proPlan]
    );

    // Generate OTP and update user
    const otp = generateOTP();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await query(
      `UPDATE users SET email_verify_token = $1, email_verify_expiry = $2 WHERE id = $3`,
      [otp, expiry, userId]
    );

    // Send verification email asynchronously
    sendVerificationEmail(email, otp).catch(mailError => {
      console.error('❌ SMTP Background Verification Mail Delivery Failed:', mailError.message);
    });

    // Log OTP in console as backup
    console.log(`🔑 [VERIFICATION SECURITY BACKUP] OTP for ${email} is: ${otp}`);

    res.json({
      message: 'Registration successful, please verify your email',
      requiresVerification: true,
      email
    });
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
    res.json({ message: 'Email verified', token, user: { id: user.rows[0].id, email, name: user.rows[0].name, is_admin: user.rows[0].is_admin } });
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

    const userRes = await query(`SELECT * FROM users WHERE email = $1`, [email]);
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
    res.json({ message: 'Login successful', token: jwtToken, user: { id: user.id, email, name: user.name, is_admin: user.is_admin } });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
}

// VERIFY 2FA DURING LOGIN
async function verifyTwoFactorLogin(req, res) {
  try {
    const { tempToken, token } = req.body;
    if (!tempToken || !token) {
      return res.status(400).json({ error: 'Missing code or temporary token' });
    }

    let decoded;
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(400).json({ error: 'Session expired. Please log in again.' });
    }

    if (!decoded.isPending2FA) {
      return res.status(400).json({ error: 'Invalid verification token' });
    }

    const userRes = await query(`SELECT * FROM users WHERE id = $1`, [decoded.id]);
    if (userRes.rows.length === 0) {
      return res.status(400).json({ error: 'User not found' });
    }

    const user = userRes.rows[0];
    const verified = speakeasy.totp.verify({
      secret: user.two_factor_secret,
      encoding: 'base32',
      token,
      window: 1,
    });

    if (!verified) {
      return res.status(400).json({ error: 'Invalid 2FA code' });
    }

    // Code is valid! Complete the login session creation.
    const ip = req.ip;
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const sessionId = generateUUID();
    await query(
      `INSERT INTO sessions (id, user_id, token, ip_address, user_agent, expires_at) VALUES ($1,$2,$3,$4,$5, NOW() + INTERVAL '7 days')`,
      [sessionId, user.id, sessionToken, ip, req.headers['user-agent']]
    );

    const jwtToken = jwt.sign({ id: user.id, email: user.email, sessionId }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ message: 'Login successful', token: jwtToken, user: { id: user.id, email: user.email, name: user.name, is_admin: user.is_admin } });
  } catch (error) {
    console.error('❌ 2FA login verification failed:', error);
    res.status(500).json({ error: '2FA login verification failed' });
  }
}


// FORGOT PASSWORD
async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    const user = await query(`SELECT * FROM users WHERE email = $1`, [email]);
    if (user.rows.length === 0) {
      return res.json({ message: 'If your email is registered, you will receive a reset link.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 60 * 60 * 1000);
    await query(`UPDATE users SET email_verify_token = $1, email_verify_expiry = $2 WHERE email = $3`, [resetToken, expiry, email]);

    let origin = req.headers.origin || process.env.FRONTEND_URL || 'http://localhost:5173';
    if (!origin.startsWith('http')) {
      origin = `https://${origin}`;
    }
    const resetUrl = `${origin}/reset-password?token=${resetToken}&email=${email}`;
    
    // Send reset email asynchronously in the background so the client doesn't hang!
    sendResetEmail(email, resetUrl).catch(mailError => {
      console.error('❌ SMTP Background Reset Mail Delivery Failed:', mailError.message);
    });

    // Always log the reset link to the console immediately as a secure backup in Render logs!
    console.log(`🔑 [RESET PASSWORD SECURITY BACKUP] Reset URL for ${email} is: ${resetUrl}`);

    res.json({ message: 'Reset link sent to your email' });
  } catch (error) {
    console.error('❌ Forgot password system error:', error);
    res.status(500).json({ error: 'Failed to request password reset due to a system error.' });
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
    const secret = speakeasy.generateSecret({ name: `NonStock (${req.user.email})` });
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

// CHANGE PASSWORD (AUTHENTICATED)
async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Please fill in all fields' });
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({ error: 'Password must be 8+ chars with uppercase, lowercase, number & special character' });
    }

    const userRes = await query(`SELECT password, email, name FROM users WHERE id = $1`, [req.user.id]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userRes.rows[0];
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      return res.status(400).json({ error: 'Incorrect current password' });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await query(`UPDATE users SET password = $1 WHERE id = $2`, [hashed, req.user.id]);

    // Send email notification asynchronously so we don't block the API response
    sendPasswordChangeNotificationEmail(user.email, user.name).catch((mailErr) => {
      console.error('❌ Failed to send password change email:', mailErr.message);
    });

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('❌ Change password error:', error);
    res.status(500).json({ error: 'Password update failed' });
  }
}

module.exports = {
  register,
  verifyEmail,
  login,
  verifyTwoFactorLogin,
  forgotPassword,
  resetPassword,
  getSessions,
  logoutSession,
  setupTwoFactor,
  verifyAndEnableTwoFactor,
  disableTwoFactor,
  changePassword,
};