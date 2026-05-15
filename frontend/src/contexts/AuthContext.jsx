import { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async () => {
    try {
      const res = await apiClient.get('/user/profile');
      setUser(res.data);
    } catch (err) {
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const res = await apiClient.post('/auth/login', { email, password });
      const { token, user } = res.data;
      localStorage.setItem('token', token);
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
      toast.success('Login successful');
      return { success: true };
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
      return { success: false };
    }
  };

  const register = async (email, password, name) => {
    try {
      await apiClient.post('/auth/register', { email, password, name });
      toast.success('Verification code sent to email');
      return { success: true, email };
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
      return { success: false };
    }
  };

  const verifyEmail = async (email, otp) => {
    try {
      const res = await apiClient.post('/auth/verify-email', { email, otp });
      const { token, user } = res.data;
      localStorage.setItem('token', token);
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
      toast.success('Email verified');
      return { success: true };
    } catch (err) {
      toast.error(err.response?.data?.error || 'Verification failed');
      return { success: false };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete apiClient.defaults.headers.common['Authorization'];
    setUser(null);
    toast.success('Logged out');
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, verifyEmail, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);