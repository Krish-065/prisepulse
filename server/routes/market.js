const express = require('express');
const axios   = require('axios');
const router  = express.Router();

// ── CACHE ──────────────────────────────────────────────────────────
// Two-layer cache:
// 1. Regular TTL cache — expires after N seconds, triggers fresh fetch
// 2. lastGood cache — NEVER expires, always holds the last successful value
//    This means when Render wakes from sleep and Yahoo is slow, we still
//    serve real data instead of hardcoded fallbacks.
const cache    = {};
const lastGood = {}; // persistent — survives TTL expiry, never cleared

const getCached = async function(key, fn, ttl) {
  const now = Date.now();
  if (cache[key] && now - cache[key].time < ttl * 1000) return cache[key].data;
  try {
    const data = await fn();
    cache[key]    = { data, time: now };
    lastGood[key] = { data, time: now }; // save as last good value
    return data;
  } catch (err) {
    // If we have a last-good value, serve it instead of crashing
    if (lastGood[key]) {
      console.log('[Cache] Serving last-good for', key, '— fresh fetch failed:', err.message);
      return lastGood[key].data;
    }
    throw err;
  }
};

// ── NSE COOKIE ─────────────────────────────────────────────────────
let nseCookie  = '';
let cookieTime = 0;

const getNSECookie = async function() {
  if (nseCookie && Date.now() - cookieTime < 10 * 60 * 1000) return nseCookie;
  try {
    const res = await axios.get('https://www.nseindia.com/', {
      headers: {
        'User-Agent':      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept':          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection':      'keep-alive',
      },
      timeout: 10000
    });
    const cookies = res.headers['set-cookie'];
    if (cookies) {
      nseCookie  = cookies.map(function(c) { return c.split(';')[0]; }).join('; ');
      cookieTime = Date.now();
      console.log('[NSE] Cookie refreshed');
    }
  } catch (e) {
    console.log('[NSE] Cookie refresh failed:', e.message);
  }
  return nseCookie;
};

const nseGet = async function(url) {
  const cookie = await getNSECookie();
  return axios.get(url, {
    headers: {
      'User-Agent':      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
      'Accept':          'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer':         'https://www.nseindia.com/',
      'Cookie':          cookie,
    },
    timeout: 8000
  });
};

const normalizeStock = function(s) {
  return {
    symbol:         s.symbol || '',
    ltp:            s.ltp || s.lastPrice || s.last || 0,
    netPrice:       s.perChange || s.netPrice || s.pChange || 0,
    tradedQuantity: s.trade_quantity || s.tradedQuantity || s.totalTradedVolume || 0,
  };
};

