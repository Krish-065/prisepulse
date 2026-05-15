import { useState, useEffect, useRef } from 'react';
import { apiClient } from '../services/api';

export default function SearchWithSuggestions({ onSelect, placeholder, className }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef();

  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      setShow(false);
      return;
    }
    const delay = setTimeout(async () => {
      setLoading(true);
      try {
        // Use backend search endpoint (which calls Yahoo Finance)
        const res = await apiClient.get(`/market/search/${encodeURIComponent(query)}`);
        setSuggestions(res.data || []);
        setShow(true);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(delay);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setShow(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (stock) => {
    setQuery(stock.symbol);
    setShow(false);
    if (onSelect) onSelect(stock);
  };

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%' }}>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
      />
      {show && (suggestions.length > 0 || loading) && (
        <div className="search-dropdown">
          {loading && <div className="search-loading">Searching...</div>}
          {!loading && suggestions.length === 0 && <div className="search-no-results">No stocks found</div>}
          {!loading && suggestions.map((item) => (
            <div key={item.symbol} className="search-suggestion" onClick={() => handleSelect(item)}>
              <strong>{item.symbol}</strong>
              <span>{item.name}</span>
              <small>{item.exchange}</small>
            </div>
          ))}
        </div>
      )}
      <style>{`
        .search-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: #1e222d;
          border: 1px solid #2a2e39;
          border-radius: 8px;
          margin-top: 4px;
          max-height: 300px;
          overflow-y: auto;
          z-index: 1000;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }
        .search-suggestion {
          padding: 10px 12px;
          cursor: pointer;
          border-bottom: 1px solid #2a2e39;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
        }
        .search-suggestion:hover {
          background: rgba(0,255,136,0.1);
        }
        .search-suggestion strong { color: #00ff88; margin-right: 8px; }
        .search-suggestion span { flex: 1; font-size: 13px; color: #d1d4dc; }
        .search-suggestion small { color: #787b86; font-size: 10px; }
        .search-loading, .search-no-results {
          padding: 12px;
          text-align: center;
          color: #787b86;
        }
      `}</style>
    </div>
  );
}