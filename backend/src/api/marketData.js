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

  // Cryptocurrencies
  'BTC-USD': 'Crypto',
  'ETH-USD': 'Crypto',
  'BNB-USD': 'Crypto',
  'SOL-USD': 'Crypto',
  'XRP-USD': 'Crypto',
  'DOGE-USD': 'Crypto',
  'ADA-USD': 'Crypto',
  'TRX-USD': 'Crypto',
  'AVAX-USD': 'Crypto',
  'SHIB-USD': 'Crypto',
  'TON-USD': 'Crypto',
  'DOT-USD': 'Crypto',

  // Forex Currency Pairs
  'EURUSD=X': 'Forex',
  'GBPUSD=X': 'Forex',
  'USDJPY=X': 'Forex',
  'AUDUSD=X': 'Forex',
  'USDCAD=X': 'Forex',
  'USDCHF=X': 'Forex',
  'EURGBP=X': 'Forex',
  'EURJPY=X': 'Forex',
  'USDINR=X': 'Forex',
  'EURINR=X': 'Forex',
  'GBPINR=X': 'Forex',
  'JPYINR=X': 'Forex',
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
    status: 'closed',
    subQib: 116.4,
    subNii: 53.2,
    subRetail: 21.8,
    subTotal: 58.6,
    registrar: 'Link Intime India Private Ltd',
    allotmentLink: 'https://linkintime.co.in/initial_offer/public-issues.html'
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
    status: 'open',
    subQib: 12.5,
    subNii: 45.1,
    subRetail: 89.4,
    subTotal: 56.2,
    registrar: 'Bigshare Services Pvt Ltd',
    allotmentLink: 'https://www.bigshareonline.com/ipo_Allotment.html'
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
    status: 'upcoming',
    subQib: 0.0,
    subNii: 0.0,
    subRetail: 0.0,
    subTotal: 0.0,
    registrar: 'Link Intime India Private Ltd',
    allotmentLink: 'https://linkintime.co.in/initial_offer/public-issues.html'
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
    status: 'upcoming',
    subQib: 0.0,
    subNii: 0.0,
    subRetail: 0.0,
    subTotal: 0.0,
    registrar: 'KFin Technologies Limited',
    allotmentLink: 'https://kosmic.kfintech.com/ipostatus/'
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
    status: 'closed',
    subQib: 34.6,
    subNii: 112.5,
    subRetail: 165.4,
    subTotal: 98.2,
    registrar: 'KFin Technologies Limited',
    allotmentLink: 'https://kosmic.kfintech.com/ipostatus/'
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
      const isLinkIntime = Math.random() > 0.5;
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
        status: 'upcoming',
        subQib: 0.0,
        subNii: 0.0,
        subRetail: 0.0,
        subTotal: 0.0,
        registrar: isLinkIntime ? 'Link Intime India Private Ltd' : 'KFin Technologies Limited',
        allotmentLink: isLinkIntime ? 'https://linkintime.co.in/initial_offer/public-issues.html' : 'https://kosmic.kfintech.com/ipostatus/'
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

router.get('/public-stats', async (req, res) => {
  try {
    const { query } = require('../db/index');
    
    // Get count of registered users
    const userCountRes = await query('SELECT COUNT(*) FROM users');
    const registeredUsers = parseInt(userCountRes.rows[0]?.count) || 0;

    // Get count of stocks listed
    const baseStocksCount = Object.keys(STOCK_UNIVERSE).length;
    let customCount = 0;
    try {
      const customWatchlistRes = await query('SELECT COUNT(DISTINCT symbol) FROM watchlist_items');
      const customPortfolioRes = await query('SELECT COUNT(DISTINCT symbol) FROM portfolio_items');
      customCount = (parseInt(customWatchlistRes.rows[0]?.count) || 0) + (parseInt(customPortfolioRes.rows[0]?.count) || 0);
    } catch (dbErr) {
      console.warn('Failed to query custom stock count, fallback to 0:', dbErr.message);
    }
    const totalStocksListed = 5000 + baseStocksCount + customCount;

    // Get Nifty 50 volume from Yahoo Finance to simulate/calculate Daily Volume dynamically
    let volumeText = '₹2.44T';
    try {
      const quote = await fetchYahooQuote('^NSEI');
      if (quote && quote.volume) {
        const variance = (quote.volume % 50) / 100; // 0 to 0.50
        const finalVol = (2.2 + variance).toFixed(2);
        volumeText = `₹${finalVol}T`;
      }
    } catch {
      volumeText = '₹2.41T';
    }

    const uptime = 99.98;

    res.json({
      activeUsers: registeredUsers,
      dailyVolume: volumeText,
      stocksListed: totalStocksListed,
      uptime: `${uptime}%`
    });
  } catch (err) {
    console.error('Public stats error:', err);
    res.json({
      activeUsers: 12,
      dailyVolume: '₹2.42T',
      stocksListed: 5218,
      uptime: '99.95%'
    });
  }
});

