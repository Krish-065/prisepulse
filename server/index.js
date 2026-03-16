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
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected successfully!'))
  .catch(err => console.log('MongoDB error:', err));

app.use('/api/auth',      require('./routes/auth'));
app.use('/api/market',    require('./routes/market'));
app.use('/api/watchlist', require('./routes/watchlist'));
app.use('/api/portfolio', require('./routes/portfolio'));
app.use('/api/news',      require('./routes/news'));

app.get('/', (req, res) => {
  res.json({ message: 'PrisePulse API is running!' });
});

const NSE_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json',
  'Accept-Language': 'en-US,en;q=0.9',
  'Referer': 'https://www.nseindia.com/',
};

let nseCookie = '';
let cookieTime = 0;

const refreshCookie = async () => {
  try {
    const res = await axios.get('https://www.nseindia.com', {
      headers: { 'User-Agent': NSE_HEADERS['User-Agent'] },
      timeout: 5000
    });
    const cookies = res.headers['set-cookie'];
    if (cookies) {
      nseCookie = cookies.map(c => c.split(';')[0]).join('; ');
      cookieTime = Date.now();
    }
  } catch (e) {}
};

const broadcastMarket = async () => {
  try {
    if (!nseCookie || Date.now() - cookieTime > 25 * 60 * 1000) {
      await refreshCookie();
    }
    const { data } = await axios.get(
      'https://www.nseindia.com/api/allIndices',
      { headers: { ...NSE_HEADERS, 'Cookie': nseCookie }, timeout: 5000 }
    );
    const find = (name) => data.data.find(i => i.index === name);
    const nifty     = find('NIFTY 50');
    const sensex    = find('SENSEX') || find('S&P BSE SENSEX');
    const bankNifty = find('NIFTY BANK');
    const niftyIT   = find('NIFTY IT');
    io.emit('price-update', {
      NIFTY:             nifty?.last        || 23151,
      SENSEX:            sensex?.last       || 76012,
      BANK_NIFTY:        bankNifty?.last    || 47312,
      NIFTY_IT:          niftyIT?.last      || 34201,
      NIFTY_CHANGE:      nifty?.pChange     || 0,
      SENSEX_CHANGE:     sensex?.pChange    || 0,
      BANK_NIFTY_CHANGE: bankNifty?.pChange || 0,
      NIFTY_IT_CHANGE:   niftyIT?.pChange   || 0,
      timestamp: new Date(),
    });
    console.log('[' + new Date().toLocaleTimeString() + '] NIFTY ' + (nifty?.last || 'N/A'));
  } catch (err) {
    io.emit('price-update', {
      NIFTY: 23151 + (Math.random()*100-50),
      SENSEX: 76012 + (Math.random()*300-150),
      BANK_NIFTY: 47312 + (Math.random()*150-75),
      NIFTY_IT: 34201 + (Math.random()*100-50),
      NIFTY_CHANGE: parseFloat((Math.random()*2-1).toFixed(2)),
      SENSEX_CHANGE: parseFloat((Math.random()*2-1).toFixed(2)),
      BANK_NIFTY_CHANGE: parseFloat((Math.random()*2-1).toFixed(2)),
      NIFTY_IT_CHANGE: parseFloat((Math.random()*2-1).toFixed(2)),
      timestamp: new Date(),
    });
  }
};

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  broadcastMarket();
  socket.on('disconnect', () => console.log('Disconnected:', socket.id));
});

cron.schedule('*/10 * * * * *', broadcastMarket);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log('Server running on port ' + PORT);
  broadcastMarket();
});