import React, { useState, useMemo } from 'react';

// Nifty 500 style screener — uses realistic static data for the base,
// which would be replaced with a live API call (NSE/Alpha Vantage) in production.
// The filters, sorting, and UI are all fully functional.

var STOCKS = [
  { symbol: 'RELIANCE',   name: 'Reliance Industries',        sector: 'Energy',       mcap: 1720000, pe: 23.4, pb: 2.1, roe: 9.2,  div: 0.5,  chg1d: 1.12,  chg1w: 2.4,  chg1m: 5.1,  price: 1285.40 },
  { symbol: 'TCS',        name: 'Tata Consultancy Services',  sector: 'IT',           mcap: 1380000, pe: 28.7, pb: 12.4,roe: 43.5, div: 1.8,  chg1d: -0.34, chg1w: -1.2, chg1m: -3.8, price: 3387.75 },
  { symbol: 'HDFCBANK',   name: 'HDFC Bank',                  sector: 'Banking',      mcap: 1240000, pe: 18.2, pb: 2.8, roe: 15.4, div: 1.2,  chg1d: 0.67,  chg1w: 1.8,  chg1m: 3.2,  price: 1762.30 },
  { symbol: 'INFY',       name: 'Infosys',                    sector: 'IT',           mcap: 620000,  pe: 24.1, pb: 7.3, roe: 30.2, div: 2.4,  chg1d: -1.30, chg1w: -2.8, chg1m: -5.4, price: 1233.80 },
  { symbol: 'ICICIBANK',  name: 'ICICI Bank',                 sector: 'Banking',      mcap: 890000,  pe: 16.8, pb: 2.9, roe: 17.8, div: 0.9,  chg1d: 0.92,  chg1w: 3.1,  chg1m: 7.6,  price: 1274.20 },
  { symbol: 'SBIN',       name: 'State Bank of India',        sector: 'Banking',      mcap: 700000,  pe: 11.2, pb: 1.7, roe: 15.6, div: 2.1,  chg1d: 0.45,  chg1w: 1.2,  chg1m: 2.8,  price: 783.40  },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel',              sector: 'Telecom',      mcap: 1120000, pe: 68.4, pb: 8.2, roe: 12.1, div: 0.3,  chg1d: 1.81,  chg1w: 4.2,  chg1m: 9.3,  price: 1815.90 },
  { symbol: 'BAJFINANCE', name: 'Bajaj Finance',              sector: 'NBFC',         mcap: 430000,  pe: 27.3, pb: 5.1, roe: 18.7, div: 0.7,  chg1d: -1.30, chg1w: -3.4, chg1m: -6.2, price: 866.70  },
  { symbol: 'WIPRO',      name: 'Wipro',                      sector: 'IT',           mcap: 248000,  pe: 19.4, pb: 3.6, roe: 18.5, div: 0.3,  chg1d: -2.15, chg1w: -4.1, chg1m: -8.7, price: 190.92  },
  { symbol: 'TATAMOTORS', name: 'Tata Motors',                sector: 'Auto',         mcap: 350000,  pe: 8.1,  pb: 2.4, roe: 29.8, div: 0.5,  chg1d: 1.44,  chg1w: 3.2,  chg1m: 6.1,  price: 816.20  },
  { symbol: 'MARUTI',     name: 'Maruti Suzuki',              sector: 'Auto',         mcap: 420000,  pe: 22.7, pb: 4.5, roe: 19.9, div: 2.1,  chg1d: 0.88,  chg1w: 2.1,  chg1m: 4.3,  price: 13200.00},
  { symbol: 'TITAN',      name: 'Titan Company',              sector: 'Consumer',     mcap: 310000,  pe: 84.2, pb: 18.7,roe: 22.3, div: 0.8,  chg1d: 0.56,  chg1w: 1.4,  chg1m: 3.1,  price: 3492.00 },
  { symbol: 'SUNPHARMA',  name: 'Sun Pharmaceutical',         sector: 'Pharma',       mcap: 340000,  pe: 32.1, pb: 5.2, roe: 16.3, div: 0.9,  chg1d: -0.82, chg1w: -1.7, chg1m: -2.9, price: 1424.50 },
  { symbol: 'CIPLA',      name: 'Cipla',                      sector: 'Pharma',       mcap: 102000,  pe: 26.4, pb: 4.1, roe: 15.6, div: 1.2,  chg1d: -1.24, chg1w: -2.9, chg1m: -4.8, price: 1283.90 },
  { symbol: 'DRREDDY',    name: 'Dr Reddys Labs',             sector: 'Pharma',       mcap: 98000,   pe: 18.2, pb: 3.4, roe: 18.4, div: 1.8,  chg1d: 0.22,  chg1w: 0.8,  chg1m: 1.6,  price: 1182.40 },
  { symbol: 'KOTAKBK',    name: 'Kotak Mahindra Bank',        sector: 'Banking',      mcap: 360000,  pe: 19.7, pb: 2.7, roe: 13.8, div: 0.2,  chg1d: 0.38,  chg1w: 1.1,  chg1m: 2.4,  price: 1813.70 },
  { symbol: 'AXISBANK',   name: 'Axis Bank',                  sector: 'Banking',      mcap: 345000,  pe: 14.6, pb: 2.2, roe: 15.2, div: 0.5,  chg1d: 0.33,  chg1w: 0.9,  chg1m: 1.8,  price: 1124.40 },
  { symbol: 'ADANIPORTS', name: 'Adani Ports',                sector: 'Infra',        mcap: 280000,  pe: 28.9, pb: 4.8, roe: 16.5, div: 0.6,  chg1d: 0.74,  chg1w: 2.3,  chg1m: 5.2,  price: 1294.80 },
  { symbol: 'LT',         name: 'Larsen and Toubro',          sector: 'Infra',        mcap: 460000,  pe: 31.2, pb: 4.3, roe: 13.7, div: 1.1,  chg1d: 1.05,  chg1w: 2.7,  chg1m: 6.3,  price: 3314.60 },
  { symbol: 'ITC',        name: 'ITC',                        sector: 'FMCG',         mcap: 530000,  pe: 26.3, pb: 7.1, roe: 27.2, div: 3.4,  chg1d: -0.14, chg1w: 0.3,  chg1m: 0.9,  price: 428.90  },
  { symbol: 'HINDUNILVR', name: 'Hindustan Unilever',         sector: 'FMCG',         mcap: 530000,  pe: 57.2, pb: 11.3,roe: 19.8, div: 2.2,  chg1d: 0.29,  chg1w: 0.7,  chg1m: 1.5,  price: 2256.00 },
  { symbol: 'NESTLEIND',  name: 'Nestle India',               sector: 'FMCG',         mcap: 215000,  pe: 71.4, pb: 68.2,roe: 95.3, div: 1.8,  chg1d: -0.77, chg1w: -1.8, chg1m: -3.4, price: 2245.30 },
  { symbol: 'HCLTECH',    name: 'HCL Technologies',           sector: 'IT',           mcap: 390000,  pe: 25.8, pb: 6.2, roe: 24.1, div: 3.4,  chg1d: 0.62,  chg1w: 1.5,  chg1m: 3.8,  price: 1442.80 },
  { symbol: 'ONGC',       name: 'ONGC',                       sector: 'Energy',       mcap: 340000,  pe: 8.4,  pb: 1.1, roe: 13.4, div: 5.2,  chg1d: 0.33,  chg1w: 0.8,  chg1m: 2.1,  price: 271.90  },
  { symbol: 'NTPC',       name: 'NTPC',                       sector: 'Energy',       mcap: 327000,  pe: 16.8, pb: 2.3, roe: 13.7, div: 3.1,  chg1d: 0.18,  chg1w: 0.4,  chg1m: 0.9,  price: 338.40  },
  { symbol: 'POWERGRID',  name: 'Power Grid Corp',            sector: 'Energy',       mcap: 295000,  pe: 18.4, pb: 3.1, roe: 16.9, div: 4.2,  chg1d: -0.11, chg1w: 0.2,  chg1m: 0.7,  price: 317.50  },
  { symbol: 'COALINDIA',  name: 'Coal India',                 sector: 'Metals',       mcap: 237000,  pe: 8.2,  pb: 5.4, roe: 65.3, div: 7.8,  chg1d: 0.52,  chg1w: 1.3,  chg1m: 2.8,  price: 386.90  },
  { symbol: 'TATASTEEL',  name: 'Tata Steel',                 sector: 'Metals',       mcap: 187000,  pe: 41.2, pb: 1.7, roe: 4.1,  div: 0.3,  chg1d: 2.83,  chg1w: 5.8,  chg1m: 11.2, price: 152.90  },
  { symbol: 'HINDALCO',   name: 'Hindalco Industries',        sector: 'Metals',       mcap: 152000,  pe: 14.7, pb: 1.9, roe: 12.9, div: 0.7,  chg1d: 1.14,  chg1w: 2.8,  chg1m: 5.7,  price: 680.20  },
  { symbol: 'JSWSTEEL',   name: 'JSW Steel',                  sector: 'Metals',       mcap: 192000,  pe: 22.4, pb: 2.8, roe: 12.5, div: 0.6,  chg1d: 1.67,  chg1w: 3.9,  chg1m: 8.2,  price: 785.40  },
];

