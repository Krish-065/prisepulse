const express = require('express');
const axios   = require('axios');
const router  = express.Router();

const KEY = process.env.ALPHA_VANTAGE_KEY;

// Get real stock quote
router.get('/quote/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}.BSE&apikey=${KEY}`;
    const { data } = await axios.get(url);
    const quote = data['Global Quote'];

    if (!quote || !quote['05. price']) {
      return res.status(404).json({ error: 'Stock not found' });
    }

    res.json({
      symbol:  quote['01. symbol'],
      price:   parseFloat(quote['05. price']).toFixed(2),
      change:  parseFloat(quote['09. change']).toFixed(2),
      changePct: quote['10. change percent'],
      high:    parseFloat(quote['03. high']).toFixed(2),
      low:     parseFloat(quote['04. low']).toFixed(2),
      volume:  quote['06. volume'],
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch price' });
  }
});

// Get multiple quotes at once
router.post('/quotes', async (req, res) => {
  try {
    const { symbols } = req.body;
    const results = await Promise.all(
      symbols.map(async (symbol) => {
        const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}.BSE&apikey=${KEY}`;
        const { data } = await axios.get(url);
        const quote = data['Global Quote'];
        if (!quote || !quote['05. price']) return { symbol, error: true };
        return {
          symbol,
          price:     parseFloat(quote['05. price']).toFixed(2),
          change:    parseFloat(quote['09. change']).toFixed(2),
          changePct: quote['10. change percent'],
        };
      })
    );
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch prices' });
  }
});

module.exports = router;