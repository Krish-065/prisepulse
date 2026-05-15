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
    if (result.success) navigate('/');
  };

  return (
    <>
      <div className="market-bg"></div>
      <div className="animated-bg"></div>
      <div className="particle-bg">{[...Array(30)].map((_, i) => <div key={i} className="particle"></div>)}</div>
      <div className="grid-overlay"></div>
      <div className="candlestick-pattern"></div>
      <CandlestickBackground />
      
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
      
      <style>{`
        .login-container { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; position: relative; z-index: 1; }
        .login-card { display: grid; grid-template-columns: 1fr 1fr; max-width: 1000px; width: 100%; background: rgba(19, 23, 34, 0.95); backdrop-filter: blur(20px); border-radius: 24px; overflow: hidden; border: 1px solid rgba(0, 255, 136, 0.2); }
        .login-left { padding: 48px; background: linear-gradient(135deg, rgba(0, 255, 136, 0.05), rgba(0, 188, 212, 0.05)); }
        .brand-icon-large { width: 60px; height: 60px; background: linear-gradient(135deg, #00ff88, #00bcd4); border-radius: 16px; display: flex; align-items: center; justify-content: center; margin-bottom: 24px; }
        .login-left h1 { font-size: 32px; margin-bottom: 12px; background: linear-gradient(135deg, #fff, #00ff88); -webkit-background-clip: text; background-clip: text; color: transparent; }
        .login-left p { color: #787b86; line-height: 1.6; margin-bottom: 32px; }
        .login-features { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
        .login-features div { font-size: 13px; color: #d1d4dc; }
        .login-right { padding: 48px; }
        .login-right h2 { font-size: 28px; margin-bottom: 8px; }
        .login-right p { color: #787b86; margin-bottom: 32px; }
        .login-right input { width: 100%; padding: 12px 16px; background: rgba(10, 14, 39, 0.8); border: 1px solid rgba(0, 255, 136, 0.2); border-radius: 10px; color: white; margin-bottom: 16px; }
        .login-right input:focus { outline: none; border-color: #00ff88; }
        .form-options { display: flex; justify-content: space-between; margin-bottom: 24px; font-size: 13px; color: #787b86; }
        .login-right button { width: 100%; padding: 12px; background: linear-gradient(135deg, #00ff88, #00bcd4); border: none; border-radius: 10px; color: #0a0e27; font-weight: 700; cursor: pointer; }
        .register-link { text-align: center; margin-top: 24px; font-size: 13px; color: #787b86; }
        .register-link a { color: #00ff88; text-decoration: none; }
        @media (max-width: 800px) { .login-card { grid-template-columns: 1fr; } .login-left { display: none; } }
      `}</style>
    </>
  );
}