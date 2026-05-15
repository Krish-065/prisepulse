import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <>
      {/* Animated Background */}
      <div className="landing-bg"></div>
      <div className="animated-bg"></div>
      <div className="particle-bg">{Array(40).fill().map((_, i) => <div key={i} className="particle"></div>)}</div>
      <div className="grid-overlay"></div>
      <div className="candlestick-pattern"></div>

      {/* Market Ticker */}
      <div className="ticker-premium">
        <div className="ticker-scroll">
          <div className="ticker-item"><span>📈 NIFTY 50</span><span>22,450.75</span><span className="up">+0.83%</span></div>
          <div className="ticker-item"><span>📊 SENSEX</span><span>73,985.32</span><span className="up">+0.70%</span></div>
          <div className="ticker-item"><span>🏦 BANK NIFTY</span><span>48,234.15</span><span className="down">-0.32%</span></div>
          <div className="ticker-item"><span>🪙 BTC/INR</span><span>78,02,643</span><span className="up">+2.87%</span></div>
          <div className="ticker-item"><span>💱 USD/INR</span><span>84.23</span><span className="up">+0.12%</span></div>
          <div className="ticker-item"><span>🥇 GOLD</span><span>72,450</span><span className="up">+0.45%</span></div>
        </div>
      </div>

      <div className="landing-container">
        <div className="landing-content">
          {/* Hero Section */}
          <div className="hero-section">
            <div className="hero-badge">🚀 POWERED BY AI</div>
            <h1 className="hero-title">
              Trade Smarter with
              <span className="gradient-text"> PricePulse</span>
            </h1>
            <p className="hero-subtitle">
              Professional trading platform with real-time market data, advanced charts,
              and AI-powered insights. Join thousands of traders who trust PricePulse.
            </p>
            <div className="hero-buttons">
              <Link to="/register" className="btn-primary-hero">Get Started →</Link>
              <Link to="/login" className="btn-secondary-hero">Sign In</Link>
            </div>
          </div>

          {/* Features Grid */}
          <div className="features-section">
            <h2 className="section-title">Everything you need in one platform</h2>
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">📈</div>
                <h3>Live Market Data</h3>
                <p>Real-time NSE/BSE indices, stocks, and global markets</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">📊</div>
                <h3>Advanced Charts</h3>
                <p>Candlestick charts with technical indicators</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">🎮</div>
                <h3>Paper Trading</h3>
                <p>Practice with ₹1,00,000 virtual money</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">📁</div>
                <h3>Portfolio Tracker</h3>
                <p>Track your investments in real-time</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">🔔</div>
                <h3>Price Alerts</h3>
                <p>Get notified when stocks hit your target</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">🧮</div>
                <h3>Financial Calculators</h3>
                <p>SIP, EMI, Brokerage, and more</p>
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div className="stats-section">
            <div className="stat-item">
              <div className="stat-number">10K+</div>
              <div className="stat-label">Active Users</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">₹2.4T</div>
              <div className="stat-label">Daily Volume</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">2,156</div>
              <div className="stat-label">Stocks Listed</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">99.9%</div>
              <div className="stat-label">Uptime</div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="cta-section">
            <h2>Ready to start trading?</h2>
            <p>Join PricePulse today and take control of your financial future</p>
            <Link to="/register" className="btn-cta">Create Free Account →</Link>
          </div>
        </div>
      </div>

      <style>{`
        /* Landing Page Styles */
        .landing-bg {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #0a0e27 100%);
          z-index: -3;
        }
        .animated-bg {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: radial-gradient(circle at 20% 50%, rgba(0, 255, 136, 0.05) 0%, transparent 50%);
          animation: pulseBg 8s ease-in-out infinite;
          z-index: -2;
        }
        @keyframes pulseBg {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.1); }
        }
        .particle-bg {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
          pointer-events: none;
          z-index: -1;
        }
        .particle {
          position: absolute;
          width: 2px;
          height: 2px;
          background: rgba(0, 255, 136, 0.3);
          border-radius: 50%;
          animation: float 10s infinite;
        }
        @keyframes float {
          0% { transform: translateY(0) translateX(0); opacity: 0; }
          20% { opacity: 0.5; }
          100% { transform: translateY(-100px) translateX(50px); opacity: 0; }
        }
        .grid-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-image: linear-gradient(rgba(0, 255, 136, 0.03) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(0, 255, 136, 0.03) 1px, transparent 1px);
          background-size: 30px 30px;
          pointer-events: none;
          z-index: -1;
        }
        .candlestick-pattern {
          position: fixed;
          bottom: 0;
          right: 0;
          width: 100%;
          height: 100%;
          opacity: 0.03;
          pointer-events: none;
          z-index: -1;
          background: repeating-linear-gradient(0deg, #00ff88 0px, #00ff88 2px, transparent 2px, transparent 20px);
        }
        .ticker-premium {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          background: rgba(10, 14, 39, 0.95);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(0, 255, 136, 0.2);
          padding: 6px 0;
          overflow: hidden;
          white-space: nowrap;
          z-index: 100;
        }
        .ticker-scroll {
          display: inline-flex;
          animation: scroll 30s linear infinite;
        }
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .ticker-item {
          display: inline-flex;
          gap: 12px;
          margin-right: 32px;
          font-size: 12px;
          align-items: center;
        }
        .up { color: #00ff88; }
        .down { color: #ff4444; }

        .landing-container {
          min-height: 100vh;
          padding-top: 80px;
          position: relative;
          z-index: 1;
        }
        .landing-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
        }

        /* Hero Section */
        .hero-section {
          text-align: center;
          padding: 60px 0;
        }
        .hero-badge {
          display: inline-block;
          background: rgba(0, 255, 136, 0.1);
          border: 1px solid rgba(0, 255, 136, 0.3);
          border-radius: 40px;
          padding: 6px 16px;
          font-size: 12px;
          color: #00ff88;
          margin-bottom: 24px;
        }
        .hero-title {
          font-size: 56px;
          font-weight: 800;
          margin-bottom: 24px;
          line-height: 1.2;
        }
        .gradient-text {
          background: linear-gradient(135deg, #00ff88, #00bcd4);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .hero-subtitle {
          font-size: 18px;
          color: #787b86;
          max-width: 600px;
          margin: 0 auto 32px;
          line-height: 1.6;
        }
        .hero-buttons {
          display: flex;
          gap: 16px;
          justify-content: center;
        }
        .btn-primary-hero {
          background: linear-gradient(135deg, #00ff88, #00bcd4);
          color: #0a0e27;
          padding: 12px 32px;
          border-radius: 40px;
          text-decoration: none;
          font-weight: 700;
          transition: 0.2s;
        }
        .btn-primary-hero:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(0, 255, 136, 0.3);
        }
        .btn-secondary-hero {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          padding: 12px 32px;
          border-radius: 40px;
          text-decoration: none;
          font-weight: 600;
          transition: 0.2s;
        }
        .btn-secondary-hero:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        /* Features Section */
        .features-section {
          padding: 60px 0;
        }
        .section-title {
          text-align: center;
          font-size: 32px;
          font-weight: 700;
          margin-bottom: 48px;
        }
        .features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }
        .feature-card {
          background: rgba(19, 23, 34, 0.9);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(0, 255, 136, 0.1);
          border-radius: 16px;
          padding: 32px 24px;
          text-align: center;
          transition: 0.2s;
        }
        .feature-card:hover {
          border-color: #00ff88;
          transform: translateY(-4px);
        }
        .feature-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }
        .feature-card h3 {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 12px;
        }
        .feature-card p {
          font-size: 13px;
          color: #787b86;
          line-height: 1.5;
        }

        /* Stats Section */
        .stats-section {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 32px;
          padding: 60px 0;
          text-align: center;
        }
        .stat-number {
          font-size: 36px;
          font-weight: 700;
          color: #00ff88;
          margin-bottom: 8px;
        }
        .stat-label {
          font-size: 14px;
          color: #787b86;
        }

        /* CTA Section */
        .cta-section {
          text-align: center;
          padding: 60px 0;
          background: rgba(0, 255, 136, 0.05);
          border-radius: 24px;
          margin: 40px 0;
        }
        .cta-section h2 {
          font-size: 32px;
          margin-bottom: 16px;
        }
        .cta-section p {
          color: #787b86;
          margin-bottom: 24px;
        }
        .btn-cta {
          display: inline-block;
          background: linear-gradient(135deg, #00ff88, #00bcd4);
          color: #0a0e27;
          padding: 14px 40px;
          border-radius: 40px;
          text-decoration: none;
          font-weight: 700;
          transition: 0.2s;
        }
        .btn-cta:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(0, 255, 136, 0.3);
        }

        /* Responsive */
        @media (max-width: 768px) {
          .hero-title { font-size: 36px; }
          .features-grid { grid-template-columns: 1fr; }
          .stats-section { grid-template-columns: repeat(2, 1fr); }
          .hero-buttons { flex-direction: column; align-items: center; }
        }
      `}</style>
    </>
  );
}