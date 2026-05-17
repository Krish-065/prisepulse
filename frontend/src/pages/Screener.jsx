import { useState, useEffect } from 'react';
import SearchWithSuggestions from '../components/SearchWithSuggestions';

export default function Screener() {
  const [stocks, setStocks] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchStocks = async () => {
      try {
        const { apiClient } = await import('../services/api');
        const res = await apiClient.get('/market/stock-list');
        setStocks(res.data || []);
        setFiltered(res.data || []);
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    fetchStocks();
  }, []);

  useEffect(() => {
    let filteredStocks = stocks;
    if (search) filteredStocks = filteredStocks.filter(s => s.symbol.toLowerCase().includes(search.toLowerCase()));
    if (filter === 'gainers') filteredStocks = filteredStocks.filter(s => parseFloat(s.changePercent) > 1);
    if (filter === 'losers') filteredStocks = filteredStocks.filter(s => parseFloat(s.changePercent) < -1);
    setFiltered(filteredStocks);
  }, [search, filter, stocks]);

  if (loading) return <div>Loading screener...</div>;

  return (
    <div>
      <h1>Stock Screener</h1>
      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
        <SearchWithSuggestions onSelect={(stock) => setSearch(stock.symbol)} placeholder="Search symbol..." className="global-search" style={{ maxWidth: '300px' }} />
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setFilter('all')} className={filter === 'all' ? 'active-filter' : ''}>All</button>
          <button onClick={() => setFilter('gainers')} className={filter === 'gainers' ? 'active-filter' : ''}>Top Gainers</button>
          <button onClick={() => setFilter('losers')} className={filter === 'losers' ? 'active-filter' : ''}>Top Losers</button>
        </div>
      </div>
      <div className="screener-table">
        <table>
          <thead><tr><th>Symbol</th><th>Price (₹)</th><th>Change (₹)</th><th>Change %</th></tr></thead>
          <tbody>{filtered.map(s => <tr key={s.symbol}><td>{s.symbol}</td><td>₹{s.price}</td><td className={s.change>=0?'positive':'negative'}>{s.change}</td><td className={s.changePercent>=0?'positive':'negative'}>{s.changePercent}%</td></tr>)}</tbody>
        </table>
      </div>
      <style>{`.active-filter { background: #00ff88; color: #0a0e27; border-color: transparent; } button { background: #1e222d; border: 1px solid #2a2e39; padding: 6px 12px; border-radius: 8px; cursor: pointer; }`}</style>
    </div>
  );
}