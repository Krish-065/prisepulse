const express = require('express');
const finnhubService = require('../services/finnhubService');
const chartService = require('../services/chartService');
const nseService = require('../services/nseService');
const router = express.Router();

// Stock search
router.get('/stocks/search', async (req, res) => {
  try {
    const q = req.query.q;
    // Use Finnhub or NSE for search
    // This is a simplified example
    res.json({ results: [] });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get stock details
router.get('/stocks/:symbol', async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const [profile, quote, financials, recommendations] = await Promise.all([
      finnhubService.getCompanyProfile(symbol),
      finnhubService.getQuote(symbol),
      finnhubService.getFinancials(symbol),
      finnhubService.getRecommendations(symbol)
    ]);
    
    res.json({ profile, quote, financials, recommendations });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get chart data with timeframe
router.get('/stocks/:symbol/chart', async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const timeframe = req.query.timeframe || '1min';
    const limit = req.query.limit || 200;
    
    const candles = await chartService.getCandles(symbol, timeframe, limit);
    res.json(candles);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get indices
router.get('/indices', async (req, res) => {
  try {
    const niftyData = await nseService.getNifty50();
    res.json(niftyData);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;