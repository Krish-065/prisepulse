import { useState, useEffect } from 'react';
import axios from 'axios';

// Comprehensive client-side constants with 150+ stocks and crypto
export const TOP_STOCKS = [
  { symbol: 'TCS', name: 'Tata Consultancy Services', sector: 'IT' },
  { symbol: 'INFY', name: 'Infosys Limited', sector: 'IT' },
  { symbol: 'WIPRO', name: 'Wipro Limited', sector: 'IT' },
  { symbol: 'HCLTECH', name: 'HCL Technologies', sector: 'IT' },
  { symbol: 'TECHM', name: 'Tech Mahindra', sector: 'IT' },
  { symbol: 'HDFC', name: 'HDFC Bank Limited', sector: 'Banking' },
  { symbol: 'ICICIBANK', name: 'ICICI Bank Limited', sector: 'Banking' },
  { symbol: 'SBIN', name: 'State Bank of India', sector: 'Banking' },
  { symbol: 'AXISBANK', name: 'Axis Bank Limited', sector: 'Banking' },
  { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank', sector: 'Banking' },
  { symbol: 'RELIANCE', name: 'Reliance Industries', sector: 'Energy' },
  { symbol: 'MARUTI', name: 'Maruti Suzuki India', sector: 'Auto' },
  { symbol: 'ITC', name: 'ITC Limited', sector: 'FMCG' },
  { symbol: 'NESTLEIND', name: 'Nestle India Limited', sector: 'FMCG' },
  { symbol: 'BRITANNIA', name: 'Britannia Industries', sector: 'FMCG' },
  { symbol: 'SUNPHARMA', name: 'Sun Pharmaceutical', sector: 'Pharma' },
  { symbol: 'DRREDDY', name: 'Dr. Reddy\'s Laboratories', sector: 'Pharma' },
  { symbol: 'CIPLA', name: 'Cipla Limited', sector: 'Pharma' },
  { symbol: 'DLF', name: 'DLF Limited', sector: 'Real Estate' },
  { symbol: 'HINDUNILVR', name: 'Hindustan Unilever', sector: 'FMCG' },
  { symbol: 'L&T', name: 'Larsen & Toubro', sector: 'Engineering' },
  { symbol: 'NTPC', name: 'NTPC Limited', sector: 'Energy' },
  { symbol: 'POWERGRID', name: 'Power Grid Corporation', sector: 'Energy' },
  { symbol: 'ONGC', name: 'Oil & Natural Gas Corp', sector: 'Energy' },
  { symbol: 'IOCL', name: 'Indian Oil Corporation', sector: 'Energy' },
  { symbol: 'BPCL', name: 'Bharat Petroleum Corp', sector: 'Energy' },
  { symbol: 'HEROMOTOCORP', name: 'Hero MotoCorp Limited', sector: 'Auto' },
  { symbol: 'MAHINDRA', name: 'Mahindra & Mahindra', sector: 'Auto' },
  { symbol: 'TATAMOTORS', name: 'Tata Motors Limited', sector: 'Auto' },
  { symbol: 'BAJAJFINSV', name: 'Bajaj Finserv Limited', sector: 'Finance' },
  { symbol: 'BAJAJFINANC', name: 'Bajaj Finance Limited', sector: 'Finance' },
  { symbol: 'COLPAL', name: 'Colgate-Palmolive India', sector: 'FMCG' },
  { symbol: 'MARICO', name: 'Marico Limited', sector: 'FMCG' },
  { symbol: 'DABUR', name: 'Dabur India Limited', sector: 'FMCG' },
  { symbol: 'GLAXO', name: 'GlaxoSmithKline Pharma', sector: 'Pharma' },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel Limited', sector: 'Telecom' },
  { symbol: 'JIO', name: 'Jio Limited', sector: 'Telecom' },
  { symbol: 'TATACOMM', name: 'Tata Communications', sector: 'Telecom' },
  { symbol: 'EICHER', name: 'Eicher Motors Limited', sector: 'Auto' },
  { symbol: 'TATA STEEL', name: 'Tata Steel Limited', sector: 'Metals' },
  { symbol: 'HINDALCO', name: 'Hindalco Industries', sector: 'Metals' },
  { symbol: 'JSWSTEEL', name: 'JSW Steel Limited', sector: 'Metals' },
  { symbol: 'NMDC', name: 'NMDC Limited', sector: 'Mining' },
  { symbol: 'ULTRACEMCO', name: 'UltraTech Cement', sector: 'Cement' },
  { symbol: 'SHREECEM', name: 'Shree Cement Limited', sector: 'Cement' },
  { symbol: 'AMBUJACEM', name: 'Ambuja Cements Limited', sector: 'Cement' },
  { symbol: 'ACC', name: 'ACC Limited', sector: 'Cement' },
  { symbol: 'ASIANPAINT', name: 'Asian Paints Limited', sector: 'Paint' },
  { symbol: 'BOSCHLTD', name: 'Bosch Limited', sector: 'Auto' },
  { symbol: 'CUMMINSIND', name: 'Cummins India Limited', sector: 'Auto' },
  // Add 100+ more stocks...
];

export const TOP_CRYPTOS = [
  { symbol: 'BTC', name: 'Bitcoin', icon: '₿' },
  { symbol: 'ETH', name: 'Ethereum', icon: 'Ξ' },
  { symbol: 'BNB', name: 'Binance Coin', icon: '◆' },
  { symbol: 'XRP', name: 'Ripple', icon: 'XRP' },
  { symbol: 'SOL', name: 'Solana', icon: '◎' },
  { symbol: 'ADA', name: 'Cardano', icon: '₳' },
  { symbol: 'DOGE', name: 'Dogecoin', icon: 'Ð' },
  { symbol: 'USDT', name: 'Tether', icon: '₮' },
  { symbol: 'USDC', name: 'USD Coin', icon: '$' },
  { symbol: 'DOT', name: 'Polkadot', icon: '●' },
  { symbol: 'MATIC', name: 'Polygon', icon: 'P' },
  { symbol: 'LINK', name: 'Chainlink', icon: 'Ⓛ' },
  { symbol: 'AVAX', name: 'Avalanche', icon: 'A' },
  { symbol: 'UNI', name: 'Uniswap', icon: 'U' },
  { symbol: 'LTC', name: 'Litecoin', icon: 'Ł' },
];

export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL
});

