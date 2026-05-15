import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

export default function Portfolio() {
  const { user } = useAuth();
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalValue, setTotalValue] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);

  useEffect(() => {
    fetchPortfolio();
  }, []);

  const fetchPortfolio = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/portfolio`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setPortfolio(data.portfolio || []);
        calculateTotals(data.portfolio || []);
      }
    } catch (error) {
      console.error('Failed to fetch portfolio:', error);
    } finally {
      setLoading(false);
    }
  };
const exportToCSV = () => {
  const headers = ['Symbol', 'Quantity', 'Buy Price', 'Current Price', 'Investment', 'Current Value', 'P&L', 'P&L %'];
  const rows = portfolio.map(stock => [
    stock.symbol,
    stock.quantity,
    stock.buyPrice,
    stock.currentPrice || stock.buyPrice,
    (stock.quantity * stock.buyPrice).toFixed(2),
    (stock.quantity * (stock.currentPrice || stock.buyPrice)).toFixed(2),
    ((stock.quantity * ((stock.currentPrice || stock.buyPrice) - stock.buyPrice)).toFixed(2)),
    ((((stock.currentPrice || stock.buyPrice) - stock.buyPrice) / stock.buyPrice * 100).toFixed(2))
  ]);
  const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `portfolio_${new Date().toISOString()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};
  const calculateTotals = (items) => {
    let value = 0;
    let profit = 0;
    items.forEach(item => {
      const currentValue = item.quantity * (item.currentPrice || item.buyPrice);
      const invested = item.quantity * item.buyPrice;
      value += currentValue;
      profit += currentValue - invested;
    });
    setTotalValue(value);
    setTotalProfit(profit);
  };

  const marketData = [
    { symbol: 'NIFTY 50', value: '22,450.75', change: '+185.30', percent: '+0.83%', up: true },
    { symbol: 'SENSEX', value: '73,985.32', change: '+512.45', percent: '+0.70%', up: true },
    { symbol: 'BANK NIFTY', value: '48,234.15', change: '-156.20', percent: '-0.32%', up: false },
  ];

  return (
    <>
      <div className="animated-bg"></div>
      <div className="particle-bg">{[...Array(15)].map((_, i) => <div key={i} className="particle"></div>)}</div>
      <div className="grid-overlay"></div>

      <div className="ticker-premium">
        <div className="ticker-scroll">
          {[...marketData, ...marketData].map((item, idx) => (
            <div key={idx} className="ticker-item-premium">
              <span className="ticker-symbol">{item.symbol}</span>
              <span className="ticker-value">{item.value}</span>
              <span className={item.up ? 'ticker-up' : 'ticker-down'}>{item.change} ({item.percent})</span>
            </div>
          ))}
        </div>
      </div>

      <nav className="dashboard-nav">
        <div className="nav-container">
          <div className="nav-brand"><div className="brand-icon-small"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 17L9 11L13 15L21 7" stroke="white" strokeWidth="2"/></svg></div><span>PricePulse</span></div>
          <div className="nav-links">
            <Link to="/" className="nav-link">Dashboard</Link>
            <Link to="/portfolio" className="nav-link active">Portfolio</Link>
            <Link to="/watchlist" className="nav-link">Watchlist</Link>
            <Link to="/trading" className="nav-link">Paper Trading</Link>
            <Link to="/screener" className="nav-link">Screener</Link>
            <Link to="/ipos" className="nav-link">IPOs</Link>
            <Link to="/fno" className="nav-link">F&O</Link>
          </div>
          <div className="user-info"><span className="user-name">{user?.name?.split(' ')[0]}</span><button onClick={() => { localStorage.removeItem('token'); window.location.href = '/login'; }} className="logout-btn">Logout</button></div>
        </div>
      </nav>

      <main className="dashboard-main">
        <div className="dashboard-container">
          <div className="welcome-section"><h1>Portfolio Overview</h1><p>Track and manage your investments</p></div>

          <div className="stats-grid">
            <div className="stat-card"><div className="stat-icon">💰</div><div className="stat-info"><span className="stat-label">Total Value</span><span className="stat-value">₹{totalValue.toLocaleString()}</span><span className="stat-change positive">+12.5%</span></div></div>
            <div className="stat-card"><div className="stat-icon">📈</div><div className="stat-info"><span className="stat-label">Total Profit/Loss</span><span className="stat-value" style={{ color: totalProfit >= 0 ? '#00ff88' : '#f23645' }}>{totalProfit >= 0 ? '+' : ''}₹{totalProfit.toLocaleString()}</span><span className="stat-change positive">Overall return</span></div></div>
            <div className="stat-card"><div className="stat-icon">📊</div><div className="stat-info"><span className="stat-label">Holdings</span><span className="stat-value">{portfolio.length}</span><span className="stat-label">Active stocks</span></div></div>
            <div className="stat-card"><div className="stat-icon">🎯</div><div className="stat-info"><span className="stat-label">Day's Change</span><span className="stat-value">+₹2,345</span><span className="stat-change positive">+0.85%</span></div></div>
          </div>

          <div className="watchlist-section">
            <div className="section-header"><h2>Your Holdings</h2><Link to="/screener" className="view-all">+ Add Stock</Link></div>
            {portfolio.length === 0 ? (
              <div className="empty-state"><div className="empty-icon">📭</div><h3>No holdings yet</h3><p>Start building your portfolio by adding stocks</p><Link to="/screener" className="btn-premium" style={{ display: 'inline-block', width: 'auto', padding: '10px 24px' }}>Browse Stocks →</Link></div>
            ) : (
              <div className="watchlist-table"><table className="portfolio-table"><thead><tr><th>Stock</th><th>Quantity</th><th>Avg. Price</th><th>Current Price</th><th>Investment</th><th>Current Value</th><th>P&L</th><th>Action</th></tr></thead><tbody>
                {portfolio.map((stock, idx) => {
                  const investment = stock.quantity * stock.buyPrice;
                  const currentValue = stock.quantity * (stock.currentPrice || stock.buyPrice);
                  const pnl = currentValue - investment;
                  const pnlPercent = (pnl / investment) * 100;
                  return (<tr key={idx}><td className="symbol">{stock.symbol}<span className="exchange">NSE</span></td><td>{stock.quantity}</td><td>₹{stock.buyPrice.toFixed(2)}</td><td className="price">₹{(stock.currentPrice || stock.buyPrice).toFixed(2)}</td><td>₹{investment.toLocaleString()}</td><td>₹{currentValue.toLocaleString()}</td><td className={pnl >= 0 ? 'positive' : 'negative'}>{pnl >= 0 ? '+' : ''}₹{pnl.toLocaleString()} ({pnlPercent.toFixed(2)}%)</td><td><button className="trade-btn">Sell</button></td></tr>);
                })}
              </tbody></table></div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}