router.get('/search/:query', async (req, res) => {
  try {
    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(req.params.query)}&quotesCount=30`;
    const response = await fetch(url, { headers: YAHOO_HEADERS });
    const data = await response.json();
    const quotes = data.quotes || [];
    const stocks = quotes
      // Allow equities, indices, ETFs, Mutual Funds, Cryptocurrencies, and Forex Currencies
      .filter(q => ['EQUITY', 'INDEX', 'ETF', 'MUTUALFUND', 'CRYPTOCURRENCY', 'CURRENCY'].includes(q.quoteType))
      .slice(0, 20)
      .map(q => {
        let exchangeLabel = q.exchange;
        if (q.quoteType === 'CRYPTOCURRENCY') {
          exchangeLabel = 'Crypto';
        } else if (q.quoteType === 'CURRENCY') {
          exchangeLabel = 'Forex';
        } else if (['NYQ', 'NMS', 'NGM', 'PCX'].includes(q.exchange)) {
          exchangeLabel = 'US Market';
        } else if (['NSI', 'BOM', 'NSE', 'BSE'].includes(q.exchange) || (q.exchange || '').startsWith('NS') || (q.exchange || '').startsWith('BO')) {
          exchangeLabel = q.exchange || 'NSE';
        } else {
          exchangeLabel = q.exchange || 'Global';
        }

        return {
          symbol: q.symbol,
          name: q.longname || q.shortname || q.symbol,
          exchange: exchangeLabel,
          type: q.quoteType
        };
      });
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
  }

  // Try fetching as-is first (e.g. AAPL, BTC-USD, EURUSD=X, RELIANCE.NS)
  let quote = await fetchYahooQuote(fetchSymbol);
  
  // If not found, check if it already ends with common suffixes. If not, try appending .NS (unless it's an index or crypto/forex format)
  if ((!quote || !quote.price) && !fetchSymbol.endsWith('.NS') && !fetchSymbol.endsWith('.BO') && !fetchSymbol.endsWith('=X') && !fetchSymbol.endsWith('-USD') && !fetchSymbol.startsWith('^')) {
    fetchSymbol = `${fetchSymbol}.NS`;
    quote = await fetchYahooQuote(fetchSymbol);
  }

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
  const nsSymbols = ALL_STOCKS.map(s => {
    if (s.includes('-USD') || s.endsWith('=X') || s.includes('=')) {
      return s;
    }
    return `${s}.NS`;
  });
  const fetched = await fetchBatch(nsSymbols);
  const results = [];
  for (const sym of ALL_STOCKS) {
    const fetchKey = (sym.includes('-USD') || sym.endsWith('=X') || sym.includes('=')) ? sym : `${sym}.NS`;
    const quote = fetched[fetchKey];
    if (quote?.price) {
      let name = sym;
      if (sym === 'BTC-USD') name = 'Bitcoin USD';
      else if (sym === 'ETH-USD') name = 'Ethereum USD';
      else if (sym === 'BNB-USD') name = 'Binance Coin USD';
      else if (sym === 'SOL-USD') name = 'Solana USD';
      else if (sym === 'XRP-USD') name = 'Ripple USD';
      else if (sym === 'DOGE-USD') name = 'Dogecoin USD';
      else if (sym === 'ADA-USD') name = 'Cardano USD';
      else if (sym === 'TRX-USD') name = 'TRON USD';
      else if (sym === 'AVAX-USD') name = 'Avalanche USD';
      else if (sym === 'SHIB-USD') name = 'Shiba Inu USD';
      else if (sym === 'TON-USD') name = 'Toncoin USD';
      else if (sym === 'DOT-USD') name = 'Polkadot USD';
      else if (sym === 'EURUSD=X') name = 'EUR / USD Forex';
      else if (sym === 'GBPUSD=X') name = 'GBP / USD Forex';
      else if (sym === 'USDJPY=X') name = 'USD / JPY Forex';
      else if (sym === 'AUDUSD=X') name = 'AUD / USD Forex';
      else if (sym === 'USDCAD=X') name = 'USD / CAD Forex';
      else if (sym === 'USDCHF=X') name = 'USD / CHF Forex';
      else if (sym === 'EURGBP=X') name = 'EUR / GBP Forex';
      else if (sym === 'EURJPY=X') name = 'EUR / JPY Forex';
      else if (sym === 'USDINR=X') name = 'USD / INR Forex';
      else if (sym === 'EURINR=X') name = 'EUR / INR Forex';
      else if (sym === 'GBPINR=X') name = 'GBP / INR Forex';
      else if (sym === 'JPYINR=X') name = 'JPY / INR Forex';

      results.push({
        symbol: sym,
        name: name,
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

// Curated backup news feed with full analysis structure
const FALLBACK_NEWS = [
  {
    title: "Reliance Industries Announces New Solar Gigafactory in Gujarat",
    description: "Reliance Industries has officially unveiled plans for a state-of-the-art solar photovoltaic giga-factory in Jamnagar, Gujarat. The company intends to invest ₹50,000 crores to accelerate its green energy transition targets.",
    time: "10:15 AM",
    date: "02 Jul 2026",
    url: "https://finance.yahoo.com/quote/RELIANCE.NS",
    source: "NonStock Research",
    image: "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800&auto=format&fit=crop&q=60",
    category: "Equity",
    sentiment: "Bullish",
    impact: "High",
    takeaway: "Jamnagar gigafactory will boost Reliance's green portfolio and open new high-margin revenue streams. Bullish for long-term investors."
  },
  {
    title: "RBI Holds Repo Rate at 6.5%, Projects FY27 GDP Growth at 7.2%",
    description: "The Reserve Bank of India's Monetary Policy Committee (MPC) voted unanimously to maintain the benchmark repo rate at 6.50%. RBI Governor Shaktikanta Das highlighted that inflation control remains the priority.",
    time: "11:30 AM",
    date: "02 Jul 2026",
    url: "https://finance.yahoo.com/quote/^NSEI",
    source: "Reserve Bank of India",
    image: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&auto=format&fit=crop&q=60",
    category: "Economy",
    sentiment: "Neutral",
    impact: "High",
    takeaway: "Steady interest rates prevent borrowing cost escalation for auto and real estate sectors. Positive for financial stability."
  },
  {
    title: "Nifty Call Writers Trapped as Index Surges Past 24,200 Level",
    description: "Massive short covering was triggered in Nifty 50 weekly options as the index broke through the major resistance level of 24,200, leading to a 170-point intraday rally.",
    time: "01:45 PM",
    date: "02 Jul 2026",
    url: "https://finance.yahoo.com/quote/^NSEI",
    source: "F&O Desk",
    image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&auto=format&fit=crop&q=60",
    category: "F&O",
    sentiment: "Bullish",
    impact: "High",
    takeaway: "Heavy short covering from call writers suggests Nifty could target 24,400 in the current series. Buy on dips recommended."
  },
  {
    title: "Bitcoin Surges Past $68,000 on Renewed US Institutional ETF Inflows",
    description: "Bitcoin rallied over 4% in 24 hours to cross $68,000, fueled by high trading volumes in spot Bitcoin ETFs and positive macroeconomic sentiment.",
    time: "02:10 PM",
    date: "02 Jul 2026",
    url: "https://finance.yahoo.com/quote/BTC-USD",
    source: "Crypto Intelligence",
    image: "https://images.unsplash.com/photo-1516245834210-c4c142787335?w=800&auto=format&fit=crop&q=60",
    category: "Crypto",
    sentiment: "Bullish",
    impact: "Medium",
    takeaway: "Strong spot ETF demand indicates institutional accumulation. Next major resistance is seen at the $70,000 mark."
  },
  {
    title: "TCS Q1 Net Profit Rises 8.4% YoY, Exceeds Street Estimates",
    description: "Tata Consultancy Services (TCS) reported a solid start to the financial year with an 8.4% Year-on-Year increase in consolidated net profit, driven by strong execution in banking and retail verticals.",
    time: "04:30 PM",
    date: "02 Jul 2026",
    url: "https://finance.yahoo.com/quote/TCS.NS",
    source: "Corporate Disclosures",
    image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=60",
    category: "Equity",
    sentiment: "Bullish",
    impact: "High",
    takeaway: "Beating earnings estimates signals resilience in Indian IT service sector. Positive catalyst for IT stock indices."
  },
  {
    title: "US Federal Reserve Signals September Rate Cuts as Inflation Moderates",
    description: "Minutes from the latest Federal Reserve meeting show policy makers are increasingly confident that inflation is cooling toward their 2% target, paving the way for rate cuts.",
    time: "06:00 PM",
    date: "02 Jul 2026",
    url: "https://finance.yahoo.com/quote/^GSPC",
    source: "Federal Reserve",
    image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&auto=format&fit=crop&q=60",
    category: "Economy",
    sentiment: "Bullish",
    impact: "High",
    takeaway: "Fed pivot to rate cuts will trigger global liquidity inflows. Extremely bullish for emerging markets like India."
  },
  {
    title: "Heavy Long Build-up Detected in Automobile Futures Following Strong Sales Data",
    description: "Derivative indicators show a significant surge in open interest alongside rising prices for Tata Motors and Mahindra & Mahindra futures after strong monthly dispatch numbers.",
    time: "03:15 PM",
    date: "02 Jul 2026",
    url: "https://finance.yahoo.com/quote/TATAMOTORS.NS",
    source: "F&O Analytics",
    image: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&auto=format&fit=crop&q=60",
    category: "F&O",
    sentiment: "Bullish",
    impact: "Medium",
    takeaway: "F&O build-up suggests traders are positioning for further auto sector outperformance. Positive momentum trade setup."
  },
  {
    title: "Ethereum ETF Net Inflows Hit Record Highs as Staking Discussions Resume",
    description: "Spot Ethereum ETFs recorded a record single-day net inflow of $120 million, prompting renewed optimism about native staking options in regulated funds.",
    time: "07:45 PM",
    date: "02 Jul 2026",
    url: "https://finance.yahoo.com/quote/ETH-USD",
    source: "CoinDesk",
    image: "https://images.unsplash.com/photo-1622790698141-94e304bc7ef9?w=800&auto=format&fit=crop&q=60",
    category: "Crypto",
    sentiment: "Bullish",
    impact: "Medium",
    takeaway: "ETF flows are establishing a strong support floor for Ethereum. Watch out for a break past $3,800 soon."
  },
  {
    title: "Indian Government Announces Infrastructure Capex Boost in Union Budget",
    description: "The Finance Ministry has proposed an 11.1% increase in capital expenditure allocation for infrastructure projects, highlighting highway, railway, and port development.",
    time: "09:00 AM",
    date: "02 Jul 2026",
    url: "https://finance.yahoo.com/quote/^NSEI",
    source: "Ministry of Finance",
    image: "https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=800&auto=format&fit=crop&q=60",
    category: "Economy",
    sentiment: "Bullish",
    impact: "High",
    takeaway: "Increased government capex will directly benefit capital goods, steel, and cement manufacturers (L&T, UltraTech)."
  },
  {
    title: "HDFC Bank Shares Slip on Concern Over Credit-to-Deposit Ratio",
    description: "Shares of HDFC Bank closed 1.8% lower today as analysts raised concerns that its high credit-to-deposit ratio might limit credit expansion in upcoming quarters.",
    time: "03:45 PM",
    date: "02 Jul 2026",
    url: "https://finance.yahoo.com/quote/HDFCBANK.NS",
    source: "Brokerage Notes",
    image: "https://images.unsplash.com/photo-1601597111158-2fceff270190?w=800&auto=format&fit=crop&q=60",
    category: "Equity",
    sentiment: "Bearish",
    impact: "Medium",
    takeaway: "Near-term pressure expected as the bank rebalances its loan book. Defensive approach suggested until ratios normalize."
  }
];

router.get('/news', async (req, res) => {
  try {
    let articles = [];

    if (NEWS_API_KEY) {
      const url = `https://newsapi.org/v2/everything?q=stock%20market%20OR%20nifty%20OR%20sensex%20OR%20crypto%20OR%20rbi&language=en&sortBy=publishedAt&apiKey=${NEWS_API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === 'ok' && data.articles && data.articles.length > 0) {
        articles = data.articles.slice(0, 30).map((a, index) => {
          const titleLower = a.title.toLowerCase();
          const descLower = (a.description || '').toLowerCase();
          
          // Heuristic Classification
          let category = "Equity";
          if (titleLower.includes('rbi') || titleLower.includes('inflation') || titleLower.includes('gdp') || titleLower.includes('fed') || titleLower.includes('interest rate') || titleLower.includes('economy') || titleLower.includes('budget') || titleLower.includes('policy')) {
            category = "Economy";
          } else if (titleLower.includes('option') || titleLower.includes('future') || titleLower.includes('f&o') || titleLower.includes('expiry') || titleLower.includes('call') || titleLower.includes('put') || titleLower.includes('derivatives') || titleLower.includes('oi ') || titleLower.includes('open interest')) {
            category = "F&O";
          } else if (titleLower.includes('bitcoin') || titleLower.includes('ethereum') || titleLower.includes('crypto') || titleLower.includes('solana') || titleLower.includes('doge') || titleLower.includes('coin') || titleLower.includes('blockchain') || titleLower.includes('etf')) {
            category = "Crypto";
          }
          
          let sentiment = "Neutral";
          if (titleLower.includes('surge') || titleLower.includes('rise') || titleLower.includes('jump') || titleLower.includes('gain') || titleLower.includes('bull') || titleLower.includes('upbeat') || titleLower.includes('exceed') || titleLower.includes('positive') || titleLower.includes('rally')) {
            sentiment = "Bullish";
          } else if (titleLower.includes('slip') || titleLower.includes('fall') || titleLower.includes('drop') || titleLower.includes('loss') || titleLower.includes('bear') || titleLower.includes('decline') || titleLower.includes('slump') || titleLower.includes('miss') || titleLower.includes('negative')) {
            sentiment = "Bearish";
          }
          
          let impact = "Low";
          if (titleLower.includes('rbi') || titleLower.includes('fed') || titleLower.includes('earning') || titleLower.includes('gdp') || titleLower.includes('profit') || titleLower.includes('break') || titleLower.includes('surge') || titleLower.includes('fall') || titleLower.includes('rate cut')) {
            impact = "High";
          } else if (titleLower.includes('deal') || titleLower.includes('launch') || titleLower.includes('etf') || titleLower.includes('stock') || titleLower.includes('crypto')) {
            impact = "Medium";
          }

          // Heuristic Takeaway
          let takeaway = `Key development in ${category.toLowerCase()} markets. Monitor nearby levels and relevant corporate actions for impact.`;
          if (sentiment === 'Bullish') {
            takeaway = `Positive momentum catalyst for ${category.toLowerCase()} assets. Buy on dips or trend-following positions are favored.`;
          } else if (sentiment === 'Bearish') {
            takeaway = `Potential negative trigger. Traders should exercise caution, tighten stop losses, or consider hedge setups.`;
          }
          
          return {
            title: a.title,
            description: a.description || "Click the link to read the full report of this key market development.",
            time: new Date(a.publishedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
            date: new Date(a.publishedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
            url: a.url,
            source: a.source.name,
            image: a.urlToImage || `https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&auto=format&fit=crop&q=60`,
            category,
            sentiment,
            impact,
            takeaway
          };
        });
      }
    }

    // Merge or fallback to our premium FALLBACK_NEWS database if empty
    if (articles.length === 0) {
      articles = [...FALLBACK_NEWS];
    } else {
      // Append fallback news items to guarantee a highly rich dashboard
      articles = [...FALLBACK_NEWS.slice(0, 5), ...articles];
    }

    res.json(articles);
  } catch (err) {
    res.json(FALLBACK_NEWS);
  }
});

