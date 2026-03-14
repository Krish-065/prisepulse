import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function Crypto() {
  const [coins,   setCoins]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/api/market/crypto`)
      .then(({ data }) => { setCoins(data); setLoading(false); })
      .catch(() => setLoading(false));
    const interval = setInterval(() => {
      axios.get(`${API}/api/market/crypto`).then(({ data }) => setCoins(data));
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-white text-2xl font-bold">Crypto Markets</h1>
        <span className="text-gray-500 text-xs font-mono">Prices in ₹ INR · via CoinGecko</span>
      </div>
      {loading ? (
        <div className="text-gray-500 text-center py-12 font-mono">Loading crypto prices...</div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="text-gray-500 text-xs font-mono border-b border-gray-800">
                <th className="text-left px-4 py-3">#</th>
                <th className="text-left px-4 py-3">COIN</th>
                <th className="text-right px-4 py-3">PRICE (₹)</th>
                <th className="text-right px-4 py-3">1H %</th>
                <th className="text-right px-4 py-3">24H %</th>
                <th className="text-right px-4 py-3">7D %</th>
                <th className="text-right px-4 py-3">24H HIGH</th>
                <th className="text-right px-4 py-3">24H LOW</th>
                <th className="text-right px-4 py-3">VOLUME</th>
              </tr>
            </thead>
            <tbody>
              {coins.map((c, i) => (
                <tr key={c.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-3 text-gray-500 font-mono text-sm">{i+1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <img src={c.image} alt={c.name} className="w-6 h-6 rounded-full" />
                      <div>
                        <div className="font-bold text-white text-sm">{c.name}</div>
                        <div className="text-gray-500 text-xs font-mono">{c.symbol}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-white text-sm">₹{Number(c.price).toLocaleString('en-IN')}</td>
                  <td className={`px-4 py-3 text-right font-mono text-sm ${Number(c.change1h) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {Number(c.change1h) >= 0 ? '▲' : '▼'} {Math.abs(c.change1h)}%
                  </td>
                  <td className={`px-4 py-3 text-right font-mono text-sm ${Number(c.change24h) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {Number(c.change24h) >= 0 ? '▲' : '▼'} {Math.abs(c.change24h)}%
                  </td>
                  <td className={`px-4 py-3 text-right font-mono text-sm ${Number(c.change7d) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {Number(c.change7d) >= 0 ? '▲' : '▼'} {Math.abs(c.change7d)}%
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-gray-400 text-sm">₹{Number(c.high24h).toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-right font-mono text-gray-400 text-sm">₹{Number(c.low24h).toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-right font-mono text-gray-400 text-sm">₹{Number(c.volume).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}