import React, { useEffect, useState, useRef } from 'react';
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
  { sym: 'CANBK',      name: 'Canara Bank'                   },
  { sym: 'IDFCFIRSTB', name: 'IDFC First Bank'               },
  { sym: 'FEDERALBNK', name: 'Federal Bank'                  },
  { sym: 'YESBANK',    name: 'Yes Bank'                      },
  { sym: 'BANDHANBNK', name: 'Bandhan Bank'                  },
  { sym: 'AUBANK',     name: 'AU Small Finance Bank'         },
  { sym: 'CHOLAFIN',   name: 'Cholamandalam Investment'      },
  { sym: 'MUTHOOTFIN', name: 'Muthoot Finance'               },
  { sym: 'LICHSGFIN',  name: 'LIC Housing Finance'           },
  { sym: 'LICI',       name: 'Life Insurance Corp of India'  },
  { sym: 'MPHASIS',    name: 'Mphasis Ltd'                   },
  { sym: 'PERSISTENT', name: 'Persistent Systems'            },
  { sym: 'COFORGE',    name: 'Coforge Ltd'                   },
  { sym: 'LTIM',       name: 'LTIMindtree'                   },
  { sym: 'OFSS',       name: 'Oracle Financial Services'     },
  { sym: 'TATAELXSI',  name: 'Tata Elxsi'                    },
  { sym: 'KPITTECH',   name: 'KPIT Technologies'             },
  { sym: 'HAPPSTMNDS', name: 'Happiest Minds Technologies'   },
  { sym: 'TANLA',      name: 'Tanla Platforms'               },
  { sym: 'TVSMOTORS',  name: 'TVS Motors'                    },
  { sym: 'ASHOKLEY',   name: 'Ashok Leyland'                 },
  { sym: 'BAJAJ-AUTO', name: 'Bajaj Auto'                    },
  { sym: 'BOSCHLTD',   name: 'Bosch Ltd'                     },
  { sym: 'MOTHERSON',  name: 'Samvardhana Motherson'         },
  { sym: 'OLECTRA',    name: 'Olectra Greentech (EV)'        },
  { sym: 'AUROPHARMA', name: 'Aurobindo Pharma'              },
  { sym: 'LUPIN',      name: 'Lupin Ltd'                     },
  { sym: 'TORNTPHARM', name: 'Torrent Pharmaceuticals'       },
  { sym: 'BIOCON',     name: 'Biocon Ltd'                    },
  { sym: 'GLENMARK',   name: 'Glenmark Pharmaceuticals'      },
  { sym: 'MAXHEALTH',  name: 'Max Healthcare'                },
  { sym: 'FORTIS',     name: 'Fortis Healthcare'             },
  { sym: 'LALPATHLAB', name: 'Dr Lal PathLabs'               },
  { sym: 'DABUR',      name: 'Dabur India'                   },
  { sym: 'MARICO',     name: 'Marico Ltd'                    },
  { sym: 'COLPAL',     name: 'Colgate Palmolive India'       },
  { sym: 'GODREJCP',   name: 'Godrej Consumer Products'      },
  { sym: 'VBL',        name: 'Varun Beverages'               },
  { sym: 'ADANIGREEN', name: 'Adani Green Energy'            },
  { sym: 'ADANIPOWER', name: 'Adani Power'                   },
  { sym: 'TATAPOWER',  name: 'Tata Power'                    },
  { sym: 'NHPC',       name: 'NHPC Ltd'                      },
  { sym: 'RECLTD',     name: 'REC Ltd'                       },
  { sym: 'PFC',        name: 'Power Finance Corp'            },
  { sym: 'VEDL',       name: 'Vedanta Ltd'                   },
  { sym: 'NMDC',       name: 'NMDC Ltd'                      },
  { sym: 'SAIL',       name: 'Steel Authority of India'      },
  { sym: 'JINDALSTEL', name: 'Jindal Steel and Power'        },
  { sym: 'AMBUJACEM',  name: 'Ambuja Cements'                },
  { sym: 'ACC',        name: 'ACC Ltd'                       },
  { sym: 'SHREECEM',   name: 'Shree Cement'                  },
  { sym: 'HAL',        name: 'Hindustan Aeronautics'         },
  { sym: 'BEL',        name: 'Bharat Electronics'            },
  { sym: 'BHEL',       name: 'Bharat Heavy Electricals'      },
  { sym: 'MAZDOCK',    name: 'Mazagon Dock Shipbuilders'     },
  { sym: 'IRCTC',      name: 'Indian Railway Catering Corp'  },
  { sym: 'IRFC',       name: 'Indian Railway Finance Corp'   },
  { sym: 'RVNL',       name: 'Rail Vikas Nigam'              },
  { sym: 'CONCOR',     name: 'Container Corp of India'       },
  { sym: 'DLF',        name: 'DLF Ltd'                       },
  { sym: 'GODREJPROP', name: 'Godrej Properties'             },
  { sym: 'OBEROIRLTY', name: 'Oberoi Realty'                 },
  { sym: 'PRESTIGE',   name: 'Prestige Estates'              },
  { sym: 'IOC',        name: 'Indian Oil Corporation'        },
  { sym: 'HINDPETRO',  name: 'Hindustan Petroleum'           },
  { sym: 'GAIL',       name: 'GAIL India'                    },
  { sym: 'IGL',        name: 'Indraprastha Gas'              },
  { sym: 'PIDILITIND', name: 'Pidilite Industries'           },
  { sym: 'ASTRAL',     name: 'Astral Ltd'                    },
  { sym: 'DEEPAKNTR',  name: 'Deepak Nitrite'                },
  { sym: 'TATACHEM',   name: 'Tata Chemicals'                },
  { sym: 'DMART',      name: 'Avenue Supermarts (DMart)'     },
  { sym: 'TRENT',      name: 'Trent Ltd (Zudio/Westside)'    },
  { sym: 'NAUKRI',     name: 'Info Edge (Naukri.com)'        },
  { sym: 'PAYTM',      name: 'Paytm (One97 Communications)'  },
  { sym: 'NYKAA',      name: 'Nykaa (FSN E-Commerce)'        },
  { sym: 'POLICYBZR',  name: 'Policybazaar (PB Fintech)'     },
  { sym: 'DELHIVERY',  name: 'Delhivery Ltd'                 },
  { sym: 'ZEEL',       name: 'Zee Entertainment'             },
  { sym: 'PVRINOX',    name: 'PVR Inox Ltd'                  },
  { sym: 'UPL',        name: 'UPL Ltd'                       },
  { sym: 'M&M',        name: 'Mahindra and Mahindra'         },
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
  { id: 'polygon',       sym: 'MATIC',name: 'Polygon'       },
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