router.get('/sector-rotation', async (req, res) => {
  try {
    const sectorsDef = {
      'Banking': ['HDFCBANK.NS', 'ICICIBANK.NS', 'SBIN.NS', 'AXISBANK.NS'],
      'Information Tech': ['TCS.NS', 'INFY.NS', 'HCLTECH.NS', 'WIPRO.NS'],
      'Energy & Utilities': ['RELIANCE.NS', 'ONGC.NS', 'BPCL.NS', 'NTPC.NS'],
      'Auto': ['TATAMOTORS.NS', 'M&M.NS', 'MARUTI.NS', 'HEROMOTOCO.NS'],
      'Pharma & Health': ['SUNPHARMA.NS', 'CIPLA.NS', 'DRREDDY.NS', 'APOLLOHOSP.NS'],
      'FMCG': ['HINDUNILVR.NS', 'ITC.NS', 'NESTLEIND.NS', 'BRITANNIA.NS'],
      'Metals & Mining': ['TATASTEEL.NS', 'JSWSTEEL.NS', 'HINDALCO.NS', 'COALINDIA.NS']
    };

    // Flatten all symbols to fetch in batch
    const allSymbols = [];
    Object.values(sectorsDef).forEach(syms => allSymbols.push(...syms));
    
    const quotes = await fetchBatch(allSymbols);
    
    const results = Object.keys(sectorsDef).map(sectorName => {
      const symbols = sectorsDef[sectorName];
      let totalPriceChange = 0;
      let count = 0;
      let topStockSymbol = '';
      let topStockPerformance = -Infinity;

      symbols.forEach(sym => {
        const quote = quotes[sym];
        if (quote && quote.changePercent !== null && quote.changePercent !== undefined) {
          totalPriceChange += quote.changePercent;
          count++;
          if (quote.changePercent > topStockPerformance) {
            topStockPerformance = quote.changePercent;
            topStockSymbol = sym.replace('.NS', '');
          }
        }
      });

      const avgPriceChange = count > 0 ? totalPriceChange / count : 0.0;
      
      // Calculate dynamic simulated OI changes based on sector price action
      // E.g., if price is up, generate fresh buy interest; if down, generate short sell interest
      const oiBase = Math.sin(sectorName.charCodeAt(0)) * 5; // Fixed sector offset
      const tickFluctuation = (Math.random() - 0.5) * 1.5;
      const avgOiChange = parseFloat((oiBase + (avgPriceChange * 1.8) + tickFluctuation).toFixed(2));
      
      // Map to 4-Quadrant Sector Rotation State:
      // Leading: Price > 0, OI > 0
      // Weakening: Price < 0, OI > 0 (distributing)
      // Lagging: Price < 0, OI < 0
      // Improving: Price > 0, OI < 0 (short covering/reversal)
      let quadrant = 'Neutral';
      let description = '';
      if (avgPriceChange >= 0 && avgOiChange >= 0) {
        quadrant = 'Leading';
        description = 'Institutional accumulation & high momentum.';
      } else if (avgPriceChange < 0 && avgOiChange >= 0) {
        quadrant = 'Weakening';
        description = 'Institutional distribution / profit booking.';
      } else if (avgPriceChange < 0 && avgOiChange < 0) {
        quadrant = 'Lagging';
        description = 'Lack of market interest and capitalization.';
      } else {
        quadrant = 'Improving';
        description = 'Short covering and early structural recovery.';
      }

      // Smart Money Flow Index (0 - 100)
      const flowIndex = Math.min(100, Math.max(0, Math.round(50 + (avgPriceChange * 15) + (avgOiChange * 5))));

      return {
        sector: sectorName,
        priceChange: parseFloat(avgPriceChange.toFixed(2)),
        oiChange: avgOiChange,
        quadrant,
        description,
        flowIndex,
        topStock: topStockSymbol || 'N/A',
        topStockPerformance: parseFloat((topStockPerformance === -Infinity ? 0.0 : topStockPerformance).toFixed(2))
      };
    });

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: 'Failed to calculate sector rotation metrics' });
  }
});

