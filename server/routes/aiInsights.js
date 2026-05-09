const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');

// Get AI insights
router.get('/stocks/:symbol', verifyToken, async (req, res) => {
  try {
    const { symbol } = req.params;
    
    // Mock AI analysis
    const insights = {
      symbol,
      sentiment: 'Bullish',
      sentimentScore: 78,
      recommendation: 'BUY',
      targets: {
        short: 3900,
        medium: 4200,
        long: 4600
      },
      keyFactors: [
        'Strong quarterly earnings growth',
        'Consistent revenue expansion',
        'Market leadership position',
        'Favorable industry trends'
      ],
      risks: [
        'Global economic slowdown',
        'Currency fluctuations',
        'Increased competition'
      ],
      technicalAnalysis: {
        trend: 'Uptrend',
        support: 3750,
        resistance: 4050,
        signal: 'Strong Buy'
      },
      fundamentalAnalysis: {
        peRatio: 28.5,
        peGrowth: 1.85,
        roE: 22.5,
        freeFlow: 'Strong'
      },
      summary: `${symbol} shows strong fundamentals with consistent growth. Technical indicators suggest continued upside potential with good support levels.`
    };
    
    res.json(insights);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get portfolio AI analysis
router.get('/portfolio', verifyToken, async (req, res) => {
  try {
    const analysis = {
      portfolioHealth: 'Excellent',
      diversification: 85,
      recommendations: [
        'Consider increasing allocation to emerging sectors',
        'Rebalance to maintain target allocations',
        'Review high-volatility positions'
      ],
      riskLevel: 'Moderate',
      expectedReturn: '18-22%',
      topOpportunities: ['TCS', 'INFY', 'HDFC'],
      assetsToSell: ['SBIN'],
      insights: 'Your portfolio is well-balanced with good growth potential'
    };
    
    res.json(analysis);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get market insights
router.get('/market/trends', async (req, res) => {
  try {
    const trends = {
      date: new Date(),
      sectors: [
        { name: 'Information Technology', sentiment: 'Bullish', change: 2.5 },
        { name: 'Financial Services', sentiment: 'Neutral', change: 0.8 },
        { name: 'Consumer Discretionary', sentiment: 'Bullish', change: 1.9 },
        { name: 'Energy', sentiment: 'Bearish', change: -1.2 },
        { name: 'Healthcare', sentiment: 'Bullish', change: 2.1 }
      ],
      marketSentiment: 'Optimistic',
      volatilityIndex: 18.5,
      prediction: 'Uptrend expected'
    };
    
    res.json(trends);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
