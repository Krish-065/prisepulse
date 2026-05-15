import { useState, useEffect } from 'react';
import { apiClient } from '../services/api';

export default function News() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await apiClient.get('/market/news');
        setNews(res.data);
      } catch (err) {
        console.error('News error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, []);

  if (loading) return <div className="loading">Loading news...</div>;

  return (
    <div className="news-page">
      <h1>Market News</h1>
      <p>Latest financial news from around the world</p>
      <div className="news-grid">
        {news.map((item, idx) => (
          <a key={idx} href={item.url} target="_blank" rel="noopener noreferrer" className="news-card">
            {item.image && <img src={item.image} alt={item.title} className="news-image" />}
            <div className="news-content">
              <div className="news-source">{item.source}</div>
              <h3 className="news-title">{item.title}</h3>
              <p className="news-description">{item.description?.slice(0, 120)}...</p>
              <div className="news-meta">{item.date} | {item.time}</div>
            </div>
          </a>
        ))}
      </div>
      <style>{`
        .news-page { padding: 20px; max-width: 1200px; margin: 0 auto; }
        .news-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px,1fr)); gap: 24px; margin-top: 24px; }
        .news-card { background: var(--bg-card); border-radius: 16px; overflow: hidden; text-decoration: none; color: inherit; border: 1px solid var(--border-color); transition: 0.2s; }
        .news-card:hover { transform: translateY(-4px); border-color: #00ff88; }
        .news-image { width: 100%; height: 180px; object-fit: cover; }
        .news-content { padding: 16px; }
        .news-source { font-size: 12px; color: #00ff88; margin-bottom: 8px; }
        .news-title { font-size: 16px; font-weight: 600; margin-bottom: 8px; }
        .news-description { font-size: 13px; color: var(--text-secondary); margin-bottom: 12px; }
        .news-meta { font-size: 11px; color: var(--text-secondary); }
      `}</style>
    </div>
  );
}