// ── YAHOO FINANCE FETCH (server-side, no CORS) ─────────────────────
const fetchYahooIndices = async function() {
  const symbols = ['^NSEI', '^BSESN', '^NSEBANK', 'NIFTY_IT.NS'];

  // Try query1 first, fall back to query2
  const urls = [
    'https://query1.finance.yahoo.com/v8/finance/quote?symbols=' + symbols.join(','),
    'https://query2.finance.yahoo.com/v8/finance/quote?symbols=' + symbols.join(','),
  ];

  for (var i = 0; i < urls.length; i++) {
    try {
      const result = await axios.get(urls[i], {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
          'Accept':     'application/json, text/plain, */*',
          'Referer':    'https://finance.yahoo.com/',
          'Origin':     'https://finance.yahoo.com',
        }
      });
      const quotes = (result.data.quoteResponse && result.data.quoteResponse.result) || [];
      if (quotes.length === 0) continue;

      const find = function(sym) { return quotes.find(function(q) { return q.symbol === sym; }); };
      const n  = find('^NSEI');
      const s  = find('^BSESN');
      const b  = find('^NSEBANK');
      const it = find('NIFTY_IT.NS');

      // Validate we got real data — price must be > 0
      if (!n || !n.regularMarketPrice || n.regularMarketPrice === 0) continue;

      const data = [
        {
          index:   'NIFTY 50',
          last:    n  ? parseFloat(n.regularMarketPrice.toFixed(2))  : 0,
          pChange: n  ? parseFloat(n.regularMarketChangePercent.toFixed(2))  : 0,
          change:  n  ? parseFloat(n.regularMarketChange.toFixed(2))  : 0,
          open:    n  ? n.regularMarketOpen  : 0,
          high:    n  ? n.regularMarketDayHigh  : 0,
          low:     n  ? n.regularMarketDayLow   : 0,
          prev:    n  ? n.regularMarketPreviousClose : 0,
        },
        {
          index:   'SENSEX',
          last:    s  ? parseFloat(s.regularMarketPrice.toFixed(2))  : 0,
          pChange: s  ? parseFloat(s.regularMarketChangePercent.toFixed(2))  : 0,
          change:  s  ? parseFloat(s.regularMarketChange.toFixed(2))  : 0,
          open:    s  ? s.regularMarketOpen  : 0,
          high:    s  ? s.regularMarketDayHigh  : 0,
          low:     s  ? s.regularMarketDayLow   : 0,
          prev:    s  ? s.regularMarketPreviousClose : 0,
        },
        {
          index:   'NIFTY BANK',
          last:    b  ? parseFloat(b.regularMarketPrice.toFixed(2))  : 0,
          pChange: b  ? parseFloat(b.regularMarketChangePercent.toFixed(2))  : 0,
          change:  b  ? parseFloat(b.regularMarketChange.toFixed(2))  : 0,
          open:    b  ? b.regularMarketOpen  : 0,
          high:    b  ? b.regularMarketDayHigh  : 0,
          low:     b  ? b.regularMarketDayLow   : 0,
          prev:    b  ? b.regularMarketPreviousClose : 0,
        },
        {
          index:   'NIFTY IT',
          last:    it ? parseFloat(it.regularMarketPrice.toFixed(2)) : 0,
          pChange: it ? parseFloat(it.regularMarketChangePercent.toFixed(2)) : 0,
          change:  it ? parseFloat(it.regularMarketChange.toFixed(2)) : 0,
          open:    it ? it.regularMarketOpen  : 0,
          high:    it ? it.regularMarketDayHigh  : 0,
          low:     it ? it.regularMarketDayLow   : 0,
          prev:    it ? it.regularMarketPreviousClose : 0,
        },
      ];

      console.log('[Indices] Fetched from Yahoo:', data[0].index, data[0].last, '(', data[0].pChange + '%)');
      return data;
    } catch (e) {
      console.log('[Indices] Yahoo URL', i, 'failed:', e.message);
    }
  }
  throw new Error('All Yahoo Finance URLs failed');
};

// ── INDICES ROUTE ──────────────────────────────────────────────────
router.get('/indices', async function(req, res) {
  try {
    // TTL = 20 seconds during market hours, 5 minutes outside
    const ist   = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    const day   = ist.getDay();
    const mins  = ist.getHours() * 60 + ist.getMinutes();
    const isOpen = day >= 1 && day <= 5 && mins >= 555 && mins <= 930;
    const ttl   = isOpen ? 20 : 300;

    const data = await getCached('indices', fetchYahooIndices, ttl);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json(data);
  } catch (err) {
    console.log('[Indices] All sources failed, using hardcoded fallback:', err.message);
    // Only used if Yahoo fails AND there is no lastGood — i.e. very first boot failure
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json([
      { index: 'NIFTY 50',   last: 23114.5,  pChange: 0.49,  change: 112.86  },
      { index: 'SENSEX',     last: 76012.0,  pChange: 0.62,  change: 471.27  },
      { index: 'NIFTY BANK', last: 53427.05, pChange: -0.04, change: -21.37  },
      { index: 'NIFTY IT',   last: 29199.60, pChange: 2.17,  change: 633.63  },
    ]);
  }
});

