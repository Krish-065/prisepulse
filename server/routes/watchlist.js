const express   = require('express');
const jwt       = require('jsonwebtoken');
const Watchlist = require('../models/Watchlist');
const router    = express.Router();

// Middleware to verify token
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Get watchlist
router.get('/', auth, async (req, res) => {
  try {
    let watchlist = await Watchlist.findOne({ user: req.user.id });
    if (!watchlist) watchlist = await Watchlist.create({ user: req.user.id, symbols: [] });
    res.json(watchlist.symbols);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get watchlist' });
  }
});

// Add stock
router.post('/add', auth, async (req, res) => {
  try {
    const { symbol } = req.body;
    let watchlist = await Watchlist.findOne({ user: req.user.id });
    if (!watchlist) watchlist = await Watchlist.create({ user: req.user.id, symbols: [] });
    if (!watchlist.symbols.includes(symbol)) {
      watchlist.symbols.push(symbol.toUpperCase());
      await watchlist.save();
    }
    res.json(watchlist.symbols);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add stock' });
  }
});

// Remove stock
router.post('/remove', auth, async (req, res) => {
  try {
    const { symbol } = req.body;
    let watchlist = await Watchlist.findOne({ user: req.user.id });
    if (watchlist) {
      watchlist.symbols = watchlist.symbols.filter(s => s !== symbol);
      await watchlist.save();
    }
    res.json(watchlist.symbols);
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove stock' });
  }
});

module.exports = router;