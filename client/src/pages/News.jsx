import React from 'react';

const NEWS = [
  { tag: 'MARKETS', headline: 'Nifty eyes 22,500 resistance; FII inflows boost sentiment', time: '30m ago' },
  { tag: 'EARNINGS', headline: 'Reliance Q3 net profit surges 18% YoY to ₹18,540 Cr', time: '1h ago' },
  { tag: 'CRYPTO',  headline: 'Bitcoin crosses $82K on ETF inflow surge', time: '2h ago' },
];

function News() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-white text-2xl font-bold mb-4">Market News</h1>
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {NEWS.map((n, i) => (
          <div key={i} className="px-5 py-4 border-b border-gray-800 last:border-0 hover:bg-gray-800/30 cursor-pointer transition-colors">
            <span className="text-xs font-mono font-bold text-green-400 bg-green-400/10 px-2 py-1 rounded">
              {n.tag}
            </span>
            <p className="text-white text-sm mt-2 mb-1">{n.headline}</p>
            <p className="text-gray-500 text-xs font-mono">{n.time}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default News;