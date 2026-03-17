const express = require('express');
const axios   = require('axios');
const router  = express.Router();

const cache = {};
const getCached = async function(key, fn, ttl) {
  const now = Date.now();
  if (cache[key] && now - cache[key].time < ttl * 1000) return cache[key].data;
  const data = await fn();
  cache[key] = { data, time: now };
  return data;
};

let nseCookie = '';
let cookieTime = 0;

const getNSECookie = async function() {
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
      nseCookie  = cookies.map(function(c) { return c.split(';')[0]; }).join('; ');
      cookieTime = Date.now();
    }
  } catch (e) {
    console.log('NSE cookie error:', e.message);
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
    ltp:            s.ltp || 0,
    netPrice:       s.perChange || s.net_price || s.netPrice || 0,
    tradedQuantity: s.trade_quantity || s.tradedQuantity || 0,
  };
};

router.get('/indices', async function(req, res) {
  try {
    const data = await getCached('indices', async function() {
      const result = await nseGet('https://www.nseindia.com/api/allIndices');
      const wanted = ['NIFTY 50', 'NIFTY BANK', 'NIFTY IT', 'NIFTY MIDCAP 100'];
      return result.data.data.filter(function(i) { return wanted.includes(i.index); });
    }, 30);
    res.json(data);
  } catch (err) {
    console.log('Indices fallback');
    res.json([
      { index: 'NIFTY 50',         last: 23464.35, change: 178.45, pChange: 0.77  },
      { index: 'NIFTY BANK',       last: 54430.80, change: 321.10, pChange: 0.59  },
      { index: 'NIFTY IT',         last: 28826.30, change: -95.40, pChange: -0.33 },
      { index: 'NIFTY MIDCAP 100', last: 52140.30, change: 420.15, pChange: 0.81  },
    ]);
  }
});

router.get('/gainers', async function(req, res) {
  try {
    const data = await getCached('gainers', async function() {
      const result = await nseGet('https://www.nseindia.com/api/live-analysis-variations?index=gainers');
      const list = result.data.NIFTY && result.data.NIFTY.data
        ? result.data.NIFTY.data.slice(0, 10)
        : null;
      if (!list || list.length === 0) return getFallbackGainers();
      return list.map(normalizeStock);
    }, 60);
    res.json(data);
  } catch (err) {
    console.log('Gainers fallback');
    res.json(getFallbackGainers());
  }
});

router.get('/losers', async function(req, res) {
  try {
    const data = await getCached('losers', async function() {
      const result = await nseGet('https://www.nseindia.com/api/live-analysis-variations?index=loosers');
      const list = result.data.NIFTY && result.data.NIFTY.data
        ? result.data.NIFTY.data.slice(0, 10)
        : null;
      if (!list || list.length === 0) return getFallbackLosers();
      return list.map(normalizeStock);
    }, 60);
    res.json(data);
  } catch (err) {
    console.log('Losers fallback');
    res.json(getFallbackLosers());
  }
});

router.get('/debug-gainers', async function(req, res) {
  try {
    const result = await nseGet('https://www.nseindia.com/api/live-analysis-variations?index=gainers');
    const first = result.data.NIFTY && result.data.NIFTY.data ? result.data.NIFTY.data[0] : {};
    res.json({ keys: Object.keys(first), sample: first });
  } catch (err) {
    res.json({ error: err.message });
  }
});

