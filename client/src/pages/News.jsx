import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// NewsAPI free tier BLOCKS all browser (CORS) requests — only server-side works.
// Set NEWS_API_KEY in your server .env. Backend caches 10 min → safe within 100/day free limit.

function timeAgo(iso) {
  var diff = Math.floor((Date.now() - new Date(iso)) / 60000);
  if (diff < 1)    return 'just now';
  if (diff < 60)   return diff + 'm ago';
  if (diff < 1440) return Math.floor(diff / 60) + 'h ago';
  return Math.floor(diff / 1440) + 'd ago';
}

var CATEGORIES = ['All', 'Markets', 'Crypto', 'IPO', 'Economy', 'Earnings'];

export default function News() {
  var [news,    setNews]    = useState([]);
  var [loading, setLoading] = useState(true);
  var [error,   setError]   = useState('');
  var [filter,  setFilter]  = useState('All');

  var fetchNews = function() {
    setError('');
    axios.get(API + '/api/news', { timeout: 15000 })
      .then(function(res) {
        var articles = (res.data || []).filter(function(a) {
          return a.title && a.title !== '[Removed]';
        });
        setNews(articles);
        setLoading(false);
      })
      .catch(function(err) {
        console.log('News fetch error:', err.message);
        setError('Could not load news. Ensure NEWS_API_KEY is set in your server .env file.');
        setLoading(false);
      });
  };

  useEffect(function() {
    fetchNews();
    var interval = setInterval(fetchNews, 10 * 60 * 1000);
    return function() { clearInterval(interval); };
  }, []);

  var filtered = filter === 'All' ? news : news.filter(function(n) {
    var hay = (n.title + ' ' + (n.description || '') + ' ' + (n.source || '')).toLowerCase();
    if (filter === 'Markets')  return hay.includes('nifty') || hay.includes('sensex') || hay.includes('stock') || hay.includes('market');
    if (filter === 'Crypto')   return hay.includes('bitcoin') || hay.includes('crypto') || hay.includes('ethereum') || hay.includes('blockchain');
    if (filter === 'IPO')      return hay.includes('ipo') || hay.includes('listing');
    if (filter === 'Economy')  return hay.includes('rbi') || hay.includes('gdp') || hay.includes('inflation') || hay.includes('economy') || hay.includes('rupee');
    if (filter === 'Earnings') return hay.includes('profit') || hay.includes('revenue') || hay.includes('earnings') || hay.includes('results') || hay.includes('quarter');
    return hay.includes(filter.toLowerCase());
  });

  return (
    <div className="p-6 max-w-5xl mx-auto">

      <div className="flex items-center justify-between mb-5">
        <h1 className="text-white text-2xl font-bold">Market News</h1>
        <div className="flex items-center gap-3">
          <span className="text-gray-500 text-xs font-mono">{filtered.length} articles</span>
          <button
            onClick={fetchNews}
            className="text-green-400 text-xs font-mono bg-green-400/10 px-3 py-1 rounded hover:bg-green-400/20 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap mb-5">
        {CATEGORIES.map(function(cat) {
          return (
            <button
              key={cat}
              onClick={function() { setFilter(cat); }}
              className={
                'px-3 py-1 rounded-full text-xs font-mono transition-all border ' +
                (filter === cat
                  ? 'bg-green-400 text-gray-950 border-green-400 font-bold'
                  : 'text-gray-400 border-gray-700 hover:border-gray-500 hover:text-white')
              }
            >
              {cat}
            </button>
          );
        })}
      </div>

      {error && (
        <div className="bg-red-400/10 border border-red-400/20 text-red-400 text-xs font-mono px-4 py-3 rounded-lg mb-4">
          ⚠ {error}
          <div className="mt-1 text-gray-600">
            Get a free key at newsapi.org → add <span className="text-yellow-400">NEWS_API_KEY=your_key</span> to server .env
          </div>
        </div>
      )}

      {loading ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
          <div className="text-gray-500 text-sm font-mono">Loading news...</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
          <div className="text-gray-400 text-sm font-mono mb-2">
            {news.length === 0 ? 'No articles available.' : 'No ' + filter + ' articles found.'}
          </div>
          {news.length > 0 && (
            <button onClick={function() { setFilter('All'); }} className="text-green-400 text-xs font-mono hover:underline">
              Show all {news.length} articles
            </button>
          )}
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          {filtered.map(function(n, i) {
            return (
              <a
                key={i}
                href={n.url || '#'}
                target="_blank"
                rel="noreferrer"
                className="flex gap-4 px-5 py-4 border-b border-gray-800 last:border-0 hover:bg-gray-800/30 transition-colors group"
              >
                {n.image && (
                  <img
                    src={n.image}
                    alt=""
                    className="w-20 h-14 object-cover rounded-lg flex-shrink-0 bg-gray-800"
                    onError={function(e) { e.target.style.display = 'none'; }}
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
                <div className="flex-shrink-0 self-center text-gray-700 group-hover:text-gray-500 text-sm">→</div>
              </a>
            );
          })}
          <div className="px-5 py-3 border-t border-gray-800 flex items-center justify-between">
            <span className="text-gray-600 text-xs font-mono">{filtered.length} articles · via NewsAPI</span>
            <span className="text-gray-600 text-xs font-mono">Auto-refreshes every 10 min</span>
          </div>
        </div>
      )}
    </div>
  );
}