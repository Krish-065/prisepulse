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
      `SELECT id, email, name, theme, language, two_factor_enabled, base_currency, refresh_rate, landing_page, broker_code, demat_id, dp_name, pan_id, brokerage_plan, connected_broker, is_admin FROM users WHERE id = $1`, 
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
      `SELECT id, email, name, theme, language, two_factor_enabled, base_currency, refresh_rate, landing_page, broker_code, demat_id, dp_name, pan_id, brokerage_plan, connected_broker, is_admin FROM users WHERE id = $1`, 
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

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});