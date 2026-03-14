import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar     from './components/Navbar';
import Markets    from './pages/Markets';
import Portfolio  from './pages/Portfolio';
import News       from './pages/News';
import Login      from './pages/Login';
import Watchlist  from './pages/Watchlist';
import Crypto      from './pages/Crypto';
import MutualFunds from './pages/MutualFunds';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={
          <div className="min-h-screen bg-gray-950 text-white">
            <Navbar />
            <Routes>
              <Route path="/"           element={<Markets />}   />
              <Route path="/portfolio"  element={<Portfolio />} />
              <Route path="/news"       element={<News />}      />
              <Route path="/crypto" element={<Crypto />} />
              <Route path="/mf"     element={<MutualFunds />} />
              <Route path="/watchlist"  element={<Watchlist />} />
            </Routes>
          </div>
        } />
      </Routes>
    </Router>
  );
}

export default App;