const axios = require('axios');

const TWELVE_DATA_BASE_URL = 'https://api.twelvedata.com';
const API_KEY = process.env.TWELVE_DATA_API_KEY || '';

// Get real-time quote data
const getQuote = async (symbol) => {
  try {
    const response = await axios.get(`${TWELVE_DATA_BASE_URL}/quote`, {
      params: {
        symbol: symbol,
        apikey: API_KEY
      }
    });
    return response.data;
  } catch (error) {
    console.error('TwelveData Quote Error:', error.message);
    throw error;
  }
};

// Get intraday data
const getIntraday = async (symbol, interval = '5min') => {
  try {
    const response = await axios.get(`${TWELVE_DATA_BASE_URL}/time_series`, {
      params: {
        symbol: symbol,
        interval: interval,
        apikey: API_KEY
      }
    });
    return response.data.values || [];
  } catch (error) {
    console.error('TwelveData Intraday Error:', error.message);
    throw error;
  }
};

// Get daily data
const getDaily = async (symbol, range = '1month') => {
  try {
    const response = await axios.get(`${TWELVE_DATA_BASE_URL}/time_series`, {
      params: {
        symbol: symbol,
        interval: '1day',
        apikey: API_KEY
      }
    });
    return response.data.values || [];
  } catch (error) {
    console.error('TwelveData Daily Error:', error.message);
    throw error;
  }
};

// Get technical analysis
const getTechnicalAnalysis = async (symbol, type = 'sma') => {
  try {
    const response = await axios.get(`${TWELVE_DATA_BASE_URL}/ta_${type}`, {
      params: {
        symbol: symbol,
        interval: '1day',
        apikey: API_KEY
      }
    });
    return response.data;
  } catch (error) {
    console.error('TwelveData Technical Analysis Error:', error.message);
    throw error;
  }
};

module.exports = {
  getQuote,
  getIntraday,
  getDaily,
  getTechnicalAnalysis
};
