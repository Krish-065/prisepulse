import { Link } from 'react-router-dom';
import CandlestickBackground from '../components/CandlestickBackground';

export default function Landing() {
  return (
    <>
      <CandlestickBackground />
      
      {/* Animated Background */}
      <div className="landing-bg"></div>
      <div className="animated-bg"></div>
      <div className="particle-bg">{Array(40).fill().map((_, i) => <div key={i} className="particle"></div>)}</div>
      <div className="grid-overlay"></div>

      {/* Market Ticker */}
      <div className="ticker-premium">
        <div className="ticker-scroll">
          <div className="ticker-item">📈 NIFTY 50 22,450.75 <span className="up">+0.83%</span></div>
          <div className="ticker-item">📊 SENSEX 73,985.32 <span className="up">+0.70%</span></div>
          <div className="ticker-item">🏦 BANK NIFTY 48,234.15 <span className="down">-0.32%</span></div>
          <div className="ticker-item">🪙 BTC/INR 78,02,643 <span className="up">+2.87%</span></div>
        </div>
      </div>

      <div className="landing-container">
        <div className="landing-content">
          {/* Hero Section */}
          <div className="hero-section">
            <div className="hero-badge">🚀 POWERED BY AI</div>
            <h1 className="hero-title">Trade Smarter with <span className="gradient-text">PricePulse</span></h1>
            <p className="hero-subtitle">Professional trading platform with real-time market data, advanced charts, and AI-powered insights.</p>
            <div className="hero-buttons">
              <Link to="/register" className="btn-primary-hero">Get Started →</Link>
              <Link to="/login" className="btn-secondary-hero">Sign In</Link>
            </div>
          </div>

          {/* Features Grid */}
          <div className="features-section">
            <h2 className="section-title">Everything you need in one platform</h2>
            <div className="features-grid">
              {[
                { icon: '📈', title: 'Live Market Data', desc: 'Real-time NSE/BSE indices and global markets' },
                { icon: '📊', title: 'Advanced Charts', desc: 'Candlestick charts with technical indicators' },
                { icon: '🎮', title: 'Paper Trading', desc: 'Practice with ₹1,00,000 virtual money' },
                { icon: '📁', title: 'Portfolio Tracker', desc: 'Track your investments in real-time' },
                { icon: '🔔', title: 'Price Alerts', desc: 'Get notified when stocks hit your target' },
                { icon: '🧮', title: 'Financial Calculators', desc: 'SIP, EMI, Brokerage, and more' }
              ].map((f, i) => (
                <div key={i} className="feature-card">
                  <div className="feature-icon">{f.icon}</div>
                  <h3>{f.title}</h3>
                  <p>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Stats Section */}
          <div className="stats-section">
            {[
              { number: '10K+', label: 'Active Users' },
              { number: '₹2.4T', label: 'Daily Volume' },
              { number: '2,156', label: 'Stocks Listed' },
              { number: '99.9%', label: 'Uptime' }
            ].map((s, i) => (
              <div key={i} className="stat-item">
                <div className="stat-number">{s.number}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          {/* CTA Section */}
          <div className="cta-section">
            <h2>Ready to start trading?</h2>
            <p>Join PricePulse today and take control of your financial future</p>
            <Link to="/register" className="btn-cta">Create Free Account →</Link>
          </div>
        </div>
      </div>
    </>
  );
}