// server/routes/news.js
// Already registered in index.js as: app.use('/api/news', require('./routes/news'));

const express = require('express');
const router  = express.Router();
const axios   = require('axios');

// 15-min cache — stays within 100 req/day free limit comfortably
let newsCache     = null;
let newsCacheTime = 0;
const CACHE_TTL   = 15 * 60 * 1000;

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

    // Strictly financial keywords — no crime, sports, politics, entertainment
    // domains= locks results to trusted financial news outlets only
    const result = await axios.get(
      'https://newsapi.org/v2/everything' +
      '?q=(stock+OR+sensex+OR+nifty+OR+crypto+OR+bitcoin+OR+ethereum+OR+"mutual+fund"+OR+RBI+OR+IPO+OR+earnings+OR+commodity+OR+"crude+oil"+OR+gold+OR+silver+OR+"share+market"+OR+inflation+OR+rupee+OR+"stock+market"+OR+economy+OR+SEBI+OR+NSE+OR+BSE+OR+"interest+rate"+OR+"market+cap"+OR+dividend+OR+FII+OR+DII)' +
      '&domains=economictimes.indiatimes.com,livemint.com,moneycontrol.com,business-standard.com,financialexpress.com,reuters.com,bloomberg.com,coindesk.com,cointelegraph.com,ndtvprofit.com,thehindubusinessline.com' +
      '&sortBy=publishedAt' +
      '&pageSize=100' +
      '&language=en' +
      '&apiKey=' + KEY,
      { timeout: 15000 }
    );

    const articles = (result.data.articles || [])
      .filter(function(a) {
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

    newsCache     = articles;
    newsCacheTime = Date.now();

    console.log('[News] Fetched', articles.length, 'articles from NewsAPI');
    res.json(articles);

  } catch (err) {
    console.log('[News] Error:', err.message);
    if (newsCache && newsCache.length > 0) {
      console.log('[News] Serving', newsCache.length, 'stale cached articles');
      return res.json(newsCache);
    }
    res.status(500).json({ error: 'Failed to fetch news: ' + err.message });
  }
});

module.exports = router;