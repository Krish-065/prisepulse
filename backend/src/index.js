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

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json());

createTables().catch(console.error);

// Auth routes
app.post('/api/auth/register', authRoutes.register);
app.post('/api/auth/verify-email', authRoutes.verifyEmail);
app.post('/api/auth/login', loginLimiter, authRoutes.login);
app.post('/api/auth/forgot-password', authRoutes.forgotPassword);
app.post('/api/auth/reset-password', authRoutes.resetPassword);
app.get('/api/auth/sessions', authenticate, authRoutes.getSessions);
app.delete('/api/auth/sessions/:sessionId', authenticate, authRoutes.logoutSession);
app.post('/api/auth/2fa/setup', authenticate, authRoutes.setupTwoFactor);
app.post('/api/auth/2fa/verify', authenticate, authRoutes.verifyAndEnableTwoFactor);
app.post('/api/auth/2fa/disable', authenticate, authRoutes.disableTwoFactor);

// Market data
app.use('/api/market', marketRoutes);

// User profile
app.get('/api/user/profile', authenticate, async (req, res) => {
  const result = await query(`SELECT id, email, name, theme, language, two_factor_enabled FROM users WHERE id = $1`, [req.user.id]);
  res.json(result.rows[0]);
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
  const result = await query(`SELECT symbol, quantity, buy_price FROM portfolio_items WHERE user_id = $1`, [req.user.id]);
  res.json({ portfolio: result.rows });
});
app.post('/api/portfolio', authenticate, async (req, res) => {
  const { symbol, quantity, buyPrice } = req.body;
  await query(`INSERT INTO portfolio_items (id, user_id, symbol, quantity, buy_price) VALUES ($1,$2,$3,$4,$5)`, [require('crypto').randomUUID(), req.user.id, symbol, quantity, buyPrice]);
  res.json({ success: true });
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