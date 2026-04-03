import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const BASE = (process.env.REACT_APP_API_URL || 'http://localhost:5000') + '/api';

const NSE_STOCKS = [
  { sym: 'RELIANCE',   name: 'Reliance Industries'           },
  { sym: 'TCS',        name: 'Tata Consultancy Services'     },
  { sym: 'HDFCBANK',   name: 'HDFC Bank'                     },
  { sym: 'INFY',       name: 'Infosys'                       },
  { sym: 'ICICIBANK',  name: 'ICICI Bank'                    },
  { sym: 'HINDUNILVR', name: 'Hindustan Unilever'            },
  { sym: 'SBIN',       name: 'State Bank of India'           },
  { sym: 'BAJFINANCE', name: 'Bajaj Finance'                 },
  { sym: 'BHARTIARTL', name: 'Bharti Airtel'                 },
  { sym: 'KOTAKBK',    name: 'Kotak Mahindra Bank'           },
  { sym: 'WIPRO',      name: 'Wipro'                         },
  { sym: 'AXISBANK',   name: 'Axis Bank'                     },
  { sym: 'LT',         name: 'Larsen and Toubro'             },
  { sym: 'ITC',        name: 'ITC Ltd'                       },
  { sym: 'ASIANPAINT', name: 'Asian Paints'                  },
  { sym: 'MARUTI',     name: 'Maruti Suzuki'                 },
  { sym: 'SUNPHARMA',  name: 'Sun Pharmaceutical'            },
  { sym: 'TITAN',      name: 'Titan Company'                 },
  { sym: 'ULTRACEMCO', name: 'UltraTech Cement'              },
  { sym: 'NESTLEIND',  name: 'Nestle India'                  },
  { sym: 'TATAMOTORS', name: 'Tata Motors'                   },
  { sym: 'TATASTEEL',  name: 'Tata Steel'                    },
  { sym: 'JSWSTEEL',   name: 'JSW Steel'                     },
  { sym: 'HDFCLIFE',   name: 'HDFC Life Insurance'           },
  { sym: 'BAJAJFINSV', name: 'Bajaj Finserv'                 },
  { sym: 'POWERGRID',  name: 'Power Grid Corp'               },
  { sym: 'NTPC',       name: 'NTPC Ltd'                      },
  { sym: 'ADANIPORTS', name: 'Adani Ports'                   },
  { sym: 'ADANIENT',   name: 'Adani Enterprises'             },
  { sym: 'CIPLA',      name: 'Cipla Ltd'                     },
  { sym: 'DRREDDY',    name: 'Dr Reddys Laboratories'        },
  { sym: 'DIVISLAB',   name: 'Divis Laboratories'            },
  { sym: 'EICHERMOT',  name: 'Eicher Motors'                 },
  { sym: 'GRASIM',     name: 'Grasim Industries'             },
  { sym: 'HEROMOTOCO', name: 'Hero MotoCorp'                 },
  { sym: 'HINDALCO',   name: 'Hindalco Industries'           },
  { sym: 'INDUSINDBK', name: 'IndusInd Bank'                 },
  { sym: 'ONGC',       name: 'Oil and Natural Gas Corp'      },
  { sym: 'SBILIFE',    name: 'SBI Life Insurance'            },
  { sym: 'TECHM',      name: 'Tech Mahindra'                 },
  { sym: 'TATACONSUM', name: 'Tata Consumer Products'        },
  { sym: 'COALINDIA',  name: 'Coal India'                    },
  { sym: 'BPCL',       name: 'Bharat Petroleum'              },
  { sym: 'BRITANNIA',  name: 'Britannia Industries'          },
  { sym: 'APOLLOHOSP', name: 'Apollo Hospitals'              },
  { sym: 'HCLTECH',    name: 'HCL Technologies'              },
  { sym: 'ETERNAL',    name: 'Eternal Ltd (Zomato)'          },
  { sym: 'SHRIRAMFIN', name: 'Shriram Finance'               },
  { sym: 'BANKBARODA', name: 'Bank of Baroda'                },
  { sym: 'PNB',        name: 'Punjab National Bank'          },
  { sym: 'YESBANK',    name: 'Yes Bank'                      },
  { sym: 'AUBANK',     name: 'AU Small Finance Bank'         },
  { sym: 'MPHASIS',    name: 'Mphasis Ltd'                   },
  { sym: 'PERSISTENT', name: 'Persistent Systems'            },
  { sym: 'COFORGE',    name: 'Coforge Ltd'                   },
  { sym: 'LTIM',       name: 'LTIMindtree'                   },
  { sym: 'TATAELXSI',  name: 'Tata Elxsi'                    },
  { sym: 'BAJAJ-AUTO', name: 'Bajaj Auto'                    },
  { sym: 'TVSMOTORS',  name: 'TVS Motors'                    },
  { sym: 'ASHOKLEY',   name: 'Ashok Leyland'                 },
  { sym: 'AUROPHARMA', name: 'Aurobindo Pharma'              },
  { sym: 'LUPIN',      name: 'Lupin Ltd'                     },
  { sym: 'BIOCON',     name: 'Biocon Ltd'                    },
  { sym: 'DABUR',      name: 'Dabur India'                   },
  { sym: 'MARICO',     name: 'Marico Ltd'                    },
  { sym: 'TATAPOWER',  name: 'Tata Power'                    },
  { sym: 'ADANIGREEN', name: 'Adani Green Energy'            },
  { sym: 'RECLTD',     name: 'REC Ltd'                       },
  { sym: 'PFC',        name: 'Power Finance Corp'            },
  { sym: 'VEDL',       name: 'Vedanta Ltd'                   },
  { sym: 'SAIL',       name: 'Steel Authority of India'      },
  { sym: 'AMBUJACEM',  name: 'Ambuja Cements'                },
  { sym: 'HAL',        name: 'Hindustan Aeronautics'         },
  { sym: 'BEL',        name: 'Bharat Electronics'            },
  { sym: 'IRCTC',      name: 'Indian Railway Catering Corp'  },
  { sym: 'RVNL',       name: 'Rail Vikas Nigam'              },
  { sym: 'DLF',        name: 'DLF Ltd'                       },
  { sym: 'GODREJPROP', name: 'Godrej Properties'             },
  { sym: 'IOC',        name: 'Indian Oil Corporation'        },
  { sym: 'GAIL',       name: 'GAIL India'                    },
  { sym: 'PIDILITIND', name: 'Pidilite Industries'           },
  { sym: 'DMART',      name: 'Avenue Supermarts (DMart)'     },
  { sym: 'TRENT',      name: 'Trent Ltd (Zudio)'             },
  { sym: 'PAYTM',      name: 'Paytm'                         },
  { sym: 'NYKAA',      name: 'Nykaa'                         },
  { sym: 'M&M',        name: 'Mahindra and Mahindra'         },
  { sym: 'KOTAKBK',    name: 'Kotak Mahindra Bank'           },
];

