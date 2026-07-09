import { useState, useEffect } from 'react';
import { apiClient } from '../services/api';
import SearchWithSuggestions from '../components/SearchWithSuggestions';
import { TrendingUp, TrendingDown, Newspaper, Search, Activity, Briefcase } from 'lucide-react';

const IconContainer = ({ children, color }) => (
  <span style={{
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    background: `${color}15`,
    border: `1px solid ${color}30`,
    color: color,
    boxShadow: `0 0 10px ${color}12`,
    flexShrink: 0
  }}>
    {children}
  </span>
);

export default function Dashboard() {
  const [topGainers, setTopGainers] = useState([]);
  const [topLosers, setTopLosers] = useState([]);
  const [crypto, setCrypto] = useState([]);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    fetchMovers();
    fetchCrypto();
    fetchNews();
    
    const interval = setInterval(() => {
      fetchMovers();
      fetchCrypto();
    }, 1000);
    
    const timeInt = setInterval(() => setCurrentTime(new Date()), 1000);
    
    return () => {
      clearInterval(interval);
      clearInterval(timeInt);
    };
  }, []);

  const fetchMovers = async () => {
    try {
      const res = await apiClient.get('/market/movers');
      setTopGainers(res.data.gainers || []);
      setTopLosers(res.data.losers || []);
    } catch (err) { 
      console.error(err); 
    } finally {
      setLoading(false);
    }
  };

  const fetchCrypto = async () => {
    try {
      const res = await apiClient.get('/market/crypto');
      setCrypto(Array.isArray(res.data) ? res.data : []);
    } catch (err) { 
      console.error(err); 
      setCrypto([]); 
    }
  };

  const fetchNews = async () => {
    try {
      const res = await apiClient.get('/market/news');
      setNews(Array.isArray(res.data) ? res.data : []);
    } catch (err) { 
      console.error(err); 
      setNews([]); 
    }
  };

  if (loading) return <div className="loading">Loading market data...</div>;

  return (
    <div>
      <div className="welcome-section">
        <div>
          <h1>Dashboard</h1>
          <p>{currentTime.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} | {currentTime.toLocaleTimeString()} IST</p>
        </div>
      </div>
      
      <SearchWithSuggestions 
        onSelect={(stock) => window.location.href = `/markets?symbol=${stock.symbol}`} 
        placeholder="Search any stock (e.g. Reliance, TCS, Infosys)..." 
        className="global-search" 
      />

      {/* "What are you looking for today?" Intent Grid */}
      <div style={{ marginBottom: '40px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', color: '#ffffff' }}>What are you looking for today?</h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
          gap: '24px' 
        }}>
          {/* Stock Discovery */}
          <div 
            onClick={() => window.location.href = '/screener'}
            style={{ 
              background: 'var(--bg-card-glass)', 
              border: '1px solid rgba(0, 255, 136, 0.12)', 
              borderRadius: '16px', 
              padding: '24px 20px', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              transition: 'all 0.2s ease',
            }}
            onMouseOver={(e) => { 
              e.currentTarget.style.borderColor = '#00ff88'; 
              e.currentTarget.style.transform = 'translateY(-2px)'; 
              e.currentTarget.style.boxShadow = '0 8px 30px rgba(0, 255, 136, 0.15)'; 
            }}
            onMouseOut={(e) => { 
              e.currentTarget.style.borderColor = 'rgba(0, 255, 136, 0.12)'; 
              e.currentTarget.style.transform = 'translateY(0)'; 
              e.currentTarget.style.boxShadow = 'none'; 
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(0, 255, 136, 0.1)', border: '1px solid rgba(0, 255, 136, 0.25)', color: '#00ff88' }}>
              <Search size={22} />
            </span>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff' }}>Stock Discovery</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>Screen NSE stocks dynamically</div>
            </div>
          </div>

          {/* Option Chain */}
          <div 
            onClick={() => window.location.href = '/fno'}
            style={{ 
              background: 'var(--bg-card-glass)', 
              border: '1px solid rgba(0, 188, 212, 0.12)', 
              borderRadius: '16px', 
              padding: '24px 20px', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              transition: 'all 0.2s ease',
            }}
            onMouseOver={(e) => { 
              e.currentTarget.style.borderColor = '#00bcd4'; 
              e.currentTarget.style.transform = 'translateY(-2px)'; 
              e.currentTarget.style.boxShadow = '0 8px 30px rgba(0, 188, 212, 0.15)'; 
            }}
            onMouseOut={(e) => { 
              e.currentTarget.style.borderColor = 'rgba(0, 188, 212, 0.12)'; 
              e.currentTarget.style.transform = 'translateY(0)'; 
              e.currentTarget.style.boxShadow = 'none'; 
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(0, 188, 212, 0.1)', border: '1px solid rgba(0, 188, 212, 0.25)', color: '#00bcd4' }}>
              <Activity size={22} />
            </span>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff' }}>Option Chain</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>Analyze Call/Put open interest</div>
            </div>
          </div>

          {/* Interactive Analysis */}
          <div 
            onClick={() => window.location.href = '/markets'}
            style={{ 
              background: 'var(--bg-card-glass)', 
              border: '1px solid rgba(0, 255, 136, 0.12)', 
              borderRadius: '16px', 
              padding: '24px 20px', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              transition: 'all 0.2s ease',
            }}
            onMouseOver={(e) => { 
              e.currentTarget.style.borderColor = '#00ff88'; 
              e.currentTarget.style.transform = 'translateY(-2px)'; 
              e.currentTarget.style.boxShadow = '0 8px 30px rgba(0, 255, 136, 0.15)'; 
            }}
            onMouseOut={(e) => { 
              e.currentTarget.style.borderColor = 'rgba(0, 255, 136, 0.12)'; 
              e.currentTarget.style.transform = 'translateY(0)'; 
              e.currentTarget.style.boxShadow = 'none'; 
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(0, 255, 136, 0.1)', border: '1px solid rgba(0, 255, 136, 0.25)', color: '#00ff88' }}>
              <TrendingUp size={22} />
            </span>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff' }}>Interactive Charts</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>Analyze technical stock charts</div>
            </div>
          </div>

          {/* Track Portfolio */}
          <div 
            onClick={() => window.location.href = '/portfolio'}
            style={{ 
              background: 'var(--bg-card-glass)', 
              border: '1px solid rgba(0, 188, 212, 0.12)', 
              borderRadius: '16px', 
              padding: '24px 20px', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              transition: 'all 0.2s ease',
            }}
            onMouseOver={(e) => { 
              e.currentTarget.style.borderColor = '#00bcd4'; 
              e.currentTarget.style.transform = 'translateY(-2px)'; 
              e.currentTarget.style.boxShadow = '0 8px 30px rgba(0, 188, 212, 0.15)'; 
            }}
            onMouseOut={(e) => { 
              e.currentTarget.style.borderColor = 'rgba(0, 188, 212, 0.12)'; 
              e.currentTarget.style.transform = 'translateY(0)'; 
              e.currentTarget.style.boxShadow = 'none'; 
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(0, 188, 212, 0.1)', border: '1px solid rgba(0, 188, 212, 0.25)', color: '#00bcd4' }}>
              <Briefcase size={22} />
            </span>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff' }}>Track Portfolio</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>Manage holdings and net worth</div>
            </div>
          </div>
        </div>
      </div>

      <div className="two-column">
        <div className="left-column">
          <div className="section-card">
            <div className="section-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <IconContainer color="#00ff88"><TrendingUp size={16} /></IconContainer> Top Gainers
              </h2>
              <span className="live-badge">LIVE</span>
            </div>
            <div className="movers-list">
              {topGainers.map((s, i) => (
                <div key={i} className="mover-item">
                  <span>{s.symbol}</span>
                  <span>₹{s.price}</span>
                  <span className="positive">+{s.changePercent}%</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="section-card">
            <div className="section-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <IconContainer color="#ff3366"><TrendingDown size={16} /></IconContainer> Top Losers
              </h2>
              <span className="live-badge">LIVE</span>
            </div>
            <div className="movers-list">
              {topLosers.map((s, i) => (
                <div key={i} className="mover-item">
                  <span>{s.symbol}</span>
                  <span>₹{s.price}</span>
                  <span className="negative">{s.changePercent}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="right-column">
          <div className="section-card">
            <div className="section-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <IconContainer color="#00bcd4"><Newspaper size={16} /></IconContainer> Market News
              </h2>
              <span className="live-badge">LIVE</span>
            </div>
            <div className="news-list">
              {news.map((n, i) => (
                <a key={i} href={n.url} target="_blank" rel="noopener noreferrer" className="news-item">
                  <span className="news-time">{n.time}</span>
                  <span className="news-title">{n.title}</span>
                  <span className="news-link">→</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}