router.get('/quote/:symbol', async function(req, res) {
  try {
    const result = await nseGet('https://www.nseindia.com/api/quote-equity?symbol=' + req.params.symbol);
    const p = result.data.priceInfo;
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

router.post('/quotes', async function(req, res) {
  try {
    const symbols = req.body.symbols;
    const results = await Promise.all(
      symbols.map(async function(symbol) {
        try {
          const result = await nseGet('https://www.nseindia.com/api/quote-equity?symbol=' + symbol);
          const p = result.data.priceInfo;
          return {
            symbol:    symbol,
            price:     p.lastPrice.toFixed(2),
            change:    p.change.toFixed(2),
            changePct: p.pChange.toFixed(2) + '%',
          };
        } catch (e) {
          return { symbol: symbol, error: true, price: '0', change: '0', changePct: '0%' };
        }
      })
    );
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch quotes' });
  }
});

router.get('/chart/:symbol', async function(req, res) {
  try {
    const result = await nseGet('https://www.nseindia.com/api/chart-databyindex?index=' + req.params.symbol + 'EQN');
    const points = result.data.grapthData || result.data.graphData || [];
    res.json(points.map(function(p) { return { time: p[0], price: p[1] }; }));
  } catch (err) {
    console.log('Chart fallback');
    let v = 23400;
    const points = Array.from({ length: 75 }, function(_, i) {
      v += (Math.random() - 0.47) * 40;
      const h = 9 + Math.floor(i * (6.5 / 75));
      const m = Math.floor((i * (390 / 75)) % 60);
      return { time: h + ':' + String(m).padStart(2, '0'), price: Math.round(v) };
    });
    res.json(points);
  }
});

router.get('/crypto', async function(req, res) {
  try {
    const data = await getCached('crypto', async function() {
      const result = await axios.get(
        'https://api.coingecko.com/api/v3/coins/markets' +
        '?vs_currency=inr&order=market_cap_desc&per_page=15&page=1&price_change_percentage=1h,24h,7d',
        { timeout: 10000, headers: { 'Accept': 'application/json' } }
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
          change:   change,
        };
      }));
    }, 3600);
    res.json(data);
  } catch (err) {
    console.log('MF error:', err.message);
    res.status(500).json({ error: 'Failed to fetch mutual funds' });
  }
});

router.get('/commodities', async function(req, res) {
  res.json({
    gold:   { price: 71240 + Math.floor(Math.random() * 200 - 100), change: '+0.18%', unit: '10g'  },
    silver: { price: 84500 + Math.floor(Math.random() * 500 - 250), change: '+0.32%', unit: 'kg'   },
    crude:  { price: 6842  + Math.floor(Math.random() * 50  - 25),  change: '-0.44%', unit: 'bbl'  },
  });
});

router.get('/news', async function(req, res) {
  try {
    const KEY = process.env.NEWS_API_KEY;
    if (!KEY || KEY === 'your_newsapi_key_here') throw new Error('No key');
    const data = await getCached('news', async function() {
      const result = await axios.get(
        'https://newsapi.org/v2/everything?q=india+stock+market+nifty+sensex&sortBy=publishedAt&pageSize=15&language=en&apiKey=' + KEY,
        { timeout: 8000 }
      );
      return result.data.articles.map(function(a) {
        return {
          title:       a.title,
          source:      a.source.name,
          url:         a.url,
          image:       a.urlToImage,
          time:        a.publishedAt,
          description: a.description,
        };
      });
    }, 600);
    res.json(data);
  } catch (err) {
    console.log('News fallback:', err.message);
    res.json(getFallbackNews());
  }
});

router.get('/status', function(req, res) {
  const ist  = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const day  = ist.getDay();
  const mins = ist.getHours() * 60 + ist.getMinutes();
  const isOpen = day >= 1 && day <= 5 && mins >= 555 && mins <= 930;
  const isPre  = day >= 1 && day <= 5 && mins >= 540 && mins < 555;
  res.json({
    isOpen:    isOpen,
    isPreOpen: isPre,
    status:    isOpen ? 'Market Open' : isPre ? 'Pre-Open Session' : 'Market Closed',
    message:   isOpen ? 'NSE and BSE trading live' : 'Opens Mon-Fri 9:15 AM IST',
    time:      ist.toLocaleTimeString('en-IN'),
  });
});

