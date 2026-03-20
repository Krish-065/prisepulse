import React, { useEffect, useState, useRef, useCallback } from 'react';
import axios from 'axios';

const API      = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const MAX_PAGE = 6; // 6 x 15 = 90 articles max (stays under 100/day limit)

function timeAgo(iso) {
  const diff = Math.floor((Date.now() - new Date(iso)) / 60000);
  if (diff < 1)    return 'just now';
  if (diff < 60)   return diff + 'm ago';
  if (diff < 1440) return Math.floor(diff / 60) + 'h ago';
  return Math.floor(diff / 1440) + 'd ago';
}

export default function News() {
  const [news,        setNews]        = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [, setPage] = useState(1);
  const [hasMore,     setHasMore]     = useState(true);
  const [error,       setError]       = useState('');
  const loaderRef  = useRef(null);
  const fetchingRef = useRef(false); // prevent double-fetch

  const fetchPage = useCallback(async (pageNum) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    if (pageNum === 1) setLoading(true);
    else               setLoadingMore(true);

    try {
      const { data } = await axios.get(API + '/api/market/news?page=' + pageNum);

      if (!data || data.length === 0 || pageNum >= MAX_PAGE) {
        setHasMore(false);
      }

      if (data && data.length > 0) {
        setNews(prev => {
          const seen  = new Set(prev.map(n => n.url));
          const fresh = data.filter(n => !seen.has(n.url));
          return [...prev, ...fresh];
        });
      }

      setError('');
    } catch (err) {
      console.log('News error:', err.message);
      setError('Could not load news. Showing cached articles.');
      setHasMore(false);
    }

    setLoading(false);
    setLoadingMore(false);
    fetchingRef.current = false;
  }, []);

  // Load page 1 on mount
  useEffect(() => {
    fetchPage(1);
  }, [fetchPage]);

  // IntersectionObserver — fires when loader div scrolls into view
  useEffect(() => {
    if (!hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !fetchingRef.current) {
          setPage(prev => {
            const next = prev + 1;
            fetchPage(next);
            return next;
          });
        }
      },
      { rootMargin: '200px', threshold: 0.1 }
    );

    const el = loaderRef.current;
    if (el) observer.observe(el);
    return () => { if (el) observer.unobserve(el); };
  }, [hasMore, loadingMore, fetchPage]);

  return (
    <div className="p-6 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-white text-2xl font-bold">Market News</h1>
          <div className="text-gray-500 text-xs font-mono mt-1">
            Live from NewsAPI · updates every 5 minutes
          </div>
        </div>
        <div className="text-gray-500 text-xs font-mono text-right">
          {news.length > 0 && (
            <span className="bg-green-400/10 text-green-400 border border-green-400/20 px-2 py-1 rounded font-mono text-xs">
              {news.length} articles
            </span>
          )}
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-red-400/10 border border-red-400/20 text-red-400 text-xs font-mono px-4 py-2 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
          <div className="text-gray-500 text-sm font-mono mb-1">Fetching today's news...</div>
          <div className="text-gray-600 text-xs font-mono">Powered by NewsAPI.org</div>
        </div>
      ) : (
        <>
          {/* Articles list */}
          {news.length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
              <div className="text-gray-500 text-sm font-mono">No articles found for today yet.</div>
              <div className="text-gray-600 text-xs font-mono mt-1">Check back after market hours.</div>
            </div>
          ) : (
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              {news.map((n, i) => (
                <a
                  key={n.url || i}
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

          {/* Scroll trigger */}
          {hasMore && (
            <div ref={loaderRef} className="py-8 text-center">
              {loadingMore ? (
                <div className="text-gray-500 text-xs font-mono">
                  Loading more articles...
                </div>
              ) : (
                <div className="text-gray-700 text-xs font-mono">
                  Scroll down to load more
                </div>
              )}
            </div>
          )}

          {/* End of articles */}
          {!hasMore && news.length > 0 && (
            <div className="py-6 text-center border-t border-gray-800 mt-2">
              <div className="text-gray-600 text-xs font-mono">
                {news.length >= 90
                  ? 'Reached daily limit of 90 articles — check back tomorrow for fresh news'
                  : 'All ' + news.length + ' articles loaded for today'
                }
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}