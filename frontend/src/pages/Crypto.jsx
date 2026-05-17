import { useState, useEffect } from 'react';
import { apiClient } from '../services/api';

export default function Crypto() {
  const [crypto, setCrypto] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCrypto = async () => {
      try {
        const res = await apiClient.get('/market/crypto');
        setCrypto(res.data);
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    fetchCrypto();
    const interval = setInterval(fetchCrypto, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div>Loading crypto...</div>;

  return (
    <div>
      <h1>Cryptocurrency</h1>
      <div className="crypto-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
        {crypto.map(coin => (
          <div key={coin.symbol} className="index-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            {coin.image && <img src={coin.image} alt={coin.name} style={{ width: '48px', height: '48px', borderRadius: '50%' }} />}
            <div className="crypto-symbol" style={{ fontWeight: 'bold', fontSize: '18px' }}>{coin.name}</div>
            <div className="crypto-name" style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{coin.symbol}</div>
            <div className="crypto-price" style={{ fontSize: '20px', marginTop: '8px' }}>₹{coin.price}</div>
            <div className={`crypto-change ${coin.up ? 'positive' : 'negative'}`}>{coin.up ? '+' : ''}{coin.change}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}