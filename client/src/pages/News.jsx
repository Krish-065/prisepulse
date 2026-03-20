import React, { useEffect, useState, useRef, useCallback } from 'react';
import axios from 'axios';

const API      = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const MAX_PAGES = 6; // 6 x 15 = 90 articles max

function timeAgo(iso) {
  const diff = Math.floor((Date.now() - new Date(iso)) / 60000);
  if (diff < 1)  return 'just now';
  if (diff < 60) return diff + 'm ago';
  if (diff < 1440) return Math.floor(diff / 60) + 'h ago';
  return Math.floor(diff / 1440) + 'd ago';
}

export default function News() {
  const [news,        setNews]        = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page,        setPage]        = useState(1);
  const [hasMore,     setHasMore]     = useState(true);
  const [error,       setError]       = useState('');
  const loaderRef  = useRef(null);
  const fetchingRef = useRef(false); // prevents double fetch

  const fetchPage = useCallback(async (pageNum) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    if (pageNum === 1) setLoading(true);
    else               setLoadingMore(true);

    try {
      const { data } = await axios.get(API + '/api/market/news?page=' + pageNum);

      if (!data || data.length === 0 || pageNum >= MAX_PAGES) {
        setHasMore(false);
      }

      setNews(prev => {
        const seen  = new Set(prev.map(n => n.url));
        const fresh = (data || []).filter(n => !seen.has(n.url));
        return [...prev, ...fresh];
      });

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

  // IntersectionObserver — auto-load next page on scroll
  useEffect(() => {
    if (!hasMore || loadingMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
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
  }, [hasMore, loadingMore, loading, fetchPage]);

  return (
    <div className="p-6 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-white text-2xl font-bold">Market News</h1>
          <div className="text-gray-600 text-xs font-mono mt-1">
            Live from NewsAPI · Today's articles · Updates every 5 minutes
          </div>
        </div>
        <div className="text-gray-500 text-xs font-mono text-right">
          <div>{news.length} articles loaded</div>
          {hasMore && <div className="text-green-400">scroll for more</div>}
        </div>
      </div>

      {error && (
        <div className="bg-red-400/10 border border-red-400/20 text-red-400 text-xs font-mono px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
          <div className="text-gray-500 text-sm font-mono mt-3">Fetching today's news...</div>
        </div>
      ) : (
        <>
          {news.length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
              <div className="text-gray-500 text-sm font-mono">No news articles available right now.</div>
              <div className="text-gray-600 text-xs font-mono mt-2">NewsAPI may have no articles for today yet. Check back later.</div>
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
                    <div className="flex items-center gap-2">
                      <span className="text-green-400/60 text-xs font-mono">{n.source}</span>
                      <span className="text-gray-700 text-xs">·</span>
                      <span className="text-gray-600 text-xs font-mono">{timeAgo(n.time)}</span>
                    </div>
                  </div>
                  <div className="text-gray-700 group-hover:text-green-400 transition-colors flex-shrink-0 self-center text-xs">
                    →
                  </div>
                </a>
              ))}
            </div>
          )}

          {/* Invisible loader div — triggers next page fetch when visible */}
          {hasMore && !loading && (
            <div ref={loaderRef} className="py-8 text-center">
              {loadingMore ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  <span className="text-gray-500 text-xs font-mono ml-2">Loading more articles...</span>
                </div>
              ) : (
                <div className="text-gray-700 text-xs font-mono">↓ Scroll for more</div>
              )}
            </div>
          )}

          {/* End of articles */}
          {!hasMore && news.length > 0 && (
            <div className="py-6 text-center border-t border-gray-800 mt-0">
              <div className="text-gray-600 text-xs font-mono">
                {news.length >= 90
                  ? 'All 90 articles loaded — daily API limit reached'
                  : 'All ' + news.length + ' articles for today loaded'}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}