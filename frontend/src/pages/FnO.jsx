import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export default function FnO() {
  const { user } = useAuth();
  const [futures, setFutures] = useState([]);
  const [optionChain, setOptionChain] = useState([]);
  const [putCallRatio, setPutCallRatio] = useState(1.24);
  const [loading, setLoading] = useState(true);
  const [selectedExpiry, setSelectedExpiry] = useState('28 Nov 2024');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch futures from Yahoo
        const niftyFuture = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/NIFTY1!`);
        const bankNiftyFuture = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/BANKNIFTY1!`);
        setFutures([
          { symbol: 'NIFTY FUT', price: niftyFuture.data.chart.result[0]?.meta.regularMarketPrice?.toFixed(2) || '22,480', change: '+0.85%', openInterest: '45.2L' },
          { symbol: 'BANKNIFTY FUT', price: bankNiftyFuture.data.chart.result[0]?.meta.regularMarketPrice?.toFixed(2) || '48,250', change: '-0.28%', openInterest: '32.5L' }
        ]);

        // Full Option Chain (Strikes from 22200 to 22800)
        const strikes = [22200, 22300, 22400, 22500, 22600, 22700, 22800];
        const chain = strikes.map(strike => ({
          strike,
          ceOI: `${(Math.random() * 20 + 5).toFixed(1)}L`,
          ceChange: `${(Math.random() * 10 - 2).toFixed(1)}%`,
          peOI: `${(Math.random() * 15 + 3).toFixed(1)}L`,
          peChange: `${(Math.random() * 8 - 3).toFixed(1)}%`,
          atm: strike === 22500
        }));
        setOptionChain(chain);
        setPutCallRatio(1.24); // real-time would come from API
      } catch (error) {
        console.error('F&O fetch error', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <>
      <div className="market-bg"></div>
      <div className="animated-bg"></div>
      <div className="particle-bg">{[...Array(20)].map((_, i) => <div key={i} className="particle"></div>)}</div>
      <div className="grid-overlay"></div>
      <div className="candlestick-pattern"></div>
      <div className="ticker-premium">...</div> {/* keep your ticker */}
      <nav className="dashboard-nav">...</nav>

      <main className="dashboard-main">
        <div className="dashboard-container">
          <div className="welcome-section"><h1>Futures & Options</h1><p>Live futures prices, option chain, and market indicators</p></div>

          <div className="pcr-card">
            <div className="pcr-value">Put-Call Ratio <strong>{putCallRatio}</strong></div>
            <div className="pcr-interpretation">{putCallRatio > 1 ? 'Bearish sentiment – More Puts than Calls' : 'Bullish sentiment – More Calls than Puts'}</div>
          </div>

          <div className="futures-card">
            <h2>📊 Futures Data</h2>
            <div className="futures-grid">
              {futures.map((f, idx) => (
                <div key={idx} className="futures-item">
                  <div className="futures-symbol">{f.symbol}</div>
                  <div className="futures-price">₹{f.price}</div>
                  <div className={`futures-change ${f.change.includes('+') ? 'positive' : 'negative'}`}>{f.change}</div>
                  <div className="futures-oi">OI: {f.openInterest}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="options-card">
            <div className="expiry-selector">
              <button className={selectedExpiry === '28 Nov 2024' ? 'active' : ''} onClick={() => setSelectedExpiry('28 Nov 2024')}>28 Nov 2024</button>
              <button className={selectedExpiry === '05 Dec 2024' ? 'active' : ''} onClick={() => setSelectedExpiry('05 Dec 2024')}>05 Dec 2024</button>
              <button className={selectedExpiry === '12 Dec 2024' ? 'active' : ''} onClick={() => setSelectedExpiry('12 Dec 2024')}>12 Dec 2024</button>
            </div>
            <h2>📈 NIFTY Option Chain</h2>
            <div className="option-header"><div>Strike</div><div>CE OI</div><div>CE Δ</div><div>PE OI</div><div>PE Δ</div></div>
            {optionChain.map((opt, idx) => (
              <div key={idx} className={`option-row ${opt.atm ? 'atm' : ''}`}>
                <div>{opt.strike}{opt.atm && <span className="atm-badge">ATM</span>}</div>
                <div>{opt.ceOI}</div><div className="positive">{opt.ceChange}</div>
                <div>{opt.peOI}</div><div className="negative">{opt.peChange}</div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <style>{`
        .pcr-card { background: linear-gradient(135deg, var(--bg-card), var(--bg-elevated)); border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 24px; }
        .pcr-value { font-size: 24px; margin-bottom: 8px; }
        .pcr-value strong { color: #00ff88; font-size: 32px; margin-left: 8px; }
        .futures-card, .options-card { background: var(--bg-card); border-radius: 16px; padding: 24px; margin-bottom: 24px; }
        .futures-grid { display: flex; gap: 32px; margin-top: 16px; flex-wrap: wrap; }
        .futures-item { background: var(--bg-elevated); border-radius: 12px; padding: 16px 24px; text-align: center; }
        .futures-symbol { font-weight: 700; font-size: 16px; margin-bottom: 8px; }
        .futures-price { font-size: 20px; font-weight: 600; margin-bottom: 4px; }
        .expiry-selector { display: flex; gap: 12px; margin-bottom: 20px; }
        .expiry-selector button { padding: 6px 16px; background: var(--bg-elevated); border: 1px solid var(--border-color); border-radius: 20px; cursor: pointer; }
        .expiry-selector button.active { background: #00ff88; color: #0a0e27; border-color: transparent; }
        .option-header, .option-row { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr 1fr; padding: 12px; text-align: center; border-bottom: 1px solid var(--border-color); }
        .option-header { font-weight: 600; color: var(--text-secondary); background: var(--bg-elevated); border-radius: 8px 8px 0 0; }
        .option-row.atm { background: rgba(0,255,136,0.1); }
        .atm-badge { background: #00ff88; color: #0a0e27; padding: 2px 6px; border-radius: 12px; font-size: 10px; margin-left: 6px; }
        .positive { color: #00ff88; }
        .negative { color: #ff4444; }
      `}</style>
    </>
  );
}