import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const BASE     = (process.env.REACT_APP_API_URL || 'http://localhost:5000') + '/api';
const MKTBASE  = (process.env.REACT_APP_API_URL || 'http://localhost:5000') + '/api/market';

// ── All price calls go through YOUR backend — no direct browser API calls ──
// Fixes: Yahoo Finance CORS block, CoinGecko rate-limit

const NSE_STOCKS = [
  { sym: 'RELIANCE',   name: 'Reliance Industries'       },
  { sym: 'TCS',        name: 'Tata Consultancy Services' },
  { sym: 'HDFCBANK',   name: 'HDFC Bank'                 },
  { sym: 'INFY',       name: 'Infosys'                   },
  { sym: 'ICICIBANK',  name: 'ICICI Bank'                },
  { sym: 'SBIN',       name: 'SBI'                       },
  { sym: 'BAJFINANCE', name: 'Bajaj Finance'             },
  { sym: 'BHARTIARTL', name: 'Bharti Airtel'             },
  { sym: 'WIPRO',      name: 'Wipro'                     },
  { sym: 'AXISBANK',   name: 'Axis Bank'                 },
  { sym: 'LT',         name: 'Larsen and Toubro'         },
  { sym: 'ITC',        name: 'ITC Ltd'                   },
  { sym: 'ASIANPAINT', name: 'Asian Paints'              },
  { sym: 'MARUTI',     name: 'Maruti Suzuki'             },
  { sym: 'SUNPHARMA',  name: 'Sun Pharma'                },
  { sym: 'TITAN',      name: 'Titan Company'             },
  { sym: 'ULTRACEMCO', name: 'UltraTech Cement'          },
  { sym: 'NESTLEIND',  name: 'Nestle India'              },
  { sym: 'TATAMOTORS', name: 'Tata Motors'               },
  { sym: 'TATASTEEL',  name: 'Tata Steel'                },
  { sym: 'JSWSTEEL',   name: 'JSW Steel'                 },
  { sym: 'HCLTECH',    name: 'HCL Technologies'          },
  { sym: 'TECHM',      name: 'Tech Mahindra'             },
  { sym: 'KOTAKBK',    name: 'Kotak Mahindra Bank'       },
  { sym: 'HINDUNILVR', name: 'Hindustan Unilever'        },
  { sym: 'ONGC',       name: 'ONGC'                      },
  { sym: 'NTPC',       name: 'NTPC'                      },
  { sym: 'ADANIPORTS', name: 'Adani Ports'               },
  { sym: 'COALINDIA',  name: 'Coal India'                },
  { sym: 'HINDALCO',   name: 'Hindalco Industries'       },
  { sym: 'M&M',        name: 'Mahindra and Mahindra'     },
  { sym: 'DRREDDY',    name: 'Dr Reddys Laboratories'    },
  { sym: 'CIPLA',      name: 'Cipla'                     },
  { sym: 'IRCTC',      name: 'IRCTC'                     },
  { sym: 'DLF',        name: 'DLF'                       },
  { sym: 'HAL',        name: 'Hindustan Aeronautics'     },
  { sym: 'BEL',        name: 'Bharat Electronics'        },
  { sym: 'ETERNAL',    name: 'Eternal (Zomato)'          },
  { sym: 'PAYTM',      name: 'Paytm'                     },
  { sym: 'NYKAA',      name: 'Nykaa'                     },
  { sym: 'TATAPOWER',  name: 'Tata Power'                },
  { sym: 'ADANIGREEN', name: 'Adani Green Energy'        },
  { sym: 'TATACONSUM', name: 'Tata Consumer Products'    },
  { sym: 'EICHERMOT',  name: 'Eicher Motors'             },
  { sym: 'BAJAJ-AUTO', name: 'Bajaj Auto'                },
];

