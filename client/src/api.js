import axios from 'axios';
import { io } from 'socket.io-client';

const BASE = `${process.env.REACT_APP_API_URL}/api`;
// REST calls
export const getQuote   = (symbol) => axios.get(`${BASE}/market/quote/${symbol}`);
export const getHistory = (symbol) => axios.get(`${BASE}/market/history/${symbol}`);
export const getPortfolio = (token) => axios.get(`${BASE}/portfolio`,
  { headers: { Authorization: `Bearer ${token}` } });

// WebSocket connection
const socket = io(process.env.REACT_APP_API_URL);