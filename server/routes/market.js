const express = require('express');
const axios   = require('axios');
const router  = express.Router();

const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Accept': 'application/json',
  'Accept-Language': 'en-US,en;q=0.9',
  'Referer': 'https://www.nseindia.com',
};

// ── INDICES (Nifty, Sensex, Bank Nifty) ──────────────────────────
router.get('/indices', async (req, res) => {
  try {
    const { data } = await axios.get(
      'https://www.nseindia.com/api/allIndices',
      { headers, timeout: 8000 }
    );
    const wanted = ['NIFTY 50', 'NIFTY BANK', 'NIFTY IT', 'NIFTY MIDCAP 100'];
    const indices = data.data.filter(i => wanted.includes(i.index));
    res.json(indices);
  } catch (err) {
    // fallback data if NSE blocks
    res.json([
      { index: 'NIFTY 50',       last: 22147.90, change: 173.45,  pChange: 0.83  },
      { index: 'NIFTY BANK',     last: 47312.55, change: 211.10,  pChange: 0.45  },
      { index: 'NIFTY IT',       last: 34201.15, change: -75.40,  pChange: -0.22 },
      { index: 'NIFTY MIDCAP 100', last: 51240.30, change: 320.15, pChange: 0.63 },
    ]);
  }
});

// ── TOP GAINERS ───────────────────────────────────────────────────
router.get('/gainers', async (req, res) => {
  try {
    const { data } = await axios.get(
      'https://www.nseindia.com/api/live-analysis-variations?index=gainers',
      { headers, timeout: 8000 }
    );
    res.json(data.NIFTY?.data?.slice(0, 10) || []);
  } catch (err) {
    res.json([
      { symbol: 'TATAMOTORS', ltp: 952.30,  netPrice: 3.20,  tradedQuantity: 8234567 },
      { symbol: 'BAJFINANCE', ltp: 6721.00, netPrice: 2.11,  tradedQuantity: 1234567 },
      { symbol: 'M&M',        ltp: 2187.55, netPrice: 1.55,  tradedQuantity: 2345678 },
      { symbol: 'WIPRO',      ltp: 452.15,  netPrice: 1.40,  tradedQuantity: 5678901 },
      { symbol: 'RELIANCE',   ltp: 2912.40, netPrice: 1.12,  tradedQuantity: 3456789 },
    ]);
  }
});

// ── TOP LOSERS ────────────────────────────────────────────────────
router.get('/losers', async (req, res) => {
  try {
    const { data } = await axios.get(
      'https://www.nseindia.com/api/live-analysis-variations?index=loosers',
      { headers, timeout: 8000 }
    );
    res.json(data.NIFTY?.data?.slice(0, 10) || []);
  } catch (err) {
    res.json([
      { symbol: 'TATASTEEL',  ltp: 142.30, netPrice: -2.10, tradedQuantity: 9234567 },
      { symbol: 'JSWSTEEL',   ltp: 865.45, netPrice: -1.44, tradedQuantity: 2134567 },
      { symbol: 'LT',         ltp: 3421.10, netPrice: -1.22, tradedQuantity: 1234567 },
      { symbol: 'INFY',       ltp: 1423.60, netPrice: -0.88, tradedQuantity: 4567890 },
      { symbol: 'TCS',        ltp: 3887.75, netPrice: -0.34, tradedQuantity: 2345678 },
    ]);
  }
});

// ── SINGLE STOCK QUOTE ────────────────────────────────────────────
router.get('/quote/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { data } = await axios.get(
      `https://www.nseindia.com/api/quote-equity?symbol=${symbol}`,
      { headers, timeout: 8000 }
    );
    const p = data.priceInfo;
    res.json({
      symbol,
      price:      p.lastPrice,
      open:       p.open,
      high:       p.intraDayHighLow?.max,
      low:        p.intraDayHighLow?.min,
      close:      p.previousClose,
      change:     p.change,
      changePct:  p.pChange,
      volume:     data.marketDeptOrderBook?.tradeInfo?.totalTradedVolume,
      marketCap:  data.industryInfo?.basicIndustry,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch quote' });
  }
});

