const express   = require('express');
const jwt       = require('jsonwebtoken');
const Portfolio = require('../models/Portfolio');
const router    = express.Router();

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

// Get portfolio
router.get('/', auth, async (req, res) => {
  try {
    let portfolio = await Portfolio.findOne({ user: req.user.id });
    if (!portfolio) portfolio = await Portfolio.create({ user: req.user.id, holdings: [] });
    res.json(portfolio.holdings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get portfolio' });
  }
});

// Add holding
router.post('/add', auth, async (req, res) => {
  try {
    const { symbol, name, quantity, buyPrice } = req.body;
    let portfolio = await Portfolio.findOne({ user: req.user.id });
    if (!portfolio) portfolio = await Portfolio.create({ user: req.user.id, holdings: [] });
    portfolio.holdings.push({ symbol: symbol.toUpperCase(), name, quantity, buyPrice });
    await portfolio.save();
    res.json(portfolio.holdings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add holding' });
  }
});

// Remove holding
router.post('/remove', auth, async (req, res) => {
  try {
    const { id } = req.body;
    let portfolio = await Portfolio.findOne({ user: req.user.id });
    if (portfolio) {
      portfolio.holdings = portfolio.holdings.filter(h => h._id.toString() !== id);
      await portfolio.save();
    }
    res.json(portfolio.holdings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove holding' });
  }
});

module.exports = router;