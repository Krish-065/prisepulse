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
  Award,
  Sparkles,
  MessageSquare,
  Users,
  Bell,
  Info
} from 'lucide-react';

export default function Sidebar({ isMobile, isOpen, onClose }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
    { path: '/markets', label: 'Markets', icon: <TrendingUp size={16} /> },
    { path: '/paper-trading', label: 'Paper Trading', icon: <LineChart size={16} /> },
    { path: '/strategy-lab', label: 'Strategy Lab', icon: <Sparkles size={16} /> },
    { path: '/ai-mentor', label: 'AI Mentor', icon: <MessageSquare size={16} /> },
    { path: '/alerts', label: 'Alerts Hub', icon: <Bell size={16} /> },
    { path: '/community', label: 'Community Hub', icon: <Users size={16} /> },
    { path: '/fno', label: 'Futures & Options', icon: <Activity size={16} /> },
    { path: '/sector-rotation', label: 'Sector Rotation', icon: <Compass size={16} /> },
    { path: '/tools', label: 'Tools', icon: <Calculator size={16} /> },
    { path: '/contact-us', label: 'Contact & About Us', icon: <Info size={16} /> },
    { path: '/profile', label: 'My Profile', icon: <User size={16} /> },
  ];

  // Dynamically append Upgrade Pro link for non-pro users
  if (user && !user.is_pro) {
    menuItems.push({
      path: '/upgrade-pro',
      label: 'Upgrade to Pro',
      icon: <Sparkles size={16} style={{ color: '#ffb300' }} />,
      isSpecial: true
    });
  }

  return (
    <aside style={{
      position: 'fixed',
      left: isMobile ? (isOpen ? '0' : '-260px') : '0',
      top: 0,
      width: '260px',
      height: '100vh',
      background: user?.is_pro ? 'rgba(14, 11, 4, 0.98)' : 'rgba(10, 14, 39, 0.98)',
      backdropFilter: 'blur(16px)',
      borderRight: user?.is_pro ? '1px solid rgba(255, 179, 0, 0.2)' : '1px solid rgba(0, 255, 136, 0.15)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 1000,
      transition: 'all 0.3s ease',
      boxShadow: isOpen ? '4px 0 24px rgba(0, 0, 0, 0.5)' : '4px 0 24px rgba(0, 0, 0, 0.3)'
    }}>
      <div style={{ 
        padding: '24px 20px', 
        borderBottom: `1px solid ${user?.is_pro ? 'rgba(255, 179, 0, 0.15)' : 'rgba(0, 255, 136, 0.15)'}`, 
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
            style={({ isActive }) => {
              const activeColor = item.isSpecial ? '#ffb300' : '#00ff88';
              const activeBg = item.isSpecial ? 'rgba(255, 179, 0, 0.08)' : 'rgba(0, 255, 136, 0.05)';
              const activeBorder = item.isSpecial ? '1px solid rgba(255, 179, 0, 0.3)' : '1px solid rgba(0, 255, 136, 0.15)';
              return {
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '8px 12px',
                color: isActive ? activeColor : (item.isSpecial ? '#ffb300' : '#9b9eac'),
                textDecoration: 'none',
                borderRadius: '10px',
                background: isActive ? activeBg : 'transparent',
                transition: 'all 0.2s',
                border: isActive ? activeBorder : (item.isSpecial ? '1px solid rgba(255, 179, 0, 0.15)' : '1px solid transparent'),
                animation: item.isSpecial && !isActive ? 'proPulse 2s infinite alternate' : 'none'
              };
            }}
          >
            {({ isActive }) => {
              const iconColor = item.isSpecial ? '#ffb300' : '#00ff88';
              const iconBg = isActive 
                ? (item.isSpecial ? 'rgba(255, 179, 0, 0.15)' : 'rgba(0, 255, 136, 0.12)') 
                : (item.isSpecial ? 'rgba(255, 179, 0, 0.04)' : 'rgba(255, 255, 255, 0.03)');
              const iconBorder = isActive
                ? `1px solid ${item.isSpecial ? 'rgba(255, 179, 0, 0.35)' : 'rgba(0, 255, 136, 0.25)'}`
                : `1px solid ${item.isSpecial ? 'rgba(255, 179, 0, 0.15)' : 'rgba(255, 255, 255, 0.08)'}`;
              return (
                <>
                  <span style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: iconBg,
                    border: iconBorder,
                    color: isActive ? iconColor : (item.isSpecial ? '#ffb300' : '#9b9eac'),
                    boxShadow: isActive ? `0 0 10px ${item.isSpecial ? 'rgba(255, 179, 0, 0.25)' : 'rgba(0, 255, 136, 0.2)'}` : 'none',
                    transition: 'all 0.2s'
                  }}>
                    {item.icon}
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: isActive ? '700' : '500', transition: 'all 0.2s' }}>{item.label}</span>
                </>
              );
            }}
          </NavLink>
        ))}
      </nav>
      
      <div style={{ 
        padding: '16px 12px', 
        borderTop: `1px solid ${user?.is_pro ? 'rgba(255, 179, 0, 0.15)' : 'rgba(0, 255, 136, 0.15)'}`, 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '8px' 
      }}>
        {user?.is_pro ? (
          <div className="pro-badge-glow" style={{ 
            padding: '8px 12px', 
            borderRadius: '8px', 
            background: 'linear-gradient(135deg, rgba(255, 179, 0, 0.15), rgba(255, 224, 130, 0.05))',
            border: '1px solid rgba(255, 179, 0, 0.4)',
            color: '#ffb300',
            fontSize: '11px',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginBottom: '8px',
            boxShadow: '0 0 15px rgba(255, 179, 0, 0.2)'
          }}>
            <Sparkles size={14} style={{ color: '#ffb300' }} />
            <span>NONSTOCK PRO MEMBER</span>
          </div>
        ) : (
          <div 
            onClick={() => window.location.href = '/upgrade-pro'}
            style={{ 
              padding: '10px 12px', 
              borderRadius: '8px', 
              background: 'rgba(255, 179, 0, 0.05)',
              border: '1px dashed rgba(255, 179, 0, 0.25)',
              color: '#d1c9b8',
              fontSize: '11px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              transition: 'all 0.2s',
              marginBottom: '8px'
            }}
            onMouseOver={(e) => { e.currentTarget.style.borderColor = '#ffb300'; e.currentTarget.style.background = 'rgba(255,179,0,0.1)'; }}
            onMouseOut={(e) => { e.currentTarget.style.borderColor = 'rgba(255,179,0,0.25)'; e.currentTarget.style.background = 'rgba(255,179,0,0.05)'; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, color: '#ffb300' }}>
              <Sparkles size={12} /> Unlock Pro Features
            </div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.45)', marginTop: '2px' }}>Get Option Greeks, Automated Bots & Signal alerts.</div>
          </div>
        )}

        <button 
          onClick={toggleTheme} 
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', color: 'white', cursor: 'pointer', fontSize: '12px', fontWeight: 600, transition: 'all 0.2s' }}
          onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = user?.is_pro ? 'rgba(255,179,0,0.3)' : 'rgba(0,255,136,0.3)'; }}
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