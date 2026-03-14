const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
const http     = require('http');
const axios    = require('axios');
const cron     = require('node-cron');
const { Server } = require('socket.io');
require('dotenv').config();

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

// ── MongoDB Connect ───────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected successfully!'))
  .catch(err => console.log('MongoDB error:', err));

// ── Routes ────────────────────────────────────────────────────────
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/market',    require('./routes/market'));
app.use('/api/watchlist', require('./routes/watchlist'));
app.use('/api/portfolio', require('./routes/portfolio'));
app.use('/api/news',      require('./routes/news'));

// ── Test Route ────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ message: 'PrisePulse API is running!' });
});

// ── NSE Headers ───────────────────────────────────────────────────
const NSE_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Accept': 'application/json',
  'Accept-Language': 'en-US,en;q=0.9',
  'Referer': 'https://www.nseindia.com',
};

// ── Broadcast live market data via WebSocket ──────────────────────
const broadcastMarket = async () => {
  try {
    const { data } = await axios.get(
      'https://www.nseindia.com/api/allIndices',
      {
        headers: NSE_HEADERS,
        timeout: 5000
      }
    );

    const nifty  = data.data.find(i => i.index === 'NIFTY 50');
    const sensex = data.data.find(i => i.index === 'SENSEX') ||
                   data.data.find(i => i.index === 'S&P BSE SENSEX');
    const bankNifty = data.data.find(i => i.index === 'NIFTY BANK');
    const niftyIT   = data.data.find(i => i.index === 'NIFTY IT');

    io.emit('price-update', {
      NIFTY:          nifty?.last        || (22000 + Math.random() * 300).toFixed(2),
      SENSEX:         sensex?.last       || (73000 + Math.random() * 500).toFixed(2),
      BANK_NIFTY:     bankNifty?.last    || (47000 + Math.random() * 200).toFixed(2),
      NIFTY_IT:       niftyIT?.last      || (34000 + Math.random() * 150).toFixed(2),
      NIFTY_CHANGE:   nifty?.pChange     || 0,
      SENSEX_CHANGE:  sensex?.pChange    || 0,
      BANK_NIFTY_CHANGE: bankNifty?.pChange || 0,
      NIFTY_IT_CHANGE:   niftyIT?.pChange   || 0,
      timestamp: new Date(),
    });

    console.log(`[${new Date().toLocaleTimeString()}] Broadcast: NIFTY ${nifty?.last}`);

  } catch (err) {
    // NSE blocked or timeout — send simulated data
    console.log('NSE fetch failed, sending simulated data');
    io.emit('price-update', {
      NIFTY:          (22000 + Math.random() * 300).toFixed(2),
      SENSEX:         (73000 + Math.random() * 500).toFixed(2),
      BANK_NIFTY:     (47000 + Math.random() * 200).toFixed(2),
      NIFTY_IT:       (34000 + Math.random() * 150).toFixed(2),
      NIFTY_CHANGE:   (Math.random() * 2 - 1).toFixed(2),
      SENSEX_CHANGE:  (Math.random() * 2 - 1).toFixed(2),
      BANK_NIFTY_CHANGE: (Math.random() * 2 - 1).toFixed(2),
      NIFTY_IT_CHANGE:   (Math.random() * 2 - 1).toFixed(2),
      timestamp: new Date(),
    });
  }
};

// ── WebSocket Connection ──────────────────────────────────────────
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Send data immediately when client connects
  broadcastMarket();

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// ── Cron: broadcast every 10 seconds ─────────────────────────────
cron.schedule('*/10 * * * * *', () => {
  broadcastMarket();
});

// ── Start Server ──────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Starting market data broadcast...');
  broadcastMarket(); // broadcast once immediately on startup
});