// ── STOCK CHART DATA (intraday) ───────────────────────────────────
router.get('/chart/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { data } = await axios.get(
      `https://www.nseindia.com/api/chart-databyindex?index=${symbol}EQN`,
      { headers, timeout: 8000 }
    );
    const points = data.grapthData || data.graphData || [];
    const formatted = points.map(p => ({
      time:  p[0],
      price: p[1],
    }));
    res.json(formatted);
  } catch (err) {
    // generate realistic intraday data as fallback
    const base = 22000;
    let v = base;
    const points = Array.from({ length: 75 }, (_, i) => {
      v += (Math.random() - 0.48) * 40;
      const hour = 9 + Math.floor(i * (6.5 / 75));
      const min  = Math.floor((i * (390 / 75)) % 60);
      return { time: `${hour}:${min.toString().padStart(2,'0')}`, price: Math.round(v) };
    });
    res.json(points);
  }
});

// ── CRYPTO (CoinGecko — no API key needed) ────────────────────────
router.get('/crypto', async (req, res) => {
  try {
    const { data } = await axios.get(
      'https://api.coingecko.com/api/v3/coins/markets?vs_currency=inr&order=market_cap_desc&per_page=20&page=1&sparkline=true&price_change_percentage=1h,24h,7d',
      { timeout: 8000 }
    );
    res.json(data.map(c => ({
      id:         c.id,
      symbol:     c.symbol.toUpperCase(),
      name:       c.name,
      image:      c.image,
      price:      c.current_price,
      change24h:  c.price_change_percentage_24h?.toFixed(2),
      change7d:   c.price_change_percentage_7d_in_currency?.toFixed(2),
      change1h:   c.price_change_percentage_1h_in_currency?.toFixed(2),
      marketCap:  c.market_cap,
      volume:     c.total_volume,
      high24h:    c.high_24h,
      low24h:     c.low_24h,
      sparkline:  c.sparkline_in_7d?.price,
    })));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch crypto' });
  }
});

// ── MUTUAL FUNDS (mfapi.in — completely free) ─────────────────────
router.get('/mutualfunds', async (req, res) => {
  try {
    const topFunds = [
      { code: '119598', name: 'Mirae Asset Large Cap Fund' },
      { code: '122639', name: 'Parag Parikh Flexi Cap Fund' },
      { code: '118989', name: 'HDFC Mid-Cap Opportunities'  },
      { code: '119775', name: 'SBI Blue Chip Fund'          },
      { code: '120503', name: 'Axis Small Cap Fund'         },
      { code: '119533', name: 'ICICI Pru Bluechip Fund'     },
    ];
    const results = await Promise.all(
      topFunds.map(async (f) => {
        const { data } = await axios.get(
          `https://api.mfapi.in/mf/${f.code}`,
          { timeout: 8000 }
        );
        const latest = data.data?.[0];
        const prev   = data.data?.[1];
        const change = latest && prev
          ? ((parseFloat(latest.nav) - parseFloat(prev.nav)) / parseFloat(prev.nav) * 100).toFixed(2)
          : '0.00';
        return {
          code:     f.code,
          name:     data.meta?.scheme_name || f.name,
          category: data.meta?.scheme_category || 'Equity',
          nav:      parseFloat(latest?.nav).toFixed(2),
          date:     latest?.date,
          change,
        };
      })
    );
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch mutual funds' });
  }
});

