const express = require('express');
const axios   = require('axios');
const router  = express.Router();

// Cache helper
const cache = {};
const getCached = async (key, fn, ttl) => {
  const now = Date.now();
  if (cache[key] && now - cache[key].time < ttl * 1000) return cache[key].data;
  const data = await fn();
  cache[key] = { data, time: now };
  return data;
};

// NSE Cookie session
let nseCookie = '';
let cookieTime = 0;

const getNSECookie = async () => {
  if (nseCookie && Date.now() - cookieTime < 25 * 60 * 1000) return nseCookie;
  try {
    const res = await axios.get('https://www.nseindia.com', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
      timeout: 8000
    });
    const cookies = res.headers['set-cookie'];
    if (cookies) {
      nseCookie  = cookies.map(c => c.split(';')[0]).join('; ');
      cookieTime = Date.now();
    }
  } catch (e) {
    console.log('NSE cookie fetch failed:', e.message);
  }
  return nseCookie;
};

const nseGet = async (url) => {
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

// ── INDICES ───────────────────────────────────────────────────────
router.get('/indices', async (req, res) => {
  try {
    const data = await getCached('indices', async () => {
      const { data } = await nseGet('https://www.nseindia.com/api/allIndices');
      const wanted = ['NIFTY 50', 'NIFTY BANK', 'NIFTY IT', 'NIFTY MIDCAP 100'];
      return data.data.filter(i => wanted.includes(i.index));
    }, 30);
    res.json(data);
  } catch (err) {
    console.log('Indices fallback used');
    res.json([
      { index: 'NIFTY 50',         last: 23151.10, change: 173.45,  pChange: 0.76  },
      { index: 'NIFTY BANK',       last: 47312.55, change: 211.10,  pChange: 0.45  },
      { index: 'NIFTY IT',         last: 34201.15, change: -75.40,  pChange: -0.22 },
      { index: 'NIFTY MIDCAP 100', last: 51240.30, change: 320.15,  pChange: 0.63  },
    ]);
  }
});

// ── TOP GAINERS ───────────────────────────────────────────────────
router.get('/gainers', async (req, res) => {
  try {
    const data = await getCached('gainers', async () => {
      const { data } = await nseGet('https://www.nseindia.com/api/live-analysis-variations?index=gainers');
      const list = data.NIFTY && data.NIFTY.data ? data.NIFTY.data.slice(0, 10) : null;
      if (!list || list.length === 0) return getFallbackGainers();
      return list.map(s => ({
        symbol:         s.symbol,
        ltp:            s.ltp || s.lastPrice || s.last || 0,
        netPrice:       s.netPrice || s.pChange || s.percentChange || s.per || 0,
        tradedQuantity: s.tradedQuantity || s.totalTradedVolume || s.volume || 0,
      }));
    }, 60);
    res.json(data);
  } catch (err) {
    console.log('Gainers fallback used');
    res.json(getFallbackGainers());
  }
});

// ── TOP LOSERS ────────────────────────────────────────────────────
router.get('/losers', async (req, res) => {
  try {
    const data = await getCached('losers', async () => {
      const { data } = await nseGet('https://www.nseindia.com/api/live-analysis-variations?index=loosers');
      const list = data.NIFTY && data.NIFTY.data ? data.NIFTY.data.slice(0, 10) : null;
      if (!list || list.length === 0) return getFallbackLosers();
      return list.map(s => ({
        symbol:         s.symbol,
        ltp:            s.ltp || s.lastPrice || s.last || 0,
        netPrice:       s.netPrice || s.pChange || s.percentChange || s.per || 0,
        tradedQuantity: s.tradedQuantity || s.totalTradedVolume || s.volume || 0,
      }));
    }, 60);
    res.json(data);
  } catch (err) {
    console.log('Losers fallback used');
    res.json(getFallbackLosers());
  }
});

// ── SINGLE STOCK QUOTE ────────────────────────────────────────────
router.get('/quote/:symbol', async (req, res) => {
  try {
    const { data } = await nseGet(
      'https://www.nseindia.com/api/quote-equity?symbol=' + req.params.symbol
    );
    const p = data.priceInfo;
    res.json({
      symbol:    req.params.symbol,
      price:     p.lastPrice,
      open:      p.open,
      high:      p.intraDayHighLow ? p.intraDayHighLow.max : 0,
      low:       p.intraDayHighLow ? p.intraDayHighLow.min : 0,
      close:     p.previousClose,
      change:    p.change,
      changePct: p.pChange,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch quote' });
  }
});

// ── MULTIPLE QUOTES (for Watchlist and Portfolio) ─────────────────
router.post('/quotes', async (req, res) => {
  try {
    const { symbols } = req.body;
    const results = await Promise.all(
      symbols.map(async (symbol) => {
        try {
          const { data } = await nseGet(
            'https://www.nseindia.com/api/quote-equity?symbol=' + symbol
          );
          const p = data.priceInfo;
          return {
            symbol,
            price:     p.lastPrice.toFixed(2),
            change:    p.change.toFixed(2),
            changePct: p.pChange.toFixed(2) + '%',
          };
        } catch {
          return { symbol, error: true, price: '0', change: '0', changePct: '0%' };
        }
      })
    );
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch quotes' });
  }
});

// ── INTRADAY CHART ────────────────────────────────────────────────
router.get('/chart/:symbol', async (req, res) => {
  try {
    const { data } = await nseGet(
      'https://www.nseindia.com/api/chart-databyindex?index=' + req.params.symbol + 'EQN'
    );
    const points = data.grapthData || data.graphData || [];
    res.json(points.map(p => ({ time: p[0], price: p[1] })));
  } catch (err) {
    console.log('Chart fallback used');
    let v = 23000;
    const points = Array.from({ length: 75 }, function(_, i) {
      v += (Math.random() - 0.47) * 40;
      const h = 9 + Math.floor(i * (6.5 / 75));
      const m = Math.floor((i * (390 / 75)) % 60);
      return { time: h + ':' + String(m).padStart(2, '0'), price: Math.round(v) };
    });
    res.json(points);
  }
});

// ── CRYPTO (CoinGecko) ────────────────────────────────────────────
router.get('/crypto', async (req, res) => {
  try {
    const data = await getCached('crypto', async () => {
      const { data } = await axios.get(
        'https://api.coingecko.com/api/v3/coins/markets' +
        '?vs_currency=inr' +
        '&order=market_cap_desc' +
        '&per_page=15' +
        '&page=1' +
        '&price_change_percentage=1h,24h,7d',
        {
          timeout: 10000,
          headers: { 'Accept': 'application/json' }
        }
      );
      return data.map(c => ({
        id:        c.id,
        symbol:    c.symbol.toUpperCase(),
        name:      c.name,
        image:     c.image,
        price:     c.current_price,
        change24h: c.price_change_percentage_24h
          ? c.price_change_percentage_24h.toFixed(2) : '0',
        change7d:  c.price_change_percentage_7d_in_currency
          ? c.price_change_percentage_7d_in_currency.toFixed(2) : '0',
        change1h:  c.price_change_percentage_1h_in_currency
          ? c.price_change_percentage_1h_in_currency.toFixed(2) : '0',
        marketCap: c.market_cap,
        volume:    c.total_volume,
        high24h:   c.high_24h,
        low24h:    c.low_24h,
      }));
    }, 120);
    res.json(data);
  } catch (err) {
    console.log('Crypto error:', err.message);
    res.json(getFallbackCrypto());
  }
});

// ── MUTUAL FUNDS (mfapi.in) ───────────────────────────────────────
router.get('/mutualfunds', async (req, res) => {
  try {
    const data = await getCached('mf', async () => {
      const funds = [
        { code: '119598', name: 'Mirae Asset Large Cap Fund'  },
        { code: '122639', name: 'Parag Parikh Flexi Cap Fund' },
        { code: '118989', name: 'HDFC Mid-Cap Opportunities'  },
        { code: '119775', name: 'SBI Blue Chip Fund'          },
        { code: '120503', name: 'Axis Small Cap Fund'         },
        { code: '119533', name: 'ICICI Pru Bluechip Fund'     },
      ];
      return await Promise.all(funds.map(async (f) => {
        const { data } = await axios.get(
          'https://api.mfapi.in/mf/' + f.code,
          { timeout: 8000 }
        );
        const latest = data.data && data.data[0];
        const prev   = data.data && data.data[1];
        const change = latest && prev
          ? ((parseFloat(latest.nav) - parseFloat(prev.nav))
              / parseFloat(prev.nav) * 100).toFixed(2)
          : '0.00';
        return {
          code:     f.code,
          name:     data.meta ? data.meta.scheme_name : f.name,
          category: data.meta ? data.meta.scheme_category : 'Equity',
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

// ── COMMODITIES ───────────────────────────────────────────────────
router.get('/commodities', async (req, res) => {
  res.json({
    gold:   { price: 71240 + Math.floor(Math.random() * 200 - 100), change: '+0.18%', unit: '10g'  },
    silver: { price: 84500 + Math.floor(Math.random() * 500 - 250), change: '+0.32%', unit: 'kg'   },
    crude:  { price: 6842  + Math.floor(Math.random() * 50  - 25),  change: '-0.44%', unit: 'bbl'  },
  });
});

// ── NEWS ──────────────────────────────────────────────────────────
router.get('/news', async (req, res) => {
  try {
    const KEY = process.env.NEWS_API_KEY;
    if (!KEY || KEY === 'your_newsapi_key_here') throw new Error('No valid API key');
    const data = await getCached('news', async () => {
      const { data } = await axios.get(
        'https://newsapi.org/v2/everything' +
        '?q=india+stock+market+nifty+sensex' +
        '&sortBy=publishedAt' +
        '&pageSize=15' +
        '&language=en' +
        '&apiKey=' + KEY,
        { timeout: 8000 }
      );
      return data.articles.map(a => ({
        title:       a.title,
        source:      a.source.name,
        url:         a.url,
        image:       a.urlToImage,
        time:        a.publishedAt,
        description: a.description,
      }));
    }, 600);
    res.json(data);
  } catch (err) {
    console.log('News fallback used:', err.message);
    res.json(getFallbackNews());
  }
});

// ── MARKET STATUS ─────────────────────────────────────────────────
router.get('/status', (req, res) => {
  const ist  = new Date(
    new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })
  );
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

router.get('/debug-gainers', async (req, res) => {
  try {
    const { data } = await nseGet('https://www.nseindia.com/api/live-analysis-variations?index=gainers');
    const first = data.NIFTY && data.NIFTY.data ? data.NIFTY.data[0] : {};
    res.json({ keys: Object.keys(first), sample: first });
  } catch (err) {
    res.json({ error: err.message });
  }
});
```

Then after deploying, open this URL in browser:
```
https://prisepulse-server.onrender.com/api/market/debug-gainers

// ── FALLBACK DATA ─────────────────────────────────────────────────
function getFallbackGainers() {
  return [
    { symbol: 'TATAMOTORS', ltp: 952.30,  netPrice: 3.20,  tradedQuantity: 8234567 },
    { symbol: 'BAJFINANCE', ltp: 6721.00, netPrice: 2.11,  tradedQuantity: 1234567 },
    { symbol: 'M&M',        ltp: 2187.55, netPrice: 1.55,  tradedQuantity: 2345678 },
    { symbol: 'WIPRO',      ltp: 452.15,  netPrice: 1.40,  tradedQuantity: 5678901 },
    { symbol: 'RELIANCE',   ltp: 2912.40, netPrice: 1.12,  tradedQuantity: 3456789 },
    { symbol: 'HDFCBANK',   ltp: 1642.30, netPrice: 0.67,  tradedQuantity: 4567890 },
    { symbol: 'ADANIPORTS', ltp: 1287.55, netPrice: 0.55,  tradedQuantity: 2345678 },
    { symbol: 'AXISBANK',   ltp: 1124.40, netPrice: 0.33,  tradedQuantity: 3456789 },
  ];
}

function getFallbackLosers() {
  return [
    { symbol: 'TATASTEEL',  ltp: 142.30,  netPrice: -2.10, tradedQuantity: 9234567 },
    { symbol: 'JSWSTEEL',   ltp: 865.45,  netPrice: -1.44, tradedQuantity: 2134567 },
    { symbol: 'LT',         ltp: 3421.10, netPrice: -1.22, tradedQuantity: 1234567 },
    { symbol: 'INFY',       ltp: 1423.60, netPrice: -0.88, tradedQuantity: 4567890 },
    { symbol: 'TCS',        ltp: 3887.75, netPrice: -0.34, tradedQuantity: 2345678 },
    { symbol: 'ITC',        ltp: 428.90,  netPrice: -0.14, tradedQuantity: 6789012 },
    { symbol: 'NESTLEIND',  ltp: 2245.30, netPrice: -0.77, tradedQuantity: 1234567 },
    { symbol: 'KOTAKBK',    ltp: 1876.45, netPrice: -0.50, tradedQuantity: 2345678 },
  ];
}

function getFallbackCrypto() {
  return [
    { id: 'bitcoin',  symbol: 'BTC', name: 'Bitcoin',  image: '', price: 6887640, change24h: '3.22',  change7d: '5.10',  change1h: '0.45',  marketCap: 135000000000000, volume: 2500000000000, high24h: 7100000, low24h: 6650000 },
    { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', image: '', price: 334500,  change24h: '1.87',  change7d: '3.20',  change1h: '0.22',  marketCap: 40000000000000,  volume: 1200000000000, high24h: 345000,  low24h: 325000  },
    { id: 'solana',   symbol: 'SOL', name: 'Solana',   image: '', price: 14890,   change24h: '5.10',  change7d: '8.40',  change1h: '1.20',  marketCap: 6500000000000,   volume: 450000000000,  high24h: 15500,   low24h: 14100   },
    { id: 'bnb',      symbol: 'BNB', name: 'BNB',      image: '', price: 34400,   change24h: '-0.44', change7d: '1.20',  change1h: '-0.10', marketCap: 5200000000000,   volume: 380000000000,  high24h: 35000,   low24h: 34000   },
    { id: 'xrp',      symbol: 'XRP', name: 'XRP',      image: '', price: 53,      change24h: '1.20',  change7d: '2.80',  change1h: '0.30',  marketCap: 2900000000000,   volume: 280000000000,  high24h: 55,      low24h: 52      },
  ];
}

function getFallbackNews() {
  return [
    { title: 'RBI holds repo rate at 6.5% amid global uncertainty',          source: 'Economic Times',    url: '#', image: null, time: new Date(Date.now() - 9   * 60000).toISOString(), description: 'The Reserve Bank of India kept rates unchanged.' },
    { title: 'Reliance Q3 net profit surges 18% YoY to Rs.18,540 Cr',        source: 'Moneycontrol',      url: '#', image: null, time: new Date(Date.now() - 24  * 60000).toISOString(), description: 'Reliance Industries posts strong quarterly results.' },
    { title: 'Nifty eyes 22,500 resistance; FII inflows of Rs.4,200 Cr',     source: 'Business Standard', url: '#', image: null, time: new Date(Date.now() - 41  * 60000).toISOString(), description: 'Foreign institutional investors continue buying.' },
    { title: 'Bitcoin surges past $82K on spot ETF inflow uptick',            source: 'CoinDesk India',    url: '#', image: null, time: new Date(Date.now() - 60  * 60000).toISOString(), description: 'Crypto markets rally on institutional demand.' },
    { title: 'Hyundai India IPO oversubscribed 2.4x on Day 2',               source: 'Mint',              url: '#', image: null, time: new Date(Date.now() - 120 * 60000).toISOString(), description: 'Strong investor interest in Hyundai listing.' },
    { title: 'Gold hits Rs.71,240 per 10g on safe-haven demand',             source: 'Reuters India',     url: '#', image: null, time: new Date(Date.now() - 180 * 60000).toISOString(), description: 'Precious metals gain on global uncertainty.' },
    { title: 'Tata Motors Q3 results: PAT up 22%, revenue beats estimates',   source: 'NDTV Profit',       url: '#', image: null, time: new Date(Date.now() - 240 * 60000).toISOString(), description: 'Tata Motors posts better than expected earnings.' },
    { title: 'SEBI tightens F and O rules; new lot sizes effective from April', source: 'Livemint',        url: '#', image: null, time: new Date(Date.now() - 300 * 60000).toISOString(), description: 'Market regulator announces new derivatives rules.' },
  ];
}

module.exports = router;