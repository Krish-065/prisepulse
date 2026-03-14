import axios from 'axios';
import { io } from 'socket.io-client';

const BASE = 'http://localhost:5000/api';

// REST calls
export const getQuote   = (symbol) => axios.get(`${BASE}/market/quote/${symbol}`);
export const getHistory = (symbol) => axios.get(`${BASE}/market/history/${symbol}`);
export const getPortfolio = (token) => axios.get(`${BASE}/portfolio`,
  { headers: { Authorization: `Bearer ${token}` } });

// WebSocket connection
export const socket = io('http://localhost:5000');