const CRYPTO_LIST = [
  { id: 'bitcoin',       sym: 'BTC',  name: 'Bitcoin'       },
  { id: 'ethereum',      sym: 'ETH',  name: 'Ethereum'      },
  { id: 'binancecoin',   sym: 'BNB',  name: 'BNB'           },
  { id: 'solana',        sym: 'SOL',  name: 'Solana'        },
  { id: 'ripple',        sym: 'XRP',  name: 'XRP'           },
  { id: 'cardano',       sym: 'ADA',  name: 'Cardano'       },
  { id: 'dogecoin',      sym: 'DOGE', name: 'Dogecoin'      },
  { id: 'polkadot',      sym: 'DOT',  name: 'Polkadot'      },
  { id: 'shiba-inu',     sym: 'SHIB', name: 'Shiba Inu'     },
  { id: 'avalanche-2',   sym: 'AVAX', name: 'Avalanche'     },
  { id: 'matic-network', sym: 'MATIC',name: 'Polygon'       },
  { id: 'chainlink',     sym: 'LINK', name: 'Chainlink'     },
  { id: 'litecoin',      sym: 'LTC',  name: 'Litecoin'      },
  { id: 'uniswap',       sym: 'UNI',  name: 'Uniswap'       },
  { id: 'stellar',       sym: 'XLM',  name: 'Stellar'       },
  { id: 'tron',          sym: 'TRX',  name: 'TRON'          },
  { id: 'cosmos',        sym: 'ATOM', name: 'Cosmos'        },
  { id: 'near',          sym: 'NEAR', name: 'NEAR Protocol' },
  { id: 'pepe',          sym: 'PEPE', name: 'Pepe'          },
  { id: 'filecoin',      sym: 'FIL',  name: 'Filecoin'      },
];