router.get('/stock-history/:symbol', async (req, res) => {
  try {
    let symbol = req.params.symbol.toUpperCase();

    // ─── Smart Symbol Resolver ───
    // Do NOT blindly append .NS — only do so for real Indian equity tickers
    const isIndex = symbol.startsWith('^') ||
                    ['NSEI', 'BSESN', 'NSEBANK', 'CNXIT', 'NIFTY', 'SENSEX', 'BANKNIFTY'].includes(symbol);
    const isCrypto = symbol.endsWith('-USD') || symbol.endsWith('-USDT') ||
                     ['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'DOGE', 'ADA', 'SHIB', 'AVAX', 'TRX'].includes(symbol);
    const isForex  = symbol.endsWith('=X') || symbol.includes('USD') || symbol.includes('INR') && !symbol.endsWith('.NS');
    const alreadySuffixed = symbol.endsWith('.NS') || symbol.endsWith('.BO') || symbol.endsWith('=X') || symbol.endsWith('-USD') || symbol.endsWith('-USDT');

    if (isCrypto && !alreadySuffixed) {
      // e.g. BTC → BTC-USD (Yahoo Finance format for crypto)
      symbol = `${symbol}-USD`;
    } else if (!isIndex && !isCrypto && !isForex && !alreadySuffixed) {
      // Plain Indian equity ticker → append .NS
      symbol = `${symbol}.NS`;
    }

    // Support dynamic intervals: 1m, 5m, 1d. Default to 1d
    const allowedIntervals = ['1m', '5m', '1d'];
    const interval = allowedIntervals.includes(req.query.interval) ? req.query.interval : '1d';

    let range = '3mo';
    if (interval === '1m') {
      const allowedRanges = ['1d', '5d', '7d'];
      range = allowedRanges.includes(req.query.range) ? req.query.range : '1d';
    } else if (interval === '5m') {
      const allowedRanges = ['1d', '5d', '7d', '1mo'];
      range = allowedRanges.includes(req.query.range) ? req.query.range : '5d';
    } else {
      const allowedRanges = ['1mo', '3mo', '6mo', '1y'];
      range = allowedRanges.includes(req.query.range) ? req.query.range : '3mo';
    }

    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}`;
    const response = await fetch(url, { headers: YAHOO_HEADERS });
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch stock history' });
    }
    const data = await response.json();
    const result = data?.chart?.result?.[0];
    if (!result) {
      return res.status(404).json({ error: 'No history found' });
    }
    const timestamps = result.timestamp || [];
    const quotes = result.indicators?.quote?.[0] || {};
    const opens   = quotes.open   || [];
    const highs   = quotes.high   || [];
    const lows    = quotes.low    || [];
    const closes  = quotes.close  || [];
    const volumes = quotes.volume || [];

    const history = [];
    for (let i = 0; i < timestamps.length; i++) {
      if (opens[i] !== null && closes[i] !== null) {
        history.push({
          time:   timestamps[i] * 1000,
          open:   parseFloat(opens[i].toFixed(2)),
          high:   parseFloat(highs[i].toFixed(2)),
          low:    parseFloat(lows[i].toFixed(2)),
          close:  parseFloat(closes[i].toFixed(2)),
          volume: Math.round(volumes[i] || 0)
        });
      }
    }
    if (history.length < 5) {
      let livePrice = 100;
      try {
        const quote = await fetchYahooQuote(symbol);
        if (quote && quote.price) {
          livePrice = quote.price;
        }
      } catch (e) {
        if (history.length > 0) {
          livePrice = history[history.length - 1].close;
        }
      }

      const basePrice = livePrice;
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;
      
      let seed = 0;
      for (let i = 0; i < symbol.length; i++) {
        seed += symbol.charCodeAt(i);
      }
      const random = () => {
        const x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
      };

      let currPrice = basePrice;
      const simulatedHistory = [];
      const dataPointsCount = interval === '1d' ? 60 : 30;
      const timeStep = interval === '1m' ? 60000 : interval === '5m' ? 300000 : oneDay;

      for (let i = 0; i < dataPointsCount; i++) {
        const time = now - i * timeStep;
        
        // Generate a random daily change (mean zero, std dev ~1.5%)
        const changePct = (random() - 0.49) * 0.03;
        const prevPrice = currPrice * (1 - changePct);

        const open = prevPrice;
        const close = currPrice;
        const high = Math.max(open, close) * (1 + random() * 0.008);
        const low = Math.min(open, close) * (1 - random() * 0.008);
        const volume = Math.floor(10000 + random() * 90000);

        simulatedHistory.push({
          time,
          open: parseFloat(open.toFixed(2)),
          high: parseFloat(high.toFixed(2)),
          low: parseFloat(low.toFixed(2)),
          close: parseFloat(close.toFixed(2)),
          volume: Math.round(volume)
        });
        currPrice = prevPrice;
      }
      simulatedHistory.reverse();
      return res.json(simulatedHistory);
    }

    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── MUTUAL FUNDS API INTEGRATION (api.mfapi.in) ───


// Helper to calculate historical CAGR / Absolute returns
function calculateMFReturns(navHistory) {
  if (!navHistory || navHistory.length === 0) return { '1Y': '0.00%', '3Y': '0.00%', '5Y': '0.00%' };
  const currentNav = parseFloat(navHistory[0].nav);
  if (isNaN(currentNav) || currentNav <= 0) return { '1Y': '0.00%', '3Y': '0.00%', '5Y': '0.00%' };

  const getReturnForDays = (days) => {
    // Find index matching approximate business days
    const index = Math.min(days, navHistory.length - 1);
    const pastNav = parseFloat(navHistory[index].nav);
    if (isNaN(pastNav) || pastNav <= 0) return '0.00%';
    
    const absoluteReturn = ((currentNav - pastNav) / pastNav) * 100;
    if (days <= 260) {
      // 1 Year is absolute return
      return absoluteReturn.toFixed(2) + '%';
    } else {
      // Annualized returns (CAGR) for > 1 Year
      const years = days / 260; // ~260 trading days in a year
      const cagr = (Math.pow((currentNav / pastNav), (1 / years)) - 1) * 100;
      return cagr.toFixed(2) + '%';
    }
  };

  return {
    '1Y': getReturnForDays(252),  // ~252 trading days/year
    '3Y': getReturnForDays(756),
    '5Y': getReturnForDays(1260)
  };
}

// 1. Search Mutual Funds
router.get('/mutual-funds/search', async (req, res) => {
  try {
    const queryStr = (req.query.query || '').trim();
    if (!queryStr || queryStr.length < 3) {
      return res.json([]);
    }
    const response = await fetch(`https://api.mfapi.in/mf/search?q=${encodeURIComponent(queryStr)}`);
    if (!response.ok) throw new Error('Failed to query mfapi search');
    const data = await response.json();
    const matches = data.slice(0, 20).map(fund => ({
      schemeCode: String(fund.schemeCode),
      schemeName: fund.schemeName
    }));
    res.json(matches);
  } catch (err) {
    console.error('Mutual Fund search failed:', err);
    res.status(500).json({ error: 'Search failed' });
  }
});

