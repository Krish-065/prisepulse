import { useState, useEffect, useRef, useCallback } from 'react';
import { Search } from 'lucide-react';

// Symbol categories with popular options
const SYMBOL_CATEGORIES = {
  'Indian Stocks': [
    { label: 'SENSEX',     value: 'BSE:SENSEX' },
    { label: 'NIFTY 50',   value: 'NSE:NIFTY' },
    { label: 'RELIANCE',   value: 'BSE:RELIANCE' },
    { label: 'TCS',        value: 'BSE:TCS' },
    { label: 'HDFC Bank',  value: 'BSE:HDFCBANK' },
    { label: 'INFOSYS',    value: 'BSE:INFY' },
    { label: 'ICICI Bank', value: 'BSE:ICICIBANK' },
    { label: 'SBI',        value: 'BSE:SBIN' },
    { label: 'ADANI ENT',  value: 'BSE:ADANIENT' },
    { label: 'ZOMATO',     value: 'BSE:ZOMATO' },
    { label: 'WIPRO',      value: 'BSE:WIPRO' },
    { label: 'HCLTECH',    value: 'BSE:HCLTECH' },
    { label: 'MARUTI',     value: 'BSE:MARUTI' },
    { label: 'TATAMOTORS', value: 'BSE:TATAMOTORS' },
    { label: 'BAJFINANCE', value: 'BSE:BAJFINANCE' },
    { label: 'TITAN',      value: 'BSE:TITAN' },
    { label: 'SUNPHARMA',  value: 'BSE:SUNPHARMA' },
    { label: 'DRREDDY',    value: 'BSE:DRREDDY' },
    { label: 'IRCTC',      value: 'NSE:IRCTC' },
    { label: 'HAL',        value: 'NSE:HAL' },
  ],
  'Crypto': [
    { label: 'Bitcoin',    value: 'BINANCE:BTCUSDT' },
    { label: 'Ethereum',   value: 'BINANCE:ETHUSDT' },
    { label: 'BNB',        value: 'BINANCE:BNBUSDT' },
    { label: 'Solana',     value: 'BINANCE:SOLUSDT' },
    { label: 'XRP',        value: 'BINANCE:XRPUSDT' },
    { label: 'DOGE',       value: 'BINANCE:DOGEUSDT' },
    { label: 'ADA',        value: 'BINANCE:ADAUSDT' },
    { label: 'AVAX',       value: 'BINANCE:AVAXUSDT' },
    { label: 'MATIC',      value: 'BINANCE:MATICUSDT' },
    { label: 'LINK',       value: 'BINANCE:LINKUSDT' },
  ],
  'Forex': [
    { label: 'USD/INR',  value: 'FX_IDC:USDINR' },
    { label: 'EUR/INR',  value: 'FX_IDC:EURINR' },
    { label: 'GBP/INR',  value: 'FX_IDC:GBPINR' },
    { label: 'EUR/USD',  value: 'FX:EURUSD' },
    { label: 'GBP/USD',  value: 'FX:GBPUSD' },
    { label: 'USD/JPY',  value: 'FX:USDJPY' },
    { label: 'AUD/USD',  value: 'FX:AUDUSD' },
  ],
  'US Stocks': [
    { label: 'Apple',      value: 'NASDAQ:AAPL' },
    { label: 'Microsoft',  value: 'NASDAQ:MSFT' },
    { label: 'Tesla',      value: 'NASDAQ:TSLA' },
    { label: 'NVIDIA',     value: 'NASDAQ:NVDA' },
    { label: 'Google',     value: 'NASDAQ:GOOGL' },
    { label: 'Amazon',     value: 'NASDAQ:AMZN' },
    { label: 'Meta',       value: 'NASDAQ:META' },
    { label: 'Netflix',    value: 'NASDAQ:NFLX' },
    { label: 'S&P 500',    value: 'SP:SPX' },
    { label: 'NASDAQ',     value: 'NASDAQ:NDX' },
  ],
  'Commodities': [
    { label: 'Gold',       value: 'TVC:GOLD' },
    { label: 'Silver',     value: 'TVC:SILVER' },
    { label: 'Crude Oil',  value: 'TVC:USOIL' },
    { label: 'Brent',      value: 'TVC:UKOIL' },
    { label: 'Natural Gas',value: 'TVC:NATURALGAS' },
    { label: 'Copper',     value: 'TVC:COPPER' },
  ],
};

const INTERVALS = [
  { label: '1m',  value: '1' },
  { label: '5m',  value: '5' },
  { label: '15m', value: '15' },
  { label: '1H',  value: '60' },
  { label: '4H',  value: '240' },
  { label: '1D',  value: 'D' },
  { label: '1W',  value: 'W' },
  { label: '1M',  value: 'M' },
];

const ALL_SYMBOLS = Object.values(SYMBOL_CATEGORIES).flat();

