const axios = require('axios');
const cheerio = require('cheerio');

const NSE_BASE_URL = 'https://www.nseindia.com/api';
const NSE_WEBSITE = 'https://www.nseindia.com';

// Get NSE Indices
exports.getNifty50 = async () => {
  try {
    const res = await axios.get(`${NSE_BASE_URL}/index-data`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept': '*/*',
        'Referer': NSE_WEBSITE
      }
    });
    return res.data;
  } catch (err) {
    throw new Error(`NSE Data Error: ${err.message}`);
  }
};

// Get stock quote
exports.getStockQuote = async (symbol) => {
  try {
    const res = await axios.get(`${NSE_BASE_URL}/quote-equity`, {
      params: { symbol },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept': '*/*'
      }
    });
    return res.data;
  } catch (err) {
    throw new Error(`NSE Quote Error: ${err.message}`);
  }
};

// Get most active stocks
exports.getMostActive = async () => {
  try {
    const res = await axios.get(`${NSE_BASE_URL}/most-active-securities`, {
      params: { dataType: 'volume' },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });
    return res.data;
  } catch (err) {
    throw new Error(`NSE Most Active Error: ${err.message}`);
  }
};

// Get top gainers/losers
exports.getTopMovers = async (type = 'gainers') => {
  try {
    const res = await axios.get(`${NSE_BASE_URL}/market-data-tool`, {
      params: {
        name: type === 'gainers' ? 'alltickersgainer' : 'allTickersLoser'
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });
    return res.data;
  } catch (err) {
    throw new Error(`NSE Movers Error: ${err.message}`);
  }
};