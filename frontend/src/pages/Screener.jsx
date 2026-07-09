import { useState, useEffect, useMemo } from 'react';
import { apiClient } from '../services/api';
import { Search, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';

const SECTORS = ['All', 'IT', 'Banking', 'NBFC', 'Insurance', 'Oil & Gas', 'Auto', 'Auto Anc',
  'Pharma', 'Healthcare', 'FMCG', 'Metals', 'Mining', 'Cement', 'Power', 'Finance',
  'Infra', 'Real Estate', 'Defence', 'Capital Goods', 'Telecom', 'Consumer',
  'Retail', 'Tech', 'Travel', 'Aviation', 'Chemicals', 'Cap Goods', 'Logistics', 'Other'];

const colorFor = (val) => {
  const v = parseFloat(val);
  if (v > 0) return '#00ff88';
  if (v < 0) return '#ff3366';
  return '#9b9eac';
};

export default function Screener() {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [moverFilter, setMoverFilter] = useState('all');   // all | gainers | losers
  const [sectorFilter, setSectorFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [sortKey, setSortKey] = useState('changePercent');
  const [sortDir, setSortDir] = useState('desc');

  const fetchStocks = async () => {
    try {
      const res = await apiClient.get('/market/stock-list');
      setStocks(res.data || []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStocks();
    const interval = setInterval(fetchStocks, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const filtered = useMemo(() => {
    let result = [...stocks];

    // Text search on symbol or name
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(s => 
        s.symbol.toLowerCase().includes(q) || 
        (s.name || '').toLowerCase().includes(q) || 
        (s.sector || '').toLowerCase().includes(q)
      );
    }

    // Sector filter
    if (sectorFilter !== 'All') {
      result = result.filter(s => s.sector === sectorFilter);
    }

    // Gainer/loser filter
    if (moverFilter === 'gainers') result = result.filter(s => parseFloat(s.changePercent) > 0);
    if (moverFilter === 'losers')  result = result.filter(s => parseFloat(s.changePercent) < 0);

    // Sort
    result.sort((a, b) => {
      const av = parseFloat(a[sortKey]) || 0;
      const bv = parseFloat(b[sortKey]) || 0;
      return sortDir === 'asc' ? av - bv : bv - av;
    });

    return result;
  }, [stocks, search, sectorFilter, moverFilter, sortKey, sortDir]);

  const SortHeader = ({ label, field }) => (
    <th
      onClick={() => handleSort(field)}
      style={{ cursor: 'pointer', userSelect: 'none', color: sortKey === field ? '#00ff88' : '#9b9eac', whiteSpace: 'nowrap' }}
    >
      {label} {sortKey === field ? (sortDir === 'asc' ? '↑' : '↓') : ''}
    </th>
  );

  const fmtVol = (v) => {
    if (!v) return '—';
    const n = parseFloat(v);
    if (n >= 1e7) return (n / 1e7).toFixed(1) + 'Cr';
    if (n >= 1e5) return (n / 1e5).toFixed(1) + 'L';
    return (n / 1000).toFixed(0) + 'K';
  };

  return (
    <div style={{ paddingBottom: '40px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ margin: 0, backgroundImage: 'linear-gradient(135deg, #00ff88, #00bcd4)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent', color: 'transparent' }}>
            Stock Screener
          </h1>
          <p style={{ color: '#9b9eac', margin: '4px 0 0 0', fontSize: '14px' }}>
            {loading ? 'Loading...' : `${filtered.length} stocks from ${stocks.length} total — NSE India`}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className="live-badge">LIVE</span>
          {lastUpdated && <span style={{ fontSize: '12px', color: '#9b9eac' }}>Updated: {lastUpdated.toLocaleTimeString()}</span>}
          <button
            onClick={fetchStocks}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 14px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', cursor: 'pointer', color: '#e1e3e6', fontSize: '12px', fontWeight: 600, transition: 'all 0.2s' }}
          >
            <RefreshCw size={12} /> Refresh
          </button>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '16px', alignItems: 'center' }}>
        {/* Search */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', color: '#9b9eac' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by symbol or sector..."
            style={{ padding: '9px 14px 9px 36px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#ffffff', fontSize: '14px', outline: 'none', width: '240px', transition: 'border 0.2s' }}
            onFocus={e => e.target.style.borderColor = '#00ff88'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
          />
        </div>

        {/* Gainer / Loser Filter */}
        {[{ label: 'All', value: 'all' }, { label: 'Gainers', value: 'gainers', icon: <TrendingUp size={14} /> }, { label: 'Losers', value: 'losers', icon: <TrendingDown size={14} /> }].map(f => (
          <button
            key={f.value}
            onClick={() => setMoverFilter(f.value)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: moverFilter === f.value ? (f.value === 'losers' ? 'rgba(255,51,102,0.15)' : 'rgba(0,255,136,0.15)') : 'rgba(255,255,255,0.04)', border: `1px solid ${moverFilter === f.value ? (f.value === 'losers' ? '#ff3366' : '#00ff88') : 'rgba(255,255,255,0.1)'}`, borderRadius: '8px', color: moverFilter === f.value ? (f.value === 'losers' ? '#ff3366' : '#00ff88') : '#e1e3e6', fontSize: '13px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
          >
            {f.icon}
            {f.label}
          </button>
        ))}
      </div>

      {/* Sector scroll pills */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
        {SECTORS.map(sec => (
          <button
            key={sec}
            onClick={() => setSectorFilter(sec)}
            style={{ padding: '5px 12px', background: sectorFilter === sec ? 'rgba(0,188,212,0.15)' : 'rgba(255,255,255,0.03)', border: `1px solid ${sectorFilter === sec ? '#00bcd4' : 'rgba(255,255,255,0.07)'}`, borderRadius: '20px', color: sectorFilter === sec ? '#00bcd4' : '#9b9eac', fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap' }}
          >
            {sec}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#00ff88', fontSize: '18px' }}>Loading market data...</div>
      ) : (
        <div style={{ overflowX: 'auto', borderRadius: '12px', background: '#0a0e27', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', whiteSpace: 'nowrap' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '2px solid rgba(0,255,136,0.15)' }}>
                <th style={{ padding: '14px 12px', textAlign: 'left', color: '#9b9eac', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Company</th>
                <th style={{ padding: '14px 12px', textAlign: 'left', color: '#9b9eac', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sector</th>
                <SortHeader label="Price (₹)" field="price" />
                <SortHeader label="1D %" field="changePercent" />
                <SortHeader label="High" field="dayHigh" />
                <SortHeader label="Low" field="dayLow" />
                <SortHeader label="Volume" field="volume" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#9b9eac' }}>
                    No stocks found matching your filters.
                  </td>
                </tr>
              ) : filtered.map((s) => {
                const chg = parseFloat(s.changePercent);
                return (
                  <tr
                    key={s.symbol}
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.15s' }}
                    onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.025)'}
                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '13px 12px' }}>
                      <strong style={{ color: '#ffffff', fontSize: '14px' }}>{s.symbol}</strong>
                      <div style={{ fontSize: '11px', color: '#787b86', marginTop: '2px' }}>NSE</div>
                    </td>
                    <td style={{ padding: '13px 12px' }}>
                      <span style={{ padding: '3px 8px', background: 'rgba(0,188,212,0.08)', border: '1px solid rgba(0,188,212,0.15)', borderRadius: '12px', fontSize: '11px', color: '#00bcd4', fontWeight: 600 }}>
                        {s.sector || 'Other'}
                      </span>
                    </td>
                    <td style={{ padding: '13px 12px', color: '#ffffff', fontWeight: 600 }}>₹{s.price}</td>
                    <td style={{ padding: '13px 12px', fontWeight: 700, color: colorFor(s.changePercent) }}>
                      {chg > 0 ? '+' : ''}{s.changePercent}%
                    </td>
                    <td style={{ padding: '13px 12px', color: '#e1e3e6' }}>₹{s.dayHigh || '—'}</td>
                    <td style={{ padding: '13px 12px', color: '#e1e3e6' }}>₹{s.dayLow || '—'}</td>
                    <td style={{ padding: '13px 12px', color: '#9b9eac' }}>{fmtVol(s.volume)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}