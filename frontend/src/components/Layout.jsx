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
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '24px', marginLeft: sidebarWidth, transition: 'margin-left 0.3s', background: 'var(--bg-primary)' }}>
        {children}
      </main>
    </div>
  );
}