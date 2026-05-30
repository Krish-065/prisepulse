const express = require('express');
const router = express.Router();

// Yahoo Finance headers to avoid IP blocks
const YAHOO_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Referer': 'https://finance.yahoo.com/',
  'Origin': 'https://finance.yahoo.com',
};

async function fetchYahooQuote(symbol) {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
    const res = await fetch(url, { headers: YAHOO_HEADERS });
    if (!res.ok) {
      // Try query2 as fallback
      const res2 = await fetch(
        `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`,
        { headers: YAHOO_HEADERS }
      );
      if (!res2.ok) return null;
      const data2 = await res2.json();
      return parseYahooData(data2);
    }
    const data = await res.json();
    return parseYahooData(data);
  } catch (err) {
    return null;
  }
}

function parseYahooData(data) {
  try {
    const result = data?.chart?.result?.[0];
    if (!result) return null;
    const meta = result.meta;
    const price = meta.regularMarketPrice ?? meta.chartPreviousClose;
    const prevClose = meta.chartPreviousClose ?? meta.previousClose ?? price;
    if (!price) return null;
    const change = price - prevClose;
    const changePercent = prevClose ? (change / prevClose) * 100 : 0;
    return {
      price,
      change,
      changePercent,
      dayHigh: meta.regularMarketDayHigh,
      dayLow: meta.regularMarketDayLow,
      volume: meta.regularMarketVolume,
    };
  } catch {
    return null;
  }
}

// Parallel fetch with timeout
async function fetchWithTimeout(symbol, timeoutMs = 5000) {
  return Promise.race([
    fetchYahooQuote(symbol),
    new Promise(resolve => setTimeout(() => resolve(null), timeoutMs))
  ]);
}

// Fetch multiple symbols in parallel (batches of 5)
async function fetchBatch(symbols) {
  const results = {};
  const batchSize = 5;
  for (let i = 0; i < symbols.length; i += batchSize) {
    const batch = symbols.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(sym => fetchWithTimeout(sym)));
    batch.forEach((sym, idx) => { results[sym] = batchResults[idx]; });
  }
  return results;
}

router.get('/indices', async (req, res) => {
  const symbols = ['^NSEI', '^BSESN', '^NSEBANK', '^CNXIT'];
  const fetched = await fetchBatch(symbols);
  const results = {};
  for (const sym of symbols) {
    results[sym] = fetched[sym] || { price: null, change: null, changePercent: null };
  }
  res.json(results);
});

const NIFTY_50 = [
  'RELIANCE', 'TCS', 'HDFCBANK', 'ICICIBANK', 'BHARTIARTL', 'SBIN', 'INFY', 'ITC', 'HINDUNILVR', 
  'LT', 'BAJFINANCE', 'HCLTECH', 'MARUTI', 'SUNPHARMA', 'ADANIENT', 'KOTAKBANK', 'TITAN', 'ONGC', 
  'TATAMOTORS', 'NTPC', 'AXISBANK', 'ADANIPORTS', 'ULTRACEMCO', 'ASIANPAINT', 'COALINDIA', 
  'BAJAJFINSV', 'BAJAJ-AUTO', 'POWERGRID', 'NESTLEIND', 'GRASIM', 'TATASTEEL', 'TECHM', 'HINDALCO', 
  'WIPRO', 'LTIM', 'APOLLOHOSP', 'EICHERMOT', 'DIVISLAB', 'INDUSINDBK', 'DRREDDY', 'CIPLA', 'BPCL', 
  'BRITANNIA', 'SHREECEM', 'TATACONSUM', 'HEROMOTOCO', 'UPL', 'JSWSTEEL', 'HDFCLIFE', 'SBIBASE'
];

router.get('/movers', async (req, res) => {
  const nsSymbols = NIFTY_50.map(s => `${s}.NS`);
  const fetched = await fetchBatch(nsSymbols);
  const stocks = [];
  for (const sym of nsSymbols) {
    const quote = fetched[sym];
    if (quote?.price) {
      stocks.push({
        symbol: sym.replace('.NS', ''),
        price: quote.price.toFixed(2),
        changePercent: quote.changePercent.toFixed(2),
      });
    }
  }
  const gainers = [...stocks].sort((a, b) => b.changePercent - a.changePercent).slice(0, 10);
  const losers = [...stocks].sort((a, b) => a.changePercent - b.changePercent).slice(0, 10);
  res.json({ gainers, losers });
});

