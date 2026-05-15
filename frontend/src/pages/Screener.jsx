import { useState, useEffect } from 'react';
import SearchWithSuggestions from '../components/SearchWithSuggestions';

export default function Screener() {
  const [stocks, setStocks] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const nifty50 = [
    'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK', 'HINDUNILVR', 'ITC', 'SBIN',
    'BHARTIARTL', 'KOTAKBANK', 'AXISBANK', 'LT', 'WIPRO', 'ASIANPAINT', 'HCLTECH',
    'TITAN', 'SUNPHARMA', 'MARUTI', 'BAJFINANCE', 'NESTLEIND'
  ];

  const fetchQuote = async (symbol) => {
    try {
      const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}.NS`);
      const data = await res.json();
      const meta = data.chart.result[0]?.meta;
      if (!meta) return null;
      const price = meta.regularMarketPrice;
      const prevClose = meta.previousClose;
      const change = price - prevClose;
      const changePercent = (change / prevClose) * 100;
      return { price: price.toFixed(2), change: change.toFixed(2), changePercent: changePercent.toFixed(2) };
    } catch { return null; }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const results = [];
      for (const sym of nifty50) {
        const quote = await fetchQuote(sym);
        if (quote) results.push({ symbol: sym, ...quote });
        await new Promise(r => setTimeout(r, 150));
      }
      setStocks(results);
      setFiltered(results);
      setLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    let filteredStocks = stocks;
    if (searchQuery) {
      filteredStocks = filteredStocks.filter(s => s.symbol.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    if (filter === 'gainers') {
      filteredStocks = filteredStocks.filter(s => parseFloat(s.changePercent) > 1);
    } else if (filter === 'losers') {
      filteredStocks = filteredStocks.filter(s => parseFloat(s.changePercent) < -1);
    }
    setFiltered(filteredStocks);
  }, [searchQuery, filter, stocks]);

  if (loading) return <div className="loading">Loading stocks...</div>;

  return (
    <div className="screener-container">
      <h1>Stock Screener</h1>
      <p>Filter and analyze NSE stocks</p>

      <div className="screener-controls">
        <SearchWithSuggestions
          onSelect={(stock) => setSearchQuery(stock.symbol)}
          placeholder="Search stocks by symbol..."
          className="search-input"
        />
        <div className="filter-buttons">
          <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>All</button>
          <button className={filter === 'gainers' ? 'active' : ''} onClick={() => setFilter('gainers')}>Top Gainers</button>
          <button className={filter === 'losers' ? 'active' : ''} onClick={() => setFilter('losers')}>Top Losers</button>
        </div>
      </div>

      <div className="screener-table">
        <table>
          <thead>
            <tr><th>Symbol</th><th>Price (₹)</th><th>Change (₹)</th><th>Change %</th><th>Action</th></tr>
          </thead>
          <tbody>
            {filtered.map((stock, idx) => (
              <tr key={idx}>
                <td>{stock.symbol}</td>
                <td>₹{stock.price}</td>
                <td className={stock.change >= 0 ? 'positive' : 'negative'}>{stock.change >= 0 ? '+' : ''}{stock.change}</td>
                <td className={stock.changePercent >= 0 ? 'positive' : 'negative'}>{stock.changePercent}%</td>
                <td><button className="add-btn" onClick={() => window.location.href = `/portfolio?add=${stock.symbol}`}>Add</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style>{`
        .screener-container { padding: 20px; }
        .screener-controls { display: flex; gap: 20px; margin-bottom: 24px; flex-wrap: wrap; }
        .search-input { flex: 1; padding: 10px; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 8px; color: white; }
        .filter-buttons { display: flex; gap: 12px; }
        .filter-buttons button { padding: 8px 20px; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 8px; cursor: pointer; }
        .filter-buttons button.active { background: #00ff88; color: #0a0e27; }
        .screener-table { background: var(--bg-card); border-radius: 16px; padding: 20px; overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid var(--border-color); }
        .add-btn { background: rgba(0,255,136,0.2); border: none; padding: 4px 12px; border-radius: 6px; color: #00ff88; cursor: pointer; }
        .positive { color: #00ff88; }
        .negative { color: #ff4444; }
      `}</style>
    </div>
  );
}