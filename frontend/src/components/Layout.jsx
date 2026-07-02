import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import CandlestickBg from './CandlestickBg';
import { Menu } from 'lucide-react';

export default function Layout({ children }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) {
        setSidebarOpen(false); // Close mobile drawer when resizing back to desktop
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', position: 'relative', width: '100%', overflowX: 'hidden' }}>
      <CandlestickBg />
      
      {/* Mobile Top Navigation Header */}
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
            PricePulse
          </span>
          <div style={{ width: '24px' }}></div> {/* Spacer to keep title centered */}
        </div>
      )}

      {/* Sidebar navigation */}
      <Sidebar isMobile={isMobile} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Mobile Drawer Overlay Backdrop */}
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

      {/* Main Content Area */}
      <main style={{ 
        flex: 1, 
        padding: isMobile ? '84px 16px 24px 16px' : '24px', 
        marginLeft: isMobile ? '0' : '260px', 
        transition: 'all 0.3s ease', 
        background: 'transparent', 
        position: 'relative', 
        zIndex: 1,
        width: '100%',
        boxSizing: 'border-box'
      }}>
        {/* Maximum centered width constraint matching Angel One container styles */}
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