import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

var API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function timeAgo(iso) {
  var diff = Math.floor((Date.now() - new Date(iso)) / 60000);
  if (diff < 1) return 'just now';
  if (diff < 60) return diff + 'm ago';
  return Math.floor(diff / 60) + 'h ago';
}

export default function Markets() {
  var [gainers,     setGainers]     = useState([]);
  var [losers,      setLosers]      = useState([]);
  var [news,        setNews]        = useState([]);
  var [commodities, setCommodities] = useState(null);
  var [status,      setStatus]      = useState(null);
  var [chartData,   setChartData]   = useState([]);
  var [activeTab,   setActiveTab]   = useState('overview');
  var [nifty,       setNifty]       = useState(0);
  var [sensex,      setSensex]      = useState(0);
  var [bankNifty,   setBankNifty]   = useState(0);
  var [niftyIT,     setNiftyIT]     = useState(0);
  var [niftyChg,    setNiftyChg]    = useState(0);
  var [sensexChg,   setSensexChg]   = useState(0);
  var [bankChg,     setBankChg]     = useState(0);
  var [itChg,       setITChg]       = useState(0);
  var socketRef = useRef(null);

  useEffect(function() {
    // Dynamically import socket.io to avoid init issues
    var io = require('socket.io-client');
    var socket = io(API, {
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });
    socketRef.current = socket;

    socket.on('connect', function() {
      console.log('Socket connected:', socket.id);
    });

    socket.on('price-update', function(d) {
      console.log('Price update received - NIFTY:', d.NIFTY);
      if (d.NIFTY)      setNifty(Number(d.NIFTY));
      if (d.SENSEX)     setSensex(Number(d.SENSEX));
      if (d.BANK_NIFTY) setBankNifty(Number(d.BANK_NIFTY));
      if (d.NIFTY_IT)   setNiftyIT(Number(d.NIFTY_IT));
      if (d.NIFTY_CHANGE      !== undefined) setNiftyChg(Number(d.NIFTY_CHANGE));
      if (d.SENSEX_CHANGE     !== undefined) setSensexChg(Number(d.SENSEX_CHANGE));
      if (d.BANK_NIFTY_CHANGE !== undefined) setBankChg(Number(d.BANK_NIFTY_CHANGE));
      if (d.NIFTY_IT_CHANGE   !== undefined) setITChg(Number(d.NIFTY_IT_CHANGE));
    });

    socket.on('disconnect', function() {
      console.log('Socket disconnected');
    });

    socket.on('connect_error', function(err) {
      console.log('Socket error:', err.message);
    });

    // Load all REST data
    var load = async function() {
      var BASE = API + '/api/market';
      var results = await Promise.allSettled([
        axios.get(BASE + '/gainers'),
        axios.get(BASE + '/losers'),
        axios.get(BASE + '/news'),
        axios.get(BASE + '/commodities'),
        axios.get(BASE + '/status'),
        axios.get(BASE + '/chart/NIFTY%2050'),
      ]);
      if (results[0].status === 'fulfilled') setGainers(results[0].value.data);
      if (results[1].status === 'fulfilled') setLosers(results[1].value.data);
      if (results[2].status === 'fulfilled') setNews(results[2].value.data);
      if (results[3].status === 'fulfilled') setCommodities(results[3].value.data);
      if (results[4].status === 'fulfilled') setStatus(results[4].value.data);
      if (results[5].status === 'fulfilled') setChartData(results[5].value.data);
    };

    load();
    var interval = setInterval(load, 60000);

    return function() {
      socket.disconnect();
      clearInterval(interval);
    };
  }, []);

  var tabs = ['overview', 'gainers', 'losers', 'news', 'commodities'];

  var IndexCard = function(props) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <div className="text-gray-400 text-xs font-mono mb-1">{props.label} - LIVE</div>
        <div className="text-white text-xl font-bold font-mono">
          {props.value > 0
            ? props.value.toLocaleString('en-IN', { maximumFractionDigits: 2 })
            : 'Loading...'}
        </div>
        <div className={'text-xs font-mono mt-1 ' + (props.change >= 0 ? 'text-green-400' : 'text-red-400')}>
          {props.change >= 0 ? '+' : ''}{props.change.toFixed(2)}%
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 max-w-7xl mx-auto">

      {status && (
        <div className={
          'flex items-center gap-2 px-4 py-2 rounded-lg mb-4 text-xs font-mono ' +
          (status.isOpen
            ? 'bg-green-400/10 text-green-400 border border-green-400/20'
            : 'bg-gray-800 text-gray-400 border border-gray-700')
        }>
          <span className={'w-2 h-2 rounded-full ' + (status.isOpen ? 'bg-green-400 animate-pulse' : 'bg-gray-500')}></span>
          {status.status} -- {status.message} -- IST {status.time}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <IndexCard label="NIFTY 50"   value={nifty}     change={niftyChg}  />
        <IndexCard label="SENSEX"     value={sensex}    change={sensexChg} />
        <IndexCard label="BANK NIFTY" value={bankNifty} change={bankChg}   />
        <IndexCard label="NIFTY IT"   value={niftyIT}   change={itChg}     />
      </div>

      {chartData.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6">
          <div className="text-white font-semibold mb-3 text-sm">NIFTY 50 - Intraday Chart</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <XAxis
                dataKey="time"
                tick={{ fill: '#6b7280', fontSize: 10 }}
                interval={10}
              />
              <YAxis
                domain={['auto', 'auto']}
                tick={{ fill: '#6b7280', fontSize: 10 }}
                width={75}
                tickFormatter={function(v) { return v.toLocaleString('en-IN'); }}
              />
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

      <div className="flex gap-1 mb-4 border-b border-gray-800">
        {tabs.map(function(t) {
          return (
            <button
              key={t}
              onClick={function() { setActiveTab(t); }}
              className={
                'px-4 py-2 text-xs font-mono capitalize transition-all border-b-2 ' +
                (activeTab === t
                  ? 'text-green-400 border-green-400'
                  : 'text-gray-500 border-transparent hover:text-white')
              }
            >{t}</button>
          );
        })}
      </div>

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

      {activeTab === 'news' && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          {news.length === 0 ? (
            <div className="px-5 py-8 text-gray-500 text-xs text-center font-mono">Loading news...</div>
          ) : (
            news.map(function(n, i) {
              return (
                <div key={i} className="px-5 py-4 border-b border-gray-800 last:border-0 hover:bg-gray-800/30 cursor-pointer transition-colors">
                  <div className="text-white text-sm font-medium mb-1">{n.title}</div>
                  <div className="text-gray-500 text-xs font-mono">{n.source} - {timeAgo(n.time)}</div>
                </div>
              );
            })
          )}
        </div>
      )}

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
                  <div className="text-gray-400 text-xs font-mono mb-1 mt-2">{c.label} - {c.unit}</div>
                  <div className="text-white text-2xl font-bold font-mono">Rs.{d.price.toLocaleString('en-IN')}</div>
                  <div className={'text-xs font-mono mt-1 ' + (d.change.startsWith('+') ? 'text-green-400' : 'text-red-400')}>{d.change}</div>
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