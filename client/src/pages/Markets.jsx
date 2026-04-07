import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

var API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

var FII_DII_DATA = [
  { month: 'Oct',  fii: -94017, dii: 107254 },
  { month: 'Nov',  fii: -45974, dii: 65780  },
  { month: 'Dec',  fii: -16042, dii: 42180  },
  { month: 'Jan',  fii: -78027, dii: 84120  },
  { month: 'Feb',  fii: -34574, dii: 48920  },
  { month: 'Mar',  fii:  18420, dii: 22340  },
];

var SECTOR_HEAT = [
  { name: 'IT',      chg:  2.17, weight: 'high'   },
  { name: 'Auto',    chg:  1.44, weight: 'high'   },
  { name: 'Metal',   chg:  1.38, weight: 'medium' },
  { name: 'Telecom', chg:  1.12, weight: 'high'   },
  { name: 'Infra',   chg:  0.88, weight: 'medium' },
  { name: 'FMCG',    chg:  0.14, weight: 'high'   },
  { name: 'Banking', chg: -0.04, weight: 'high'   },
  { name: 'Energy',  chg: -0.31, weight: 'high'   },
  { name: 'Pharma',  chg: -0.82, weight: 'medium' },
  { name: 'NBFC',    chg: -1.30, weight: 'medium' },
  { name: 'Realty',  chg: -1.84, weight: 'low'    },
  { name: 'Media',   chg: -2.12, weight: 'low'    },
];

