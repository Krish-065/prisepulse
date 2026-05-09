const express = require('express');
const router = express.Router();
const finnhubService = require('../services/finnhubService');
const alphaVantageService = require('../services/alphaVantageService');
const { verifyToken } = require('../middleware/auth');

// Get IPO Calendar
router.get('/calendar', async (req, res) => {
  try {
    // Mock IPO data for 2024-2025
    const ipos = [
      {
        symbol: 'NEWCO',
        company: 'NewCo Industries',
        sector: 'Technology',
        ipoDate: '2024-05-15',
        price: 25,
        shares: 5000000,
        raised: 125000000,
        lead: 'Goldman Sachs',
        status: 'priced'
      },
      {
        symbol: 'TECH1',
        company: 'TechVision Inc',
        sector: 'Software',
        ipoDate: '2024-06-20',
        price: 35,
        shares: 8000000,
        raised: 280000000,
        lead: 'Morgan Stanley',
        status: 'upcoming'
      },
      {
        symbol: 'HEALTH1',
        company: 'HealthTech Solutions',
        sector: 'Healthcare',
        ipoDate: '2024-07-10',
        price: 28,
        shares: 6000000,
        raised: 168000000,
        lead: 'JPMorgan',
        status: 'upcoming'
      },
      {
        symbol: 'GREEN1',
        company: 'GreenEnergy Corp',
        sector: 'Energy',
        ipoDate: '2024-08-05',
        price: 40,
        shares: 4000000,
        raised: 160000000,
        lead: 'BofA Securities',
        status: 'upcoming'
      },
      {
        symbol: 'FIN1',
        company: 'FinTech Global',
        sector: 'Finance',
        ipoDate: '2024-09-12',
        price: 30,
        shares: 7000000,
        raised: 210000000,
        lead: 'Barclays',
        status: 'upcoming'
      }
    ];
    
    res.json(ipos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add IPO to watchlist
router.post('/watchlist/:symbol', verifyToken, async (req, res) => {
  try {
    // This would integrate with watchlist model
    res.json({ message: `${req.params.symbol} added to IPO watchlist` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
