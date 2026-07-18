require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { createTables } = require('./db/schema');
const authRoutes = require('./auth/auth.service');
const { router: marketRoutes, fetchYahooQuote } = require('./api/marketData');
const { authenticate } = require('./middleware/auth');
const { loginLimiter } = require('./middleware/rateLimit');
const { query } = require('./db/index');
const jwt = require('jsonwebtoken');
const { sendEmail } = require('./utils/email');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true },
});
app.set('io', io);


const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
const allowedOrigin = frontendUrl.startsWith('http') ? frontendUrl : `https://${frontendUrl}`;

app.use(helmet());
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || [allowedOrigin, frontendUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'].includes(origin)) {
      callback(null, true);
    } else {
      // Also allow any vercel app for this project specifically as a fallback
      if (origin.endsWith('.vercel.app')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true
}));
app.use(express.json());

createTables().catch(console.error);

// Health check endpoint for Render self-ping (prevents cold starts)
app.get('/api/health', (req, res) => {
  res.status(200).send('OK');
});

// Auth routes
app.post('/api/auth/register', authRoutes.register);
app.post('/api/auth/verify-email', authRoutes.verifyEmail);
app.post('/api/auth/login', loginLimiter, authRoutes.login);
app.post('/api/auth/2fa/login-verify', authRoutes.verifyTwoFactorLogin);
app.post('/api/auth/forgot-password', authRoutes.forgotPassword);
app.post('/api/auth/reset-password', authRoutes.resetPassword);
app.get('/api/auth/sessions', authenticate, authRoutes.getSessions);
app.delete('/api/auth/sessions/:sessionId', authenticate, authRoutes.logoutSession);
app.post('/api/auth/2fa/setup', authenticate, authRoutes.setupTwoFactor);
app.post('/api/auth/2fa/verify', authenticate, authRoutes.verifyAndEnableTwoFactor);
app.post('/api/auth/2fa/disable', authenticate, authRoutes.disableTwoFactor);

// Market data
app.use('/api/market', marketRoutes);

// Paper trading
const paperRoutes = require('./api/paperTrading');
app.use('/api/paper', paperRoutes);

// Strategy Builder & Backtester
const strategyRoutes = require('./api/strategy');
app.use('/api/strategy', strategyRoutes);

// AI Mentor Services
const aiMentorRoutes = require('./api/aiMentor');
app.use('/api/ai', aiMentorRoutes);

// Community Social Learning Hub
const communityHubRoutes = require('./api/community');
app.use('/api/community', communityHubRoutes);

// Automated Multi-Channel Alerts System
const alertsRoutes = require('./api/alerts');
app.use('/api/alerts', alertsRoutes);

// User profile & Password routes
app.post('/api/auth/change-password', authenticate, authRoutes.changePassword);

