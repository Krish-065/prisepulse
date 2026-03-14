import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const API    = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const socket = io(API);

function timeAgo(iso) {
  const diff = Math.floor((Date.now() - new Date(iso)) / 60000);
  if (diff < 1)  return 'just now';
  if (diff < 60) return `${diff}m ago`;
  return `${Math.floor(diff/60)}h ago`;
}

export default function Markets() {
  const [indices,     setIndices]     = useState([]);
  const [gainers,     setGainers]     = useState([]);
  const [losers,      setLosers]      = useState([]);
  const [news,        setNews]        = useState([]);
  const [commodities, setCommodities] = useState(null);
  const [status,      setStatus]      = useState(null);
  const [chartData,   setChartData]   = useState([]);
  const [liveIdx,     setLiveIdx]     = useState({ NIFTY: '—', SENSEX: '—', NIFTY_CHANGE: 0, SENSEX_CHANGE: 0 });
  const [activeTab,   setActiveTab]   = useState('overview');

  useEffect(() => {
    // WebSocket live prices
    socket.on('price-update', d => setLiveIdx(d));

    // Fetch all data
    const load = async () => {
      const BASE = `${API}/api/market`;
      const [idx, gain, lose, nws, comm, stat, chart] = await Promise.allSettled([
        axios.get(`${BASE}/indices`),
        axios.get(`${BASE}/gainers`),
        axios.get(`${BASE}/losers`),
        axios.get(`${BASE}/news`),
        axios.get(`${BASE}/commodities`),
        axios.get(`${BASE}/status`),
        axios.get(`${BASE}/chart/NIFTY%2050`),
      ]);
      if (idx.status   === 'fulfilled') setIndices(idx.value.data);
      if (gain.status  === 'fulfilled') setGainers(gain.value.data);
      if (lose.status  === 'fulfilled') setLosers(lose.value.data);
      if (nws.status   === 'fulfilled') setNews(nws.value.data);
      if (comm.status  === 'fulfilled') setCommodities(comm.value.data);
      if (stat.status  === 'fulfilled') setStatus(stat.value.data);
      if (chart.status === 'fulfilled') setChartData(chart.value.data);
    };

    load();
    const interval = setInterval(load, 60000); // refresh every 60s
    return () => { socket.off('price-update'); clearInterval(interval); };
  }, []);

  const tabs = ['overview', 'gainers', 'losers', 'news', 'commodities'];

  return (
    <div className="p-4 max-w-7xl mx-auto">

      {/* Market Status Banner */}
      {status && (
        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg mb-4 text-xs font-mono ${
          status.isOpen ? 'bg-green-400/10 text-green-400 border border-green-400/20'
                        : 'bg-gray-800 text-gray-400 border border-gray-700'
        }`}>
          <span className={`w-2 h-2 rounded-full ${status.isOpen ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`}></span>
          {status.status} — {status.message} — IST {status.time}
        </div>
      )}

      {/* Live Index Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {/* Live NIFTY */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="text-gray-400 text-xs font-mono mb-1">NIFTY 50 · LIVE</div>
          <div className="text-white text-xl font-bold font-mono">
            {Number(liveIdx.NIFTY).toLocaleString('en-IN')}
          </div>
          <div className={`text-xs font-mono mt-1 ${Number(liveIdx.NIFTY_CHANGE) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {Number(liveIdx.NIFTY_CHANGE) >= 0 ? '▲' : '▼'} {Math.abs(Number(liveIdx.NIFTY_CHANGE)).toFixed(2)}%
          </div>
        </div>
        {/* Live SENSEX */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="text-gray-400 text-xs font-mono mb-1">SENSEX · LIVE</div>
          <div className="text-white text-xl font-bold font-mono">
            {Number(liveIdx.SENSEX).toLocaleString('en-IN')}
          </div>
          <div className={`text-xs font-mono mt-1 ${Number(liveIdx.SENSEX_CHANGE) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {Number(liveIdx.SENSEX_CHANGE) >= 0 ? '▲' : '▼'} {Math.abs(Number(liveIdx.SENSEX_CHANGE)).toFixed(2)}%
          </div>
        </div>
        {/* Other indices from NSE */}
        {indices.slice(0, 2).map(idx => (
          <div key={idx.index} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="text-gray-400 text-xs font-mono mb-1">{idx.index}</div>
            <div className="text-white text-xl font-bold font-mono">
              {Number(idx.last).toLocaleString('en-IN')}
            </div>
            <div className={`text-xs font-mono mt-1 ${idx.pChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {idx.pChange >= 0 ? '▲' : '▼'} {Math.abs(idx.pChange).toFixed(2)}%
            </div>
          </div>
        ))}
      </div>

      {/* Nifty Chart */}
      {chartData.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6">
          <div className="text-white font-semibold mb-3">NIFTY 50 — Intraday</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <XAxis dataKey="time" tick={{ fill: '#6b7280', fontSize: 10 }} interval={10} />
              <YAxis domain={['auto','auto']} tick={{ fill: '#6b7280', fontSize: 10 }} width={70} tickFormatter={v => v.toLocaleString('en-IN')} />
              <Tooltip
                contentStyle={{ background: '#111419', border: '1px solid #374151', borderRadius: 8 }}
                labelStyle={{ color: '#9ca3af', fontSize: 11 }}
                formatter={v => [`₹${Number(v).toLocaleString('en-IN')}`, 'Price']}
              />
              <Line type="monotone" dataKey="price" stroke="#00e5a0" strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-gray-800">
        {tabs.map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-4 py-2 text-xs font-mono capitalize transition-all border-b-2 ${
              activeTab === t
                ? 'text-green-400 border-green-400'
                : 'text-gray-500 border-transparent hover:text-white'
            }`}>
            {t}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Gainers preview */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-800 flex justify-between">
              <span className="text-white font-semibold text-sm">Top Gainers</span>
              <button onClick={() => setActiveTab('gainers')} className="text-green-400 text-xs">See all →</button>
            </div>
            {gainers.slice(0,5).map((s,i) => (
              <div key={i} className="px-4 py-3 border-b border-gray-800/50 flex justify-between items-center hover:bg-gray-800/30">
                <div>
                  <div className="font-mono font-bold text-white text-sm">{s.symbol}</div>
                  <div className="text-gray-500 text-xs">Vol: {Number(s.tradedQuantity).toLocaleString('en-IN')}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-white text-sm">₹{s.ltp?.toLocaleString('en-IN')}</div>
                  <div className="text-green-400 text-xs font-mono">▲ {s.netPrice}%</div>
                </div>
              </div>
            ))}
          </div>
          {/* Losers preview */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-800 flex justify-between">
              <span className="text-white font-semibold text-sm">Top Losers</span>
              <button onClick={() => setActiveTab('losers')} className="text-green-400 text-xs">See all →</button>
            </div>
            {losers.slice(0,5).map((s,i) => (
              <div key={i} className="px-4 py-3 border-b border-gray-800/50 flex justify-between items-center hover:bg-gray-800/30">
                <div>
                  <div className="font-mono font-bold text-white text-sm">{s.symbol}</div>
                  <div className="text-gray-500 text-xs">Vol: {Number(s.tradedQuantity).toLocaleString('en-IN')}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-white text-sm">₹{s.ltp?.toLocaleString('en-IN')}</div>
                  <div className="text-red-400 text-xs font-mono">▼ {Math.abs(s.netPrice)}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* GAINERS TAB */}
      {activeTab === 'gainers' && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead><tr className="text-gray-500 text-xs font-mono border-b border-gray-800">
              <th className="text-left px-4 py-3">SYMBOL</th>
              <th className="text-right px-4 py-3">PRICE</th>
              <th className="text-right px-4 py-3">CHANGE %</th>
              <th className="text-right px-4 py-3">VOLUME</th>
            </tr></thead>
            <tbody>
              {gainers.map((s,i) => (
                <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="px-4 py-3 font-mono font-bold text-white">{s.symbol}</td>
                  <td className="px-4 py-3 text-right font-mono text-white">₹{s.ltp?.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-right font-mono text-green-400 font-bold">▲ {s.netPrice}%</td>
                  <td className="px-4 py-3 text-right font-mono text-gray-400">{Number(s.tradedQuantity).toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* LOSERS TAB */}
      {activeTab === 'losers' && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead><tr className="text-gray-500 text-xs font-mono border-b border-gray-800">
              <th className="text-left px-4 py-3">SYMBOL</th>
              <th className="text-right px-4 py-3">PRICE</th>
              <th className="text-right px-4 py-3">CHANGE %</th>
              <th className="text-right px-4 py-3">VOLUME</th>
            </tr></thead>
            <tbody>
              {losers.map((s,i) => (
                <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="px-4 py-3 font-mono font-bold text-white">{s.symbol}</td>
                  <td className="px-4 py-3 text-right font-mono text-white">₹{s.ltp?.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-right font-mono text-red-400 font-bold">▼ {Math.abs(s.netPrice)}%</td>
                  <td className="px-4 py-3 text-right font-mono text-gray-400">{Number(s.tradedQuantity).toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* NEWS TAB */}
      {activeTab === 'news' && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          {news.map((n,i) => (
            <a key={i} href={n.url || '#'} target="_blank" rel="noreferrer"
              className="block px-5 py-4 border-b border-gray-800 hover:bg-gray-800/30 transition-colors">
              <div className="text-white text-sm font-medium mb-1">{n.title}</div>
              <div className="text-gray-500 text-xs font-mono">{n.source} · {timeAgo(n.time)}</div>
            </a>
          ))}
        </div>
      )}

      {/* COMMODITIES TAB */}
      {activeTab === 'commodities' && commodities && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { key: 'gold',   label: 'Gold',   emoji: '🥇', unit: 'per 10g' },
            { key: 'silver', label: 'Silver', emoji: '🥈', unit: 'per kg'  },
            { key: 'crude',  label: 'Crude Oil', emoji: '🛢️', unit: 'per bbl' },
          ].map(c => {
            const d = commodities[c.key];
            return (
              <div key={c.key} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <div className="text-2xl mb-2">{c.emoji}</div>
                <div className="text-gray-400 text-xs font-mono mb-1">{c.label} · {c.unit}</div>
                <div className="text-white text-2xl font-bold font-mono">
                  ₹{d.price.toLocaleString('en-IN')}
                </div>
                <div className={`text-xs font-mono mt-1 ${d.change.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                  {d.change}
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}