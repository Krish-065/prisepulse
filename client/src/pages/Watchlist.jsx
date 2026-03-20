import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const BASE = (process.env.REACT_APP_API_URL || 'http://localhost:5000') + '/api';

const NSE_STOCKS = [
  // ── NIFTY 50 ──────────────────────────────────────────────────
  { sym: 'RELIANCE',    name: 'Reliance Industries'           },
  { sym: 'TCS',         name: 'Tata Consultancy Services'     },
  { sym: 'HDFCBANK',    name: 'HDFC Bank'                     },
  { sym: 'INFY',        name: 'Infosys'                       },
  { sym: 'ICICIBANK',   name: 'ICICI Bank'                    },
  { sym: 'HINDUNILVR',  name: 'Hindustan Unilever'            },
  { sym: 'SBIN',        name: 'State Bank of India'           },
  { sym: 'BAJFINANCE',  name: 'Bajaj Finance'                 },
  { sym: 'BHARTIARTL',  name: 'Bharti Airtel'                 },
  { sym: 'KOTAKBK',     name: 'Kotak Mahindra Bank'           },
  { sym: 'WIPRO',       name: 'Wipro'                         },
  { sym: 'AXISBANK',    name: 'Axis Bank'                     },
  { sym: 'LT',          name: 'Larsen and Toubro'             },
  { sym: 'ITC',         name: 'ITC Ltd'                       },
  { sym: 'ASIANPAINT',  name: 'Asian Paints'                  },
  { sym: 'MARUTI',      name: 'Maruti Suzuki'                 },
  { sym: 'SUNPHARMA',   name: 'Sun Pharmaceutical'            },
  { sym: 'TITAN',       name: 'Titan Company'                 },
  { sym: 'ULTRACEMCO',  name: 'UltraTech Cement'              },
  { sym: 'NESTLEIND',   name: 'Nestle India'                  },
  { sym: 'TATAMOTORS',  name: 'Tata Motors'                   },
  { sym: 'TATASTEEL',   name: 'Tata Steel'                    },
  { sym: 'JSWSTEEL',    name: 'JSW Steel'                     },
  { sym: 'HDFCLIFE',    name: 'HDFC Life Insurance'           },
  { sym: 'BAJAJFINSV',  name: 'Bajaj Finserv'                 },
  { sym: 'POWERGRID',   name: 'Power Grid Corp'               },
  { sym: 'NTPC',        name: 'NTPC Ltd'                      },
  { sym: 'ADANIPORTS',  name: 'Adani Ports'                   },
  { sym: 'ADANIENT',    name: 'Adani Enterprises'             },
  { sym: 'CIPLA',       name: 'Cipla Ltd'                     },
  { sym: 'DRREDDY',     name: 'Dr Reddys Laboratories'        },
  { sym: 'DIVISLAB',    name: 'Divis Laboratories'            },
  { sym: 'EICHERMOT',   name: 'Eicher Motors'                 },
  { sym: 'GRASIM',      name: 'Grasim Industries'             },
  { sym: 'HEROMOTOCO',  name: 'Hero MotoCorp'                 },
  { sym: 'HINDALCO',    name: 'Hindalco Industries'           },
  { sym: 'INDUSINDBK',  name: 'IndusInd Bank'                 },
  { sym: 'M&M',         name: 'Mahindra and Mahindra'         },
  { sym: 'ONGC',        name: 'Oil and Natural Gas Corp'      },
  { sym: 'SBILIFE',     name: 'SBI Life Insurance'            },
  { sym: 'TECHM',       name: 'Tech Mahindra'                 },
  { sym: 'TATACONSUM',  name: 'Tata Consumer Products'        },
  { sym: 'UPL',         name: 'UPL Ltd'                       },
  { sym: 'COALINDIA',   name: 'Coal India'                    },
  { sym: 'BPCL',        name: 'Bharat Petroleum'              },
  { sym: 'BRITANNIA',   name: 'Britannia Industries'          },
  { sym: 'APOLLOHOSP',  name: 'Apollo Hospitals'              },
  { sym: 'HCLTECH',     name: 'HCL Technologies'              },
  { sym: 'ETERNAL',     name: 'Eternal Ltd (Zomato)'          },
  { sym: 'SHRIRAMFIN',  name: 'Shriram Finance'               },

  // ── BANKING & FINANCE ─────────────────────────────────────────
  { sym: 'BANKBARODA',  name: 'Bank of Baroda'                },
  { sym: 'PNB',         name: 'Punjab National Bank'          },
  { sym: 'CANBK',       name: 'Canara Bank'                   },
  { sym: 'UNIONBANK',   name: 'Union Bank of India'           },
  { sym: 'IDFCFIRSTB',  name: 'IDFC First Bank'              },
  { sym: 'FEDERALBNK',  name: 'Federal Bank'                  },
  { sym: 'RBLBANK',     name: 'RBL Bank'                      },
  { sym: 'YESBANK',     name: 'Yes Bank'                      },
  { sym: 'BANDHANBNK',  name: 'Bandhan Bank'                  },
  { sym: 'AUBANK',      name: 'AU Small Finance Bank'         },
  { sym: 'CHOLAFIN',    name: 'Cholamandalam Investment'      },
  { sym: 'MUTHOOTFIN',  name: 'Muthoot Finance'               },
  { sym: 'MANAPPURAM',  name: 'Manappuram Finance'            },
  { sym: 'LICHSGFIN',   name: 'LIC Housing Finance'           },
  { sym: 'PNBHOUSING',  name: 'PNB Housing Finance'           },
  { sym: 'ICICIGI',     name: 'ICICI General Insurance'       },
  { sym: 'NIACL',       name: 'New India Assurance'           },
  { sym: 'LICI',        name: 'Life Insurance Corp of India'  },
  { sym: 'ABCAPITAL',   name: 'Aditya Birla Capital'          },
  { sym: 'M&MFIN',      name: 'M&M Financial Services'        },

  // ── IT & TECHNOLOGY ───────────────────────────────────────────
  { sym: 'MPHASIS',     name: 'Mphasis Ltd'                   },
  { sym: 'PERSISTENT',  name: 'Persistent Systems'            },
  { sym: 'COFORGE',     name: 'Coforge Ltd'                   },
  { sym: 'LTIM',        name: 'LTIMindtree'                   },
  { sym: 'OFSS',        name: 'Oracle Financial Services'     },
  { sym: 'HEXAWARE',    name: 'Hexaware Technologies'         },
  { sym: 'KPITTECH',    name: 'KPIT Technologies'             },
  { sym: 'TATAELXSI',   name: 'Tata Elxsi'                    },
  { sym: 'ZENSARTECH',  name: 'Zensar Technologies'           },
  { sym: 'NIITTECH',    name: 'NIIT Technologies'             },
  { sym: 'RATEGAIN',    name: 'RateGain Travel Technologies'  },
  { sym: 'HAPPSTMNDS',  name: 'Happiest Minds Technologies'   },
  { sym: 'TANLA',       name: 'Tanla Platforms'               },
  { sym: 'INTELLECT',   name: 'Intellect Design Arena'        },

  // ── AUTO & EV ─────────────────────────────────────────────────
  { sym: 'BAJAJ-AUTO',  name: 'Bajaj Auto'                    },
  { sym: 'TVSMOTORS',   name: 'TVS Motors'                    },
  { sym: 'ASHOKLEY',    name: 'Ashok Leyland'                 },
  { sym: 'TVSMOTOR',    name: 'TVS Motor Company'             },
  { sym: 'EXIDEIND',    name: 'Exide Industries'              },
  { sym: 'AMARAJABAT',  name: 'Amara Raja Energy'             },
  { sym: 'MOTHERSON',   name: 'Samvardhana Motherson'         },
  { sym: 'BOSCHLTD',    name: 'Bosch Ltd'                     },
  { sym: 'MINDA',       name: 'Uno Minda'                     },
  { sym: 'OLECTRA',     name: 'Olectra Greentech'             },

  // ── PHARMA & HEALTHCARE ───────────────────────────────────────
  { sym: 'AUROPHARMA',  name: 'Aurobindo Pharma'              },
  { sym: 'LUPIN',       name: 'Lupin Ltd'                     },
  { sym: 'TORNTPHARM',  name: 'Torrent Pharmaceuticals'       },
  { sym: 'ALKEM',       name: 'Alkem Laboratories'            },
  { sym: 'BIOCON',      name: 'Biocon Ltd'                    },
  { sym: 'GLENMARK',    name: 'Glenmark Pharmaceuticals'      },
  { sym: 'NATCOPHARM',  name: 'Natco Pharma'                  },
  { sym: 'IPCALAB',     name: 'IPCA Laboratories'             },
  { sym: 'MAXHEALTH',   name: 'Max Healthcare Institute'      },
  { sym: 'FORTIS',      name: 'Fortis Healthcare'             },
  { sym: 'NARAYANHCA',  name: 'Narayana Hrudayalaya'          },
  { sym: 'METROPOLIS',  name: 'Metropolis Healthcare'         },
  { sym: 'LALPATHLAB',  name: 'Dr Lal PathLabs'               },

  // ── FMCG & CONSUMER ───────────────────────────────────────────
  { sym: 'DABUR',       name: 'Dabur India'                   },
  { sym: 'MARICO',      name: 'Marico Ltd'                    },
  { sym: 'COLPAL',      name: 'Colgate Palmolive India'       },
  { sym: 'GODREJCP',    name: 'Godrej Consumer Products'      },
  { sym: 'EMAMILTD',    name: 'Emami Ltd'                     },
  { sym: 'TATAPOWER',   name: 'Tata Power'                    },
  { sym: 'MCDOWELL-N',  name: 'United Spirits (McDowell)'     },
  { sym: 'UBL',         name: 'United Breweries'              },
  { sym: 'VBL',         name: 'Varun Beverages'               },
  { sym: 'RADICO',      name: 'Radico Khaitan'                },

  // ── ENERGY & POWER ────────────────────────────────────────────
  { sym: 'ADANIGREEN',  name: 'Adani Green Energy'            },
  { sym: 'ADANITRANS',  name: 'Adani Transmission'            },
  { sym: 'ADANIPOWER',  name: 'Adani Power'                   },
  { sym: 'TORNTPOWER',  name: 'Torrent Power'                 },
  { sym: 'CESC',        name: 'CESC Ltd'                      },
  { sym: 'TATAPOWER',   name: 'Tata Power'                    },
  { sym: 'NHPC',        name: 'NHPC Ltd'                      },
  { sym: 'SJVN',        name: 'SJVN Ltd'                      },
  { sym: 'RECLTD',      name: 'REC Ltd'                       },
  { sym: 'PFC',         name: 'Power Finance Corp'            },
  { sym: 'IREDA',       name: 'Indian Renewable Energy Dev'   },

  // ── METALS & MINING ───────────────────────────────────────────
  { sym: 'VEDL',        name: 'Vedanta Ltd'                   },
  { sym: 'NMDC',        name: 'NMDC Ltd'                      },
  { sym: 'MOIL',        name: 'MOIL Ltd'                      },
  { sym: 'SAIL',        name: 'Steel Authority of India'      },
  { sym: 'NATIONALUM',  name: 'National Aluminium'            },
  { sym: 'RATNAMANI',   name: 'Ratnamani Metals'              },
  { sym: 'APLAPOLLO',   name: 'APL Apollo Tubes'              },
  { sym: 'JINDALSTEL',  name: 'Jindal Steel and Power'        },

  // ── CEMENT & INFRASTRUCTURE ───────────────────────────────────
  { sym: 'AMBUJACEM',   name: 'Ambuja Cements'                },
  { sym: 'ACC',         name: 'ACC Ltd'                       },
  { sym: 'SHREECEM',    name: 'Shree Cement'                  },
  { sym: 'RAMCOCEM',    name: 'Ramco Cements'                 },
  { sym: 'JKCEMENT',    name: 'JK Cement'                     },
  { sym: 'NCC',         name: 'NCC Ltd'                       },
  { sym: 'KNR',         name: 'KNR Constructions'             },
  { sym: 'GRINFRA',     name: 'GR Infraprojects'              },
  { sym: 'IRB',         name: 'IRB Infrastructure'            },

  // ── DEFENCE ───────────────────────────────────────────────────
  { sym: 'HAL',         name: 'Hindustan Aeronautics'         },
  { sym: 'BEL',         name: 'Bharat Electronics'            },
  { sym: 'BHEL',        name: 'Bharat Heavy Electricals'      },
  { sym: 'BEML',        name: 'BEML Ltd'                      },
  { sym: 'MAZDOCK',     name: 'Mazagon Dock Shipbuilders'     },
  { sym: 'GRSE',        name: 'Garden Reach Shipbuilders'     },
  { sym: 'COCHINSHIP',  name: 'Cochin Shipyard'               },
  { sym: 'MIDHANI',     name: 'Mishra Dhatu Nigam'            },
  { sym: 'PARAS',       name: 'Paras Defence and Space'       },
  { sym: 'ASTRA',       name: 'Astra Microwave Products'      },

  // ── NEW AGE & STARTUPS ────────────────────────────────────────
  { sym: 'PAYTM',       name: 'Paytm (One97 Communications)'  },
  { sym: 'NYKAA',       name: 'Nykaa (FSN E-Commerce)'        },
  { sym: 'POLICYBZR',   name: 'Policybazaar (PB Fintech)'     },
  { sym: 'DELHIVERY',   name: 'Delhivery Ltd'                 },
  { sym: 'CARTRADE',    name: 'CarTrade Tech'                  },
  { sym: 'EASEMYTRIP',  name: 'Easy Trip Planners'            },
  { sym: 'DEVYANI',     name: 'Devyani International'         },
  { sym: 'SAPPHIRE',    name: 'Sapphire Foods India'          },
  { sym: 'IXIGO',       name: 'Le Travenues (ixigo)'          },

  // ── RETAIL & CONSUMER DISCRETIONARY ──────────────────────────
  { sym: 'DMART',       name: 'Avenue Supermarts (DMart)'     },
  { sym: 'TRENT',       name: 'Trent Ltd (Westside/Zudio)'    },
  { sym: 'ABFRL',       name: 'Aditya Birla Fashion Retail'   },
  { sym: 'PAGEIND',     name: 'Page Industries (Jockey)'      },
  { sym: 'VEDANT',      name: 'Vedant Fashions (Manyavar)'    },
  { sym: 'SHOPERSTOP',  name: 'Shoppers Stop'                 },
  { sym: 'VMART',       name: 'V-Mart Retail'                 },
  { sym: 'NAUKRI',      name: 'Info Edge (Naukri.com)'        },
  { sym: 'JUSTDIAL',    name: 'Just Dial'                     },

  // ── TELECOM & MEDIA ───────────────────────────────────────────
  { sym: 'IDEA',        name: 'Vodafone Idea'                 },
  { sym: 'TTML',        name: 'Tata Teleservices Maharashtra' },
  { sym: 'SUNTVNET',    name: 'Sun TV Network'                },
  { sym: 'ZEEL',        name: 'Zee Entertainment'             },
  { sym: 'PVRINOX',     name: 'PVR Inox Ltd'                  },
  { sym: 'NAZARA',      name: 'Nazara Technologies'           },

  // ── REAL ESTATE ───────────────────────────────────────────────
  { sym: 'DLF',         name: 'DLF Ltd'                       },
  { sym: 'GODREJPROP',  name: 'Godrej Properties'             },
  { sym: 'OBEROIRLTY',  name: 'Oberoi Realty'                 },
  { sym: 'SOBHA',       name: 'Sobha Ltd'                     },
  { sym: 'PRESTIGE',    name: 'Prestige Estates Projects'     },
  { sym: 'BRIGADE',     name: 'Brigade Enterprises'           },
  { sym: 'PHOENIXLTD',  name: 'Phoenix Mills'                 },
  { sym: 'MAHLIFE',     name: 'Mahindra Lifespace Developers' },

  // ── RAILWAYS & LOGISTICS ──────────────────────────────────────
  { sym: 'IRCTC',       name: 'Indian Railway Catering Corp'  },
  { sym: 'IRFC',        name: 'Indian Railway Finance Corp'   },
  { sym: 'RVNL',        name: 'Rail Vikas Nigam'              },
  { sym: 'RAILTEL',     name: 'RailTel Corporation'           },
  { sym: 'CONCOR',      name: 'Container Corp of India'       },
  { sym: 'BLUEDART',    name: 'Blue Dart Express'             },
  { sym: 'GATI',        name: 'Gati Ltd'                      },
  { sym: 'TCI',         name: 'Transport Corp of India'       },

  // ── OIL & GAS ─────────────────────────────────────────────────
  { sym: 'IOC',         name: 'Indian Oil Corporation'        },
  { sym: 'HINDPETRO',   name: 'Hindustan Petroleum'           },
  { sym: 'PETRONET',    name: 'Petronet LNG'                  },
  { sym: 'GAIL',        name: 'GAIL India'                    },
  { sym: 'OIL',         name: 'Oil India Ltd'                 },
  { sym: 'IGL',         name: 'Indraprastha Gas'              },
  { sym: 'MGL',         name: 'Mahanagar Gas'                 },
  { sym: 'GSPL',        name: 'Gujarat State Petronet'        },

  // ── CHEMICALS & SPECIALTY ─────────────────────────────────────
  { sym: 'PIDILITIND',  name: 'Pidilite Industries'           },
  { sym: 'ASTRAL',      name: 'Astral Ltd'                    },
  { sym: 'AARTI',       name: 'Aarti Industries'              },
  { sym: 'DEEPAKNTR',   name: 'Deepak Nitrite'                },
  { sym: 'NAVINFLUOR',  name: 'Navin Fluorine International'  },
  { sym: 'FINEORG',     name: 'Fine Organic Industries'       },
  { sym: 'GALAXYSURF',  name: 'Galaxy Surfactants'            },
  { sym: 'TATACHEM',    name: 'Tata Chemicals'                },
  { sym: 'GNFC',        name: 'Gujarat Narmada Valley Fertilizers' },
  { sym: 'COROMANDEL',  name: 'Coromandel International'      },

  // ── TEXTILES ──────────────────────────────────────────────────
  { sym: 'ICAD',        name: 'Indo Count Industries'         },
  { sym: 'RAYMOND',     name: 'Raymond Ltd'                   },
  { sym: 'VARDHMAN',    name: 'Vardhman Textiles'             },
  { sym: 'WELSPUNIND',  name: 'Welspun India'                 },
  { sym: 'KITEX',       name: 'Kitex Garments'                },

  // ── AGRICULTURE & FOOD ────────────────────────────────────────
  { sym: 'AVANTIFEED',  name: 'Avanti Feeds'                  },
  { sym: 'KRBL',        name: 'KRBL Ltd (India Gate Rice)'    },
  { sym: 'LT Foods',    name: 'LT Foods'                      },
  { sym: 'GODREJAGRO',  name: 'Godrej Agrovet'                },
  { sym: 'PRAJIND',     name: 'Praj Industries'               },
];