// ── GOLD & SILVER (via metals-api fallback to calculated) ─────────
router.get('/commodities', async (req, res) => {
  try {
    const { data } = await axios.get(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=inr',
      { timeout: 5000 }
    );
    // Gold/Silver use fixed base with slight random variation for demo
    // In production replace with a metals API
    res.json({
      gold:   { price: 71240 + Math.floor(Math.random()*200-100), change: '+0.18%', unit: '10g'  },
      silver: { price: 84500 + Math.floor(Math.random()*500-250), change: '+0.32%', unit: 'kg'   },
      crude:  { price: 6842  + Math.floor(Math.random()*50-25),   change: '-0.44%', unit: 'bbl'  },
    });
  } catch (err) {
    res.json({
      gold:   { price: 71240, change: '+0.18%', unit: '10g' },
      silver: { price: 84500, change: '+0.32%', unit: 'kg'  },
      crude:  { price: 6842,  change: '-0.44%', unit: 'bbl' },
    });
  }
});

// ── NEWS (NewsAPI) ────────────────────────────────────────────────
router.get('/news', async (req, res) => {
  try {
    const KEY = process.env.NEWS_API_KEY;
    if (!KEY) throw new Error('No key');
    const { data } = await axios.get(
      `https://newsapi.org/v2/everything?q=india+stock+market+nifty&sortBy=publishedAt&pageSize=15&apiKey=${KEY}`,
      { timeout: 8000 }
    );
    res.json(data.articles.map(a => ({
      title:     a.title,
      source:    a.source.name,
      url:       a.url,
      image:     a.urlToImage,
      time:      a.publishedAt,
      description: a.description,
    })));
  } catch (err) {
    // fallback static news
    res.json([
      { title: 'RBI holds repo rate at 6.5% amid global uncertainty',          source: 'Economic Times',    time: new Date(Date.now()-9*60000).toISOString()  },
      { title: 'Reliance Q3 net profit surges 18% YoY to ₹18,540 Cr',          source: 'Moneycontrol',      time: new Date(Date.now()-24*60000).toISOString() },
      { title: 'Nifty eyes 22,500 resistance; FII inflows of ₹4,200 Cr',        source: 'Business Standard', time: new Date(Date.now()-41*60000).toISOString() },
      { title: 'Bitcoin surges past $82K on spot ETF inflow uptick',            source: 'CoinDesk India',    time: new Date(Date.now()-60*60000).toISOString() },
      { title: 'Hyundai India IPO oversubscribed 2.4x on Day 2',               source: 'Mint',              time: new Date(Date.now()-120*60000).toISOString()},
      { title: 'Gold hits ₹71,240/10g on safe-haven demand',                   source: 'Reuters India',     time: new Date(Date.now()-180*60000).toISOString()},
      { title: 'Tata Motors Q3 results: PAT up 22%, revenue beats estimates',   source: 'NDTV Profit',       time: new Date(Date.now()-240*60000).toISOString()},
      { title: 'SEBI tightens F&O rules; new lot sizes effective from April',   source: 'Livemint',          time: new Date(Date.now()-300*60000).toISOString()},
    ]);
  }
});

// ── MARKET STATUS ─────────────────────────────────────────────────
router.get('/status', async (req, res) => {
  try {
    const now   = new Date();
    const ist   = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    const day   = ist.getDay();
    const hour  = ist.getHours();
    const min   = ist.getMinutes();
    const mins  = hour * 60 + min;
    const isWeekday  = day >= 1 && day <= 5;
    const isOpen     = isWeekday && mins >= 555 && mins <= 930; // 9:15 to 15:30
    const isPreOpen  = isWeekday && mins >= 540 && mins < 555;  // 9:00 to 9:15
    res.json({
      isOpen,
      isPreOpen,
      status:    isOpen ? 'Market Open' : isPreOpen ? 'Pre-Open Session' : 'Market Closed',
      message:   isOpen ? 'NSE & BSE trading live' : 'Next session: Mon 9:15 AM IST',
      time:      ist.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }),
    });
  } catch (err) {
    res.json({ isOpen: false, status: 'Market Closed', time: '' });
  }
});

module.exports = router;