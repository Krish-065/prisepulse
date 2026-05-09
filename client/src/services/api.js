import axios from 'axios';
import { useAuthStore } from '../store/userStore';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' }
});

// Add token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Stock APIs
export const stockAPI = {
  search: (q) => apiClient.get('/market/stocks/search', { params: { q } }),
  getDetails: (symbol) => apiClient.get(`/market/stocks/${symbol}`),
  getChart: (symbol, timeframe = '1min') => 
    apiClient.get(`/market/stocks/${symbol}/chart`, { params: { timeframe } }),
  getNews: (symbol) => apiClient.get(`/market/stocks/${symbol}/news`),
};

// Crypto APIs
export const cryptoAPI = {
  getList: (page = 1) => apiClient.get('/crypto/list', { params: { page } }),
  getDetails: (id) => apiClient.get(`/crypto/${id}`),
  getChart: (id, days = 30) => apiClient.get(`/crypto/${id}/chart`, { params: { days } }),
  getTrending: () => apiClient.get('/crypto/trending'),
};

// News APIs
export const newsAPI = {
  getTopNews: (page = 1) => apiClient.get('/news', { params: { page } }),
  search: (q) => apiClient.get('/news/search', { params: { q } }),
  getBySymbol: (symbol) => apiClient.get(`/news/symbol/${symbol}`),
};

// Market Overview
export const marketAPI = {
  getIndices: () => apiClient.get('/market/indices'),
  getTopGainers: () => apiClient.get('/market/top-gainers'),
  getTopLosers: () => apiClient.get('/market/top-losers'),
};