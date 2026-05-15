import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await axios.post(`${API_URL}/auth/forgot-password`, { email });
      setMessage(res.data.message || 'Reset link sent to your email');
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-container">
      <div className="forgot-card">
        <div className="forgot-header">
          <h2>Reset Password</h2>
          <p>Enter your email to receive a password reset link</p>
        </div>
        {!sent ? (
          <form onSubmit={handleSubmit}>
            <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <button type="submit" disabled={loading}>{loading ? 'Sending...' : 'Send Reset Link'}</button>
            {error && <p className="error">{error}</p>}
          </form>
        ) : (
          <div className="success-message">
            <p>✅ {message}</p>
            <p>Check your email inbox (and spam folder).</p>
            <Link to="/login">Back to Login</Link>
          </div>
        )}
        <div className="back-link">
          <Link to="/login">← Back to Login</Link>
        </div>
      </div>
      <style>{`
        .forgot-container { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--bg-primary); }
        .forgot-card { background: var(--bg-card); border-radius: 16px; padding: 40px; width: 100%; max-width: 450px; border: 1px solid var(--border-color); }
        .forgot-header { text-align: center; margin-bottom: 32px; }
        h2 { margin-bottom: 8px; }
        input { width: 100%; padding: 12px; margin-bottom: 16px; background: var(--bg-elevated); border: 1px solid var(--border-color); border-radius: 8px; color: white; }
        button { width: 100%; padding: 12px; background: linear-gradient(135deg, #00ff88, #00bcd4); border: none; border-radius: 8px; font-weight: 700; cursor: pointer; }
        .error { color: #ff4444; margin-top: 12px; text-align: center; }
        .back-link { text-align: center; margin-top: 24px; }
        a { color: #00ff88; text-decoration: none; }
      `}</style>
    </div>
  );
}