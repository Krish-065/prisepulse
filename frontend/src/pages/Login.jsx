import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import CandlestickBackground from '../components/CandlestickBackground';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.success) navigate('/dashboard');
  };

  return (
    <>
      <CandlestickBackground />
      <div className="market-bg"></div>
      <div className="animated-bg"></div>
      <div className="particle-bg">{[...Array(30)].map((_, i) => <div key={i} className="particle"></div>)}</div>
      <div className="grid-overlay"></div>
      
      <div className="login-container">
        <div className="login-card">
          <div className="login-left">
            <div className="brand-icon-large"><svg width="40" height="40" viewBox="0 0 24 24" fill="none"><path d="M3 17L9 11L13 15L21 7" stroke="#00ff88" strokeWidth="2"/></svg></div>
            <h1>PricePulse</h1>
            <p>Professional Trading Platform with Real-time Market Data</p>
            <div className="login-features"><div>✓ Live NSE/BSE Data</div><div>✓ Advanced Charting Tools</div><div>✓ Paper Trading & Portfolio</div><div>✓ Real-time Price Alerts</div></div>
          </div>
          <div className="login-right">
            <h2>Welcome Back</h2>
            <p>Sign in to continue your trading journey</p>
            <form onSubmit={handleSubmit}>
              <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              <div className="form-options"><label><input type="checkbox" /> Remember me</label><Link to="/forgot-password">Forgot password?</Link></div>
              <button type="submit" disabled={loading}>{loading ? 'Signing in...' : 'Sign In'}</button>
            </form>
            <p className="register-link">New to PricePulse? <Link to="/register">Create Account</Link></p>
          </div>
        </div>
      </div>
    </>
  );
}