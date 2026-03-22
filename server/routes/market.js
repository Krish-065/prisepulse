const express = require('express');
const axios   = require('axios');
const router  = express.Router();

// ── CACHE ─────────────────────────────────────────────────────────
const cache = {};
const getCached = async function(key, fn, ttl) {
  const now = Date.now();
  if (cache[key] && now - cache[key].time < ttl * 1000) return cache[key].data;
  const data = await fn();
  cache[key] = { data, time: now };
  return data;
};

// ── NSE COOKIE ────────────────────────────────────────────────────
let nseCookie  = '';
let cookieTime = 0;

const getNSECookie = async function() {
  if (nseCookie && Date.now() - cookieTime < 25 * 60 * 1000) return nseCookie;
  try {
    const res = await axios.get('https://www.nseindia.com', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        'Accept':     'text/html,application/xhtml+xml',
      },
      timeout: 8000
    });
    const cookies = res.headers['set-cookie'];
    if (cookies) {
      nseCookie  = cookies.map(function(c) { return c.split(';')[0]; }).join('; ');
      cookieTime = Date.now();
    }
  } catch (e) {
    // Suppress noisy cookie errors
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

// ── INDICES ───────────────────────────────────────────────────────
// ── INDICES (Yahoo Finance — no IP blocking, no API key needed) ───
router.get('/indices', async function(req, res) {
  try {
    const data = await getCached('indices', async function() {
      // Yahoo Finance symbols for Indian indices
      const symbols = ['^NSEI', '^BSESN', '^NSEBANK', 'NIFTY_IT.NS'];
      const result  = await axios.get(
        'https://query1.finance.yahoo.com/v7/finance/quote?symbols=' + symbols.join(','),
        {
          timeout: 10000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
            'Accept':     'application/json',
          }
        }
      );
      const quotes = result.data.quoteResponse.result || [];
      const find   = function(sym) { return quotes.find(function(q) { return q.symbol === sym; }); };
      const n  = find('^NSEI');
      const s  = find('^BSESN');
      const b  = find('^NSEBANK');
      const it = find('NIFTY_IT.NS');
      return [
        { index: 'NIFTY 50',   last: n  ? n.regularMarketPrice  : 0, pChange: n  ? n.regularMarketChangePercent  : 0 },
        { index: 'SENSEX',     last: s  ? s.regularMarketPrice  : 0, pChange: s  ? s.regularMarketChangePercent  : 0 },
        { index: 'NIFTY BANK', last: b  ? b.regularMarketPrice  : 0, pChange: b  ? b.regularMarketChangePercent  : 0 },
        { index: 'NIFTY IT',   last: it ? it.regularMarketPrice : 0, pChange: it ? it.regularMarketChangePercent : 0 },
      ];
    }, 15); // cache 15 seconds — Yahoo updates every ~15s
    res.json(data);
  } catch (err) {
    console.log('Yahoo indices error:', err.message);
    res.json([
      { index: 'NIFTY 50',   last: 23114.5,  pChange: 0.49  },
      { index: 'SENSEX',     last: 76012,    pChange: 0.62  },
      { index: 'NIFTY BANK', last: 53427.05, pChange: -0.04 },
      { index: 'NIFTY IT',   last: 29199.6,  pChange: 2.17  },
    ]);
  }
});

// ── GAINERS ───────────────────────────────────────────────────────
router.get('/gainers', async function(req, res) {
  try {
    const data = await getCached('gainers', async function() {
      const result = await nseGet('https://www.nseindia.com/api/live-analysis-variations?index=gainers');
      const list   = result.data.NIFTY && result.data.NIFTY.data ? result.data.NIFTY.data.slice(0, 10) : null;
      if (!list || list.length === 0) return getFallbackGainers();
      return list.map(normalizeStock);
    }, 60);
    res.json(data);
  } catch (err) { res.json(getFallbackGainers()); }
});

