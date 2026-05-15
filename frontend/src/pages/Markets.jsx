import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

export default function Markets() {
  const { user, logout } = useAuth();
  const [symbol, setSymbol] = useState('NSE:NIFTY');
  const [custom, setCustom] = useState('');

  const quickSymbols = [
    { label: 'NIFTY 50', value: 'NSE:NIFTY' },
    { label: 'SENSEX', value: 'NSE:SENSEX' },
    { label: 'BANK NIFTY', value: 'NSE:BANKNIFTY' },
    { label: 'RELIANCE', value: 'NSE:RELIANCE' },
    { label: 'TCS', value: 'NSE:TCS' },
    { label: 'HDFC BANK', value: 'NSE:HDFCBANK' },
    { label: 'Bitcoin', value: 'COINBASE:BTCUSD' },
    { label: 'Ethereum', value: 'COINBASE:ETHUSD' },
    { label: 'Solana', value: 'COINBASE:SOLUSD' },
    { label: 'USD/INR', value: 'FX_IDC:USDINR' },
    { label: 'EUR/INR', value: 'FX_IDC:EURINR' },
    { label: 'Gold', value: 'TVC:GOLD' },
    { label: 'Silver', value: 'TVC:SILVER' },
    { label: 'Crude Oil', value: 'TVC:WTI' }
  ];

  return (
    <>
      <div className="market-bg"></div><div className="animated-bg"></div>
      <div className="particle-bg">{Array(20).fill().map((_,i)=><div key={i} className="particle"></div>)}</div>
      <div className="grid-overlay"></div><div className="candlestick-pattern"></div>
      
      {/* Ticker */}
      <div className="ticker-premium"><div className="ticker-scroll">NIFTY | SENSEX | BANK NIFTY | BTC | ETH | USD/INR</div></div>
      
      {/* Navbar */}
      <nav className="dashboard-nav">
        <div className="nav-container">
          <div className="nav-brand"><div className="brand-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 17L9 11L13 15L21 7" stroke="#00ff88" strokeWidth="2"/></svg></div><span>PRICEPULSE</span><span className="live-badge">LIVE</span></div>
          <div className="nav-links">
            <Link to="/" className="nav-link">Dashboard</Link><Link to="/portfolio" className="nav-link">Portfolio</Link><Link to="/watchlist" className="nav-link">Watchlist</Link>
            <Link to="/trading" className="nav-link">Paper Trading</Link><Link to="/screener" className="nav-link">Screener</Link><Link to="/ipos" className="nav-link">IPOs</Link>
            <Link to="/fno" className="nav-link">F&O</Link><Link to="/markets" className="nav-link active">Markets</Link>
          </div>
          <div className="nav-user"><span>{user?.name?.split(' ')[0]}</span><button onClick={logout} className="logout-btn">Logout</button></div>
        </div>
      </nav>

      <main className="dashboard-main">
        <div className="dashboard-container">
          <h1>📊 Markets Explorer</h1>
          <p>Interactive live charts for indices, stocks, crypto, forex & commodities</p>

          <div className="symbol-selector">
            <div className="quick-buttons">
              {quickSymbols.map(s => (
                <button key={s.value} onClick={() => setSymbol(s.value)} className={symbol === s.value ? 'active' : ''}>{s.label}</button>
              ))}
            </div>
            <div className="custom-search">
              <input type="text" placeholder="Any symbol (e.g., NSE:INFY, COINBASE:SOLUSD, FX_IDC:GBPINR)" value={custom} onChange={e=>setCustom(e.target.value)} />
              <button onClick={() => custom && setSymbol(custom)}>Load Chart</button>
            </div>
          </div>

          <div className="chart-container">
            <iframe
              src={`https://s.tradingview.com/widgetembed/?frameElementId=tradingview_chart&symbol=${symbol}&interval=D&theme=dark&style=1&locale=in&toolbar_bg=f1f3f6&enable_publishing=false&hide_top_toolbar=false&save_image=false&studies=%5B%22MASimple@tv-basicstudies%22%5D`}
              style={{ width: '100%', height: '550px', border: 'none' }}
              title="TradingView Chart"
            />
          </div>
        </div>
      </main>

      <style>{`
        .symbol-selector { background: var(--bg-card); border-radius: 16px; padding: 20px; margin: 20px 0; }
        .quick-buttons { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 20px; }
        .quick-buttons button { padding: 8px 16px; background: var(--bg-elevated); border: 1px solid var(--border-color); border-radius: 20px; color: var(--text-secondary); cursor: pointer; transition: 0.2s; }
        .quick-buttons button.active, .quick-buttons button:hover { background: #00ff88; color: #0a0e27; border-color: transparent; }
        .custom-search { display: flex; gap: 12px; }
        .custom-search input { flex: 1; padding: 10px 16px; background: var(--bg-elevated); border: 1px solid var(--border-color); border-radius: 8px; color: white; }
        .custom-search button { padding: 10px 24px; background: linear-gradient(135deg, #00ff88, #00bcd4); border: none; border-radius: 8px; font-weight: 700; cursor: pointer; }
        .chart-container { background: var(--bg-card); border-radius: 16px; padding: 8px; margin-top: 20px; }
      `}</style>
    </>
  );
}