const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
const http     = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app    = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

app.use(cors({
  origin: ['https://prisepulse-gamma.vercel.app', 'http://localhost:3000']
}));
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected successfully!'))
  .catch(err => console.log('MongoDB error:', err));

// Routes
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/market',    require('./routes/market'));
app.use('/api/watchlist', require('./routes/watchlist'));
app.use('/api/portfolio', require('./routes/portfolio'));
app.get('/', (req, res) => {
  res.json({ message: 'PrisePulse API is running!' });
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  const interval = setInterval(() => {
    socket.emit('price-update', {
      NIFTY:  (22000 + Math.random() * 300).toFixed(2),
      SENSEX: (73000 + Math.random() * 500).toFixed(2),
      timestamp: new Date()
    });
  }, 3000);
  socket.on('disconnect', () => clearInterval(interval));
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));