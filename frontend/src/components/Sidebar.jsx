import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import Logo from './Logo';
import { 
  LayoutDashboard, 
  TrendingUp, 
  Search, 
  Star, 
  Briefcase, 
  LineChart, 
  Coins, 
  Newspaper, 
  Calculator, 
  User, 
  Sun, 
  Moon, 
  LogOut,
  X,
  Activity,
  Compass,
  Award
} from 'lucide-react';

export default function Sidebar({ isMobile, isOpen, onClose }) {
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
    { path: '/markets', label: 'Markets', icon: <TrendingUp size={16} /> },
    { path: '/fno', label: 'Futures & Options', icon: <Activity size={16} /> },
    { path: '/sector-rotation', label: 'Sector Rotation', icon: <Compass size={16} /> },
    { path: '/screener', label: 'Screener', icon: <Search size={16} /> },
    { path: '/watchlist', label: 'Watchlist', icon: <Star size={16} /> },
    { path: '/portfolio', label: 'Portfolio', icon: <Briefcase size={16} /> },
    { path: '/ipos', label: 'IPOs', icon: <LineChart size={16} /> },
    { path: '/crypto', label: 'Crypto', icon: <Coins size={16} /> },
    { path: '/mutual-funds', label: 'Mutual Funds', icon: <Award size={16} /> },
    { path: '/news', label: 'News', icon: <Newspaper size={16} /> },
    { path: '/tools', label: 'Tools', icon: <Calculator size={16} /> },
    { path: '/profile', label: 'My Profile', icon: <User size={16} /> },
  ];

  return (
    <aside style={{
      position: 'fixed',
      left: isMobile ? (isOpen ? '0' : '-260px') : '0',
      top: 0,
      width: '260px',
      height: '100vh',
      background: 'rgba(10, 14, 39, 0.98)',
      backdropFilter: 'blur(16px)',
      borderRight: '1px solid rgba(0, 255, 136, 0.15)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 1000,
      transition: 'left 0.3s ease',
      boxShadow: isOpen ? '4px 0 24px rgba(0, 0, 0, 0.5)' : '4px 0 24px rgba(0, 0, 0, 0.3)'
    }}>
      <div style={{ 
        padding: '24px 20px', 
        borderBottom: '1px solid rgba(0, 255, 136, 0.15)', 
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Logo size={36} showName={true} showTagline={true} alignment="column" nameSize="20px" />
        {isMobile && (
          <button 
            onClick={onClose} 
            style={{ background: 'transparent', border: 'none', color: '#9b9eac', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            <X size={18} />
          </button>
        )}
      </div>
      
      <nav style={{ flex: 1, padding: '20px 12px', display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto' }}>
        {menuItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={isMobile ? onClose : undefined}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '8px 12px',
              color: isActive ? '#00ff88' : '#9b9eac',
              textDecoration: 'none',
              borderRadius: '10px',
              background: isActive ? 'rgba(0, 255, 136, 0.05)' : 'transparent',
              transition: 'all 0.2s',
              border: isActive ? '1px solid rgba(0, 255, 136, 0.15)' : '1px solid transparent'
            })}
          >
            {({ isActive }) => (
              <>
                <span style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: isActive ? 'rgba(0, 255, 136, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                  border: `1px solid ${isActive ? 'rgba(0, 255, 136, 0.25)' : 'rgba(255, 255, 255, 0.08)'}`,
                  color: isActive ? '#00ff88' : '#9b9eac',
                  boxShadow: isActive ? '0 0 10px rgba(0, 255, 136, 0.2)' : 'none',
                  transition: 'all 0.2s'
                }}>
                  {item.icon}
                </span>
                <span style={{ fontSize: '13px', fontWeight: isActive ? '700' : '500', transition: 'all 0.2s' }}>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
      
      <div style={{ padding: '16px 12px', borderTop: '1px solid rgba(0, 255, 136, 0.15)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button 
          onClick={toggleTheme} 
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', color: 'white', cursor: 'pointer', fontSize: '12px', fontWeight: 600, transition: 'all 0.2s' }}
          onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(0,255,136,0.3)'; }}
          onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}
        >
          {theme === 'dark' ? <><Sun size={14} style={{ color: '#00ff88' }} /> Light Mode</> : <><Moon size={14} style={{ color: '#00bcd4' }} /> Dark Mode</>}
        </button>
        <button 
          onClick={logout} 
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', background: 'rgba(255,68,68,0.05)', border: '1px solid rgba(255,68,68,0.15)', borderRadius: '8px', color: '#ff4444', cursor: 'pointer', fontSize: '12px', fontWeight: 600, transition: 'all 0.2s' }}
          onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,68,68,0.12)'; }}
          onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,68,68,0.05)'; }}
        >
          <LogOut size={14} /> Logout
        </button>
      </div>
    </aside>
  );
}