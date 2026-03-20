import React, { useEffect, useState, useRef, useCallback } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const MAX_PAGES = 6; // 6 pages x 15 articles = 90 total

function timeAgo(iso) {
  const diff = Math.floor((Date.now() - new Date(iso)) / 60000);
  if (diff < 1)  return 'just now';
  if (diff < 60) return diff + 'm ago';
  return Math.floor(diff / 60) + 'h ago';
}

export default function News() {
  const [news,        setNews]        = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page,        setPage]        = useState(1);
  const [hasMore,     setHasMore]     = useState(true);
  const loaderRef = useRef(null);

  // Fetch a single page and append to news list
  const fetchPage = useCallback(async (pageNum) => {
    if (pageNum === 1) setLoading(true);
    else               setLoadingMore(true);

    try {
      const { data } = await axios.get(API + '/api/market/news?page=' + pageNum);
      if (!data || data.length === 0 || pageNum >= MAX_PAGES) {
        setHasMore(false);
      }
      setNews(prev => {
        // Deduplicate by url
        const existing = new Set(prev.map(n => n.url));
        const fresh    = data.filter(n => !existing.has(n.url));
        return [...prev, ...fresh];
      });
    } catch (err) {
      console.log('News fetch error:', err.message);
      setHasMore(false);
    }

    setLoading(false);
    setLoadingMore(false);
  }, []);

  // Load page 1 on mount
  useEffect(() => {
    fetchPage(1);
  }, [fetchPage]);

  // Intersection Observer — triggers when loader div enters viewport
  useEffect(() => {
    if (!hasMore || loadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          setPage(prev => {
            const next = prev + 1;
            fetchPage(next);
            return next;
          });
        }
      },
      { threshold: 0.1 }
    );

    const el = loaderRef.current;
    if (el) observer.observe(el);
    return () => { if (el) observer.unobserve(el); };
  }, [hasMore, loadingMore, fetchPage]);

  const totalPages = Math.min(page, MAX_PAGES);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-white text-2xl font-bold">Market News</h1>
        <div className="text-gray-500 text-xs font-mono">
          {news.length} articles loaded
          {hasMore && ' · scroll for more'}
          {!hasMore && news.length >= 15 && ' · showing all ' + news.length}
        </div>
      </div>

      {loading ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
          <div className="text-gray-500 text-sm font-mono">Loading news...</div>
        </div>
      ) : (
        <>
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            {news.map((n, i) => (
              <a key={n.url || i} href={n.url || '#'} target="_blank" rel="noreferrer"
                className="flex gap-4 px-5 py-4 border-b border-gray-800 last:border-0 hover:bg-gray-800/30 transition-colors">
                {n.image && (
                  <img src={n.image} alt=""
                    className="w-20 h-14 object-cover rounded-lg flex-shrink-0"
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm font-medium mb-1 line-clamp-2">{n.title}</div>
                  {n.description && (
                    <div className="text-gray-500 text-xs mb-2 line-clamp-1">{n.description}</div>
                  )}
                  <div className="text-gray-600 text-xs font-mono">{n.source} · {timeAgo(n.time)}</div>
                </div>
              </a>
            ))}
          </div>

          {/* Loader trigger div — observed by IntersectionObserver */}
          {hasMore && (
            <div ref={loaderRef} className="py-6 text-center">
              {loadingMore ? (
                <div className="text-gray-500 text-xs font-mono">Loading more articles...</div>
              ) : (
                <div className="text-gray-700 text-xs font-mono">Scroll down for more</div>
              )}
            </div>
          )}

          {!hasMore && news.length > 0 && (
            <div className="py-6 text-center">
              <div className="text-gray-600 text-xs font-mono">
                {news.length >= 90
                  ? 'All 90 articles loaded — daily limit reached'
                  : 'All ' + news.length + ' articles loaded'}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}