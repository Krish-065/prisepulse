const express = require('express');
const router = express.Router();
const yahooFinance = require('yahoo-finance2').default;

// Helper function to fetch a quote from Yahoo Finance
async function fetchQuote(symbol) {
  try {
    const quote = await yahooFinance.quote(symbol);
    return {
      price: quote.regularMarketPrice,
      change: quote.regularMarketChange,
      changePercent: quote.regularMarketChangePercent,
      dayHigh: quote.regularMarketDayHigh,
      dayLow: quote.regularMarketDayLow,
      volume: quote.regularMarketVolume,
    };
  } catch (err) {
    console.error(`Yahoo error for ${symbol}:`, err.message);
    return null;
  }
}

// GET /market/indices
router.get('/indices', async (req, res) => {
  const symbols = ['^NSEI', '^BSESN', '^NSEBANK', '^NSEIT'];
  const results = {};
  for (const sym of symbols) {
    const data = await fetchQuote(sym);
    results[sym] = data || { price: null, change: null, changePercent: null };
  }
  res.json(results);
});

// GET /market/movers (top gainers/losers from NIFTY 50)
router.get('/movers', async (req, res) => {
  const niftyStocks = [
    'RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'INFY.NS', 'ICICIBANK.NS',
    'HINDUNILVR.NS', 'ITC.NS', 'SBIN.NS', 'BHARTIARTL.NS', 'KOTAKBANK.NS',
    'AXISBANK.NS', 'LT.NS', 'WIPRO.NS', 'ASIANPAINT.NS', 'HCLTECH.NS',
    'TITAN.NS', 'SUNPHARMA.NS', 'MARUTI.NS', 'BAJFINANCE.NS', 'NESTLEIND.NS'
  ];
  const stocks = [];
  for (const sym of niftyStocks) {
    const quote = await fetchQuote(sym);
    if (quote && quote.price) {
      stocks.push({
        symbol: sym.replace('.NS', ''),
        price: quote.price.toFixed(2),
        changePercent: quote.changePercent.toFixed(2)
      });
    }
    await new Promise(r => setTimeout(r, 150)); // rate limit
  }
  const gainers = [...stocks].sort((a,b) => b.changePercent - a.changePercent).slice(0, 10);
  const losers = [...stocks].sort((a,b) => a.changePercent - b.changePercent).slice(0, 10);
  res.json({ gainers, losers });
});

// GET /market/search/:query
router.get('/search/:query', async (req, res) => {
  try {
    const result = await yahooFinance.search(req.params.query);
    const stocks = result.quotes
      .filter(q => q.quoteType === 'EQUITY' && (q.exchange === 'NSI' || q.exchange === 'BSE'))
      .slice(0, 15)
      .map(q => ({
        symbol: q.symbol.replace('.NS', '').replace('.BO', ''),
        name: q.longname || q.shortname,
        exchange: q.exchange
      }));
    res.json(stocks);
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json([]);
  }
});

// GET /market/crypto
router.get('/crypto', async (req, res) => {
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=inr&ids=bitcoin,ethereum,solana&order=market_cap_desc&sparkline=false');
    const data = await response.json();
    const mapped = data.map(c => ({
      symbol: c.symbol.toUpperCase(),
      name: c.name,
      price: c.current_price?.toLocaleString(),
      change: c.price_change_percentage_24h?.toFixed(2),
      up: c.price_change_percentage_24h >= 0
    }));
    res.json(mapped);
  } catch (err) {
    console.error('Crypto error:', err);
    res.status(500).json([]);
  }
});

// GET /market/news (uses NewsAPI key from .env)
router.get('/news', async (req, res) => {
  const NEWS_API_KEY = process.env.NEWS_API_KEY;
  if (!NEWS_API_KEY) {
    return res.status(500).json({ error: 'News API key not configured' });
  }
  try {
    const url = `https://newsapi.org/v2/everything?q=stock%20market%20OR%20nifty%20OR%20sensex&language=en&sortBy=publishedAt&apiKey=${NEWS_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    if (data.status === 'ok') {
      const articles = data.articles.slice(0, 20).map(article => ({
        title: article.title,
        description: article.description,
        time: new Date(article.publishedAt).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' }),
        date: new Date(article.publishedAt).toLocaleDateString(),
        url: article.url,
        source: article.source.name,
        image: article.urlToImage
      }));
      res.json(articles);
    } else {
      res.status(500).json({ error: data.message });
    }
  } catch (err) {
    console.error('News error:', err);
    res.status(500).json({ error: 'Failed to fetch news' });
  }
});

// GET /market/stock-list (NIFTY 50 stocks for screener)
router.get('/stock-list', async (req, res) => {
  const symbols = ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK', 'HINDUNILVR', 'ITC', 'SBIN', 'BHARTIARTL', 'KOTAKBANK', 'AXISBANK', 'LT', 'WIPRO', 'ASIANPAINT', 'HCLTECH', 'TITAN', 'SUNPHARMA', 'MARUTI', 'BAJFINANCE', 'NESTLEIND'];
  const results = [];
  for (const sym of symbols) {
    const quote = await fetchQuote(`${sym}.NS`);
    if (quote && quote.price) {
      results.push({
        symbol: sym,
        price: quote.price.toFixed(2),
        change: quote.change.toFixed(2),
        changePercent: quote.changePercent.toFixed(2),
        dayHigh: quote.dayHigh?.toFixed(2),
        dayLow: quote.dayLow?.toFixed(2),
        volume: quote.volume
      });
    }
    await new Promise(r => setTimeout(r, 100));
  }
  res.json(results);
});

// GET /market/stock/:symbol (single stock detail)
router.get('/stock/:symbol', async (req, res) => {
  const { symbol } = req.params;
  const quote = await fetchQuote(`${symbol}.NS`);
  if (!quote) {
    return res.status(404).json({ error: 'Stock not found' });
  }
  res.json({
    symbol,
    price: quote.price.toFixed(2),
    change: quote.change.toFixed(2),
    changePercent: quote.changePercent.toFixed(2),
    dayHigh: quote.dayHigh?.toFixed(2),
    dayLow: quote.dayLow?.toFixed(2),
    volume: quote.volume
  });
});

module.exports = router;