export default function Watchlist() {
  const [watchlist,    setWatchlist]    = useState([]);
  const [prices,       setPrices]       = useState({});
  const [priceLoading, setPriceLoading] = useState(false);
  const [search,       setSearch]       = useState('');
  const [suggestions,  setSuggestions]  = useState([]);
  const [adding,       setAdding]       = useState('');
  const [addError,     setAddError]     = useState('');
  const [showDrop,     setShowDrop]     = useState(false);
  const searchRef = useRef(null);
  const navigate  = useNavigate();
  const token     = localStorage.getItem('token');

  // ── Guest gate ────────────────────────────────────────────────
  if (!token) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-10 w-full max-w-md text-center">
          <div className="w-14 h-14 bg-green-400/10 border border-green-400/20 rounded-full flex items-center justify-center mx-auto mb-5">
            <span className="text-green-400 text-2xl">★</span>
          </div>
          <h2 className="text-white text-xl font-bold mb-2">Login to use Watchlist</h2>
          <p className="text-gray-500 text-sm mb-6 leading-relaxed">
            Create a free account to save your favourite stocks and track them in one place.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-green-400 text-gray-950 font-bold py-3 rounded-lg text-sm hover:bg-green-300 transition-colors mb-3"
          >
            Login or Sign Up — It's Free
          </button>
          <button
            onClick={() => navigate(-1)}
            className="w-full text-gray-500 text-sm py-2 rounded-lg border border-gray-800 hover:border-gray-600 hover:text-gray-300 transition-colors font-mono"
          >
            ← Go back
          </button>
        </div>
      </div>
    );
  }

  // ── Load watchlist on mount ───────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await axios.get(BASE + '/watchlist', {
          headers: { Authorization: 'Bearer ' + token }
        });
        setWatchlist(data);
        if (data.length > 0) fetchPrices(data);
      } catch (err) {
        console.log('Watchlist load error:', err);
      }
    };
    load();
  // eslint-disable-next-line
  }, []);

  // ── Close dropdown on outside click ──────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowDrop(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Filter suggestions as user types ─────────────────────────
  useEffect(() => {
    const q = search.trim().toUpperCase();
    if (q.length < 1) { setSuggestions([]); setShowDrop(false); return; }

    const matched = NSE_STOCKS.filter(s =>
      s.sym.toUpperCase().startsWith(q) ||
      s.name.toUpperCase().includes(q)
    ).slice(0, 10);

    if (q.length >= 2 && !matched.find(s => s.sym === q)) {
      matched.push({ sym: q, name: 'Search "' + q + '" on NSE' });
    }

    setSuggestions(matched);
    setShowDrop(matched.length > 0);
  }, [search]);

  // ── Fetch live prices ─────────────────────────────────────────
  const fetchPrices = async (symbols) => {
    setPriceLoading(true);
    try {
      const { data } = await axios.post(BASE + '/market/quotes', { symbols });
      const map = {};
      data.forEach(d => { map[d.symbol] = d; });
      setPrices(map);
    } catch (err) {
      console.log('Price fetch error:', err);
    }
    setPriceLoading(false);
  };

  // ── Add stock ─────────────────────────────────────────────────
  const addStock = async (sym) => {
    const symbol = sym.toUpperCase().trim();
    if (!symbol) return;
    if (watchlist.includes(symbol)) {
      setAddError(symbol + ' is already in your watchlist');
      setTimeout(() => setAddError(''), 3000);
      setSearch(''); setShowDrop(false);
      return;
    }
    setAdding(symbol);
    setAddError('');
    setSearch('');
    setShowDrop(false);
    try {
      const { data } = await axios.post(BASE + '/watchlist/add',
        { symbol },
        { headers: { Authorization: 'Bearer ' + token } }
      );
      setWatchlist(data);
      fetchPrices(data);
    } catch (err) {
      setAddError('Could not add ' + symbol + '. Make sure it is a valid NSE symbol.');
      setTimeout(() => setAddError(''), 4000);
    }
    setAdding('');
  };

  // ── Remove stock ──────────────────────────────────────────────
  const removeStock = async (symbol) => {
    try {
      const { data } = await axios.post(BASE + '/watchlist/remove',
        { symbol },
        { headers: { Authorization: 'Bearer ' + token } }
      );
      setWatchlist(data);
      const updated = { ...prices };
      delete updated[symbol];
      setPrices(updated);
    } catch (err) {
      console.log('Remove error:', err);
    }
  };

  // ── Keyboard shortcuts ────────────────────────────────────────
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && search.trim()) {
      suggestions.length > 0
        ? addStock(suggestions[0].sym)
        : addStock(search.trim());
    }
    if (e.key === 'Escape') { setShowDrop(false); setSearch(''); }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-white text-2xl font-bold">My Watchlist</h1>
        <span className="text-gray-500 text-xs font-mono">
          {watchlist.length} stock{watchlist.length !== 1 ? 's' : ''} watching
        </span>
      </div>

      {/* ── Search Box ── */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6" ref={searchRef}>
        <div className="text-white font-semibold text-sm mb-3">Add Stock to Watchlist</div>
        <div className="relative">
          <input
            type="text"
            placeholder="Search any NSE stock — symbol or company name..."
            value={search}
            onChange={e => { setSearch(e.target.value); setAddError(''); }}
            onKeyDown={handleKeyDown}
            onFocus={() => { if (suggestions.length > 0) setShowDrop(true); }}
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white text-sm w-full outline-none focus:border-green-400 transition-colors pr-24"
          />
          <button
            onClick={() => search.trim() && addStock(search.trim())}
            disabled={!search.trim() || adding !== ''}
            className="absolute right-2 top-2 bg-green-400 text-gray-950 font-bold text-xs px-3 py-1.5 rounded hover:bg-green-300 transition-colors disabled:opacity-40"
          >
            {adding ? 'Adding...' : '+ Add'}
          </button>

          {/* Dropdown */}
          {showDrop && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg overflow-hidden z-50 shadow-xl">
              {suggestions.map((s, i) => (
                <div
                  key={i}
                  onClick={() => !watchlist.includes(s.sym) && addStock(s.sym)}
                  className={
                    'flex items-center justify-between px-4 py-3 border-b border-gray-700 last:border-0 transition-colors ' +
                    (watchlist.includes(s.sym)
                      ? 'opacity-40 cursor-not-allowed'
                      : 'cursor-pointer hover:bg-gray-700')
                  }
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-white text-sm w-28 flex-shrink-0">{s.sym}</span>
                    <span className="text-gray-400 text-xs">{s.name}</span>
                  </div>
                  <span className={'text-xs font-mono flex-shrink-0 ml-2 ' + (watchlist.includes(s.sym) ? 'text-green-400' : 'text-green-400')}>
                    {watchlist.includes(s.sym) ? 'Added' : adding === s.sym ? 'Adding...' : '+ Add'}
                  </span>
                </div>
              ))}
              <div className="px-4 py-2 bg-gray-800/50">
                <span className="text-gray-600 text-xs font-mono">
                  Enter to add top result · Esc to close · {NSE_STOCKS.length}+ stocks available
                </span>
              </div>
            </div>
          )}
        </div>

        {addError && (
          <div className="mt-2 text-red-400 text-xs font-mono">{addError}</div>
        )}
        <div className="mt-2 text-gray-600 text-xs font-mono">
          {NSE_STOCKS.length}+ NSE stocks across all sectors — Nifty 50, Banking, IT, Pharma, Defence, EV and more
        </div>
      </div>

      {/* ── Watchlist Table ── */}
      {watchlist.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
          <div className="text-gray-600 text-sm font-mono mb-2">Your watchlist is empty</div>
          <div className="text-gray-700 text-xs font-mono">Search for a stock above and click Add</div>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
            <span className="text-white font-semibold text-sm">Watching</span>
            <button
              onClick={() => fetchPrices(watchlist)}
              className="text-green-400 text-xs font-mono hover:underline transition-colors"
            >
              {priceLoading ? 'Refreshing...' : '↻ Refresh Prices'}
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
              {watchlist.map(sym => {
                const p      = prices[sym];
                const change = p ? parseFloat(p.change) : 0;
                return (
                  <tr key={sym} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                    <td className="px-5 py-4 font-mono font-bold text-white">{sym}</td>
                    <td className="px-5 py-4 text-right font-mono text-white">
                      {p && !p.error
                        ? 'Rs.' + Number(p.price).toLocaleString('en-IN', { maximumFractionDigits: 2 })
                        : priceLoading
                          ? <span className="text-gray-600 text-xs">loading...</span>
                          : <span className="text-gray-600 text-xs">—</span>
                      }
                    </td>
                    <td className={'px-5 py-4 text-right font-mono font-bold text-sm ' + (
                      !p || p.error ? 'text-gray-600'
                        : change >= 0 ? 'text-green-400' : 'text-red-400'
                    )}>
                      {p && !p.error
                        ? (change >= 0 ? '+' : '') + p.change + ' (' + p.changePct + ')'
                        : '—'
                      }
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => removeStock(sym)}
                        className="text-red-400 text-xs hover:text-red-300 font-mono transition-colors"
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