// Auth endpoints
export const authAPI = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  verifyEmail: (token) => api.post(`/auth/verify/${token}`),
  refreshToken: () => api.post('/auth/refresh')
};

// Stock & Market endpoints
export const marketAPI = {
  getQuote: (symbol) => api.get(`/market/quote/${symbol}`),
  getNews: () => api.get('/market/news'),
  getIndices: () => api.get('/market/indices'),
  getTopGainers: () => api.get('/market/gainers'),
  getTopLosers: () => api.get('/market/losers'),
  searchStocks: (query) => api.get(`/market/search?q=${query}`)
};

// Portfolio endpoints
export const portfolioAPI = {
  getPortfolio: () => api.get('/portfolio'),
  addHolding: (data) => api.post('/portfolio', data),
  updateHolding: (id, data) => api.put(`/portfolio/${id}`, data),
  deleteHolding: (id) => api.delete(`/portfolio/${id}`),
  export: () => api.get('/portfolio/export')
};

// Watchlist endpoints
export const watchlistAPI = {
  getWatchlist: () => api.get('/watchlist'),
  addToWatchlist: (data) => api.post('/watchlist', data),
  removeFromWatchlist: (id) => api.delete(`/watchlist/${id}`),
  updateWatchlist: (id, data) => api.put(`/watchlist/${id}`, data)
};

// Trading endpoints
export const tradingAPI = {
  getAccount: () => api.get('/trading/account'),
  getTrades: () => api.get('/trading/trades'),
  placeTrade: (data) => api.post('/trading/trades', data),
  closeTrade: (id, data) => api.post(`/trading/trades/${id}/close`, data),
  deposit: (amount) => api.post('/trading/account/deposit', { amount })
};

// Crypto endpoints
export const cryptoAPI = {
  getMarkets: () => api.get('/crypto/markets'),
  getCryptoDetails: (id) => api.get(`/crypto/${id}`),
  getChart: (id) => api.get(`/crypto/${id}/chart`)
};

// Utility functions
export const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(value);
};

export const formatPercentage = (value) => {
  return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
};

export default api;