// ── STOCK QUOTES PROXY (Yahoo Finance via backend — for Portfolio) ──
router.get('/quotes', async function(req, res) {
  try {
    var symbols = req.query.symbols;
    if (!symbols) return res.status(400).json({ error: 'symbols param required' });

    const data = await getCached('quotes_' + symbols, async function() {
      const result = await axios.get(
        'https://query1.finance.yahoo.com/v8/finance/quote?symbols=' + encodeURIComponent(symbols),
        {
          timeout: 10000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
            'Accept':     'application/json',
            'Referer':    'https://finance.yahoo.com',
          }
        }
      );
      const quotes = (result.data.quoteResponse && result.data.quoteResponse.result) || [];
      const map = {};
      quotes.forEach(function(q) {
        const sym = q.symbol.replace('.NS', '').replace('.BO', '');
        map[sym] = {
          price:  q.regularMarketPrice         || 0,
          change: q.regularMarketChangePercent || 0,
          high:   q.regularMarketDayHigh       || 0,
          low:    q.regularMarketDayLow        || 0,
        };
      });
      return map;
    }, 15);

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json(data);
  } catch (err) {
    console.log('[Quotes] Error:', err.message);
    res.status(500).json({ error: 'Failed to fetch quotes' });
  }
});

// ── CRYPTO PRICES PROXY (CoinGecko via backend — for Portfolio) ────
router.get('/crypto-prices', async function(req, res) {
  try {
    var ids = req.query.ids;
    if (!ids) return res.status(400).json({ error: 'ids param required' });

    const data = await getCached('crypto_' + ids, async function() {
      const result = await axios.get(
        'https://api.coingecko.com/api/v3/coins/markets' +
        '?vs_currency=inr&ids=' + ids +
        '&order=market_cap_desc&per_page=50&page=1&price_change_percentage=24h',
        { timeout: 15000, headers: { Accept: 'application/json' } }
      );
      const map = {};
      result.data.forEach(function(c) {
        const obj = {
          id:        c.id,
          symbol:    c.symbol.toUpperCase(),
          name:      c.name,
          price:     c.current_price,
          change24h: c.price_change_percentage_24h
            ? c.price_change_percentage_24h.toFixed(2) : '0',
        };
        map[c.id]                   = obj;
        map[c.symbol.toUpperCase()] = obj;
        map[c.symbol.toLowerCase()] = obj;
      });
      return map;
    }, 60);

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json(data);
  } catch (err) {
    console.log('[CryptoPrices] Error:', err.message);
    res.status(500).json({ error: 'Failed to fetch crypto prices' });
  }
});

// ── GAINERS ────────────────────────────────────────────────────────
router.get('/gainers', async function(req, res) {
  try {
    const data = await getCached('gainers', async function() {
      const result = await nseGet('https://www.nseindia.com/api/live-analysis-variations?index=gainers');
      const list   = result.data.NIFTY && result.data.NIFTY.data ? result.data.NIFTY.data.slice(0, 10) : null;
      if (!list || list.length === 0) throw new Error('empty');
      return list.map(normalizeStock);
    }, 60);
    res.json(data);
  } catch (err) { res.json(getFallbackGainers()); }
});

// ── LOSERS ─────────────────────────────────────────────────────────
router.get('/losers', async function(req, res) {
  try {
    const data = await getCached('losers', async function() {
      const result = await nseGet('https://www.nseindia.com/api/live-analysis-variations?index=loosers');
      const list   = result.data.NIFTY && result.data.NIFTY.data ? result.data.NIFTY.data.slice(0, 10) : null;
      if (!list || list.length === 0) throw new Error('empty');
      return list.map(normalizeStock);
    }, 60);
    res.json(data);
  } catch (err) { res.json(getFallbackLosers()); }
});

