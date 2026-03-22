// server/routes/news.js
// News.jsx calls GET /api/news — register this in server/index.js as:
//   app.use('/api/news', require('./routes/news'));

const express  = require('express');
const router   = express.Router();
const axios    = require('axios');

// 10-min cache — keeps you safe within NewsAPI free tier (100 req/day)
let newsCache     = null;
let newsCacheTime = 0;
const CACHE_TTL   = 10 * 60 * 1000;

router.get('/', async function(req, res) {
  try {
    const KEY = process.env.NEWS_API_KEY;

    if (!KEY || KEY.trim() === '' || KEY === 'your_newsapi_key_here') {
      return res.status(503).json({ error: 'NEWS_API_KEY not configured in server .env' });
    }

    // Serve stale cache while fresh
    if (newsCache && Date.now() - newsCacheTime < CACHE_TTL) {
      return res.json(newsCache);
    }

    const result = await axios.get(
      'https://newsapi.org/v2/everything' +
      '?q=india+stock+market+nifty+sensex+economy+RBI+bitcoin+crypto+IPO+earnings' +
      '&sortBy=publishedAt' +
      '&pageSize=30' +
      '&language=en' +
      '&apiKey=' + KEY,
      { timeout: 12000 }
    );

    const articles = (result.data.articles || [])
      .filter(function(a) { return a.title && a.title !== '[Removed]' && a.url; })
      .map(function(a) {
        return {
          title:       a.title,
          source:      a.source.name,
          url:         a.url,
          image:       a.urlToImage,
          time:        a.publishedAt,
          description: a.description,
        };
      });

    newsCache     = articles;
    newsCacheTime = Date.now();
    res.json(articles);

  } catch (err) {
    console.log('NewsAPI error:', err.message);
    if (newsCache) return res.json(newsCache); // serve stale on error
    res.status(500).json({ error: 'Failed to fetch news' });
  }
});

module.exports = router;