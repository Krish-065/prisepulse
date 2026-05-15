import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export default function Trading() {
  const { user } = useAuth();
  const [balance, setBalance] = useState(100000);
  const [holdings, setHoldings] = useState([]);
  const [symbol, setSymbol] = useState('');
  const [quantity, setQuantity] = useState('');
  const [orderType, setOrderType] = useState('BUY');
  const [message, setMessage] = useState('');
  const [livePrice, setLivePrice] = useState(null);
  const [popularStocks, setPopularStocks] = useState([
    { symbol: 'RELIANCE', price: 2856.45, change: '+2.30%' },
    { symbol: 'TCS', price: 3987.20, change: '+1.16%' },
    { symbol: 'INFY', price: 1523.80, change: '+1.93%' },
    { symbol: 'HDFCBANK', price: 1689.30, change: '-0.73%' },
    { symbol: 'ICICIBANK', price: 1123.45, change: '+0.78%' },
  ]);

  // Fetch live price when symbol changes
  useEffect(() => {
    if (!symbol) return;
    const fetchPrice = async () => {
      try {
        const res = await axios.get(`${API_URL}/market/stock/${symbol}`);
        setLivePrice(res.data.price);
      } catch (e) {
        setLivePrice(null);
      }
    };
    fetchPrice();
  }, [symbol]);

  const handleTrade = async () => {
    if (!symbol || !quantity) {
      setMessage('Please enter symbol and quantity');
      return;
    }
    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) {
      setMessage('Invalid quantity');
      return;
    }
    let price = livePrice;
    if (!price) {
      // fallback to popular stock list
      const found = popularStocks.find(s => s.symbol === symbol.toUpperCase());
      if (found) price = found.price;
      else {
        setMessage('Stock not found. Try RELIANCE, TCS, INFY, HDFCBANK, ICICIBANK');
        return;
      }
    }
    const cost = price * qty;
    if (orderType === 'BUY') {
      if (cost > balance) {
        setMessage(`Insufficient balance! Need ₹${cost.toLocaleString()}`);
        return;
      }
      setBalance(balance - cost);
      const existing = holdings.find(h => h.symbol === symbol.toUpperCase());
      if (existing) {
        const newQty = existing.quantity + qty;
        const newAvg = (existing.avgPrice * existing.quantity + cost) / newQty;
        setHoldings(holdings.map(h => h.symbol === symbol.toUpperCase() ? { ...h, quantity: newQty, avgPrice: newAvg } : h));
      } else {
        setHoldings([...holdings, { symbol: symbol.toUpperCase(), quantity: qty, avgPrice: price }]);
      }
      setMessage(`✅ Bought ${qty} shares of ${symbol.toUpperCase()} for ₹${cost.toLocaleString()}`);
    } else {
      const holding = holdings.find(h => h.symbol === symbol.toUpperCase());
      if (!holding || holding.quantity < qty) {
        setMessage(`Insufficient shares of ${symbol.toUpperCase()}`);
        return;
      }
      const newQty = holding.quantity - qty;
      if (newQty === 0) {
        setHoldings(holdings.filter(h => h.symbol !== symbol.toUpperCase()));
      } else {
        setHoldings(holdings.map(h => h.symbol === symbol.toUpperCase() ? { ...h, quantity: newQty } : h));
      }
      setBalance(balance + cost);
      setMessage(`✅ Sold ${qty} shares of ${symbol.toUpperCase()} for ₹${cost.toLocaleString()}`);
    }
    setSymbol('');
    setQuantity('');
    setLivePrice(null);
    setTimeout(() => setMessage(''), 3000);
  };

  const resetPortfolio = () => {
    setBalance(100000);
    setHoldings([]);
    setMessage('🔄 Portfolio reset! You have ₹1,00,000 virtual cash.');
    setTimeout(() => setMessage(''), 3000);
  };

  // Market ticker dummy
  const marketData = [{ symbol: 'NIFTY 50', value: '--' }, { symbol: 'SENSEX', value: '--' }, { symbol: 'BANK NIFTY', value: '--' }];

  return (
    <>
      <div className="market-bg"></div>
      <div className="animated-bg"></div>
      <div className="particle-bg">{[...Array(20)].map((_, i) => <div key={i} className="particle"></div>)}</div>
      <div className="grid-overlay"></div>
      <div className="ticker-premium"><div className="ticker-scroll">{marketData.map((item, idx) => (<div key={idx} className="ticker-item-premium"><span>{item.symbol}</span><span>{item.value}</span></div>))}</div></div>
      <nav className="dashboard-nav"><div className="nav-container"><div className="nav-brand"><div className="brand-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 17L9 11L13 15L21 7" stroke="#00ff88" strokeWidth="2"/></svg></div><span>PRICEPULSE</span><span className="live-badge">LIVE</span></div><div className="nav-links"><Link to="/" className="nav-link">Dashboard</Link><Link to="/portfolio" className="nav-link">Portfolio</Link><Link to="/watchlist" className="nav-link">Watchlist</Link><Link to="/trading" className="nav-link active">Paper Trading</Link><Link to="/screener" className="nav-link">Screener</Link><Link to="/ipos" className="nav-link">IPOs</Link><Link to="/fno" className="nav-link">F&O</Link></div><div className="nav-user"><span className="user-name">{user?.name?.split(' ')[0]}</span><button onClick={() => { localStorage.removeItem('token'); window.location.href = '/login'; }} className="logout-btn">Logout</button></div></div></nav>

      <main className="dashboard-main">
        <div className="dashboard-container">
          <div className="welcome-section"><h1>Paper Trading</h1><p>Practice with virtual money – ₹1,00,000 starting balance</p></div>
          <div className="stats-grid">
            <div className="stat-card"><div>💰 Balance</div><div className="stat-value">₹{balance.toLocaleString()}</div></div>
            <div className="stat-card"><div>📈 Holdings Value</div><div className="stat-value">₹{holdings.reduce((sum, h) => sum + (h.quantity * (popularStocks.find(s => s.symbol === h.symbol)?.price || 0)), 0).toLocaleString()}</div></div>
            <div className="stat-card"><div>📊 Total Holdings</div><div className="stat-value">{holdings.length}</div></div>
            <div className="stat-card"><div>🎯 Net Worth</div><div className="stat-value">₹{(balance + holdings.reduce((sum, h) => sum + (h.quantity * (popularStocks.find(s => s.symbol === h.symbol)?.price || 0)), 0)).toLocaleString()}</div></div>
          </div>

          <div className="trade-section">
            <div className="trade-card">
              <h3>Place Order</h3>
              <div className="trade-buttons"><button className={orderType === 'BUY' ? 'active' : ''} onClick={() => setOrderType('BUY')}>BUY</button><button className={orderType === 'SELL' ? 'active' : ''} onClick={() => setOrderType('SELL')}>SELL</button></div>
              <input type="text" placeholder="Stock Symbol (e.g., RELIANCE)" value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} />
              <input type="number" placeholder="Quantity" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
              {livePrice && <div className="live-price">Live Price: ₹{livePrice}</div>}
              <button onClick={handleTrade}>{orderType === 'BUY' ? 'Buy Now' : 'Sell Now'}</button>
              {message && <div className="trade-message">{message}</div>}
            </div>
            <div className="holdings-card">
              <h3>Your Holdings</h3>
              {holdings.length === 0 ? <div className="empty-state"><div>📭</div><p>No holdings yet. Start trading!</p></div> : (
                holdings.map((h, idx) => {
                  const stock = popularStocks.find(s => s.symbol === h.symbol);
                  const currentValue = h.quantity * (stock?.price || 0);
                  const invested = h.quantity * h.avgPrice;
                  const pnl = currentValue - invested;
                  return (<div key={idx} className="holding-item"><div><strong>{h.symbol}</strong></div><div>{h.quantity} shares</div><div>Avg: ₹{h.avgPrice}</div><div className={pnl >= 0 ? 'positive' : 'negative'}>P&L: {pnl >= 0 ? '+' : ''}₹{pnl.toFixed(2)}</div></div>);
                })
              )}
            </div>
          </div>

          <div className="popular-stocks">
            <h3>Popular Stocks</h3>
            <div className="popular-grid">{popularStocks.map((stock, idx) => (<div key={idx} className="popular-card" onClick={() => setSymbol(stock.symbol)}><div>{stock.symbol}</div><div>₹{stock.price}</div><div className={stock.change.startsWith('+') ? 'positive' : 'negative'}>{stock.change}</div></div>))}</div>
          </div>
          <button className="reset-btn" onClick={resetPortfolio}>Reset Portfolio</button>
        </div>
      </main>

      <style>{`
        .stats-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 20px; margin-bottom: 32px; }
        .stat-card { background: var(--bg-card); border-radius: 16px; padding: 20px; text-align: center; }
        .stat-value { font-size: 24px; font-weight: 700; margin-top: 8px; }
        .trade-section { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px; }
        .trade-card, .holdings-card { background: var(--bg-card); border-radius: 16px; padding: 24px; }
        .trade-buttons { display: flex; gap: 12px; margin-bottom: 20px; }
        .trade-buttons button { flex:1; padding: 10px; background: var(--bg-elevated); border:1px solid var(--border-color); border-radius:8px; cursor:pointer; }
        .trade-buttons button.active { background: linear-gradient(135deg,#00ff88,#00bcd4); color:#0a0e27; border-color:transparent; }
        .trade-card input { width:100%; padding:12px; margin-bottom:12px; background: var(--bg-elevated); border:1px solid var(--border-color); border-radius:8px; color:white; }
        .trade-card button { width:100%; padding:12px; background: linear-gradient(135deg,#00ff88,#00bcd4); border:none; border-radius:8px; font-weight:700; cursor:pointer; }
        .live-price { margin:8px 0; color:#00ff88; }
        .trade-message { margin-top:12px; padding:8px; background:rgba(0,255,136,0.1); border-radius:8px; text-align:center; }
        .holding-item { display:flex; justify-content:space-between; padding:12px 0; border-bottom:1px solid var(--border-color); }
        .popular-stocks { background: var(--bg-card); border-radius: 16px; padding: 24px; margin-bottom: 24px; }
        .popular-grid { display: grid; grid-template-columns: repeat(5,1fr); gap:12px; margin-top:16px; }
        .popular-card { padding:12px; background: var(--bg-elevated); border-radius:8px; text-align:center; cursor:pointer; transition:0.2s; }
        .popular-card:hover { background:#00ff88; color:#0a0e27; transform:translateY(-2px); }
        .reset-btn { width:100%; padding:12px; background: rgba(255,68,68,0.2); border:1px solid rgba(255,68,68,0.3); border-radius:12px; color:#ff4444; cursor:pointer; }
        .empty-state { text-align:center; padding:40px; }
        @media (max-width:768px){ .trade-section{grid-template-columns:1fr} .stats-grid{grid-template-columns:repeat(2,1fr)} .popular-grid{grid-template-columns:repeat(2,1fr)} }
      `}</style>
    </>
  );
}