var SECTORS = ['All', 'IT', 'Banking', 'NBFC', 'Energy', 'Auto', 'Pharma', 'FMCG', 'Metals', 'Telecom', 'Consumer', 'Infra'];

var PRESETS = [
  { label: '52W High Breakout', filter: function(s) { return s.chg1m > 8; } },
  { label: 'High Dividend',     filter: function(s) { return s.div > 2.5; } },
  { label: 'Low P/E Value',     filter: function(s) { return s.pe < 12 && s.pe > 0; } },
  { label: 'High ROE',          filter: function(s) { return s.roe > 20; } },
  { label: 'Momentum (1M)',     filter: function(s) { return s.chg1m > 5; } },
  { label: 'Oversold (1M)',     filter: function(s) { return s.chg1m < -5; } },
];

function ChgCell(props) {
  var v = props.v || 0;
  return (
    <span className={'font-mono text-xs ' + (v >= 0 ? 'text-green-400' : 'text-red-400')}>
      {v >= 0 ? '+' : ''}{v.toFixed(2)}%
    </span>
  );
}

export default function Screener() {
  var [sector,     setSector]     = useState('All');
  var [sortBy,     setSortBy]     = useState('mcap');
  var [sortDir,    setSortDir]    = useState('desc');
  var [search,     setSearch]     = useState('');
  var [peMax,      setPeMax]      = useState('');
  var [roeMin,     setRoeMin]     = useState('');
  var [divMin,     setDivMin]     = useState('');
  var [chgFilter,  setChgFilter]  = useState('');
  var [preset,     setPreset]     = useState(null);

  var filtered = useMemo(function() {
    var result = STOCKS.slice();

    if (preset !== null) {
      result = result.filter(PRESETS[preset].filter);
    } else {
      if (sector !== 'All') result = result.filter(function(s) { return s.sector === sector; });
      if (search) {
        var q = search.toLowerCase();
        result = result.filter(function(s) {
          return s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q);
        });
      }
      if (peMax)   result = result.filter(function(s) { return s.pe <= parseFloat(peMax) && s.pe > 0; });
      if (roeMin)  result = result.filter(function(s) { return s.roe >= parseFloat(roeMin); });
      if (divMin)  result = result.filter(function(s) { return s.div >= parseFloat(divMin); });
      if (chgFilter === 'gainers') result = result.filter(function(s) { return s.chg1d > 0; });
      if (chgFilter === 'losers')  result = result.filter(function(s) { return s.chg1d < 0; });
    }

    result.sort(function(a, b) {
      var av = a[sortBy] || 0, bv = b[sortBy] || 0;
      return sortDir === 'desc' ? bv - av : av - bv;
    });

    return result;
  }, [sector, search, peMax, roeMin, divMin, chgFilter, sortBy, sortDir, preset]);

  var toggleSort = function(col) {
    if (sortBy === col) {
      setSortDir(function(d) { return d === 'desc' ? 'asc' : 'desc'; });
    } else {
      setSortBy(col);
      setSortDir('desc');
    }
  };

  var SortHeader = function(props) {
    var active = sortBy === props.col;
    return (
      <th
        onClick={function() { toggleSort(props.col); }}
        className={'px-3 py-3 text-right text-xs font-mono cursor-pointer select-none transition-colors ' +
          (active ? 'text-green-400' : 'text-gray-500 hover:text-gray-300')}
      >
        {props.label}{active ? (sortDir === 'desc' ? ' ↓' : ' ↑') : ''}
      </th>
    );
  };

  return (
    <div className="p-4 max-w-7xl mx-auto">

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-white text-2xl font-bold">Stock Screener</h1>
          <p className="text-gray-500 text-xs font-mono mt-1">{filtered.length} stocks · Filter by sector, valuation & returns</p>
        </div>
      </div>

      {/* Preset Filters */}
      <div className="mb-4">
        <div className="text-gray-500 text-xs font-mono mb-2">QUICK PRESETS</div>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map(function(p, i) {
            return (
              <button key={i}
                onClick={function() { setPreset(preset === i ? null : i); }}
                className={
                  'px-3 py-1.5 rounded-lg text-xs font-mono transition-all border ' +
                  (preset === i
                    ? 'bg-green-400/15 text-green-400 border-green-400/30'
                    : 'text-gray-400 border-gray-700 hover:border-gray-600 hover:text-white')
                }
              >{p.label}</button>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      {preset === null && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-4">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <div className="col-span-2 md:col-span-1">
              <input type="text" placeholder="Search symbol / name..."
                value={search} onChange={function(e) { setSearch(e.target.value); }}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-xs w-full outline-none focus:border-green-400 font-mono"
              />
            </div>
            <div>
              <select value={sector} onChange={function(e) { setSector(e.target.value); }}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-xs w-full outline-none focus:border-green-400 font-mono">
                {SECTORS.map(function(s) { return <option key={s} value={s}>{s}</option>; })}
              </select>
            </div>
            <div>
              <input type="number" placeholder="P/E max" value={peMax}
                onChange={function(e) { setPeMax(e.target.value); }}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-xs w-full outline-none focus:border-green-400 font-mono"
              />
            </div>
            <div>
              <input type="number" placeholder="ROE min %" value={roeMin}
                onChange={function(e) { setRoeMin(e.target.value); }}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-xs w-full outline-none focus:border-green-400 font-mono"
              />
            </div>
            <div>
              <input type="number" placeholder="Div yield min" value={divMin}
                onChange={function(e) { setDivMin(e.target.value); }}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-xs w-full outline-none focus:border-green-400 font-mono"
              />
            </div>
            <div>
              <select value={chgFilter} onChange={function(e) { setChgFilter(e.target.value); }}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-xs w-full outline-none focus:border-green-400 font-mono">
                <option value="">All movers</option>
                <option value="gainers">Today's gainers</option>
                <option value="losers">Today's losers</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Sector Pills */}
      {preset === null && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {SECTORS.map(function(s) {
            return (
              <button key={s} onClick={function() { setSector(s); }}
                className={
                  'px-2.5 py-1 rounded-full text-xs font-mono transition-all ' +
                  (sector === s ? 'bg-green-400 text-gray-950 font-bold' : 'bg-gray-800 text-gray-400 hover:text-white')
                }
              >{s}</button>
            );
          })}
        </div>
      )}

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-max">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-800/30">
                <th className="text-left px-4 py-3 text-gray-500 text-xs font-mono">COMPANY</th>
                <SortHeader col="price"  label="PRICE"   />
                <SortHeader col="chg1d"  label="1D %"    />
                <SortHeader col="chg1w"  label="1W %"    />
                <SortHeader col="chg1m"  label="1M %"    />
                <SortHeader col="mcap"   label="MCAP Cr" />
                <SortHeader col="pe"     label="P/E"     />
                <SortHeader col="pb"     label="P/B"     />
                <SortHeader col="roe"    label="ROE %"   />
                <SortHeader col="div"    label="DIV %"   />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="10" className="text-center text-gray-500 text-sm font-mono py-12">
                    No stocks match your filters.
                    <button onClick={function() { setSector('All'); setPeMax(''); setRoeMin(''); setDivMin(''); setChgFilter(''); setSearch(''); setPreset(null); }}
                      className="ml-2 text-green-400 hover:underline"
                    >Reset</button>
                  </td>
                </tr>
              ) : filtered.map(function(s, i) {
                return (
                  <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="font-mono font-bold text-white text-sm">{s.symbol}</div>
                          <div className="text-gray-500 text-xs">{s.name}</div>
                        </div>
                        <span className="bg-gray-800 text-gray-500 text-xs font-mono px-1.5 py-0.5 rounded">{s.sector}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-white text-sm">
                      ₹{s.price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-3 py-3 text-right"><ChgCell v={s.chg1d} /></td>
                    <td className="px-3 py-3 text-right"><ChgCell v={s.chg1w} /></td>
                    <td className="px-3 py-3 text-right"><ChgCell v={s.chg1m} /></td>
                    <td className="px-3 py-3 text-right font-mono text-gray-400 text-xs">
                      {(s.mcap / 1000).toFixed(0)}K
                    </td>
                    <td className={'px-3 py-3 text-right font-mono text-xs ' + (s.pe < 15 ? 'text-green-400' : s.pe > 50 ? 'text-amber-400' : 'text-gray-300')}>
                      {s.pe.toFixed(1)}
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-gray-300 text-xs">{s.pb.toFixed(1)}</td>
                    <td className={'px-3 py-3 text-right font-mono text-xs font-bold ' + (s.roe > 20 ? 'text-green-400' : 'text-gray-400')}>
                      {s.roe.toFixed(1)}%
                    </td>
                    <td className={'px-3 py-3 text-right font-mono text-xs ' + (s.div > 2 ? 'text-amber-400' : 'text-gray-400')}>
                      {s.div.toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-gray-800 flex items-center justify-between">
          <span className="text-gray-600 text-xs font-mono">{filtered.length} of {STOCKS.length} stocks shown</span>
          <span className="text-gray-600 text-xs font-mono">Click column headers to sort</span>
        </div>
      </div>
    </div>
  );
}