import { useState, useEffect } from 'react';
import { apiClient } from '../services/api';

export default function FnO() {
  const [futures, setFutures] = useState([]);
  const [optionChain, setOptionChain] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedExpiry, setSelectedExpiry] = useState('28 Nov 2024');

  useEffect(() => {
    const fetchFutures = async () => {
      try {
        // Try to fetch from backend first (if endpoint exists)
        // Fallback to mock data if backend not ready
        const res = await apiClient.get('/market/futures').catch(() => null);
        if (res && res.data) {
          setFutures(res.data);
        } else {
          // Mock data
          setFutures([
            { symbol: 'NIFTY FUT', price: '22,480.50', change: '+0.85%', openInterest: '45.2L' },
            { symbol: 'BANKNIFTY FUT', price: '48,250.30', change: '-0.28%', openInterest: '32.5L' },
          ]);
        }

        // Option chain mock data
        setOptionChain([
          { strike: 22200, ceOI: '10.2L', ceChange: '+1.2%', peOI: '12.5L', peChange: '-0.8%' },
          { strike: 22300, ceOI: '11.5L', ceChange: '+2.1%', peOI: '10.8L', peChange: '-0.5%' },
          { strike: 22400, ceOI: '12.5L', ceChange: '+2.3%', peOI: '8.2L', peChange: '-1.2%' },
          { strike: 22500, ceOI: '22.3L', ceChange: '+8.9%', peOI: '4.8L', peChange: '-2.1%', atm: true },
          { strike: 22600, ceOI: '9.8L', ceChange: '-1.2%', peOI: '2.1L', peChange: '-0.3%' },
          { strike: 22700, ceOI: '7.2L', ceChange: '-0.5%', peOI: '3.5L', peChange: '+0.1%' },
        ]);
      } catch (error) {
        console.error('Error fetching F&O data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchFutures();
    const interval = setInterval(fetchFutures, 15000);
    return () => clearInterval(interval);
  }, []);

  // Calculate put-call ratio (mock)
  const putCallRatio = 1.24;

  if (loading) {
    return <div className="loading">Loading F&O data...</div>;
  }

  return (
    <div>
      <h1>Futures & Options</h1>
      <div className="pcr-card" style={{ background: 'var(--bg-card)', padding: '16px', borderRadius: '12px', marginBottom: '24px', textAlign: 'center' }}>
        <div style={{ fontSize: '18px' }}>Put‑Call Ratio (PCR)</div>
        <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#00ff88' }}>{putCallRatio}</div>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          {putCallRatio > 1 ? 'Bearish sentiment – more Puts than Calls' : 'Bullish sentiment – more Calls than Puts'}
        </div>
      </div>

      <div className="section-card">
        <h2>📊 Futures Data</h2>
        <div className="two-column" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
          {futures.map((f, idx) => (
            <div key={idx} className="index-card">
              <div className="index-name">{f.symbol}</div>
              <div className="index-value">₹{f.price}</div>
              <div className={`index-change ${f.change.includes('+') ? 'positive' : 'negative'}`}>{f.change}</div>
              <div className="index-name" style={{ marginTop: '8px' }}>OI: {f.openInterest}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="section-card">
        <div className="section-header">
          <h2>📈 NIFTY Option Chain</h2>
          <div className="expiry-selector" style={{ display: 'flex', gap: '8px' }}>
            {['28 Nov 2024', '05 Dec 2024', '12 Dec 2024'].map(exp => (
              <button
                key={exp}
                onClick={() => setSelectedExpiry(exp)}
                className={selectedExpiry === exp ? 'active-filter' : ''}
                style={{ padding: '4px 12px', borderRadius: '20px', border: '1px solid var(--border-color)', background: 'transparent', cursor: 'pointer' }}
              >
                {exp}
              </button>
            ))}
          </div>
        </div>
        <div className="screener-table">
          <table>
            <thead>
              <tr>
                <th>Strike</th>
                <th>CE OI</th>
                <th>CE Δ</th>
                <th>PE OI</th>
                <th>PE Δ</th>
              </tr>
            </thead>
            <tbody>
              {optionChain.map((opt, idx) => (
                <tr key={idx} className={opt.atm ? 'positive' : ''}>
                  <td>{opt.strike}{opt.atm && <span style={{ marginLeft: '8px', fontSize: '10px', background: '#00ff88', color: '#0a0e27', padding: '2px 6px', borderRadius: '12px' }}>ATM</span>}</td>
                  <td>{opt.ceOI}</td>
                  <td className="positive">{opt.ceChange}</td>
                  <td>{opt.peOI}</td>
                  <td className="negative">{opt.peChange}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}