import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const BASE = (process.env.REACT_APP_API_URL || 'http://localhost:5000') + '/api';

const DEFAULT_STOCKS = [
  { sym: 'RELIANCE',   name: 'Reliance Industries' },
  { sym: 'TCS',        name: 'Tata Consultancy'    },
  { sym: 'HDFCBANK',   name: 'HDFC Bank'           },
  { sym: 'INFY',       name: 'Infosys'             },
  { sym: 'WIPRO',      name: 'Wipro'               },
  { sym: 'ITC',        name: 'ITC Ltd'             },
  { sym: 'AXISBANK',   name: 'Axis Bank'           },
  { sym: 'BAJFINANCE', name: 'Bajaj Finance'       },
];

export default function Watchlist() {
  const [watchlist,    setWatchlist]    = useState([]);
  const [prices,       setPrices]       = useState({});
  const [loading,      setLoading]      = useState(false);
  const [priceLoading, setPriceLoading] = useState(false);
  const [search,       setSearch]       = useState('');
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  // ── ALL HOOKS MUST BE BEFORE ANY RETURN ──────────────────────
  useEffect(function() {
    if (!token) return;
    var loadWatchlist = async function() {
      try {
        var res = await axios.get(BASE + '/watchlist', {
          headers: { Authorization: 'Bearer ' + token }
        });
        setWatchlist(res.data);
        if (res.data.length > 0) fetchPrices(res.data);
      } catch (err) {
        console.log('Watchlist fetch error:', err);
      }
    };
    loadWatchlist();
  // eslint-disable-next-line
  }, []);

  var fetchPrices = async function(symbols) {
    setPriceLoading(true);
    try {
      var res = await axios.post(BASE + '/market/quotes', { symbols });
      var priceMap = {};
      res.data.forEach(function(d) { priceMap[d.symbol] = d; });
      setPrices(priceMap);
    } catch (err) {
      console.log('Price fetch error:', err);
    }
    setPriceLoading(false);
  };

  var addStock = async function(symbol) {
    setLoading(true);
    try {
      var res = await axios.post(BASE + '/watchlist/add',
        { symbol },
        { headers: { Authorization: 'Bearer ' + token } }
      );
      setWatchlist(res.data);
      fetchPrices(res.data);
    } catch (err) {
      console.log('Add error:', err);
    }
    setLoading(false);
  };

  var removeStock = async function(symbol) {
    try {
      var res = await axios.post(BASE + '/watchlist/remove',
        { symbol },
        { headers: { Authorization: 'Bearer ' + token } }
      );
      setWatchlist(res.data);
    } catch (err) {
      console.log('Remove error:', err);
    }
  };

  // ── GUEST GATE — after all hooks ──────────────────────────────
  if (!token) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-10 w-full max-w-md text-center">
          <div className="w-14 h-14 bg-green-400/10 border border-green-400/20 rounded-full flex items-center justify-center mx-auto mb-5">
            <span className="text-green-400 text-2xl">★</span>
          </div>
          <h2 className="text-white text-xl font-bold mb-2">Login to use Watchlist</h2>
          <p className="text-gray-500 text-sm mb-6 leading-relaxed">
            Create a free account to save your favourite stocks and track them in one place.
          </p>
          <button
            onClick={function() { navigate('/login'); }}
            className="w-full bg-green-400 text-gray-950 font-bold py-3 rounded-lg text-sm hover:bg-green-300 transition-colors mb-3"
          >
            Login or Sign Up — It's Free
          </button>
          <button
            onClick={function() { navigate(-1); }}
            className="w-full text-gray-500 text-sm py-2 rounded-lg border border-gray-800 hover:border-gray-600 hover:text-gray-300 transition-colors font-mono"
          >
            Go back
          </button>
          <p className="text-gray-600 text-xs mt-4">
            Markets, News, Crypto and Tools are free without an account.
          </p>
        </div>
      </div>
    );
  }

  var filtered = DEFAULT_STOCKS.filter(function(s) {
    return s.sym.toLowerCase().includes(search.toLowerCase()) ||
           s.name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-white text-2xl font-bold mb-6">My Watchlist</h1>

      {watchlist.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden mb-8">
          <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
            <h2 className="text-white font-semibold">Watching</h2>
            <button
              onClick={function() { fetchPrices(watchlist); }}
              className="text-green-400 text-xs font-mono hover:underline"
            >
              {priceLoading ? 'Refreshing...' : 'Refresh Prices'}
            </button>
          </div>
          <table className="w-full">
            <thead>
              <tr className="text-gray-500 text-xs font-mono border-b border-gray-800">
                <th className="text-left px-5 py-3">SYMBOL</th>
                <th className="text-right px-5 py-3">PRICE</th>
                <th className="text-right px-5 py-3">CHANGE</th>
                <th className="text-right px-5 py-3">ACTION</th>
              </tr>
            </thead>
            <tbody>
              {watchlist.map(function(sym) {
                var p = prices[sym];
                return (
                  <tr key={sym} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                    <td className="px-5 py-4 font-mono font-bold text-white">{sym}</td>
                    <td className="px-5 py-4 text-right font-mono text-white">
                      {p ? 'Rs.' + p.price : priceLoading ? '...' : 'N/A'}
                    </td>
                    <td className={'px-5 py-4 text-right font-mono font-bold ' + (
                      p ? (parseFloat(p.change) >= 0 ? 'text-green-400' : 'text-red-400') : 'text-gray-500'
                    )}>
                      {p ? (parseFloat(p.change) >= 0 ? '+' : '') + p.change + ' (' + p.changePct + ')' : '-'}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={function() { removeStock(sym); }}
                        className="text-red-400 text-xs hover:text-red-300 font-mono"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800">
          <h2 className="text-white font-semibold mb-3">Add Stocks</h2>
          <input
            type="text"
            placeholder="Search by name or symbol..."
            value={search}
            onChange={function(e) { setSearch(e.target.value); }}
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white text-sm w-full outline-none focus:border-green-400 transition-colors"
          />
        </div>
        <div className="divide-y divide-gray-800">
          {filtered.map(function(stock) {
            return (
              <div key={stock.sym} className="px-5 py-3 flex items-center justify-between hover:bg-gray-800/30 transition-colors">
                <div>
                  <span className="font-mono font-bold text-white text-sm">{stock.sym}</span>
                  <span className="text-gray-400 text-xs ml-3">{stock.name}</span>
                </div>
                {watchlist.includes(stock.sym) ? (
                  <span className="text-green-400 text-xs font-mono">Added</span>
                ) : (
                  <button
                    onClick={function() { addStock(stock.sym); }}
                    disabled={loading}
                    className="text-xs bg-green-400/10 text-green-400 border border-green-400/30 px-3 py-1 rounded font-mono hover:bg-green-400/20 transition-colors"
                  >
                    + Add
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}