import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import SearchWithSuggestions from '../components/SearchWithSuggestions';

export default function Markets() {
  const [searchParams] = useSearchParams();
  const [symbol, setSymbol] = useState(searchParams.get('symbol') || 'BSE:SENSEX');
  const [iframeSrc, setIframeSrc] = useState('');

  useEffect(() => {
    const src = `https://s.tradingview.com/widgetembed/?frameElementId=tradingview_chart&symbol=${symbol}&interval=D&theme=dark&style=1&locale=in&toolbar_bg=f1f3f6&enable_publishing=false&hide_top_toolbar=true&save_image=false&studies=%5B%22MASimple@tv-basicstudies%22%5D`;
    setIframeSrc(src);
  }, [symbol]);

  const quickSymbols = [
    { label: 'NIFTY 50', value: 'BSE:SENSEX' }, { label: 'SENSEX', value: 'BSE:SENSEX' }, { label: 'BANK NIFTY', value: 'NSE:BANKNIFTY' },
    { label: 'RELIANCE', value: 'NSE:RELIANCE' }, { label: 'TCS', value: 'NSE:TCS' }, { label: 'INFY', value: 'NSE:INFY' },
    { label: 'HDFC BANK', value: 'NSE:HDFCBANK' }, { label: 'Bitcoin', value: 'COINBASE:BTCUSD' }, { label: 'Ethereum', value: 'COINBASE:ETHUSD' },
    { label: 'Solana', value: 'COINBASE:SOLUSD' }, { label: 'USD/INR', value: 'FX_IDC:USDINR' }, { label: 'EUR/INR', value: 'FX_IDC:EURINR' },
    { label: 'Gold', value: 'TVC:GOLD' }, { label: 'Silver', value: 'TVC:SILVER' }, { label: 'Crude Oil', value: 'TVC:WTI' }
  ];

  return (
    <div>
      <h1>Markets Explorer</h1>
      <div style={{ marginBottom: '20px', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
        {quickSymbols.map(s => (
          <button key={s.value} onClick={() => setSymbol(s.value)} style={{ padding: '6px 12px', background: symbol===s.value ? '#00ff88' : '#1e222d', border: '1px solid #2a2e39', borderRadius: '20px', cursor: 'pointer', color: symbol===s.value ? '#0a0e27' : 'white' }}>{s.label}</button>
        ))}
      </div>
      <SearchWithSuggestions onSelect={(stock) => setSymbol(`${stock.exchange === 'NSE' ? 'NSE:' : stock.exchange === 'BSE' ? 'BSE:' : ''}${stock.symbol.replace('.NS', '').replace('.BO', '')}`)} placeholder="Search any stock (e.g., TCS, WIPRO)..." className="global-search" />
      <div style={{ background: '#1e222d', borderRadius: '16px', padding: '8px', marginTop: '20px' }}>
        {iframeSrc && <iframe src={iframeSrc} style={{ width: '100%', height: '550px', border: 'none' }} title="TradingView Chart" />}
      </div>
    </div>
  );
}