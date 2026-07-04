require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { createTables } = require('./db/schema');
const authRoutes = require('./auth/auth.service');
const marketRoutes = require('./api/marketData');
const { authenticate } = require('./middleware/auth');
const { loginLimiter } = require('./middleware/rateLimit');
const { query } = require('./db/index');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true },
});

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

// User profile & Password routes
app.post('/api/auth/change-password', authenticate, authRoutes.changePassword);

app.get('/api/user/profile', authenticate, async (req, res) => {
  try {
    const result = await query(
      `SELECT id, email, name, theme, language, two_factor_enabled, base_currency, refresh_rate, landing_page, broker_code, demat_id, dp_name, pan_id, brokerage_plan FROM users WHERE id = $1`, 
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(result.rows[0]);
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
      `SELECT id, email, name, theme, language, two_factor_enabled, base_currency, refresh_rate, landing_page, broker_code, demat_id, dp_name, pan_id, brokerage_plan FROM users WHERE id = $1`, 
      [req.user.id]
    );
    res.json({ message: 'Profile updated successfully', user: result.rows[0] });
  } catch (error) {
    console.error('❌ Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile due to a system error.' });
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

    // Save connection status in user record
    await query(`UPDATE users SET connected_broker = $1 WHERE id = $2`, [broker, req.user.id]);
    
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
    // Clear connected broker status in user table
    await query(`UPDATE users SET connected_broker = NULL WHERE id = $1`, [req.user.id]);
    
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
io.on('connection', (socket) => {
  console.log(`User ${socket.userId} connected`);
  socket.on('subscribe', (symbols) => symbols.forEach(sym => socket.join(`stock:${sym}`)));
  socket.on('disconnect', () => console.log(`User ${socket.userId} disconnected`));
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});