export default function Markets() {
  const [symbol, setSymbol] = useState('NSE:NIFTY');
  const [interval, setInterval] = useState('D');
  const [activeCategory, setActiveCategory] = useState('Indian Stocks');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [chartKey, setChartKey] = useState(0);
  const searchRef = useRef();

  const filteredSymbols = searchQuery.length > 0
    ? ALL_SYMBOLS.filter(s =>
        s.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.value.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : SYMBOL_CATEGORIES[activeCategory] || [];

  const selectSymbol = useCallback((val) => {
    setSymbol(val);
    setChartKey(k => k + 1);
    setShowSearch(false);
    setSearchQuery('');
  }, []);

  // Build TradingView widget URL
  const widgetUrl = `https://www.tradingview.com/widgetembed/?frameElementId=tradingview_chart&symbol=${encodeURIComponent(symbol)}&interval=${interval}&hidesidetoolbar=0&hidetoptoolbar=0&symboledit=1&saveimage=0&toolbarbg=131722&studies=Volume%40tv-basicstudies&theme=dark&style=1&timezone=Asia%2FKolkata&studies_overrides=%7B%7D&overrides=%7B%22paneProperties.background%22%3A%22%23131722%22%2C%22paneProperties.backgroundType%22%3A%22solid%22%7D&enabled_features=%5B%5D&disabled_features=%5B%5D&locale=en&utm_source=nonstock.vercel.app`;

  const displayLabel = ALL_SYMBOLS.find(s => s.value === symbol)?.label || symbol;

  // Close search dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearch(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div style={{ paddingBottom: '32px', display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ margin: 0, backgroundImage: 'linear-gradient(135deg, #00ff88, #00bcd4)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent', color: 'transparent' }}>
            Live Market Charting
          </h1>
          <p style={{ color: '#9b9eac', margin: '4px 0 0 0', fontSize: '14px' }}>
            Advanced charting — Indian stocks, Crypto, Forex, US markets & more
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="live-badge">LIVE</span>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff', background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.2)', padding: '5px 14px', borderRadius: '20px' }}>
            {displayLabel}
          </span>
        </div>
      </div>

      {/* Controls Row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '16px', alignItems: 'center' }}>

        {/* Symbol Search */}
        <div ref={searchRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setShowSearch(v => !v)}
            style={{ padding: '9px 18px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#ffffff', fontWeight: 600, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}
          >
            <Search size={16} /> Search Symbol
          </button>

          {showSearch && (
            <div style={{ position: 'absolute', top: '44px', left: 0, width: '340px', background: '#0d1128', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', boxShadow: '0 16px 40px rgba(0,0,0,0.6)', zIndex: 100, overflow: 'hidden' }}>
              <div style={{ padding: '10px' }}>
                <input
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search stocks, crypto, forex..."
                  style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 12px', color: '#ffffff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              {/* Category Tabs */}
              {!searchQuery && (
                <div style={{ display: 'flex', gap: '4px', padding: '0 10px 10px', flexWrap: 'wrap' }}>
                  {Object.keys(SYMBOL_CATEGORIES).map(cat => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      style={{ padding: '4px 10px', background: activeCategory === cat ? 'rgba(0,255,136,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${activeCategory === cat ? '#00ff88' : 'rgba(255,255,255,0.08)'}`, color: activeCategory === cat ? '#00ff88' : '#9b9eac', borderRadius: '20px', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}

              {/* Symbol List */}
              <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                {filteredSymbols.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#9b9eac', fontSize: '13px' }}>No symbols found</div>
                ) : filteredSymbols.map(s => (
                  <div
                    key={s.value}
                    onClick={() => selectSymbol(s.value)}
                    style={{ padding: '10px 16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'background 0.15s', borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                    onMouseOver={e => e.currentTarget.style.background = 'rgba(0,255,136,0.06)'}
                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <span style={{ color: '#ffffff', fontWeight: 600, fontSize: '14px' }}>{s.label}</span>
                    <span style={{ color: '#9b9eac', fontSize: '11px', fontFamily: 'monospace' }}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Interval Pills */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {INTERVALS.map(iv => (
            <button
              key={iv.value}
              onClick={() => { setInterval(iv.value); setChartKey(k => k + 1); }}
              style={{ padding: '7px 14px', background: interval === iv.value ? 'rgba(0,255,136,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${interval === iv.value ? '#00ff88' : 'rgba(255,255,255,0.08)'}`, color: interval === iv.value ? '#00ff88' : '#e1e3e6', borderRadius: '20px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s' }}
            >
              {iv.label}
            </button>
          ))}
        </div>

        {/* Quick-jump category row */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginLeft: 'auto' }}>
          {Object.entries(SYMBOL_CATEGORIES).map(([cat, syms]) => (
            <button
              key={cat}
              onClick={() => { setActiveCategory(cat); setShowSearch(true); }}
              style={{ padding: '7px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: '#9b9eac', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontWeight: 600, transition: 'all 0.15s' }}
              onMouseOver={e => { e.currentTarget.style.color = '#00bcd4'; e.currentTarget.style.borderColor = '#00bcd4'; }}
              onMouseOut={e => { e.currentTarget.style.color = '#9b9eac'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* TradingView Chart */}
      <div style={{ flex: 1, background: '#131722', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.06)', overflow: 'hidden', minHeight: '620px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
        <iframe
          key={`${chartKey}-${symbol}-${interval}`}
          id="tradingview_chart"
          src={widgetUrl}
          style={{ width: '100%', height: '100%', border: 'none', minHeight: '620px' }}
          title={`TradingView Chart — ${displayLabel}`}
          allowFullScreen
          allow="fullscreen"
        />
      </div>

      <p style={{ color: '#9b9eac', fontSize: '12px', marginTop: '10px', textAlign: 'center' }}>
        Charts powered by <a href="https://www.tradingview.com" target="_blank" rel="noopener noreferrer" style={{ color: '#00bcd4', textDecoration: 'none' }}>TradingView</a>. Data is for informational purposes only.
      </p>
    </div>
  );
}