const express = require('express');
const router = express.Router();

async function fetchYahooQuote(symbol) {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;
    const res = await fetch(url);
    const data = await res.json();
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
    return null;
  }
}

router.get('/indices', async (req, res) => {
  const symbols = ['^NSEI', '^BSESN', '^NSEBANK', '^NSEIT'];
  const results = {};
  for (const sym of symbols) {
    const data = await fetchYahooQuote(sym);
    results[sym] = data || { price: null, change: null, changePercent: null };
  }
  res.json(results);
});

router.get('/movers', async (req, res) => {
  const nifty = [
    'RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'INFY.NS', 'ICICIBANK.NS',
    'HINDUNILVR.NS', 'ITC.NS', 'SBIN.NS', 'BHARTIARTL.NS', 'KOTAKBANK.NS',
    'AXISBANK.NS', 'LT.NS', 'WIPRO.NS', 'ASIANPAINT.NS', 'HCLTECH.NS'
  ];
  const stocks = [];
  for (const sym of nifty) {
    const quote = await fetchYahooQuote(sym);
    if (quote?.price) {
      stocks.push({
        symbol: sym.replace('.NS', ''),
        price: quote.price.toFixed(2),
        changePercent: quote.changePercent.toFixed(2),
      });
    }
    await new Promise(r => setTimeout(r, 150));
  }
  const gainers = [...stocks].sort((a,b) => b.changePercent - a.changePercent).slice(0,10);
  const losers = [...stocks].sort((a,b) => a.changePercent - b.changePercent).slice(0,10);
  res.json({ gainers, losers });
});

router.get('/search/:query', async (req, res) => {
  try {
    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${req.params.query}&quotesCount=20`;
    const response = await fetch(url);
    const data = await response.json();
    const quotes = data.quotes || [];
    const stocks = quotes
      .filter(q => ['EQUITY', 'INDEX', 'CURRENCY', 'CRYPTOCURRENCY', 'ETF', 'MUTUALFUND'].includes(q.quoteType))
      .slice(0,15)
      .map(q => ({
        symbol: q.symbol, // Keep exact symbol for fetching
        name: q.longname || q.shortname || q.symbol,
        exchange: q.exchange,
        type: q.quoteType
      }));
    res.json(stocks);
  } catch (err) {
    res.status(500).json([]);
  }
});

router.get('/stock/:symbol', async (req, res) => {
  const { symbol } = req.params;
  let fetchSymbol = symbol.toUpperCase();
  
  // Mapping common Indian indices to Yahoo Finance symbols
  const indexMap = {
    'NIFTY50': '^NSEI',
    'NIFTY': '^NSEI',
    'SENSEX': '^BSESN',
    'BANKNIFTY': '^NSEBANK',
    'NIFTYBANK': '^NSEBANK',
    'NIFTYIT': '^NSEIT'
  };
  
  if (indexMap[fetchSymbol]) {
    fetchSymbol = indexMap[fetchSymbol];
  } else if (!fetchSymbol.includes('.') && !fetchSymbol.includes('=') && !fetchSymbol.includes('-') && !fetchSymbol.startsWith('^')) {
    fetchSymbol = `${fetchSymbol}.NS`; // default to NSE
  }
  
  const quote = await fetchYahooQuote(fetchSymbol);
  if (!quote || !quote.price) return res.status(404).json({ error: 'Stock not found' });
  res.json({
    symbol, // Return requested symbol back to match frontend states
    fetchSymbol,
    price: quote.price.toFixed(2),
    change: quote.change.toFixed(2),
    changePercent: quote.changePercent.toFixed(2),
    dayHigh: quote.dayHigh?.toFixed(2),
    dayLow: quote.dayLow?.toFixed(2),
    volume: quote.volume,
  });
});

router.get('/stock-list', async (req, res) => {
  const symbols = ['RELIANCE','TCS','HDFCBANK','INFY','ICICIBANK','HINDUNILVR','ITC','SBIN','BHARTIARTL','KOTAKBANK','AXISBANK','LT','WIPRO','ASIANPAINT','HCLTECH','TITAN','SUNPHARMA','MARUTI','BAJFINANCE','NESTLEIND'];
  const results = [];
  for (const sym of symbols) {
    const quote = await fetchYahooQuote(`${sym}.NS`);
    if (quote?.price) {
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

router.get('/crypto', async (req, res) => {
  const symbols = ['BTC-USD', 'ETH-USD', 'SOL-USD', 'BNB-USD', 'XRP-USD', 'DOGE-USD'];
  const results = [];
  for (const sym of symbols) {
    const quote = await fetchYahooQuote(sym);
    if (quote?.price) {
      results.push({
        symbol: sym,
        name: sym.replace('-USD', ''),
        price: quote.price.toLocaleString(),
        change: quote.changePercent.toFixed(2),
        up: quote.change >= 0,
      });
    }
    await new Promise(r => setTimeout(r, 100));
  }
  res.json(results.length > 0 ? results : []);
});

router.get('/futures', async (req, res) => {
  const quote1 = await fetchYahooQuote('^NSEI') || { price: 22480.50, changePercent: 0.85 };
  const quote2 = await fetchYahooQuote('^NSEBANK') || { price: 48250.30, changePercent: -0.28 };
  
  res.json({
    pcr: '1.24',
    nifty: { price: quote1.price, change: quote1.changePercent, oi: '45.2L' },
    banknifty: { price: quote2.price, change: quote2.changePercent, oi: '32.5L' }
  });
});

const NEWS_API_KEY = process.env.NEWS_API_KEY;
router.get('/news', async (req, res) => {
  if (!NEWS_API_KEY) return res.status(500).json({ error: 'News API key missing' });
  try {
    const url = `https://newsapi.org/v2/everything?q=stock%20market%20OR%20nifty%20OR%20sensex&language=en&sortBy=publishedAt&apiKey=${NEWS_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    if (data.status === 'ok') {
      const articles = data.articles.slice(0,20).map(a => ({
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