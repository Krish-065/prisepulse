const axios = require('axios');

const ALPHA_VANTAGE_KEY = process.env.ALPHA_VANTAGE_KEY;
const ALPHA_VANTAGE_BASE_URL = 'https://www.alphavantage.co/query';

// Get intraday data (real-time quotes)
exports.getIntraday = async (symbol, interval = '5min') => {
  try {
    const res = await axios.get(ALPHA_VANTAGE_BASE_URL, {
      params: {
        function: 'TIME_SERIES_INTRADAY',
        symbol,
        interval,
        apikey: ALPHA_VANTAGE_KEY,
        outputsize: 'full'
      }
    });
    return res.data;
  } catch (err) {
    throw new Error(`Alpha Vantage Intraday Error: ${err.message}`);
  }
};

// Get daily historical data
exports.getDaily = async (symbol) => {
  try {
    const res = await axios.get(ALPHA_VANTAGE_BASE_URL, {
      params: {
        function: 'TIME_SERIES_DAILY',
        symbol,
        apikey: ALPHA_VANTAGE_KEY,
        outputsize: 'full'
      }
    });
    return res.data;
  } catch (err) {
    throw new Error(`Alpha Vantage Daily Error: ${err.message}`);
  }
};

// Get forex exchange rate
exports.getForex = async (fromCurrency, toCurrency) => {
  try {
    const res = await axios.get(ALPHA_VANTAGE_BASE_URL, {
      params: {
        function: 'CURRENCY_EXCHANGE_RATE',
        from_currency: fromCurrency,
        to_currency: toCurrency,
        apikey: ALPHA_VANTAGE_KEY
      }
    });
    return res.data;
  } catch (err) {
    throw new Error(`Alpha Vantage Forex Error: ${err.message}`);
  }
};

// Get RSI technical indicator
exports.getRSI = async (symbol, interval = '5min') => {
  try {
    const res = await axios.get(ALPHA_VANTAGE_BASE_URL, {
      params: {
        function: 'RSI',
        symbol,
        interval,
        time_period: 14,
        apikey: ALPHA_VANTAGE_KEY
      }
    });
    return res.data;
  } catch (err) {
    throw new Error(`Alpha Vantage RSI Error: ${err.message}`);
  }
};

// Get MACD technical indicator
exports.getMACD = async (symbol, interval = '5min') => {
  try {
    const res = await axios.get(ALPHA_VANTAGE_BASE_URL, {
      params: {
        function: 'MACD',
        symbol,
        interval,
        apikey: ALPHA_VANTAGE_KEY
      }
    });
    return res.data;
  } catch (err) {
    throw new Error(`Alpha Vantage MACD Error: ${err.message}`);
  }
};