const COMMODITY_LIST = [
  { id: 'gold',       name: 'Gold',        unit: 'per 10g',   icon: 'GOLD' },
  { id: 'silver',     name: 'Silver',      unit: 'per kg',    icon: 'SLVR' },
  { id: 'crude',      name: 'Crude Oil',   unit: 'per bbl',   icon: 'CRUD' },
  { id: 'naturalgas', name: 'Natural Gas', unit: 'per mmBtu', icon: 'NGAS' },
  { id: 'copper',     name: 'Copper',      unit: 'per kg',    icon: 'COPR' },
  { id: 'aluminium',  name: 'Aluminium',   unit: 'per kg',    icon: 'ALUM' },
  { id: 'zinc',       name: 'Zinc',        unit: 'per kg',    icon: 'ZINC' },
  { id: 'nickel',     name: 'Nickel',      unit: 'per kg',    icon: 'NCKL' },
];

// Fetch specific crypto IDs directly from CoinGecko
const fetchCryptoByIds = async (ids) => {
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
        id:       c.id,
        symbol:   c.symbol.toUpperCase(),
        name:     c.name,
        price:    c.current_price,
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

export default function Watchlist() {
  const [tab,          setTab]          = useState('stocks');
  const [watchlist,    setWatchlist]    = useState({ symbols: [], cryptos: [], commodities: [] });
  const [prices,       setPrices]       = useState({});
  const [cryptoPrices, setCryptoPrices] = useState({});
  const [commPrices,   setCommPrices]   = useState({});
  const [priceLoading, setPriceLoading] = useState(false);
  const [cryptoLoading,setCryptoLoading]= useState(false);
  const [search,       setSearch]       = useState('');
  const [cryptoSearch, setCryptoSearch] = useState('');
  const [suggestions,  setSuggestions]  = useState([]);
  const [adding,       setAdding]       = useState('');
  const [addError,     setAddError]     = useState('');
  const [showDrop,     setShowDrop]     = useState(false);
  const searchRef = useRef(null);
  const navigate  = useNavigate();
  const token     = localStorage.getItem('token');

  const fetchStockPrices = useCallback(async (symbols) => {
    if (!symbols || symbols.length === 0) return;
    setPriceLoading(true);
    try {
      const res = await axios.post(
        BASE + '/market/quotes',
        { symbols },
        { timeout: 20000 }
      );
      const map = {};
      (res.data || []).forEach(d => { if (!d.error) map[d.symbol] = d; });
      setPrices(prev => ({ ...prev, ...map })); // merge — keep old prices while new ones load
    } catch (err) {
      console.log('Stock price error:', err.message);
    }
    setPriceLoading(false);
  }, []);

  const fetchCryptoPrices = useCallback(async (ids) => {
    if (!ids || ids.length === 0) return;
    setCryptoLoading(true);
    const map = await fetchCryptoByIds(ids);
    setCryptoPrices(map);
    setCryptoLoading(false);
  }, []);

  const fetchCommPrices = useCallback(async () => {
    try {
      const res = await axios.get(BASE + '/market/commodities');
      setCommPrices(res.data);
    } catch (err) { console.log('Commodity price error:', err); }
  }, []);

  useEffect(() => {
    if (!token) return;
    const load = async () => {
      try {
        const res  = await axios.get(BASE + '/watchlist', { headers: { Authorization: 'Bearer ' + token } });
        const data = res.data;
        setWatchlist(data);
        if (data.symbols     && data.symbols.length     > 0) fetchStockPrices(data.symbols);
        if (data.cryptos     && data.cryptos.length     > 0) fetchCryptoPrices(data.cryptos);
        if (data.commodities && data.commodities.length > 0) fetchCommPrices();
      } catch (err) { console.log('Watchlist load error:', err); }
    };
    load();
    const interval = setInterval(async () => {
      try {
        const res  = await axios.get(BASE + '/watchlist', { headers: { Authorization: 'Bearer ' + token } });
        const data = res.data;
        if (data.symbols     && data.symbols.length     > 0) fetchStockPrices(data.symbols);
        if (data.cryptos     && data.cryptos.length     > 0) fetchCryptoPrices(data.cryptos);
        if (data.commodities && data.commodities.length > 0) fetchCommPrices();
      } catch (err) { console.log('Auto-refresh error:', err); }
    }, 30000);
    return () => clearInterval(interval);
  }, [token, fetchStockPrices, fetchCryptoPrices, fetchCommPrices]);

  useEffect(() => {
    const handler = e => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowDrop(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const q = search.trim().toUpperCase();
    if (q.length < 1) { setSuggestions([]); setShowDrop(false); return; }
    const matched = NSE_STOCKS.filter(s =>
      s.sym.toUpperCase().startsWith(q) || s.name.toUpperCase().includes(q)
    ).slice(0, 10);
    if (q.length >= 2 && !matched.find(s => s.sym === q))
      matched.push({ sym: q, name: 'Search "' + q + '" on NSE' });
    setSuggestions(matched);
    setShowDrop(matched.length > 0);
  }, [search]);

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-10 w-full max-w-md text-center">
          <div className="w-14 h-14 bg-green-400/10 border border-green-400/20 rounded-full flex items-center justify-center mx-auto mb-5">
            <span className="text-green-400 text-2xl">★</span>
          </div>
          <h2 className="text-white text-xl font-bold mb-2">Login to use Watchlist</h2>
          <p className="text-gray-500 text-sm mb-6">Save stocks, crypto and commodities in one place.</p>
          <button onClick={() => navigate('/login')} className="w-full bg-green-400 text-gray-950 font-bold py-3 rounded-lg text-sm hover:bg-green-300 transition-colors mb-3">Login or Sign Up</button>
          <button onClick={() => navigate(-1)} className="w-full text-gray-500 text-sm py-2 rounded-lg border border-gray-800 hover:border-gray-600 hover:text-gray-300 transition-colors font-mono">← Go back</button>
        </div>
      </div>
    );
  }

  const addStock = async (sym) => {
    const symbol = sym.toUpperCase().trim();
    if (!symbol) return;
    if ((watchlist.symbols || []).includes(symbol)) {
      setAddError(symbol + ' already in watchlist');
      setTimeout(() => setAddError(''), 3000);
      setSearch(''); setShowDrop(false); return;
    }
    setAdding(symbol); setAddError(''); setSearch(''); setShowDrop(false);
    try {
      const res = await axios.post(BASE + '/watchlist/add', { symbol }, { headers: { Authorization: 'Bearer ' + token } });
      setWatchlist(res.data);
      fetchStockPrices(res.data.symbols);
    } catch (err) {
      setAddError('Could not add ' + symbol + '. Check if it is a valid NSE symbol.');
      setTimeout(() => setAddError(''), 4000);
    }
    setAdding('');
  };

  const removeStock = async (symbol) => {
    try {
      const res = await axios.post(BASE + '/watchlist/remove', { symbol }, { headers: { Authorization: 'Bearer ' + token } });
      setWatchlist(res.data);
    } catch (err) { console.log('Remove error:', err); }
  };

  const addCrypto = async (id) => {
    if ((watchlist.cryptos || []).includes(id)) return;
    try {
      const res = await axios.post(BASE + '/watchlist/crypto/add', { id }, { headers: { Authorization: 'Bearer ' + token } });
      setWatchlist(res.data);
      fetchCryptoPrices(res.data.cryptos);
    } catch (err) { console.log('Crypto add error:', err); }
  };

  const removeCrypto = async (id) => {
    try {
      const res = await axios.post(BASE + '/watchlist/crypto/remove', { id }, { headers: { Authorization: 'Bearer ' + token } });
      setWatchlist(res.data);
    } catch (err) { console.log('Crypto remove error:', err); }
  };

  const addCommodity = async (id) => {
    if ((watchlist.commodities || []).includes(id)) return;
    try {
      const res = await axios.post(BASE + '/watchlist/commodity/add', { id }, { headers: { Authorization: 'Bearer ' + token } });
      setWatchlist(res.data);
      fetchCommPrices();
    } catch (err) { console.log('Commodity add error:', err); }
  };

  const removeCommodity = async (id) => {
    try {
      const res = await axios.post(BASE + '/watchlist/commodity/remove', { id }, { headers: { Authorization: 'Bearer ' + token } });
      setWatchlist(res.data);
    } catch (err) { console.log('Commodity remove error:', err); }
  };

  const filteredCrypto = CRYPTO_LIST.filter(c =>
    c.sym.toLowerCase().includes(cryptoSearch.toLowerCase()) ||
    c.name.toLowerCase().includes(cryptoSearch.toLowerCase())
  );

  const tabs = ['stocks', 'crypto', 'commodities'];
  const total = (watchlist.symbols||[]).length + (watchlist.cryptos||[]).length + (watchlist.commodities||[]).length;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-white text-2xl font-bold">My Watchlist</h1>
        <span className="text-gray-500 text-xs font-mono">{total} item{total !== 1 ? 's' : ''} watching</span>
      </div>

      <div className="flex gap-1 mb-6 border-b border-gray-800">
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={'px-5 py-2 text-xs font-mono capitalize transition-all border-b-2 ' +
              (tab === t ? 'text-green-400 border-green-400' : 'text-gray-500 border-transparent hover:text-white')}>
            {t}
            {t === 'stocks'      && (watchlist.symbols||[]).length      > 0 && <span className="ml-1 bg-green-400/20 text-green-400 px-1.5 py-0.5 rounded text-xs">{watchlist.symbols.length}</span>}
            {t === 'crypto'      && (watchlist.cryptos||[]).length      > 0 && <span className="ml-1 bg-green-400/20 text-green-400 px-1.5 py-0.5 rounded text-xs">{watchlist.cryptos.length}</span>}
            {t === 'commodities' && (watchlist.commodities||[]).length  > 0 && <span className="ml-1 bg-green-400/20 text-green-400 px-1.5 py-0.5 rounded text-xs">{watchlist.commodities.length}</span>}
          </button>
        ))}
      </div>

      {/* STOCKS */}
      {tab === 'stocks' && (
        <div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-5" ref={searchRef}>
            <div className="text-white font-semibold text-sm mb-3">Search and Add Stocks</div>
            <div className="relative">
              <input type="text" placeholder="Search any NSE stock — symbol or company name..."
                value={search}
                onChange={e => { setSearch(e.target.value); setAddError(''); }}
                onKeyDown={e => {
                  if (e.key === 'Enter' && search.trim()) suggestions.length > 0 ? addStock(suggestions[0].sym) : addStock(search.trim());
                  if (e.key === 'Escape') { setShowDrop(false); setSearch(''); }
                }}
                onFocus={() => { if (suggestions.length > 0) setShowDrop(true); }}
                className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white text-sm w-full outline-none focus:border-green-400 transition-colors pr-24"
              />
              <button onClick={() => search.trim() && addStock(search.trim())} disabled={!search.trim() || adding !== ''}
                className="absolute right-2 top-2 bg-green-400 text-gray-950 font-bold text-xs px-3 py-1.5 rounded hover:bg-green-300 disabled:opacity-40">
                {adding ? 'Adding...' : '+ Add'}
              </button>
              {showDrop && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg overflow-hidden z-50 shadow-xl">
                  {suggestions.map((s, i) => {
                    const inList = (watchlist.symbols||[]).includes(s.sym);
                    return (
                      <div key={i} onClick={() => !inList && addStock(s.sym)}
                        className={'flex items-center justify-between px-4 py-3 border-b border-gray-700 last:border-0 ' +
                          (inList ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-700')}>
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-white text-sm w-28 flex-shrink-0">{s.sym}</span>
                          <span className="text-gray-400 text-xs">{s.name}</span>
                        </div>
                        <span className="text-green-400 text-xs font-mono ml-2">{inList ? 'Added' : '+ Add'}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            {addError && <div className="mt-2 text-red-400 text-xs font-mono">{addError}</div>}
          </div>

          {(watchlist.symbols||[]).length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-10 text-center">
              <div className="text-gray-600 text-sm font-mono">No stocks — search above to add</div>
            </div>
          ) : (
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-800 flex justify-between items-center">
                <span className="text-white font-semibold text-sm">Watching {watchlist.symbols.length} stocks</span>
                <button onClick={() => fetchStockPrices(watchlist.symbols)} className="text-green-400 text-xs font-mono hover:underline">
                  {priceLoading ? 'Refreshing...' : '↻ Refresh'}
                </button>
              </div>
              <table className="w-full">
                <thead><tr className="text-gray-500 text-xs font-mono border-b border-gray-800 bg-gray-800/20">
                  <th className="text-left px-5 py-3">SYMBOL</th>
                  <th className="text-right px-5 py-3">PRICE</th>
                  <th className="text-right px-5 py-3">CHANGE</th>
                  <th className="text-right px-5 py-3">ACTION</th>
                </tr></thead>
                <tbody>
                  {watchlist.symbols.map(sym => {
                    const p = prices[sym];
                    const chg = p ? parseFloat(p.change) : 0;
                    return (
                      <tr key={sym} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                        <td className="px-5 py-4 font-mono font-bold text-white">{sym}</td>
                        <td className="px-5 py-4 text-right font-mono text-white text-sm">
                          {p && !p.error ? 'Rs.' + Number(p.price).toLocaleString('en-IN', { maximumFractionDigits: 2 }) : <span className="text-gray-500 text-xs">{priceLoading ? 'loading...' : '—'}</span>}
                        </td>
                        <td className={'px-5 py-4 text-right font-mono font-bold text-sm ' + (!p || p.error ? 'text-gray-500' : chg >= 0 ? 'text-green-400' : 'text-red-400')}>
                          {p && !p.error ? (chg >= 0 ? '+' : '') + p.change + ' (' + p.changePct + ')' : '—'}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button onClick={() => removeStock(sym)} className="text-red-400 text-xs hover:text-red-300 font-mono">Remove</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* CRYPTO */}
      {tab === 'crypto' && (
        <div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-5">
            <div className="text-white font-semibold text-sm mb-3">Search and Add Crypto</div>
            <input type="text" placeholder="Search by name or symbol... e.g. Bitcoin, ETH, SOL"
              value={cryptoSearch} onChange={e => setCryptoSearch(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white text-sm w-full outline-none focus:border-green-400 mb-3"
            />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-56 overflow-y-auto">
              {filteredCrypto.map(c => {
                const inList = (watchlist.cryptos||[]).includes(c.id);
                return (
                  <div key={c.id} onClick={() => !inList && addCrypto(c.id)}
                    className={'flex items-center justify-between px-3 py-2 rounded-lg border transition-colors ' +
                      (inList ? 'border-green-400/30 bg-green-400/5 cursor-not-allowed' : 'border-gray-700 hover:border-green-400/40 hover:bg-gray-800 cursor-pointer')}>
                    <div>
                      <div className="font-mono font-bold text-white text-xs">{c.sym}</div>
                      <div className="text-gray-500 text-xs">{c.name}</div>
                    </div>
                    <span className={'text-xs font-mono ' + (inList ? 'text-green-400' : 'text-gray-500')}>{inList ? '✓' : '+'}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {!(watchlist.cryptos && watchlist.cryptos.length > 0) ? (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-10 text-center">
              <div className="text-gray-600 text-sm font-mono">No crypto — add from above</div>
            </div>
          ) : (
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-800 flex justify-between items-center">
                <span className="text-white font-semibold text-sm">Watching {watchlist.cryptos.length} coins</span>
                <button onClick={() => fetchCryptoPrices(watchlist.cryptos)} className="text-green-400 text-xs font-mono hover:underline">
                  {cryptoLoading ? 'Loading...' : '↻ Refresh'}
                </button>
              </div>
              <table className="w-full">
                <thead><tr className="text-gray-500 text-xs font-mono border-b border-gray-800 bg-gray-800/20">
                  <th className="text-left px-5 py-3">COIN</th>
                  <th className="text-right px-5 py-3">PRICE (INR)</th>
                  <th className="text-right px-5 py-3">24H</th>
                  <th className="text-right px-5 py-3">ACTION</th>
                </tr></thead>
                <tbody>
                  {watchlist.cryptos.map(id => {
                    const coin = CRYPTO_LIST.find(c => c.id === id);
                    const p    = cryptoPrices[id];
                    const chg  = p ? parseFloat(p.change24h) : 0;
                    return (
                      <tr key={id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                        <td className="px-5 py-4">
                          <div className="font-mono font-bold text-white text-sm">{coin ? coin.sym : id.toUpperCase()}</div>
                          <div className="text-gray-500 text-xs">{coin ? coin.name : id}</div>
                        </td>
                        <td className="px-5 py-4 text-right font-mono text-white text-sm">
                          {p ? 'Rs.' + Number(p.price).toLocaleString('en-IN', { maximumFractionDigits: p.price < 1 ? 6 : 0 }) : <span className="text-gray-500 text-xs">{cryptoLoading ? 'loading...' : '—'}</span>}
                        </td>
                        <td className={'px-5 py-4 text-right font-mono font-bold text-sm ' + (chg >= 0 ? 'text-green-400' : 'text-red-400')}>
                          {p ? (chg >= 0 ? '+' : '') + chg + '%' : '—'}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button onClick={() => removeCrypto(id)} className="text-red-400 text-xs hover:text-red-300 font-mono">Remove</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* COMMODITIES */}
      {tab === 'commodities' && (
        <div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-5">
            <div className="text-white font-semibold text-sm mb-3">Add Commodities</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {COMMODITY_LIST.map(c => {
                const inList = (watchlist.commodities||[]).includes(c.id);
                return (
                  <div key={c.id} onClick={() => !inList && addCommodity(c.id)}
                    className={'px-3 py-3 rounded-lg border transition-colors ' +
                      (inList ? 'border-green-400/30 bg-green-400/5 cursor-not-allowed' : 'border-gray-700 hover:border-green-400/40 hover:bg-gray-800 cursor-pointer')}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-bold text-green-400 text-xs bg-green-400/10 px-2 py-0.5 rounded">{c.icon}</span>
                      <span className={'text-xs font-mono ' + (inList ? 'text-green-400' : 'text-gray-600')}>{inList ? '✓' : '+'}</span>
                    </div>
                    <div className="text-white text-sm font-semibold">{c.name}</div>
                    <div className="text-gray-500 text-xs">{c.unit}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {!(watchlist.commodities && watchlist.commodities.length > 0) ? (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-10 text-center">
              <div className="text-gray-600 text-sm font-mono">No commodities — add from above</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {watchlist.commodities.map(id => {
                const comm = COMMODITY_LIST.find(c => c.id === id);
                const p    = commPrices[id];
                return (
                  <div key={id} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <span className="font-mono font-bold text-green-400 text-xs bg-green-400/10 px-2 py-0.5 rounded">{comm ? comm.icon : id.toUpperCase()}</span>
                        <div className="text-white font-semibold mt-1">{comm ? comm.name : id}</div>
                        <div className="text-gray-500 text-xs">{comm ? comm.unit : ''}</div>
                      </div>
                      <button onClick={() => removeCommodity(id)} className="text-red-400 text-xs hover:text-red-300 font-mono">Remove</button>
                    </div>
                    {p ? (
                      <div>
                        <div className="text-white text-2xl font-bold font-mono">Rs.{Number(p.price).toLocaleString('en-IN')}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={'text-sm font-mono font-bold ' + (p.isUp ? 'text-green-400' : 'text-red-400')}>{p.changePct}</span>
                          <span className={'text-xs font-mono ' + (p.isUp ? 'text-green-400/70' : 'text-red-400/70')}>{p.changeAmt}</span>
                        </div>
                      </div>
                    ) : <div className="text-gray-600 text-sm font-mono">Loading...</div>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}