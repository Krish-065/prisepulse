import { useState, useEffect, useRef } from 'react';
import { apiClient } from '../services/api';   // optional – can also use direct fetch

export default function SearchWithSuggestions({ onSelect, placeholder, className }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [show, setShow] = useState(false);
  const ref = useRef();

  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      setShow(false);
      return;
    }
    const delay = setTimeout(async () => {
      try {
        const res = await fetch(`https://query1.finance.yahoo.com/v1/finance/search?q=${query}&quotesCount=10`);
        const data = await res.json();
        const quotes = data.quotes || [];
        const filtered = quotes.filter(q => q.quoteType === 'EQUITY' && (q.exchange === 'NSI' || q.exchange === 'BSE'));
        setSuggestions(filtered.map(q => ({ symbol: q.symbol.replace('.NS', ''), name: q.longname, exchange: q.exchange })));
        setShow(true);
      } catch (err) { console.error(err); }
    }, 300);
    return () => clearTimeout(delay);
  }, [query]);

  useEffect(() => {
    const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setShow(false); };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%' }}>
      <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={placeholder} className={className} autoComplete="off" />
      {show && suggestions.length > 0 && (
        <div className="search-dropdown">
          {suggestions.map(s => (
            <div key={s.symbol} className="search-suggestion" onClick={() => { onSelect(s); setQuery(''); setShow(false); }}>
              <strong>{s.symbol}</strong> <span>{s.name}</span>
            </div>
          ))}
        </div>
      )}
      <style>{`
        .search-dropdown { position: absolute; top: 100%; left: 0; right: 0; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 8px; max-height: 300px; overflow-y: auto; z-index: 1000; }
        .search-suggestion { padding: 10px 12px; cursor: pointer; border-bottom: 1px solid var(--border-color); }
        .search-suggestion:hover { background: rgba(0,255,136,0.1); }
      `}</style>
    </div>
  );
}