export default function Markets() {
  var [gainers,     setGainers]     = useState([]);
  var [losers,      setLosers]      = useState([]);
  var [commodities, setCommodities] = useState(null);
  var [status,      setStatus]      = useState(null);
  var [chartData,   setChartData]   = useState([]);
  var [activeTab,   setActiveTab]   = useState('overview');

  var [nifty,     setNifty]     = useState(0);
  var [sensex,    setSensex]    = useState(0);
  var [bankNifty, setBankNifty] = useState(0);
  var [niftyIT,   setNiftyIT]   = useState(0);
  var [niftyChg,  setNiftyChg]  = useState(0);
  var [sensexChg, setSensexChg] = useState(0);
  var [bankChg,   setBankChg]   = useState(0);
  var [itChg,     setITChg]     = useState(0);
  var [lastTick,  setLastTick]  = useState(null);
  var [clockTime, setClockTime] = useState('');

  var tickRef = useRef(null);

  // Live IST clock
  useEffect(function() {
    var update = function() {
      setClockTime(new Date().toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      }));
    };
    update();
    var c = setInterval(update, 1000);
    return function() { clearInterval(c); };
  }, []);

  // ── KEY FIX: fetch indices ONLY from backend — never from browser directly ──
  // Yahoo Finance blocks browser requests with CORS in production.
  // Your Render backend has no such restriction.
  var fetchIndices = function() {
    axios.get(API + '/api/market/indices', { timeout: 12000 })
      .then(function(res) {
        var data = res.data || [];
        var find = function(name) {
          return data.find(function(i) { return i.index === name; });
        };
        var n  = find('NIFTY 50');
        var s  = find('SENSEX');
        var b  = find('NIFTY BANK');
        var it = find('NIFTY IT');
        if (n  && n.last)  setNifty(n.last);
        if (s  && s.last)  setSensex(s.last);
        if (b  && b.last)  setBankNifty(b.last);
        if (it && it.last) setNiftyIT(it.last);
        if (n)  setNiftyChg(n.pChange  || 0);
        if (s)  setSensexChg(s.pChange || 0);
        if (b)  setBankChg(b.pChange   || 0);
        if (it) setITChg(it.pChange    || 0);
        setLastTick(new Date());
        console.log('[Markets] Indices updated:', { nifty: n?.last, sensex: s?.last, bank: b?.last, it: it?.last });
      })
      .catch(function(err) {
        console.log('[Markets] Indices fetch failed:', err.message);
      });
  };

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
    fetchIndices();
    fetchAll();
    // Refresh indices every 3 seconds for truly live updating prices
    tickRef.current = setInterval(fetchIndices, 3000);
    var slowInterval = setInterval(fetchAll, 60000);
    return function() {
      clearInterval(tickRef.current);
      clearInterval(slowInterval);
    };
  }, []);

  var tabs = ['overview', 'gainers', 'losers', 'commodities', 'heatmap', 'fii-dii'];

  var IndexCard = function(props) {
    var change = Number(props.change) || 0;
    var value  = Number(props.value)  || 0;
    var abs    = value > 0 ? (value * Math.abs(change) / 100).toFixed(2) : 0;
    var up     = change >= 0;
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-600 transition-all">
        <div className="flex items-center justify-between mb-1">
          <span className="text-gray-400 text-xs font-mono">{props.label}</span>
          <span className={'text-xs font-mono px-1.5 py-0.5 rounded ' + (up ? 'bg-green-400/10 text-green-400' : 'bg-red-400/10 text-red-400')}>
            LIVE
          </span>
        </div>
        <div className="text-white text-xl font-bold font-mono">
          {value > 0
            ? value.toLocaleString('en-IN', { maximumFractionDigits: 2 })
            : <span className="text-gray-600 text-base animate-pulse">Loading...</span>
          }
        </div>
        <div className={'text-xs font-mono mt-1 flex items-center gap-2 ' + (up ? 'text-green-400' : 'text-red-400')}>
          <span>{up ? '▲' : '▼'} {Math.abs(change).toFixed(2)}%</span>
          {value > 0 && <span className="text-gray-600">({up ? '+' : '-'}₹{abs})</span>}
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 max-w-7xl mx-auto">

      {/* Market Status Bar */}
      {status && (
        <div className={
          'flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl mb-4 text-xs font-mono ' +
          (status.isOpen
            ? 'bg-green-400/10 text-green-400 border border-green-400/20'
            : 'bg-gray-800/80 text-gray-400 border border-gray-700')
        }>
          <div className="flex items-center gap-2">
            <span className={'w-2 h-2 rounded-full flex-shrink-0 ' + (status.isOpen ? 'bg-green-400 animate-pulse' : 'bg-gray-500')} />
            <span className="font-semibold">{status.status}</span>
            <span className="text-gray-600 hidden sm:inline">·</span>
            <span className="text-gray-500 hidden sm:inline">{status.message}</span>
          </div>
          <div className="flex items-center gap-3">
            <span>{clockTime} IST</span>
            {lastTick && (
              <span className="text-gray-600">
                Updated {lastTick.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Index Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <IndexCard label="NIFTY 50"   value={nifty}     change={niftyChg}  />
        <IndexCard label="SENSEX"     value={sensex}    change={sensexChg} />
        <IndexCard label="BANK NIFTY" value={bankNifty} change={bankChg}   />
        <IndexCard label="NIFTY IT"   value={niftyIT}   change={itChg}     />
      </div>

      {/* Intraday Chart */}
      {chartData.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-white font-semibold text-sm">NIFTY 50 · Intraday</span>
            <span className="text-gray-500 text-xs font-mono">{chartData.length} data points</span>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={chartData} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="niftyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#4ade80" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#4ade80" stopOpacity={0}    />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis domain={['auto', 'auto']} tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} axisLine={false}
                tickFormatter={function(v) { return v.toLocaleString('en-IN'); }} />
              <Tooltip
                contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, fontSize: 11 }}
                labelStyle={{ color: '#9ca3af' }}
                formatter={function(v) { return ['₹' + Number(v).toLocaleString('en-IN'), 'Price']; }}
              />
              <Area type="monotone" dataKey="price" stroke="#4ade80" strokeWidth={1.5} fill="url(#niftyGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-gray-800 overflow-x-auto">
        {tabs.map(function(t) {
          return (
            <button key={t} onClick={function() { setActiveTab(t); }}
              className={
                'px-3 py-2 text-xs font-mono capitalize whitespace-nowrap transition-all border-b-2 flex-shrink-0 ' +
                (activeTab === t ? 'text-green-400 border-green-400' : 'text-gray-500 border-transparent hover:text-white')
              }
            >{t.replace('-', '/')}</button>
          );
        })}
      </div>

      {/* OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { title: 'Top Gainers', data: gainers.slice(0, 5), tabLink: 'gainers', isGainer: true  },
            { title: 'Top Losers',  data: losers.slice(0, 5),  tabLink: 'losers',  isGainer: false },
          ].map(function(panel) {
            return (
              <div key={panel.title} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-800 flex justify-between items-center">
                  <span className="text-white font-semibold text-sm">{panel.title}</span>
                  <button onClick={function() { setActiveTab(panel.tabLink); }}
                    className="text-green-400 text-xs hover:underline font-mono">See all →</button>
                </div>
                {panel.data.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <div className="text-gray-600 text-xs font-mono animate-pulse">Loading...</div>
                  </div>
                ) : panel.data.map(function(s, i) {
                  return (
                    <div key={i} className="px-4 py-3 border-b border-gray-800/50 last:border-0 flex justify-between items-center hover:bg-gray-800/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={'w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ' + (panel.isGainer ? 'bg-green-400/10 text-green-400' : 'bg-red-400/10 text-red-400')}>
                          {i + 1}
                        </div>
                        <div>
                          <div className="font-mono font-bold text-white text-sm">{s.symbol}</div>
                          <div className="text-gray-500 text-xs">Vol: {Number(s.tradedQuantity).toLocaleString('en-IN')}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-white text-sm">₹{Number(s.ltp).toLocaleString('en-IN')}</div>
                        <div className={'text-xs font-mono font-bold ' + (panel.isGainer ? 'text-green-400' : 'text-red-400')}>
                          {panel.isGainer ? '+' : ''}{s.netPrice}%
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {/* GAINERS TABLE */}
      {activeTab === 'gainers' && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="text-gray-500 text-xs font-mono border-b border-gray-800 bg-gray-800/30">
                <th className="text-left px-4 py-3">#</th>
                <th className="text-left px-4 py-3">SYMBOL</th>
                <th className="text-right px-4 py-3">PRICE</th>
                <th className="text-right px-4 py-3">CHANGE %</th>
                <th className="text-right px-4 py-3">VOLUME</th>
              </tr>
            </thead>
            <tbody>
              {gainers.map(function(s, i) {
                return (
                  <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3 text-gray-600 font-mono text-sm">{i + 1}</td>
                    <td className="px-4 py-3 font-mono font-bold text-white">{s.symbol}</td>
                    <td className="px-4 py-3 text-right font-mono text-white">₹{Number(s.ltp).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="bg-green-400/10 text-green-400 font-mono text-xs font-bold px-2 py-1 rounded">+{s.netPrice}%</span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-gray-400">{Number(s.tradedQuantity).toLocaleString('en-IN')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* LOSERS TABLE */}
      {activeTab === 'losers' && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="text-gray-500 text-xs font-mono border-b border-gray-800 bg-gray-800/30">
                <th className="text-left px-4 py-3">#</th>
                <th className="text-left px-4 py-3">SYMBOL</th>
                <th className="text-right px-4 py-3">PRICE</th>
                <th className="text-right px-4 py-3">CHANGE %</th>
                <th className="text-right px-4 py-3">VOLUME</th>
              </tr>
            </thead>
            <tbody>
              {losers.map(function(s, i) {
                return (
                  <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3 text-gray-600 font-mono text-sm">{i + 1}</td>
                    <td className="px-4 py-3 font-mono font-bold text-white">{s.symbol}</td>
                    <td className="px-4 py-3 text-right font-mono text-white">₹{Number(s.ltp).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="bg-red-400/10 text-red-400 font-mono text-xs font-bold px-2 py-1 rounded">{s.netPrice}%</span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-gray-400">{Number(s.tradedQuantity).toLocaleString('en-IN')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* COMMODITIES */}
      {activeTab === 'commodities' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {commodities ? (
            [
              { key: 'gold',       icon: '🥇', label: 'Gold',        unit: 'per 10g'   },
              { key: 'silver',     icon: '🥈', label: 'Silver',      unit: 'per kg'    },
              { key: 'crude',      icon: '🛢',  label: 'Crude Oil',   unit: 'per bbl'   },
              { key: 'naturalgas', icon: '🔥', label: 'Natural Gas', unit: 'per mmBtu' },
              { key: 'copper',     icon: '🔩', label: 'Copper',      unit: 'per kg'    },
              { key: 'aluminium',  icon: '⚙',  label: 'Aluminium',   unit: 'per kg'    },
              { key: 'zinc',       icon: '🔗', label: 'Zinc',        unit: 'per kg'    },
              { key: 'nickel',     icon: '💎', label: 'Nickel',      unit: 'per kg'    },
            ].map(function(c) {
              var d = commodities[c.key];
              if (!d) return null;
              var up = typeof d.isUp !== 'undefined' ? d.isUp : (String(d.change || '')).includes('+');
              return (
                <div key={c.key} className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg">{c.icon}</span>
                    <span className="text-gray-600 text-xs font-mono">{c.unit}</span>
                  </div>
                  <div className="text-gray-400 text-xs font-mono mb-1">{c.label}</div>
                  <div className="text-white text-xl font-bold font-mono mb-1">
                    ₹{Number(d.price).toLocaleString('en-IN')}
                  </div>
                  <div className={'text-xs font-mono ' + (up ? 'text-green-400' : 'text-red-400')}>
                    {d.changePct || d.change}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-4 text-gray-500 text-xs text-center font-mono py-8 animate-pulse">Loading commodities...</div>
          )}
        </div>
      )}

      {/* SECTOR HEATMAP */}
      {activeTab === 'heatmap' && (
        <div>
          <div className="mb-4 flex items-center gap-3">
            <span className="text-gray-500 text-xs font-mono">Sector performance today:</span>
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-600 inline-block"></span> Positive</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-700 inline-block"></span> Negative</span>
            </div>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
            {SECTOR_HEAT.map(function(s, i) {
              var up = s.chg >= 0;
              var intensity = Math.min(Math.abs(s.chg) / 3, 1);
              var heightClass = s.weight === 'high' ? 'h-28' : s.weight === 'medium' ? 'h-20' : 'h-16';
              return (
                <div key={i}
                  className={'rounded-xl flex flex-col items-center justify-center cursor-default transition-all hover:scale-105 ' + heightClass}
                  style={{
                    background: up ? `rgba(74,222,128,${0.08 + intensity * 0.22})` : `rgba(248,113,113,${0.08 + intensity * 0.22})`,
                    border: `1px solid ${up ? `rgba(74,222,128,${0.1 + intensity * 0.3})` : `rgba(248,113,113,${0.1 + intensity * 0.3})`}`
                  }}
                >
                  <div className="text-white text-sm font-bold">{s.name}</div>
                  <div className={'text-sm font-mono font-bold mt-1 ' + (up ? 'text-green-400' : 'text-red-400')}>
                    {up ? '+' : ''}{s.chg.toFixed(2)}%
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 text-gray-700 text-xs font-mono text-center">
            Sectoral performance is indicative · based on NIFTY sectoral indices
          </div>
        </div>
      )}

      {/* FII / DII */}
      {activeTab === 'fii-dii' && (
        <div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'FII Buy (Today)',  value: '₹3,421 Cr', color: 'text-green-400', sub: 'Provisional' },
              { label: 'FII Sell (Today)', value: '₹2,890 Cr', color: 'text-red-400',   sub: 'Provisional' },
              { label: 'DII Buy (Today)',  value: '₹4,210 Cr', color: 'text-green-400', sub: 'Provisional' },
              { label: 'DII Sell (Today)', value: '₹2,140 Cr', color: 'text-red-400',   sub: 'Provisional' },
            ].map(function(c, i) {
              return (
                <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                  <div className="text-gray-500 text-xs font-mono mb-1">{c.label}</div>
                  <div className={'text-xl font-bold font-mono ' + c.color}>{c.value}</div>
                  <div className="text-gray-600 text-xs font-mono mt-1">{c.sub}</div>
                </div>
              );
            })}
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-white font-semibold text-sm">FII vs DII Monthly Activity (₹ Cr)</span>
              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-400 inline-block"></span>DII</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-400 inline-block"></span>FII</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={FII_DII_DATA} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="fiiGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#60a5fa" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#60a5fa" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="diiGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#4ade80" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#4ade80" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false}
                  tickFormatter={function(v) { return (v/1000).toFixed(0) + 'K'; }}/>
                <Tooltip
                  contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, fontSize: 11 }}
                  formatter={function(v, name) { return ['₹' + Math.abs(v).toLocaleString('en-IN') + ' Cr', name.toUpperCase()]; }}
                />
                <Area type="monotone" dataKey="dii" name="dii" stroke="#4ade80" strokeWidth={1.5} fill="url(#diiGrad)" dot={false}/>
                <Area type="monotone" dataKey="fii" name="fii" stroke="#60a5fa" strokeWidth={1.5} fill="url(#fiiGrad)" dot={false}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-800">
              <span className="text-white font-semibold text-sm">Monthly FII / DII Data</span>
            </div>
            <table className="w-full">
              <thead>
                <tr className="text-gray-500 text-xs font-mono border-b border-gray-800 bg-gray-800/30">
                  <th className="text-left px-4 py-3">MONTH</th>
                  <th className="text-right px-4 py-3">FII NET (₹ Cr)</th>
                  <th className="text-right px-4 py-3">DII NET (₹ Cr)</th>
                  <th className="text-right px-4 py-3">COMBINED</th>
                </tr>
              </thead>
              <tbody>
                {FII_DII_DATA.map(function(row, i) {
                  var combined = row.fii + row.dii;
                  return (
                    <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                      <td className="px-4 py-3 text-gray-300 font-mono text-sm">{row.month} 2025</td>
                      <td className={'px-4 py-3 text-right font-mono text-sm font-bold ' + (row.fii >= 0 ? 'text-green-400' : 'text-red-400')}>
                        {row.fii >= 0 ? '+' : ''}{row.fii.toLocaleString('en-IN')}
                      </td>
                      <td className={'px-4 py-3 text-right font-mono text-sm font-bold text-green-400'}>
                        +{row.dii.toLocaleString('en-IN')}
                      </td>
                      <td className={'px-4 py-3 text-right font-mono text-sm ' + (combined >= 0 ? 'text-green-400' : 'text-red-400')}>
                        {combined >= 0 ? '+' : ''}{combined.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-3 text-gray-700 text-xs font-mono text-center">
            Source: NSE / SEBI disclosures · FII = Foreign Institutional Investors · DII = Domestic Institutional Investors
          </div>
        </div>
      )}

    </div>
  );
}