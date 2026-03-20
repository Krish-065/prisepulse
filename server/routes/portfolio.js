const express   = require('express');
const jwt       = require('jsonwebtoken');
const Portfolio = require('../models/Portfolio');
const router    = express.Router();

const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try { req.user = jwt.verify(token, process.env.JWT_SECRET); next(); }
  catch { res.status(401).json({ error: 'Invalid token' }); }
};

router.get('/', auth, async (req, res) => {
  try {
    let p = await Portfolio.findOne({ user: req.user.id });
    if (!p) p = await Portfolio.create({ user: req.user.id, holdings: [] });
    res.json(p.holdings);
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

router.post('/add', auth, async (req, res) => {
  try {
    const { symbol, name, quantity, buyPrice, type } = req.body;
    let p = await Portfolio.findOne({ user: req.user.id });
    if (!p) p = await Portfolio.create({ user: req.user.id, holdings: [] });
    p.holdings.push({
      symbol:   type === 'stock' ? symbol.toUpperCase() : symbol,
      name,
      quantity: Number(quantity),
      buyPrice: Number(buyPrice),
      type:     type || 'stock'
    });
    await p.save();
    res.json(p.holdings);
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

router.post('/remove', auth, async (req, res) => {
  try {
    const { id } = req.body;
    let p = await Portfolio.findOne({ user: req.user.id });
    if (p) { p.holdings = p.holdings.filter(h => h._id.toString() !== id); await p.save(); }
    res.json(p.holdings);
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

module.exports = router;