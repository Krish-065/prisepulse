import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';

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
      <Sidebar />
      <main className="main-content" style={{ marginLeft: sidebarWidth }}>
        {children}
      </main>
      <style>{`
        .layout { display: flex; min-height: 100vh; }
        .main-content { flex: 1; padding: 24px; background: var(--bg-primary); transition: margin-left 0.3s; }
      `}</style>
    </div>
  );
}