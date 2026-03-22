import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const BASE = (process.env.REACT_APP_API_URL || 'http://localhost:5000') + '/api';

// Direct CoinGecko fetch by specific IDs — guaranteed to return all requested coins
const fetchCryptoByIds = async (ids) => {
  if (!ids || ids.length === 0) return {};
  try {
    const res = await axios.get(
      'https://api.coingecko.com/api/v3/coins/markets' +
      '?vs_currency=inr' +
      '&ids=' + ids.join(',') +
      '&order=market_cap_desc&per_page=50&page=1&price_change_percentage=24h',
      { timeout: 15000, headers: { 'Accept': 'application/json' } }
    );
    const map = {};
    res.data.forEach(c => {
      const obj = {
        id:        c.id,
        symbol:    c.symbol.toUpperCase(),
        name:      c.name,
        price:     c.current_price,
        change24h: c.price_change_percentage_24h
          ? c.price_change_percentage_24h.toFixed(2) : '0',
      };
      map[c.id]                   = obj;
      map[c.symbol.toUpperCase()] = obj;
      map[c.symbol.toLowerCase()] = obj;
    });
    return map;
  } catch (err) {
    console.log('CoinGecko direct error:', err.message);
    return {};
  }
};

const NSE_STOCKS = [
  { sym: 'RELIANCE',   name: 'Reliance Industries'        },
  { sym: 'TCS',        name: 'Tata Consultancy Services'  },
  { sym: 'HDFCBANK',   name: 'HDFC Bank'                  },
  { sym: 'INFY',       name: 'Infosys'                    },
  { sym: 'ICICIBANK',  name: 'ICICI Bank'                 },
  { sym: 'SBIN',       name: 'State Bank of India'        },
  { sym: 'BAJFINANCE', name: 'Bajaj Finance'              },
  { sym: 'BHARTIARTL', name: 'Bharti Airtel'              },
  { sym: 'WIPRO',      name: 'Wipro'                      },
  { sym: 'AXISBANK',   name: 'Axis Bank'                  },
  { sym: 'LT',         name: 'Larsen and Toubro'          },
  { sym: 'ITC',        name: 'ITC Ltd'                    },
  { sym: 'ASIANPAINT', name: 'Asian Paints'               },
  { sym: 'MARUTI',     name: 'Maruti Suzuki'              },
  { sym: 'SUNPHARMA',  name: 'Sun Pharmaceutical'         },
  { sym: 'TITAN',      name: 'Titan Company'              },
  { sym: 'ULTRACEMCO', name: 'UltraTech Cement'           },
  { sym: 'NESTLEIND',  name: 'Nestle India'               },
  { sym: 'TATAMOTORS', name: 'Tata Motors'                },
  { sym: 'TATASTEEL',  name: 'Tata Steel'                 },
  { sym: 'JSWSTEEL',   name: 'JSW Steel'                  },
  { sym: 'HDFCLIFE',   name: 'HDFC Life Insurance'        },
  { sym: 'POWERGRID',  name: 'Power Grid Corp'            },
  { sym: 'NTPC',       name: 'NTPC Ltd'                   },
  { sym: 'ADANIPORTS', name: 'Adani Ports'                },
  { sym: 'CIPLA',      name: 'Cipla Ltd'                  },
  { sym: 'DRREDDY',    name: 'Dr Reddys Laboratories'     },
  { sym: 'HCLTECH',    name: 'HCL Technologies'           },
  { sym: 'TECHM',      name: 'Tech Mahindra'              },
  { sym: 'COALINDIA',  name: 'Coal India'                 },
  { sym: 'BPCL',       name: 'Bharat Petroleum'           },
  { sym: 'ETERNAL',    name: 'Eternal Ltd (Zomato)'       },
  { sym: 'BANKBARODA', name: 'Bank of Baroda'             },
  { sym: 'PNB',        name: 'Punjab National Bank'       },
  { sym: 'YESBANK',    name: 'Yes Bank'                   },
  { sym: 'MPHASIS',    name: 'Mphasis Ltd'                },
  { sym: 'PERSISTENT', name: 'Persistent Systems'         },
  { sym: 'COFORGE',    name: 'Coforge Ltd'                },
  { sym: 'LTIM',       name: 'LTIMindtree'                },
  { sym: 'TATAELXSI',  name: 'Tata Elxsi'                 },
  { sym: 'BAJAJ-AUTO', name: 'Bajaj Auto'                 },
  { sym: 'TVSMOTORS',  name: 'TVS Motors'                 },
  { sym: 'ASHOKLEY',   name: 'Ashok Leyland'              },
  { sym: 'AUROPHARMA', name: 'Aurobindo Pharma'           },
  { sym: 'LUPIN',      name: 'Lupin Ltd'                  },
  { sym: 'BIOCON',     name: 'Biocon Ltd'                 },
  { sym: 'DABUR',      name: 'Dabur India'                },
  { sym: 'MARICO',     name: 'Marico Ltd'                 },
  { sym: 'TATAPOWER',  name: 'Tata Power'                 },
  { sym: 'ADANIGREEN', name: 'Adani Green Energy'         },
  { sym: 'RECLTD',     name: 'REC Ltd'                    },
  { sym: 'PFC',        name: 'Power Finance Corp'         },
  { sym: 'VEDL',       name: 'Vedanta Ltd'                },
  { sym: 'SAIL',       name: 'Steel Authority of India'   },
  { sym: 'AMBUJACEM',  name: 'Ambuja Cements'             },
  { sym: 'HAL',        name: 'Hindustan Aeronautics'      },
  { sym: 'BEL',        name: 'Bharat Electronics'         },
  { sym: 'IRCTC',      name: 'Indian Railway Catering'    },
  { sym: 'RVNL',       name: 'Rail Vikas Nigam'           },
  { sym: 'DLF',        name: 'DLF Ltd'                    },
  { sym: 'GODREJPROP', name: 'Godrej Properties'          },
  { sym: 'IOC',        name: 'Indian Oil Corporation'     },
  { sym: 'GAIL',       name: 'GAIL India'                 },
  { sym: 'PIDILITIND', name: 'Pidilite Industries'        },
  { sym: 'DMART',      name: 'Avenue Supermarts (DMart)'  },
  { sym: 'TRENT',      name: 'Trent Ltd (Zudio)'          },
  { sym: 'PAYTM',      name: 'Paytm'                      },
  { sym: 'NYKAA',      name: 'Nykaa'                      },
  { sym: 'M&M',        name: 'Mahindra and Mahindra'      },
  { sym: 'HINDALCO',   name: 'Hindalco Industries'        },
  { sym: 'ONGC',       name: 'Oil and Natural Gas Corp'   },
  { sym: 'KOTAKBK',    name: 'Kotak Mahindra Bank'        },
  { sym: 'HINDUNILVR', name: 'Hindustan Unilever'         },
];

