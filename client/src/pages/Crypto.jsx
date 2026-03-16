import React, { useEffect, useState } from 'react';
import axios from 'axios';

var API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function Crypto() {
  var [coins, setCoins]     = useState([]);
  var [loading, setLoading] = useState(true);
  var [error, setError]     = useState('');

  var fetchCoins = function() {
    console.log('Fetching crypto from:', API + '/api/market/crypto');
    axios.get(API + '/api/market/crypto')
      .then(function(res) {
        console.log('Crypto received:', res.data.length, 'coins');
        setCoins(res.data);
        setLoading(false);
        setError('');
      })
      .catch(function(err) {
        console.log('Crypto error:', err.message);
        setError('Failed to load crypto data. Retrying...');
        setLoading(false);
      });
  };

  useEffect(function() {
    fetchCoins();
    var interval = setInterval(fetchCoins, 60000);
    return function() { clearInterval(interval); };
  }, []);

  var ChangeCell = function(props) {
    var val = parseFloat(props.value) || 0;
    return (
      <td className={'px-4 py-3 text-right font-mono text-sm ' + (val >= 0 ? 'text-green-400' : 'text-red-400')}>
        {val >= 0 ? '+' : ''}{val.toFixed(2)}%
      </td>
    );
  };

  return (
    <div className="p-4 max-w-7xl mx-auto">

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-white text-2xl font-bold">Crypto Markets</h1>
        <div className="flex items-center gap-3">
          <span className="text-gray-500 text-xs font-mono">Prices in INR via CoinGecko</span>
          <button
            onClick={fetchCoins}
            className="text-green-400 text-xs font-mono bg-green-400/10 px-3 py-1 rounded hover:bg-green-400/20 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-400/10 border border-red-400/20 text-red-400 text-xs font-mono px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
          <div className="text-gray-500 text-sm font-mono">Loading crypto prices...</div>
          <div className="text-gray-600 text-xs font-mono mt-2">Fetching from CoinGecko</div>
        </div>
      ) : coins.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
          <div className="text-gray-500 text-sm font-mono">No data available</div>
          <div className="text-gray-600 text-xs font-mono mt-2">CoinGecko may be rate limiting. Try again in 1 minute.</div>
          <button
            onClick={fetchCoins}
            className="mt-4 text-green-400 text-xs font-mono bg-green-400/10 px-4 py-2 rounded hover:bg-green-400/20 transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-max">
              <thead>
                <tr className="text-gray-500 text-xs font-mono border-b border-gray-800 bg-gray-800/30">
                  <th className="text-left px-4 py-3">#</th>
                  <th className="text-left px-4 py-3">COIN</th>
                  <th className="text-right px-4 py-3">PRICE (RS.)</th>
                  <th className="text-right px-4 py-3">1H</th>
                  <th className="text-right px-4 py-3">24H</th>
                  <th className="text-right px-4 py-3">7D</th>
                  <th className="text-right px-4 py-3">24H HIGH</th>
                  <th className="text-right px-4 py-3">24H LOW</th>
                  <th className="text-right px-4 py-3">MARKET CAP</th>
                  <th className="text-right px-4 py-3">VOLUME</th>
                </tr>
              </thead>
              <tbody>
                {coins.map(function(c, i) {
                  return (
                    <tr key={c.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                      <td className="px-4 py-3 text-gray-500 font-mono text-sm">{i + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {c.image
                            ? <img src={c.image} alt={c.name} className="w-6 h-6 rounded-full flex-shrink-0" onError={function(e) { e.target.style.display = 'none'; }} />
                            : <div className="w-6 h-6 rounded-full bg-gray-700 flex-shrink-0"></div>
                          }
                          <div>
                            <div className="font-bold text-white text-sm">{c.name}</div>
                            <div className="text-gray-500 text-xs font-mono">{c.symbol}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-white text-sm">
                        Rs.{Number(c.price).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </td>
                      <ChangeCell value={c.change1h}  />
                      <ChangeCell value={c.change24h} />
                      <ChangeCell value={c.change7d}  />
                      <td className="px-4 py-3 text-right font-mono text-gray-400 text-sm">
                        Rs.{Number(c.high24h).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-gray-400 text-sm">
                        Rs.{Number(c.low24h).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-gray-400 text-sm">
                        Rs.{Number(c.marketCap).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-gray-400 text-sm">
                        Rs.{Number(c.volume).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-3 border-t border-gray-800 flex items-center justify-between">
            <span className="text-gray-600 text-xs font-mono">{coins.length} coins loaded</span>
            <span className="text-gray-600 text-xs font-mono">Auto-refreshes every 60 seconds</span>
          </div>
        </div>
      )}
    </div>
  );
}