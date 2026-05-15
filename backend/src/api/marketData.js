const express = require('express');
const router = express.Router();

// Helper: fetch quote directly from Yahoo Finance
async function fetchQuote(symbol) {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;
    const response = await fetch(url);
    const data = await response.json();
    const result = data.chart.result[0];
    if (!result) return null;
    const meta = result.meta;
    const price = meta.regularMarketPrice;
    const prevClose = meta.previousClose;
    const change = price - prevClose;
    const changePercent = (change / prevClose) * 100;
    return {
      price,
      change,
      changePercent,
      dayHigh: meta.regularMarketDayHigh,
      dayLow: meta.regularMarketDayLow,
      volume: meta.regularMarketVolume,
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

// GET /market/movers
router.get('/movers', async (req, res) => {
  const niftyStocks = [
    'RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'INFY.NS', 'ICICIBANK.NS',
    'HINDUNILVR.NS', 'ITC.NS', 'SBIN.NS', 'BHARTIARTL.NS', 'KOTAKBANK.NS',
    'AXISBANK.NS', 'LT.NS', 'WIPRO.NS', 'ASIANPAINT.NS', 'HCLTECH.NS'
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
    await new Promise(r => setTimeout(r, 150));
  }
  const gainers = [...stocks].sort((a,b) => b.changePercent - a.changePercent).slice(0, 10);
  const losers = [...stocks].sort((a,b) => a.changePercent - b.changePercent).slice(0, 10);
  res.json({ gainers, losers });
});

// GET /market/search/:query – for autocomplete dropdown
router.get('/search/:query', async (req, res) => {
  try {
    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${req.params.query}&quotesCount=20&newsCount=0`;
    const response = await fetch(url);
    const data = await response.json();
    const quotes = data.quotes || [];
    const stocks = quotes
      .filter(q => q.quoteType === 'EQUITY' && (q.exchange === 'NSI' || q.exchange === 'BSE'))
      .slice(0, 15)
      .map(q => ({
        symbol: q.symbol.replace('.NS', '').replace('.BO', ''),
        name: q.longname || q.shortname,
        exchange: q.exchange
      }));
    res.json(stocks);
  } catch (err) {
    res.status(500).json([]);
  }
});

// GET /market/stock/:symbol
router.get('/stock/:symbol', async (req, res) => {
  const { symbol } = req.params;
  const quote = await fetchQuote(`${symbol}.NS`);
  if (!quote || !quote.price) {
    return res.status(404).json({ error: 'Stock not found' });
  }
  res.json({
    symbol,
    price: quote.price.toFixed(2),
    change: quote.change.toFixed(2),
    changePercent: quote.changePercent.toFixed(2),
    dayHigh: quote.dayHigh?.toFixed(2),
    dayLow: quote.dayLow?.toFixed(2),
    volume: quote.volume,
  });
});

// GET /market/stock-list (NIFTY 50)
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
        volume: quote.volume,
      });
    }
    await new Promise(r => setTimeout(r, 100));
  }
  res.json(results);
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
      up: c.price_change_percentage_24h >= 0,
    }));
    res.json(mapped);
  } catch (err) {
    res.status(500).json([]);
  }
});

// GET /market/news
const NEWS_API_KEY = process.env.NEWS_API_KEY;
router.get('/news', async (req, res) => {
  if (!NEWS_API_KEY) return res.status(500).json({ error: 'News API key missing' });
  try {
    const url = `https://newsapi.org/v2/everything?q=stock%20market%20OR%20nifty%20OR%20sensex&language=en&sortBy=publishedAt&apiKey=${NEWS_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    if (data.status === 'ok') {
      const articles = data.articles.slice(0, 20).map(a => ({
        title: a.title,
        description: a.description,
        time: new Date(a.publishedAt).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' }),
        url: a.url,
        source: a.source.name,
        image: a.urlToImage,
      }));
      res.json(articles);
    } else {
      res.status(500).json({ error: data.message });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch news' });
  }
});

module.exports = router;