const CRYPTO_LIST = [
  { id: 'bitcoin',     sym: 'BTC',  name: 'Bitcoin'   },
  { id: 'ethereum',    sym: 'ETH',  name: 'Ethereum'  },
  { id: 'binancecoin', sym: 'BNB',  name: 'BNB'       },
  { id: 'solana',      sym: 'SOL',  name: 'Solana'    },
  { id: 'ripple',      sym: 'XRP',  name: 'XRP'       },
  { id: 'cardano',     sym: 'ADA',  name: 'Cardano'   },
  { id: 'dogecoin',    sym: 'DOGE', name: 'Dogecoin'  },
  { id: 'polkadot',    sym: 'DOT',  name: 'Polkadot'  },
  { id: 'avalanche-2', sym: 'AVAX', name: 'Avalanche' },
  { id: 'polygon',     sym: 'MATIC',name: 'Polygon'   },
  { id: 'chainlink',   sym: 'LINK', name: 'Chainlink' },
  { id: 'litecoin',    sym: 'LTC',  name: 'Litecoin'  },
  { id: 'shiba-inu',   sym: 'SHIB', name: 'Shiba Inu' },
  { id: 'tron',        sym: 'TRX',  name: 'TRON'      },
  { id: 'stellar',     sym: 'XLM',  name: 'Stellar'   },
];