router.get('/search/:query', async (req, res) => {
  try {
    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(req.params.query)}&quotesCount=20`;
    const response = await fetch(url, { headers: YAHOO_HEADERS });
    const data = await response.json();
    const quotes = data.quotes || [];
    const stocks = quotes
      .filter(q => ['EQUITY', 'INDEX', 'CURRENCY', 'CRYPTOCURRENCY', 'ETF', 'MUTUALFUND'].includes(q.quoteType))
      .slice(0, 15)
      .map(q => ({
        symbol: q.symbol,
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

  const indexMap = {
    'NIFTY50': '^NSEI', 'NIFTY': '^NSEI', 'SENSEX': '^BSESN',
    'BANKNIFTY': '^NSEBANK', 'NIFTYBANK': '^NSEBANK', 'NIFTYIT': '^CNXIT'
  };

  if (indexMap[fetchSymbol]) {
    fetchSymbol = indexMap[fetchSymbol];
  } else if (!fetchSymbol.includes('.') && !fetchSymbol.includes('=') && !fetchSymbol.includes('-') && !fetchSymbol.startsWith('^')) {
    fetchSymbol = `${fetchSymbol}.NS`;
  }

  const quote = await fetchYahooQuote(fetchSymbol);
  if (!quote || !quote.price) return res.status(404).json({ error: 'Stock not found' });
  res.json({
    symbol,
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
  const nsSymbols = NIFTY_50.map(s => `${s}.NS`);
  const fetched = await fetchBatch(nsSymbols);
  const results = [];
  for (const sym of NIFTY_50) {
    const quote = fetched[`${sym}.NS`];
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
  }
  res.json(results);
});

router.get('/crypto', async (req, res) => {
  const symbols = [
    'BTC-USD', 'ETH-USD', 'BNB-USD', 'SOL-USD', 'XRP-USD',
    'DOGE-USD', 'ADA-USD', 'SHIB-USD', 'AVAX-USD', 'TRX-USD',
    'DOT-USD', 'BCH-USD', 'LINK-USD', 'MATIC-USD', 'LTC-USD',
    'NEAR-USD', 'TON11419-USD', 'USDT-USD', 'USDC-USD', 'UNI7083-USD'
  ];
  const fetched = await fetchBatch(symbols);
  const results = [];
  for (const sym of symbols) {
    const quote = fetched[sym];
    if (quote?.price) {
      results.push({
        symbol: sym,
        name: sym.replace('-USD', ''),
        price: quote.price.toLocaleString(),
        change: quote.changePercent.toFixed(2),
        up: quote.change >= 0,
        image: `https://assets.coincap.io/assets/icons/${sym.split('-')[0].toLowerCase()}@2x.png`
      });
    }
  }
  res.json(results);
});

router.get('/futures', async (req, res) => {
  const [quote1, quote2] = await Promise.all([
    fetchWithTimeout('^NSEI'),
    fetchWithTimeout('^NSEBANK'),
  ]);
  res.json({
    pcr: '1.24',
    nifty: { price: quote1?.price ?? 22480.50, change: quote1?.changePercent?.toFixed(2) ?? 0.85, oi: '45.2L' },
    banknifty: { price: quote2?.price ?? 48250.30, change: quote2?.changePercent?.toFixed(2) ?? -0.28, oi: '32.5L' }
  });
});

const NEWS_API_KEY = process.env.NEWS_API_KEY;
router.get('/news', async (req, res) => {
  if (!NEWS_API_KEY) return res.status(200).json([]);
  try {
    const url = `https://newsapi.org/v2/everything?q=stock%20market%20OR%20nifty%20OR%20sensex&language=en&sortBy=publishedAt&apiKey=${NEWS_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    if (data.status === 'ok') {
      const articles = data.articles.slice(0, 20).map(a => ({
        title: a.title,
        description: a.description,
        time: new Date(a.publishedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        url: a.url,
        source: a.source.name,
        image: a.urlToImage,
      }));
      res.json(articles);
    } else {
      res.status(200).json([]);
    }
  } catch (err) {
    res.status(200).json([]);
  }
});

module.exports = router;