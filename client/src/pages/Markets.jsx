import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

var API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// WebSocket (socket.io) is unreliable on Render free tier — it drops persistent
// connections. Replaced with HTTP polling every 10 seconds. Same data, same speed,
// 100% reliable on any free host.

export default function Markets() {
  var [gainers,     setGainers]     = useState([]);
  var [losers,      setLosers]      = useState([]);
  var [commodities, setCommodities] = useState(null);
  var [status,      setStatus]      = useState(null);
  var [chartData,   setChartData]   = useState([]);
  var [activeTab,   setActiveTab]   = useState('overview');
  var [indices,     setIndices]     = useState({
    nifty: 0, sensex: 0, bankNifty: 0, niftyIT: 0,
    niftyChg: 0, sensexChg: 0, bankChg: 0, itChg: 0,
  });
  var [lastTick, setLastTick] = useState(null);
  var tickRef = useRef(null);

  // ── FETCH INDICES (replaces WebSocket) ──────────────────────────
  var fetchIndices = function() {
    axios.get(API + '/api/market/indices', { timeout: 8000 })
      .then(function(res) {
        var data = res.data || [];
        var find = function(name) { return data.find(function(i) { return i.index === name; }); };
        var n  = find('NIFTY 50');
        var s = find('S&P BSE SENSEX') || find('SENSEX') || find('BSE SENSEX');
        var b  = find('NIFTY BANK');
        var it = find('NIFTY IT');
        setIndices({
          nifty:     n  ? n.last  : 0,
          sensex:    s  ? s.last  : 0,
          bankNifty: b  ? b.last  : 0,
          niftyIT:   it ? it.last : 0,
          niftyChg:  n  ? n.pChange  : 0,
          sensexChg: s  ? s.pChange  : 0,
          bankChg:   b  ? b.pChange  : 0,
          itChg:     it ? it.pChange : 0,
        });
        setLastTick(new Date());
      })
      .catch(function(err) {
        console.log('Indices fetch failed:', err.message);
      });
  };

  // ── FETCH EVERYTHING ELSE ───────────────────────────────────────
  var fetchAll = function() {
    var BASE = API + '/api/market';
    Promise.allSettled([
      axios.get(BASE + '/gainers'),
      axios.get(BASE + '/losers'),
      axios.get(BASE + '/commodities'),
      axios.get(BASE + '/status'),
      axios.get(BASE + '/chart/NIFTY%2050'),
    ]).then(function(results) {
      if (results[0].status === 'fulfilled') setGainers(results[0].value.data);
      if (results[1].status === 'fulfilled') setLosers(results[1].value.data);
      if (results[2].status === 'fulfilled') setCommodities(results[2].value.data);
      if (results[3].status === 'fulfilled') setStatus(results[3].value.data);
      if (results[4].status === 'fulfilled') setChartData(results[4].value.data);
    });
  };

  useEffect(function() {
    // Initial load
    fetchIndices();
    fetchAll();

    // Poll indices every 10 seconds (same cadence as the old WebSocket broadcast)
    tickRef.current = setInterval(fetchIndices, 10000);

    // Refresh gainers/losers/chart every 60 seconds
    var slowInterval = setInterval(fetchAll, 60000);

    return function() {
      clearInterval(tickRef.current);
      clearInterval(slowInterval);
    };
  }, []);

  var tabs = ['overview', 'gainers', 'losers', 'commodities'];

  var IndexCard = function(props) {
    var change = Number(props.change) || 0;
    var value  = Number(props.value)  || 0;
    var abs    = value > 0 ? (value * Math.abs(change) / 100).toFixed(2) : 0;
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <div className="text-gray-400 text-xs font-mono mb-1">{props.label} · LIVE</div>
        <div className="text-white text-xl font-bold font-mono">
          {value > 0
            ? value.toLocaleString('en-IN', { maximumFractionDigits: 2 })
            : <span className="text-gray-600 text-base">Loading...</span>
          }
        </div>
        <div className={'text-xs font-mono mt-1 ' + (change >= 0 ? 'text-green-400' : 'text-red-400')}>
          {change >= 0 ? '+' : ''}{change.toFixed(2)}%
          {value > 0 && (
            <span className="ml-2 text-gray-500">
              ({change >= 0 ? '+' : '-'}Rs.{abs})
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 max-w-7xl mx-auto">

      {/* Market Status */}
      {status && (
        <div className={
          'flex items-center justify-between gap-2 px-4 py-2 rounded-lg mb-4 text-xs font-mono ' +
          (status.isOpen
            ? 'bg-green-400/10 text-green-400 border border-green-400/20'
            : 'bg-gray-800 text-gray-400 border border-gray-700')
        }>
          <div className="flex items-center gap-2">
            <span className={'w-2 h-2 rounded-full flex-shrink-0 ' + (status.isOpen ? 'bg-green-400 animate-pulse' : 'bg-gray-500')}></span>
            {status.status} -- {status.message} -- IST {status.time}
          </div>
          {lastTick && (
            <span className="text-gray-600 text-xs">
              Updated {lastTick.toLocaleTimeString('en-IN')}
            </span>
          )}
        </div>
      )}

      {/* Index Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <IndexCard label="NIFTY 50"   value={indices.nifty}     change={indices.niftyChg}  />
        <IndexCard label="SENSEX"     value={indices.sensex}    change={indices.sensexChg} />
        <IndexCard label="BANK NIFTY" value={indices.bankNifty} change={indices.bankChg}   />
        <IndexCard label="NIFTY IT"   value={indices.niftyIT}   change={indices.itChg}     />
      </div>

      {/* Intraday Chart */}
      {chartData.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6">
          <div className="text-white font-semibold mb-3 text-sm">NIFTY 50 — Intraday Chart</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <XAxis dataKey="time" tick={{ fill: '#6b7280', fontSize: 10 }} interval={10} />
              <YAxis domain={['auto', 'auto']} tick={{ fill: '#6b7280', fontSize: 10 }} width={75}
                tickFormatter={function(v) { return v.toLocaleString('en-IN'); }} />
              <Tooltip
                contentStyle={{ background: '#111419', border: '1px solid #374151', borderRadius: 8 }}
                labelStyle={{ color: '#9ca3af', fontSize: 11 }}
                formatter={function(v) { return ['Rs.' + Number(v).toLocaleString('en-IN'), 'Price']; }}
              />
              <Line type="monotone" dataKey="price" stroke="#00e5a0" strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-gray-800">
        {tabs.map(function(t) {
          return (
            <button key={t} onClick={function() { setActiveTab(t); }}
              className={
                'px-4 py-2 text-xs font-mono capitalize transition-all border-b-2 ' +
                (activeTab === t ? 'text-green-400 border-green-400' : 'text-gray-500 border-transparent hover:text-white')
              }
            >{t}</button>
          );
        })}
      </div>

      {/* Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-800 flex justify-between items-center">
              <span className="text-white font-semibold text-sm">Top Gainers</span>
              <button onClick={function() { setActiveTab('gainers'); }} className="text-green-400 text-xs hover:underline">See all</button>
            </div>
            {gainers.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500 text-xs font-mono">Loading gainers...</div>
            ) : (
              gainers.slice(0, 5).map(function(s, i) {
                return (
                  <div key={i} className="px-4 py-3 border-b border-gray-800/50 flex justify-between items-center hover:bg-gray-800/30 transition-colors">
                    <div>
                      <div className="font-mono font-bold text-white text-sm">{s.symbol}</div>
                      <div className="text-gray-500 text-xs">Vol: {Number(s.tradedQuantity).toLocaleString('en-IN')}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-white text-sm">Rs.{Number(s.ltp).toLocaleString('en-IN')}</div>
                      <div className="text-green-400 text-xs font-mono">+{s.netPrice}%</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-800 flex justify-between items-center">
              <span className="text-white font-semibold text-sm">Top Losers</span>
              <button onClick={function() { setActiveTab('losers'); }} className="text-green-400 text-xs hover:underline">See all</button>
            </div>
            {losers.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500 text-xs font-mono">Loading losers...</div>
            ) : (
              losers.slice(0, 5).map(function(s, i) {
                return (
                  <div key={i} className="px-4 py-3 border-b border-gray-800/50 flex justify-between items-center hover:bg-gray-800/30 transition-colors">
                    <div>
                      <div className="font-mono font-bold text-white text-sm">{s.symbol}</div>
                      <div className="text-gray-500 text-xs">Vol: {Number(s.tradedQuantity).toLocaleString('en-IN')}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-white text-sm">Rs.{Number(s.ltp).toLocaleString('en-IN')}</div>
                      <div className="text-red-400 text-xs font-mono">{s.netPrice}%</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Gainers Table */}
      {activeTab === 'gainers' && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="text-gray-500 text-xs font-mono border-b border-gray-800">
                <th className="text-left px-4 py-3">SYMBOL</th>
                <th className="text-right px-4 py-3">PRICE</th>
                <th className="text-right px-4 py-3">CHANGE</th>
                <th className="text-right px-4 py-3">VOLUME</th>
              </tr>
            </thead>
            <tbody>
              {gainers.map(function(s, i) {
                return (
                  <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-white">{s.symbol}</td>
                    <td className="px-4 py-3 text-right font-mono text-white">Rs.{Number(s.ltp).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-right font-mono text-green-400 font-bold">+{s.netPrice}%</td>
                    <td className="px-4 py-3 text-right font-mono text-gray-400">{Number(s.tradedQuantity).toLocaleString('en-IN')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Losers Table */}
      {activeTab === 'losers' && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="text-gray-500 text-xs font-mono border-b border-gray-800">
                <th className="text-left px-4 py-3">SYMBOL</th>
                <th className="text-right px-4 py-3">PRICE</th>
                <th className="text-right px-4 py-3">CHANGE</th>
                <th className="text-right px-4 py-3">VOLUME</th>
              </tr>
            </thead>
            <tbody>
              {losers.map(function(s, i) {
                return (
                  <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-white">{s.symbol}</td>
                    <td className="px-4 py-3 text-right font-mono text-white">Rs.{Number(s.ltp).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-right font-mono text-red-400 font-bold">{s.netPrice}%</td>
                    <td className="px-4 py-3 text-right font-mono text-gray-400">{Number(s.tradedQuantity).toLocaleString('en-IN')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Commodities */}
      {activeTab === 'commodities' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {commodities ? (
            [
              { key: 'gold',   label: 'Gold',      icon: 'GOLD',  unit: 'per 10g' },
              { key: 'silver', label: 'Silver',    icon: 'SLVR',  unit: 'per kg'  },
              { key: 'crude',  label: 'Crude Oil', icon: 'CRUDE', unit: 'per bbl' },
            ].map(function(c) {
              var d = commodities[c.key];
              return (
                <div key={c.key} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                  <div className="text-green-400 font-mono font-bold text-xs mb-2 bg-green-400/10 inline-block px-2 py-1 rounded">{c.icon}</div>
                  <div className="text-gray-400 text-xs font-mono mb-1 mt-2">{c.label} — {c.unit}</div>
                  <div className="text-white text-2xl font-bold font-mono">Rs.{d.price.toLocaleString('en-IN')}</div>
                  <div className={'text-xs font-mono mt-1 ' + (String(d.change).startsWith('+') ? 'text-green-400' : 'text-red-400')}>{d.change}</div>
                </div>
              );
            })
          ) : (
            <div className="col-span-3 text-gray-500 text-xs text-center font-mono py-8">Loading commodities...</div>
          )}
        </div>
      )}

    </div>
  );
}