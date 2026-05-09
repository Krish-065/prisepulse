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
import Login       from './pages/Login';
import IPO         from './pages/IPO';
import Screener    from './pages/Screener';
import StockDetail from './pages/StockDetail';
import CompareStocks from './pages/CompareStocks';
import PriceAlerts from './pages/PriceAlerts';
import Profile     from './pages/Profile';
import Calculators from './pages/Calculators';
import IPOTracker  from './pages/IPOTracker';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
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
          
          {/* New Routes */}
          <Route path="/stock/:symbol" element={<StockDetail />} />
          <Route path="/compare"   element={<CompareStocks />} />
          <Route path="/alerts"    element={<PriceAlerts />} />
          <Route path="/profile"   element={<Profile />} />
          <Route path="/calculators" element={<Calculators />} />
          <Route path="/ipotracker" element={<IPOTracker />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;