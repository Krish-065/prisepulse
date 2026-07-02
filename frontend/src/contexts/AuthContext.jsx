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
      delete apiClient.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const res = await apiClient.post('/auth/login', { email, password });
      if (res.data.twoFactorRequired) {
        return { success: true, twoFactorRequired: true, tempToken: res.data.tempToken };
      }
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
      const res = await apiClient.post('/auth/register', { email, password, name });
      if (res.data.requiresVerification) {
        toast.success('Registration successful. Please check your email for the OTP.');
        return { success: true, requiresVerification: true, email: res.data.email };
      }
      const { token, user } = res.data;
      localStorage.setItem('token', token);
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
      toast.success('Registration successful');
      return { success: true };
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

  const verify2FALogin = async (tempToken, token) => {
    try {
      const res = await apiClient.post('/auth/2fa/login-verify', { tempToken, token });
      const { token: jwtToken, user } = res.data;
      localStorage.setItem('token', jwtToken);
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${jwtToken}`;
      setUser(user);
      toast.success('Login successful');
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

  const updateProfile = async (profileData) => {
    try {
      const res = await apiClient.put('/user/profile', profileData);
      setUser(res.data.user);
      toast.success(res.data.message || 'Profile updated successfully');
      return { success: true };
    } catch (err) {
      toast.error(err.response?.data?.error || 'Profile update failed');
      return { success: false };
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      const res = await apiClient.post('/auth/change-password', { currentPassword, newPassword });
      toast.success(res.data.message || 'Password updated successfully');
      return { success: true };
    } catch (err) {
      toast.error(err.response?.data?.error || 'Password update failed');
      return { success: false };
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, verifyEmail, verify2FALogin, logout, updateProfile, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);