import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import CandlestickBackground from './CandlestickBackground';

export default function Layout({ children }) {
  const [sidebarWidth, setSidebarWidth] = useState(260);
  
  useEffect(() => {
    const handleResize = () => {
      const sidebar = document.querySelector('.sidebar');
      if (sidebar) setSidebarWidth(sidebar.offsetWidth);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="layout">
      <CandlestickBackground />
      <Sidebar />
      <main className="main-content" style={{ marginLeft: sidebarWidth }}>
        {children}
      </main>
    </div>
  );
}