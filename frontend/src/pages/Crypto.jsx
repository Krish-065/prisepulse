import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Crypto() {
  const [cryptos, setCryptos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCrypto = async () => {
      try {
        const res = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
          params: {
            vs_currency: 'inr',
            order: 'market_cap_desc',
            per_page: 50,
            page: 1,
            sparkline: false
          }
        });
        setCryptos(res.data);
      } catch (err) {
        console.error('Crypto error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCrypto();
    const interval = setInterval(fetchCrypto, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="loading">Loading crypto data...</div>;

  return (
    <div className="crypto-page">
      <h1>Cryptocurrency</h1>
      <p>Live prices of top 50 cryptocurrencies in INR</p>
      <div className="crypto-table">
        <table>
          <thead>
            <tr><th>#</th><th>Coin</th><th>Price (₹)</th><th>24h Change</th><th>Market Cap</th><th>Volume</th></tr>
          </thead>
          <tbody>
            {cryptos.map((coin, idx) => (
              <tr key={coin.id}>
                <td>{idx + 1}</td>
                <td><img src={coin.image} alt={coin.name} width="24" style={{ verticalAlign: 'middle', marginRight: '8px' }} />{coin.name} ({coin.symbol.toUpperCase()})</td>
                <td>₹{coin.current_price?.toLocaleString()}</td>
                <td className={coin.price_change_percentage_24h >= 0 ? 'positive' : 'negative'}>{coin.price_change_percentage_24h?.toFixed(2)}%</td>
                <td>₹{coin.market_cap?.toLocaleString()}</td>
                <td>₹{coin.total_volume?.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <style>{`
        .crypto-page { padding: 20px; }
        .crypto-table { background: var(--bg-card); border-radius: 16px; padding: 20px; overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid var(--border-color); }
        .positive { color: #00ff88; }
        .negative { color: #ff4444; }
      `}</style>
    </div>
  );
}