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

const quoteCache = {};
const CACHE_TTL = 15000; // 15 seconds

async function fetchYahooQuote(symbol) {
  try {
    const now = Date.now();
    if (quoteCache[symbol] && (now - quoteCache[symbol].timestamp < CACHE_TTL)) {
      return quoteCache[symbol].data;
    }

    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
    let res = await fetch(url, { headers: YAHOO_HEADERS });
    if (!res.ok) {
      // Try query2 as fallback
      res = await fetch(
        `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`,
        { headers: YAHOO_HEADERS }
      );
    }
    if (!res.ok) {
      return quoteCache[symbol] ? quoteCache[symbol].data : null;
    }
    const data = await res.json();
    const parsed = parseYahooData(data);
    if (parsed) {
      quoteCache[symbol] = {
        timestamp: now,
        data: parsed
      };
    }
    return parsed;
  } catch (err) {
    return quoteCache[symbol] ? quoteCache[symbol].data : null;
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

// Fetch multiple symbols in parallel (batches of 15)
async function fetchBatch(symbols) {
  const results = {};
  const batchSize = 15;
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

// Full stock universe: symbol → sector
const STOCK_UNIVERSE = {
  // Large Cap — IT
  'TCS': 'IT', 'INFY': 'IT', 'HCLTECH': 'IT', 'WIPRO': 'IT', 'TECHM': 'IT',
  'LTIM': 'IT', 'MPHASIS': 'IT', 'PERSISTENT': 'IT', 'COFORGE': 'IT',
  'TATAELXSI': 'IT', 'OFSS': 'IT', 'HEXAWARE': 'IT', 'KPITTECH': 'IT',
  'MASTEK': 'IT', 'RATEGAIN': 'IT', 'ZENSARTECH': 'IT', 'NIIT': 'IT',
  'NEWGEN': 'IT', 'DATAMATICS': 'IT', 'INTELLECT': 'IT',

  // Banking & Finance
  'HDFCBANK': 'Banking', 'ICICIBANK': 'Banking', 'SBIN': 'Banking', 'KOTAKBANK': 'Banking',
  'AXISBANK': 'Banking', 'INDUSINDBK': 'Banking', 'BANKBARODA': 'Banking', 'PNB': 'Banking',
  'CANARABANK': 'Banking', 'UNIONBANK': 'Banking', 'IDFCFIRSTB': 'Banking', 'FEDERALBNK': 'Banking',
  'YESBANK': 'Banking', 'BANDHANBNK': 'Banking', 'RBLBANK': 'Banking', 'KARURVYSYA': 'Banking',
  'CSBBANK': 'Banking', 'DCBBANK': 'Banking', 'SOUTHBANK': 'Banking', 'LAKSHVILAS': 'Banking',

  // NBFC & Financial Services
  'BAJFINANCE': 'NBFC', 'BAJAJFINSV': 'NBFC', 'SHRIRAMFIN': 'NBFC', 'CHOLAFIN': 'NBFC',
  'MUTHOOTFIN': 'NBFC', 'JIOFIN': 'NBFC', 'MANAPPURAM': 'NBFC', 'IIFL': 'NBFC',
  'M&MFIN': 'NBFC', 'LTFINANCE': 'NBFC', 'POONAWALLA': 'NBFC', 'HOMEFIRST': 'NBFC',
  'AAVAS': 'NBFC', 'APTUS': 'NBFC', 'CREDITACC': 'NBFC',

  // Insurance
  'HDFCLIFE': 'Insurance', 'SBILIFE': 'Insurance', 'ICICIPRULI': 'Insurance',
  'MAXHEALTH': 'Insurance', 'NIACL': 'Insurance', 'GICRE': 'Insurance',
  'STARHEALTH': 'Insurance', 'LIC': 'Insurance',

  // Oil & Gas
  'RELIANCE': 'Oil & Gas', 'ONGC': 'Oil & Gas', 'IOC': 'Oil & Gas', 'BPCL': 'Oil & Gas',
  'GAIL': 'Oil & Gas', 'OIL': 'Oil & Gas', 'PETRONET': 'Oil & Gas', 'MGL': 'Oil & Gas',
  'IGL': 'Oil & Gas', 'GUJGASLTD': 'Oil & Gas', 'MRPL': 'Oil & Gas', 'HINDPETRO': 'Oil & Gas',

  // Auto & Auto Ancillaries
  'MARUTI': 'Auto', 'TATAMOTORS': 'Auto', 'EICHERMOT': 'Auto', 'HEROMOTOCO': 'Auto',
  'BAJAJ-AUTO': 'Auto', 'TVSMOTORS': 'Auto', 'ASHOKLEY': 'Auto', 'MAHINDRA': 'Auto',
  'M&M': 'Auto', 'TVSMOTOR': 'Auto', 'ESCORTS': 'Auto', 'FORCEMOT': 'Auto',
  'MOTHERSON': 'Auto Anc', 'BOSCHLTD': 'Auto Anc', 'MRF': 'Auto Anc',
  'APOLLOTYRE': 'Auto Anc', 'BALKRISIND': 'Auto Anc', 'CEATLTD': 'Auto Anc',
  'EXIDEIND': 'Auto Anc', 'AMARAJABAT': 'Auto Anc', 'SUNDRMFAST': 'Auto Anc',

  // Pharma & Healthcare
  'SUNPHARMA': 'Pharma', 'DRREDDY': 'Pharma', 'CIPLA': 'Pharma', 'DIVISLAB': 'Pharma',
  'APOLLOHOSP': 'Healthcare', 'MAXHEALTH': 'Healthcare', 'LUPIN': 'Pharma', 'BIOCON': 'Pharma',
  'AUROPHARMA': 'Pharma', 'TORNTPHARM': 'Pharma', 'ALKEM': 'Pharma', 'ABBOTINDIA': 'Pharma',
  'IPCALAB': 'Pharma', 'GLENMARK': 'Pharma', 'GRANULES': 'Pharma', 'NATCOPHARM': 'Pharma',
  'PFIZER': 'Pharma', 'GLAXO': 'Pharma', 'LAURUSLABS': 'Pharma', 'SUVEN': 'Pharma',
  'METROPOLIS': 'Healthcare', 'DRLAL': 'Healthcare', 'THYROCARE': 'Healthcare',

  // FMCG & Consumer
  'HINDUNILVR': 'FMCG', 'ITC': 'FMCG', 'NESTLEIND': 'FMCG', 'BRITANNIA': 'FMCG',
  'TATACONSUM': 'FMCG', 'DABUR': 'FMCG', 'MARICO': 'FMCG', 'GODREJCP': 'FMCG',
  'EMAMILTD': 'FMCG', 'VGUARD': 'FMCG', 'BAJAJCON': 'FMCG', 'COLPAL': 'FMCG',
  'GILLETTE': 'FMCG', 'HATSUN': 'FMCG', 'BIKAJI': 'FMCG', 'DOMS': 'FMCG',

  // Metals & Mining
  'TATASTEEL': 'Metals', 'JSWSTEEL': 'Metals', 'HINDALCO': 'Metals', 'VEDL': 'Metals',
  'COALINDIA': 'Mining', 'NMDC': 'Mining', 'MOIL': 'Mining', 'HINDCOPPER': 'Metals',
  'SAIL': 'Metals', 'JINDALSTEE': 'Metals', 'WELCORP': 'Metals', 'RATNAMANI': 'Metals',
  'APL': 'Metals', 'ASTRAL': 'Metals',

  // Cement
  'ULTRACEMCO': 'Cement', 'GRASIM': 'Cement', 'SHREECEM': 'Cement', 'AMBUJACEM': 'Cement',
  'ACC': 'Cement', 'DALMIACEM': 'Cement', 'JKCEMENT': 'Cement', 'RAMCOCEM': 'Cement',
  'HEIDELBERG': 'Cement', 'BIRLACORPN': 'Cement',

  // Power & Energy
  'NTPC': 'Power', 'POWERGRID': 'Power', 'TATAPOWER': 'Power', 'NHPC': 'Power',
  'SJVN': 'Power', 'TORNTPOWER': 'Power', 'CESC': 'Power', 'ADANIGREEN': 'Power',
  'SUZLON': 'Power', 'INOXGREEN': 'Power', 'GREENPANEL': 'Power', 'KPI': 'Power',
  'IREDA': 'Power', 'PFC': 'Finance', 'RECL': 'Finance',

  // Infrastructure & Construction
  'LT': 'Infra', 'ADANIENT': 'Infra', 'ADANIPORTS': 'Infra', 'DLF': 'Real Estate',
  'LODHA': 'Real Estate', 'GODREJPROP': 'Real Estate', 'OBEROIRLTY': 'Real Estate',
  'PRESTIGE': 'Real Estate', 'BRIGADE': 'Real Estate', 'NCC': 'Infra',
  'KNR': 'Infra', 'PNC': 'Infra', 'IRCON': 'Infra', 'RVNL': 'Infra',
  'IRFC': 'Finance', 'HUDCO': 'Finance', 'HAL': 'Defence', 'BEL': 'Defence',
  'BHEL': 'Capital Goods', 'COCHINSHIP': 'Defence', 'MAZDOCK': 'Defence',
  'GRSE': 'Defence', 'BEML': 'Defence',

  // Telecom
  'BHARTIARTL': 'Telecom', 'VODAFONE': 'Telecom', 'INDIAMART': 'Telecom',

  // Consumer Durables
  'TITAN': 'Consumer', 'TRENT': 'Retail', 'DMART': 'Retail', 'NYKAA': 'Retail',
  'ASIANPAINT': 'Consumer', 'PIDILITIND': 'Consumer', 'BERGER': 'Consumer',
  'KANSAINER': 'Consumer', 'WHIRLPOOL': 'Consumer', 'VOLTAS': 'Consumer',
  'BLUEDART': 'Logistics', 'APLAPOLLO': 'Consumer',

  // New-Age Tech / Internet
  'ZOMATO': 'Tech', 'PAYTM': 'Tech', 'IRCTC': 'Travel', 'INDIGO': 'Aviation',
  'NAUKRI': 'Tech', 'JUSTDIAL': 'Tech', 'INFOEDGE': 'Tech',

  // Specialty Chemicals
  'UPL': 'Chemicals', 'SRF': 'Chemicals', 'PIIND': 'Chemicals', 'AARTI': 'Chemicals',
  'DEEPAKNTR': 'Chemicals', 'NAVINFLUOR': 'Chemicals', 'FINEORG': 'Chemicals',
  'TATACHEM': 'Chemicals', 'GNFC': 'Chemicals', 'NOCIL': 'Chemicals',

  // Capital Goods
  'ABB': 'Cap Goods', 'SIEMENS': 'Cap Goods', 'HAVELLS': 'Cap Goods',
  'POLYCAB': 'Cap Goods', 'CUMMINSIND': 'Cap Goods', 'THERMAX': 'Cap Goods',
  'BHARAT': 'Cap Goods', 'ELGIEQUIP': 'Cap Goods', 'GRINDWELL': 'Cap Goods',

  // Miscellaneous
  'CHOLAFIN': 'NBFC', 'M&MFIN': 'NBFC', 'SUNDARMFIN': 'NBFC',
};

const ALL_STOCKS = Object.keys(STOCK_UNIVERSE);

function getDateOffset(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
}

let activeIpos = [
  {
    id: 1,
    company: 'Awfis Space Solutions',
    type: 'MAINBOARD',
    gmp: 115,
    gmpPercent: '30.0%',
    open: getDateOffset(-4),
    close: getDateOffset(-1),
    price: '364-383',
    lotSize: 39,
    issueSize: '598.93',
    lm: ['ICICI Securities', 'Axis Capital'],
    allotment: getDateOffset(0),
    listing: getDateOffset(2),
    status: 'closed'
  },
  {
    id: 2,
    company: 'Vilas Transcore',
    type: 'NSE SME',
    gmp: 130,
    gmpPercent: '88.4%',
    open: getDateOffset(-1),
    close: getDateOffset(2),
    price: '139-147',
    lotSize: 1000,
    issueSize: '95.26',
    lm: ['Hem Securities'],
    allotment: getDateOffset(3),
    listing: getDateOffset(6),
    status: 'open'
  },
  {
    id: 3,
    company: 'Swiggy Limited',
    type: 'MAINBOARD',
    gmp: 185,
    gmpPercent: '42.5%',
    open: getDateOffset(3),
    close: getDateOffset(6),
    price: '400-425',
    lotSize: 35,
    issueSize: '10414.00',
    lm: ['Kotak Mahindra', 'Citi'],
    allotment: getDateOffset(7),
    listing: getDateOffset(10),
    status: 'upcoming'
  },
  {
    id: 4,
    company: 'Hyundai Motor India',
    type: 'MAINBOARD',
    gmp: 250,
    gmpPercent: '15.2%',
    open: getDateOffset(6),
    close: getDateOffset(9),
    price: '1550-1640',
    lotSize: 10,
    issueSize: '25000.00',
    lm: ['Morgan Stanley', 'JP Morgan'],
    allotment: getDateOffset(10),
    listing: getDateOffset(13),
    status: 'upcoming'
  },
  {
    id: 5,
    company: 'Beacon Trusteeship',
    type: 'NSE SME',
    gmp: 40,
    gmpPercent: '66.6%',
    open: getDateOffset(-8),
    close: getDateOffset(-5),
    price: '60',
    lotSize: 2000,
    issueSize: '32.52',
    lm: ['Beeline Capital'],
    allotment: getDateOffset(-4),
    listing: getDateOffset(-2),
    status: 'closed'
  }
];

const IPO_POOL = [
  {
    company: 'Ola Electric Mobility',
    type: 'MAINBOARD',
    price: '72-76',
    lotSize: 195,
    issueSize: '6145.56',
    lm: ['Kotak Mahindra', 'BofA Securities'],
  },
  {
    company: 'FirstCry (Brainbees)',
    type: 'MAINBOARD',
    price: '440-465',
    lotSize: 32,
    issueSize: '4193.00',
    lm: ['Morgan Stanley', 'Kotak Mahindra'],
  },
  {
    company: 'OYO Oravel Stays',
    type: 'MAINBOARD',
    price: '350-365',
    lotSize: 40,
    issueSize: '8430.00',
    lm: ['Kotak Mahindra', 'JP Morgan'],
  },
  {
    company: 'One97 Communications SME',
    type: 'NSE SME',
    price: '90-95',
    lotSize: 1200,
    issueSize: '45.00',
    lm: ['Swastika Investmart'],
  },
  {
    company: 'Kronox Lab Sciences',
    type: 'MAINBOARD',
    price: '129-136',
    lotSize: 110,
    issueSize: '130.15',
    lm: ['Pantomath Capital'],
  },
  {
    company: 'Ztech India',
    type: 'NSE SME',
    price: '104-110',
    lotSize: 1200,
    issueSize: '37.30',
    lm: ['Narnolia Financial'],
  },
  {
    company: 'Mobikwik Systems',
    type: 'MAINBOARD',
    price: '280-300',
    lotSize: 50,
    issueSize: '700.00',
    lm: ['SBI Capital', 'DAM Capital'],
  },
  {
    company: 'PhonePe Financial',
    type: 'MAINBOARD',
    price: '850-900',
    lotSize: 15,
    issueSize: '12000.00',
    lm: ['Goldman Sachs', 'ICICI Securities'],
  },
  {
    company: 'Tata Play',
    type: 'MAINBOARD',
    price: '105-115',
    lotSize: 130,
    issueSize: '2500.00',
    lm: ['Axis Capital', 'HDFC Bank'],
  },
  {
    company: 'Go Digit General Insurance',
    type: 'MAINBOARD',
    price: '258-272',
    lotSize: 55,
    issueSize: '2614.65',
    lm: ['ICICI Securities', 'Morgan Stanley'],
  }
];

let lastIpoArrivalTime = Date.now();
let nextIpoId = 6;

router.get('/movers', async (req, res) => {
  const nsSymbols = ALL_STOCKS.map(s => `${s}.NS`);
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
  const validStocks = stocks.filter(s => !isNaN(parseFloat(s.changePercent)));
  const gainers = [...validStocks].sort((a, b) => parseFloat(b.changePercent) - parseFloat(a.changePercent)).slice(0, 10);
  const losers = [...validStocks].sort((a, b) => parseFloat(a.changePercent) - parseFloat(b.changePercent)).slice(0, 10);
  res.json({ gainers, losers });
});

router.get('/ipos', (req, res) => {
  const now = new Date();
  
  activeIpos.forEach(ipo => {
    const openDate = new Date(ipo.open);
    const closeDate = new Date(ipo.close);
    if (now > closeDate) {
      ipo.status = 'closed';
    } else if (now >= openDate) {
      ipo.status = 'open';
    } else {
      ipo.status = 'upcoming';
    }
  });

  activeIpos.forEach(ipo => {
    if (ipo.status !== 'closed') {
      const gmpDiff = Math.floor(Math.random() * 7) - 3; // -3 to +3
      const basePrice = parseInt(ipo.price.split('-')[0]) || 100;
      ipo.gmp = Math.max(0, ipo.gmp + gmpDiff);
      ipo.gmpPercent = ((ipo.gmp / basePrice) * 100).toFixed(1) + '%';
    }
  });

  const timeElapsed = Date.now() - lastIpoArrivalTime;
  if (timeElapsed > 45000 && IPO_POOL.length > 0) {
    const randomIndex = Math.floor(Math.random() * IPO_POOL.length);
    const candidate = IPO_POOL[randomIndex];
    
    const exists = activeIpos.some(ipo => ipo.company.toLowerCase() === candidate.company.toLowerCase());
    if (!exists) {
      const newIpo = {
        id: nextIpoId++,
        company: candidate.company,
        type: candidate.type,
        gmp: Math.floor(Math.random() * 100) + 15,
        gmpPercent: '0.0%',
        open: getDateOffset(2),
        close: getDateOffset(5),
        price: candidate.price,
        lotSize: candidate.lotSize,
        issueSize: candidate.issueSize,
        lm: candidate.lm,
        allotment: getDateOffset(6),
        listing: getDateOffset(9),
        status: 'upcoming'
      };
      const basePrice = parseInt(newIpo.price.split('-')[0]) || 100;
      newIpo.gmpPercent = ((newIpo.gmp / basePrice) * 100).toFixed(1) + '%';
      
      activeIpos.unshift(newIpo);
      IPO_POOL.splice(randomIndex, 1);
      lastIpoArrivalTime = Date.now();
    }
  }

  res.json(activeIpos);
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
  const nsSymbols = ALL_STOCKS.map(s => `${s}.NS`);
  const fetched = await fetchBatch(nsSymbols);
  const results = [];
  for (const sym of ALL_STOCKS) {
    const quote = fetched[`${sym}.NS`];
    if (quote?.price) {
      results.push({
        symbol: sym,
        sector: STOCK_UNIVERSE[sym] || 'Other',
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