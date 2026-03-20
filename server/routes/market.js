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
    ltp:            s.ltp || s.lastPrice || s.last || 0,
    netPrice:       s.perChange || s.netPrice || s.pChange || 0,
    tradedQuantity: s.trade_quantity || s.tradedQuantity || s.totalTradedVolume || 0,
  };
};

// ── INDICES ───────────────────────────────────────────────────────
router.get('/indices', async function(req, res) {
  try {
    const data = await getCached('indices', async function() {
      const result = await nseGet('https://www.nseindia.com/api/allIndices');
      const wanted = ['NIFTY 50', 'NIFTY BANK', 'NIFTY IT', 'NIFTY MIDCAP 100'];
      return result.data.data
        .filter(function(i) { return wanted.includes(i.index); })
        .map(function(i) {
          return {
            index:   i.index,
            last:    i.last,
            change:  i.variation,
            pChange: i.percentChange,
          };
        });
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

// ── TOP GAINERS ───────────────────────────────────────────────────
router.get('/gainers', async function(req, res) {
  try {
    const data = await getCached('gainers', async function() {
      const result = await nseGet('https://www.nseindia.com/api/live-analysis-variations?index=gainers');
      const list = result.data.NIFTY && result.data.NIFTY.data
        ? result.data.NIFTY.data.slice(0, 10) : null;
      if (!list || list.length === 0) return getFallbackGainers();
      return list.map(normalizeStock);
    }, 60);
    res.json(data);
  } catch (err) {
    console.log('Gainers fallback');
    res.json(getFallbackGainers());
  }
});

// ── TOP LOSERS ────────────────────────────────────────────────────
router.get('/losers', async function(req, res) {
  try {
    const data = await getCached('losers', async function() {
      const result = await nseGet('https://www.nseindia.com/api/live-analysis-variations?index=loosers');
      const list = result.data.NIFTY && result.data.NIFTY.data
        ? result.data.NIFTY.data.slice(0, 10) : null;
      if (!list || list.length === 0) return getFallbackLosers();
      return list.map(normalizeStock);
    }, 60);
    res.json(data);
  } catch (err) {
    console.log('Losers fallback');
    res.json(getFallbackLosers());
  }
});

// ── DEBUG GAINERS ─────────────────────────────────────────────────
router.get('/debug-gainers', async function(req, res) {
  try {
    const result = await nseGet('https://www.nseindia.com/api/live-analysis-variations?index=gainers');
    const first = result.data.NIFTY && result.data.NIFTY.data ? result.data.NIFTY.data[0] : {};
    res.json({ keys: Object.keys(first), sample: first });
  } catch (err) {
    res.json({ error: err.message });
  }
});

// ── SINGLE STOCK QUOTE ────────────────────────────────────────────
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

// ── MULTIPLE QUOTES (Watchlist and Portfolio) ─────────────────────
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

// ── INTRADAY CHART ────────────────────────────────────────────────
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

// ── CRYPTO (CoinGecko) ────────────────────────────────────────────
router.get('/crypto', async function(req, res) {
  try {
    const data = await getCached('crypto', async function() {
      // Fetch all coins we support by ID so none are missed
      const ALL_IDS = [
        'bitcoin','ethereum','binancecoin','solana','ripple',
        'cardano','dogecoin','polkadot','shiba-inu','avalanche-2',
        'matic-network','chainlink','litecoin','uniswap','stellar',
        'tron','cosmos','near','pepe','filecoin',
        'the-open-network','aptos','sui','arbitrum','optimism'
      ].join(',');
      const result = await axios.get(
        'https://api.coingecko.com/api/v3/coins/markets' +
        '?vs_currency=inr&ids=' + ALL_IDS +
        '&order=market_cap_desc&per_page=50&page=1&price_change_percentage=1h,24h,7d',
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
    }, 60);
    res.json(data);
  } catch (err) {
    console.log('Crypto error:', err.message);
    res.json(getFallbackCrypto());
  }
});

// ── MUTUAL FUNDS ──────────────────────────────────────────────────
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

// ── COMMODITIES (all 8 types) ─────────────────────────────────────
router.get('/commodities', async function(req, res) {
  res.json({
    gold:       { price: 71240 + Math.floor(Math.random() * 200 - 100), change: '+0.18%', unit: '10g'   },
    silver:     { price: 84500 + Math.floor(Math.random() * 500 - 250), change: '+0.32%', unit: 'kg'    },
    crude:      { price: 6842  + Math.floor(Math.random() * 50  - 25),  change: '-0.44%', unit: 'bbl'   },
    naturalgas: { price: 287   + Math.floor(Math.random() * 10  - 5),   change: '+1.12%', unit: 'mmBtu' },
    copper:     { price: 812   + Math.floor(Math.random() * 20  - 10),  change: '+0.55%', unit: 'kg'    },
    aluminium:  { price: 224   + Math.floor(Math.random() * 8   - 4),   change: '-0.22%', unit: 'kg'    },
    zinc:       { price: 268   + Math.floor(Math.random() * 10  - 5),   change: '+0.38%', unit: 'kg'    },
    nickel:     { price: 1342  + Math.floor(Math.random() * 30  - 15),  change: '-0.15%', unit: 'kg'    },
  });
});

// ── NEWS ──────────────────────────────────────────────────────────
router.get('/news', async function(req, res) {
  try {
    const KEY  = process.env.NEWS_API_KEY;
    const page = parseInt(req.query.page) || 1;
    if (!KEY || KEY === 'your_newsapi_key_here') throw new Error('No key');

    // Fetch all 90 articles once and cache — uses only 1 API call per hour
    const allNews = await getCached('news_all', async function() {
      const result = await axios.get(
        'https://newsapi.org/v2/everything' +
        '?q=india+stock+market+nifty+sensex+economy+RBI+crypto' +
        '&sortBy=publishedAt' +
        '&pageSize=90' +
        '&page=1' +
        '&language=en' +
        '&apiKey=' + KEY,
        { timeout: 10000 }
      );
      return result.data.articles
        .filter(function(a) { return a.title && a.title !== '[Removed]'; })
        .map(function(a) {
          return {
            title:       a.title,
            source:      a.source.name,
            url:         a.url,
            image:       a.urlToImage,
            time:        a.publishedAt,
            description: a.description,
          };
        });
    }, 3600); // cache for 1 hour = 24 API calls per day max

    // Return 15 articles per page from the cached full list
    const start = (page - 1) * 15;
    const slice = allNews.slice(start, start + 15);
    res.json(slice);

  } catch (err) {
    console.log('News error:', err.message);
    if (page === 1) {
      res.json(getFallbackNews());
    } else {
      res.json([]);
    }
  }
});
// ── MARKET STATUS ─────────────────────────────────────────────────
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

// ── FALLBACK DATA ─────────────────────────────────────────────────
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
    { id: 'bitcoin',     symbol: 'BTC',  name: 'Bitcoin',  image: '', price: 6887640, change24h: '3.22',  change7d: '5.10',  change1h: '0.45',  marketCap: 135000000000000, volume: 2500000000000, high24h: 7100000, low24h: 6650000 },
    { id: 'ethereum',    symbol: 'ETH',  name: 'Ethereum', image: '', price: 334500,  change24h: '1.87',  change7d: '3.20',  change1h: '0.22',  marketCap: 40000000000000,  volume: 1200000000000, high24h: 345000,  low24h: 325000  },
    { id: 'solana',      symbol: 'SOL',  name: 'Solana',   image: '', price: 14890,   change24h: '5.10',  change7d: '8.40',  change1h: '1.20',  marketCap: 6500000000000,   volume: 450000000000,  high24h: 15500,   low24h: 14100   },
    { id: 'binancecoin', symbol: 'BNB',  name: 'BNB',      image: '', price: 34400,   change24h: '-0.44', change7d: '1.20',  change1h: '-0.10', marketCap: 5200000000000,   volume: 380000000000,  high24h: 35000,   low24h: 34000   },
    { id: 'ripple',      symbol: 'XRP',  name: 'XRP',      image: '', price: 53,      change24h: '1.20',  change7d: '2.80',  change1h: '0.30',  marketCap: 2900000000000,   volume: 280000000000,  high24h: 55,      low24h: 52      },
  ];
}

function getFallbackNews() {
  var now = Date.now();
  return [
    { title: 'RBI holds repo rate at 6.5% amid global uncertainty',                    source: 'Economic Times',    url: '#', image: null, time: new Date(now - 5   * 60000).toISOString(), description: 'The Reserve Bank of India kept benchmark rates unchanged citing inflation concerns.'        },
    { title: 'Reliance Q3 net profit surges 18% YoY to Rs.18,540 Cr',                  source: 'Moneycontrol',      url: '#', image: null, time: new Date(now - 12  * 60000).toISOString(), description: 'Reliance Industries posts strong quarterly earnings driven by retail and Jio segments.'   },
    { title: 'Nifty eyes 23500 resistance; FII inflows of Rs.4200 Cr in two sessions',  source: 'Business Standard', url: '#', image: null, time: new Date(now - 22  * 60000).toISOString(), description: 'Foreign institutional investors turn buyers after three weeks of selling.'               },
    { title: 'Bitcoin crosses Rs.70 lakh mark; Ethereum up 4% in 24 hours',            source: 'CoinDesk India',    url: '#', image: null, time: new Date(now - 35  * 60000).toISOString(), description: 'Crypto markets see broad rally on ETF inflow data and improving sentiment.'              },
    { title: 'Adani Group stocks rally up to 6% on strong quarterly results',           source: 'NDTV Profit',       url: '#', image: null, time: new Date(now - 48  * 60000).toISOString(), description: 'Adani Enterprises and Adani Ports lead the gains in the Adani group rally.'             },
    { title: 'Hyundai India IPO oversubscribed 2.4x; strong retail interest seen',     source: 'Mint',              url: '#', image: null, time: new Date(now - 65  * 60000).toISOString(), description: 'Hyundai Motor India IPO receives robust response from all categories of investors.'      },
    { title: 'Gold hits Rs.71240 per 10g as US dollar weakens on Fed signals',         source: 'Reuters India',     url: '#', image: null, time: new Date(now - 80  * 60000).toISOString(), description: 'Precious metals gain as US Federal Reserve signals possible rate cuts ahead.'            },
    { title: 'Tata Motors Q3 results: PAT up 22%, JLR volumes beat estimates',         source: 'NDTV Profit',       url: '#', image: null, time: new Date(now - 95  * 60000).toISOString(), description: 'Tata Motors posts strong numbers driven by Jaguar Land Rover recovery.'                 },
    { title: 'SEBI tightens F and O norms; weekly expiry limited to one per exchange', source: 'Livemint',          url: '#', image: null, time: new Date(now - 115 * 60000).toISOString(), description: 'Market regulator SEBI announces sweeping changes to derivatives framework.'             },
    { title: 'Paytm shares jump 12% after RBI nod for payment aggregator licence',     source: 'Economic Times',    url: '#', image: null, time: new Date(now - 130 * 60000).toISOString(), description: 'One97 Communications shares surge as regulatory overhang clears.'                       },
    { title: 'Nykaa reports 28% revenue growth; beauty segment leads expansion',       source: 'Business Standard', url: '#', image: null, time: new Date(now - 150 * 60000).toISOString(), description: 'FSN E-Commerce shows strong operational performance in Q3 FY25.'                        },
    { title: 'Smallcap index hits all-time high; 40 stocks touch 52-week highs',       source: 'Moneycontrol',      url: '#', image: null, time: new Date(now - 170 * 60000).toISOString(), description: 'Broader market outperforms benchmarks with strong breadth in midcap and smallcap space.' },
    { title: 'Coal India output rises 8% YoY; dividend payout likely to increase',    source: 'Reuters India',     url: '#', image: null, time: new Date(now - 190 * 60000).toISOString(), description: 'State-run coal giant posts record production driven by thermal power demand.'            },
    { title: 'HDFC Bank credit card spends hit Rs.50000 Cr in December quarter',      source: 'Mint',              url: '#', image: null, time: new Date(now - 210 * 60000).toISOString(), description: 'India largest private bank sees strong consumer spending recovery.'                     },
    { title: 'Zomato acquires Paytm entertainment business for Rs.2048 Cr',           source: 'Economic Times',    url: '#', image: null, time: new Date(now - 230 * 60000).toISOString(), description: 'Quick commerce giant expands into ticketing and events with strategic acquisition.'      },
    { title: 'HAL bags Rs.62000 Cr order for 156 LCA Tejas Mk1A fighter jets',        source: 'Business Standard', url: '#', image: null, time: new Date(now - 250 * 60000).toISOString(), description: 'Hindustan Aeronautics wins largest ever defence production contract from Indian Air Force.' },
    { title: 'Crude oil falls to 6800 per barrel; OMC stocks rally on margin relief', source: 'NDTV Profit',       url: '#', image: null, time: new Date(now - 270 * 60000).toISOString(), description: 'Lower crude prices benefit Indian oil marketing companies BPCL HPCL and IOC.'           },
    { title: 'IT sector Q3 preview: TCS Infosys Wipro expected to show 3-5% growth',  source: 'Livemint',          url: '#', image: null, time: new Date(now - 290 * 60000).toISOString(), description: 'Analysts expect IT services recovery driven by BFSI and healthcare verticals.'           },
    { title: 'SBI reports record Q3 profit of Rs.16891 Cr on strong NII growth',      source: 'Moneycontrol',      url: '#', image: null, time: new Date(now - 310 * 60000).toISOString(), description: 'State Bank of India posts best ever quarterly results on improving asset quality.'       },
    { title: 'Sensex crosses 77000 for first time; banking stocks lead rally',         source: 'Reuters India',     url: '#', image: null, time: new Date(now - 330 * 60000).toISOString(), description: 'Indian benchmark indices hit fresh lifetime highs on strong domestic fundamentals.'      },
  ];
}

module.exports = router;