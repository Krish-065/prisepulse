import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import Sidebar from './Sidebar';
import CandlestickBg from './CandlestickBg';
import { Menu, Star, Briefcase, Coins, LineChart, Award, Search, Newspaper, Activity } from 'lucide-react';
import { apiClient } from '../services/api';

export default function Layout({ children }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [indices, setIndices] = useState({
    nifty: { value: '--', change: '--', percent: '--', up: true },
    sensex: { value: '--', change: '--', percent: '--', up: true },
    banknifty: { value: '--', change: '--', percent: '--', up: true },
  });
  const [marketStatus, setMarketStatus] = useState({ status: 'Closed', label: 'Loading status...', color: '#ff4444' });

  const navItems = [
    { path: '/watchlist', label: 'Watchlist', icon: <Star size={14} /> },
    { path: '/portfolio', label: 'Portfolio', icon: <Briefcase size={14} /> },
    { path: '/news', label: 'News Hub', icon: <Newspaper size={14} /> },
    { path: '/screener', label: 'Screener', icon: <Search size={14} /> },
    { path: '/crypto', label: 'Crypto', icon: <Coins size={14} /> },
    { path: '/commodities', label: 'Commodities', icon: <Activity size={14} /> },
    { path: '/ipos', label: 'IPOs', icon: <LineChart size={14} /> },
    { path: '/mutual-funds', label: 'Mutual Funds', icon: <Award size={14} /> },
  ];

  // Inject webkit scrollbar hiding style
  useEffect(() => {
    const styleId = 'layout-mobile-nav-style';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.innerHTML = `
        .mobile-navbar-hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  // Calculate market status based on Indian standard local time rules
  const updateMarketStatus = () => {
    const now = new Date();
    // Convert to IST offset if client is in different timezone
    // IST is UTC + 5:30.
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const istTime = new Date(utc + (3600000 * 5.5));
    
    const day = istTime.getDay(); // 0 = Sunday, 6 = Saturday
    const hours = istTime.getHours();
    const minutes = istTime.getMinutes();
    const timeInMins = hours * 60 + minutes;

    // Check if weekend
    if (day === 0 || day === 6) {
      setMarketStatus({ status: 'Closed', label: 'Markets Closed (Weekend)', color: '#ff4444' });
      return;
    }

    // pre-market: 9:00 AM to 9:15 AM (540 to 555 mins)
    if (timeInMins >= 540 && timeInMins < 555) {
      setMarketStatus({ status: 'Pre-Market', label: 'Pre-Market Session Active', color: '#00bcd4' });
      return;
    }
    // equity: 9:15 AM to 3:30 PM (555 to 930 mins)
    if (timeInMins >= 555 && timeInMins < 930) {
      setMarketStatus({ status: 'Open', label: 'Equity & F&O Markets Open', color: '#00ff88' });
      return;
    }
    // currency: 3:30 PM to 5:00 PM (930 to 1020 mins)
    if (timeInMins >= 930 && timeInMins < 1020) {
      setMarketStatus({ status: 'Open', label: 'Currency Derivatives Open', color: '#00ff88' });
      return;
    }
    // commodity: 5:00 PM to 11:30 PM (1020 to 1410 mins)
    if (timeInMins >= 1020 && timeInMins < 1410) {
      setMarketStatus({ status: 'Open', label: 'Commodities Market Open', color: '#ff9800' });
      return;
    }

    setMarketStatus({ status: 'Closed', label: 'Markets Closed', color: '#ff4444' });
  };

  const fetchIndices = async () => {
    try {
      const res = await apiClient.get('/market/indices').catch(() => null);
      if (res && res.data) {
        const d = res.data;
        setIndices({
          nifty: { 
            value: d['^NSEI']?.price ? d['^NSEI'].price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '--', 
            percent: d['^NSEI']?.changePercent ? d['^NSEI'].changePercent.toFixed(2) : '--', 
            up: (d['^NSEI']?.change || 0) >= 0 
          },
          sensex: { 
            value: d['^BSESN']?.price ? d['^BSESN'].price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '--', 
            percent: d['^BSESN']?.changePercent ? d['^BSESN'].changePercent.toFixed(2) : '--', 
            up: (d['^BSESN']?.change || 0) >= 0 
          },
          banknifty: { 
            value: d['^NSEBANK']?.price ? d['^NSEBANK'].price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '--', 
            percent: d['^NSEBANK']?.changePercent ? d['^NSEBANK'].changePercent.toFixed(2) : '--', 
            up: (d['^NSEBANK']?.change || 0) >= 0 
          },
        });
      }
    } catch (err) {
      console.error('Error fetching layout indices:', err);
    }
  };

  useEffect(() => {
    fetchIndices();
    updateMarketStatus();
    
    const interval = setInterval(() => {
      fetchIndices();
      updateMarketStatus();
    }, 1000);

    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) {
        setSidebarOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', position: 'relative', width: '100%', overflowX: 'hidden' }}>
      <CandlestickBg />
      
      {/* Mobile Header */}
      {isMobile && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '60px',
          background: 'rgba(10, 14, 39, 0.95)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(0, 255, 136, 0.15)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 20px',
          zIndex: 900,
          justifyContent: 'space-between'
        }}>
          <button 
            onClick={() => setSidebarOpen(true)} 
            style={{ background: 'transparent', border: 'none', color: '#00ff88', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
          >
            <Menu size={24} />
          </button>
          <span style={{ fontSize: '18px', fontWeight: 800, background: 'linear-gradient(135deg, #00ff88, #00bcd4)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
            NonStock
          </span>
          <div style={{ width: '24px' }}></div>
        </div>
      )}

      {/* Mobile Top Sub-Header Ticker */}
      {isMobile && (
        <div style={{
          position: 'fixed',
          top: '60px',
          left: 0,
          right: 0,
          height: '34px',
          background: 'rgba(10, 14, 39, 0.92)',
          backdropFilter: 'blur(8px)',
          borderBottom: '1px solid rgba(0, 255, 136, 0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 890,
          fontSize: '11px',
          fontWeight: 700,
          gap: '10px',
          padding: '0 12px'
        }}>
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: marketStatus.color,
            boxShadow: `0 0 6px ${marketStatus.color}`,
            animation: 'pulseStatus 2s infinite'
          }} />
          <span style={{ color: '#ffffff' }}>{marketStatus.status}</span>
          <span style={{ color: 'rgba(255, 255, 255, 0.15)' }}>|</span>
          <span style={{ color: indices.nifty.up ? '#00ff88' : '#ff4444' }}>
            NIFTY: {indices.nifty.value} ({indices.nifty.percent}%)
          </span>
        </div>
      )}

      {/* Mobile Top Navigation Bar */}
      {isMobile && (
        <div 
          className="mobile-navbar-hide-scrollbar"
          style={{
            position: 'fixed',
            top: '94px',
            left: 0,
            right: 0,
            height: '44px',
            background: 'rgba(10, 14, 39, 0.95)',
            backdropFilter: 'blur(8px)',
            borderBottom: '1px solid rgba(0, 255, 136, 0.12)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '0 16px',
            overflowX: 'auto',
            whiteSpace: 'nowrap',
            zIndex: 880,
            scrollbarWidth: 'none', // hide Firefox scrollbar
          }}
        >
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              style={({ isActive }) => ({
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                color: isActive ? '#00ff88' : '#9b9eac',
                textDecoration: 'none',
                borderRadius: '8px',
                background: isActive ? 'rgba(0, 255, 136, 0.08)' : 'transparent',
                border: isActive ? '1px solid rgba(0, 255, 136, 0.15)' : '1px solid transparent',
                fontSize: '12px',
                fontWeight: isActive ? '700' : '500',
                transition: 'all 0.2s',
                flexShrink: 0
              })}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      )}

      {/* Desktop Sticky Top Header Ticker */}
      {!isMobile && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: '260px',
          right: 0,
          height: '115px',
          background: 'rgba(10, 14, 39, 0.85)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(0, 255, 136, 0.12)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '14px 32px',
          zIndex: 800
        }}>
          {/* Row 1: Tickers & Status */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '36px' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.5px' }}>NIFTY 50</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '2px' }}>
                  <span style={{ fontSize: '16px', fontWeight: 800, letterSpacing: '-0.3px' }}>{indices.nifty.value}</span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: indices.nifty.up ? '#00ff88' : '#ff4444' }}>
                    {indices.nifty.up ? '▲' : '▼'} {indices.nifty.percent}%
                  </span>
                </div>
              </div>

              <div style={{ width: '1px', height: '28px', background: 'rgba(255, 255, 255, 0.08)' }}></div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.5px' }}>SENSEX</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '2px' }}>
                  <span style={{ fontSize: '16px', fontWeight: 800, letterSpacing: '-0.3px' }}>{indices.sensex.value}</span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: indices.sensex.up ? '#00ff88' : '#ff4444' }}>
                    {indices.sensex.up ? '▲' : '▼'} {indices.sensex.percent}%
                  </span>
                </div>
              </div>

              <div style={{ width: '1px', height: '28px', background: 'rgba(255, 255, 255, 0.08)' }}></div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.5px' }}>BANK NIFTY</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '2px' }}>
                  <span style={{ fontSize: '16px', fontWeight: 800, letterSpacing: '-0.3px' }}>{indices.banknifty.value}</span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: indices.banknifty.up ? '#00ff88' : '#ff4444' }}>
                    {indices.banknifty.up ? '▲' : '▼'} {indices.banknifty.percent}%
                  </span>
                </div>
              </div>
            </div>

            {/* Market Status Info Block */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px', 
              background: 'rgba(255, 255, 255, 0.02)', 
              padding: '6px 14px', 
              borderRadius: '20px', 
              border: '1px solid rgba(255, 255, 255, 0.06)' 
            }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: marketStatus.color,
                display: 'inline-block',
                boxShadow: `0 0 10px ${marketStatus.color}`,
                animation: 'pulseStatus 2s infinite'
              }} />
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>
                {marketStatus.label}
              </span>
            </div>
          </div>

          {/* Row 2: Desktop Top Navbar */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            background: 'rgba(255, 255, 255, 0.02)',
            padding: '4px 8px',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            alignSelf: 'flex-start',
            marginTop: '8px'
          }}>
            {navItems.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  color: isActive ? '#00ff88' : '#9b9eac',
                  textDecoration: 'none',
                  borderRadius: '8px',
                  background: isActive ? 'rgba(0, 255, 136, 0.08)' : 'transparent',
                  border: isActive ? '1px solid rgba(0, 255, 136, 0.15)' : '1px solid transparent',
                  fontSize: '13px',
                  fontWeight: isActive ? '700' : '500',
                  transition: 'all 0.2s'
                })}
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        </div>
      )}

      {/* Sidebar */}
      <Sidebar isMobile={isMobile} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Backdrop for Mobile Drawer */}
      {isMobile && sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 950
          }}
        />
      )}

      <main style={{ 
        flex: 1, 
        padding: isMobile ? '154px 16px 24px 16px' : '139px 24px 24px 24px', 
        marginLeft: isMobile ? '0' : '260px', 
        transition: 'all 0.3s ease', 
        background: 'transparent', 
        position: 'relative', 
        zIndex: 1,
        width: '100%',
        boxSizing: 'border-box'
      }}>
        <div style={{ 
          maxWidth: '1360px', 
          margin: '0 auto', 
          width: '100%',
          boxSizing: 'border-box'
        }}>
          {children}
        </div>
      </main>
    </div>
  );
}