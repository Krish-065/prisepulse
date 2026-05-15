import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import CandlestickBackground from '../components/CandlestickBackground';

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
    if (result.success) navigate('/dashboard');
  };

  return (
    <>
      <CandlestickBackground />
      <div className="market-bg"></div>
      <div className="animated-bg"></div>
      <div className="particle-bg">{[...Array(30)].map((_, i) => <div key={i} className="particle"></div>)}</div>
      <div className="grid-overlay"></div>
      
      <div className="register-container">
        <div className="register-card">
          <div className="register-header">
            <div className="brand-icon-small"><svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M3 17L9 11L13 15L21 7" stroke="#00ff88" strokeWidth="2"/></svg></div>
            <h2>{step === 'register' ? 'Create Account' : 'Verify Email'}</h2>
            <p>{step === 'register' ? 'Start your professional trading journey' : `Enter code sent to ${email}`}</p>
          </div>
          
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
    </>
  );
}