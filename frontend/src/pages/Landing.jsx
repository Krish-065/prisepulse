import { Link } from 'react-router-dom';
import { TrendingUp, BarChart3, Search, FolderClosed, Activity, Calculator } from 'lucide-react';

export default function Landing() {
  return (
    <>
      <div className="market-bg"></div>
      <div className="animated-bg"></div>
      <div className="particle-bg">{Array(40).fill().map((_, i) => <div key={i} className="particle"></div>)}</div>
      <div className="grid-overlay"></div>

      <div className="landing-container">
        <div className="landing-content">
          <div className="hero-section">
            <h1 className="hero-title">Trade Smarter with <span className="gradient-text">NonStock</span></h1>
            <p className="hero-subtitle" style={{ fontSize: '24px', fontWeight: '800', color: '#00ff88', textShadow: '0 0 15px rgba(0, 255, 136, 0.4)', letterSpacing: '0.5px', marginBottom: '32px' }}>Be Nonstop with NonStock.</p>
            <div className="hero-buttons">
              <Link to="/register" className="btn-primary-hero">Get Started →</Link>
              <Link to="/login" className="btn-secondary-hero">Sign In</Link>
            </div>
          </div>

          <div className="features-section">
            <h2 className="section-title">Everything you need in one platform</h2>
            <div className="features-grid">
              {[
                { icon: <TrendingUp size={36} style={{ color: '#00ff88' }} />, title: 'Live Market Data', desc: 'Real-time NSE/BSE indices and global markets' },
                { icon: <BarChart3 size={36} style={{ color: '#00bcd4' }} />, title: 'Advanced Charts', desc: 'Candlestick charts with technical indicators' },
                { icon: <Search size={36} style={{ color: '#00ff88' }} />, title: 'Stock Screener', desc: 'Filter stocks by 1D/1W/1M change and key metrics' },
                { icon: <FolderClosed size={36} style={{ color: '#00bcd4' }} />, title: 'Portfolio Tracker', desc: 'Track your investments in real-time' },
                { icon: <Activity size={36} style={{ color: '#00ff88' }} />, title: 'Futures & Options', desc: 'Analyze option chain open interest and Put-Call Ratio' },
                { icon: <Calculator size={36} style={{ color: '#00bcd4' }} />, title: 'Financial Calculators', desc: 'SIP, EMI, Brokerage, and more' }
              ].map((f, i) => (
                <div key={i} className="feature-card">
                  <div className="feature-icon" style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>{f.icon}</div>
                  <h3>{f.title}</h3>
                  <p>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>

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

          <div className="cta-section">
            <h2>Ready to start trading?</h2>
            <p>Join NonStock today and take control of your financial future</p>
            <Link to="/register" className="btn-cta">Create Free Account →</Link>
          </div>
        </div>
      </div>

      <style>{`
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
        .hero-section {
          text-align: center;
          padding: 60px 0;
        }
        .hero-badge {
          display: inline-block;
          background: rgba(0,255,136,0.1);
          border: 1px solid rgba(0,255,136,0.3);
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
          color: #9b9eac;
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
          box-shadow: 0 10px 25px rgba(0,255,136,0.3);
        }
        .btn-secondary-hero {
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.2);
          color: white;
          padding: 12px 32px;
          border-radius: 40px;
          text-decoration: none;
          font-weight: 600;
          transition: 0.2s;
        }
        .btn-secondary-hero:hover {
          background: rgba(255,255,255,0.2);
        }
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
          grid-template-columns: repeat(3,1fr);
          gap: 24px;
        }
        .feature-card {
          background: rgba(19,23,34,0.9);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(0,255,136,0.1);
          border-radius: 16px;
          padding: 32px 24px;
          text-align: center;
          transition: 0.2s;
        }
        .feature-card:hover {
          border-color: #00ff88;
          transform: translateY(-4px);
        }
        .feature-icon { margin-bottom: 16px; }
        .feature-card h3 { font-size: 18px; font-weight: 600; margin-bottom: 12px; }
        .feature-card p { font-size: 13px; color: #9b9eac; }
        .stats-section {
          display: grid;
          grid-template-columns: repeat(4,1fr);
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
          color: #9b9eac;
        }
        .cta-section {
          text-align: center;
          padding: 60px 0;
          background: rgba(0,255,136,0.05);
          border-radius: 24px;
          margin: 40px 0;
        }
        .cta-section h2 { font-size: 32px; margin-bottom: 16px; }
        .cta-section p { color: #9b9eac; margin-bottom: 24px; }
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
        .btn-cta:hover { transform: translateY(-2px); box-shadow: 0 10px 25px rgba(0,255,136,0.3); }
        @media (max-width: 768px) {
          .hero-title { font-size: 36px; }
          .features-grid { grid-template-columns: 1fr; }
          .stats-section { grid-template-columns: repeat(2,1fr); }
          .hero-buttons { flex-direction: column; align-items: center; }
        }
      `}</style>
    </>
  );
}
