import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import CandlestickBg from '../components/CandlestickBg';
import Logo from '../components/Logo';
import { AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { GoogleLogin } from '@react-oauth/google';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [requiresVerification, setRequiresVerification] = useState(false);
  const [otp, setOtp] = useState('');

  const { register, verifyEmail, googleLogin } = useAuth();
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

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    loading; // placeholder
    setLoading(true);
    const result = await register(email, password, name);
    setLoading(false);
    if (result.success) {
      if (result.requiresVerification) {
        setRequiresVerification(true);
      } else {
        navigate('/dashboard');
      }
    }
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = await verifyEmail(email, otp);
    setLoading(false);
    if (result.success) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="auth-container">
      <CandlestickBg />
      
      <div className="auth-card" style={{ animation: 'fadeIn 0.5s ease', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ marginBottom: '24px' }}>
          <Logo size={60} showName={true} showTagline={true} alignment="column" nameSize="26px" />
        </div>

        <h2 style={{ fontSize: '22px', fontWeight: '800', backgroundImage: 'linear-gradient(135deg, #00ff88, #00bcd4)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent', color: 'transparent', marginBottom: '8px', marginTop: '0' }}>
          {requiresVerification ? 'Verify Email' : 'Create Account'}
        </h2>
        <p style={{ color: '#9b9eac', fontSize: '13px', marginBottom: '24px', textAlign: 'center', marginTop: '0' }}>
          {requiresVerification ? 'Enter the OTP sent to your email' : 'Get started with NonStock'}
        </p>
        
        {!requiresVerification ? (
          <form onSubmit={handleRegisterSubmit} style={{ width: '100%' }}>
            <input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} required />
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <p style={{ fontSize: '11px', marginTop: '-12px', marginBottom: '20px', color: '#9b9eac', textAlign: 'left', lineHeight: '1.4', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
              <AlertCircle size={14} style={{ color: '#00bcd4', flexShrink: 0, marginTop: '2px' }} />
              <span>Password must be 8+ characters, with at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&amp;).</span>
            </p>
            <button type="submit" disabled={loading} style={{ background: 'linear-gradient(135deg, #00ff88, #00bcd4)', border: 'none', color: '#0a0e27', padding: '14px', borderRadius: '10px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', transition: 'transform 0.2s, box-shadow 0.2s', width: '100%' }}>
              {loading ? 'Creating Account...' : 'Register'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifySubmit} style={{ width: '100%' }}>
            <input type="text" placeholder="Enter OTP" value={otp} onChange={(e) => setOtp(e.target.value)} required style={{ letterSpacing: '4px', textAlign: 'center', fontSize: '18px', fontWeight: 'bold' }} />
            <button type="submit" disabled={loading} style={{ background: 'linear-gradient(135deg, #00ff88, #00bcd4)', border: 'none', color: '#0a0e27', padding: '14px', borderRadius: '10px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', transition: 'transform 0.2s, box-shadow 0.2s', width: '100%' }}>
              {loading ? 'Verifying...' : 'Verify Email'}
            </button>
          </form>
        )}
        
        {!requiresVerification && (
          <>
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
                text="signup_with"
              />
            </div>

            <p style={{ marginTop: '16px', color: '#9b9eac' }}>Already have an account? <Link to="/login" style={{ color: '#00ff88', textDecoration: 'none', fontWeight: '600' }}>Login</Link></p>
          </>
        )}
      </div>
    </div>
  );
}