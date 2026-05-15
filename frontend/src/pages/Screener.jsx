import { useState, useEffect } from 'react';
import SearchWithSuggestions from '../components/SearchWithSuggestions';

export default function Screener() {
  const [stocks, setStocks] = useState([]);
  const [filteredStocks, setFilteredStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Popular NIFTY 50 stocks – using direct Yahoo Finance API
  const nifty50Symbols = [
    'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK',
    'HINDUNILVR', 'ITC', 'SBIN', 'BHARTIARTL', 'KOTAKBANK',
    'AXISBANK', 'LT', 'WIPRO', 'ASIANPAINT', 'HCLTECH',
    'TITAN', 'SUNPHARMA', 'MARUTI', 'BAJFINANCE', 'NESTLEIND'
  ];

  // Function to fetch a single stock quote from Yahoo Finance
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

  // Load all stocks on mount
  useEffect(() => {
    const fetchAllStocks = async () => {
      setLoading(true);
      const results = [];
      for (const sym of nifty50Symbols) {
        const quote = await fetchYahooQuote(sym);
        if (quote) {
          results.push({
            symbol: sym,
            price: quote.price.toFixed(2),
            change: quote.change.toFixed(2),
            changePercent: quote.changePercent.toFixed(2)
          });
        } else {
          // fallback data
          results.push({
            symbol: sym,
            price: '--',
            change: '0',
            changePercent: '0'
          });
        }
        // Small delay to avoid rate limiting
        await new Promise(r => setTimeout(r, 100));
      }
      setStocks(results);
      setFilteredStocks(results);
      setLoading(false);
    };
    fetchAllStocks();
  }, []);

  // Apply filters and search
  useEffect(() => {
    let filtered = [...stocks];
    if (searchQuery) {
      filtered = filtered.filter(s =>
        s.symbol.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (filter === 'gainers') {
      filtered = filtered.filter(s => parseFloat(s.changePercent) > 1);
    } else if (filter === 'losers') {
      filtered = filtered.filter(s => parseFloat(s.changePercent) < -1);
    }
    setFilteredStocks(filtered);
  }, [searchQuery, filter, stocks]);

  if (loading) {
    return <div className="screener-loading">Loading stocks...</div>;
  }

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
            <tr>
              <th>Symbol</th>
              <th>Price (₹)</th>
              <th>Change (₹)</th>
              <th>Change %</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredStocks.map((stock, idx) => (
              <tr key={idx}>
                <td className="symbol">{stock.symbol}</td>
                <td>₹{stock.price}</td>
                <td className={stock.change >= 0 ? 'positive' : 'negative'}>
                  {stock.change >= 0 ? '+' : ''}{stock.change}
                </td>
                <td className={stock.changePercent >= 0 ? 'positive' : 'negative'}>
                  {stock.changePercent}%
                </td>
                <td>
                  <button
                    className="add-btn"
                    onClick={() => {
                      // Navigate to portfolio with query param
                      window.location.href = `/portfolio?add=${stock.symbol}`;
                    }}
                  >
                    Add to Portfolio
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style>{`
        .screener-container { padding: 20px; max-width: 1400px; margin: 0 auto; }
        .screener-controls { display: flex; gap: 20px; margin-bottom: 24px; flex-wrap: wrap; align-items: center; }
        .search-input { flex: 1; min-width: 200px; padding: 10px 16px; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 8px; color: white; }
        .filter-buttons { display: flex; gap: 12px; flex-wrap: wrap; }
        .filter-buttons button { padding: 8px 20px; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 8px; cursor: pointer; color: var(--text-primary); transition: 0.2s; }
        .filter-buttons button.active { background: #00ff88; color: #0a0e27; border-color: #00ff88; }
        .screener-table { background: var(--bg-card); border-radius: 16px; padding: 20px; overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid var(--border-color); }
        .symbol { font-weight: 600; }
        .positive { color: #00ff88; }
        .negative { color: #ff4444; }
        .add-btn { background: rgba(0,255,136,0.15); border: none; padding: 6px 14px; border-radius: 6px; color: #00ff88; cursor: pointer; font-size: 12px; transition: 0.2s; }
        .add-btn:hover { background: #00ff88; color: #0a0e27; }
        .screener-loading { display: flex; justify-content: center; align-items: center; height: 300px; font-size: 18px; }
        @media (max-width: 768px) { .screener-controls { flex-direction: column; align-items: stretch; } }
      `}</style>
    </div>
  );
}