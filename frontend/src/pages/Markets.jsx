import { useState } from 'react';
import SearchWithSuggestions from '../components/SearchWithSuggestions';

export default function Markets() {
  const [symbol, setSymbol] = useState('NSE:NIFTY');
  const [custom, setCustom] = useState('');

  const quickSymbols = [
    { label: 'NIFTY 50', value: 'NSE:NIFTY' },
    { label: 'SENSEX', value: 'NSE:SENSEX' },
    { label: 'BANK NIFTY', value: 'NSE:BANKNIFTY' },
    { label: 'RELIANCE', value: 'NSE:RELIANCE' },
    { label: 'TCS', value: 'NSE:TCS' },
    { label: 'INFY', value: 'NSE:INFY' },
    { label: 'HDFC BANK', value: 'NSE:HDFCBANK' },
    { label: 'Bitcoin', value: 'COINBASE:BTCUSD' },
    { label: 'Ethereum', value: 'COINBASE:ETHUSD' },
    { label: 'Solana', value: 'COINBASE:SOLUSD' },
    { label: 'USD/INR', value: 'FX_IDC:USDINR' },
    { label: 'EUR/INR', value: 'FX_IDC:EURINR' },
    { label: 'Gold', value: 'TVC:GOLD' },
    { label: 'Silver', value: 'TVC:SILVER' },
    { label: 'Crude Oil', value: 'TVC:WTI' },
  ];

  const loadChart = (sym) => {
    setSymbol(sym);
    // Reload iframe
    const iframe = document.getElementById('tradingview-widget');
    if (iframe) iframe.src = iframe.src;
  };

  return (
    <div className="markets-page">
      <h1>Markets Explorer</h1>
      <p>Interactive live charts for indices, stocks, crypto, forex, and commodities</p>

      <div className="symbol-selector">
        <div className="quick-buttons">
          {quickSymbols.map((s) => (
            <button key={s.value} onClick={() => loadChart(s.value)} className={symbol === s.value ? 'active' : ''}>
              {s.label}
            </button>
          ))}
        </div>
        <div className="custom-search">
          <SearchWithSuggestions
            onSelect={(stock) => loadChart(`NSE:${stock.symbol}`)}
            placeholder="Search any symbol (e.g., TCS, RELIANCE, WIPRO)..."
            className="custom-search-input"
          />
        </div>
      </div>

      <div className="chart-container">
        <iframe
          id="tradingview-widget"
          src={`https://s.tradingview.com/widgetembed/?frameElementId=tradingview_chart&symbol=${symbol}&interval=D&theme=dark&style=1&locale=in&toolbar_bg=f1f3f6&enable_publishing=false&hide_top_toolbar=false&save_image=false&studies=%5B%22MASimple@tv-basicstudies%22%5D`}
          style={{ width: '100%', height: '550px', border: 'none' }}
          title="TradingView Chart"
        />
      </div>

      <style>{`
        .markets-page { padding: 20px; max-width: 1400px; margin: 0 auto; }
        .symbol-selector { background: var(--bg-card); border-radius: 16px; padding: 20px; margin: 20px 0; }
        .quick-buttons { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 20px; }
        .quick-buttons button { padding: 8px 16px; background: var(--bg-elevated); border: 1px solid var(--border-color); border-radius: 20px; color: var(--text-secondary); cursor: pointer; transition: 0.2s; }
        .quick-buttons button.active, .quick-buttons button:hover { background: #00ff88; color: #0a0e27; border-color: transparent; }
        .custom-search { display: flex; gap: 12px; }
        .custom-search-input { flex: 1; padding: 10px 16px; background: var(--bg-elevated); border: 1px solid var(--border-color); border-radius: 8px; color: white; }
        .chart-container { background: var(--bg-card); border-radius: 16px; padding: 8px; margin-top: 20px; }
      `}</style>
    </div>
  );
}