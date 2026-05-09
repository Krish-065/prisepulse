const express = require('express');
const newsService = require('../services/newsServices');
const router = express.Router();

// GET /api/news
router.get('/', async (req, res) => {
  try {
    const page = req.query.page || 1;
    const data = await newsService.getTopNews(page);
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/news/search
router.get('/search', async (req, res) => {
  try {
    const q = req.query.q;
    if (!q) return res.status(400).json({ error: 'Query required' });
    const data = await newsService.searchNews(q);
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/news/symbol/:symbol
router.get('/symbol/:symbol', async (req, res) => {
  try {
    const data = await newsService.getNewsBySymbol(req.params.symbol);
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;