const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
const http     = require('http');
const axios    = require('axios');
const cron     = require('node-cron');
const { Server } = require('socket.io');
const passport = require('passport');
require('dotenv').config();

// Import config and middleware
const connectDB = require('./config/database');
require('./config/oauth');
const { verifyToken } = require('./middleware/auth');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

app.use(cors());
app.use(express.json());
app.use(passport.initialize());

// Connect to MongoDB
connectDB();

// Mount all routes
app.use('/api/auth',         require('./routes/auth'));
app.use('/api/market',       require('./routes/market'));
app.use('/api/watchlist',    require('./routes/watchlist'));
app.use('/api/portfolio',    require('./routes/portfolio'));
app.use('/api/news',         require('./routes/news'));
app.use('/api/crypto',       require('./routes/crypto'));
app.use('/api/trading',      verifyToken, require('./routes/trading'));
app.use('/api/priceAlerts',  verifyToken, require('./routes/priceAlerts'));
app.use('/api/notifications', verifyToken, require('./routes/notifications'));
app.use('/api/ipo',          require('./routes/ipo'));
app.use('/api/mutualFunds',  require('./routes/mutualFunds'));
app.use('/api/comparison',   require('./routes/comparison'));
app.use('/api/screener',     verifyToken, require('./routes/screener'));
app.use('/api/aiInsights',   verifyToken, require('./routes/aiInsights'));

app.get('/', (req, res) => {
  res.json({ message: 'PrisePulse API is running!' });
});

// NSE cookie session for broadcast
let broadcastCookie = '';
let broadcastCookieTime = 0;

const getBroadcastCookie = async () => {
  if (broadcastCookie && Date.now() - broadcastCookieTime < 25 * 60 * 1000) {
    return broadcastCookie;
  }
  try {
    const res = await axios.get('https://www.nseindia.com', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      timeout: 8000
    });
    const cookies = res.headers['set-cookie'];
    if (cookies) {
      broadcastCookie     = cookies.map(c => c.split(';')[0]).join('; ');
      broadcastCookieTime = Date.now();
    }
  } catch (e) {
    console.log('Broadcast cookie error:', e.message);
  }
  return broadcastCookie;
};

const broadcastMarket = async () => {
  try {
    const cookie = await getBroadcastCookie();

    const { data } = await axios.get(
      'https://www.nseindia.com/api/allIndices',
      {
        headers: {
          'User-Agent':      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
          'Accept':          'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Referer':         'https://www.nseindia.com/',
          'Cookie':          cookie,
        },
        timeout: 6000
      }
    );

    const indices   = data.data || [];
    const nifty     = indices.find(i => i.index === 'NIFTY 50');
    const sensex    = indices.find(i => i.index === 'SENSEX') ||
                      indices.find(i => i.index === 'S&P BSE SENSEX');
    const bankNifty = indices.find(i => i.index === 'NIFTY BANK');
    const niftyIT   = indices.find(i => i.index === 'NIFTY IT');

    const payload = {
      NIFTY:             nifty     ? parseFloat(nifty.last)        : 23151,
      SENSEX:            sensex    ? parseFloat(sensex.last)       : 76012,
      BANK_NIFTY:        bankNifty ? parseFloat(bankNifty.last)    : 47312,
      NIFTY_IT:          niftyIT   ? parseFloat(niftyIT.last)      : 34201,
      NIFTY_CHANGE:      nifty     ? parseFloat(nifty.percentChange)     : parseFloat((Math.random() * 2 - 1).toFixed(2)),
SENSEX_CHANGE:     sensex    ? parseFloat(sensex.percentChange)    : parseFloat((Math.random() * 2 - 1).toFixed(2)),
BANK_NIFTY_CHANGE: bankNifty ? parseFloat(bankNifty.percentChange) : parseFloat((Math.random() * 2 - 1).toFixed(2)),
NIFTY_IT_CHANGE:   niftyIT   ? parseFloat(niftyIT.percentChange)   : parseFloat((Math.random() * 2 - 1).toFixed(2)),
    };

    io.emit('price-update', payload);
    console.log(
      '[' + new Date().toLocaleTimeString() + ']' +
      ' NIFTY ' + payload.NIFTY +
      ' (' + (payload.NIFTY_CHANGE >= 0 ? '+' : '') + payload.NIFTY_CHANGE + '%)'
    );

  } catch (err) {
    console.log('NSE fetch failed, sending simulated data:', err.message);

    // Simulate realistic fluctuating prices when NSE is blocked
    const niftyBase     = 23151;
    const sensexBase    = 76012;
    const bankBase      = 47312;
    const itBase        = 34201;

    io.emit('price-update', {
      NIFTY:             parseFloat((niftyBase  + (Math.random() * 200 - 100)).toFixed(2)),
      SENSEX:            parseFloat((sensexBase + (Math.random() * 500 - 250)).toFixed(2)),
      BANK_NIFTY:        parseFloat((bankBase   + (Math.random() * 300 - 150)).toFixed(2)),
      NIFTY_IT:          parseFloat((itBase     + (Math.random() * 200 - 100)).toFixed(2)),
      NIFTY_CHANGE:      parseFloat((Math.random() * 2 - 1).toFixed(2)),
      SENSEX_CHANGE:     parseFloat((Math.random() * 2 - 1).toFixed(2)),
      BANK_NIFTY_CHANGE: parseFloat((Math.random() * 2 - 1).toFixed(2)),
      NIFTY_IT_CHANGE:   parseFloat((Math.random() * 2 - 1).toFixed(2)),
      timestamp: new Date(),
    });
  }
};

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Send data immediately when client connects
  broadcastMarket();

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Broadcast every 10 seconds
cron.schedule('*/10 * * * * *', broadcastMarket);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log('Server running on port ' + PORT);
  console.log('Starting market data broadcast...');
  broadcastMarket();
});