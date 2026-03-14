const express = require('express');
const router  = express.Router();

const NEWS = [
  { tag: 'MARKETS',     headline: 'Nifty eyes 22,500 resistance; FII inflows boost sentiment', time: '30m ago' },
  { tag: 'EARNINGS',    headline: 'Reliance Q3 net profit surges 18% YoY to ₹18,540 Cr',       time: '1h ago' },
  { tag: 'CRYPTO',      headline: 'Bitcoin crosses $82K on ETF inflow surge',                   time: '2h ago' },
  { tag: 'IPO',         headline: 'Hyundai India IPO oversubscribed 2.4x on Day 2',             time: '3h ago' },
  { tag: 'COMMODITIES', headline: 'Gold hits ₹71,240/10g on safe-haven demand',                 time: '4h ago' },
];

router.get('/', (req, res) => {
  res.json(NEWS);
});

module.exports = router;