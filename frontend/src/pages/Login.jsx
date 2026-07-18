import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import CandlestickBg from '../components/CandlestickBg';
import Logo from '../components/Logo';
import toast from 'react-hot-toast';
import { GoogleLogin } from '@react-oauth/google';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');

  const { login, verify2FALogin, googleLogin } = useAuth();
  const navigate = useNavigate();

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    const result = await googleLogin(credentialResponse.credential);
    setLoading(false);
    if (result.success) {
      navigate('/dashboard');
    }
  };

  const handleGoogleError = () => {
    toast.error('Google Sign-In failed');
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    
    if (result.success) {
      if (result.twoFactorRequired) {
        setTempToken(result.tempToken);
        setTwoFactorRequired(true);
        toast.success('Credentials verified. Please enter your 2FA code.');
      } else {
        navigate('/dashboard');
      }
    }
  };

  const handleTwoFactorSubmit = async (e) => {
    e.preventDefault();
    if (!twoFactorCode || twoFactorCode.length !== 6) {
      return toast.error('Please enter a valid 6-digit code');
    }
    setLoading(true);
    const result = await verify2FALogin(tempToken, twoFactorCode);
    setLoading(false);
    if (result.success) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="auth-container">
      <CandlestickBg />
      
      {!twoFactorRequired ? (
        <div className="auth-card" style={{ animation: 'fadeIn 0.5s ease', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ marginBottom: '24px' }}>
            <Logo size={60} showName={true} showTagline={true} alignment="column" nameSize="26px" />
          </div>

          <h2 style={{ fontSize: '22px', fontWeight: '800', backgroundImage: 'linear-gradient(135deg, #00ff88, #00bcd4)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent', color: 'transparent', marginBottom: '8px', marginTop: '0' }}>Welcome Back</h2>
          <p style={{ color: '#9b9eac', fontSize: '13px', marginBottom: '24px', textAlign: 'center', marginTop: '0' }}>Sign in to continue to NonStock</p>
          <form onSubmit={handleLoginSubmit} style={{ width: '100%' }}>
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <button type="submit" disabled={loading} style={{ background: 'linear-gradient(135deg, #00ff88, #00bcd4)', border: 'none', color: '#0a0e27', padding: '14px', borderRadius: '10px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s', width: '100%' }}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div style={{ margin: '18px 0', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255,255,255,0.08)' }}></div>
            <span style={{ margin: '0 10px', color: '#9b9eac', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>or</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255,255,255,0.08)' }}></div>
          </div>
          
          <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              theme="filled_dark"
              shape="pill"
              text="signin_with"
            />
          </div>

          <p style={{ marginTop: '16px', color: '#9b9eac' }}>Don't have an account? <Link to="/register" style={{ color: '#00ff88', textDecoration: 'none', fontWeight: '600' }}>Register</Link></p>
          <p style={{ marginTop: '10px' }}><Link to="/forgot-password" style={{ color: '#00bcd4', textDecoration: 'none', fontSize: '13px' }}>Forgot Password?</Link></p>
        </div>
      ) : (
        <div className="auth-card" style={{ animation: 'fadeIn 0.5s ease', border: '1px solid rgba(0, 255, 136, 0.4)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ marginBottom: '24px' }}>
            <Logo size={60} showName={true} showTagline={true} alignment="column" nameSize="26px" />
          </div>

          <h2 style={{ fontSize: '22px', fontWeight: '800', backgroundImage: 'linear-gradient(135deg, #00ff88, #00bcd4)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent', color: 'transparent', marginBottom: '8px', marginTop: '0' }}>2FA Verification</h2>
          <p style={{ color: '#9b9eac', fontSize: '13px', marginBottom: '24px', textAlign: 'center', marginTop: '0', lineHeight: '1.5' }}>
            Enter the 6-digit code from your <br />
            <strong style={{ color: '#ffffff' }}>Google Authenticator</strong> app.
          </p>
          
          <form onSubmit={handleTwoFactorSubmit} style={{ width: '100%' }}>
            <input 
              type="text" 
              placeholder="000000" 
              value={twoFactorCode} 
              onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
              style={{ textAlign: 'center', letterSpacing: '8px', fontSize: '24px', fontWeight: 'bold', padding: '14px', width: '100%', boxSizing: 'border-box' }}
              required 
            />
            <button type="submit" disabled={loading} style={{ background: 'linear-gradient(135deg, #00ff88, #00bcd4)', border: 'none', color: '#0a0e27', padding: '14px', borderRadius: '10px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s', marginTop: '10px', width: '100%' }}>
              {loading ? 'Verifying...' : 'Verify & Login'}
            </button>
          </form>
          
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <button 
              type="button" 
              onClick={() => setTwoFactorRequired(false)} 
              style={{ background: 'none', border: 'none', color: '#9b9eac', textDecoration: 'underline', cursor: 'pointer', fontSize: '13px' }}
            >
              Back to Login
            </button>
          </div>
        </div>
      )}
    </div>
  );
}