const COMMODITY_LIST = [
  { id: 'gold',      name: 'Gold',      unit: 'per 10g', icon: 'GOLD' },
  { id: 'silver',    name: 'Silver',    unit: 'per kg',  icon: 'SLVR' },
  { id: 'crude',     name: 'Crude Oil', unit: 'per bbl', icon: 'CRUD' },
  { id: 'copper',    name: 'Copper',    unit: 'per kg',  icon: 'COPR' },
  { id: 'aluminium', name: 'Aluminium', unit: 'per kg',  icon: 'ALUM' },
  { id: 'zinc',      name: 'Zinc',      unit: 'per kg',  icon: 'ZINC' },
];

export default function Portfolio() {
  const [tab,          setTab]          = useState('stocks');
  const [holdings,     setHoldings]     = useState([]);
  const [prices,       setPrices]       = useState({});
  const [cryptoPrices, setCryptoPrices] = useState({});
  const [commPrices,   setCommPrices]   = useState({});
  const [loading,      setLoading]      = useState(false);
  const [showForm,     setShowForm]     = useState(false);
  const [stockSearch,  setStockSearch]  = useState('');
  const [stockSugg,    setStockSugg]    = useState([]);
  const [showSugg,     setShowSugg]     = useState(false);
  const [form, setForm] = useState({ symbol: '', name: '', quantity: '', buyPrice: '', type: 'stock' });
  const navigate = useNavigate();
  const token    = localStorage.getItem('token');

  // ── FETCH FUNCTIONS DEFINED BEFORE useEffect ─────────────────
  const fetchStockPricesP = useCallback(async (symbols) => {
    try {
      const { data } = await axios.post(
        BASE + '/market/quotes',
        { symbols },
        { timeout: 20000 }
      );
      const map = {};
      (data || []).forEach(d => { if (!d.error) map[d.symbol] = d; });
      setPrices(prev => ({ ...prev, ...map })); // merge keeps old prices visible while refreshing
    } catch (err) { console.log('Price error:', err.message); }
  }, []);

  const fetchCryptoPricesP = useCallback(async (holdings) => {
    if (!holdings || holdings.length === 0) return;
    // Get the stored symbol/id from each crypto holding
    const ids = holdings.map(h => h.symbol);
    const map = await fetchCryptoByIds(ids);
    setCryptoPrices(map);
  }, []);

  const fetchCommPricesP = useCallback(async () => {
    try {
      const { data } = await axios.get(BASE + '/market/commodities');
      setCommPrices(data);
    } catch (err) { console.log('Commodity price error:', err); }
  }, []);

  const fetchHoldingsP = useCallback(async () => {
    try {
      const { data } = await axios.get(BASE + '/portfolio', { headers: { Authorization: 'Bearer ' + token } });
      setHoldings(data);
      const stocks    = data.filter(h => h.type === 'stock' || !h.type).map(h => h.symbol);
      const hasCrypto = data.some(h => h.type === 'crypto');
      const hasComm   = data.some(h => h.type === 'commodity');
      if (stocks.length > 0) fetchStockPricesP([...new Set(stocks)]);
      const cryptoH = data.filter(h => h.type === "crypto");
      if (hasCrypto)         fetchCryptoPricesP(cryptoH);
      if (hasComm)           fetchCommPricesP();
    } catch (err) { console.log('Holdings error:', err); }
  }, [token, fetchStockPricesP, fetchCryptoPricesP, fetchCommPricesP]);

  // ── ALL HOOKS BEFORE EARLY RETURN ─────────────────────────────
  useEffect(() => {
    if (!token) return;
    fetchHoldingsP();
    const interval = setInterval(fetchHoldingsP, 30000);
    return () => clearInterval(interval);
  }, [fetchHoldingsP, token]);

  useEffect(() => {
    const q = stockSearch.trim().toUpperCase();
    if (q.length < 1) { setStockSugg([]); setShowSugg(false); return; }
    const matched = NSE_STOCKS.filter(s =>
      s.sym.toUpperCase().startsWith(q) || s.name.toUpperCase().includes(q)
    ).slice(0, 8);
    setStockSugg(matched);
    setShowSugg(matched.length > 0);
  }, [stockSearch]);

  // ── GUEST GATE (after all hooks) ──────────────────────────────
  if (!token) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-10 w-full max-w-md text-center">
          <div className="w-14 h-14 bg-green-400/10 border border-green-400/20 rounded-full flex items-center justify-center mx-auto mb-5">
            <span className="text-green-400 text-2xl">◈</span>
          </div>
          <h2 className="text-white text-xl font-bold mb-2">Login to track Portfolio</h2>
          <p className="text-gray-500 text-sm mb-6">Track stocks, crypto and commodities in one portfolio.</p>
          <button onClick={() => navigate('/login')}
            className="w-full bg-green-400 text-gray-950 font-bold py-3 rounded-lg text-sm hover:bg-green-300 transition-colors mb-3">
            Login or Sign Up
          </button>
          <button onClick={() => navigate(-1)}
            className="w-full text-gray-500 text-sm py-2 rounded-lg border border-gray-800 hover:border-gray-600 hover:text-gray-300 transition-colors font-mono">
            ← Go back
          </button>
        </div>
      </div>
    );
  }

  // ── DATA FETCHING ─────────────────────────────────────────────


  const addHolding = async () => {
    if (!form.symbol || !form.quantity || !form.buyPrice) return;
    setLoading(true);
    try {
      const { data } = await axios.post(BASE + '/portfolio/add', {
        symbol:   form.type === 'stock' ? form.symbol.toUpperCase() : form.symbol,
        name:     form.name,
        quantity: Number(form.quantity),
        buyPrice: Number(form.buyPrice),
        type:     form.type
      }, { headers: { Authorization: 'Bearer ' + token } });
      setHoldings(data);
      setShowForm(false);
      setForm({ symbol: '', name: '', quantity: '', buyPrice: '', type: 'stock' });
      setStockSearch('');
      fetchHoldingsP();
    } catch (err) { console.log('Add error:', err); }
    setLoading(false);
  };

  const removeHolding = async (id) => {
    try {
      const { data } = await axios.post(BASE + '/portfolio/remove', { id }, {
        headers: { Authorization: 'Bearer ' + token }
      });
      setHoldings(data);
    } catch (err) { console.log('Remove error:', err); }
  };

  // ── HELPERS ───────────────────────────────────────────────────
  const calcPL = (h) => {
    var curPrice = null;
    if (h.type === 'crypto') {
      var cp = cryptoPrices[h.symbol];
      curPrice = cp ? cp.price : null;
    } else if (h.type === 'commodity') {
      var cm = commPrices[h.symbol];
      curPrice = cm ? cm.price : null;
    } else {
      var sp = prices[h.symbol];
      curPrice = sp && !sp.error ? parseFloat(sp.price) : null;
    }
    var invested = h.buyPrice * h.quantity;
    var current  = curPrice ? curPrice * h.quantity : null;
    var pl       = current ? current - invested : null;
    var plPct    = pl ? ((pl / invested) * 100).toFixed(2) : null;
    return { invested, current, pl, plPct, curPrice };
  };

  const calcTotal = (list) => {
    var inv = 0; var cur = 0;
    list.forEach(function(h) {
      var c = calcPL(h);
      inv += c.invested;
      cur += c.current || c.invested;
    });
    return {
      inv, cur,
      pl:    cur - inv,
      plPct: inv > 0 ? (((cur - inv) / inv) * 100).toFixed(2) : 0
    };
  };

  const renderTable = (list) => {
    var tot = calcTotal(list);
    return (
      <div>
        <div className="grid grid-cols-3 gap-4 mb-5">
          {[
            { label: 'Invested',      value: 'Rs.' + tot.inv.toLocaleString('en-IN', { maximumFractionDigits: 0 }), color: 'text-white' },
            { label: 'Current Value', value: 'Rs.' + tot.cur.toLocaleString('en-IN', { maximumFractionDigits: 0 }), color: 'text-white' },
            { label: 'Total P&L',
              value: (tot.pl >= 0 ? '+' : '-') + 'Rs.' + Math.abs(tot.pl).toLocaleString('en-IN', { maximumFractionDigits: 0 }) + ' (' + tot.plPct + '%)',
              color: tot.pl >= 0 ? 'text-green-400' : 'text-red-400'
            }
          ].map(function(c) {
            return (
              <div key={c.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <div className="text-gray-400 text-xs font-mono mb-1">{c.label}</div>
                <div className={'text-xl font-bold font-mono ' + c.color}>{c.value}</div>
              </div>
            );
          })}
        </div>
        {list.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-10 text-center">
            <div className="text-gray-600 text-sm font-mono">No holdings yet — click Add Holding to get started</div>
          </div>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="text-gray-500 text-xs font-mono border-b border-gray-800 bg-gray-800/20">
                  <th className="text-left px-5 py-3">ASSET</th>
                  <th className="text-right px-5 py-3">QTY</th>
                  <th className="text-right px-5 py-3">BUY PRICE</th>
                  <th className="text-right px-5 py-3">CUR PRICE</th>
                  <th className="text-right px-5 py-3">INVESTED</th>
                  <th className="text-right px-5 py-3">P&L</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {list.map(function(h) {
                  var r = calcPL(h);
                  return (
                    <tr key={h._id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-mono font-bold text-white text-sm">{h.symbol}</div>
                        <div className="text-gray-500 text-xs">{h.name}</div>
                      </td>
                      <td className="px-5 py-4 text-right font-mono text-white text-sm">{h.quantity}</td>
                      <td className="px-5 py-4 text-right font-mono text-white text-sm">Rs.{Number(h.buyPrice).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                      <td className="px-5 py-4 text-right font-mono text-white text-sm">
                        {r.curPrice ? 'Rs.' + Number(r.curPrice).toLocaleString('en-IN', { maximumFractionDigits: 2 }) : <span className="text-gray-600 text-xs">Loading...</span>}
                      </td>
                      <td className="px-5 py-4 text-right font-mono text-white text-sm">Rs.{r.invested.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                      <td className={'px-5 py-4 text-right font-mono font-bold text-sm ' + (r.pl === null ? 'text-gray-500' : r.pl >= 0 ? 'text-green-400' : 'text-red-400')}>
                        {r.pl === null ? '—' : (r.pl >= 0 ? '+' : '-') + 'Rs.' + Math.abs(r.pl).toLocaleString('en-IN', { maximumFractionDigits: 0 }) + ' (' + r.plPct + '%)'}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button onClick={function() { removeHolding(h._id); }} className="text-red-400 text-xs hover:text-red-300 font-mono">Remove</button>
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
  };

  var stockHoldings = holdings.filter(function(h) { return h.type === 'stock' || !h.type; });
  var cryptoHoldings = holdings.filter(function(h) { return h.type === 'crypto'; });
  var commHoldings   = holdings.filter(function(h) { return h.type === 'commodity'; });
  var tabs = ['stocks', 'crypto', 'commodities'];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-white text-2xl font-bold">Portfolio</h1>
        <button
          onClick={function() {
            setShowForm(!showForm);
            setForm({ symbol: '', name: '', quantity: '', buyPrice: '', type: tab === 'crypto' ? 'crypto' : tab === 'commodities' ? 'commodity' : 'stock' });
            setStockSearch('');
          }}
          className="bg-green-400 text-gray-950 font-bold px-4 py-2 rounded-lg text-sm hover:bg-green-300 transition-colors"
        >
          + Add Holding
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-800">
        {tabs.map(function(t) {
          return (
            <button key={t} onClick={function() { setTab(t); setShowForm(false); }}
              className={'px-5 py-2 text-xs font-mono capitalize transition-all border-b-2 ' +
                (tab === t ? 'text-green-400 border-green-400' : 'text-gray-500 border-transparent hover:text-white')}>
              {t}
              {t === 'stocks'      && stockHoldings.length  > 0 && <span className="ml-1 bg-green-400/20 text-green-400 px-1.5 py-0.5 rounded text-xs">{stockHoldings.length}</span>}
              {t === 'crypto'      && cryptoHoldings.length > 0 && <span className="ml-1 bg-green-400/20 text-green-400 px-1.5 py-0.5 rounded text-xs">{cryptoHoldings.length}</span>}
              {t === 'commodities' && commHoldings.length   > 0 && <span className="ml-1 bg-green-400/20 text-green-400 px-1.5 py-0.5 rounded text-xs">{commHoldings.length}</span>}
            </button>
          );
        })}
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="bg-gray-900 border border-green-400/30 rounded-xl p-5 mb-6">
          <h3 className="text-white font-semibold mb-4 text-sm">
            Add {tab === 'stocks' ? 'Stock' : tab === 'crypto' ? 'Crypto' : 'Commodity'} Holding
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

            {tab === 'stocks' && (
              <div className="col-span-2 relative">
                <label className="text-gray-400 text-xs font-mono mb-1 block">SEARCH STOCK</label>
                <input type="text" placeholder="Type symbol or company name..."
                  value={stockSearch}
                  onChange={function(e) { setStockSearch(e.target.value); setForm(function(f) { return { ...f, symbol: e.target.value.toUpperCase(), name: '' }; }); }}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm w-full outline-none focus:border-green-400"
                />
                {showSugg && stockSugg.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg overflow-hidden z-50 shadow-xl">
                    {stockSugg.map(function(s, i) {
                      return (
                        <div key={i}
                          onClick={function() { setForm(function(f) { return { ...f, symbol: s.sym, name: s.name, type: 'stock' }; }); setStockSearch(s.sym + ' — ' + s.name); setShowSugg(false); }}
                          className="flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-gray-700 border-b border-gray-700 last:border-0"
                        >
                          <span className="font-mono font-bold text-white text-sm w-24 flex-shrink-0">{s.sym}</span>
                          <span className="text-gray-400 text-xs">{s.name}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {tab === 'crypto' && (
              <div className="col-span-2">
                <label className="text-gray-400 text-xs font-mono mb-1 block">SELECT CRYPTO</label>
                <select value={form.symbol}
                  onChange={function(e) {
                    var c = CRYPTO_LIST.find(function(x) { return x.id === e.target.value; });
                    if (c) setForm(function(f) { return { ...f, symbol: c.id, name: c.name + ' (' + c.sym + ')', type: 'crypto' }; });
                  }}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm w-full outline-none focus:border-green-400"
                >
                  <option value="">-- Select Crypto --</option>
                  {CRYPTO_LIST.map(function(c) { return <option key={c.id} value={c.id}>{c.sym} — {c.name}</option>; })}
                </select>
              </div>
            )}

            {tab === 'commodities' && (
              <div className="col-span-2">
                <label className="text-gray-400 text-xs font-mono mb-1 block">SELECT COMMODITY</label>
                <select value={form.symbol}
                  onChange={function(e) {
                    var c = COMMODITY_LIST.find(function(x) { return x.id === e.target.value; });
                    if (c) setForm(function(f) { return { ...f, symbol: c.id, name: c.name, type: 'commodity' }; });
                  }}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm w-full outline-none focus:border-green-400"
                >
                  <option value="">-- Select Commodity --</option>
                  {COMMODITY_LIST.map(function(c) { return <option key={c.id} value={c.id}>{c.name} ({c.unit})</option>; })}
                </select>
              </div>
            )}

            <div>
              <label className="text-gray-400 text-xs font-mono mb-1 block">QUANTITY</label>
              <input type="number" placeholder="e.g. 10" value={form.quantity}
                onChange={function(e) { setForm(function(f) { return { ...f, quantity: e.target.value }; }); }}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm w-full outline-none focus:border-green-400"
              />
            </div>
            <div>
              <label className="text-gray-400 text-xs font-mono mb-1 block">BUY PRICE (Rs.)</label>
              <input type="number" placeholder="e.g. 2800" value={form.buyPrice}
                onChange={function(e) { setForm(function(f) { return { ...f, buyPrice: e.target.value }; }); }}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm w-full outline-none focus:border-green-400"
              />
            </div>
            <div className="col-span-2 md:col-span-4 flex gap-3">
              <button onClick={addHolding} disabled={loading || !form.symbol || !form.quantity || !form.buyPrice}
                className="bg-green-400 text-gray-950 font-bold px-6 py-2 rounded-lg text-sm hover:bg-green-300 transition-colors disabled:opacity-50">
                {loading ? 'Adding...' : 'Add to Portfolio'}
              </button>
              <button onClick={function() { setShowForm(false); }}
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