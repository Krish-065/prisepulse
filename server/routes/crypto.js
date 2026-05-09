const express = require('express');
const coingeckoService = require('../services/coingeckoService');
const router = express.Router();

// GET /api/crypto/list
router.get('/list', async (req, res) => {
  try {
    const page = req.query.page || 1;
    const data = await coingeckoService.getMarkets(page);
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/crypto/:id
router.get('/:id', async (req, res) => {
  try {
    const data = await coingeckoService.getCryptoDetails(req.params.id);
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/crypto/:id/chart
router.get('/:id/chart', async (req, res) => {
  try {
    const days = req.query.days || 30;
    const data = await coingeckoService.getChartData(req.params.id, days);
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/crypto/trending
router.get('/trending', async (req, res) => {
  try {
    const data = await coingeckoService.getTrending();
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;