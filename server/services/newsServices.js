const axios = require('axios');

const NEWSAPI_KEY = process.env.NEWSAPI_KEY;
const NEWSAPI_BASE_URL = 'https://newsapi.org/v2';

// Get top financial news
exports.getTopNews = async (page = 1, pageSize = 20) => {
  try {
    const res = await axios.get(`${NEWSAPI_BASE_URL}/top-headlines`, {
      params: {
        category: 'business',
        language: 'en',
        sortBy: 'publishedAt',
        apiKey: NEWSAPI_KEY,
        page,
        pageSize
      }
    });
    return res.data;
  } catch (err) {
    throw new Error(`NewsAPI Top Headlines Error: ${err.message}`);
  }
};

// Search news by keyword
exports.searchNews = async (q, page = 1, pageSize = 20) => {
  try {
    const res = await axios.get(`${NEWSAPI_BASE_URL}/everything`, {
      params: {
        q,
        language: 'en',
        sortBy: 'publishedAt',
        apiKey: NEWSAPI_KEY,
        page,
        pageSize
      }
    });
    return res.data;
  } catch (err) {
    throw new Error(`NewsAPI Search Error: ${err.message}`);
  }
};

// Search news for specific symbol
exports.getNewsBySymbol = async (symbol, page = 1) => {
  try {
    const res = await axios.get(`${NEWSAPI_BASE_URL}/everything`, {
      params: {
        q: symbol,
        sortBy: 'publishedAt',
        language: 'en',
        apiKey: NEWSAPI_KEY,
        page,
        pageSize: 20
      }
    });
    return res.data;
  } catch (err) {
    throw new Error(`NewsAPI Symbol Error: ${err.message}`);
  }
};

// Get category news
exports.getCategoryNews = async (category = 'business', page = 1) => {
  try {
    const res = await axios.get(`${NEWSAPI_BASE_URL}/top-headlines`, {
      params: {
        category,
        language: 'en',
        apiKey: NEWSAPI_KEY,
        page,
        pageSize: 20
      }
    });
    return res.data;
  } catch (err) {
    throw new Error(`NewsAPI Category Error: ${err.message}`);
  }
};