import React, { useEffect, useState } from 'react';
import axios from 'axios';

// CoinGecko free tier rate-limits SERVER IPs aggressively (shared IPs on Render get hit hard).
// Solution: fetch CoinGecko directly from the browser — each user has their own IP,
// so rate limits don't compound. Browser → CoinGecko works fine on the free plan.

var COINGECKO_IDS = [
  'bitcoin','ethereum','binancecoin','solana','ripple',
  'cardano','dogecoin','polkadot','avalanche-2','matic-network',
  'chainlink','litecoin','shiba-inu','tron','stellar',
  'cosmos','near','uniswap','pepe','filecoin',
].join(',');

var COINGECKO_URL =
  'https://api.coingecko.com/api/v3/coins/markets' +
  '?vs_currency=inr' +
  '&ids=' + COINGECKO_IDS +
  '&order=market_cap_desc' +
  '&per_page=50' +
  '&page=1' +
  '&price_change_percentage=1h,24h,7d';

export default function Crypto() {
  var [coins,     setCoins]     = useState([]);
  var [loading,   setLoading]   = useState(true);
  var [error,     setError]     = useState('');
  var [lastUpdate,setLastUpdate]= useState(null);

  var fetchCoins = function() {
    setError('');
    axios.get(COINGECKO_URL, {
      timeout: 15000,
      headers: { 'Accept': 'application/json' }
    })
      .then(function(res) {
        var mapped = res.data.map(function(c) {
          return {
            id:        c.id,
            symbol:    c.symbol.toUpperCase(),
            name:      c.name,
            image:     c.image,
            price:     c.current_price,
            change1h:  c.price_change_percentage_1h_in_currency  ? c.price_change_percentage_1h_in_currency.toFixed(2)  : '0',
            change24h: c.price_change_percentage_24h_in_currency ? c.price_change_percentage_24h_in_currency.toFixed(2) : '0',
            change7d:  c.price_change_percentage_7d_in_currency  ? c.price_change_percentage_7d_in_currency.toFixed(2)  : '0',
            high24h:   c.high_24h,
            low24h:    c.low_24h,
            marketCap: c.market_cap,
            volume:    c.total_volume,
          };
        });
        setCoins(mapped);
        setLoading(false);
        setLastUpdate(new Date());
      })
      .catch(function(err) {
        console.log('CoinGecko error:', err.message);
        if (err.response && err.response.status === 429) {
          setError('CoinGecko rate limit hit. Auto-retrying in 90 seconds...');
        } else {
          setError('Failed to load crypto data. Retrying...');
        }
        setLoading(false);
      });
  };

  useEffect(function() {
    fetchCoins();
    // 90s interval — CoinGecko free tier allows ~30 calls/min per IP, so this is very safe
    var interval = setInterval(fetchCoins, 90000);
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

  var formatINR = function(n, decimals) {
    return Number(n).toLocaleString('en-IN', { maximumFractionDigits: decimals !== undefined ? decimals : 2 });
  };

  return (
    <div className="p-4 max-w-7xl mx-auto">

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-white text-2xl font-bold">Crypto Markets</h1>
        <div className="flex items-center gap-3">
          {lastUpdate && (
            <span className="text-gray-600 text-xs font-mono">
              Updated {lastUpdate.toLocaleTimeString('en-IN')}
            </span>
          )}
          <span className="text-gray-500 text-xs font-mono">Prices in INR · CoinGecko</span>
          <button
            onClick={fetchCoins}
            className="text-green-400 text-xs font-mono bg-green-400/10 px-3 py-1 rounded hover:bg-green-400/20 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 text-xs font-mono px-4 py-3 rounded-lg mb-4">
          ⚠ {error}
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
          <div className="text-gray-600 text-xs font-mono mt-2">CoinGecko may be rate limiting. Wait ~60s and retry.</div>
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
                  <th className="text-right px-4 py-3">PRICE (₹)</th>
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
                        ₹{formatINR(c.price)}
                      </td>
                      <ChangeCell value={c.change1h}  />
                      <ChangeCell value={c.change24h} />
                      <ChangeCell value={c.change7d}  />
                      <td className="px-4 py-3 text-right font-mono text-gray-400 text-sm">₹{formatINR(c.high24h, 0)}</td>
                      <td className="px-4 py-3 text-right font-mono text-gray-400 text-sm">₹{formatINR(c.low24h,  0)}</td>
                      <td className="px-4 py-3 text-right font-mono text-gray-400 text-sm">₹{formatINR(c.marketCap, 0)}</td>
                      <td className="px-4 py-3 text-right font-mono text-gray-400 text-sm">₹{formatINR(c.volume,    0)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-3 border-t border-gray-800 flex items-center justify-between">
            <span className="text-gray-600 text-xs font-mono">{coins.length} coins · live from CoinGecko</span>
            <span className="text-gray-600 text-xs font-mono">Auto-refreshes every 90 seconds</span>
          </div>
        </div>
      )}
    </div>
  );
}