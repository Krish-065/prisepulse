import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import PrivateRoute from './components/PrivateRoute';
import PublicRoute from './components/PublicRoute';
import Layout from './components/Layout';
import BubbleCursor from './components/BubbleCursor';

// Public pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// Protected pages (authenticated users only)
import Dashboard from './pages/Dashboard';
import Portfolio from './pages/Portfolio';
import Watchlist from './pages/Watchlist';
import Screener from './pages/Screener';
import IPOs from './pages/IPOs';
import FnO from './pages/FnO';
import SectorRotation from './pages/SectorRotation';
import StockDetail from './pages/StockDetail';

import Markets from './pages/Markets';
import Tools from './pages/Tools';
import News from './pages/News';
import Crypto from './pages/Crypto';
import MutualFunds from './pages/MutualFunds';
import Profile from './pages/Profile';

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <BubbleCursor />
          <Toaster position="top-right" />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<PublicRoute><Landing /></PublicRoute>} />
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
            <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
            <Route path="/reset-password" element={<PublicRoute><ResetPassword /></PublicRoute>} />

            {/* Protected Routes (require login) */}
            <Route path="/dashboard" element={<PrivateRoute><Layout><Dashboard /></Layout></PrivateRoute>} />
            <Route path="/portfolio" element={<PrivateRoute><Layout><Portfolio /></Layout></PrivateRoute>} />
            <Route path="/watchlist" element={<PrivateRoute><Layout><Watchlist /></Layout></PrivateRoute>} />
            <Route path="/screener" element={<PrivateRoute><Layout><Screener /></Layout></PrivateRoute>} />
            <Route path="/ipos" element={<PrivateRoute><Layout><IPOs /></Layout></PrivateRoute>} />
            <Route path="/fno" element={<PrivateRoute><Layout><FnO /></Layout></PrivateRoute>} />
            <Route path="/sector-rotation" element={<PrivateRoute><Layout><SectorRotation /></Layout></PrivateRoute>} />
            <Route path="/stock/:symbol" element={<PrivateRoute><Layout><StockDetail /></Layout></PrivateRoute>} />

            <Route path="/markets" element={<PrivateRoute><Layout><Markets /></Layout></PrivateRoute>} />
            <Route path="/tools" element={<PrivateRoute><Layout><Tools /></Layout></PrivateRoute>} />
            <Route path="/news" element={<PrivateRoute><Layout><News /></Layout></PrivateRoute>} />
            <Route path="/crypto" element={<PrivateRoute><Layout><Crypto /></Layout></PrivateRoute>} />
            <Route path="/mutual-funds" element={<PrivateRoute><Layout><MutualFunds /></Layout></PrivateRoute>} />
            <Route path="/profile" element={<PrivateRoute><Layout><Profile /></Layout></PrivateRoute>} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;