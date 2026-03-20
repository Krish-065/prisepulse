import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const BASE = (process.env.REACT_APP_API_URL || 'http://localhost:5000') + '/api';

const STOCK_OPTIONS = [
  { sym: 'RELIANCE',   name: 'Reliance Industries' },
  { sym: 'TCS',        name: 'Tata Consultancy'    },
  { sym: 'HDFCBANK',   name: 'HDFC Bank'           },
  { sym: 'INFY',       name: 'Infosys'             },
  { sym: 'WIPRO',      name: 'Wipro'               },
  { sym: 'ITC',        name: 'ITC Ltd'             },
  { sym: 'AXISBANK',   name: 'Axis Bank'           },
  { sym: 'BAJFINANCE', name: 'Bajaj Finance'       },
  { sym: 'TATAMOTORS', name: 'Tata Motors'         },
  { sym: 'MARUTI',     name: 'Maruti Suzuki'       },
];

export default function Portfolio() {
  const [holdings, setHoldings] = useState([]);
  const [prices,   setPrices]   = useState({});
  const [loading,  setLoading]  = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    symbol: 'RELIANCE', name: 'Reliance Industries', quantity: '', buyPrice: ''
  });
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  // ── ALL HOOKS MUST BE BEFORE ANY RETURN ──────────────────────
  useEffect(function() {
    if (!token) return;
    fetchHoldings();
  // eslint-disable-next-line
  }, []);

  var fetchHoldings = async function() {
    try {
      var res = await axios.get(BASE + '/portfolio', {
        headers: { Authorization: 'Bearer ' + token }
      });
      setHoldings(res.data);
      if (res.data.length > 0) fetchPrices(res.data.map(function(h) { return h.symbol; }));
    } catch (err) {
      console.log('Holdings error:', err);
    }
  };

  var fetchPrices = async function(symbols) {
    try {
      var unique = [...new Set(symbols)];
      var res = await axios.post(BASE + '/market/quotes', { symbols: unique });
      var map = {};
      res.data.forEach(function(d) { map[d.symbol] = d; });
      setPrices(map);
    } catch (err) {
      console.log('Price error:', err);
    }
  };

  var addHolding = async function() {
    if (!form.quantity || !form.buyPrice) return;
    setLoading(true);
    try {
      var res = await axios.post(BASE + '/portfolio/add', {
        symbol:   form.symbol,
        name:     form.name,
        quantity: Number(form.quantity),
        buyPrice: Number(form.buyPrice),
      }, { headers: { Authorization: 'Bearer ' + token } });
      setHoldings(res.data);
      fetchPrices(res.data.map(function(h) { return h.symbol; }));
      setShowForm(false);
      setForm({ symbol: 'RELIANCE', name: 'Reliance Industries', quantity: '', buyPrice: '' });
    } catch (err) {
      console.log('Add error:', err);
    }
    setLoading(false);
  };

  var removeHolding = async function(id) {
    try {
      var res = await axios.post(BASE + '/portfolio/remove',
        { id },
        { headers: { Authorization: 'Bearer ' + token } }
      );
      setHoldings(res.data);
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
            <span className="text-green-400 text-2xl">◈</span>
          </div>
          <h2 className="text-white text-xl font-bold mb-2">Login to track Portfolio</h2>
          <p className="text-gray-500 text-sm mb-6 leading-relaxed">
            Create a free account to add your stock holdings and track your profit and loss in real time.
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

  // ── Totals ────────────────────────────────────────────────────
  var totalInvested = 0;
  var totalCurrent  = 0;
  holdings.forEach(function(h) {
    var invested = h.buyPrice * h.quantity;
    totalInvested += invested;
    var p = prices[h.symbol];
    totalCurrent += p && !p.error ? parseFloat(p.price) * h.quantity : invested;
  });
  var totalPL    = totalCurrent - totalInvested;
  var totalPLPct = totalInvested > 0
    ? ((totalPL / totalInvested) * 100).toFixed(2) : 0;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-white text-2xl font-bold">Portfolio</h1>
        <button
          onClick={function() { setShowForm(!showForm); }}
          className="bg-green-400 text-gray-950 font-bold px-4 py-2 rounded-lg text-sm hover:bg-green-300 transition-colors"
        >
          + Add Stock
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Invested',      value: 'Rs.' + totalInvested.toLocaleString('en-IN', { maximumFractionDigits: 0 }), color: 'text-white' },
          { label: 'Current Value', value: 'Rs.' + totalCurrent.toLocaleString('en-IN',  { maximumFractionDigits: 0 }), color: 'text-white' },
          { label: 'Total P&L',
            value: (totalPL >= 0 ? '+' : '') + 'Rs.' + Math.abs(totalPL).toLocaleString('en-IN', { maximumFractionDigits: 0 }) + ' (' + totalPLPct + '%)',
            color: totalPL >= 0 ? 'text-green-400' : 'text-red-400' },
        ].map(function(card) {
          return (
            <div key={card.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="text-gray-400 text-xs font-mono mb-1">{card.label}</div>
              <div className={'text-xl font-bold font-mono ' + card.color}>{card.value}</div>
            </div>
          );
        })}
      </div>

      {/* Add Stock Form */}
      {showForm && (
        <div className="bg-gray-900 border border-green-400/30 rounded-xl p-5 mb-6">
          <h3 className="text-white font-semibold mb-4">Add New Holding</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-gray-400 text-xs font-mono mb-1 block">STOCK</label>
              <select
                value={form.symbol}
                onChange={function(e) {
                  var stock = STOCK_OPTIONS.find(function(s) { return s.sym === e.target.value; });
                  setForm({ ...form, symbol: stock.sym, name: stock.name });
                }}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm w-full outline-none focus:border-green-400"
              >
                {STOCK_OPTIONS.map(function(s) {
                  return <option key={s.sym} value={s.sym}>{s.sym} — {s.name}</option>;
                })}
              </select>
            </div>
            <div>
              <label className="text-gray-400 text-xs font-mono mb-1 block">QUANTITY</label>
              <input
                type="number"
                placeholder="e.g. 10"
                value={form.quantity}
                onChange={function(e) { setForm({ ...form, quantity: e.target.value }); }}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm w-full outline-none focus:border-green-400"
              />
            </div>
            <div>
              <label className="text-gray-400 text-xs font-mono mb-1 block">BUY PRICE (Rs.)</label>
              <input
                type="number"
                placeholder="e.g. 2800"
                value={form.buyPrice}
                onChange={function(e) { setForm({ ...form, buyPrice: e.target.value }); }}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm w-full outline-none focus:border-green-400"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={addHolding}
                disabled={loading}
                className="bg-green-400 text-gray-950 font-bold px-6 py-2 rounded-lg text-sm hover:bg-green-300 transition-colors w-full disabled:opacity-50"
              >
                {loading ? 'Adding...' : 'Add to Portfolio'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Holdings Table */}
      {holdings.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center text-gray-500">
          No holdings yet. Click "Add Stock" to get started.
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="text-gray-500 text-xs font-mono border-b border-gray-800">
                <th className="text-left px-5 py-3">STOCK</th>
                <th className="text-right px-5 py-3">QTY</th>
                <th className="text-right px-5 py-3">BUY PRICE</th>
                <th className="text-right px-5 py-3">CUR PRICE</th>
                <th className="text-right px-5 py-3">INVESTED</th>
                <th className="text-right px-5 py-3">P&L</th>
                <th className="text-right px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {holdings.map(function(h) {
                var p        = prices[h.symbol];
                var curPrice = p && !p.error ? parseFloat(p.price) : null;
                var invested = h.buyPrice * h.quantity;
                var current  = curPrice ? curPrice * h.quantity : null;
                var pl       = current ? current - invested : null;
                var plPct    = pl ? ((pl / invested) * 100).toFixed(2) : null;
                return (
                  <tr key={h._id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-mono font-bold text-white">{h.symbol}</div>
                      <div className="text-gray-500 text-xs">{h.name}</div>
                    </td>
                    <td className="px-5 py-4 text-right font-mono text-white">{h.quantity}</td>
                    <td className="px-5 py-4 text-right font-mono text-white">Rs.{h.buyPrice}</td>
                    <td className="px-5 py-4 text-right font-mono text-white">
                      {curPrice ? 'Rs.' + curPrice : 'Loading...'}
                    </td>
                    <td className="px-5 py-4 text-right font-mono text-white">
                      Rs.{invested.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </td>
                    <td className={'px-5 py-4 text-right font-mono font-bold ' + (
                      pl === null ? 'text-gray-500' : pl >= 0 ? 'text-green-400' : 'text-red-400'
                    )}>
                      {pl === null
                        ? '-'
                        : (pl >= 0 ? '+' : '-') + 'Rs.' + Math.abs(pl).toLocaleString('en-IN', { maximumFractionDigits: 0 }) + ' (' + plPct + '%)'}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={function() { removeHolding(h._id); }}
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
    </div>
  );
}