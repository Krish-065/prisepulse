const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');

// Mock mutual fund data
const MUTUAL_FUNDS = [
  { id: 1, name: 'SBI Bluechip Fund', nav: 125.45, returns1Y: 18.5, returns3Y: 22.3, category: 'Large Cap', expense: 0.51 },
  { id: 2, name: 'HDFC Top 100 Fund', nav: 98.20, returns1Y: 16.8, returns3Y: 21.5, category: 'Large Cap', expense: 0.45 },
  { id: 3, name: 'ICICI Balanced Fund', nav: 112.30, returns1Y: 15.2, returns3Y: 19.8, category: 'Balanced', expense: 0.68 },
  { id: 4, name: 'Axis Midcap Fund', nav: 87.65, returns1Y: 22.1, returns3Y: 28.5, category: 'Midcap', expense: 0.74 },
  { id: 5, name: 'Nippon India Small Cap', nav: 156.20, returns1Y: 28.3, returns3Y: 35.2, category: 'Small Cap', expense: 1.05 },
  { id: 6, name: 'Franklin Smaller Companies', nav: 134.50, returns1Y: 25.7, returns3Y: 32.1, category: 'Small Cap', expense: 1.15 },
  { id: 7, name: 'Kotak Emerging Equities', nav: 112.80, returns1Y: 24.5, returns3Y: 29.3, category: 'Mid Cap', expense: 0.95 },
  { id: 8, name: 'Motilal Oswal Multicap', nav: 98.45, returns1Y: 20.3, returns3Y: 24.7, category: 'Multi Cap', expense: 0.82 }
];

// GET all funds
router.get('/', async (req, res) => {
  try {
    const { category, sortBy = 'returns1Y' } = req.query;
    let funds = [...MUTUAL_FUNDS];
    
    if (category) {
      funds = funds.filter(f => f.category === category);
    }
    
    if (sortBy === 'returns1Y') {
      funds.sort((a, b) => b.returns1Y - a.returns1Y);
    } else if (sortBy === 'returns3Y') {
      funds.sort((a, b) => b.returns3Y - a.returns3Y);
    } else if (sortBy === 'expense') {
      funds.sort((a, b) => a.expense - b.expense);
    }
    
    res.json(funds);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET fund details
router.get('/:id', async (req, res) => {
  try {
    const fund = MUTUAL_FUNDS.find(f => f.id == req.params.id);
    if (!fund) return res.status(404).json({ error: 'Fund not found' });
    
    const details = {
      ...fund,
      returns6M: 12.3,
      returns5Y: 18.7,
      aum: 2500000000,
      holdingsCount: 45,
      topHoldings: ['TCS', 'Infosys', 'HDFC Bank', 'ICICI Bank', 'Reliance'],
      riskRating: 'Moderate',
      sortino: 1.85
    };
    
    res.json(details);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET fund categories
router.get('/categories/list', async (req, res) => {
  try {
    const categories = [
      'Large Cap',
      'Mid Cap',
      'Small Cap',
      'Multi Cap',
      'Balanced',
      'Equity Linked Savings',
      'Sector Specific',
      'Index Funds'
    ];
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ADD to watchlist
router.post('/:id/watchlist', verifyToken, async (req, res) => {
  try {
    res.json({ message: 'Mutual fund added to watchlist' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
