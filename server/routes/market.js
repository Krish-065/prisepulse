const express = require('express');
const axios   = require('axios');
const router  = express.Router();

// ── TWO-LAYER CACHE ────────────────────────────────────────────────
const cache    = {};
const lastGood = {};

const getCached = async function(key, fn, ttl) {
  const now = Date.now();
  if (cache[key] && now - cache[key].time < ttl * 1000) return cache[key].data;
  try {
    const data = await fn();
    cache[key]    = { data, time: now };
    lastGood[key] = { data, time: now };
    return data;
  } catch (err) {
    if (lastGood[key]) {
      console.log('[Cache] lastGood for', key, ':', err.message);
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
        'Accept':          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Connection':      'keep-alive',
      },
      timeout: 10000
    });
    const cookies = res.headers['set-cookie'];
    if (cookies) {
      nseCookie  = cookies.map(c => c.split(';')[0]).join('; ');
      cookieTime = Date.now();
      console.log('[NSE] Cookie refreshed');
    }
  } catch (e) {
    console.log('[NSE] Cookie failed:', e.message);
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

// ── FETCH INDICES: NSE allIndices (live) → Yahoo Finance → Stooq ──
// Priority order: NSE (most accurate live) > Yahoo > Stooq (EOD only)

const fetchFromNSE = async function() {
  const res = await nseGet('https://www.nseindia.com/api/allIndices');
  const indices = res.data.data || [];
  const find = name => indices.find(i => i.index === name || i.indexSymbol === name);

  const n  = find('NIFTY 50');
  const b  = find('NIFTY BANK');
  const it = find('NIFTY IT');
  // SENSEX is a BSE index — NSE's allIndices sometimes includes it as 'S&P BSE SENSEX'
  // We try to find it but will fetch it separately if missing
  const s  = find('SENSEX') || find('S&P BSE SENSEX') || find('BSE SENSEX');

  if (!n || !n.last || n.last === 0) throw new Error('NSE returned zero for NIFTY 50');

  // Fetch SENSEX separately from Yahoo Finance if NSE didn't return it
  let sensexLast = 74742.5, sensexPct = -0.28, sensexChg = -209.9;  // Hardcoded fallback
  if (s && s.last && s.last > 0) {
    sensexLast = parseFloat(s.last);
    sensexPct  = parseFloat(s.percentChange || 0);
    sensexChg  = parseFloat(s.change || 0);
  } else {
    // Fetch ^BSESN directly from Yahoo
    try {
      const yr = await axios.get(
        'https://query1.finance.yahoo.com/v8/finance/quote?symbols=%5EBSESN',
        { timeout: 8000, headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json', 'Referer': 'https://finance.yahoo.com/' } }
      );
      const yq = (yr.data.quoteResponse && yr.data.quoteResponse.result) || [];
      const ys = yq.find(q => q.symbol === '^BSESN');

      if (ys && ys.regularMarketPrice && ys.regularMarketPrice > 0) {
        sensexLast = parseFloat(ys.regularMarketPrice.toFixed(2));
        sensexPct  = parseFloat((ys.regularMarketChangePercent || 0).toFixed(2));
        sensexChg  = parseFloat((ys.regularMarketChange || 0).toFixed(2));
        console.log('[NSE] SENSEX from Yahoo Finance:', sensexLast);
      } else {
        console.log('[NSE] Yahoo SENSEX invalid, using fallback');
      }
    } catch (e) {
      console.log('[NSE] SENSEX Yahoo fallback failed:', e.message);
    }
  }

  const result = [
    { index: 'NIFTY 50',   last: parseFloat(n.last),  pChange: parseFloat(n.percentChange || 0), change: parseFloat(n.change || 0) },
    { index: 'SENSEX',     last: sensexLast,           pChange: sensexPct,                        change: sensexChg                  },
    { index: 'NIFTY BANK', last: b  ? parseFloat(b.last)  : 0, pChange: b  ? parseFloat(b.percentChange  || 0) : 0, change: b  ? parseFloat(b.change  || 0) : 0 },
    { index: 'NIFTY IT',   last: it ? parseFloat(it.last) : 0, pChange: it ? parseFloat(it.percentChange || 0) : 0, change: it ? parseFloat(it.change || 0) : 0 },
  ];
  console.log('[NSE] NIFTY:', result[0].last, '| SENSEX:', result[1].last, '| BANK NIFTY:', result[2].last);
  return result;
};

const fetchFromYahoo = async function() {
  const symbols = ['^NSEI', '^BSESN', '^NSEBANK', 'NIFTY_IT.NS'];
  const urls = [
    'https://query1.finance.yahoo.com/v8/finance/quote?symbols=' + symbols.join(','),
    'https://query2.finance.yahoo.com/v8/finance/quote?symbols=' + symbols.join(','),
  ];
  for (let i = 0; i < urls.length; i++) {
    try {
      const result = await axios.get(urls[i], {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
          'Accept':     'application/json',
          'Referer':    'https://finance.yahoo.com/',
        }
      });
      const quotes = (result.data.quoteResponse && result.data.quoteResponse.result) || [];
      if (!quotes.length) continue;
      const find = sym => quotes.find(q => q.symbol === sym);
      const n = find('^NSEI'), s = find('^BSESN'), b = find('^NSEBANK'), it = find('NIFTY_IT.NS');
      if (!n || !n.regularMarketPrice || n.regularMarketPrice === 0) continue;
      const data = [
        { index: 'NIFTY 50',   last: parseFloat(n.regularMarketPrice.toFixed(2)),  pChange: parseFloat(n.regularMarketChangePercent.toFixed(2)),  change: parseFloat(n.regularMarketChange.toFixed(2))  },
        { index: 'SENSEX',     last: s  ? parseFloat(s.regularMarketPrice.toFixed(2))  : 0, pChange: s  ? parseFloat(s.regularMarketChangePercent.toFixed(2))  : 0, change: s  ? parseFloat(s.regularMarketChange.toFixed(2))  : 0 },
        { index: 'NIFTY BANK', last: b  ? parseFloat(b.regularMarketPrice.toFixed(2))  : 0, pChange: b  ? parseFloat(b.regularMarketChangePercent.toFixed(2))  : 0, change: b  ? parseFloat(b.regularMarketChange.toFixed(2))  : 0 },
        { index: 'NIFTY IT',   last: it ? parseFloat(it.regularMarketPrice.toFixed(2)) : 0, pChange: it ? parseFloat(it.regularMarketChangePercent.toFixed(2)) : 0, change: it ? parseFloat(it.regularMarketChange.toFixed(2)) : 0 },
      ];
      console.log('[Yahoo] Live:', data[0].index, data[0].last);
      return data;
    } catch (e) {
      console.log('[Yahoo] URL', i, 'failed:', e.message);
    }
  }
  throw new Error('Yahoo failed');
};

const fetchFromStooq = async function() {
  // Stooq = EOD data only, used as last resort when market is closed
  const stooqMap = [
    { stooq: '^nf50',   index: 'NIFTY 50'   },
    { stooq: '^bsesn',  index: 'SENSEX'     },
    { stooq: '^nfbank', index: 'NIFTY BANK' },
    { stooq: '^nfit',   index: 'NIFTY IT'   },
  ];
  const results = await Promise.all(stooqMap.map(async item => {
    try {
      const res = await axios.get('https://stooq.com/q/d/l/?s=' + item.stooq + '&i=d', {
        timeout: 10000, headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      const lines = res.data.trim().split('\n');
      if (lines.length < 2) return null;
      const cols   = lines[1].split(',');
      const close  = parseFloat(cols[4]);
      const open   = parseFloat(cols[1]);
      if (!close || close === 0) return null;
      const change    = parseFloat((close - open).toFixed(2));
      const changePct = parseFloat(((change / open) * 100).toFixed(2));
      return { index: item.index, last: close, pChange: changePct, change, open, high: parseFloat(cols[2]), low: parseFloat(cols[3]) };
    } catch { return null; }
  }));
  if (!results[0] || results[0].last === 0) throw new Error('Stooq failed');
  console.log('[Stooq] EOD:', results[0].index, results[0].last);
  return results.map((r, i) => r || { index: stooqMap[i].index, last: 0, pChange: 0, change: 0 });
};

// ── INDICES ROUTE ──────────────────────────────────────────────────
router.get('/indices', async function(req, res) {
  const ist    = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const day    = ist.getDay();
  const mins   = ist.getHours() * 60 + ist.getMinutes();
  const isOpen = day >= 1 && day <= 5 && mins >= 555 && mins <= 930;
  const ttl    = isOpen ? 5 : 300; // 5s live (refreshes every 5s during market hours), 5min closed

  try {
    const data = await getCached('indices', async function() {
      // NSE allIndices works during market hours AND pre-open session
      // Try NSE first always — it has the most accurate live/closing data
      // Yahoo Finance and Stooq are fallbacks
      try { return await fetchFromNSE(); }    catch (e) { console.log('[Indices] NSE failed:', e.message); }
      try { return await fetchFromYahoo(); }  catch (e) { console.log('[Indices] Yahoo failed:', e.message); }
      try { return await fetchFromStooq(); }  catch (e) { console.log('[Indices] Stooq failed:', e.message); }
      throw new Error('All sources failed');
    }, ttl);

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json(data);
  } catch (err) {
    console.log('[Indices] Complete failure, using hardcoded:', err.message);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json([
      { index: 'NIFTY 50',   last: 22713.0,  pChange: -0.34, change: -77.1  },
      { index: 'SENSEX',     last: 74742.5,  pChange: -0.28, change: -209.9 },
      { index: 'NIFTY BANK', last: 48540.25, pChange: -0.12, change: -58.2  },
      { index: 'NIFTY IT',   last: 33200.4,  pChange: -0.55, change: -183.1 },
    ]);
  }
});

// ── STOCK QUOTES (GET) — for Portfolio page ────────────────────────
// Strategy: fetch the full NIFTY 500 data from NSE in one call,
// then return just the symbols requested. This is faster and more
// reliable than calling Yahoo Finance for each symbol individually.
router.get('/stock-quotes', async function(req, res) {
  try {
    const symbols = req.query.symbols; // e.g. "RELIANCE.NS,TCS.NS"
    if (!symbols) return res.status(400).json({ error: 'symbols param required' });

    // Parse symbol list — remove .NS suffix
    const symList = symbols.split(',').map(s => s.replace('.NS', '').replace('.BO', '').trim().toUpperCase());

    // Fetch live data from NSE's equity indices (covers all major NSE stocks)
    // We use NIFTY 500 index which covers ~500 stocks
    const data = await getCached('nse_equity_' + symList.sort().join('_'), async function() {
      const map = {};

      // Try to get all requested symbols via NSE individual quote API
      // We run them in parallel for speed
      await Promise.all(symList.map(async function(sym) {
        try {
          const result = await nseGet(
            'https://www.nseindia.com/api/quote-equity?symbol=' + encodeURIComponent(sym)
          );
          const p = result.data.priceInfo;
          if (!p || !p.lastPrice || p.lastPrice === 0) throw new Error('No price for ' + sym);
          map[sym] = {
            price:  parseFloat(p.lastPrice.toFixed(2)),
            change: parseFloat((p.pChange || 0).toFixed(2)),
            open:   p.open   || 0,
            high:   p.intraDayHighLow ? p.intraDayHighLow.max : 0,
            low:    p.intraDayHighLow ? p.intraDayHighLow.min : 0,
            prev:   p.previousClose  || 0,
          };
          console.log('[StockQuotes] NSE:', sym, '=', p.lastPrice);
        } catch (e) {
          console.log('[StockQuotes] NSE failed for', sym, ':', e.message);
          // Fallback: try Yahoo Finance for this specific symbol
          try {
            const yr = await axios.get(
              'https://query1.finance.yahoo.com/v8/finance/quote?symbols=' + encodeURIComponent(sym + '.NS'),
              { timeout: 8000, headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json', 'Referer': 'https://finance.yahoo.com/' } }
            );
            const yq = (yr.data.quoteResponse && yr.data.quoteResponse.result) || [];
            const ystock = yq[0];
            if (ystock && ystock.regularMarketPrice) {
              map[sym] = {
                price:  parseFloat(ystock.regularMarketPrice.toFixed(2)),
                change: parseFloat((ystock.regularMarketChangePercent || 0).toFixed(2)),
                open:   ystock.regularMarketOpen || 0,
                high:   ystock.regularMarketDayHigh || 0,
                low:    ystock.regularMarketDayLow  || 0,
                prev:   ystock.regularMarketPreviousClose || 0,
              };
              console.log('[StockQuotes] Yahoo fallback:', sym, '=', ystock.regularMarketPrice);
            }
          } catch (ye) {
            console.log('[StockQuotes] Yahoo also failed for', sym, ':', ye.message);
          }
        }
      }));

      return map;
    }, 20); // 20 second cache — fresh enough for portfolio display

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json(data);
  } catch (err) {
    console.log('[StockQuotes] Fatal error:', err.message);
    res.status(500).json({ error: 'Failed to fetch stock quotes' });
  }
});

// ── CRYPTO PRICES PROXY (GET) — for Portfolio page ─────────────────
router.get('/crypto-prices', async function(req, res) {
  try {
    const ids = req.query.ids;
    if (!ids) return res.status(400).json({ error: 'ids param required' });

    const data = await getCached('cp_' + ids, async function() {
      const result = await axios.get(
        'https://api.coingecko.com/api/v3/coins/markets?vs_currency=inr&ids=' + ids +
        '&order=market_cap_desc&per_page=50&page=1&price_change_percentage=24h',
        { timeout: 15000, headers: { Accept: 'application/json' } }
      );
      const map = {};
      result.data.forEach(c => {
        const obj = {
          id:        c.id,
          symbol:    c.symbol.toUpperCase(),
          name:      c.name,
          price:     c.current_price,
          change24h: c.price_change_percentage_24h ? c.price_change_percentage_24h.toFixed(2) : '0',
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
      const list = result.data.NIFTY && result.data.NIFTY.data ? result.data.NIFTY.data.slice(0, 10) : null;
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
      const list = result.data.NIFTY && result.data.NIFTY.data ? result.data.NIFTY.data.slice(0, 10) : null;
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

// ── MULTIPLE QUOTES POST (Watchlist) ───────────────────────────────
const quoteCache = {};
router.post('/quotes', async function(req, res) {
  try {
    const symbols = req.body.symbols || [];
    if (symbols.length === 0) return res.json([]);
    const now = Date.now();
    const CACHE_MS = 5 * 60 * 1000;
    const results = [];
    for (let i = 0; i < symbols.length; i++) {
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
      if (i < symbols.length - 1) await new Promise(r => setTimeout(r, 300));
    }
    res.json(results);
  } catch (err) {
    res.json((req.body.symbols||[]).map(s => ({ symbol: s, error: true, price: '0', change: '0', changePct: '0%' })));
  }
});

// ── INTRADAY CHART ─────────────────────────────────────────────────
router.get('/chart/:symbol', async function(req, res) {
  try {
    const result = await nseGet('https://www.nseindia.com/api/chart-databyindex?index=' + req.params.symbol + 'EQN');
    const points = result.data.grapthData || result.data.graphData || [];
    res.json(points.map(p => ({ time: p[0], price: p[1] })));
  } catch (err) {
    let v = 22713;
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
      const ALL_IDS = 'bitcoin,ethereum,binancecoin,solana,ripple,cardano,dogecoin,polkadot,shiba-inu,avalanche-2,matic-network,chainlink,litecoin,uniswap,stellar,tron,cosmos,near,pepe,filecoin';
      const result = await axios.get(
        'https://api.coingecko.com/api/v3/coins/markets?vs_currency=inr&ids=' + ALL_IDS +
        '&order=market_cap_desc&per_page=50&page=1&price_change_percentage=1h,24h,7d',
        { timeout: 12000, headers: { Accept: 'application/json' } }
      );
      return result.data.map(c => ({
        id: c.id, symbol: c.symbol.toUpperCase(), name: c.name, image: c.image,
        price: c.current_price,
        change24h: c.price_change_percentage_24h ? c.price_change_percentage_24h.toFixed(2) : '0',
        change7d:  c.price_change_percentage_7d_in_currency ? c.price_change_percentage_7d_in_currency.toFixed(2) : '0',
        change1h:  c.price_change_percentage_1h_in_currency ? c.price_change_percentage_1h_in_currency.toFixed(2) : '0',
        marketCap: c.market_cap, volume: c.total_volume, high24h: c.high_24h, low24h: c.low_24h,
      }));
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
      return await Promise.all(funds.map(async f => {
        const result = await axios.get('https://api.mfapi.in/mf/' + f.code, { timeout: 8000 });
        const latest = result.data.data && result.data.data[0];
        const prev   = result.data.data && result.data.data[1];
        const change = latest && prev
          ? ((parseFloat(latest.nav) - parseFloat(prev.nav)) / parseFloat(prev.nav) * 100).toFixed(2)
          : '0.00';
        return {
          code: f.code,
          name: result.data.meta ? result.data.meta.scheme_name : f.name,
          category: result.data.meta ? result.data.meta.scheme_category : 'Equity',
          nav: latest ? parseFloat(latest.nav).toFixed(2) : '0',
          date: latest ? latest.date : '',
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
    gold:       { price: 93200 + Math.floor(Math.random() * 200 - 100), changePct: '+0.18%', isUp: true,  unit: '10g',   label: 'Gold'        },
    silver:     { price: 96800 + Math.floor(Math.random() * 400 - 200), changePct: '+0.32%', isUp: true,  unit: 'kg',    label: 'Silver'      },
    crude:      { price: 6640  + Math.floor(Math.random() * 60  - 30),  changePct: '-0.44%', isUp: false, unit: 'bbl',   label: 'Crude Oil'   },
    naturalgas: { price: 295   + Math.floor(Math.random() * 10  - 5),   changePct: '+1.12%', isUp: true,  unit: 'mmBtu', label: 'Natural Gas' },
    copper:     { price: 845   + Math.floor(Math.random() * 20  - 10),  changePct: '+0.55%', isUp: true,  unit: 'kg',    label: 'Copper'      },
    aluminium:  { price: 228   + Math.floor(Math.random() * 8   - 4),   changePct: '-0.22%', isUp: false, unit: 'kg',    label: 'Aluminium'   },
    zinc:       { price: 272   + Math.floor(Math.random() * 10  - 5),   changePct: '+0.38%', isUp: true,  unit: 'kg',    label: 'Zinc'        },
    nickel:     { price: 1368  + Math.floor(Math.random() * 30  - 15),  changePct: '-0.15%', isUp: false, unit: 'kg',    label: 'Nickel'      },
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
    isOpen, isPreOpen: isPre,
    status:  isOpen ? 'Market Open' : isPre ? 'Pre-Open Session' : 'Market Closed',
    message: isOpen ? 'NSE and BSE trading live' : 'Opens Mon-Fri 9:15 AM IST',
    time:    ist.toLocaleTimeString('en-IN'),
  });
});

// ── FII/DII ────────────────────────────────────────────────────────
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
        'https://newsapi.org/v2/everything?q=india+stock+market+nifty+sensex+economy+RBI+crypto' +
        '&sortBy=publishedAt&pageSize=15&language=en&apiKey=' + KEY,
        { timeout: 10000 }
      );
      return (result.data.articles || [])
        .filter(a => a.title && a.title !== '[Removed]' && a.url)
        .map(a => ({ title: a.title, source: a.source.name, url: a.url, image: a.urlToImage, time: a.publishedAt, description: a.description }));
    }, 600);
    res.json(data);
  } catch (err) {
    res.json(getFallbackNews());
  }
});

// ── FALLBACKS ──────────────────────────────────────────────────────
function getFallbackGainers() {
  return [
    { symbol: 'HCLTECH',    ltp: 1395,   netPrice: 3.00,  tradedQuantity: 6509389  },
    { symbol: 'TECHM',      ltp: 1439,   netPrice: 2.46,  tradedQuantity: 2501510  },
    { symbol: 'TATACONSUM', ltp: 1044.9, netPrice: 2.06,  tradedQuantity: 2586178  },
    { symbol: 'BHARTIARTL', ltp: 1815,   netPrice: 1.81,  tradedQuantity: 3283765  },
    { symbol: 'RELIANCE',   ltp: 1285,   netPrice: 1.12,  tradedQuantity: 3456789  },
    { symbol: 'HDFCBANK',   ltp: 1762,   netPrice: 0.67,  tradedQuantity: 4567890  },
    { symbol: 'LT',         ltp: 3290,   netPrice: 0.54,  tradedQuantity: 1234567  },
    { symbol: 'AXISBANK',   ltp: 1098,   netPrice: 0.33,  tradedQuantity: 3456789  },
  ];
}

function getFallbackLosers() {
  return [
    { symbol: 'ASIANPAINT', ltp: 2170.4, netPrice: -2.49, tradedQuantity: 1854061  },
    { symbol: 'EICHERMOT',  ltp: 6660,   netPrice: -2.42, tradedQuantity: 660432   },
    { symbol: 'SUNPHARMA',  ltp: 1692,   netPrice: -2.11, tradedQuantity: 3937824  },
    { symbol: 'WIPRO',      ltp: 224,    netPrice: -2.15, tradedQuantity: 13827722 },
    { symbol: 'BAJFINANCE', ltp: 866,    netPrice: -1.30, tradedQuantity: 5215656  },
    { symbol: 'INFY',       ltp: 1497,   netPrice: -1.30, tradedQuantity: 5882698  },
    { symbol: 'TCS',        ltp: 3194,   netPrice: -0.34, tradedQuantity: 2345678  },
    { symbol: 'ITC',        ltp: 416,    netPrice: -0.14, tradedQuantity: 6789012  },
  ];
}

function getFallbackCrypto() {
  return [
    { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', image: '', price: 7200000, change24h: '1.20', change7d: '3.10', change1h: '0.15', marketCap: 142000000000000, volume: 2800000000000, high24h: 7350000, low24h: 7050000 },
    { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', image: '', price: 190000, change24h: '0.87', change7d: '2.20', change1h: '0.12', marketCap: 22000000000000, volume: 1100000000000, high24h: 196000, low24h: 185000 },
  ];
}

function getFallbackNews() {
  return [
    { title: 'Nifty 50 trades near 22,970; market recovers from lows', source: 'Economic Times', url: '#', image: null, time: new Date(Date.now() - 30 * 60000).toISOString(), description: 'Indian markets recover amid global uncertainty.' },
    { title: 'RBI holds repo rate at 6.5% amid global uncertainty',    source: 'Moneycontrol',   url: '#', image: null, time: new Date(Date.now() - 60 * 60000).toISOString(), description: 'The Reserve Bank of India kept rates unchanged.' },
  ];
}

module.exports = router;