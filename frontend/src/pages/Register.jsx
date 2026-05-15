import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Register() {
  const [step, setStep] = useState('register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, verifyEmail } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    if (password.length < 8) { alert('Password must be at least 8 characters'); return; }
    setLoading(true);
    const result = await register(email, password, name);
    setLoading(false);
    if (result.success) setStep('verify');
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = await verifyEmail(email, otp);
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
      
      <div className="register-container">
        <div className="register-card">
          <div className="register-header"><div className="brand-icon-small"><svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M3 17L9 11L13 15L21 7" stroke="#00ff88" strokeWidth="2"/></svg></div><h2>{step === 'register' ? 'Create Account' : 'Verify Email'}</h2><p>{step === 'register' ? 'Start your professional trading journey' : `Enter code sent to ${email}`}</p></div>
          
          {step === 'register' ? (
            <form onSubmit={handleRegister}>
              <input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} required />
              <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              <p className="password-hint">Must contain 8+ chars with uppercase, lowercase, number & special character</p>
              <button type="submit" disabled={loading}>{loading ? 'Sending OTP...' : 'Create Account'}</button>
            </form>
          ) : (
            <form onSubmit={handleVerify}>
              <input type="text" placeholder="Enter 6-digit OTP" maxLength="6" value={otp} onChange={(e) => setOtp(e.target.value)} className="otp-input" required />
              <button type="submit" disabled={loading}>{loading ? 'Verifying...' : 'Verify & Continue'}</button>
            </form>
          )}
          <p className="login-link">{step === 'register' ? 'Already have an account?' : 'Back to'} <Link to="/login">Sign In</Link></p>
        </div>
      </div>
      
      <style>{`
        .register-container { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; position: relative; z-index: 1; }
        .register-card { max-width: 450px; width: 100%; background: rgba(19, 23, 34, 0.95); backdrop-filter: blur(20px); border-radius: 24px; padding: 40px; border: 1px solid rgba(0, 255, 136, 0.2); }
        .register-header { text-align: center; margin-bottom: 32px; }
        .brand-icon-small { width: 50px; height: 50px; background: linear-gradient(135deg, #00ff88, #00bcd4); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; }
        .register-header h2 { font-size: 24px; margin-bottom: 8px; }
        .register-header p { color: #787b86; font-size: 14px; }
        .register-card input { width: 100%; padding: 12px 16px; background: rgba(10, 14, 39, 0.8); border: 1px solid rgba(0, 255, 136, 0.2); border-radius: 10px; color: white; margin-bottom: 16px; }
        .register-card input:focus { outline: none; border-color: #00ff88; }
        .otp-input { text-align: center; font-size: 24px; letter-spacing: 8px; font-family: monospace; }
        .password-hint { font-size: 11px; color: #787b86; margin-top: -12px; margin-bottom: 16px; }
        .register-card button { width: 100%; padding: 12px; background: linear-gradient(135deg, #00ff88, #00bcd4); border: none; border-radius: 10px; color: #0a0e27; font-weight: 700; cursor: pointer; }
        .login-link { text-align: center; margin-top: 24px; font-size: 13px; color: #787b86; }
        .login-link a { color: #00ff88; text-decoration: none; }
      `}</style>
    </>
  );
}