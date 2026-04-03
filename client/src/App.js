import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar    from './components/Navbar';
import Markets   from './pages/Markets';
import News      from './pages/News';
import Crypto    from './pages/Crypto';
import MutualFunds from './pages/MutualFunds';
import Portfolio from './pages/Portfolio';
import Watchlist from './pages/Watchlist';
import Tools     from './pages/Tools';
import Login     from './pages/Login';
import IPO       from './pages/IPO';
import Screener  from './pages/Screener';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-950 text-white">
        <Navbar />
        <Routes>
          <Route path="/"          element={<Markets   />} />
          <Route path="/news"      element={<News      />} />
          <Route path="/crypto"    element={<Crypto    />} />
          <Route path="/mf"        element={<MutualFunds />} />
          <Route path="/ipo"       element={<IPO       />} />
          <Route path="/screener"  element={<Screener  />} />
          <Route path="/watchlist" element={<Watchlist />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/tools"     element={<Tools     />} />
          <Route path="/login"     element={<Login     />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;