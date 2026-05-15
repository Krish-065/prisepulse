import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../services/api';
import SearchWithSuggestions from '../components/SearchWithSuggestions';

export default function Dashboard() {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [indices, setIndices] = useState({
    nifty: { value: '--', change: '--', percent: '--', up: true },
    sensex: { value: '--', change: '--', percent: '--', up: true },
    banknifty: { value: '--', change: '--', percent: '--', up: true },
    niftyit: { value: '--', change: '--', percent: '--', up: true },
  });
  const [topGainers, setTopGainers] = useState([]);
  const [topLosers, setTopLosers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Direct Yahoo Finance fetch (bypass backend for reliability)
  const fetchYahooQuote = async (symbol) => {
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;
      const res = await fetch(url);
      const data = await res.json();
      const meta = data.chart.result[0]?.meta;
      if (!meta) return null;
      const price = meta.regularMarketPrice;
      const prevClose = meta.previousClose;
      const change = price - prevClose;
      const percent = (change / prevClose) * 100;
      return { price, change, percent };
    } catch (err) {
      console.error(`Yahoo error for ${symbol}:`, err);
      return null;
    }
  };

  const fetchIndices = async () => {
    const nifty = await fetchYahooQuote('^NSEI');
    const sensex = await fetchYahooQuote('^BSESN');
    const banknifty = await fetchYahooQuote('^NSEBANK');
    const niftyit = await fetchYahooQuote('^NSEIT');
    setIndices({
      nifty: { value: nifty?.price?.toFixed(2) || '--', change: nifty?.change?.toFixed(2) || '--', percent: nifty?.percent?.toFixed(2) || '--', up: (nifty?.change || 0) >= 0 },
      sensex: { value: sensex?.price?.toFixed(2) || '--', change: sensex?.change?.toFixed(2) || '--', percent: sensex?.percent?.toFixed(2) || '--', up: (sensex?.change || 0) >= 0 },
      banknifty: { value: banknifty?.price?.toFixed(2) || '--', change: banknifty?.change?.toFixed(2) || '--', percent: banknifty?.percent?.toFixed(2) || '--', up: (banknifty?.change || 0) >= 0 },
      niftyit: { value: niftyit?.price?.toFixed(2) || '--', change: niftyit?.change?.toFixed(2) || '--', percent: niftyit?.percent?.toFixed(2) || '--', up: (niftyit?.change || 0) >= 0 },
    });
  };

  const fetchTopMovers = async () => {
    const symbols = ['RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'INFY.NS', 'ICICIBANK.NS', 'HINDUNILVR.NS', 'ITC.NS', 'SBIN.NS', 'BHARTIARTL.NS', 'KOTAKBANK.NS', 'AXISBANK.NS', 'LT.NS', 'WIPRO.NS', 'ASIANPAINT.NS', 'HCLTECH.NS', 'TITAN.NS', 'SUNPHARMA.NS', 'MARUTI.NS', 'BAJFINANCE.NS', 'NESTLEIND.NS'];
    const stocks = [];
    for (const sym of symbols) {
      const quote = await fetchYahooQuote(sym);
      if (quote && quote.price) {
        stocks.push({
          symbol: sym.replace('.NS', ''),
          price: quote.price.toFixed(2),
          changePercent: quote.percent.toFixed(2)
        });
      }
      await new Promise(r => setTimeout(r, 150));
    }
    const gainers = [...stocks].sort((a,b) => b.changePercent - a.changePercent).slice(0, 10);
    const losers = [...stocks].sort((a,b) => a.changePercent - b.changePercent).slice(0, 10);
    setTopGainers(gainers);
    setTopLosers(losers);
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchIndices();
      await fetchTopMovers();
      setLoading(false);
    };
    load();
    const interval = setInterval(() => {
      fetchIndices();
      fetchTopMovers();
    }, 15000);
    const timeInt = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => { clearInterval(interval); clearInterval(timeInt); };
  }, []);

  const marketStatus = () => {
    const now = new Date();
    const day = now.getDay();
    const hour = now.getHours();
    if (day === 0 || day === 6) return 'Market Closed';
    if (hour >= 9 && hour < 15) return 'Market Open';
    return 'Market Closed';
  };

  if (loading) return <div className="loading">Loading market data...</div>;

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1>Hello, {user?.name?.split(' ')[0]} 👋</h1>
          <p>{currentTime.toLocaleDateString('en-IN', { weekday:'long', year:'numeric', month:'long', day:'numeric' })} | {currentTime.toLocaleTimeString('en-IN')} IST</p>
        </div>
        <div className="market-status-card">
          <span className={`status-badge ${marketStatus() === 'Market Open' ? 'open' : 'closed'}`}>{marketStatus()}</span>
          <span>Opens: Mon-Fri 9:15 AM IST</span>
          <span>Updated: {currentTime.toLocaleTimeString()}</span>
        </div>
      </div>

      <div className="search-bar-container">
        <SearchWithSuggestions onSelect={(stock) => window.location.href = `/stock/${stock.symbol}`} placeholder="Search NSE, BSE, crypto, forex..." className="global-search" />
      </div>

      <div className="indices-grid">
        {Object.entries(indices).map(([key, idx]) => (
          <div key={key} className="index-card">
            <div className="index-name">{key.toUpperCase().replace('NIFTY', 'NIFTY ')}</div>
            <div className="index-value">{idx.value}</div>
            <div className={`index-change ${idx.up ? 'positive' : 'negative'}`}>{idx.change} ({idx.percent}%)</div>
          </div>
        ))}
      </div>

      <div className="movers-section">
        <div className="movers-column">
          <h3>📈 Top Gainers</h3>
          {topGainers.slice(0, 5).map((stock, i) => (
            <div key={i} className="mover-row">
              <span className="mover-name">{stock.symbol}</span>
              <span className="mover-price">₹{stock.price}</span>
              <span className="mover-change positive">{stock.changePercent}%</span>
            </div>
          ))}
          <a href="/screener" className="view-all">See all +</a>
        </div>
        <div className="movers-column">
          <h3>📉 Top Losers</h3>
          {topLosers.slice(0, 5).map((stock, i) => (
            <div key={i} className="mover-row">
              <span className="mover-name">{stock.symbol}</span>
              <span className="mover-price">₹{stock.price}</span>
              <span className="mover-change negative">{stock.changePercent}%</span>
            </div>
          ))}
          <a href="/screener" className="view-all">See all +</a>
        </div>
      </div>

      <style jsx>{`
        .dashboard-container { max-width: 1400px; margin: 0 auto; }
        .dashboard-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }
        .market-status-card { background: var(--bg-card); border-radius: 12px; padding: 12px 20px; text-align: right; border: 1px solid var(--border-color); }
        .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-bottom: 6px; }
        .status-badge.open { background: rgba(0,255,136,0.2); color: #00ff88; }
        .status-badge.closed { background: rgba(255,68,68,0.2); color: #ff4444; }
        .search-bar-container { margin-bottom: 32px; max-width: 500px; }
        .global-search { width: 100%; padding: 12px 16px; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px; color: white; }
        .indices-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 20px; margin-bottom: 40px; }
        .index-card { background: var(--bg-card); border-radius: 16px; padding: 20px; border: 1px solid var(--border-color); }
        .index-name { font-size: 14px; color: var(--text-secondary); margin-bottom: 8px; }
        .index-value { font-size: 24px; font-weight: 700; margin-bottom: 4px; }
        .movers-section { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px; }
        .movers-column { background: var(--bg-card); border-radius: 16px; padding: 20px; border: 1px solid var(--border-color); }
        .mover-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--border-color); }
        .positive { color: #00ff88; }
        .negative { color: #ff4444; }
        .view-all { display: inline-block; margin-top: 16px; color: #00ff88; text-decoration: none; font-size: 13px; }
        @media (max-width: 768px) { .indices-grid { grid-template-columns: repeat(2,1fr); } .movers-section { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}