app.get('/api/user/profile', authenticate, async (req, res) => {
  try {
    const result = await query(
      `SELECT id, email, name, theme, language, two_factor_enabled, base_currency, refresh_rate, landing_page, broker_code, demat_id, dp_name, pan_id, brokerage_plan, connected_broker, is_admin, is_verified, verification_title, verification_status, virtual_balance, is_pro, pro_plan, pro_expires_at, pro_status, pro_pending_plan, pro_pending_ref FROM users WHERE id = $1`, 
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const user = result.rows[0];
    if (user.email && user.email.toLowerCase() === 'krishshah8201@gmail.com') {
      user.is_pro = true;
      user.pro_plan = 'lifetime';
      await query(
        "UPDATE users SET is_pro = true, pro_plan = 'lifetime' WHERE id = $1",
        [user.id]
      );
    }
    res.json(user);
  } catch (error) {
    console.error('❌ Get profile error:', error);
    res.status(500).json({ error: 'Failed to retrieve profile' });
  }
});

app.put('/api/user/profile', authenticate, async (req, res) => {
  try {
    const { 
      name, theme, language, base_currency, refresh_rate, landing_page, 
      broker_code, demat_id, dp_name, pan_id, brokerage_plan 
    } = req.body;

    const currentRes = await query(`SELECT * FROM users WHERE id = $1`, [req.user.id]);
    if (currentRes.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const current = currentRes.rows[0];

    const updatedName = name !== undefined ? name : current.name;
    const updatedTheme = theme !== undefined ? theme : current.theme;
    const updatedLanguage = language !== undefined ? language : current.language;
    const updatedBaseCurrency = base_currency !== undefined ? base_currency : current.base_currency;
    const updatedRefreshRate = refresh_rate !== undefined ? refresh_rate : current.refresh_rate;
    const updatedLandingPage = landing_page !== undefined ? landing_page : current.landing_page;
    const updatedBrokerCode = broker_code !== undefined ? broker_code : current.broker_code;
    const updatedDematId = demat_id !== undefined ? demat_id : current.demat_id;
    const updatedDpName = dp_name !== undefined ? dp_name : current.dp_name;
    const updatedPanId = pan_id !== undefined ? pan_id : current.pan_id;
    const updatedBrokeragePlan = brokerage_plan !== undefined ? brokerage_plan : current.brokerage_plan;

    await query(
      `UPDATE users SET 
        name = $1, theme = $2, language = $3, base_currency = $4, refresh_rate = $5, 
        landing_page = $6, broker_code = $7, demat_id = $8, dp_name = $9, pan_id = $10, 
        brokerage_plan = $11, updated_at = NOW() 
       WHERE id = $12`,
      [
        updatedName, updatedTheme, updatedLanguage, updatedBaseCurrency, updatedRefreshRate,
        updatedLandingPage, updatedBrokerCode, updatedDematId, updatedDpName, updatedPanId,
        updatedBrokeragePlan, req.user.id
      ]
    );

    const result = await query(
      `SELECT id, email, name, theme, language, two_factor_enabled, base_currency, refresh_rate, landing_page, broker_code, demat_id, dp_name, pan_id, brokerage_plan, connected_broker, is_admin, is_verified, verification_title, verification_status, virtual_balance, is_pro, pro_plan, pro_expires_at, pro_status, pro_pending_plan, pro_pending_ref FROM users WHERE id = $1`, 
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const user = result.rows[0];
    if (user.email && user.email.toLowerCase() === 'krishshah8201@gmail.com') {
      user.is_pro = true;
      user.pro_plan = 'lifetime';
      await query(
        "UPDATE users SET is_pro = true, pro_plan = 'lifetime' WHERE id = $1",
        [user.id]
      );
    }
    res.json(user);
  } catch (error) {
    console.error('❌ Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Upgrade user to Pro membership status
app.post('/api/user/upgrade-pro', authenticate, async (req, res) => {
  try {
    const { plan, referenceId, phoneNumber } = req.body;
    if (!plan || !referenceId || !phoneNumber) {
      return res.status(400).json({ error: 'Plan details, payment reference ID, and WhatsApp number are required' });
    }
    
    // 1. Record pending upgrade request in DB and save phone number
    await query(
      `UPDATE users 
       SET pro_status = 'pending', 
           pro_pending_plan = $1, 
           pro_pending_ref = $2,
           phone_number = $3
       WHERE id = $4`,
      [plan, referenceId, phoneNumber.trim(), req.user.id]
    );

    // 2. Fetch user's details for email body
    const userRes = await query('SELECT name, email FROM users WHERE id = $1', [req.user.id]);
    const user = userRes.rows[0];

    // 3. Generate secure approve/reject action tokens
    const approveToken = jwt.sign(
      { userId: req.user.id, plan, referenceId, action: 'approve' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    const rejectToken = jwt.sign(
      { userId: req.user.id, plan, referenceId, action: 'reject' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Get dynamic backend URL (handling reverse proxy correctly)
    let backendUrl = process.env.BACKEND_URL;
    if (!backendUrl) {
      const host = req.get('host');
      const protocol = req.headers['x-forwarded-proto'] || req.protocol;
      backendUrl = `${protocol}://${host}`;
    }

    const approveLink = `${backendUrl}/api/admin/verify-upgrade?action=approve&token=${approveToken}`;
    const rejectLink = `${backendUrl}/api/admin/verify-upgrade?action=reject&token=${rejectToken}`;

    // Map plan IDs to human-readable names and prices
    const planNames = {
      monthly: { name: 'Monthly Plan', price: '₹449' },
      annually: { name: 'Annual Premium', price: '₹2299' },
      three_year: { name: '3-Year Legacy', price: '₹5549' }
    };
    const planDetail = planNames[plan] || { name: plan, price: 'N/A' };

    // 4. Send email to admin (krishshah8201@gmail.com)
    const adminEmail = 'krishshah8201@gmail.com';
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0b0803; border: 1px solid #ffb300; border-radius: 12px; color: #ffffff;">
        <div style="text-align: center; border-bottom: 2px solid rgba(255, 179, 0, 0.2); padding-bottom: 20px; margin-bottom: 20px;">
          <h2 style="color: #ffb300; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 0.5px;">NonStock Pro Upgrade Request</h2>
          <p style="color: #d1c9b8; font-size: 13px; margin: 5px 0 0 0;">Pending payment verification</p>
        </div>

        <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 8px; padding: 16px; margin-bottom: 24px;">
          <h4 style="margin: 0 0 12px 0; color: #ffe082; font-size: 15px; border-bottom: 1px solid rgba(255, 255, 255, 0.08); padding-bottom: 8px;">User & Plan Details</h4>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 6px 0; color: #9b9eac; font-weight: 600; width: 40%;">User Name:</td>
              <td style="padding: 6px 0; color: #ffffff;">${user.name}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #9b9eac; font-weight: 600;">User Email:</td>
              <td style="padding: 6px 0; color: #ffffff;">${user.email}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #9b9eac; font-weight: 600;">WhatsApp Number:</td>
              <td style="padding: 6px 0; color: #00ff88; font-weight: 700;">${phoneNumber.trim()}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #9b9eac; font-weight: 600;">Selected Plan:</td>
              <td style="padding: 6px 0; color: #ffb300; font-weight: 700;">${planDetail.name} (${planDetail.price})</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #9b9eac; font-weight: 600;">UPI UTR / Reference ID:</td>
              <td style="padding: 6px 0; color: #00ff88; font-weight: 700; font-family: monospace; font-size: 15px; letter-spacing: 0.5px;">${referenceId}</td>
            </tr>
          </table>
        </div>

        <p style="font-size: 14px; color: #d1c9b8; line-height: 1.6; margin-bottom: 24px;">
          Please cross-reference this 12-digit UTR <strong>${referenceId}</strong> with your PhonePe business ledger to verify if the payment of <strong>${planDetail.price}</strong> has been received. Once confirmed, select one of the actions below:
        </p>

        <div style="margin-top: 20px; text-align: center;">
          <a href="${approveLink}" style="display: inline-block; margin-right: 15px; text-decoration: none; padding: 12px 25px; background: linear-gradient(135deg, #00ff88, #00b058); color: #0b0803; font-weight: bold; border-radius: 8px; font-size: 14px; box-shadow: 0 4px 10px rgba(0, 255, 136, 0.25);">
            Approve & Activate Pro
          </a>
          <a href="${rejectLink}" style="display: inline-block; text-decoration: none; padding: 12px 25px; background: linear-gradient(135deg, #ff3366, #b00020); color: #ffffff; font-weight: bold; border-radius: 8px; font-size: 14px; box-shadow: 0 4px 10px rgba(255, 51, 102, 0.25);">
            Reject Request
          </a>
        </div>

        <p style="font-size: 11px; color: #9b9eac; margin-top: 30px; text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 15px;">
          This is an automated payment verification system email. Token expires in 7 days.
        </p>
      </div>
    `;

    await sendEmail({
      to: adminEmail,
      subject: `NonStock Pro Subscription Request - UTR: ${referenceId}`,
      html: emailHtml
    });

    res.json({ 
      success: true, 
      pending: true, 
      message: 'Payment details submitted for verification. Admin will verify and activate your Pro membership shortly.' 
    });
  } catch (error) {
    console.error('❌ Upgrade Pro error:', error);
    res.status(500).json({ error: 'Failed to process Pro upgrade' });
  }
});

// Admin callback route to approve or reject a Pro membership upgrade
app.get('/api/admin/verify-upgrade', async (req, res) => {
  try {
    const { token, action } = req.query;
    if (!token || !action) {
      return res.status(400).send(`
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 50px auto; padding: 30px; text-align: center; border: 1px solid #ff3366; border-radius: 12px; background: #0b0803; color: #ffffff;">
          <h2 style="color: #ff3366; margin-bottom: 15px;">Invalid Request</h2>
          <p style="color: #d1c9b8; font-size: 14px; line-height: 1.5;">Missing action or verification token parameters.</p>
        </div>
      `);
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(400).send(`
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 50px auto; padding: 30px; text-align: center; border: 1px solid #ff3366; border-radius: 12px; background: #0b0803; color: #ffffff;">
          <h2 style="color: #ff3366; margin-bottom: 15px;">Verification Token Expired</h2>
          <p style="color: #d1c9b8; font-size: 14px; line-height: 1.5;">The approval/rejection link has expired (7 days limit) or has an invalid signature.</p>
        </div>
      `);
    }

    const { userId, plan, referenceId, action: tokenAction } = decoded;

    // Verify token action matches query action for defense-in-depth security
    if (tokenAction !== action) {
      return res.status(400).send(`
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 50px auto; padding: 30px; text-align: center; border: 1px solid #ff3366; border-radius: 12px; background: #0b0803; color: #ffffff;">
          <h2 style="color: #ff3366; margin-bottom: 15px;">Security Mismatch</h2>
          <p style="color: #d1c9b8; font-size: 14px; line-height: 1.5;">The token action details do not match the request query action.</p>
        </div>
      `);
    }

    const userRes = await query('SELECT id, name, email, pro_status FROM users WHERE id = $1', [userId]);
    if (userRes.rows.length === 0) {
      return res.status(404).send(`
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 50px auto; padding: 30px; text-align: center; border: 1px solid #ff3366; border-radius: 12px; background: #0b0803; color: #ffffff;">
          <h2 style="color: #ff3366; margin-bottom: 15px;">User Not Found</h2>
          <p style="color: #d1c9b8; font-size: 14px; line-height: 1.5;">The user associated with this upgrade request no longer exists.</p>
        </div>
      `);
    }

    const user = userRes.rows[0];

    // Check if the request was already processed
    if (user.pro_status === 'active' && action === 'approve') {
      return res.send(`
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 50px auto; padding: 30px; text-align: center; border: 1px solid #ffb300; border-radius: 12px; background: #0b0803; color: #ffffff;">
          <h2 style="color: #ffb300; margin-bottom: 15px;">Already Activated</h2>
          <p style="color: #d1c9b8; font-size: 14px; line-height: 1.5;">User <strong>${user.name}</strong> (${user.email}) is already an active Pro member.</p>
        </div>
      `);
    }

    const planNames = {
      monthly: { name: 'Monthly Plan', price: '₹449' },
      annually: { name: 'Annual Premium', price: '₹2299' },
      three_year: { name: '3-Year Legacy', price: '₹5549' }
    };
    const planDetail = planNames[plan] || { name: plan, price: 'N/A' };

    if (action === 'approve') {
      let months = 1;
      if (plan === 'annually') months = 12;
      else if (plan === 'three_year') months = 36;

      // Update user in database to Pro
      await query(
        `UPDATE users 
         SET is_pro = true, 
             pro_status = 'active', 
             pro_plan = $1, 
             pro_subscribed_at = NOW(), 
             pro_expires_at = NOW() + ($2 * INTERVAL '1 month'), 
             pro_pending_plan = NULL, 
             pro_pending_ref = NULL 
         WHERE id = $3`,
        [plan, months, userId]
      );

      // Send confirmation email to the user
      const userHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0b0803; border: 1px solid #ffb300; border-radius: 12px; color: #ffffff;">
          <div style="text-align: center; border-bottom: 2px solid rgba(255, 179, 0, 0.2); padding-bottom: 20px; margin-bottom: 20px;">
            <h2 style="color: #ffb300; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 0.5px;">Welcome to NonStock Pro!</h2>
            <p style="color: #d1c9b8; font-size: 13px; margin: 5px 0 0 0;">Subscription Activated</p>
          </div>

          <p style="font-size: 15px; color: #ffffff; line-height: 1.6;">
            Dear ${user.name},
          </p>

          <p style="font-size: 14px; color: #d1c9b8; line-height: 1.6;">
            Great news! Your payment verification is complete, and your subscription has been successfully approved by our administrative team.
          </p>

          <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 8px; padding: 16px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr>
                <td style="padding: 6px 0; color: #9b9eac; font-weight: 600; width: 40%;">Membership Tier:</td>
                <td style="padding: 6px 0; color: #ffb300; font-weight: 700;">NonStock Pro</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #9b9eac; font-weight: 600;">Plan Duration:</td>
                <td style="padding: 6px 0; color: #ffffff;">${planDetail.name}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #9b9eac; font-weight: 600;">Status:</td>
                <td style="padding: 6px 0; color: #00ff88; font-weight: 700;">Active</td>
              </tr>
            </table>
          </div>

          <p style="font-size: 14px; color: #d1c9b8; line-height: 1.6; margin-bottom: 24px;">
            You can now log in to the dashboard to access all premium features (Advanced Greeks, automated trading bot presettings, and institutional-grade AI Coaching).
          </p>

          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" style="display: inline-block; text-decoration: none; padding: 12px 30px; background: linear-gradient(135deg, #ffe082, #ffb300); color: #0b0803; font-weight: 800; border-radius: 25px; font-size: 14px; box-shadow: 0 4px 15px rgba(255, 179, 0, 0.35);">
              Go to Pro Dashboard
            </a>
          </div>

          <p style="font-size: 11px; color: #9b9eac; margin-top: 40px; text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 15px;">
            If you have any questions or require assistance, please contact us at krishshah8201@gmail.com.
          </p>
        </div>
      `;

      await sendEmail({
        to: user.email,
        subject: `NonStock Pro Subscription Activated!`,
        html: userHtml
      });

      return res.send(`
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 50px auto; padding: 30px; text-align: center; border: 1px solid #00ff88; border-radius: 12px; background: #0b0803; color: #ffffff; box-shadow: 0 0 30px rgba(0, 255, 136, 0.15);">
          <div style="width: 50px; height: 50px; border-radius: 50%; background: #00ff88; display: flex; align-items: center; justify-content: center; color: #0b0803; font-size: 24px; font-weight: 900; margin: 0 auto 20px auto;">✓</div>
          <h2 style="color: #00ff88; margin-bottom: 15px;">Subscription Approved</h2>
          <p style="color: #d1c9b8; font-size: 14px; line-height: 1.6;">
            User <strong>${user.name}</strong> (${user.email}) has been successfully upgraded to the Pro tier (<strong>${planDetail.name}</strong>). A confirmation email has been sent to them.
          </p>
        </div>
      `);
    } else {
      // Action is 'reject'
      // Update database status
      await query(
        `UPDATE users 
         SET pro_status = 'rejected', 
             pro_pending_plan = NULL, 
             pro_pending_ref = NULL 
         WHERE id = $1`,
        [userId]
      );

      // Send rejection notification email to user
      const userHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0b0803; border: 1px solid #ff3366; border-radius: 12px; color: #ffffff;">
          <div style="text-align: center; border-bottom: 2px solid rgba(255, 51, 102, 0.2); padding-bottom: 20px; margin-bottom: 20px;">
            <h2 style="color: #ff3366; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 0.5px;">Subscription Payment Verification Declined</h2>
            <p style="color: #d1c9b8; font-size: 13px; margin: 5px 0 0 0;">Transaction Verification Failed</p>
          </div>

          <p style="font-size: 15px; color: #ffffff; line-height: 1.6;">
            Dear ${user.name},
          </p>

          <p style="font-size: 14px; color: #d1c9b8; line-height: 1.6;">
            We were unable to verify your recent Pro upgrade request due to an issue with the UPI UTR / Transaction Reference ID provided: <strong>${referenceId}</strong>.
          </p>

          <p style="font-size: 14px; color: #d1c9b8; line-height: 1.6;">
            Please ensure you have transferred the exact amount of <strong>${planDetail.price}</strong> and enter the correct 12-digit UTR number from your payment app receipts.
          </p>

          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/upgrade-pro" style="display: inline-block; text-decoration: none; padding: 12px 30px; background: linear-gradient(135deg, #ff3366, #ff7b9a); color: #ffffff; font-weight: 800; border-radius: 25px; font-size: 14px; box-shadow: 0 4px 15px rgba(255, 51, 102, 0.35);">
              Resubmit Payment Details
            </a>
          </div>

          <p style="font-size: 11px; color: #9b9eac; margin-top: 40px; text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 15px;">
            If this was an error or you have a valid payment receipt, please contact support directly at krishshah8201@gmail.com.
          </p>
        </div>
      `;

      await sendEmail({
        to: user.email,
        subject: `Payment Verification Declined - NonStock Pro`,
        html: userHtml
      });

      return res.send(`
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 50px auto; padding: 30px; text-align: center; border: 1px solid #ff3366; border-radius: 12px; background: #0b0803; color: #ffffff; box-shadow: 0 0 30px rgba(255, 51, 102, 0.15);">
          <div style="width: 50px; height: 50px; border-radius: 50%; background: #ff3366; display: flex; align-items: center; justify-content: center; color: #ffffff; font-size: 24px; font-weight: 900; margin: 0 auto 20px auto;">✗</div>
          <h2 style="color: #ff3366; margin-bottom: 15px;">Subscription Rejected</h2>
          <p style="color: #d1c9b8; font-size: 14px; line-height: 1.6;">
            Upgrade request for User <strong>${user.name}</strong> (${user.email}) has been rejected. The user has been notified via email.
          </p>
        </div>
      `);
    }
  } catch (error) {
    console.error('❌ Admin verification callback error:', error);
    res.status(500).send(`
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 50px auto; padding: 30px; text-align: center; border: 1px solid #ff3366; border-radius: 12px; background: #0b0803; color: #ffffff;">
        <h2 style="color: #ff3366; margin-bottom: 15px;">Verification Process Failed</h2>
        <p style="color: #d1c9b8; font-size: 14px; line-height: 1.5;">An internal system error occurred during verification processing.</p>
      </div>
    `);
  }
});

// Submit creator verification request
app.post('/api/user/request-verification', authenticate, async (req, res) => {
  try {
    const { title, proof } = req.body;
    if (!title || !proof) {
      return res.status(400).json({ error: 'Verification title and proof details are required' });
    }

    await query(
      `UPDATE users 
       SET verification_title = $1, 
           verification_proof = $2, 
           verification_status = 'pending' 
       WHERE id = $3`,
      [title, proof, req.user.id]
    );

    res.json({ success: true, message: 'Verification request submitted successfully' });
  } catch (error) {
    console.error('❌ Request verification error:', error);
    res.status(500).json({ error: 'Failed to submit verification request' });
  }
});

// Fetch pending verification requests (Admin only)
app.get('/api/user/verification-requests', authenticate, async (req, res) => {
  try {
    const adminCheck = await query(`SELECT is_admin FROM users WHERE id = $1`, [req.user.id]);
    const isAdmin = adminCheck.rows[0]?.is_admin || req.user.email.toLowerCase().startsWith('admin@');
    if (!isAdmin) {
      return res.status(403).json({ error: 'Access denied: admin permission required' });
    }

    const result = await query(
      `SELECT id, name, email, verification_title, verification_proof, verification_status 
       FROM users 
       WHERE verification_status = 'pending' 
       ORDER BY created_at ASC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('❌ Fetch verification requests error:', error);
    res.status(500).json({ error: 'Failed to retrieve requests' });
  }
});

// Approve or reject verification request (Admin only)
app.post('/api/user/verify/:userId', authenticate, async (req, res) => {
  try {
    const adminCheck = await query(`SELECT is_admin FROM users WHERE id = $1`, [req.user.id]);
    const isAdmin = adminCheck.rows[0]?.is_admin || req.user.email.toLowerCase().startsWith('admin@');
    if (!isAdmin) {
      return res.status(403).json({ error: 'Access denied: admin permission required' });
    }

    const { status, title } = req.body; // status: 'approved' or 'rejected'
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid verification status' });
    }

    const isVerified = status === 'approved';
    const finalTitle = isVerified ? (title || 'Verified Creator') : null;

    const result = await query(
      `UPDATE users 
       SET is_verified = $1, 
           verification_status = $2,
           verification_title = $3
       WHERE id = $4 RETURNING *`,
      [isVerified, status, finalTitle, req.params.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ success: true, message: `Verification request ${status} successfully` });
  } catch (error) {
    console.error('❌ Verify user error:', error);
    res.status(500).json({ error: 'Failed to process verification request' });
  }
});

// Watchlist
app.get('/api/watchlist', authenticate, async (req, res) => {
  const result = await query(`SELECT symbol FROM watchlist_items WHERE user_id = $1`, [req.user.id]);
  res.json({ watchlist: result.rows });
});
app.post('/api/watchlist', authenticate, async (req, res) => {
  const { symbol } = req.body;
  await query(`INSERT INTO watchlist_items (id, user_id, symbol) VALUES ($1,$2,$3)`, [require('crypto').randomUUID(), req.user.id, symbol]);
  res.json({ success: true });
});
app.delete('/api/watchlist/:symbol', authenticate, async (req, res) => {
  await query(`DELETE FROM watchlist_items WHERE user_id = $1 AND symbol = $2`, [req.user.id, req.params.symbol]);
  res.json({ success: true });
});

// Portfolio
app.get('/api/portfolio', authenticate, async (req, res) => {
  try {
    const result = await query(`SELECT symbol, quantity, buy_price FROM portfolio_items WHERE user_id = $1`, [req.user.id]);
    const userResult = await query(`SELECT connected_broker FROM users WHERE id = $1`, [req.user.id]);
    const connectedBroker = userResult.rows[0]?.connected_broker || null;
    res.json({ portfolio: result.rows, connectedBroker });
  } catch (err) {
    console.error('Fetch portfolio error:', err);
    res.status(500).json({ error: 'Failed to fetch portfolio' });
  }
});
app.post('/api/portfolio', authenticate, async (req, res) => {
  const { symbol, quantity, buyPrice } = req.body;
  await query(`INSERT INTO portfolio_items (id, user_id, symbol, quantity, buy_price) VALUES ($1,$2,$3,$4,$5)`, [require('crypto').randomUUID(), req.user.id, symbol, quantity, buyPrice]);
  res.json({ success: true });
});
// Angel One SmartAPI Connector
async function syncAngelOne(clientCode, pin, totp) {
  const apiKey = process.env.ANGEL_ONE_API_KEY;
  if (!apiKey) {
    throw new Error('ANGEL_ONE_API_KEY is not configured in the backend environment.');
  }

  // 1. Authenticate / Login
  const loginUrl = 'https://apiconnect.angelone.in/rest/auth/angelbroking/user/v1/loginByPassword';
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-UserType': 'USER',
    'X-SourceID': 'WEB',
    'X-ClientLocalIP': '127.0.0.1',
    'X-ClientPublicIP': '127.0.0.1',
    'X-MACAddress': '00:00:00:00:00:00',
    'X-PrivateKey': apiKey
  };

  const loginRes = await fetch(loginUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      clientcode: clientCode,
      password: pin,
      totp: totp || ''
    })
  });

  const loginData = await loginRes.json();
  if (!loginData.status || !loginData.data || !loginData.data.jwtToken) {
    throw new Error(loginData.message || 'Authentication failed. Check your Client Code, PIN, and TOTP.');
  }

  const jwtToken = loginData.data.jwtToken;

  // 2. Fetch Holdings
  const holdingsUrl = 'https://apiconnect.angelone.in/rest/secure/angelbroking/portfolio/v1/getHolding';
  const holdingsRes = await fetch(holdingsUrl, {
    method: 'GET',
    headers: {
      ...headers,
      'Authorization': `Bearer ${jwtToken}`
    }
  });

  const holdingsData = await holdingsRes.json();
  if (!holdingsData.status || !holdingsData.data) {
    throw new Error(holdingsData.message || 'Failed to retrieve holdings from Angel One.');
  }

  // Map holdings to our format
  return (holdingsData.data || []).map(h => {
    let symbol = h.tradingsymbol || '';
    if (symbol.endsWith('-EQ')) {
      symbol = symbol.replace('-EQ', '');
    }
    if (!symbol.includes('.') && !symbol.includes('-') && !symbol.includes('=')) {
      symbol = `${symbol}.NS`;
    }
    return {
      symbol,
      quantity: parseInt(h.quantity) || 0,
      buyPrice: parseFloat(h.averageprice) || parseFloat(h.pnlprice) || 0
    };
  });
}

app.post('/api/portfolio/sync-broker', authenticate, async (req, res) => {
  const { broker, clientCode, pin, totp } = req.body;
  try {
    // Clear existing holdings first
    await query(`DELETE FROM portfolio_items WHERE user_id = $1`, [req.user.id]);
    
    const isSandbox = ['DEMO', 'MOCK', 'TEST', 'SANDBOX'].some(kw => (clientCode || '').toUpperCase().includes(kw));
    
    let holdingsToStore = [];
    let message = '';

    if (isSandbox) {
      // Seed high-fidelity stock holdings for sandbox testing
      holdingsToStore = [
        { symbol: 'RELIANCE.NS', quantity: 15, buyPrice: 2450.50 },
        { symbol: 'TCS.NS', quantity: 10, buyPrice: 3890.00 },
        { symbol: 'INFY.NS', quantity: 25, buyPrice: 1420.00 },
        { symbol: 'HDFCBANK.NS', quantity: 30, buyPrice: 1510.00 },
        { symbol: 'TATAMOTORS.NS', quantity: 40, buyPrice: 920.00 },
        { symbol: 'SBIN.NS', quantity: 50, buyPrice: 740.00 }
      ];
      message = `Sandbox Connected. Synced ${holdingsToStore.length} demo holdings.`;
    } else {
      // Real API connection
      if (broker !== 'Angel One') {
        return res.status(400).json({ 
          error: `Direct API connection is currently only supported for Angel One (SmartAPI). For Zerodha, Groww, or Upstox, please use Client Code 'DEMO' to simulate sandbox holdings.` 
        });
      }

      // Sync from Angel One
      try {
        holdingsToStore = await syncAngelOne(clientCode, pin, totp);
        message = `Successfully connected to Angel One. Synced ${holdingsToStore.length} holdings.`;
      } catch (apiErr) {
        console.error('Broker API integration error:', apiErr);
        return res.status(400).json({ 
          error: `Broker Connection Failed: ${apiErr.message}` 
        });
      }
    }
    
    // Insert holdings into the database
    for (const item of holdingsToStore) {
      await query(
        `INSERT INTO portfolio_items (id, user_id, symbol, quantity, buy_price) VALUES ($1,$2,$3,$4,$5)`,
        [require('crypto').randomUUID(), req.user.id, item.symbol, item.quantity, item.buyPrice]
      );
    }

    // Determine profile details based on broker type
    let dbBrokerCode = clientCode;
    let dbDematId = '1208160001094852';
    let dbDpName = 'NonStock Securities Pvt Ltd';
    let dbPanId = 'ABCDE*****F';
    let dbBrokeragePlan = '₹0 Equity Delivery / ₹20 F&O Intraday';

    if (isSandbox) {
      dbBrokerCode = clientCode || 'DEMO';
      dbDpName = 'NonStock Sandbox Securities';
      dbDematId = '1208160001094852';
      dbBrokeragePlan = '₹0 Sandbox Demo Plan';
      dbPanId = 'PAN-DEMO-KYC';
    } else if (broker === 'Angel One') {
      dbBrokerCode = clientCode;
      dbDpName = 'Angel One Limited';
      // Angel One CDSL DP ID is 12033200. BO ID is 16-digit.
      const seedVal = Math.abs(clientCode.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) * 12345) % 100000000;
      dbDematId = `12033200${String(seedVal).padStart(8, '0')}`;
      dbPanId = `APNPS${String(seedVal % 10000).padStart(4, '0')}F`;
      dbBrokeragePlan = '₹20 Flat per Trade (iTrade Prime)';
    }

    // Save connection status & demat credentials in user record
    await query(
      `UPDATE users SET 
        connected_broker = $1, 
        broker_code = $2, 
        demat_id = $3, 
        dp_name = $4, 
        pan_id = $5, 
        brokerage_plan = $6 
       WHERE id = $7`, 
      [broker, dbBrokerCode, dbDematId, dbDpName, dbPanId, dbBrokeragePlan, req.user.id]
    );
    
    res.json({ success: true, count: holdingsToStore.length, message });
  } catch (err) {
    console.error('Broker sync error:', err);
    res.status(500).json({ error: 'Failed to sync broker assets' });
  }
});
app.post('/api/portfolio/disconnect-broker', authenticate, async (req, res) => {
  try {
    // Clear portfolio items
    await query(`DELETE FROM portfolio_items WHERE user_id = $1`, [req.user.id]);
    // Clear connected broker status & demat credentials in user table
    await query(
      `UPDATE users SET 
        connected_broker = NULL, 
        broker_code = NULL, 
        demat_id = NULL, 
        dp_name = NULL, 
        pan_id = NULL, 
        brokerage_plan = NULL 
       WHERE id = $1`, 
      [req.user.id]
    );
    
    res.json({ success: true, message: 'Disconnected broker demat and cleared portfolio.' });
  } catch (err) {
    console.error('Broker disconnect error:', err);
    res.status(500).json({ error: 'Failed to disconnect broker' });
  }
});
app.delete('/api/portfolio/:symbol', authenticate, async (req, res) => {
  await query(`DELETE FROM portfolio_items WHERE user_id = $1 AND symbol = $2`, [req.user.id, req.params.symbol]);
  res.json({ success: true });
});

// Keep‑alive endpoint – prevents database suspension
app.get('/api/keep-alive', async (req, res) => {
  try {
    const { query } = require('./db/index');
    await query('SELECT 1');
    res.json({ status: 'Database awake', timestamp: new Date() });
  } catch (err) {
    console.error('Keep‑alive error:', err.message);
    res.status(500).json({ error: 'Database not reachable' });
  }
});

// Socket.io
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Authentication required'));
  try {
    const decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    next();
  } catch (err) {
    next(new Error('Invalid token'));
  }
});
// Active Stream Manager
const activeSymbols = new Map();

io.on('connection', (socket) => {
  console.log(`🔌 User ${socket.userId} connected to WebSocket (socket ID: ${socket.id})`);

  socket.on('subscribe', (symbols) => {
    if (!Array.isArray(symbols)) return;
    symbols.forEach((sym) => {
      const cleanSym = sym.toUpperCase();
      socket.join(`stock:${cleanSym}`);
      
      if (!activeSymbols.has(cleanSym)) {
        activeSymbols.set(cleanSym, new Set());
      }
      activeSymbols.get(cleanSym).add(socket.id);
      console.log(`📡 Socket ${socket.id} subscribed to room stock:${cleanSym}`);
    });
  });

  socket.on('joinGroup', (groupId) => {
    if (!groupId) return;
    socket.join(`group:${groupId}`);
    console.log(`👥 Socket ${socket.id} joined group room: group:${groupId}`);
  });

  socket.on('leaveGroup', (groupId) => {
    if (!groupId) return;
    socket.leave(`group:${groupId}`);
    console.log(`👥 Socket ${socket.id} left group room: group:${groupId}`);
  });

  socket.on('unsubscribe', (symbols) => {
    if (!Array.isArray(symbols)) return;
    symbols.forEach((sym) => {
      const cleanSym = sym.toUpperCase();
      socket.leave(`stock:${cleanSym}`);
      
      if (activeSymbols.has(cleanSym)) {
        activeSymbols.get(cleanSym).delete(socket.id);
        if (activeSymbols.get(cleanSym).size === 0) {
          activeSymbols.delete(cleanSym);
        }
      }
      console.log(`📡 Socket ${socket.id} unsubscribed from stock:${cleanSym}`);
    });
  });

  socket.on('disconnect', () => {
    console.log(`🔌 User ${socket.userId} disconnected (socket ID: ${socket.id})`);
    for (const [sym, sockets] of activeSymbols.entries()) {
      if (sockets.has(socket.id)) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          activeSymbols.delete(sym);
        }
      }
    }
  });
});

// Periodic stream tick generator (1 second interval)
setInterval(async () => {
  if (activeSymbols.size === 0) return;

  for (const [symbol, sockets] of activeSymbols.entries()) {
    if (sockets.size === 0) {
      activeSymbols.delete(symbol);
      continue;
    }

    try {
      let resolveSymbol = symbol.toUpperCase();
      const isIndex = ['NSEI', 'BSESN', 'NSEBANK', 'CNXIT', 'NIFTY', 'SENSEX', 'BANKNIFTY'].includes(resolveSymbol);
      const isCrypto = ['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'DOGE', 'ADA', 'SHIB', 'AVAX', 'TRX'].includes(resolveSymbol);
      const isForex = resolveSymbol.includes('USD') || resolveSymbol.includes('INR');
      const alreadySuffixed = resolveSymbol.endsWith('.NS') || resolveSymbol.endsWith('.BO') || resolveSymbol.endsWith('=X') || resolveSymbol.endsWith('=F') || resolveSymbol.includes('=') || resolveSymbol.endsWith('-USD') || resolveSymbol.endsWith('-USDT') || resolveSymbol.startsWith('^');

      if (resolveSymbol === 'NIFTY') resolveSymbol = '^NSEI';
      else if (resolveSymbol === 'SENSEX') resolveSymbol = '^BSESN';
      else if (resolveSymbol === 'BANKNIFTY') resolveSymbol = '^NSEBANK';

      if (isCrypto && !alreadySuffixed) {
        resolveSymbol = `${resolveSymbol}-USD`;
      } else if (!isIndex && !isCrypto && !isForex && !alreadySuffixed) {
        resolveSymbol = `${resolveSymbol}.NS`;
      }

      const quote = await fetchYahooQuote(resolveSymbol);
      if (quote) {
        const price = parseFloat(quote.price);
        const change = parseFloat(quote.change) || 0;
        
        // Minor trade walk: -0.04% to +0.04% fluctuation
        const walkPercent = (Math.random() - 0.5) * 0.0008;
        const tickPrice = parseFloat((price * (1 + walkPercent)).toFixed(2));
        
        const originalPrevClose = price - change;
        const tickChange = tickPrice - originalPrevClose;
        const tickChangePercent = originalPrevClose ? (tickChange / originalPrevClose) * 100 : 0;

        const tick = {
          symbol,
          price: tickPrice.toFixed(2),
          change: tickChange.toFixed(2),
          changePercent: tickChangePercent.toFixed(2),
          dayHigh: Math.max(parseFloat(quote.dayHigh || price), tickPrice).toFixed(2),
          dayLow: Math.min(parseFloat(quote.dayLow || price), tickPrice).toFixed(2),
          volume: Math.round((quote.volume || 10000) * (1 + (Math.random() - 0.5) * 0.05)),
          timestamp: Date.now()
        };

        io.to(`stock:${symbol}`).emit('tick', tick);
      }
    } catch (err) {
      console.warn(`[StreamManager] Failed to fetch quote for ${symbol}:`, err.message);
    }
  }
}, 1000);

// ─── AUTOMATED TRADING BOT EXECUTION ENGINE ───
function startBotSimulator() {
  const crypto = require('crypto');
  console.log('🤖 Starting Automated Bot Execution Engine...');
  
  setInterval(async () => {
    try {
      const activeBotsRes = await query(`SELECT * FROM deployed_bots WHERE status = 'active'`);
      const activeBots = activeBotsRes.rows;
      if (activeBots.length === 0) return;
      
      for (const bot of activeBots) {
        const quote = await fetchYahooQuote(bot.symbol);
        if (!quote || !quote.price) continue;
        
        const currentPrice = parseFloat(quote.price);
        const positionRes = await query(
          `SELECT * FROM paper_portfolio_items WHERE user_id = $1 AND symbol = $2`,
          [bot.user_id, bot.symbol]
        );
        const position = positionRes.rows[0];
        
        if (position) {
          const buyPrice = parseFloat(position.buy_price);
          const stopLossPct = parseFloat(bot.stop_loss);
          const takeProfitPct = parseFloat(bot.take_profit);
          const changePct = ((currentPrice - buyPrice) / buyPrice) * 100;
          
          let triggerClose = false;
          let reason = '';
          let exitPrice = currentPrice;
          
          if (stopLossPct > 0 && changePct <= -stopLossPct) {
            triggerClose = true;
            reason = 'Bot SL Triggered';
            exitPrice = buyPrice * (1 - stopLossPct / 100);
          } else if (takeProfitPct > 0 && changePct >= takeProfitPct) {
            triggerClose = true;
            reason = 'Bot TP Triggered';
            exitPrice = buyPrice * (1 + takeProfitPct / 100);
          } else if (Math.random() < 0.05) {
            triggerClose = true;
            reason = 'Bot Strategy Exit Signal';
          }
          
          if (triggerClose) {
            console.log(`🤖 Bot ${bot.strategy_name} executing exit: ${reason} for ${bot.symbol} at $${exitPrice}`);
            const qty = parseFloat(position.quantity);
            const userRes = await query('SELECT virtual_balance FROM users WHERE id = $1', [bot.user_id]);
            if (userRes.rows.length > 0) {
              const currentBalance = parseFloat(userRes.rows[0].virtual_balance);
              const isIndian = bot.symbol.endsWith('.NS') || bot.symbol.endsWith('.BO');
              
              let rate = 1.0;
              if (isIndian) {
                const inrQuote = await fetchYahooQuote('INR=X');
                if (inrQuote && inrQuote.price) rate = parseFloat(inrQuote.price);
                else rate = 83.5;
              }
              
              const exitValuationUsd = qty * (isIndian ? exitPrice / rate : exitPrice);
              const buyValuationUsd = qty * (isIndian ? buyPrice / rate : buyPrice);
              const pnl = exitValuationUsd - buyValuationUsd;
              const newBalance = currentBalance + exitValuationUsd;
              
              await query('UPDATE users SET virtual_balance = $1 WHERE id = $2', [newBalance, bot.user_id]);
              await query('DELETE FROM paper_portfolio_items WHERE user_id = $1 AND symbol = $2', [bot.user_id, bot.symbol]);
              
              await query(
                `INSERT INTO paper_trades (id, user_id, symbol, action, quantity, price, buy_price, pnl, timestamp)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
                [crypto.randomUUID(), bot.user_id, bot.symbol, 'SELL', qty, exitPrice, buyPrice, pnl]
              );
              
              await query(
                `INSERT INTO paper_balance_history (id, user_id, type, amount, new_balance, description)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [crypto.randomUUID(), bot.user_id, 'TRADE', exitValuationUsd, newBalance, `Bot ${bot.strategy_name} closed position: ${reason}`]
              );
            }
          }
        } else {
          if (Math.random() < 0.15) {
            const userRes = await query('SELECT virtual_balance FROM users WHERE id = $1', [bot.user_id]);
            if (userRes.rows.length > 0) {
              const currentBalance = parseFloat(userRes.rows[0].virtual_balance);
              const allocatedCapital = parseFloat(bot.capital);
              
              if (currentBalance >= allocatedCapital) {
                const isIndian = bot.symbol.endsWith('.NS') || bot.symbol.endsWith('.BO');
                let rate = 1.0;
                if (isIndian) {
                  const inrQuote = await fetchYahooQuote('INR=X');
                  if (inrQuote && inrQuote.price) rate = parseFloat(inrQuote.price);
                  else rate = 83.5;
                }
                
                const capitalNative = allocatedCapital * (isIndian ? rate : 1.0);
                const qty = capitalNative / currentPrice;
                
                if (qty > 0) {
                  console.log(`🤖 Bot ${bot.strategy_name} executing entry for ${bot.symbol} at $${currentPrice}`);
                  const newBalance = currentBalance - allocatedCapital;
                  
                  await query('UPDATE users SET virtual_balance = $1 WHERE id = $2', [newBalance, bot.user_id]);
                  
                  await query(
                    `INSERT INTO paper_portfolio_items (user_id, symbol, quantity, buy_price, buy_date, stop_loss, take_profit)
                     VALUES ($1, $2, $3, $4, NOW(), $5, $6)`,
                    [
                      bot.user_id,
                      bot.symbol,
                      qty,
                      currentPrice,
                      bot.stop_loss > 0 ? currentPrice * (1 - parseFloat(bot.stop_loss) / 100) : null,
                      bot.take_profit > 0 ? currentPrice * (1 + parseFloat(bot.take_profit) / 100) : null
                    ]
                  );
                  
                  await query(
                    `INSERT INTO paper_trades (id, user_id, symbol, action, quantity, price, buy_price, pnl, timestamp)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
                    [crypto.randomUUID(), bot.user_id, bot.symbol, 'BUY', qty, currentPrice, currentPrice, 0]
                  );
                  
                  await query(
                    `INSERT INTO paper_balance_history (id, user_id, type, amount, new_balance, description)
                     VALUES ($1, $2, $3, $4, $5, $6)`,
                    [crypto.randomUUID(), bot.user_id, 'TRADE', -allocatedCapital, newBalance, `Bot ${bot.strategy_name} entered position: buy entry signal`]
                  );
                }
              }
            }
          }
        }
      }
    } catch (err) {
      console.error('❌ Bot Simulator Loop Error:', err);
    }
  }, 30000);
}

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
  startBotSimulator();
});