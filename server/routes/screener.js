const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const ScreenerResult = require('../models/ScreenerResults');

// GET screener results
router.get('/', verifyToken, async (req, res) => {
  try {
    const results = await ScreenerResult.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// RUN screener
router.post('/run', verifyToken, async (req, res) => {
  try {
    const { criteria, screenName } = req.body;
    
    // Mock screened stocks
    const mockStocks = [
      { symbol: 'TCS', name: 'Tata Consultancy Services', currentPrice: 3850, pe: 28.5, pb: 12.3, matchScore: 95 },
      { symbol: 'INFY', name: 'Infosys Limited', currentPrice: 1890, pe: 32.1, pb: 14.5, matchScore: 92 },
      { symbol: 'WIPRO', name: 'Wipro Limited', currentPrice: 420, pe: 18.2, pb: 6.8, matchScore: 88 },
      { symbol: 'HDFC', name: 'HDFC Bank Limited', currentPrice: 2750, pe: 21.5, pb: 2.8, matchScore: 85 }
    ];
    
    const result = new ScreenerResult({
      userId: req.user.id,
      screenName,
      criteria,
      results: mockStocks,
      totalMatches: mockStocks.length,
      lastRunAt: new Date()
    });
    
    await result.save();
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// SAVE screener
router.put('/:id/save', verifyToken, async (req, res) => {
  try {
    const result = await ScreenerResult.findByIdAndUpdate(
      req.params.id,
      { isSaved: true },
      { new: true }
    );
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
