import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import CandlestickBackground from '../components/CandlestickBackground';

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
    <>
      <CandlestickBackground />
      <div className="market-bg"></div>
      <div className="animated-bg"></div>
      <div className="particle-bg">{[...Array(30)].map((_, i) => <div key={i} className="particle"></div>)}</div>
      <div className="grid-overlay"></div>
      
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
      </div>
    </>
  );
}