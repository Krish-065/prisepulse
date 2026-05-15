import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/auth/reset-password`, { email, token, newPassword: password });
      setMessage(res.data.message);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-container">
      <div className="reset-card">
        <h2>Create New Password</h2>
        <form onSubmit={handleSubmit}>
          <input type="password" placeholder="New Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <input type="password" placeholder="Confirm Password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
          <button type="submit" disabled={loading}>{loading ? 'Resetting...' : 'Reset Password'}</button>
          {message && <p className="success">{message}</p>}
          {error && <p className="error">{error}</p>}
        </form>
      </div>
      <style>{`
        .reset-container { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--bg-primary); }
        .reset-card { background: var(--bg-card); border-radius: 16px; padding: 40px; width: 100%; max-width: 450px; }
        input { width: 100%; padding: 12px; margin-bottom: 16px; background: var(--bg-elevated); border: 1px solid var(--border-color); border-radius: 8px; color: white; }
        button { width: 100%; padding: 12px; background: linear-gradient(135deg, #00ff88, #00bcd4); border: none; border-radius: 8px; font-weight: 700; cursor: pointer; }
        .success { color: #00ff88; margin-top: 12px; }
        .error { color: #ff4444; margin-top: 12px; }
      `}</style>
    </div>
  );
}