const express = require('express');
const router = express.Router();
const finnhubService = require('../services/finnhubService');
const alphaVantageService = require('../services/alphaVantageService');

// Compare stocks
router.get('/', async (req, res) => {
  try {
    const { symbols } = req.query;
    if (!symbols) return res.status(400).json({ error: 'Symbols required' });
    
    const symbolArray = Array.isArray(symbols) ? symbols : [symbols];
    const comparisons = [];
    
    for (const symbol of symbolArray) {
      try {
        const quote = await finnhubService.getQuote(symbol);
        comparisons.push({
          symbol,
          price: quote.c,
          change: quote.d,
          changePercent: quote.dp,
          bid: quote.bids?.[0]?.p,
          ask: quote.asks?.[0]?.p
        });
      } catch (err) {
        console.log(`Error fetching ${symbol}:`, err.message);
      }
    }
    
    res.json(comparisons);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Compare metrics
router.get('/metrics', async (req, res) => {
  try {
    const { symbols } = req.query;
    if (!symbols) return res.status(400).json({ error: 'Symbols required' });
    
    const symbolArray = Array.isArray(symbols) ? symbols : [symbols];
    const metricsData = [];
    
    for (const symbol of symbolArray) {
      try {
        const profile = await finnhubService.getCompanyProfile(symbol);
        metricsData.push({
          symbol,
          pe: profile.pe,
          pb: profile.pb,
          ps: profile.ps,
          dividend: profile.dividendYield,
          roe: profile.roe,
          debt: profile.debt,
          industry: profile.finnhubIndustry,
          marketCap: profile.marketCapitalization
        });
      } catch (err) {
        console.log(`Error fetching metrics for ${symbol}:`, err.message);
      }
    }
    
    res.json(metricsData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
