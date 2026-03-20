const express   = require('express');
const jwt       = require('jsonwebtoken');
const Watchlist = require('../models/Watchlist');
const router    = express.Router();

const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try { req.user = jwt.verify(token, process.env.JWT_SECRET); next(); }
  catch { res.status(401).json({ error: 'Invalid token' }); }
};

// Get full watchlist
router.get('/', auth, async (req, res) => {
  try {
    let w = await Watchlist.findOne({ user: req.user.id });
    if (!w) w = await Watchlist.create({ user: req.user.id, symbols: [], cryptos: [], commodities: [] });
    res.json({ symbols: w.symbols || [], cryptos: w.cryptos || [], commodities: w.commodities || [] });
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

// Add stock
router.post('/add', auth, async (req, res) => {
  try {
    const { symbol } = req.body;
    let w = await Watchlist.findOne({ user: req.user.id });
    if (!w) w = await Watchlist.create({ user: req.user.id, symbols: [], cryptos: [], commodities: [] });
    if (!w.symbols.includes(symbol.toUpperCase())) {
      w.symbols.push(symbol.toUpperCase());
      await w.save();
    }
    res.json({ symbols: w.symbols, cryptos: w.cryptos || [], commodities: w.commodities || [] });
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

// Remove stock
router.post('/remove', auth, async (req, res) => {
  try {
    const { symbol } = req.body;
    let w = await Watchlist.findOne({ user: req.user.id });
    if (w) { w.symbols = w.symbols.filter(s => s !== symbol); await w.save(); }
    res.json({ symbols: w.symbols, cryptos: w.cryptos || [], commodities: w.commodities || [] });
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

// Add crypto
router.post('/crypto/add', auth, async (req, res) => {
  try {
    const { id } = req.body;
    let w = await Watchlist.findOne({ user: req.user.id });
    if (!w) w = await Watchlist.create({ user: req.user.id, symbols: [], cryptos: [], commodities: [] });
    if (!w.cryptos) w.cryptos = [];
    if (!w.cryptos.includes(id)) { w.cryptos.push(id); await w.save(); }
    res.json({ symbols: w.symbols, cryptos: w.cryptos, commodities: w.commodities || [] });
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

// Remove crypto
router.post('/crypto/remove', auth, async (req, res) => {
  try {
    const { id } = req.body;
    let w = await Watchlist.findOne({ user: req.user.id });
    if (w) { w.cryptos = (w.cryptos || []).filter(c => c !== id); await w.save(); }
    res.json({ symbols: w.symbols, cryptos: w.cryptos, commodities: w.commodities || [] });
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

// Add commodity
router.post('/commodity/add', auth, async (req, res) => {
  try {
    const { id } = req.body;
    let w = await Watchlist.findOne({ user: req.user.id });
    if (!w) w = await Watchlist.create({ user: req.user.id, symbols: [], cryptos: [], commodities: [] });
    if (!w.commodities) w.commodities = [];
    if (!w.commodities.includes(id)) { w.commodities.push(id); await w.save(); }
    res.json({ symbols: w.symbols, cryptos: w.cryptos || [], commodities: w.commodities });
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

// Remove commodity
router.post('/commodity/remove', auth, async (req, res) => {
  try {
    const { id } = req.body;
    let w = await Watchlist.findOne({ user: req.user.id });
    if (w) { w.commodities = (w.commodities || []).filter(c => c !== id); await w.save(); }
    res.json({ symbols: w.symbols, cryptos: w.cryptos || [], commodities: w.commodities });
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

module.exports = router;