export default function Watchlist() {
  const [tab,          setTab]          = useState('stocks');
  const [watchlist,    setWatchlist]    = useState({ symbols: [], cryptos: [], commodities: [] });
  const [prices,       setPrices]       = useState({});
  const [cryptoPrices, setCryptoPrices] = useState({});
  const [commPrices,   setCommPrices]   = useState({});
  const [priceLoading, setPriceLoading] = useState(false);
  const [search,       setSearch]       = useState('');
  const [cryptoSearch, setCryptoSearch] = useState('');
  const [suggestions,  setSuggestions]  = useState([]);
  const [adding,       setAdding]       = useState('');
  const [addError,     setAddError]     = useState('');
  const [showDrop,     setShowDrop]     = useState(false);
  const searchRef = useRef(null);
  const navigate  = useNavigate();
  const token     = localStorage.getItem('token');

  // ── ALL HOOKS BEFORE ANY EARLY RETURN ─────────────────────────
  useEffect(function() {
    if (!token) return;
    var load = async function() {
      try {
        var res = await axios.get(BASE + '/watchlist', { headers: { Authorization: 'Bearer ' + token } });
        var data = res.data;
        setWatchlist(data);
        if (data.symbols && data.symbols.length > 0)     fetchStockPrices(data.symbols);
        if (data.cryptos && data.cryptos.length > 0)     fetchCryptoPrices();
        if (data.commodities && data.commodities.length > 0) fetchCommPrices();
      } catch (err) { console.log('Watchlist load error:', err); }
    };
    load();
  }, []); // eslint-disable-line

  useEffect(function() {
    var handler = function(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowDrop(false);
    };
    document.addEventListener('mousedown', handler);
    return function() { document.removeEventListener('mousedown', handler); };
  }, []);

  useEffect(function() {
    var q = search.trim().toUpperCase();
    if (q.length < 1) { setSuggestions([]); setShowDrop(false); return; }
    var matched = NSE_STOCKS.filter(function(s) {
      return s.sym.toUpperCase().startsWith(q) || s.name.toUpperCase().includes(q);
    }).slice(0, 10);
    if (q.length >= 2 && !matched.find(function(s) { return s.sym === q; })) {
      matched.push({ sym: q, name: 'Search "' + q + '" on NSE' });
    }
    setSuggestions(matched);
    setShowDrop(matched.length > 0);
  }, [search]);

  // ── GUEST GATE (after all hooks) ──────────────────────────────
  if (!token) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-10 w-full max-w-md text-center">
          <div className="w-14 h-14 bg-green-400/10 border border-green-400/20 rounded-full flex items-center justify-center mx-auto mb-5">
            <span className="text-green-400 text-2xl">★</span>
          </div>
          <h2 className="text-white text-xl font-bold mb-2">Login to use Watchlist</h2>
          <p className="text-gray-500 text-sm mb-6">Save stocks, crypto and commodities in one place.</p>
          <button onClick={function() { navigate('/login'); }}
            className="w-full bg-green-400 text-gray-950 font-bold py-3 rounded-lg text-sm hover:bg-green-300 transition-colors mb-3">
            Login or Sign Up
          </button>
          <button onClick={function() { navigate(-1); }}
            className="w-full text-gray-500 text-sm py-2 rounded-lg border border-gray-800 hover:border-gray-600 hover:text-gray-300 transition-colors font-mono">
            ← Go back
          </button>
        </div>
      </div>
    );
  }

  // ── HELPERS ───────────────────────────────────────────────────
  var fetchStockPrices = async function(symbols) {
    setPriceLoading(true);
    try {
      var res = await axios.post(BASE + '/market/quotes', { symbols });
      var map = {};
      res.data.forEach(function(d) { map[d.symbol] = d; });
      setPrices(map);
    } catch (err) { console.log('Stock price error:', err); }
    setPriceLoading(false);
  };

  var fetchCryptoPrices = async function() {
    try {
      var res = await axios.get(BASE + '/market/crypto');
      var map = {};
      res.data.forEach(function(c) { map[c.id] = c; });
      setCryptoPrices(map);
    } catch (err) { console.log('Crypto price error:', err); }
  };

  var fetchCommPrices = async function() {
    try {
      var res = await axios.get(BASE + '/market/commodities');
      setCommPrices(res.data);
    } catch (err) { console.log('Commodity price error:', err); }
  };

  var addStock = async function(sym) {
    var symbol = sym.toUpperCase().trim();
    if (!symbol) return;
    if (watchlist.symbols.includes(symbol)) {
      setAddError(symbol + ' already in watchlist');
      setTimeout(function() { setAddError(''); }, 3000);
      setSearch(''); setShowDrop(false); return;
    }
    setAdding(symbol); setAddError(''); setSearch(''); setShowDrop(false);
    try {
      var res = await axios.post(BASE + '/watchlist/add', { symbol }, { headers: { Authorization: 'Bearer ' + token } });
      setWatchlist(res.data);
      fetchStockPrices(res.data.symbols);
    } catch (err) {
      setAddError('Could not add ' + symbol + '. Check if it is a valid NSE symbol.');
      setTimeout(function() { setAddError(''); }, 4000);
    }
    setAdding('');
  };

  var removeStock = async function(symbol) {
    try {
      var res = await axios.post(BASE + '/watchlist/remove', { symbol }, { headers: { Authorization: 'Bearer ' + token } });
      setWatchlist(res.data);
    } catch (err) { console.log('Remove error:', err); }
  };

  var addCrypto = async function(id) {
    if (watchlist.cryptos && watchlist.cryptos.includes(id)) return;
    try {
      var res = await axios.post(BASE + '/watchlist/crypto/add', { id }, { headers: { Authorization: 'Bearer ' + token } });
      setWatchlist(res.data);
      fetchCryptoPrices();
    } catch (err) { console.log('Crypto add error:', err); }
  };

  var removeCrypto = async function(id) {
    try {
      var res = await axios.post(BASE + '/watchlist/crypto/remove', { id }, { headers: { Authorization: 'Bearer ' + token } });
      setWatchlist(res.data);
    } catch (err) { console.log('Crypto remove error:', err); }
  };

  var addCommodity = async function(id) {
    if (watchlist.commodities && watchlist.commodities.includes(id)) return;
    try {
      var res = await axios.post(BASE + '/watchlist/commodity/add', { id }, { headers: { Authorization: 'Bearer ' + token } });
      setWatchlist(res.data);
      fetchCommPrices();
    } catch (err) { console.log('Commodity add error:', err); }
  };

  var removeCommodity = async function(id) {
    try {
      var res = await axios.post(BASE + '/watchlist/commodity/remove', { id }, { headers: { Authorization: 'Bearer ' + token } });
      setWatchlist(res.data);
    } catch (err) { console.log('Commodity remove error:', err); }
  };

  var filteredCrypto = CRYPTO_LIST.filter(function(c) {
    return c.sym.toLowerCase().includes(cryptoSearch.toLowerCase()) ||
           c.name.toLowerCase().includes(cryptoSearch.toLowerCase());
  });

  var tabs = ['stocks', 'crypto', 'commodities'];
  var totalWatching = (watchlist.symbols || []).length + (watchlist.cryptos || []).length + (watchlist.commodities || []).length;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-white text-2xl font-bold">My Watchlist</h1>
        <span className="text-gray-500 text-xs font-mono">{totalWatching} item{totalWatching !== 1 ? 's' : ''} watching</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-800">
        {tabs.map(function(t) {
          return (
            <button key={t} onClick={function() { setTab(t); }}
              className={'px-5 py-2 text-xs font-mono capitalize transition-all border-b-2 ' +
                (tab === t ? 'text-green-400 border-green-400' : 'text-gray-500 border-transparent hover:text-white')}>
              {t}
              {t === 'stocks'      && (watchlist.symbols || []).length      > 0 && <span className="ml-1 bg-green-400/20 text-green-400 px-1.5 py-0.5 rounded text-xs">{watchlist.symbols.length}</span>}
              {t === 'crypto'      && (watchlist.cryptos || []).length      > 0 && <span className="ml-1 bg-green-400/20 text-green-400 px-1.5 py-0.5 rounded text-xs">{watchlist.cryptos.length}</span>}
              {t === 'commodities' && (watchlist.commodities || []).length  > 0 && <span className="ml-1 bg-green-400/20 text-green-400 px-1.5 py-0.5 rounded text-xs">{watchlist.commodities.length}</span>}
            </button>
          );
        })}
      </div>

      {/* ── STOCKS TAB ── */}
      {tab === 'stocks' && (
        <div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-5" ref={searchRef}>
            <div className="text-white font-semibold text-sm mb-3">Search and Add Stocks</div>
            <div className="relative">
              <input type="text" placeholder="Search any NSE stock — symbol or company name..."
                value={search}
                onChange={function(e) { setSearch(e.target.value); setAddError(''); }}
                onKeyDown={function(e) {
                  if (e.key === 'Enter' && search.trim()) { suggestions.length > 0 ? addStock(suggestions[0].sym) : addStock(search.trim()); }
                  if (e.key === 'Escape') { setShowDrop(false); setSearch(''); }
                }}
                onFocus={function() { if (suggestions.length > 0) setShowDrop(true); }}
                className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white text-sm w-full outline-none focus:border-green-400 transition-colors pr-24"
              />
              <button onClick={function() { if (search.trim()) addStock(search.trim()); }}
                disabled={!search.trim() || adding !== ''}
                className="absolute right-2 top-2 bg-green-400 text-gray-950 font-bold text-xs px-3 py-1.5 rounded hover:bg-green-300 transition-colors disabled:opacity-40">
                {adding ? 'Adding...' : '+ Add'}
              </button>
              {showDrop && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg overflow-hidden z-50 shadow-xl">
                  {suggestions.map(function(s, i) {
                    var inList = watchlist.symbols.includes(s.sym);
                    return (
                      <div key={i}
                        onClick={function() { if (!inList) addStock(s.sym); }}
                        className={'flex items-center justify-between px-4 py-3 border-b border-gray-700 last:border-0 transition-colors ' +
                          (inList ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-700')}>
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-white text-sm w-28 flex-shrink-0">{s.sym}</span>
                          <span className="text-gray-400 text-xs">{s.name}</span>
                        </div>
                        <span className="text-green-400 text-xs font-mono flex-shrink-0 ml-2">
                          {inList ? 'Added' : adding === s.sym ? 'Adding...' : '+ Add'}
                        </span>
                      </div>
                    );
                  })}
                  <div className="px-4 py-2 bg-gray-800/50">
                    <span className="text-gray-600 text-xs font-mono">Enter to add · Esc to close · {NSE_STOCKS.length}+ stocks</span>
                  </div>
                </div>
              )}
            </div>
            {addError && <div className="mt-2 text-red-400 text-xs font-mono">{addError}</div>}
          </div>

          {(watchlist.symbols || []).length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-10 text-center">
              <div className="text-gray-600 text-sm font-mono mb-1">No stocks in watchlist</div>
              <div className="text-gray-700 text-xs font-mono">Search above and add stocks to track</div>
            </div>
          ) : (
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-800 flex justify-between items-center">
                <span className="text-white font-semibold text-sm">Watching {watchlist.symbols.length} stocks</span>
                <button onClick={function() { fetchStockPrices(watchlist.symbols); }} className="text-green-400 text-xs font-mono hover:underline">
                  {priceLoading ? 'Refreshing...' : '↻ Refresh'}
                </button>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="text-gray-500 text-xs font-mono border-b border-gray-800 bg-gray-800/20">
                    <th className="text-left px-5 py-3">SYMBOL</th>
                    <th className="text-right px-5 py-3">PRICE</th>
                    <th className="text-right px-5 py-3">CHANGE</th>
                    <th className="text-right px-5 py-3">ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {watchlist.symbols.map(function(sym) {
                    var p = prices[sym];
                    var change = p ? parseFloat(p.change) : 0;
                    return (
                      <tr key={sym} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                        <td className="px-5 py-4 font-mono font-bold text-white">{sym}</td>
                        <td className="px-5 py-4 text-right font-mono text-white">
                          {p && !p.error ? 'Rs.' + Number(p.price).toLocaleString('en-IN', { maximumFractionDigits: 2 }) : <span className="text-gray-600 text-xs">{priceLoading ? 'loading...' : '—'}</span>}
                        </td>
                        <td className={'px-5 py-4 text-right font-mono font-bold text-sm ' + (!p || p.error ? 'text-gray-600' : change >= 0 ? 'text-green-400' : 'text-red-400')}>
                          {p && !p.error ? (change >= 0 ? '+' : '') + p.change + ' (' + p.changePct + ')' : '—'}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button onClick={function() { removeStock(sym); }} className="text-red-400 text-xs hover:text-red-300 font-mono">Remove</button>
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

      {/* ── CRYPTO TAB ── */}
      {tab === 'crypto' && (
        <div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-5">
            <div className="text-white font-semibold text-sm mb-3">Search and Add Crypto</div>
            <input type="text" placeholder="Search by name or symbol... e.g. Bitcoin, ETH, SOL"
              value={cryptoSearch} onChange={function(e) { setCryptoSearch(e.target.value); }}
              className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white text-sm w-full outline-none focus:border-green-400 transition-colors mb-3"
            />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-56 overflow-y-auto pr-1">
              {filteredCrypto.map(function(c) {
                var inList = watchlist.cryptos && watchlist.cryptos.includes(c.id);
                return (
                  <div key={c.id}
                    onClick={function() { if (!inList) addCrypto(c.id); }}
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
              <div className="text-gray-600 text-sm font-mono">No crypto in watchlist — add from above</div>
            </div>
          ) : (
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-800">
                <span className="text-white font-semibold text-sm">Watching {watchlist.cryptos.length} coins</span>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="text-gray-500 text-xs font-mono border-b border-gray-800 bg-gray-800/20">
                    <th className="text-left px-5 py-3">COIN</th>
                    <th className="text-right px-5 py-3">PRICE (INR)</th>
                    <th className="text-right px-5 py-3">24H</th>
                    <th className="text-right px-5 py-3">ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {watchlist.cryptos.map(function(id) {
                    var coin = CRYPTO_LIST.find(function(c) { return c.id === id; });
                    var p    = cryptoPrices[id];
                    var chg  = p ? parseFloat(p.change24h) : 0;
                    return (
                      <tr key={id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                        <td className="px-5 py-4">
                          <div className="font-mono font-bold text-white text-sm">{coin ? coin.sym : id.toUpperCase()}</div>
                          <div className="text-gray-500 text-xs">{coin ? coin.name : id}</div>
                        </td>
                        <td className="px-5 py-4 text-right font-mono text-white">
                          {p ? 'Rs.' + Number(p.price).toLocaleString('en-IN', { maximumFractionDigits: 0 }) : '—'}
                        </td>
                        <td className={'px-5 py-4 text-right font-mono font-bold text-sm ' + (chg >= 0 ? 'text-green-400' : 'text-red-400')}>
                          {p ? (chg >= 0 ? '+' : '') + chg + '%' : '—'}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button onClick={function() { removeCrypto(id); }} className="text-red-400 text-xs hover:text-red-300 font-mono">Remove</button>
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

      {/* ── COMMODITIES TAB ── */}
      {tab === 'commodities' && (
        <div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-5">
            <div className="text-white font-semibold text-sm mb-3">Add Commodities</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {COMMODITY_LIST.map(function(c) {
                var inList = watchlist.commodities && watchlist.commodities.includes(c.id);
                return (
                  <div key={c.id}
                    onClick={function() { if (!inList) addCommodity(c.id); }}
                    className={'px-3 py-3 rounded-lg border transition-colors ' +
                      (inList ? 'border-green-400/30 bg-green-400/5 cursor-not-allowed' : 'border-gray-700 hover:border-green-400/40 hover:bg-gray-800 cursor-pointer')}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-bold text-green-400 text-xs bg-green-400/10 px-2 py-0.5 rounded">{c.icon}</span>
                      <span className={'text-xs font-mono ' + (inList ? 'text-green-400' : 'text-gray-600')}>{inList ? '✓ Added' : '+ Add'}</span>
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
              <div className="text-gray-600 text-sm font-mono">No commodities in watchlist — add from above</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {watchlist.commodities.map(function(id) {
                var comm = COMMODITY_LIST.find(function(c) { return c.id === id; });
                var p    = commPrices[id];
                return (
                  <div key={id} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <span className="font-mono font-bold text-green-400 text-xs bg-green-400/10 px-2 py-0.5 rounded">{comm ? comm.icon : id.toUpperCase()}</span>
                        <div className="text-white font-semibold mt-1">{comm ? comm.name : id}</div>
                        <div className="text-gray-500 text-xs">{comm ? comm.unit : ''}</div>
                      </div>
                      <button onClick={function() { removeCommodity(id); }} className="text-red-400 text-xs hover:text-red-300 font-mono">Remove</button>
                    </div>
                    {p ? (
                      <div>
                        <div className="text-white text-2xl font-bold font-mono">Rs.{p.price.toLocaleString('en-IN')}</div>
                        <div className={'text-sm font-mono mt-1 ' + (p.change.startsWith('+') ? 'text-green-400' : 'text-red-400')}>{p.change}</div>
                      </div>
                    ) : (
                      <div className="text-gray-600 text-sm font-mono">Loading...</div>
                    )}
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