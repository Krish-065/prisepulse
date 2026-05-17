import { useState, useEffect } from 'react';
import { apiClient } from '../services/api';
import SearchWithSuggestions from '../components/SearchWithSuggestions';

export default function Dashboard() {
  const [indices, setIndices] = useState({
    nifty: { value: '--', change: '--', percent: '--', up: true },
    sensex: { value: '--', change: '--', percent: '--', up: true },
    banknifty: { value: '--', change: '--', percent: '--', up: true },
    niftyit: { value: '--', change: '--', percent: '--', up: true },
  });
  const [topGainers, setTopGainers] = useState([]);
  const [topLosers, setTopLosers] = useState([]);
  const [crypto, setCrypto] = useState([]);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    fetchIndices();
    fetchMovers();
    fetchCrypto();
    fetchNews();
    const interval = setInterval(() => {
      fetchIndices();
      fetchMovers();
      fetchCrypto();
    }, 15000);
    const timeInt = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => {
      clearInterval(interval);
      clearInterval(timeInt);
    };
  }, []);

  const fetchIndices = async () => {
    try {
      const res = await apiClient.get('/market/indices');
      const d = res.data;
      setIndices({
        nifty: { value: d['^NSEI']?.price?.toFixed(2) || '--', change: d['^NSEI']?.change?.toFixed(2) || '--', percent: d['^NSEI']?.changePercent?.toFixed(2) || '--', up: (d['^NSEI']?.change || 0) >= 0 },
        sensex: { value: d['^BSESN']?.price?.toFixed(2) || '--', change: d['^BSESN']?.change?.toFixed(2) || '--', percent: d['^BSESN']?.changePercent?.toFixed(2) || '--', up: (d['^BSESN']?.change || 0) >= 0 },
        banknifty: { value: d['^NSEBANK']?.price?.toFixed(2) || '--', change: d['^NSEBANK']?.change?.toFixed(2) || '--', percent: d['^NSEBANK']?.changePercent?.toFixed(2) || '--', up: (d['^NSEBANK']?.change || 0) >= 0 },
        niftyit: { value: d['^CNXIT']?.price?.toFixed(2) || '--', change: d['^CNXIT']?.change?.toFixed(2) || '--', percent: d['^CNXIT']?.changePercent?.toFixed(2) || '--', up: (d['^CNXIT']?.change || 0) >= 0 },
      });
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const fetchMovers = async () => {
    try {
      const res = await apiClient.get('/market/movers');
      setTopGainers(res.data.gainers || []);
      setTopLosers(res.data.losers || []);
    } catch (err) { console.error(err); }
  };

  const fetchCrypto = async () => {
    try {
      const res = await apiClient.get('/market/crypto');
      setCrypto(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error(err); setCrypto([]); }
  };

  const fetchNews = async () => {
    try {
      const res = await apiClient.get('/market/news');
      setNews(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error(err); setNews([]); }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '40px' }}>Loading market data...</div>;

  return (
    <div>
      <div className="welcome-section">
        <div><h1>Dashboard</h1><p>{currentTime.toLocaleDateString()} {currentTime.toLocaleTimeString()} IST</p></div>
      </div>
      <SearchWithSuggestions onSelect={(stock) => window.location.href = `/markets?symbol=${stock.symbol}`} placeholder="Search any stock..." className="global-search" />
      <div className="indices-grid">
        <div className="index-card"><div className="index-name">NIFTY 50</div><div className="index-value">{indices.nifty.value}</div><div className={`index-change ${indices.nifty.up ? 'positive' : 'negative'}`}>{indices.nifty.change} ({indices.nifty.percent}%)</div></div>
        <div className="index-card"><div className="index-name">SENSEX</div><div className="index-value">{indices.sensex.value}</div><div className={`index-change ${indices.sensex.up ? 'positive' : 'negative'}`}>{indices.sensex.change} ({indices.sensex.percent}%)</div></div>
        <div className="index-card"><div className="index-name">BANK NIFTY</div><div className="index-value">{indices.banknifty.value}</div><div className={`index-change ${indices.banknifty.up ? 'positive' : 'negative'}`}>{indices.banknifty.change} ({indices.banknifty.percent}%)</div></div>
        <div className="index-card"><div className="index-name">NIFTY IT</div><div className="index-value">{indices.niftyit.value}</div><div className={`index-change ${indices.niftyit.up ? 'positive' : 'negative'}`}>{indices.niftyit.change} ({indices.niftyit.percent}%)</div></div>
      </div>
      <div className="two-column">
        <div className="left-column">
          <div className="section-card"><div className="section-header"><h2>📈 Top Gainers</h2><span className="live-badge">LIVE</span></div><div className="movers-list">{topGainers.map((s,i) => <div key={i} className="mover-item"><span>{s.symbol}</span><span>₹{s.price}</span><span className="positive">{s.changePercent}%</span></div>)}</div></div>
          <div className="section-card"><div className="section-header"><h2>📉 Top Losers</h2><span className="live-badge">LIVE</span></div><div className="movers-list">{topLosers.map((s,i) => <div key={i} className="mover-item"><span>{s.symbol}</span><span>₹{s.price}</span><span className="negative">{s.changePercent}%</span></div>)}</div></div>
        </div>
        <div className="right-column">
          <div className="section-card"><div className="section-header"><h2>📰 Market News</h2><span className="live-badge">LIVE</span></div><div className="news-list">{news.map((n,i) => <a key={i} href={n.url} target="_blank" className="news-item"><span className="news-time">{n.time}</span><span className="news-title">{n.title}</span><span className="news-link">→</span></a>)}</div></div>
        </div>
      </div>
    </div>
  );
}