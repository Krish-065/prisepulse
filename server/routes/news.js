// server/routes/news.js
// Already registered in index.js as: app.use('/api/news', require('./routes/news'));

const express = require('express');
const router  = express.Router();
const axios   = require('axios');

// Cache — 15 min so we stay well within 100 req/day free limit
let newsCache     = null;
let newsCacheTime = 0;
const CACHE_TTL   = 15 * 60 * 1000; // 15 minutes

router.get('/', async function(req, res) {
  try {
    const KEY = process.env.NEWS_API_KEY;

    if (!KEY || KEY.trim() === '' || KEY === 'your_newsapi_key_here') {
      return res.status(503).json({ error: 'NEWS_API_KEY not configured in server .env' });
    }

    // Serve from cache if still fresh
    if (newsCache && Date.now() - newsCacheTime < CACHE_TTL) {
      return res.json(newsCache);
    }

    // Broad query — covers stocks, crypto, economy, IPO, earnings, RBI, mutual funds
    // Using OR so NewsAPI finds articles matching ANY of these terms = more results
    const result = await axios.get(
      'https://newsapi.org/v2/everything' +
      '?q=(stock OR market OR crypto OR bitcoin OR economy OR finance OR RBI OR sensex OR nifty OR IPO OR earnings OR "mutual fund" OR rupee OR inflation)' +
      '&sortBy=publishedAt' +
      '&pageSize=100' +
      '&language=en' +
      '&apiKey=' + KEY,
      { timeout: 15000 }
    );

    const articles = (result.data.articles || [])
      .filter(function(a) {
        // Remove deleted/removed articles and ones with no URL
        return a.title &&
               a.title !== '[Removed]' &&
               a.url &&
               a.source &&
               a.source.name !== '[Removed]';
      })
      .map(function(a) {
        return {
          title:       a.title,
          source:      a.source.name,
          url:         a.url,
          image:       a.urlToImage || null,
          time:        a.publishedAt,
          description: a.description || '',
        };
      });

    // Update cache
    newsCache     = articles;
    newsCacheTime = Date.now();

    console.log('[News] Fetched', articles.length, 'articles from NewsAPI');
    res.json(articles);

  } catch (err) {
    console.log('[News] Error:', err.message);
    // Serve stale cache on error — better than empty page
    if (newsCache && newsCache.length > 0) {
      console.log('[News] Serving', newsCache.length, 'cached articles');
      return res.json(newsCache);
    }
    res.status(500).json({ error: 'Failed to fetch news: ' + err.message });
  }
});

module.exports = router;