import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading-screen">Loading...</div>;
  }

  // If not authenticated, redirect to Landing page (not Login)
  return user ? children : <Navigate to="/" />;
}