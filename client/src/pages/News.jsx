import React, { useEffect, useState } from 'react';
import axios from 'axios';

var API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function timeAgo(iso) {
  var diff = Math.floor((Date.now() - new Date(iso)) / 60000);
  if (diff < 1) return 'just now';
  if (diff < 60) return diff + 'm ago';
  return Math.floor(diff / 60) + 'h ago';
}

export default function News() {
  var [news,    setNews]    = useState([]);
  var [loading, setLoading] = useState(true);

  useEffect(function() {
    axios.get(API + '/api/market/news')
      .then(function(res) { setNews(res.data); setLoading(false); })
      .catch(function()   { setLoading(false); });
  }, []);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-white text-2xl font-bold">Market News</h1>
        <div className="text-gray-500 text-xs font-mono">{news.length} articles</div>
      </div>

      {loading ? (
        <div className="text-gray-500 text-center py-12 font-mono">Loading news...</div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          {news.map(function(n, i) {
            return (
              <a
                key={i}
                href={n.url || '#'}
                target="_blank"
                rel="noreferrer"
                className="flex gap-4 px-5 py-4 border-b border-gray-800 last:border-0 hover:bg-gray-800/30 transition-colors"
              >
                {n.image && (
                  <img
                    src={n.image}
                    alt=""
                    className="w-20 h-14 object-cover rounded-lg flex-shrink-0"
                    onError={function(e) { e.target.style.display = 'none'; }}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm font-medium mb-1">{n.title}</div>
                  {n.description && (
                    <div className="text-gray-500 text-xs mb-2">{n.description}</div>
                  )}
                  <div className="text-gray-600 text-xs font-mono">
                    {n.source} - {timeAgo(n.time)}
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}