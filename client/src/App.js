import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar      from './components/Navbar';
import Markets     from './pages/Markets';
import Portfolio   from './pages/Portfolio';
import News        from './pages/News';
import Login       from './pages/Login';
import Watchlist   from './pages/Watchlist';
import Crypto      from './pages/Crypto';
import MutualFunds from './pages/MutualFunds';
import Tools       from './pages/Tools';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={
          <div className="min-h-screen bg-gray-950 text-white">
            <Navbar />
            <Routes>
              <Route path="/"          element={<Markets />}     />
              <Route path="/news"      element={<News />}        />
              <Route path="/crypto"    element={<Crypto />}      />
              <Route path="/mf"        element={<MutualFunds />} />
              <Route path="/tools"     element={<Tools />}       />
              <Route path="/portfolio" element={
                <ProtectedRoute><Portfolio /></ProtectedRoute>
              } />
              <Route path="/watchlist" element={
                <ProtectedRoute><Watchlist /></ProtectedRoute>
              } />
            </Routes>
          </div>
        } />
      </Routes>
    </Router>
  );
}

export default App;