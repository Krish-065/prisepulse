import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function MutualFunds() {
  const [funds,   setFunds]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/api/market/mutualfunds`)
      .then(({ data }) => { setFunds(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-white text-2xl font-bold">Mutual Funds</h1>
        <span className="text-gray-500 text-xs font-mono">Live NAV · via AMFI India</span>
      </div>
      {loading ? (
        <div className="text-gray-500 text-center py-12 font-mono">Loading NAV data...</div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          {funds.map((f, i) => (
            <div key={i} className="px-5 py-4 border-b border-gray-800 last:border-0 hover:bg-gray-800/30 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="text-white font-semibold text-sm mb-1">{f.name}</div>
                  <div className="text-gray-500 text-xs font-mono">{f.category} · NAV as of {f.date}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-white font-bold font-mono text-lg">₹{f.nav}</div>
                  <div className={`text-xs font-mono ${Number(f.change) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {Number(f.change) >= 0 ? '▲' : '▼'} {Math.abs(f.change)}% today
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}