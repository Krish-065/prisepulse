import { useState, useEffect } from 'react';
import { apiClient } from '../services/api';
import { 
  Compass, TrendingUp, TrendingDown, Info, RefreshCw, 
  Layers, Activity, Sparkles, LineChart, Percent, CheckCircle
} from 'lucide-react';

export default function SectorRotation() {
  const [sectors, setSectors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSector, setSelectedSector] = useState(null);
  const [showGuide, setShowGuide] = useState(false);

  // Sector stock components mapping for detailed breakdown
  const sectorComponents = {
    'Banking': [
      { name: 'HDFC Bank', ticker: 'HDFCBANK', weight: '38%' },
      { name: 'ICICI Bank', ticker: 'ICICIBANK', weight: '26%' },
      { name: 'State Bank of India', ticker: 'SBIN', weight: '18%' },
      { name: 'Axis Bank', ticker: 'AXISBANK', weight: '18%' }
    ],
    'Information Tech': [
      { name: 'TCS', ticker: 'TCS', weight: '42%' },
      { name: 'Infosys', ticker: 'INFY', weight: '34%' },
      { name: 'HCL Tech', ticker: 'HCLTECH', weight: '14%' },
      { name: 'Wipro', ticker: 'WIPRO', weight: '10%' }
    ],
    'Energy & Utilities': [
      { name: 'Reliance Industries', ticker: 'RELIANCE', weight: '55%' },
      { name: 'ONGC', ticker: 'ONGC', weight: '18%' },
      { name: 'BPCL', ticker: 'BPCL', weight: '12%' },
      { name: 'NTPC', ticker: 'NTPC', weight: '15%' }
    ],
    'Auto': [
      { name: 'Tata Motors', ticker: 'TATAMOTORS', weight: '32%' },
      { name: 'M&M', ticker: 'M&M', weight: '28%' },
      { name: 'Maruti Suzuki', ticker: 'MARUTI', weight: '25%' },
      { name: 'Hero MotoCorp', ticker: 'HEROMOTOCO', weight: '15%' }
    ],
    'Pharma & Health': [
      { name: 'Sun Pharma', ticker: 'SUNPHARMA', weight: '35%' },
      { name: 'Cipla', ticker: 'CIPLA', weight: '25%' },
      { name: 'Dr Reddy Labs', ticker: 'DRREDDY', weight: '22%' },
      { name: 'Apollo Hospitals', ticker: 'APOLLOHOSP', weight: '18%' }
    ],
    'FMCG': [
      { name: 'Hindustan Unilever', ticker: 'HINDUNILVR', weight: '44%' },
      { name: 'ITC', ticker: 'ITC', weight: '36%' },
      { name: 'Nestle India', ticker: 'NESTLEIND', weight: '12%' },
      { name: 'Britannia', ticker: 'BRITANNIA', weight: '8%' }
    ],
    'Metals & Mining': [
      { name: 'Tata Steel', ticker: 'TATASTEEL', weight: '35%' },
      { name: 'JSW Steel', ticker: 'JSWSTEEL', weight: '30%' },
      { name: 'Hindalco', ticker: 'HINDALCO', weight: '20%' },
      { name: 'Coal India', ticker: 'COALINDIA', weight: '15%' }
    ]
  };

  const fetchRotationData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const res = await apiClient.get('/market/sector-rotation');
      setSectors(res.data);
      // Select the first sector by default if none is selected
      if (!selectedSector && res.data.length > 0) {
        setSelectedSector(res.data[0]);
      } else if (selectedSector) {
        // Update currently selected sector stats
        const updated = res.data.find(s => s.sector === selectedSector.sector);
        if (updated) setSelectedSector(updated);
      }
    } catch (err) {
      console.error('Error fetching sector rotation:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRotationData();
    // 1 second real-time polling interval
    const timer = setInterval(() => fetchRotationData(true), 1000);
    return () => clearInterval(timer);
  }, []);

  const getQuadrantStyle = (quad) => {
    switch (quad) {
      case 'Leading':
        return { bg: 'rgba(0, 255, 136, 0.1)', border: 'rgba(0, 255, 136, 0.3)', text: '#00ff88', label: 'Leading (Accumulating)' };
      case 'Improving':
        return { bg: 'rgba(0, 188, 212, 0.1)', border: 'rgba(0, 188, 212, 0.3)', text: '#00bcd4', label: 'Improving (Short Covering)' };
      case 'Weakening':
        return { bg: 'rgba(255, 179, 0, 0.1)', border: 'rgba(255, 179, 0, 0.3)', text: '#ffb300', label: 'Weakening (Distributing)' };
      case 'Lagging':
        return { bg: 'rgba(255, 68, 68, 0.1)', border: 'rgba(255, 68, 68, 0.3)', text: '#ff4444', label: 'Lagging (Unwinding)' };
      default:
        return { bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)', text: '#ffffff', label: 'Neutral' };
    }
  };

  const handleSectorClick = (sectorName) => {
    const matched = sectors.find(s => s.sector === sectorName);
    if (matched) setSelectedSector(matched);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh', flexDirection: 'column', gap: '16px' }}>
        <div style={{ width: '40px', height: '40px', border: '4px solid rgba(0, 255, 136, 0.1)', borderTop: '4px solid #00ff88', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <p style={{ color: 'var(--text-secondary)' }}>Calculating institutional sector rotation matrix...</p>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Find max bounds for coordinate plotting (default scales to +/- 2% price and +/- 8% OI)
  const maxPriceChange = Math.max(...sectors.map(s => Math.abs(s.priceChange)), 1.5);
  const maxOiChange = Math.max(...sectors.map(s => Math.abs(s.oiChange)), 5);

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Upper Title Block */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(0, 255, 136, 0.08) 0%, rgba(10, 14, 39, 0.5) 100%)',
        border: '1px solid rgba(0, 255, 136, 0.15)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-primary)' }}>
            <Compass size={32} style={{ color: '#00ff88', animation: refreshing ? 'spin 1.5s linear infinite' : 'none' }} />
            Institutional Sector Rotation Matrix
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px', fontSize: '14px' }}>
            Tracking block order volume and open interest momentum to map sector-wide cycles of Smart Money.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => setShowGuide(!showGuide)}
            style={{
              padding: '8px 16px',
              background: showGuide ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255, 255, 255, 0.05)',
              border: showGuide ? '1px solid #00ff88' : '1px solid var(--border-color)',
              borderRadius: '8px',
              color: showGuide ? '#00ff88' : 'var(--text-primary)',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: '0.2s'
            }}
          >
            <Info size={14} />
            {showGuide ? 'Hide Guide' : 'How it Works'}
          </button>

          <span style={{ fontSize: '11px', color: refreshing ? '#00ff88' : 'var(--text-secondary)', transition: '0.2s' }}>
            {refreshing ? 'Refreshing quote engine...' : 'Live auto-updating (1s)'}
          </span>
          <button
            onClick={() => fetchRotationData()}
            disabled={refreshing}
            style={{
              padding: '10px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: '0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = '#00ff88'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Educational User Guide Drawer */}
      {showGuide && (
        <div style={{
          background: 'var(--bg-card-glass)',
          border: '1px solid rgba(0, 255, 136, 0.25)',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px',
          animation: 'slideDown 0.3s ease-out',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Compass size={20} style={{ color: '#00ff88' }} />
            Guide: How to Use the Sector Rotation Matrix
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.6', marginBottom: '20px' }}>
            Sector Rotation is the movement of institutional capital ("Smart Money") from one industry to another to maximize profit as the economic cycle develops. This matrix tracks price changes against open interest (OI) changes to determine which quadrant a sector belongs in:
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            
            <div style={{ background: 'rgba(0, 255, 136, 0.03)', border: '1px solid rgba(0, 255, 136, 0.15)', borderRadius: '10px', padding: '16px' }}>
              <h4 style={{ color: '#00ff88', fontWeight: '700', fontSize: '14px', marginBottom: '6px' }}>🟢 Leading Quadrant</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '12px', lineHeight: '1.5' }}>
                <strong>Price is Up & Open Interest is Up.</strong> Indicates active institutional buying and contract accumulation. These sectors are driving the market's uptrend.
              </p>
            </div>

            <div style={{ background: 'rgba(255, 179, 0, 0.03)', border: '1px solid rgba(255, 179, 0, 0.15)', borderRadius: '10px', padding: '16px' }}>
              <h4 style={{ color: '#ffb300', fontWeight: '700', fontSize: '14px', marginBottom: '6px' }}>🟡 Weakening Quadrant</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '12px', lineHeight: '1.5' }}>
                <strong>Price is Down but Open Interest is Up.</strong> Signals institutional distribution. Large players are opening short positions or quietly unloading shares onto retail buyers.
              </p>
            </div>

            <div style={{ background: 'rgba(255, 68, 68, 0.03)', border: '1px solid rgba(255, 68, 68, 0.15)', borderRadius: '10px', padding: '16px' }}>
              <h4 style={{ color: '#ff4444', fontWeight: '700', fontSize: '14px', marginBottom: '6px' }}>🔴 Lagging Quadrant</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '12px', lineHeight: '1.5' }}>
                <strong>Price is Down & Open Interest is Down.</strong> Indicates institutional abandonment. Traders are closing contracts (long unwinding), leading to listless trading.
              </p>
            </div>

            <div style={{ background: 'rgba(0, 188, 212, 0.03)', border: '1px solid rgba(0, 188, 212, 0.15)', borderRadius: '10px', padding: '16px' }}>
              <h4 style={{ color: '#00bcd4', fontWeight: '700', fontSize: '14px', marginBottom: '6px' }}>🔵 Improving Quadrant</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '12px', lineHeight: '1.5' }}>
                <strong>Price is Up but Open Interest is Down.</strong> Typically represents short covering. Sellers are closing their trades to cut losses, pushing the price up. This is the early stage of structural recovery.
              </p>
            </div>

          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={16} style={{ color: '#ffb300' }} />
            <span style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: '600' }}>Pro Trading Strategy:</span>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Buy the top outperforming stocks (starred in the sidebar) when their sector enters the <strong>Leading</strong> quadrant, and hedge/exit when the sector slips into <strong>Weakening</strong> or <strong>Lagging</strong> quadrants.
            </span>
          </div>

          <style>{`
            @keyframes slideDown {
              from { opacity: 0; transform: translateY(-10px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>
        </div>
      )}

      {/* Main Split Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        
        {/* Left Side: Dynamic SVG Scatter Matrix */}
        <div style={{
          background: 'var(--bg-card-glass)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', alignSelf: 'flex-start', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={18} style={{ color: '#00ff88' }} />
            Institutional Flow quadrants
          </h3>

          <div style={{ position: 'relative', width: '100%', paddingBottom: '100%', height: 0 }}>
            {/* SVG Interactive Scatter Plot */}
            <svg 
              viewBox="0 0 400 400" 
              style={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                width: '100%', 
                height: '100%',
                background: 'rgba(10, 14, 39, 0.4)',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.05)'
              }}
            >
              {/* Quadrant Colors */}
              {/* Top-Right: Leading (Green) */}
              <rect x="200" y="0" width="200" height="200" fill="rgba(0, 255, 136, 0.015)" />
              {/* Top-Left: Improving (Cyan) */}
              <rect x="0" y="0" width="200" height="200" fill="rgba(0, 188, 212, 0.015)" />
              {/* Bottom-Left: Lagging (Red) */}
              <rect x="0" y="200" width="200" height="200" fill="rgba(255, 68, 68, 0.015)" />
              {/* Bottom-Right: Weakening (Orange) */}
              <rect x="200" y="200" width="200" height="200" fill="rgba(255, 179, 0, 0.015)" />

              {/* Grid Lines */}
              <line x1="0" y1="200" x2="400" y2="200" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1" />
              <line x1="200" y1="0" x2="200" y2="400" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1" />

              {/* Quadrant Labels */}
              <text x="390" y="25" fill="#00ff88" fontSize="11" fontWeight="700" textAnchor="end">LEADING</text>
              <text x="390" y="38" fill="var(--text-secondary)" fontSize="9" textAnchor="end">Price ↑ | OI ↑</text>

              <text x="10" y="25" fill="#00bcd4" fontSize="11" fontWeight="700" textAnchor="start">IMPROVING</text>
              <text x="10" y="38" fill="var(--text-secondary)" fontSize="9" textAnchor="start">Price ↑ | OI ↓</text>

              <text x="10" y="375" fill="#ff4444" fontSize="11" fontWeight="700" textAnchor="start">LAGGING</text>
              <text x="10" y="388" fill="var(--text-secondary)" fontSize="9" textAnchor="start">Price ↓ | OI ↓</text>

              <text x="390" y="375" fill="#ffb300" fontSize="11" fontWeight="700" textAnchor="end">WEAKENING</text>
              <text x="390" y="388" fill="var(--text-secondary)" fontSize="9" textAnchor="end">Price ↓ | OI ↑</text>

              {/* Axis Labels */}
              <text x="200" y="395" fill="var(--text-secondary)" fontSize="9" textAnchor="middle">OI Momentum (%)</text>
              <text x="5" y="205" fill="var(--text-secondary)" fontSize="9" textAnchor="start" transform="rotate(-90 5 205)">Price Momentum (%)</text>

              {/* Sector Plot Bubbles */}
              {sectors.map((item, idx) => {
                // Map coordinates using current max price/OI changes as range bounds
                // SVG coordinate space: (0,0) is top-left, (400, 400) is bottom-right
                // X Axis represents OI change (neg is left, pos is right)
                // Y Axis represents Price change (neg is bottom, pos is top)
                
                const rawX = (item.oiChange / maxOiChange) * 160 + 200;
                const rawY = 200 - (item.priceChange / maxPriceChange) * 160;

                // Restrict within bounding box limits (margin offset 30)
                const cx = Math.min(370, Math.max(30, rawX));
                const cy = Math.min(370, Math.max(30, rawY));

                const qStyle = getQuadrantStyle(item.quadrant);
                const isSelected = selectedSector && selectedSector.sector === item.sector;

                return (
                  <g 
                    key={idx} 
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleSectorClick(item.sector)}
                  >
                    {/* Ring highlight if selected */}
                    {isSelected && (
                      <circle 
                        cx={cx} 
                        cy={cy} 
                        r="18" 
                        fill="none" 
                        stroke="#00ff88" 
                        strokeWidth="1.5" 
                        strokeDasharray="3 3"
                        style={{ transformOrigin: `${cx}px ${cy}px`, animation: 'spin 10s linear infinite' }} 
                      />
                    )}
                    {/* Core sector bubble */}
                    <circle 
                      cx={cx} 
                      cy={cy} 
                      r="11" 
                      fill={qStyle.text} 
                      fillOpacity={isSelected ? "0.85" : "0.55"}
                      stroke={qStyle.text}
                      strokeWidth="1.5"
                    />
                    {/* Initials label */}
                    <text 
                      x={cx} 
                      y={cy + 3} 
                      fill="#000000" 
                      fontSize="9" 
                      fontWeight="800" 
                      textAnchor="middle"
                    >
                      {item.sector.substring(0, 2).toUpperCase()}
                    </text>
                    {/* Floating label caption text */}
                    <text 
                      x={cx} 
                      y={cy - 15} 
                      fill="#ffffff" 
                      fontSize="8" 
                      fontWeight={isSelected ? "700" : "500"} 
                      textAnchor="middle"
                      visibility={isSelected ? "visible" : "hidden"}
                    >
                      {item.sector}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Right Side: Detailed Sector Inspection Breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {selectedSector && (
            <div style={{
              background: 'var(--bg-card-glass)',
              border: `1px solid ${getQuadrantStyle(selectedSector.quadrant).border}`,
              borderRadius: '16px',
              padding: '24px',
              flexGrow: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              boxShadow: `0 8px 30px rgba(0,0,0,0.3), 0 0 20px ${getQuadrantStyle(selectedSector.quadrant).bg}`
            }}>
              {/* Header Info */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={{
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontWeight: '800',
                    background: getQuadrantStyle(selectedSector.quadrant).bg,
                    color: getQuadrantStyle(selectedSector.quadrant).text,
                    border: `1px solid ${getQuadrantStyle(selectedSector.quadrant).border}`,
                    textTransform: 'uppercase'
                  }}>
                    {getQuadrantStyle(selectedSector.quadrant).label}
                  </span>
                  <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', marginTop: '8px' }}>
                    {selectedSector.sector}
                  </h2>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>SMART MONEY INDEX</span>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: '#00ff88' }}>
                    {selectedSector.flowIndex}
                  </div>
                </div>
              </div>

              {/* Description summary */}
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                {selectedSector.description} Components are exhibiting balanced pricing metrics with current open interest indicating {selectedSector.oiChange >= 0 ? 'increased positional accumulation.' : 'unwinding of positions.'}
              </p>

              {/* Stats Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', margin: '8px 0' }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Percent size={12} />
                    PRICE MOMENTUM
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: selectedSector.priceChange >= 0 ? '#00ff88' : '#ff4444', marginTop: '4px' }}>
                    {selectedSector.priceChange >= 0 ? '+' : ''}{selectedSector.priceChange}%
                  </div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <LineChart size={12} />
                    OPEN INTEREST MOMENTUM
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: selectedSector.oiChange >= 0 ? '#00ff88' : '#ff4444', marginTop: '4px' }}>
                    {selectedSector.oiChange >= 0 ? '+' : ''}{selectedSector.oiChange}%
                  </div>
                </div>
              </div>

              {/* Components Breakdown */}
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Layers size={14} style={{ color: '#00ff88' }} />
                  Sector Component Weights
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {sectorComponents[selectedSector.sector]?.map((comp, idx) => (
                    <div 
                      key={idx} 
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255,255,255,0.04)',
                        borderRadius: '8px'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>{comp.name}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>NSE: {comp.ticker}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '12px', color: '#00bcd4', fontWeight: '600' }}>{comp.weight} weight</span>
                        <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          {selectedSector.topStock === comp.ticker ? (
                            <span style={{ color: '#00ff88', fontWeight: '700' }}>★ Top Outperformer</span>
                          ) : 'Underlying Asset'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* NonStock AI Outlook */}
              <div style={{
                background: 'rgba(0, 255, 136, 0.03)',
                border: '1px solid rgba(0, 255, 136, 0.15)',
                borderRadius: '8px',
                padding: '14px',
                marginTop: 'auto',
                display: 'flex',
                gap: '10px',
                alignItems: 'flex-start'
              }}>
                <Sparkles size={16} style={{ color: '#00ff88', marginTop: '2px', flexShrink: 0 }} />
                <div>
                  <h4 style={{ fontSize: '12px', fontWeight: '700', color: '#00ff88' }}>NonStock Intelligence Outlook</h4>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: '1.4' }}>
                    {selectedSector.quadrant === 'Leading' && `Sector shows persistent block accumulation. Institutional flow index at ${selectedSector.flowIndex} signals potential breakout continuation. Focus on top outperformer: ${selectedSector.topStock}.`}
                    {selectedSector.quadrant === 'Improving' && `Structural recovery via short covering. Price turning upward on low volume. Potential early entries developing on dips.`}
                    {selectedSector.quadrant === 'Weakening' && `Price starting to decline despite heavy OI. Smart Money is actively booking profits. Exercise defensive positioning in sector constituents.`}
                    {selectedSector.quadrant === 'Lagging' && `Low price momentum alongside contract liquidations. Capital outflow is active. Avoid adding long-term exposure here until structural reversals shape.`}
                  </p>
                </div>
              </div>

            </div>
          )}
        </div>

      </div>

      {/* Bottom Table: Sector Rotation Rankings */}
      <div style={{
        background: 'var(--bg-card-glass)',
        border: '1px solid var(--border-color)',
        borderRadius: '16px',
        padding: '24px',
        overflow: 'hidden'
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px' }}>
          Smart Money Allocation rankings
        </h3>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '700' }}>SECTOR</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '700' }}>ROTATION ZONE</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '700', textAlign: 'right' }}>PRICE CHANGE</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '700', textAlign: 'right' }}>OI CHANGE</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '700', textAlign: 'center' }}>SMART MONEY INDEX</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '700' }}>TOP DRIVING ASSET</th>
              </tr>
            </thead>
            <tbody>
              {sectors.map((item, idx) => {
                const isSelected = selectedSector && selectedSector.sector === item.sector;
                const qStyle = getQuadrantStyle(item.quadrant);
                return (
                  <tr 
                    key={idx}
                    onClick={() => handleSectorClick(item.sector)}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.02)',
                      background: isSelected ? 'rgba(0, 255, 136, 0.03)' : 'transparent',
                      cursor: 'pointer',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.01)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <td style={{ padding: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>
                      {item.sector}
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '700',
                        background: qStyle.bg,
                        color: qStyle.text,
                        border: `1px solid ${qStyle.border}`
                      }}>
                        {item.quadrant}
                      </span>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right', fontWeight: '700', color: item.priceChange >= 0 ? '#00ff88' : '#ff4444' }}>
                      {item.priceChange >= 0 ? '+' : ''}{item.priceChange}%
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right', fontWeight: '700', color: item.oiChange >= 0 ? '#00ff88' : '#ff4444' }}>
                      {item.oiChange >= 0 ? '+' : ''}{item.oiChange}%
                    </td>
                    <td style={{ padding: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '130px' }}>
                        <span style={{ fontSize: '12px', fontWeight: '700', minWidth: '24px' }}>{item.flowIndex}</span>
                        <div style={{ flexGrow: 1, background: 'rgba(255, 255, 255, 0.05)', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ 
                            background: `linear-gradient(90deg, ${qStyle.text} 0%, #00ff88 100%)`, 
                            height: '100%', 
                            width: `${item.flowIndex}%` 
                          }}></div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>{item.topStock}</span>
                        <span style={{ 
                          fontSize: '11px', 
                          fontWeight: '600',
                          color: item.topStockPerformance >= 0 ? '#00ff88' : '#ff4444' 
                        }}>
                          ({item.topStockPerformance >= 0 ? '+' : ''}{item.topStockPerformance}%)
                        </span>
                      </div>
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
