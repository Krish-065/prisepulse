import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const response = await axios.get(`${API_URL}/user/profile`);
      setUser(response.data);
    } catch (error) {
      localStorage.removeItem('token');
      setToken(null);
      delete axios.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

const login = async (email, password) => {
  try {
    const response = await apiClient.post('/auth/login', { email, password });
    const { token, user } = response.data;
    localStorage.setItem('token', token);
    setToken(token);
    setUser(user);
    toast.success('Login successful!');
    navigate('/dashboard');  // ← redirect to dashboard
    return { success: true };
  } catch (error) {
    toast.error(error.response?.data?.error || 'Login failed');
    return { success: false };
  }
};

  const register = async (email, password, name) => {
    try {
      await axios.post(`${API_URL}/auth/register`, { email, password, name });
      toast.success('Verification code sent to your email');
      return { success: true, email };
    } catch (error) {
      toast.error(error.response?.data?.error || 'Registration failed');
      return { success: false };
    }
  };

  const verifyEmail = async (email, otp) => {
    try {
      const response = await axios.post(`${API_URL}/auth/verify-email`, { email, otp });
      const { token, user } = response.data;

      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setToken(token);
      setUser(user);
      toast.success('Email verified! Welcome to PricePulse.');
      return { success: true };
    } catch (error) {
      toast.error(error.response?.data?.error || 'Verification failed');
      return { success: false };
    }
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    toast.success('Logged out');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, verifyEmail, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}