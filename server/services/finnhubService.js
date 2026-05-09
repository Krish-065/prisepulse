const axios = require('axios');

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';

// Get Company Profile
exports.getCompanyProfile = async (symbol) => {
  try {
    const res = await axios.get(`${FINNHUB_BASE_URL}/stock/profile2`, {
      params: { symbol, token: FINNHUB_API_KEY }
    });
    return res.data;
  } catch (err) {
    throw new Error(`Finnhub Profile Error: ${err.message}`);
  }
};

// Get Quote (Current Price)
exports.getQuote = async (symbol) => {
  try {
    const res = await axios.get(`${FINNHUB_BASE_URL}/quote`, {
      params: { symbol, token: FINNHUB_API_KEY }
    });
    return res.data;
  } catch (err) {
    throw new Error(`Finnhub Quote Error: ${err.message}`);
  }
};

// Get Company News
exports.getNews = async (symbol, from, to) => {
  try {
    const res = await axios.get(`${FINNHUB_BASE_URL}/company-news`, {
      params: { symbol, from, to, token: FINNHUB_API_KEY }
    });
    return res.data;
  } catch (err) {
    throw new Error(`Finnhub News Error: ${err.message}`);
  }
};

// Get Peers/Similar Companies
exports.getPeers = async (symbol) => {
  try {
    const res = await axios.get(`${FINNHUB_BASE_URL}/stock/peers`, {
      params: { symbol, token: FINNHUB_API_KEY }
    });
    return res.data;
  } catch (err) {
    throw new Error(`Finnhub Peers Error: ${err.message}`);
  }
};

// Get Basic Financials
exports.getFinancials = async (symbol) => {
  try {
    const res = await axios.get(`${FINNHUB_BASE_URL}/stock/metric`, {
      params: { symbol, metric: 'all', token: FINNHUB_API_KEY }
    });
    return res.data;
  } catch (err) {
    throw new Error(`Finnhub Financials Error: ${err.message}`);
  }
};

// Get Recommendation Trends (Analyst Ratings)
exports.getRecommendations = async (symbol) => {
  try {
    const res = await axios.get(`${FINNHUB_BASE_URL}/stock/recommendation`, {
      params: { symbol, token: FINNHUB_API_KEY }
    });
    return res.data;
  } catch (err) {
    throw new Error(`Finnhub Recommendations Error: ${err.message}`);
  }
};