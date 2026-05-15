import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

export default function Sidebar() {
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/markets', label: 'Markets', icon: '🌍' },
    { path: '/screener', label: 'Screener', icon: '🔍' },
    { path: '/watchlist', label: 'Watchlist', icon: '⭐' },
    { path: '/portfolio', label: 'Portfolio', icon: '📁' },
    { path: '/trading', label: 'Paper Trading', icon: '🎮' },
    { path: '/ipos', label: 'IPOs', icon: '📈' },
    { path: '/fno', label: 'F&O', icon: '📉' },
    { path: '/crypto', label: 'Crypto', icon: '🪙' },
    { path: '/news', label: 'News', icon: '📰' },
    { path: '/tools', label: 'Tools', icon: '🧮' },
  ];

  return (
    <aside style={{
      position: 'fixed',
      left: 0,
      top: 0,
      width: '260px',
      height: '100vh',
      background: 'rgba(19, 23, 34, 0.95)',
      backdropFilter: 'blur(10px)',
      borderRight: '1px solid rgba(0, 255, 136, 0.2)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 100,
      overflowY: 'auto'
    }}>
      <div style={{ padding: '24px 20px', fontSize: '20px', fontWeight: 700, borderBottom: '1px solid rgba(0, 255, 136, 0.2)' }}>
        <span style={{ background: 'linear-gradient(135deg, #00ff88, #00bcd4)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>PricePulse</span>
      </div>
      
      <nav style={{ flex: 1, padding: '20px 0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {menuItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 20px',
              color: isActive ? '#00ff88' : '#9b9eac',
              textDecoration: 'none',
              background: isActive ? 'rgba(0, 255, 136, 0.1)' : 'transparent',
              borderRight: isActive ? '3px solid #00ff88' : 'none'
            })}
          >
            <span style={{ fontSize: '18px' }}>{item.icon}</span>
            <span style={{ fontSize: '14px', fontWeight: 500 }}>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      
      <div style={{ padding: '20px', borderTop: '1px solid rgba(0, 255, 136, 0.2)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <button onClick={toggleTheme} style={{ padding: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(0,255,136,0.2)', borderRadius: '8px', color: 'white', cursor: 'pointer' }}>
          {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
        </button>
        <button onClick={logout} style={{ padding: '8px', background: 'rgba(255,68,68,0.2)', border: '1px solid rgba(255,68,68,0.3)', borderRadius: '8px', color: '#ff4444', cursor: 'pointer' }}>
          🚪 Logout
        </button>
      </div>
    </aside>
  );
}