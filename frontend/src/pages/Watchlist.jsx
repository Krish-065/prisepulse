import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../services/api';
import SearchWithSuggestions from '../components/SearchWithSuggestions';

export default function Watchlist() {
  const { user, logout } = useAuth();
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);

  // Direct fetch from Yahoo Finance
  const fetchYahooQuote = async (symbol) => {
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}.NS`;
      const res = await fetch(url);
      const data = await res.json();
      const meta = data.chart.result[0]?.meta;
      if (!meta) return null;
      const price = meta.regularMarketPrice;
      const prevClose = meta.previousClose;
      const change = price - prevClose;
      const changePercent = (change / prevClose) * 100;
      return { price, change, changePercent };
    } catch (err) {
      console.error(`Yahoo error for ${symbol}:`, err);
      return null;
    }
  };

  const fetchWatchlist = async () => {
    try {
      const res = await apiClient.get('/watchlist');
      const items = res.data.watchlist || [];
      if (items.length === 0) {
        setWatchlist([]);
        setLoading(false);
        return;
      }
      const enriched = [];
      for (const item of items) {
        const quote = await fetchYahooQuote(item.symbol);
        if (quote) {
          enriched.push({
            symbol: item.symbol,
            price: quote.price.toFixed(2),
            change: quote.change.toFixed(2),
            changePercent: quote.changePercent.toFixed(2),
            up: quote.change >= 0
          });
        } else {
          enriched.push({ symbol: item.symbol, price: '--', change: '0', changePercent: '0', up: true });
        }
      }
      setWatchlist(enriched);
    } catch (err) {
      console.error('Error fetching watchlist:', err);
    } finally {
      setLoading(false);
    }
  };

  const addToWatchlist = async (symbol) => {
    try {
      await apiClient.post('/watchlist', { symbol });
      alert(`✅ ${symbol} added`);
      fetchWatchlist();
    } catch (err) {
      alert('Error adding stock');
    }
  };

  const removeFromWatchlist = async (symbol) => {
    try {
      await apiClient.delete(`/watchlist/${symbol}`);
      fetchWatchlist();
    } catch (err) {
      alert('Error removing stock');
    }
  };

  useEffect(() => {
    fetchWatchlist();
  }, []);

  return (
    <div className="watchlist-page">
      <h1>Your Watchlist</h1>
      <p>Track your favorite stocks in real-time</p>

      <div className="search-section">
        <SearchWithSuggestions onSelect={(stock) => addToWatchlist(stock.symbol)} placeholder="Search stocks by name or symbol..." className="search-input" />
      </div>

      {loading ? (
        <div className="loading">Loading...</div>
      ) : watchlist.length === 0 ? (
        <div className="empty-watchlist">
          <div className="empty-icon">📋</div>
          <h3>Your watchlist is empty</h3>
          <p>Search and add stocks to track them here</p>
          <div className="example-stocks">
            <button onClick={() => addToWatchlist('RELIANCE')}>RELIANCE</button>
            <button onClick={() => addToWatchlist('TCS')}>TCS</button>
            <button onClick={() => addToWatchlist('INFY')}>INFY</button>
            <button onClick={() => addToWatchlist('HDFCBANK')}>HDFC BANK</button>
          </div>
        </div>
      ) : (
        <div className="watchlist-table">
          <table>
            <thead><tr><th>Symbol</th><th>LTP (₹)</th><th>Change (₹)</th><th>Change %</th><th>Action</th></tr></thead>
            <tbody>
              {watchlist.map((stock, idx) => (
                <tr key={idx}>
                  <td>{stock.symbol}</td>
                  <td>₹{stock.price}</td>
                  <td className={stock.up ? 'positive' : 'negative'}>{stock.change >= 0 ? '+' : ''}{stock.change}</td>
                  <td className={stock.up ? 'positive' : 'negative'}>{stock.changePercent}%</td>
                  <td><button className="remove-btn" onClick={() => removeFromWatchlist(stock.symbol)}>Remove</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <style>{`
        .watchlist-page { padding: 20px; }
        .search-section { margin-bottom: 24px; max-width: 500px; }
        .search-input { width: 100%; padding: 12px; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 8px; color: white; }
        .watchlist-table { background: var(--bg-card); border-radius: 16px; padding: 20px; overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid var(--border-color); }
        .remove-btn { background: rgba(255,68,68,0.2); border: none; padding: 4px 12px; border-radius: 6px; color: #ff4444; cursor: pointer; }
        .empty-watchlist { text-align: center; padding: 60px; }
        .example-stocks { display: flex; gap: 10px; justify-content: center; margin-top: 20px; }
        .example-stocks button { background: var(--bg-elevated); border: 1px solid var(--border-color); padding: 8px 16px; border-radius: 8px; cursor: pointer; }
      `}</style>
    </div>
  );
}