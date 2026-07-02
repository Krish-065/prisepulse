import { useState, useEffect } from 'react';
import { apiClient } from '../services/api';
import { BarChart3, TrendingUp, ShieldAlert, Award, Compass, Eye } from 'lucide-react';

export default function FnO() {
  const [underlying, setUnderlying] = useState('NIFTY');
  const [selectedExpiry, setSelectedExpiry] = useState('28 Nov 2024');
  const [buildupTab, setBuildupTab] = useState('long');
  const [loading, setLoading] = useState(true);

  // States for calculated metrics
  const [futures, setFutures] = useState([]);
  const [optionChain, setOptionChain] = useState([]);
  const [maxPain, setMaxPain] = useState(0);
  const [pcr, setPcr] = useState(1.0);

  // Predefined expiry list
  const expiries = ['28 Nov 2024', '05 Dec 2024', '12 Dec 2024'];

  // Mock stock list for Build-up Scanner
  const buildupStocks = {
    long: [
      { symbol: 'RELIANCE', price: '2,465.30', change: '+1.85%', oi: '1.2Cr', oiChange: '+8.4%' },
      { symbol: 'TCS', price: '3,890.10', change: '+2.10%', oi: '45.8L', oiChange: '+12.1%' },
      { symbol: 'INFY', price: '1,532.50', change: '+0.95%', oi: '82.4L', oiChange: '+5.6%' },
      { symbol: 'BHARTIARTL', price: '1,120.40', change: '+1.45%', oi: '34.2L', oiChange: '+4.2%' },
    ],
    short: [
      { symbol: 'HDFCBANK', price: '1,510.20', change: '-1.25%', oi: '2.8Cr', oiChange: '+14.5%' },
      { symbol: 'ICICIBANK', price: '992.50', change: '-0.85%', oi: '1.4Cr', oiChange: '+9.2%' },
      { symbol: 'SBIN', price: '725.10', change: '-2.10%', oi: '94.5L', oiChange: '+11.8%' },
      { symbol: 'AXISBANK', price: '1,040.60', change: '-1.50%', oi: '52.1L', oiChange: '+6.5%' },
    ],
    covering: [
      { symbol: 'KOTAKBANK', price: '1,780.40', change: '+1.65%', oi: '38.2L', oiChange: '-6.4%' },
      { symbol: 'LT', price: '3,450.20', change: '+1.10%', oi: '21.4L', oiChange: '-4.8%' },
      { symbol: 'WIPRO', price: '468.20', change: '+2.85%', oi: '71.5L', oiChange: '-8.2%' },
      { symbol: 'TATAMOTORS', price: '945.10', change: '+3.15%', oi: '63.9L', oiChange: '-9.1%' },
    ],
    unwinding: [
      { symbol: 'ITC', price: '422.30', change: '-0.95%', oi: '1.9Cr', oiChange: '-5.1%' },
      { symbol: 'HINDUNILVR', price: '2,380.50', change: '-1.40%', oi: '31.8L', oiChange: '-3.9%' },
      { symbol: 'ASIANPAINT', price: '2,810.00', change: '-2.30%', oi: '18.4L', oiChange: '-7.2%' },
      { symbol: 'M&M', price: '1,950.40', change: '-1.15%', oi: '24.2L', oiChange: '-4.5%' },
    ]
  };

  const [firstLoad, setFirstLoad] = useState(true);

  useEffect(() => {
    fetchFnOData(firstLoad);
    const interval = setInterval(() => fetchFnOData(false), 15000);
    return () => clearInterval(interval);
  }, [underlying, selectedExpiry]);

  const fetchFnOData = async (showLoadingIndicator = false) => {
    if (showLoadingIndicator) setLoading(true);
    try {
      let symbolParam = underlying;
      if (underlying === 'NIFTY') symbolParam = 'NIFTY50';
      
      const res = await apiClient.get(`/market/stock/${symbolParam}`);
      if (res && res.data) {
        const spotPrice = parseFloat(res.data.price);
        const changePercentText = (res.data.changePercent >= 0 ? '+' : '') + parseFloat(res.data.changePercent).toFixed(2) + '%';
        
        let strikeInterval = 100;
        if (underlying === 'NIFTY') strikeInterval = 50;
        else if (underlying === 'BANKNIFTY') strikeInterval = 100;
        else if (underlying === 'RELIANCE') strikeInterval = 20;
        else if (underlying === 'TCS') strikeInterval = 20;

        const nearestStrike = Math.round(spotPrice / strikeInterval) * strikeInterval;
        
        const strikesCount = 7;
        const startStrike = nearestStrike - Math.floor(strikesCount / 2) * strikeInterval;
        
        const chain = [];
        for (let i = 0; i < strikesCount; i++) {
          const strike = startStrike + i * strikeInterval;
          const atm = strike === nearestStrike;
          
          // Generate realistic open interest based on distance to strike and underlying
          // Out-of-the-money options have lower premium but high OI, ATM has moderate, etc.
          // Add slight live fluctuation ticks to simulate live order flow
          const randomFactor = 0.96 + Math.random() * 0.08; // +/- 4% live fluctuation
          
          // Center-weighted distribution for OI
          const distanceFactor = Math.max(1, 10 - Math.abs(strike - nearestStrike) / strikeInterval);
          const baseOI = distanceFactor * randomFactor;
          
          // Call OI is higher above ATM (resistance), Put OI is higher below ATM (support)
          const ceOI = parseFloat((baseOI * (strike >= nearestStrike ? 1.5 : 0.5)).toFixed(1));
          const peOI = parseFloat((baseOI * (strike <= nearestStrike ? 1.5 : 0.5)).toFixed(1));
          
          const ceChange = (strike >= nearestStrike ? '+' : '-') + (Math.abs((strike - nearestStrike) / (strikeInterval * 10)) * 50 * randomFactor).toFixed(1) + '%';
          const peChange = (strike <= nearestStrike ? '+' : '-') + (Math.abs((strike - nearestStrike) / (strikeInterval * 10)) * 50 * randomFactor).toFixed(1) + '%';
          
          chain.push({
            strike,
            ceOI,
            ceChange,
            peOI,
            peChange,
            atm
          });
        }

        // Calculate dynamic PCR
        const totalCallOI = chain.reduce((sum, opt) => sum + opt.ceOI, 0);
        const totalPutOI = chain.reduce((sum, opt) => sum + opt.peOI, 0);
        const calculatedPcr = totalCallOI > 0 ? parseFloat((totalPutOI / totalCallOI).toFixed(2)) : 1.0;

        // Dynamic Max Pain calculation on the strike list
        let bestStrike = nearestStrike;
        let minLoss = Infinity;
        
        chain.forEach(candidate => {
          let totalLoss = 0;
          chain.forEach(opt => {
            if (candidate.strike > opt.strike) {
              totalLoss += (candidate.strike - opt.strike) * opt.ceOI;
            }
            if (candidate.strike < opt.strike) {
              totalLoss += (opt.strike - candidate.strike) * opt.peOI;
            }
          });
          if (totalLoss < minLoss) {
            minLoss = totalLoss;
            bestStrike = candidate.strike;
          }
        });

        setFutures([
          { 
            symbol: `${underlying} FUT`, 
            price: spotPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), 
            change: changePercentText, 
            openInterest: underlying === 'NIFTY' ? '48.2L' : underlying === 'BANKNIFTY' ? '31.5L' : underlying === 'RELIANCE' ? '1.2Cr' : '45.8L' 
          }
        ]);
        setOptionChain(chain);
        setMaxPain(bestStrike);
        setPcr(calculatedPcr);
        setFirstLoad(false);
      }
    } catch (error) {
      console.error('Error loading dynamic F&O metrics:', error);
    } finally {
      if (showLoadingIndicator) setLoading(false);
    }
  };

  // Determine sentiment details based on PCR
  const getSentiment = () => {
    if (pcr >= 1.3) return { label: 'Extremely Bullish', color: '#00ff88', rotation: 65 };
    if (pcr >= 1.05) return { label: 'Moderately Bullish', color: '#00e5ff', rotation: 30 };
    if (pcr >= 0.9) return { label: 'Neutral / Balanced', color: '#ffb300', rotation: 0 };
    if (pcr >= 0.7) return { label: 'Moderately Bearish', color: '#ff6d00', rotation: -30 };
    return { label: 'Extremely Bearish', color: '#ff4444', rotation: -65 };
  };

  const sentiment = getSentiment();

  // Find max value in option chain to scale the SVG bars properly
  const maxOIValue = Math.max(...optionChain.map(opt => Math.max(opt.ceOI, opt.peOI)), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Expiry and Symbol Filter Header */}
      <div className="section-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', padding: '20px 24px' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          {['NIFTY', 'BANKNIFTY', 'RELIANCE', 'TCS'].map(sym => (
            <button
              key={sym}
              onClick={() => setUnderlying(sym)}
              className={underlying === sym ? 'active-filter' : ''}
              style={{
                padding: '8px 18px',
                borderRadius: '24px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                background: 'rgba(255,255,255,0.02)',
                color: '#ffffff',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '13px',
                transition: 'all 0.2s'
              }}
            >
              {sym === 'NIFTY' || sym === 'BANKNIFTY' ? `${sym} Index` : sym}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600, marginRight: '6px' }}>Expiry:</span>
          {expiries.map(exp => (
            <button
              key={exp}
              onClick={() => setSelectedExpiry(exp)}
              className={selectedExpiry === exp ? 'active-filter' : ''}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                background: 'transparent',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 600
              }}
            >
              {exp}
            </button>
          ))}
        </div>
      </div>

      {/* Top Row: Sentiment Gauge & F&O Build-up Scanner */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1.3fr', 
        gap: '32px' 
      }}>
        
        {/* Market Sentiment Gauge & Max Pain */}
        <div className="section-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div className="section-header" style={{ marginBottom: '24px' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Compass size={20} style={{ color: '#00ff88' }} /> F&O Sentiment Gauge
            </h2>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', height: '140px', justifyContent: 'center' }}>
            {/* Speedometer semi-circle */}
            <svg width="220" height="110" viewBox="0 0 200 100">
              <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="rgba(255, 255, 255, 0.06)" strokeWidth="18" strokeLinecap="round" />
              <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="url(#speed-gradient)" strokeWidth="14" strokeLinecap="round" strokeDasharray="251.2" strokeDashoffset="0" />
              
              <defs>
                <linearGradient id="speed-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ff4444" />
                  <stop offset="50%" stopColor="#ffb300" />
                  <stop offset="100%" stopColor="#00ff88" />
                </linearGradient>
              </defs>
              
              {/* Pointer Needle */}
              <line 
                x1="100" 
                y1="100" 
                x2="100" 
                y2="30" 
                stroke="#ffffff" 
                strokeWidth="4" 
                strokeLinecap="round" 
                transform={`rotate(${sentiment.rotation}, 100, 100)`}
                style={{ transition: 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}
              />
              <circle cx="100" cy="100" r="8" fill="#ffffff" />
            </svg>
            
            <div style={{ textAlign: 'center', marginTop: '10px' }}>
              <div style={{ fontSize: '18px', fontWeight: 800, color: sentiment.color }}>{sentiment.label}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>Put-Call Ratio (PCR): <strong style={{ color: '#ffffff' }}>{pcr}</strong></div>
            </div>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '16px', 
            marginTop: '20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
            paddingTop: '20px'
          }}>
            <div style={{ background: 'rgba(255,255,255,0.01)', padding: '14px', borderRadius: '12px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.03)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Max Pain Level</div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#00bcd4', marginTop: '6px' }}>₹{maxPain}</div>
              <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>Maximum loss strike for buyers</div>
            </div>
            
            <div style={{ background: 'rgba(255,255,255,0.01)', padding: '14px', borderRadius: '12px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.03)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Future Spot Price</div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#ffffff', marginTop: '6px' }}>
                ₹{futures[0]?.price || '--'}
              </div>
              <div style={{ fontSize: '10px', color: futures[0]?.change.includes('+') ? '#00ff88' : '#ff4444', fontWeight: 700, marginTop: '2px' }}>
                {futures[0]?.change || '--'}
              </div>
            </div>
          </div>
        </div>

        {/* F&O Build-up Scanner */}
        <div className="section-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="section-header" style={{ marginBottom: '16px' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Award size={20} style={{ color: '#00bcd4' }} /> Nifty F&O Build-up Scanner
            </h2>
          </div>

          {/* Build-up Category Tabs */}
          <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', background: 'rgba(255,255,255,0.02)', padding: '4px', borderRadius: '10px' }}>
            {[
              { id: 'long', label: 'Long Build-up', desc: 'Price Up, OI Up' },
              { id: 'short', label: 'Short Build-up', desc: 'Price Down, OI Up' },
              { id: 'covering', label: 'Short Covering', desc: 'Price Up, OI Down' },
              { id: 'unwinding', label: 'Long Unwinding', desc: 'Price Down, OI Down' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setBuildupTab(tab.id)}
                style={{
                  flex: 1,
                  padding: '10px 8px',
                  borderRadius: '8px',
                  border: 'none',
                  background: buildupTab === tab.id ? 'var(--bg-primary)' : 'transparent',
                  color: buildupTab === tab.id ? '#00ff88' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: 700,
                  transition: 'all 0.15s'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, overflowY: 'auto' }}>
            {buildupStocks[buildupTab]?.map((stk, i) => (
              <div key={i} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 16px',
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.03)'
              }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '14px', color: '#ffffff' }}>{stk.symbol}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>OI: {stk.oi}</div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, fontSize: '13px' }}>₹{stk.price}</div>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', fontSize: '11px', fontWeight: 600, marginTop: '2px' }}>
                    <span style={{ color: stk.change.includes('+') ? '#00ff88' : '#ff4444' }}>{stk.change}</span>
                    <span style={{ color: buildupTab.includes('build') ? '#00ff88' : '#ff4444' }}>OI {stk.oiChange}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Middle Row: Call vs Put Open Interest Visualizer Chart */}
      <div className="section-card">
        <div className="section-header" style={{ marginBottom: '20px' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BarChart3 size={20} style={{ color: '#00ff88' }} /> Strike-wise Open Interest (Call vs Put)
          </h2>
          <div style={{ display: 'flex', gap: '16px', fontSize: '12px', fontWeight: 700 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ff4444' }}>
              <span style={{ width: '10px', height: '10px', background: '#ff4444', borderRadius: '2px' }} /> Call OI (Resistance)
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#00ff88' }}>
              <span style={{ width: '10px', height: '10px', background: '#00ff88', borderRadius: '2px' }} /> Put OI (Support)
            </span>
          </div>
        </div>

        {/* Custom SVG Double-Sided Bar Chart */}
        <div style={{ overflowX: 'auto', padding: '10px 0' }}>
          <div style={{ minWidth: '700px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {optionChain.map((opt, i) => {
              const ceWidthPercent = (opt.ceOI / maxOIValue) * 45;
              const peWidthPercent = (opt.peOI / maxOIValue) * 45;
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  {/* Call Bar (Left Side) */}
                  <div style={{ width: '45%', display: 'flex', justifyContent: 'flex-end', paddingRight: '12px' }}>
                    <div style={{ 
                      width: `${ceWidthPercent}%`, 
                      height: '24px', 
                      background: 'linear-gradient(270deg, rgba(255, 68, 68, 0.75), rgba(255, 68, 68, 0.1))', 
                      borderRadius: '4px 0 0 4px',
                      display: 'flex',
                      alignItems: 'center',
                      paddingRight: '8px',
                      justifyContent: 'flex-end',
                      borderRight: '2px solid #ff4444',
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#ffffff'
                    }}>
                      {opt.ceOI}L
                    </div>
                  </div>

                  {/* Strike Price Column (Center Pillar) */}
                  <div style={{ 
                    width: '10%', 
                    textAlign: 'center', 
                    fontWeight: 800, 
                    fontSize: '13px', 
                    color: opt.atm ? '#00e5ff' : '#9b9eac',
                    background: opt.atm ? 'rgba(0, 229, 255, 0.1)' : 'rgba(255,255,255,0.02)',
                    padding: '6px 0',
                    borderRadius: '6px',
                    border: opt.atm ? '1px solid rgba(0, 229, 255, 0.3)' : '1px solid transparent'
                  }}>
                    {opt.strike} {opt.atm && 'ATM'}
                  </div>

                  {/* Put Bar (Right Side) */}
                  <div style={{ width: '45%', display: 'flex', justifyContent: 'flex-start', paddingLeft: '12px' }}>
                    <div style={{ 
                      width: `${peWidthPercent}%`, 
                      height: '24px', 
                      background: 'linear-gradient(90deg, rgba(0, 255, 136, 0.75), rgba(0, 255, 136, 0.1))', 
                      borderRadius: '0 4px 4px 0',
                      display: 'flex',
                      alignItems: 'center',
                      paddingLeft: '8px',
                      justifyContent: 'flex-start',
                      borderLeft: '2px solid #00ff88',
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#ffffff'
                    }}>
                      {opt.peOI}L
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Row: Detailed Option Chain Table */}
      <div className="section-card">
        <div className="section-header" style={{ marginBottom: '24px' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Eye size={20} style={{ color: '#00bcd4' }} /> {underlying} Expiry Option Chain Table
          </h2>
        </div>
        
        <div className="screener-table">
          <table>
            <thead>
              <tr style={{ background: 'rgba(255, 255, 255, 0.02)' }}>
                <th style={{ textAlign: 'center', padding: '16px' }}>CE OI Change</th>
                <th style={{ textAlign: 'center', padding: '16px' }}>CE Open Interest</th>
                <th style={{ textAlign: 'center', padding: '16px' }}>Strike Price</th>
                <th style={{ textAlign: 'center', padding: '16px' }}>PE Open Interest</th>
                <th style={{ textAlign: 'center', padding: '16px' }}>PE OI Change</th>
              </tr>
            </thead>
            <tbody>
              {optionChain.map((opt, idx) => {
                // Determine In-The-Money (ITM) options color background
                // For Calls: Strikes below spot price are ITM
                // For Puts: Strikes above spot price are ITM
                const currentSpot = parseFloat(futures[0]?.price.replace(/,/g, '')) || 0;
                const isCeItm = opt.strike < currentSpot;
                const isPeItm = opt.strike > currentSpot;

                return (
                  <tr 
                    key={idx} 
                    style={{ 
                      background: opt.atm ? 'rgba(0, 229, 255, 0.05)' : 'transparent',
                      borderLeft: opt.atm ? '3px solid #00e5ff' : '3px solid transparent'
                    }}
                  >
                    {/* Call Columns */}
                    <td className="positive" style={{ 
                      textAlign: 'center', 
                      background: isCeItm ? 'rgba(255, 255, 255, 0.015)' : 'transparent',
                      fontWeight: 600
                    }}>
                      {opt.ceChange}
                    </td>
                    <td style={{ 
                      textAlign: 'center', 
                      background: isCeItm ? 'rgba(255, 255, 255, 0.015)' : 'transparent',
                      fontWeight: 700,
                      color: '#ffffff'
                    }}>
                      {opt.ceOI} Lakhs
                    </td>

                    {/* Strike Column */}
                    <td style={{ 
                      textAlign: 'center', 
                      fontWeight: 800, 
                      color: opt.atm ? '#00e5ff' : '#9b9eac',
                      fontSize: '15px'
                    }}>
                      {opt.strike}
                    </td>

                    {/* Put Columns */}
                    <td style={{ 
                      textAlign: 'center', 
                      background: isPeItm ? 'rgba(255, 255, 255, 0.015)' : 'transparent',
                      fontWeight: 700,
                      color: '#ffffff'
                    }}>
                      {opt.peOI} Lakhs
                    </td>
                    <td className="negative" style={{ 
                      textAlign: 'center', 
                      background: isPeItm ? 'rgba(255, 255, 255, 0.015)' : 'transparent',
                      fontWeight: 600
                    }}>
                      {opt.peChange}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}