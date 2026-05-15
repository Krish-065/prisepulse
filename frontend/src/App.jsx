import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Portfolio from './pages/Portfolio';
import Watchlist from './pages/Watchlist';
import Trading from './pages/Trading';
import Screener from './pages/Screener';
import IPOs from './pages/IPOs';
import FnO from './pages/FnO';
import Markets from './pages/Markets';
import Tools from './pages/Tools';
import News from './pages/News';
import Crypto from './pages/Crypto';
import MutualFunds from './pages/MutualFunds';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Toaster position="top-right" />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/" element={<PrivateRoute><Layout><Dashboard /></Layout></PrivateRoute>} />
            <Route path="/dashboard" element={<PrivateRoute><Layout><Dashboard /></Layout></PrivateRoute>} />
            <Route path="/portfolio" element={<PrivateRoute><Layout><Portfolio /></Layout></PrivateRoute>} />
            <Route path="/watchlist" element={<PrivateRoute><Layout><Watchlist /></Layout></PrivateRoute>} />
            <Route path="/trading" element={<PrivateRoute><Layout><Trading /></Layout></PrivateRoute>} />
            <Route path="/screener" element={<PrivateRoute><Layout><Screener /></Layout></PrivateRoute>} />
            <Route path="/ipos" element={<PrivateRoute><Layout><IPOs /></Layout></PrivateRoute>} />
            <Route path="/fno" element={<PrivateRoute><Layout><FnO /></Layout></PrivateRoute>} />
            <Route path="/markets" element={<PrivateRoute><Layout><Markets /></Layout></PrivateRoute>} />
            <Route path="/tools" element={<PrivateRoute><Layout><Tools /></Layout></PrivateRoute>} />
            <Route path="/news" element={<PrivateRoute><Layout><News /></Layout></PrivateRoute>} />
            <Route path="/crypto" element={<PrivateRoute><Layout><Crypto /></Layout></PrivateRoute>} />
            <Route path="/mutual-funds" element={<PrivateRoute><Layout><MutualFunds /></Layout></PrivateRoute>} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;