function getFallbackGainers() {
  return [
    { symbol: 'ETERNAL',    ltp: 232.59,  netPrice: 3.20, tradedQuantity: 8234567 },
    { symbol: 'TATASTEEL',  ltp: 191.25,  netPrice: 2.80, tradedQuantity: 9234567 },
    { symbol: 'M&M',        ltp: 3103.20, netPrice: 2.11, tradedQuantity: 2345678 },
    { symbol: 'HDFCLIFE',   ltp: 638.45,  netPrice: 1.55, tradedQuantity: 3456789 },
    { symbol: 'BHARTIARTL', ltp: 1815.90, netPrice: 1.40, tradedQuantity: 5678901 },
    { symbol: 'RELIANCE',   ltp: 1285.40, netPrice: 1.12, tradedQuantity: 3456789 },
    { symbol: 'HDFCBANK',   ltp: 1762.30, netPrice: 0.67, tradedQuantity: 4567890 },
    { symbol: 'AXISBANK',   ltp: 1124.40, netPrice: 0.33, tradedQuantity: 3456789 },
  ];
}

function getFallbackLosers() {
  return [
    { symbol: 'WIPRO',      ltp: 190.74,  netPrice: -2.10, tradedQuantity: 9234567 },
    { symbol: 'BAJFINANCE', ltp: 863.40,  netPrice: -1.80, tradedQuantity: 2134567 },
    { symbol: 'CIPLA',      ltp: 1279.60, netPrice: -1.44, tradedQuantity: 1234567 },
    { symbol: 'ADANIENT',   ltp: 1950.20, netPrice: -1.22, tradedQuantity: 2345678 },
    { symbol: 'ADANIPORTS', ltp: 1355.80, netPrice: -0.88, tradedQuantity: 4567890 },
    { symbol: 'INFY',       ltp: 1423.60, netPrice: -0.77, tradedQuantity: 3456789 },
    { symbol: 'TCS',        ltp: 3387.75, netPrice: -0.34, tradedQuantity: 2345678 },
    { symbol: 'ITC',        ltp: 428.90,  netPrice: -0.14, tradedQuantity: 6789012 },
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
    { title: 'RBI holds repo rate at 6.5% amid global uncertainty',           source: 'Economic Times',    url: '#', image: null, time: new Date(Date.now() - 9   * 60000).toISOString(), description: 'The Reserve Bank of India kept rates unchanged.' },
    { title: 'Reliance Q3 net profit surges 18% YoY to Rs.18,540 Cr',         source: 'Moneycontrol',      url: '#', image: null, time: new Date(Date.now() - 24  * 60000).toISOString(), description: 'Reliance Industries posts strong quarterly results.' },
    { title: 'Nifty eyes 22,500 resistance; FII inflows of Rs.4,200 Cr',      source: 'Business Standard', url: '#', image: null, time: new Date(Date.now() - 41  * 60000).toISOString(), description: 'Foreign institutional investors continue buying.' },
    { title: 'Bitcoin surges past $82K on spot ETF inflow uptick',             source: 'CoinDesk India',    url: '#', image: null, time: new Date(Date.now() - 60  * 60000).toISOString(), description: 'Crypto markets rally on institutional demand.' },
    { title: 'Hyundai India IPO oversubscribed 2.4x on Day 2',                source: 'Mint',              url: '#', image: null, time: new Date(Date.now() - 120 * 60000).toISOString(), description: 'Strong investor interest in Hyundai listing.' },
    { title: 'Gold hits Rs.71,240 per 10g on safe-haven demand',              source: 'Reuters India',     url: '#', image: null, time: new Date(Date.now() - 180 * 60000).toISOString(), description: 'Precious metals gain on global uncertainty.' },
    { title: 'Tata Motors Q3 results: PAT up 22%, revenue beats estimates',    source: 'NDTV Profit',       url: '#', image: null, time: new Date(Date.now() - 240 * 60000).toISOString(), description: 'Tata Motors posts better than expected earnings.' },
    { title: 'SEBI tightens F and O rules; new lot sizes effective from April',source: 'Livemint',          url: '#', image: null, time: new Date(Date.now() - 300 * 60000).toISOString(), description: 'Market regulator announces new derivatives rules.' },
  ];
}

module.exports = router;