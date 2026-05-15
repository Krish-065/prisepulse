import { useState, useEffect } from 'react';
import { apiClient } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export default function TwoFactorSetup() {
  const { user } = useAuth();
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [token, setToken] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    apiClient.get('/auth/2fa/setup').then(res => {
      setQrCode(res.data.qrCode);
      setSecret(res.data.secret);
    });
  }, []);

  const verifyAndEnable = async () => {
    try {
      await apiClient.post('/auth/2fa/verify', { token });
      setMessage('✅ 2FA enabled successfully!');
    } catch (err) {
      setMessage('❌ Invalid code. Try again.');
    }
  };

  return (
    <div className="twofa-container">
      <h2>Set up Google Authenticator</h2>
      <img src={qrCode} alt="QR Code" />
      <p>Secret: <strong>{secret}</strong></p>
      <input type="text" placeholder="Enter 6-digit code" value={token} onChange={e => setToken(e.target.value)} />
      <button onClick={verifyAndEnable}>Enable 2FA</button>
      {message && <p>{message}</p>}
    </div>
  );
}