const CRYPTO_LIST = [
  { id: 'bitcoin',       sym: 'BTC',  name: 'Bitcoin'   },
  { id: 'ethereum',      sym: 'ETH',  name: 'Ethereum'  },
  { id: 'binancecoin',   sym: 'BNB',  name: 'BNB'       },
  { id: 'solana',        sym: 'SOL',  name: 'Solana'    },
  { id: 'ripple',        sym: 'XRP',  name: 'XRP'       },
  { id: 'cardano',       sym: 'ADA',  name: 'Cardano'   },
  { id: 'dogecoin',      sym: 'DOGE', name: 'Dogecoin'  },
  { id: 'polkadot',      sym: 'DOT',  name: 'Polkadot'  },
  { id: 'avalanche-2',   sym: 'AVAX', name: 'Avalanche' },
  { id: 'matic-network', sym: 'MATIC',name: 'Polygon'   },
  { id: 'chainlink',     sym: 'LINK', name: 'Chainlink' },
  { id: 'litecoin',      sym: 'LTC',  name: 'Litecoin'  },
];

const COMMODITY_LIST = [
  { id: 'gold',      name: 'Gold',      unit: 'per 10g', icon: '🥇' },
  { id: 'silver',    name: 'Silver',    unit: 'per kg',  icon: '🥈' },
  { id: 'crude',     name: 'Crude Oil', unit: 'per bbl', icon: '🛢'  },
  { id: 'copper',    name: 'Copper',    unit: 'per kg',  icon: '🔩' },
  { id: 'aluminium', name: 'Aluminium', unit: 'per kg',  icon: '⚙'  },
  { id: 'zinc',      name: 'Zinc',      unit: 'per kg',  icon: '🔗' },
];

const PIE_COLORS = ['#4ade80', '#60a5fa', '#f59e0b'];

