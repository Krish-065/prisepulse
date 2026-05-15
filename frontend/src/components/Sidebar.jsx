import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

export default function Sidebar() {
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(true);

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/markets', label: 'Markets', icon: '🌍' },
    { path: '/news', label: 'News', icon: '📰' },
    { path: '/crypto', label: 'Crypto', icon: '🪙' },
    { path: '/mutual-funds', label: 'Mutual Funds', icon: '💰' },
    { path: '/ipos', label: 'IPO', icon: '📈' },
    { path: '/screener', label: 'Screener', icon: '🔍' },
    { path: '/watchlist', label: 'Watchlist', icon: '⭐' },
    { path: '/portfolio', label: 'Portfolio', icon: '📁' },
    { path: '/tools', label: 'Tools', icon: '🧮' },
  ];

  return (
    <>
      <button className={`sidebar-toggle ${isOpen ? 'open' : 'closed'}`} onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? '◀' : '▶'}
      </button>
      <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-logo">
          <span className="logo-icon">📈</span>
          {isOpen && <span className="logo-text">PrisePulse</span>}
        </div>
        <nav className="sidebar-nav">
          {menuItems.map(item => (
            <NavLink key={item.path} to={item.path} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <span className="sidebar-icon">{item.icon}</span>
              {isOpen && <span className="sidebar-label">{item.label}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button onClick={toggleTheme} className="theme-btn">
            {theme === 'dark' ? (isOpen ? '☀️ Light' : '☀️') : (isOpen ? '🌙 Dark' : '🌙')}
          </button>
          <button onClick={logout} className="logout-btn-sidebar">
            {isOpen ? '🚪 Logout' : '🚪'}
          </button>
        </div>
      </aside>

      <style>{`
        .sidebar-toggle {
          position: fixed;
          left: ${isOpen ? '260px' : '70px'};
          top: 20px;
          z-index: 110;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 20px;
          padding: 6px 10px;
          cursor: pointer;
          transition: left 0.3s;
          color: var(--text-primary);
        }
        .sidebar {
          position: fixed;
          left: 0;
          top: 0;
          width: ${isOpen ? '260px' : '70px'};
          height: 100vh;
          background: var(--bg-card);
          border-right: 1px solid var(--border-color);
          transition: width 0.3s;
          display: flex;
          flex-direction: column;
          z-index: 100;
        }
        .sidebar-logo {
          padding: 24px 20px;
          font-size: 20px;
          font-weight: 700;
          border-bottom: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          gap: 10px;
          white-space: nowrap;
        }
        .sidebar-nav { flex: 1; padding: 20px 0; display: flex; flex-direction: column; gap: 4px; }
        .sidebar-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 20px;
          color: var(--text-secondary);
          text-decoration: none;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .sidebar-link:hover, .sidebar-link.active { background: rgba(0,255,136,0.1); color: #00ff88; }
        .sidebar-footer { padding: 20px; border-top: 1px solid var(--border-color); display: flex; flex-direction: column; gap: 10px; }
        .theme-btn, .logout-btn-sidebar { background: var(--bg-elevated); border: 1px solid var(--border-color); padding: 8px; border-radius: 8px; cursor: pointer; text-align: center; }
        @media (max-width: 768px) { .sidebar-toggle { display: none; } .sidebar { width: ${isOpen ? '260px' : '0'}; overflow: hidden; } }
      `}</style>
    </>
  );
}