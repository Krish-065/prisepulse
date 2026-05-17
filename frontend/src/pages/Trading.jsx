import { useState, useEffect } from 'react';
import { apiClient } from '../services/api';
import SearchWithSuggestions from '../components/SearchWithSuggestions';

export default function Trading() {
  const [balance, setBalance] = useState(100000);
  const [holdings, setHoldings] = useState([]);
  const [symbol, setSymbol] = useState('');
  const [quantity, setQuantity] = useState('');
  const [orderType, setOrderType] = useState('BUY');
  const [message, setMessage] = useState('');

  const [prices, setPrices] = useState({});

  const handleTrade = async () => {
    const qty = parseInt(quantity);
    if (!symbol || !qty) { setMessage('Enter symbol and quantity'); return; }
    
    try {
      const res = await apiClient.get(`/market/stock/${symbol}`);
      const price = parseFloat(res.data.price);
      if (!price) { setMessage('Stock not found'); return; }
      
      setPrices(prev => ({ ...prev, [symbol.toUpperCase()]: price }));
      
      const cost = price * qty;
      if (orderType === 'BUY') {
        if (cost > balance) { setMessage('Insufficient balance'); return; }
        setBalance(balance - cost);
        const existing = holdings.find(h => h.symbol === symbol.toUpperCase());
        if (existing) {
          existing.avgPrice = ((existing.avgPrice * existing.quantity) + cost) / (existing.quantity + qty);
          existing.quantity += qty;
        } else {
          setHoldings([...holdings, { symbol: symbol.toUpperCase(), quantity: qty, avgPrice: price }]);
        }
        setMessage(`Bought ${qty} shares of ${symbol.toUpperCase()} at ₹${price}`);
      } else {
        const holding = holdings.find(h => h.symbol === symbol.toUpperCase());
        if (!holding || holding.quantity < qty) { setMessage('Insufficient shares'); return; }
        holding.quantity -= qty;
        if (holding.quantity === 0) setHoldings(holdings.filter(h => h.symbol !== symbol.toUpperCase()));
        setBalance(balance + cost);
        setMessage(`Sold ${qty} shares of ${symbol.toUpperCase()} at ₹${price}`);
      }
      setSymbol(''); setQuantity('');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Stock not found or error fetching price');
    }
  };

  const reset = () => { setBalance(100000); setHoldings([]); setMessage('Portfolio reset'); };

  return (
    <div>
      <h1>Paper Trading</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '24px', marginBottom: '24px' }}>
        <div className="index-card"><div>Balance</div><div className="index-value">₹{balance.toLocaleString()}</div></div>
        <div className="index-card"><div>Holdings Value</div><div className="index-value">₹{holdings.reduce((sum, h) => sum + (h.quantity * (prices[h.symbol] || h.avgPrice)), 0).toLocaleString()}</div></div>
      </div>
      <div className="two-column">
        <div className="section-card">
          <h3>Place Order</h3>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
            <button className={orderType === 'BUY' ? 'active-filter' : ''} onClick={() => setOrderType('BUY')}>BUY</button>
            <button className={orderType === 'SELL' ? 'active-filter' : ''} onClick={() => setOrderType('SELL')}>SELL</button>
          </div>
          <SearchWithSuggestions onSelect={(stock) => setSymbol(stock.symbol)} placeholder="Search Symbol..." className="global-search" style={{ marginBottom: '8px' }} />
          <input type="number" placeholder="Quantity" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="global-search" style={{ marginBottom: '8px' }} />
          <button onClick={handleTrade} className="btn-premium">Place Order</button>
          {message && <p style={{ marginTop: '12px', color: '#00ff88' }}>{message}</p>}
        </div>
        <div className="section-card">
          <h3>Your Holdings</h3>
          {holdings.length === 0 ? <p>No holdings</p> : holdings.map((h, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #2a2e39' }}>
              <span>{h.symbol}</span><span>{h.quantity} shares</span><span>Avg ₹{h.avgPrice}</span>
            </div>
          ))}
        </div>
      </div>
      <button onClick={reset} className="remove-btn" style={{ marginTop: '16px' }}>Reset Portfolio</button>
    </div>
  );
}