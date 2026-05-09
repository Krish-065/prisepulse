const axios = require('axios');

const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3';

// Get all cryptocurrencies with market data
exports.getMarkets = async (page = 1, perPage = 250, order = 'market_cap_desc') => {
  try {
    const res = await axios.get(`${COINGECKO_BASE_URL}/coins/markets`, {
      params: {
        vs_currency: 'usd',
        order,
        per_page: perPage,
        page,
        sparkline: false
      }
    });
    return res.data;
  } catch (err) {
    throw new Error(`CoinGecko Markets Error: ${err.message}`);
  }
};

// Get crypto details by ID
exports.getCryptoDetails = async (id) => {
  try {
    const res = await axios.get(`${COINGECKO_BASE_URL}/coins/${id}`, {
      params: { localization: false, community_data: false }
    });
    return res.data;
  } catch (err) {
    throw new Error(`CoinGecko Details Error: ${err.message}`);
  }
};

// Get chart data (Historical)
exports.getChartData = async (id, days = 30, vs_currency = 'usd') => {
  try {
    const res = await axios.get(`${COINGECKO_BASE_URL}/coins/${id}/market_chart`, {
      params: { vs_currency, days }
    });
    return res.data;
  } catch (err) {
    throw new Error(`CoinGecko Chart Error: ${err.message}`);
  }
};

// Get trending cryptocurrencies
exports.getTrending = async () => {
  try {
    const res = await axios.get(`${COINGECKO_BASE_URL}/search/trending`);
    return res.data.coins;
  } catch (err) {
    throw new Error(`CoinGecko Trending Error: ${err.message}`);
  }
};

// Get top cryptocurrencies by category
exports.getByCategory = async (category) => {
  try {
    const res = await axios.get(`${COINGECKO_BASE_URL}/coins/markets`, {
      params: {
        vs_currency: 'usd',
        category,
        order: 'market_cap_desc',
        per_page: 250
      }
    });
    return res.data;
  } catch (err) {
    throw new Error(`CoinGecko Category Error: ${err.message}`);
  }
};

// Convert crypto amount
exports.convertPrice = async (from, to, amount = 1) => {
  try {
    const res = await axios.get(`${COINGECKO_BASE_URL}/simple/price`, {
      params: {
        ids: from,
        vs_currencies: to,
        include_market_cap: true,
        include_24hr_vol: true,
        include_24hr_change: true
      }
    });
    return res.data;
  } catch (err) {
    throw new Error(`CoinGecko Convert Error: ${err.message}`);
  }
};