export default function Portfolio() {
  const [tab,          setTab]          = useState('stocks');
  const [holdings,     setHoldings]     = useState([]);
  const [prices,       setPrices]       = useState({});
  const [cryptoPrices, setCryptoPrices] = useState({});
  const [commPrices,   setCommPrices]   = useState({});
  const [loading,      setLoading]      = useState(false);
  const [showForm,     setShowForm]     = useState(false);
  const [stockSearch,  setStockSearch]  = useState('');
  const [showSugg,     setShowSugg]     = useState(false);
  const [lastUpdated,  setLastUpdated]  = useState(null);
  const [form, setForm] = useState({ symbol: '', name: '', quantity: '', buyPrice: '', type: 'stock' });

  const navigate    = useNavigate();
  const token       = localStorage.getItem('token');
  const authHeaders = { Authorization: 'Bearer ' + token };

  // ── Load holdings from backend ──────────────────────────────────
  const loadHoldings = useCallback(async () => {
    if (!token) return;
    try {
      const { data } = await axios.get(BASE + '/portfolio', { headers: authHeaders });
      setHoldings(data || []);
    } catch (err) {
      if (err.response && err.response.status === 401) navigate('/login');
    }
  }, [token]);

  // ── Fetch stock prices via backend (/market/stock-quotes) ────────
  const fetchStockPrices = useCallback(async (h) => {
    const stockSyms = (h || holdings).filter(x => !x.type || x.type === 'stock').map(x => x.symbol);
    if (stockSyms.length === 0) return;
    try {
      const nsSyms = stockSyms.map(s => s + '.NS').join(',');
      const { data } = await axios.get(
        MKTBASE + '/stock-quotes?symbols=' + encodeURIComponent(nsSyms),
        { timeout: 15000 }
      );
      // data = { RELIANCE: { price, change }, TCS: { price, change }, ... }
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        setPrices(data);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.log('[Portfolio] Stock prices error:', err.message);
    }
  }, [holdings]);

  // ── Fetch crypto prices via backend (/market/crypto-prices) ─────
  const fetchCryptoPrices = useCallback(async (h) => {
      const ids = (h || holdings).filter(x => x.type === 'crypto').map(x => x.symbol);
      if (ids.length === 0) return;
      try {
        const { data } = await axios.get(
          MKTBASE + '/crypto-prices?ids=' + ids.join(','),
          { timeout: 15000 }
        );
        if (data && typeof data === 'object') setCryptoPrices(data);
      } catch (err) {
        console.log('[Portfolio] Crypto prices error:', err.message);
      }
    }, [holdings]);

  // ── Fetch commodity prices via backend ──────────────────────────
  const fetchCommPrices = useCallback(async () => {
    try {
      const { data } = await axios.get(MKTBASE + '/commodities', { timeout: 8000 });
      if (data && typeof data === 'object') setCommPrices(data);
    } catch (err) {
      console.log('[Portfolio] Commodity prices error:', err.message);
    }
  }, []);

  // ── On mount: check auth, load holdings ─────────────────────────
  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    loadHoldings();
  }, [token]);

  // ── On holdings change: fetch all prices + set auto-refresh ─────
  useEffect(() => {
    if (holdings.length === 0) return;
    fetchStockPrices(holdings);
    fetchCryptoPrices(holdings);
    fetchCommPrices();
    const interval = setInterval(() => {
      fetchStockPrices(holdings);
      fetchCryptoPrices(holdings);
      fetchCommPrices();
    }, 30000);
    return () => clearInterval(interval);
  }, [holdings]);

  // ── Add holding ─────────────────────────────────────────────────
  const addHolding = async () => {
    if (!form.symbol || !form.quantity || !form.buyPrice) return;
    setLoading(true);
    try {
      const { data } = await axios.post(BASE + '/portfolio/add', form, { headers: authHeaders });
      setHoldings(data);
      setShowForm(false);
      setForm({ symbol: '', name: '', quantity: '', buyPrice: '', type: 'stock' });
      setStockSearch('');
    } catch (err) {
      console.log('[Portfolio] Add failed:', err.message);
    }
    setLoading(false);
  };

  const removeHolding = async (id) => {
    try {
      const { data } = await axios.post(BASE + '/portfolio/remove', { id }, { headers: authHeaders });
      setHoldings(data);
    } catch {}
  };

  // ── Get current price for a holding ─────────────────────────────
  const getPrice = (h) => {
    if (!h.type || h.type === 'stock') {
      const p = prices[h.symbol];
      return p && p.price > 0 ? p.price : 0;
    }
    if (h.type === 'crypto') {
      const c = cryptoPrices[h.symbol] || cryptoPrices[h.symbol?.toLowerCase?.()];
      return c && c.price > 0 ? c.price : 0;
    }
    if (h.type === 'commodity') {
      const c = commPrices[h.symbol];
      return c && c.price > 0 ? c.price : 0;
    }
    return 0;
  };

  // ── Stock search suggestions ─────────────────────────────────────
  const stockSugg = stockSearch.length > 0
    ? NSE_STOCKS.filter(s =>
        s.sym.toLowerCase().includes(stockSearch.toLowerCase()) ||
        s.name.toLowerCase().includes(stockSearch.toLowerCase())
      ).slice(0, 6)
    : [];

  // ── Holdings grouped by type ─────────────────────────────────────
  const stockHoldings = holdings.filter(h => !h.type || h.type === 'stock');
  const cryptoHoldings = holdings.filter(h => h.type === 'crypto');
  const commHoldings   = holdings.filter(h => h.type === 'commodity');

  // ── Portfolio summary ────────────────────────────────────────────
  const allWithPrices = holdings.map(h => {
    const cp       = getPrice(h);
    const invested = h.buyPrice * h.quantity;
    const current  = cp > 0 ? cp * h.quantity : invested;
    return { ...h, cp, invested, current, pnl: current - invested };
  });

  const totalInvested = allWithPrices.reduce((a, h) => a + h.invested, 0);
  const totalCurrent  = allWithPrices.reduce((a, h) => a + h.current,  0);
  const totalPnL      = totalCurrent - totalInvested;
  const totalPct      = totalInvested > 0 ? (totalPnL / totalInvested * 100) : 0;

  const pieData = [
    { name: 'Stocks',      value: stockHoldings.reduce((a, h) => a + (getPrice(h) > 0 ? getPrice(h) : h.buyPrice) * h.quantity, 0) },
    { name: 'Crypto',      value: cryptoHoldings.reduce((a, h) => a + (getPrice(h) > 0 ? getPrice(h) : h.buyPrice) * h.quantity, 0) },
    { name: 'Commodities', value: commHoldings.reduce((a, h) => a + (getPrice(h) > 0 ? getPrice(h) : h.buyPrice) * h.quantity, 0) },
  ].filter(d => d.value > 0);

  // ── Render holdings table ────────────────────────────────────────
  const renderTable = (list) => {
    if (list.length === 0) return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
        <div className="text-4xl mb-3">📭</div>
        <div className="text-gray-400 text-sm mb-1">No holdings yet</div>
        <div className="text-gray-600 text-xs font-mono">Click "+ Add Holding" to start tracking</div>
      </div>
    );
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-max">
            <thead>
              <tr className="text-gray-500 text-xs font-mono border-b border-gray-800 bg-gray-800/30">
                <th className="text-left px-4 py-3">ASSET</th>
                <th className="text-right px-4 py-3">QTY</th>
                <th className="text-right px-4 py-3">BUY PRICE</th>
                <th className="text-right px-4 py-3">CURRENT</th>
                <th className="text-right px-4 py-3">INVESTED</th>
                <th className="text-right px-4 py-3">CURRENT VAL</th>
                <th className="text-right px-4 py-3">P&L</th>
                <th className="text-right px-4 py-3">CHANGE %</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {list.map((h, i) => {
                const cp       = getPrice(h);
                const invested = h.buyPrice * h.quantity;
                const current  = cp > 0 ? cp * h.quantity : invested;
                const pnl      = current - invested;
                const pct      = invested > 0 ? (pnl / invested * 100).toFixed(2) : '0.00';
                const hasPrice = cp > 0;
                return (
                  <tr key={h._id || i} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-mono font-bold text-white text-sm">{h.symbol.toUpperCase()}</div>
                      <div className="text-gray-500 text-xs">{h.name}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-white text-sm">{h.quantity}</td>
                    <td className="px-4 py-3 text-right font-mono text-gray-400 text-sm">
                      ₹{Number(h.buyPrice).toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm">
                      {hasPrice
                        ? <span className="text-white">₹{cp.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                        : <span className="text-yellow-500 text-xs animate-pulse">fetching...</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-gray-400 text-sm">
                      ₹{invested.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-white text-sm">
                      {hasPrice ? '₹' + current.toLocaleString('en-IN', { maximumFractionDigits: 0 }) : <span className="text-gray-600">—</span>}
                    </td>
                    <td className={'px-4 py-3 text-right font-mono text-sm font-bold ' + (pnl >= 0 ? 'text-green-400' : 'text-red-400')}>
                      {hasPrice ? (pnl >= 0 ? '+' : '') + '₹' + pnl.toLocaleString('en-IN', { maximumFractionDigits: 0 }) : <span className="text-gray-600">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {hasPrice
                        ? <span className={'px-2 py-0.5 rounded font-mono font-bold text-xs ' + (parseFloat(pct) >= 0 ? 'bg-green-400/10 text-green-400' : 'bg-red-400/10 text-red-400')}>
                            {parseFloat(pct) >= 0 ? '+' : ''}{pct}%
                          </span>
                        : <span className="text-gray-600 font-mono text-xs">—</span>
                      }
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => removeHolding(h._id)}
                        className="text-gray-600 hover:text-red-400 text-xs px-2 py-1 rounded hover:bg-red-400/10 transition-colors">✕</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2 border-t border-gray-800 flex items-center justify-between">
          <span className="text-gray-700 text-xs font-mono">
            Auto-refreshes every 30s · via backend proxy
          </span>
          {lastUpdated && (
            <span className="text-gray-600 text-xs font-mono">
              Updated {lastUpdated.toLocaleTimeString('en-IN')}
            </span>
          )}
        </div>
      </div>
    );
  };

  const tabs = ['stocks', 'crypto', 'commodities'];

  return (
    <div className="p-4 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-white text-2xl font-bold">Portfolio</h1>
          <p className="text-gray-500 text-xs font-mono mt-1">
            {holdings.length} holdings · {[stockHoldings.length > 0, cryptoHoldings.length > 0, commHoldings.length > 0].filter(Boolean).length} asset classes
          </p>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setForm({ symbol: '', name: '', quantity: '', buyPrice: '', type: tab === 'crypto' ? 'crypto' : tab === 'commodities' ? 'commodity' : 'stock' });
            setStockSearch('');
          }}
          className="bg-green-400 text-gray-950 font-bold px-4 py-2 rounded-lg text-sm hover:bg-green-300 transition-colors"
        >
          + Add Holding
        </button>
      </div>

      {/* Summary Cards */}
      {holdings.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total Invested',  value: '₹' + totalInvested.toLocaleString('en-IN', { maximumFractionDigits: 0 }), color: 'text-white' },
            { label: 'Current Value',   value: '₹' + totalCurrent.toLocaleString('en-IN',  { maximumFractionDigits: 0 }), color: 'text-white' },
            { label: 'Total P&L',       value: (totalPnL >= 0 ? '+' : '') + '₹' + totalPnL.toLocaleString('en-IN', { maximumFractionDigits: 0 }), color: totalPnL >= 0 ? 'text-green-400' : 'text-red-400' },
            { label: 'Return',          value: (totalPct >= 0 ? '+' : '') + totalPct.toFixed(2) + '%', color: totalPct >= 0 ? 'text-green-400' : 'text-red-400' },
          ].map((c, i) => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="text-gray-500 text-xs font-mono mb-1">{c.label}</div>
              <div className={'text-xl font-bold font-mono ' + c.color}>{c.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Allocation Pie */}
      {pieData.length > 1 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-6">
            <div className="flex-shrink-0">
              <div className="text-white font-semibold text-sm mb-3">Asset Allocation</div>
              <ResponsiveContainer width={120} height={120}>
                <PieChart>
                  <Pie data={pieData} cx={55} cy={55} innerRadius={35} outerRadius={55} paddingAngle={2} dataKey="value">
                    {pieData.map((_, index) => <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => '₹' + v.toLocaleString('en-IN', { maximumFractionDigits: 0 })} contentStyle={{ background: '#111827', border: '1px solid #374151', fontSize: 11 }}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-2">
              {pieData.map((d, i) => {
                const pct = totalCurrent > 0 ? (d.value / totalCurrent * 100).toFixed(1) : 0;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}></div>
                    <span className="text-gray-300 text-sm flex-1">{d.name}</span>
                    <span className="text-white font-mono text-sm">{pct}%</span>
                    <span className="text-gray-500 font-mono text-xs">₹{(d.value / 100000).toFixed(1)}L</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-gray-800">
        {tabs.map(t => (
          <button key={t} onClick={() => { setTab(t); setShowForm(false); }}
            className={'px-4 py-2 text-xs font-mono capitalize transition-all border-b-2 ' +
              (tab === t ? 'text-green-400 border-green-400' : 'text-gray-500 border-transparent hover:text-white')}>
            {t}
            {t === 'stocks'      && stockHoldings.length  > 0 && <span className="ml-1.5 bg-green-400/20 text-green-400 px-1.5 py-0.5 rounded text-xs">{stockHoldings.length}</span>}
            {t === 'crypto'      && cryptoHoldings.length > 0 && <span className="ml-1.5 bg-green-400/20 text-green-400 px-1.5 py-0.5 rounded text-xs">{cryptoHoldings.length}</span>}
            {t === 'commodities' && commHoldings.length   > 0 && <span className="ml-1.5 bg-green-400/20 text-green-400 px-1.5 py-0.5 rounded text-xs">{commHoldings.length}</span>}
          </button>
        ))}
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="bg-gray-900 border border-green-400/30 rounded-xl p-5 mb-5">
          <h3 className="text-white font-semibold mb-4 text-sm flex items-center gap-2">
            <span>{tab === 'stocks' ? '📈' : tab === 'crypto' ? '₿' : '🏅'}</span>
            Add {tab === 'stocks' ? 'Stock' : tab === 'crypto' ? 'Crypto' : 'Commodity'} Holding
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

            {tab === 'stocks' && (
              <div className="col-span-2 relative">
                <label className="text-gray-400 text-xs font-mono mb-1 block">SEARCH STOCK</label>
                <input type="text" placeholder="Type symbol or company..."
                  value={stockSearch}
                  onChange={e => { setStockSearch(e.target.value); setShowSugg(true); setForm(f => ({ ...f, symbol: e.target.value.toUpperCase(), name: '' })); }}
                  onFocus={() => setShowSugg(true)}
                  onBlur={() => setTimeout(() => setShowSugg(false), 200)}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm w-full outline-none focus:border-green-400"
                />
                {showSugg && stockSugg.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-xl overflow-hidden z-50 shadow-xl">
                    {stockSugg.map((s, i) => (
                      <div key={i}
                        onMouseDown={() => { setForm(f => ({ ...f, symbol: s.sym, name: s.name, type: 'stock' })); setStockSearch(s.sym + ' — ' + s.name); setShowSugg(false); }}
                        className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-gray-700 border-b border-gray-700 last:border-0"
                      >
                        <span className="font-mono font-bold text-white text-sm w-24 flex-shrink-0">{s.sym}</span>
                        <span className="text-gray-400 text-xs">{s.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === 'crypto' && (
              <div className="col-span-2">
                <label className="text-gray-400 text-xs font-mono mb-1 block">SELECT CRYPTO</label>
                <select value={form.symbol}
                  onChange={e => { const c = CRYPTO_LIST.find(x => x.id === e.target.value); if (c) setForm(f => ({ ...f, symbol: c.id, name: c.name + ' (' + c.sym + ')', type: 'crypto' })); }}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm w-full outline-none focus:border-green-400">
                  <option value="">-- Select Crypto --</option>
                  {CRYPTO_LIST.map(c => <option key={c.id} value={c.id}>{c.sym} — {c.name}</option>)}
                </select>
              </div>
            )}

            {tab === 'commodities' && (
              <div className="col-span-2">
                <label className="text-gray-400 text-xs font-mono mb-1 block">SELECT COMMODITY</label>
                <select value={form.symbol}
                  onChange={e => { const c = COMMODITY_LIST.find(x => x.id === e.target.value); if (c) setForm(f => ({ ...f, symbol: c.id, name: c.name, type: 'commodity' })); }}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm w-full outline-none focus:border-green-400">
                  <option value="">-- Select Commodity --</option>
                  {COMMODITY_LIST.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name} ({c.unit})</option>)}
                </select>
              </div>
            )}

            <div>
              <label className="text-gray-400 text-xs font-mono mb-1 block">QUANTITY</label>
              <input type="number" placeholder="e.g. 10" value={form.quantity}
                onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm w-full outline-none focus:border-green-400"
              />
            </div>
            <div>
              <label className="text-gray-400 text-xs font-mono mb-1 block">BUY PRICE (₹)</label>
              <input type="number" placeholder="e.g. 2800" value={form.buyPrice}
                onChange={e => setForm(f => ({ ...f, buyPrice: e.target.value }))}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm w-full outline-none focus:border-green-400"
              />
            </div>
            <div className="col-span-2 md:col-span-4 flex gap-3">
              <button onClick={addHolding}
                disabled={loading || !form.symbol || !form.quantity || !form.buyPrice}
                className="bg-green-400 text-gray-950 font-bold px-5 py-2 rounded-lg text-sm hover:bg-green-300 transition-colors disabled:opacity-50">
                {loading ? 'Adding...' : 'Add to Portfolio'}
              </button>
              <button onClick={() => setShowForm(false)}
                className="text-gray-500 text-sm px-4 py-2 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === 'stocks'      && renderTable(stockHoldings)}
      {tab === 'crypto'      && renderTable(cryptoHoldings)}
      {tab === 'commodities' && renderTable(commHoldings)}
    </div>
  );
}