// ── LOSERS ────────────────────────────────────────────────────────
router.get('/losers', async function(req, res) {
  try {
    const data = await getCached('losers', async function() {
      const result = await nseGet('https://www.nseindia.com/api/live-analysis-variations?index=loosers');
      const list   = result.data.NIFTY && result.data.NIFTY.data ? result.data.NIFTY.data.slice(0, 10) : null;
      if (!list || list.length === 0) return getFallbackLosers();
      return list.map(normalizeStock);
    }, 60);
    res.json(data);
  } catch (err) { res.json(getFallbackLosers()); }
});

// ── SINGLE QUOTE ──────────────────────────────────────────────────
router.get('/quote/:symbol', async function(req, res) {
  try {
    const result = await nseGet('https://www.nseindia.com/api/quote-equity?symbol=' + req.params.symbol);
    const p = result.data.priceInfo;
    res.json({ symbol: req.params.symbol, price: p.lastPrice, open: p.open, close: p.previousClose, change: p.change, changePct: p.pChange });
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

// ── MULTIPLE QUOTES (Watchlist / Portfolio) ───────────────────────
// ── MULTIPLE QUOTES (Watchlist / Portfolio) — Yahoo Finance ───────
router.post('/quotes', async function(req, res) {
  try {
    const symbols = req.body.symbols || [];
    if (symbols.length === 0) return res.json([]);

    // Convert NSE symbols to Yahoo Finance format (append .NS)
    const yahooSymbols = symbols.map(function(s) { return s + '.NS'; });

    const result = await axios.get(
      'https://query1.finance.yahoo.com/v7/finance/quote?symbols=' + yahooSymbols.join(','),
      {
        timeout: 12000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
          'Accept':     'application/json',
        }
      }
    );

    const quotes = result.data.quoteResponse.result || [];
    const results = symbols.map(function(symbol) {
      const q = quotes.find(function(q) { return q.symbol === symbol + '.NS'; });
      if (!q) return { symbol, error: true, price: '0', change: '0', changePct: '0%' };
      return {
        symbol,
        price:     q.regularMarketPrice.toFixed(2),
        change:    q.regularMarketChange.toFixed(2),
        changePct: q.regularMarketChangePercent.toFixed(2) + '%',
      };
    });
    res.json(results);
  } catch (err) {
    console.log('Quotes error:', err.message);
    res.status(500).json({ error: 'Failed to fetch quotes' });
  }
});

// ── INTRADAY CHART ────────────────────────────────────────────────
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

// ── CRYPTO (CoinGecko — specific IDs) ────────────────────────────
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
        { timeout: 12000, headers: { 'Accept': 'application/json' } }
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

// ── MUTUAL FUNDS (mfapi.in → AMFI) ───────────────────────────────
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

// ── COMMODITIES (Yahoo Finance — real live prices in INR) ─────────
router.get('/commodities', async function(req, res) {
  try {
    const data = await getCached('commodities', async function() {
      // Yahoo Finance symbols:
      // GC=F  = Gold futures (USD/troy oz)
      // SI=F  = Silver futures (USD/troy oz)
      // CL=F  = Crude Oil WTI futures (USD/bbl)
      // NG=F  = Natural Gas futures (USD/mmBtu)
      // HG=F  = Copper futures (USD/lb)
      // ALI=F = Aluminium futures (USD/lb)
      // INRUSD=X for conversion rate
      const symbols = ['GC=F', 'SI=F', 'CL=F', 'NG=F', 'HG=F', 'INRUSD=X'];
      const result  = await axios.get(
        'https://query1.finance.yahoo.com/v7/finance/quote?symbols=' + symbols.join(','),
        {
          timeout: 10000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
            'Accept':     'application/json',
          }
        }
      );

      const quotes = result.data.quoteResponse.result || [];
      const find   = function(sym) { return quotes.find(function(q) { return q.symbol === sym; }); };

      const inrRate = find('INRUSD=X');
      // INRUSD=X gives how many USD = 1 INR, so INR per USD = 1 / rate
      const usdToInr = inrRate ? (1 / inrRate.regularMarketPrice) : 84;

      const gold   = find('GC=F');   // USD per troy oz
      const silver = find('SI=F');   // USD per troy oz
      const crude  = find('CL=F');   // USD per barrel
      const natgas = find('NG=F');   // USD per mmBtu
      const copper = find('HG=F');   // USD per pound

      // Conversion helpers
      const toInr  = function(usd) { return Math.round(usd * usdToInr); };
      // Gold: USD/troy oz → INR/10g  (1 troy oz = 31.1035g, so per 10g = price/3.11035)
      const goldInr   = gold   ? Math.round((gold.regularMarketPrice   / 31.1035) * 10 * usdToInr) : 71240;
      // Silver: USD/troy oz → INR/kg  (1 troy oz = 0.0311035 kg, so per kg = price/0.0311035)
      const silverInr = silver ? Math.round((silver.regularMarketPrice / 0.0311035) * usdToInr)    : 84500;
      // Crude: USD/bbl → INR/bbl
      const crudeInr  = crude  ? Math.round(crude.regularMarketPrice  * usdToInr) : 6842;
      // Natural Gas: USD/mmBtu → INR/mmBtu
      const natgasInr = natgas ? Math.round(natgas.regularMarketPrice * usdToInr) : 287;
      // Copper: USD/lb → INR/kg (1 kg = 2.20462 lb)
      const copperInr = copper ? Math.round((copper.regularMarketPrice * 2.20462) * usdToInr) : 812;

      const fmt = function(q, convertedPrice, prevConvertedPrice) {
        if (!q) return null;
        const chgPct = q.regularMarketChangePercent || 0;
        const chgAmt = prevConvertedPrice
          ? convertedPrice - prevConvertedPrice
          : convertedPrice * chgPct / 100;
        const sign = chgAmt >= 0 ? '+' : '-';
        return {
          price:     convertedPrice,
          changePct: (chgAmt >= 0 ? '+' : '') + chgPct.toFixed(2) + '%',
          changeAmt: sign + 'Rs.' + Math.abs(Math.round(chgAmt)).toLocaleString('en-IN'),
          isUp:      chgAmt >= 0,
          usdRate:   usdToInr.toFixed(2),
        };
      };

      return {
        gold:       { ...fmt(gold,   goldInr),   unit: '10g',   label: 'Gold'        },
        silver:     { ...fmt(silver, silverInr), unit: 'kg',    label: 'Silver'      },
        crude:      { ...fmt(crude,  crudeInr),  unit: 'bbl',   label: 'Crude Oil'   },
        naturalgas: { ...fmt(natgas, natgasInr), unit: 'mmBtu', label: 'Natural Gas' },
        copper:     { ...fmt(copper, copperInr), unit: 'kg',    label: 'Copper'      },
      };
    }, 60); // cache 60 seconds
    res.json(data);
  } catch (err) {
    console.log('Commodities error:', err.message);
    // Fallback with realistic static values
    res.json({
      gold:       { price: 71240, changePct: '+0.18%', changeAmt: '+Rs.128',  isUp: true,  unit: '10g',   label: 'Gold'        },
      silver:     { price: 84500, changePct: '+0.32%', changeAmt: '+Rs.270',  isUp: true,  unit: 'kg',    label: 'Silver'      },
      crude:      { price: 6842,  changePct: '-0.44%', changeAmt: '-Rs.30',   isUp: false, unit: 'bbl',   label: 'Crude Oil'   },
      naturalgas: { price: 287,   changePct: '+1.12%', changeAmt: '+Rs.3',    isUp: true,  unit: 'mmBtu', label: 'Natural Gas' },
      copper:     { price: 812,   changePct: '+0.55%', changeAmt: '+Rs.4',    isUp: true,  unit: 'kg',    label: 'Copper'      },
    });
  }
});

// ── NEWS (fallback only — actual news served from browser via NewsAPI) ──
router.get('/news', async function(req, res) {
  try {
    const KEY = process.env.NEWS_API_KEY;
    if (!KEY || KEY === 'your_newsapi_key_here') throw new Error('No key');
    const data = await getCached('news', async function() {
      const result = await axios.get(
        'https://newsapi.org/v2/everything' +
        '?q=india+stock+market+nifty+sensex+economy+RBI+crypto' +
        '&sortBy=publishedAt' +
        '&pageSize=15' +
        '&language=en' +
        '&apiKey=' + KEY,
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

// ── MARKET STATUS ─────────────────────────────────────────────────
router.get('/status', function(req, res) {
  const ist       = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const day       = ist.getDay();
  const totalMins = ist.getHours() * 60 + ist.getMinutes();
  const isWeekday = day >= 1 && day <= 5;
  const isOpen    = isWeekday && totalMins >= 555 && totalMins < 930;
  const isPre     = isWeekday && totalMins >= 540 && totalMins < 555;
  res.json({
    isOpen,
    isPreOpen: isPre,
    status:    isOpen ? 'Market Open' : isPre ? 'Pre-Open Session' : 'Market Closed',
    message:   isOpen ? 'NSE and BSE trading live' : 'Opens Mon–Fri 9:15 AM IST',
    time:      ist.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    day:       ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][day],
  });
});

// ── FALLBACKS ─────────────────────────────────────────────────────
function getFallbackGainers() {
  return [
    { symbol: 'ETERNAL',    ltp: 234.55,  netPrice: 5.63, tradedQuantity: 49176321 },
    { symbol: 'TATASTEEL',  ltp: 192.23,  netPrice: 2.83, tradedQuantity: 20468067 },
    { symbol: 'M&M',        ltp: 3112.80, netPrice: 2.53, tradedQuantity: 2302037  },
    { symbol: 'HDFCLIFE',   ltp: 640.70,  netPrice: 2.35, tradedQuantity: 1609934  },
    { symbol: 'BHARTIARTL', ltp: 1815.90, netPrice: 1.81, tradedQuantity: 3283765  },
    { symbol: 'RELIANCE',   ltp: 1285.40, netPrice: 1.12, tradedQuantity: 3456789  },
    { symbol: 'HDFCBANK',   ltp: 1762.30, netPrice: 0.67, tradedQuantity: 4567890  },
    { symbol: 'AXISBANK',   ltp: 1124.40, netPrice: 0.33, tradedQuantity: 3456789  },
  ];
}

function getFallbackLosers() {
  return [
    { symbol: 'WIPRO',      ltp: 190.92,  netPrice: -2.15, tradedQuantity: 13827722 },
    { symbol: 'BAJFINANCE', ltp: 866.70,  netPrice: -1.30, tradedQuantity: 5215656  },
    { symbol: 'INFY',       ltp: 1233.80, netPrice: -1.30, tradedQuantity: 5882698  },
    { symbol: 'CIPLA',      ltp: 1283.90, netPrice: -1.24, tradedQuantity: 881525   },
    { symbol: 'ADANIENT',   ltp: 1950.20, netPrice: -1.00, tradedQuantity: 2345678  },
    { symbol: 'TCS',        ltp: 3387.75, netPrice: -0.34, tradedQuantity: 2345678  },
    { symbol: 'ITC',        ltp: 428.90,  netPrice: -0.14, tradedQuantity: 6789012  },
    { symbol: 'NESTLEIND',  ltp: 2245.30, netPrice: -0.77, tradedQuantity: 1234567  },
  ];
}

function getFallbackCrypto() {
  return [
    { id: 'bitcoin',     symbol: 'BTC', name: 'Bitcoin',  image: '', price: 6887640, change24h: '3.22',  change7d: '5.10',  change1h: '0.45',  marketCap: 135000000000000, volume: 2500000000000, high24h: 7100000, low24h: 6650000 },
    { id: 'ethereum',    symbol: 'ETH', name: 'Ethereum', image: '', price: 334500,  change24h: '1.87',  change7d: '3.20',  change1h: '0.22',  marketCap: 40000000000000,  volume: 1200000000000, high24h: 345000,  low24h: 325000  },
    { id: 'solana',      symbol: 'SOL', name: 'Solana',   image: '', price: 14890,   change24h: '5.10',  change7d: '8.40',  change1h: '1.20',  marketCap: 6500000000000,   volume: 450000000000,  high24h: 15500,   low24h: 14100   },
    { id: 'binancecoin', symbol: 'BNB', name: 'BNB',      image: '', price: 34400,   change24h: '-0.44', change7d: '1.20',  change1h: '-0.10', marketCap: 5200000000000,   volume: 380000000000,  high24h: 35000,   low24h: 34000   },
    { id: 'ripple',      symbol: 'XRP', name: 'XRP',      image: '', price: 53,      change24h: '1.20',  change7d: '2.80',  change1h: '0.30',  marketCap: 2900000000000,   volume: 280000000000,  high24h: 55,      low24h: 52      },
  ];
}

function getFallbackNews() {
  return [
    { title: 'RBI holds repo rate at 6.5% amid global uncertainty',         source: 'Economic Times',    url: '#', image: null, time: new Date(Date.now() - 30  * 60000).toISOString(), description: 'The Reserve Bank of India kept rates unchanged.'     },
    { title: 'Reliance Q3 net profit surges 18% YoY to Rs.18540 Cr',        source: 'Moneycontrol',      url: '#', image: null, time: new Date(Date.now() - 60  * 60000).toISOString(), description: 'Reliance Industries posts strong quarterly results.' },
    { title: 'Nifty eyes 23500 resistance; FII inflows of Rs.4200 Cr',       source: 'Business Standard', url: '#', image: null, time: new Date(Date.now() - 90  * 60000).toISOString(), description: 'Foreign institutional investors continue buying.'   },
    { title: 'Bitcoin surges past $85K on spot ETF inflow uptick',           source: 'CoinDesk India',    url: '#', image: null, time: new Date(Date.now() - 120 * 60000).toISOString(), description: 'Crypto markets rally on institutional demand.'      },
    { title: 'SEBI tightens F and O rules; new lot sizes from April',        source: 'Livemint',          url: '#', image: null, time: new Date(Date.now() - 150 * 60000).toISOString(), description: 'Market regulator announces new derivatives rules.'  },
    { title: 'Gold hits Rs.71240 per 10g on safe-haven demand',             source: 'Reuters India',     url: '#', image: null, time: new Date(Date.now() - 180 * 60000).toISOString(), description: 'Precious metals gain on global uncertainty.'        },
    { title: 'Tata Motors Q3 results: PAT up 22%, revenue beats estimates',  source: 'NDTV Profit',       url: '#', image: null, time: new Date(Date.now() - 210 * 60000).toISOString(), description: 'Tata Motors posts better than expected earnings.'   },
    { title: 'Sensex gains 400 pts; IT stocks lead broad market rally',      source: 'Economic Times',    url: '#', image: null, time: new Date(Date.now() - 240 * 60000).toISOString(), description: 'Broad market rally on positive global cues.'        },
    { title: 'Adani Ports Q3: Net profit rises 19% to Rs.2100 Cr',          source: 'Moneycontrol',      url: '#', image: null, time: new Date(Date.now() - 270 * 60000).toISOString(), description: 'Port volumes grow steadily in Q3 FY25.'            },
    { title: 'SBI reports record quarterly profit of Rs.16891 Cr',          source: 'Business Standard', url: '#', image: null, time: new Date(Date.now() - 300 * 60000).toISOString(), description: 'State Bank of India beats analyst estimates.'        },
    { title: 'Crude oil falls to $78 as US inventories rise sharply',       source: 'Reuters India',     url: '#', image: null, time: new Date(Date.now() - 330 * 60000).toISOString(), description: 'Oil prices decline on rising US crude stocks.'       },
    { title: 'HDFC Bank Q3: NII up 24%, deposits grow 26%',                source: 'NDTV Profit',       url: '#', image: null, time: new Date(Date.now() - 360 * 60000).toISOString(), description: 'HDFC Bank posts steady growth in Q3 FY25.'          },
    { title: 'Infosys raises FY25 revenue guidance to 4.5-5%',             source: 'Livemint',          url: '#', image: null, time: new Date(Date.now() - 390 * 60000).toISOString(), description: 'IT major upgrades outlook on deal momentum.'         },
    { title: 'Hyundai India IPO oversubscribed 2.4x on retail demand',     source: 'Mint',              url: '#', image: null, time: new Date(Date.now() - 420 * 60000).toISOString(), description: 'Strong investor interest in Hyundai listing.'       },
    { title: 'NSE introduces new circuit breaker rules for F&O segment',   source: 'Economic Times',    url: '#', image: null, time: new Date(Date.now() - 450 * 60000).toISOString(), description: 'New risk management framework for derivatives.'      },
  ];
}

module.exports = router;