import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function PublicRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#0a0e27',
        color: '#00ff88',
        fontFamily: "'Inter', sans-serif"
      }}>
        <div style={{
          border: '4px solid rgba(0, 255, 136, 0.1)',
          borderLeftColor: '#00ff88',
          borderRadius: '50%',
          width: '45px',
          height: '45px',
          animation: 'spin 1s linear infinite',
          marginBottom: '16px'
        }} />
        <div style={{ fontSize: '15px', fontWeight: '600', letterSpacing: '0.5px' }}>Loading NonStock...</div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return user ? <Navigate to="/dashboard" replace /> : children;
}
