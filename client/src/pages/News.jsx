import React, { useEffect, useState } from 'react';
import axios from 'axios';

const NEWS_KEY = '2254829406fb447d91aa57aaadce71ae';

function timeAgo(iso) {
  const diff = Math.floor((Date.now() - new Date(iso)) / 60000);
  if (diff < 1)    return 'just now';
  if (diff < 60)   return diff + 'm ago';
  if (diff < 1440) return Math.floor(diff / 60) + 'h ago';
  return Math.floor(diff / 1440) + 'd ago';
}

export default function News() {
  const [news,    setNews]    = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Call NewsAPI directly from browser — free tier blocks server requests
    axios.get(
      'https://newsapi.org/v2/everything' +
      '?q=india+stock+market+nifty+sensex+economy+RBI+crypto' +
      '&sortBy=publishedAt' +
      '&pageSize=15' +
      '&language=en' +
      '&apiKey=' + NEWS_KEY
    )
      .then(({ data }) => {
        const articles = (data.articles || [])
          .filter(a => a.title && a.title !== '[Removed]' && a.url)
          .map(a => ({
            title:       a.title,
            source:      a.source.name,
            url:         a.url,
            image:       a.urlToImage,
            time:        a.publishedAt,
            description: a.description,
          }));
        setNews(articles);
        setLoading(false);
      })
      .catch(err => {
        console.log('NewsAPI error:', err.message);
        // Fallback to backend if direct call fails
        axios.get((process.env.REACT_APP_API_URL || 'http://localhost:5000') + '/api/market/news')
          .then(({ data }) => { setNews(data); setLoading(false); })
          .catch(() => setLoading(false));
      });
  }, []);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-white text-2xl font-bold">Market News</h1>
        <div className="text-gray-500 text-xs font-mono">{news.length} articles</div>
      </div>

      {loading ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
          <div className="text-gray-500 text-sm font-mono">Loading news...</div>
        </div>
      ) : news.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
          <div className="text-gray-500 text-sm font-mono">No articles available right now.</div>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          {news.map((n, i) => (
            <a key={i} href={n.url} target="_blank" rel="noreferrer"
              className="flex gap-4 px-5 py-4 border-b border-gray-800 last:border-0 hover:bg-gray-800/30 transition-colors group">
              {n.image && (
                <img src={n.image} alt=""
                  className="w-20 h-14 object-cover rounded-lg flex-shrink-0 bg-gray-800"
                  onError={e => { e.target.style.display = 'none'; }}
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="text-white text-sm font-medium mb-1 line-clamp-2 group-hover:text-green-400 transition-colors">
                  {n.title}
                </div>
                {n.description && (
                  <div className="text-gray-500 text-xs mb-2 line-clamp-1">{n.description}</div>
                )}
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="text-green-400/70">{n.source}</span>
                  <span className="text-gray-700">·</span>
                  <span className="text-gray-600">{timeAgo(n.time)}</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}