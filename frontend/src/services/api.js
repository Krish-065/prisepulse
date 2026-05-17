import axios from 'axios';

let API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
if (API_URL && !API_URL.endsWith('/api')) {
  API_URL = `${API_URL}/api`;
}

export const apiClient = axios.create({
  baseURL: API_URL,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});