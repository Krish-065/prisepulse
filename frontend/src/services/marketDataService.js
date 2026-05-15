import axios from 'axios';

// Direct Yahoo Finance API (works from browser)
const YAHOO_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart';

// Fetch any symbol (stock, index, crypto, forex)
async function fetchQuote(symbol) {
  try {
    const url = `${YAHOO_BASE}/${symbol}`;
    const response = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const result = response.data.chart.result[0];
    if (!result) return null;
    const meta = result.meta;
    const quote = result.indicators.quote[0];
    return {
      price: meta.regularMarketPrice,
      change: meta.regularMarketPrice - meta.previousClose,
      changePercent: ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose * 100),
      dayHigh: meta.regularMarketDayHigh,
      dayLow: meta.regularMarketDayLow,
      volume: meta.regularMarketVolume,
      marketCap: meta.marketCap,
      previousClose: meta.previousClose
    };
  } catch (error) {
    console.error(`Error fetching ${symbol}:`, error);
    return null;
  }
}

// Fetch multiple symbols (indices)
async function fetchIndices() {
  const symbols = ['^NSEI', '^BSESN', '^NSEBANK'];
  const results = {};
  for (const sym of symbols) {
    const data = await fetchQuote(sym);
    results[sym] = data;
  }
  return results;
}

// Search stocks
async function searchStocks(query) {
  try {
    const searchUrl = `https://query1.finance.yahoo.com/v1/finance/search?q=${query}&quotesCount=20&newsCount=0`;
    const response = await axios.get(searchUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const quotes = response.data.quotes || [];
    return quotes
      .filter(q => q.quoteType === 'EQUITY' && (q.exchange === 'NSI' || q.exchange === 'BSE'))
      .map(q => ({
        symbol: q.symbol.replace('.NS', '').replace('.BO', ''),
        name: q.longname || q.shortname,
        exchange: q.exchange
      }));
  } catch (error) {
    console.error('Search error:', error);
    return [];
  }
}

// Top gainers/losers from NIFTY 50 (static list, then fetch live)
const NIFTY50_SYMBOLS = [
  'RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'INFY.NS', 'ICICIBANK.NS',
  'HINDUNILVR.NS', 'ITC.NS', 'SBIN.NS', 'BHARTIARTL.NS', 'KOTAKBANK.NS',
  'AXISBANK.NS', 'LT.NS', 'WIPRO.NS', 'ASIANPAINT.NS', 'HCLTECH.NS'
];

async function getTopGainersLosers() {
  const stocks = [];
  for (const sym of NIFTY50_SYMBOLS) {
    const quote = await fetchQuote(sym);
    if (quote) {
      stocks.push({
        symbol: sym.replace('.NS', ''),
        price: quote.price.toFixed(2),
        change: quote.change.toFixed(2),
        changePercent: quote.changePercent.toFixed(2)
      });
    }
    await new Promise(r => setTimeout(r, 150));
  }
  const gainers = [...stocks].sort((a,b) => b.changePercent - a.changePercent).slice(0, 10);
  const losers = [...stocks].sort((a,b) => a.changePercent - b.changePercent).slice(0, 10);
  return { gainers, losers };
}

export default {
  fetchQuote,
  fetchIndices,
  searchStocks,
  getTopGainersLosers
};