// 2. Fetch Mutual Fund Details & Charts
router.get('/mutual-funds/:schemeCode', async (req, res) => {
  try {
    const { schemeCode } = req.params;
    const response = await fetch(`https://api.mfapi.in/mf/${schemeCode}`);
    if (!response.ok) {
      return res.status(404).json({ error: 'Fund not found' });
    }
    const data = await response.json();
    if (data.status !== 'SUCCESS' || !data.meta || !data.data) {
      return res.status(404).json({ error: 'Scheme data unavailable' });
    }

    const meta = data.meta;
    const rawNav = data.data; // Array of { date, nav }
    
    // Sort NAVs chronologically if they are not already (usually mfapi returns newest first)
    const navHistory = [...rawNav].map(item => ({
      date: item.date,
      nav: parseFloat(item.nav)
    }));

    const returns = calculateMFReturns(navHistory);
    
    // Format chart data for TradingView or Recharts
    const chartData = navHistory.slice(0, 252).reverse().map(item => {
      // Convert DD-MM-YYYY to YYYY-MM-DD or Unix timestamp
      const parts = item.date.split('-');
      const dateStr = `${parts[2]}-${parts[1]}-${parts[0]}`;
      return {
        time: dateStr,
        value: item.nav
      };
    });

    // Determine Risk Profile based on Scheme Category heuristics
    const category = (meta.scheme_category || '').toLowerCase();
    let risk = 'moderate';
    if (category.includes('small cap') || category.includes('mid cap') || category.includes('sectoral') || category.includes('thematic') || category.includes('equity')) {
      risk = 'high';
    } else if (category.includes('liquid') || category.includes('debt') || category.includes('gilt') || category.includes('overnight')) {
      risk = 'low';
    }

    // Heuristics for ratings (3 to 5 stars)
    let rating = 4;
    const ret1Y = parseFloat(returns['1Y']);
    if (ret1Y > 40) rating = 5;
    else if (ret1Y < 15) rating = 3;

    res.json({
      schemeCode: meta.scheme_code,
      name: meta.scheme_name,
      category: meta.scheme_category || 'Equity: Growth',
      fundHouse: meta.fund_house || 'Direct House',
      type: meta.scheme_type || 'Direct Plan',
      nav: navHistory[0]?.nav?.toFixed(2) || '0.00',
      lastUpdated: navHistory[0]?.date || '',
      returns,
      risk,
      rating,
      aum: (Math.abs(Math.sin(parseInt(meta.scheme_code)) * 25000) + 1200).toFixed(0), // simulated AUM in Cr
      chartData
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;