// ── SINGLE QUOTE ───────────────────────────────────────────────────
router.get('/quote/:symbol', async function(req, res) {
  try {
    const result = await nseGet('https://www.nseindia.com/api/quote-equity?symbol=' + req.params.symbol);
    const p = result.data.priceInfo;
    res.json({ symbol: req.params.symbol, price: p.lastPrice, open: p.open, close: p.previousClose, change: p.change, changePct: p.pChange });
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

// ── MULTIPLE QUOTES (Watchlist / Portfolio via NSE) ────────────────
const quoteCache = {};
router.post('/quotes', async function(req, res) {
  try {
    const symbols = req.body.symbols || [];
    if (symbols.length === 0) return res.json([]);
    const now = Date.now();
    const CACHE_MS = 5 * 60 * 1000;
    const results = [];
    for (var i = 0; i < symbols.length; i++) {
      const symbol = symbols[i];
      if (quoteCache[symbol] && now - quoteCache[symbol].time < CACHE_MS) {
        results.push(quoteCache[symbol].data); continue;
      }
      try {
        const result = await nseGet('https://www.nseindia.com/api/quote-equity?symbol=' + encodeURIComponent(symbol));
        const p = result.data.priceInfo;
        if (!p || !p.lastPrice) throw new Error('No price');
        const data = { symbol, price: p.lastPrice.toFixed(2), change: (p.change||0).toFixed(2), changePct: (p.pChange||0).toFixed(2) + '%', error: false };
        quoteCache[symbol] = { data, time: now };
        results.push(data);
      } catch (e) {
        if (quoteCache[symbol]) { results.push(quoteCache[symbol].data); continue; }
        results.push({ symbol, error: true, price: '0', change: '0', changePct: '0%' });
      }
      if (i < symbols.length - 1) await new Promise(function(r) { setTimeout(r, 300); });
    }
    res.json(results);
  } catch (err) {
    res.json((req.body.symbols||[]).map(function(s) { return { symbol: s, error: true, price: '0', change: '0', changePct: '0%' }; }));
  }
});

// ── INTRADAY CHART ─────────────────────────────────────────────────
router.get('/chart/:symbol', async function(req, res) {
  try {
    const result = await nseGet('https://www.nseindia.com/api/chart-databyindex?index=' + req.params.symbol + 'EQN');
    const points = result.data.grapthData || result.data.graphData || [];
    res.json(points.map(function(p) { return { time: p[0], price: p[1] }; }));
  } catch (err) {
    let v = 23400;
    const pts = Array.from({ length: 75 }, function(_, i) {
      v += (Math.random() - 0.47) * 40;
      const h = 9 + Math.floor(i * (6.5 / 75));
      const m = Math.floor((i * (390 / 75)) % 60);
      return { time: h + ':' + String(m).padStart(2, '0'), price: Math.round(v) };
    });
    res.json(pts);
  }
});

// ── CRYPTO (CoinGecko) ─────────────────────────────────────────────
router.get('/crypto', async function(req, res) {
  try {
    const data = await getCached('crypto', async function() {
      const ALL_IDS = [
        'bitcoin','ethereum','binancecoin','solana','ripple',
        'cardano','dogecoin','polkadot','shiba-inu','avalanche-2',
        'matic-network','chainlink','litecoin','uniswap','stellar',
        'tron','cosmos','near','pepe','filecoin'
      ].join(',');
      const result = await axios.get(
        'https://api.coingecko.com/api/v3/coins/markets' +
        '?vs_currency=inr&ids=' + ALL_IDS +
        '&order=market_cap_desc&per_page=50&page=1&price_change_percentage=1h,24h,7d',
        { timeout: 12000, headers: { Accept: 'application/json' } }
      );
      return result.data.map(function(c) {
        return {
          id:        c.id,
          symbol:    c.symbol.toUpperCase(),
          name:      c.name,
          image:     c.image,
          price:     c.current_price,
          change24h: c.price_change_percentage_24h ? c.price_change_percentage_24h.toFixed(2) : '0',
          change7d:  c.price_change_percentage_7d_in_currency ? c.price_change_percentage_7d_in_currency.toFixed(2) : '0',
          change1h:  c.price_change_percentage_1h_in_currency ? c.price_change_percentage_1h_in_currency.toFixed(2) : '0',
          marketCap: c.market_cap,
          volume:    c.total_volume,
          high24h:   c.high_24h,
          low24h:    c.low_24h,
        };
      });
    }, 120);
    res.json(data);
  } catch (err) {
    console.log('Crypto error:', err.message);
    res.json(getFallbackCrypto());
  }
});

// ── MUTUAL FUNDS ───────────────────────────────────────────────────
router.get('/mutualfunds', async function(req, res) {
  try {
    const data = await getCached('mf', async function() {
      const funds = [
        { code: '119598', name: 'Mirae Asset Large Cap Fund'  },
        { code: '122639', name: 'Parag Parikh Flexi Cap Fund' },
        { code: '118989', name: 'HDFC Mid-Cap Opportunities'  },
        { code: '119775', name: 'SBI Blue Chip Fund'          },
        { code: '120503', name: 'Axis Small Cap Fund'         },
        { code: '119533', name: 'ICICI Pru Bluechip Fund'     },
      ];
      return await Promise.all(funds.map(async function(f) {
        const result = await axios.get('https://api.mfapi.in/mf/' + f.code, { timeout: 8000 });
        const latest = result.data.data && result.data.data[0];
        const prev   = result.data.data && result.data.data[1];
        const change = latest && prev
          ? ((parseFloat(latest.nav) - parseFloat(prev.nav)) / parseFloat(prev.nav) * 100).toFixed(2)
          : '0.00';
        return {
          code:     f.code,
          name:     result.data.meta ? result.data.meta.scheme_name : f.name,
          category: result.data.meta ? result.data.meta.scheme_category : 'Equity',
          nav:      latest ? parseFloat(latest.nav).toFixed(2) : '0',
          date:     latest ? latest.date : '',
          change,
        };
      }));
    }, 3600);
    res.json(data);
  } catch (err) {
    console.log('MF error:', err.message);
    res.status(500).json({ error: 'Failed to fetch mutual funds' });
  }
});

// ── COMMODITIES ────────────────────────────────────────────────────
router.get('/commodities', async function(req, res) {
  res.json({
    gold:       { price: 93200 + Math.floor(Math.random() * 200 - 100), changePct: '+0.18%', isUp: true,  unit: '10g',    label: 'Gold'        },
    silver:     { price: 96800 + Math.floor(Math.random() * 400 - 200), changePct: '+0.32%', isUp: true,  unit: 'kg',     label: 'Silver'      },
    crude:      { price: 6640  + Math.floor(Math.random() * 60  - 30),  changePct: '-0.44%', isUp: false, unit: 'bbl',    label: 'Crude Oil'   },
    naturalgas: { price: 295   + Math.floor(Math.random() * 10  - 5),   changePct: '+1.12%', isUp: true,  unit: 'mmBtu',  label: 'Natural Gas' },
    copper:     { price: 845   + Math.floor(Math.random() * 20  - 10),  changePct: '+0.55%', isUp: true,  unit: 'kg',     label: 'Copper'      },
    aluminium:  { price: 228   + Math.floor(Math.random() * 8   - 4),   changePct: '-0.22%', isUp: false, unit: 'kg',     label: 'Aluminium'   },
    zinc:       { price: 272   + Math.floor(Math.random() * 10  - 5),   changePct: '+0.38%', isUp: true,  unit: 'kg',     label: 'Zinc'        },
    nickel:     { price: 1368  + Math.floor(Math.random() * 30  - 15),  changePct: '-0.15%', isUp: false, unit: 'kg',     label: 'Nickel'      },
  });
});

// ── MARKET STATUS ──────────────────────────────────────────────────
router.get('/status', function(req, res) {
  const ist  = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const day  = ist.getDay();
  const mins = ist.getHours() * 60 + ist.getMinutes();
  const isOpen = day >= 1 && day <= 5 && mins >= 555 && mins <= 930;
  const isPre  = day >= 1 && day <= 5 && mins >= 540 && mins < 555;
  res.json({
    isOpen,
    isPreOpen: isPre,
    status:    isOpen ? 'Market Open' : isPre ? 'Pre-Open Session' : 'Market Closed',
    message:   isOpen ? 'NSE and BSE trading live' : 'Opens Mon-Fri 9:15 AM IST',
    time:      ist.toLocaleTimeString('en-IN'),
  });
});

// ── FII/DII DATA ───────────────────────────────────────────────────
router.get('/fiidii', function(req, res) {
  res.json([
    { month: 'Oct 2024', fii: -94017, dii: 107254 },
    { month: 'Nov 2024', fii: -45974, dii:  65780 },
    { month: 'Dec 2024', fii: -16042, dii:  42180 },
    { month: 'Jan 2025', fii: -78027, dii:  84120 },
    { month: 'Feb 2025', fii: -34574, dii:  48920 },
    { month: 'Mar 2025', fii:  18420, dii:  22340 },
  ]);
});

// ── NEWS ───────────────────────────────────────────────────────────
router.get('/news', async function(req, res) {
  try {
    const KEY = process.env.NEWS_API_KEY;
    if (!KEY || KEY === 'your_newsapi_key_here') throw new Error('No key');
    const data = await getCached('news', async function() {
      const result = await axios.get(
        'https://newsapi.org/v2/everything' +
        '?q=india+stock+market+nifty+sensex+economy+RBI+crypto' +
        '&sortBy=publishedAt&pageSize=15&language=en&apiKey=' + KEY,
        { timeout: 10000 }
      );
      return (result.data.articles || [])
        .filter(function(a) { return a.title && a.title !== '[Removed]' && a.url; })
        .map(function(a) {
          return { title: a.title, source: a.source.name, url: a.url, image: a.urlToImage, time: a.publishedAt, description: a.description };
        });
    }, 600);
    res.json(data);
  } catch (err) {
    res.json(getFallbackNews());
  }
});

// ── FALLBACKS ──────────────────────────────────────────────────────
function getFallbackGainers() {
  return [
    { symbol: 'ETERNAL',    ltp: 234.55,  netPrice: 5.63,  tradedQuantity: 49176321 },
    { symbol: 'TATASTEEL',  ltp: 152.90,  netPrice: 2.83,  tradedQuantity: 20468067 },
    { symbol: 'M&M',        ltp: 2912.80, netPrice: 2.53,  tradedQuantity: 2302037  },
    { symbol: 'HDFCLIFE',   ltp: 640.70,  netPrice: 2.35,  tradedQuantity: 1609934  },
    { symbol: 'BHARTIARTL', ltp: 1815.90, netPrice: 1.81,  tradedQuantity: 3283765  },
    { symbol: 'RELIANCE',   ltp: 1285.40, netPrice: 1.12,  tradedQuantity: 3456789  },
    { symbol: 'HDFCBANK',   ltp: 1762.30, netPrice: 0.67,  tradedQuantity: 4567890  },
    { symbol: 'AXISBANK',   ltp: 1124.40, netPrice: 0.33,  tradedQuantity: 3456789  },
  ];
}

function getFallbackLosers() {
  return [
    { symbol: 'WIPRO',      ltp: 224.50,  netPrice: -2.15, tradedQuantity: 13827722 },
    { symbol: 'BAJFINANCE', ltp: 866.70,  netPrice: -1.30, tradedQuantity: 5215656  },
    { symbol: 'INFY',       ltp: 1497.80, netPrice: -1.30, tradedQuantity: 5882698  },
    { symbol: 'CIPLA',      ltp: 1502.90, netPrice: -1.24, tradedQuantity: 881525   },
    { symbol: 'ADANIENT',   ltp: 2218.20, netPrice: -1.00, tradedQuantity: 2345678  },
    { symbol: 'TCS',        ltp: 3194.75, netPrice: -0.34, tradedQuantity: 2345678  },
    { symbol: 'ITC',        ltp: 416.90,  netPrice: -0.14, tradedQuantity: 6789012  },
    { symbol: 'NESTLEIND',  ltp: 2184.30, netPrice: -0.77, tradedQuantity: 1234567  },
  ];
}

function getFallbackCrypto() {
  return [
    { id: 'bitcoin',     symbol: 'BTC', name: 'Bitcoin',  image: '', price: 7200000, change24h: '1.20', change7d: '3.10', change1h: '0.15', marketCap: 142000000000000, volume: 2800000000000, high24h: 7350000, low24h: 7050000 },
    { id: 'ethereum',    symbol: 'ETH', name: 'Ethereum', image: '', price: 190000,  change24h: '0.87', change7d: '2.20', change1h: '0.12', marketCap: 22000000000000,  volume: 1100000000000, high24h: 196000,  low24h: 185000  },
    { id: 'solana',      symbol: 'SOL', name: 'Solana',   image: '', price: 11200,   change24h: '2.10', change7d: '4.40', change1h: '0.50', marketCap: 4800000000000,   volume: 380000000000,  high24h: 11600,   low24h: 10900   },
    { id: 'binancecoin', symbol: 'BNB', name: 'BNB',      image: '', price: 52000,   change24h: '-0.44',change7d: '1.20', change1h: '-0.10',marketCap: 7800000000000,   volume: 320000000000,  high24h: 53000,   low24h: 51500   },
    { id: 'ripple',      symbol: 'XRP', name: 'XRP',      image: '', price: 195,     change24h: '1.20', change7d: '2.80', change1h: '0.30', marketCap: 11000000000000,  volume: 850000000000,  high24h: 200,     low24h: 190     },
  ];
}

function getFallbackNews() {
  return [
    { title: 'RBI holds repo rate at 6.5% amid global uncertainty',        source: 'Economic Times',    url: '#', image: null, time: new Date(Date.now() - 30  * 60000).toISOString(), description: 'The Reserve Bank of India kept rates unchanged.'     },
    { title: 'Reliance Q3 net profit surges 18% YoY to Rs.18540 Cr',       source: 'Moneycontrol',      url: '#', image: null, time: new Date(Date.now() - 60  * 60000).toISOString(), description: 'Reliance Industries posts strong quarterly results.' },
    { title: 'Nifty eyes 23500 resistance; FII inflows of Rs.4200 Cr',      source: 'Business Standard', url: '#', image: null, time: new Date(Date.now() - 90  * 60000).toISOString(), description: 'Foreign institutional investors continue buying.'   },
    { title: 'Bitcoin surges past $85K on spot ETF inflow uptick',          source: 'CoinDesk India',    url: '#', image: null, time: new Date(Date.now() - 120 * 60000).toISOString(), description: 'Crypto markets rally on institutional demand.'      },
    { title: 'SEBI tightens F and O rules; new lot sizes from April',       source: 'Livemint',          url: '#', image: null, time: new Date(Date.now() - 150 * 60000).toISOString(), description: 'Market regulator announces new derivatives rules.'  },
    { title: 'Gold hits Rs.93200 per 10g on safe-haven demand',            source: 'Reuters India',     url: '#', image: null, time: new Date(Date.now() - 180 * 60000).toISOString(), description: 'Precious metals gain on global uncertainty.'        },
    { title: 'Tata Motors Q3 results: PAT up 22%, revenue beats estimates', source: 'NDTV Profit',       url: '#', image: null, time: new Date(Date.now() - 210 * 60000).toISOString(), description: 'Tata Motors posts better than expected earnings.'   },
    { title: 'Sensex gains 400 pts; IT stocks lead broad market rally',     source: 'Economic Times',    url: '#', image: null, time: new Date(Date.now() - 240 * 60000).toISOString(), description: 'Broad market rally on positive global cues.'        },
  ];
}

module.exports = router;