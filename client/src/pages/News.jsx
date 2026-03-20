import React, { useEffect, useState, useRef, useCallback } from 'react';
import axios from 'axios';

const NEWS_API_KEY = '2254829406fb447d91aa57aaadce71ae';
const MAX_PAGE     = 6;

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
  const [hasMore,     setHasMore]     = useState(true);
  const [error,       setError]       = useState('');
  const pageRef     = useRef(1);
  const fetchingRef = useRef(false);
  const loaderRef   = useRef(null);

  const fetchPage = useCallback(async (pageNum) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    if (pageNum === 1) setLoading(true);
    else               setLoadingMore(true);

    try {
      const from7 = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];

      const { data } = await axios.get(
        'https://newsapi.org/v2/everything' +
        '?q=india+stock+market+nifty+sensex+economy+RBI+crypto' +
        '&sortBy=publishedAt' +
        '&from=' + from7 +
        '&pageSize=15' +
        '&page=' + pageNum +
        '&language=en' +
        '&apiKey=' + NEWS_API_KEY
      );

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

      if (articles.length > 0) {
        setNews(prev => {
          const seen  = new Set(prev.map(n => n.url));
          const fresh = articles.filter(n => !seen.has(n.url));
          if (fresh.length === 0 || pageNum >= MAX_PAGE) setHasMore(false);
          return [...prev, ...fresh];
        });
      } else {
        setHasMore(false);
      }

      setError('');
    } catch (err) {
      console.log('News error:', err.message);
      if (pageNum === 1) {
        setError('Could not load live news. Check back shortly.');
      }
      setHasMore(false);
    }

    setLoading(false);
    setLoadingMore(false);
    fetchingRef.current = false;
  }, []);

  useEffect(() => {
    fetchPage(1);
  }, [fetchPage]);

  useEffect(() => {
    if (!hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !fetchingRef.current && hasMore) {
          pageRef.current += 1;
          fetchPage(pageRef.current);
        }
      },
      { rootMargin: '300px', threshold: 0.1 }
    );
    const el = loaderRef.current;
    if (el) observer.observe(el);
    return () => { if (el) observer.unobserve(el); };
  }, [hasMore, fetchPage]);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-white text-2xl font-bold">Market News</h1>
          <div className="text-gray-500 text-xs font-mono mt-1">
            Live from NewsAPI · last 7 days · sorted newest first
          </div>
        </div>
        {news.length > 0 && (
          <span className="bg-green-400/10 text-green-400 border border-green-400/20 px-3 py-1 rounded font-mono text-xs">
            {news.length} articles
          </span>
        )}
      </div>

      {error && (
        <div className="bg-red-400/10 border border-red-400/20 text-red-400 text-xs font-mono px-4 py-2 rounded-lg mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
          <div className="text-gray-500 text-sm font-mono">Fetching latest news...</div>
        </div>
      ) : (
        <>
          {news.length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
              <div className="text-gray-500 text-sm font-mono">No articles available right now.</div>
            </div>
          ) : (
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              {news.map((n, i) => (
                <a key={n.url || i} href={n.url} target="_blank" rel="noreferrer"
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

          {hasMore && (
            <div ref={loaderRef} className="py-8 text-center">
              {loadingMore
                ? <div className="text-gray-500 text-xs font-mono">Loading more articles...</div>
                : <div className="text-gray-700 text-xs font-mono">Scroll down for more</div>
              }
            </div>
          )}

          {!hasMore && news.length > 0 && (
            <div className="py-6 text-center border-t border-gray-800 mt-2">
              <div className="text-gray-600 text-xs font-mono">
                {news.length >= 75 ? 'All articles loaded' : 'All ' + news.length + ' articles loaded'}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}