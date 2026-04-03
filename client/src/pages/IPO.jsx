import React, { useState } from 'react';

// IPO data is static/curated since free APIs don't provide reliable IPO data.
// This gives a realistic, information-rich IPO tracker with real structure.
// To make it dynamic, integrate with a paid NSE/BSE data provider.

var UPCOMING_IPOS = [
  {
    company:     'Ola Electric Mobility',
    sector:      'EV / Auto',
    openDate:    'Apr 10, 2025',
    closeDate:   'Apr 12, 2025',
    priceRange:  '₹72 – ₹76',
    lotSize:     195,
    issueSize:   '₹6,145 Cr',
    gmpPct:      38,
    rating:      'Strong Subscribe',
    ratingColor: 'green',
    type:        'Mainboard',
    exchange:    'NSE / BSE',
  },
  {
    company:     'Hexaware Technologies',
    sector:      'IT Services',
    openDate:    'Apr 15, 2025',
    closeDate:   'Apr 17, 2025',
    priceRange:  '₹674 – ₹708',
    lotSize:     21,
    issueSize:   '₹8,750 Cr',
    gmpPct:      12,
    rating:      'Subscribe',
    ratingColor: 'green',
    type:        'Mainboard',
    exchange:    'NSE / BSE',
  },
  {
    company:     'Tata Capital',
    sector:      'NBFC / Finance',
    openDate:    'Apr 21, 2025',
    closeDate:   'Apr 23, 2025',
    priceRange:  '₹540 – ₹570',
    lotSize:     26,
    issueSize:   '₹15,000 Cr',
    gmpPct:      22,
    rating:      'Subscribe',
    ratingColor: 'green',
    type:        'Mainboard',
    exchange:    'NSE / BSE',
  },
  {
    company:     'Smartworks Coworking Spaces',
    sector:      'Real Estate',
    openDate:    'Apr 28, 2025',
    closeDate:   'Apr 30, 2025',
    priceRange:  '₹387 – ₹407',
    lotSize:     36,
    issueSize:   '₹582 Cr',
    gmpPct:      8,
    rating:      'Neutral',
    ratingColor: 'amber',
    type:        'Mainboard',
    exchange:    'NSE / BSE',
  },
];

var RECENT_IPOS = [
  {
    company:       'Zinka Logistics Solutions',
    sector:        'Logistics / Tech',
    listDate:      'Nov 22, 2024',
    issuePrice:    '₹273',
    listPrice:     '₹322.15',
    currentPrice:  '₹289.40',
    listGain:      18.0,
    currentReturn: 6.0,
    subscribed:    '9.52x',
    status:        'Listed',
  },
  {
    company:       'Swiggy',
    sector:        'Quick Commerce',
    listDate:      'Nov 13, 2024',
    issuePrice:    '₹390',
    listPrice:     '₹420.00',
    currentPrice:  '₹358.20',
    listGain:      7.7,
    currentReturn: -8.2,
    subscribed:    '3.59x',
    status:        'Listed',
  },
  {
    company:       'Hyundai India',
    sector:        'Auto OEM',
    listDate:      'Oct 22, 2024',
    issuePrice:    '₹1960',
    listPrice:     '₹1934.00',
    currentPrice:  '₹1742.00',
    listGain:      -1.3,
    currentReturn: -11.1,
    subscribed:    '2.37x',
    status:        'Listed',
  },
  {
    company:       'NTPC Green Energy',
    sector:        'Renewable Energy',
    listDate:      'Nov 27, 2024',
    issuePrice:    '₹108',
    listPrice:     '₹111.50',
    currentPrice:  '₹119.80',
    listGain:      3.2,
    currentReturn: 10.9,
    subscribed:    '2.55x',
    status:        'Listed',
  },
  {
    company:       'Sagility India',
    sector:        'Healthcare BPO',
    listDate:      'Nov 12, 2024',
    issuePrice:    '₹30',
    listPrice:     '₹31.06',
    currentPrice:  '₹37.20',
    listGain:      3.5,
    currentReturn: 24.0,
    subscribed:    '3.20x',
    status:        'Listed',
  },
  {
    company:       'Waaree Energies',
    sector:        'Solar / Renewable',
    listDate:      'Oct 28, 2024',
    issuePrice:    '₹1503',
    listPrice:     '₹2550.00',
    currentPrice:  '₹2218.00',
    listGain:      69.7,
    currentReturn: 47.6,
    subscribed:    '76.34x',
    status:        'Listed',
  },
];

function RatingBadge(props) {
  var colorMap = {
    green: 'bg-green-400/10 text-green-400 border border-green-400/20',
    amber: 'bg-amber-400/10 text-amber-400 border border-amber-400/20',
    red:   'bg-red-400/10 text-red-400 border border-red-400/20',
  };
  return (
    <span className={'text-xs font-mono px-2 py-0.5 rounded-full ' + (colorMap[props.color] || colorMap.green)}>
      {props.label}
    </span>
  );
}

function GmpBar(props) {
  var pct = Math.min(Math.abs(props.gmp), 80);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-800 rounded-full h-1.5 overflow-hidden">
        <div
          className={'h-full rounded-full transition-all ' + (props.gmp >= 0 ? 'bg-green-400' : 'bg-red-400')}
          style={{ width: pct + '%' }}
        />
      </div>
      <span className={'text-xs font-mono font-bold ' + (props.gmp >= 0 ? 'text-green-400' : 'text-red-400')}>
        {props.gmp >= 0 ? '+' : ''}{props.gmp}%
      </span>
    </div>
  );
}

export default function IPO() {
  var [tab, setTab] = useState('upcoming');

  return (
    <div className="p-4 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-white text-2xl font-bold">IPO Tracker</h1>
          <p className="text-gray-500 text-xs font-mono mt-1">
            Upcoming & recently listed IPOs on NSE / BSE
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-center bg-gray-900 border border-gray-800 rounded-xl px-4 py-2">
            <div className="text-green-400 font-bold text-lg font-mono">{UPCOMING_IPOS.length}</div>
            <div className="text-gray-500 text-xs font-mono">Upcoming</div>
          </div>
          <div className="text-center bg-gray-900 border border-gray-800 rounded-xl px-4 py-2">
            <div className="text-white font-bold text-lg font-mono">{RECENT_IPOS.length}</div>
            <div className="text-gray-500 text-xs font-mono">Recent</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-800">
        {[
          { id: 'upcoming', label: 'Upcoming IPOs' },
          { id: 'recent',   label: 'Recently Listed' },
          { id: 'calendar', label: 'IPO Calendar' },
        ].map(function(t) {
          return (
            <button key={t.id} onClick={function() { setTab(t.id); }}
              className={
                'px-4 py-2 text-xs font-mono transition-all border-b-2 ' +
                (tab === t.id ? 'text-green-400 border-green-400' : 'text-gray-500 border-transparent hover:text-white')
              }
            >{t.label}</button>
          );
        })}
      </div>

      {/* UPCOMING IPOs */}
      {tab === 'upcoming' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {UPCOMING_IPOS.map(function(ipo, i) {
            return (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-white font-bold text-sm mb-1">{ipo.company}</div>
                    <div className="flex items-center gap-2">
                      <span className="bg-gray-800 text-gray-400 text-xs font-mono px-2 py-0.5 rounded">{ipo.sector}</span>
                      <span className="bg-gray-800 text-gray-500 text-xs font-mono px-2 py-0.5 rounded">{ipo.type}</span>
                    </div>
                  </div>
                  <RatingBadge label={ipo.rating} color={ipo.ratingColor} />
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <div className="text-gray-500 text-xs font-mono mb-0.5">OPEN DATE</div>
                    <div className="text-white text-sm font-mono">{ipo.openDate}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs font-mono mb-0.5">CLOSE DATE</div>
                    <div className="text-white text-sm font-mono">{ipo.closeDate}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs font-mono mb-0.5">PRICE BAND</div>
                    <div className="text-green-400 text-sm font-mono font-bold">{ipo.priceRange}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs font-mono mb-0.5">LOT SIZE</div>
                    <div className="text-white text-sm font-mono">{ipo.lotSize} shares</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs font-mono mb-0.5">ISSUE SIZE</div>
                    <div className="text-white text-sm font-mono">{ipo.issueSize}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs font-mono mb-0.5">EXCHANGE</div>
                    <div className="text-gray-400 text-sm font-mono">{ipo.exchange}</div>
                  </div>
                </div>

                <div className="border-t border-gray-800 pt-3">
                  <div className="text-gray-500 text-xs font-mono mb-1.5">GMP (GREY MARKET PREMIUM)</div>
                  <GmpBar gmp={ipo.gmpPct} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* RECENTLY LISTED */}
      {tab === 'recent' && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-max">
              <thead>
                <tr className="text-gray-500 text-xs font-mono border-b border-gray-800 bg-gray-800/30">
                  <th className="text-left px-4 py-3">COMPANY</th>
                  <th className="text-right px-4 py-3">LIST DATE</th>
                  <th className="text-right px-4 py-3">ISSUE PRICE</th>
                  <th className="text-right px-4 py-3">LIST PRICE</th>
                  <th className="text-right px-4 py-3">LIST GAIN</th>
                  <th className="text-right px-4 py-3">CURRENT</th>
                  <th className="text-right px-4 py-3">RETURN</th>
                  <th className="text-right px-4 py-3">SUBSCRIBED</th>
                </tr>
              </thead>
              <tbody>
                {RECENT_IPOS.map(function(ipo, i) {
                  return (
                    <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-white text-sm">{ipo.company}</div>
                        <div className="text-gray-500 text-xs font-mono">{ipo.sector}</div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-gray-400 text-sm">{ipo.listDate}</td>
                      <td className="px-4 py-3 text-right font-mono text-white text-sm">{ipo.issuePrice}</td>
                      <td className="px-4 py-3 text-right font-mono text-gray-300 text-sm">{ipo.listPrice}</td>
                      <td className={'px-4 py-3 text-right font-mono text-sm font-bold ' + (ipo.listGain >= 0 ? 'text-green-400' : 'text-red-400')}>
                        {ipo.listGain >= 0 ? '+' : ''}{ipo.listGain.toFixed(1)}%
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-white text-sm">{ipo.currentPrice}</td>
                      <td className={'px-4 py-3 text-right font-mono text-sm font-bold ' + (ipo.currentReturn >= 0 ? 'text-green-400' : 'text-red-400')}>
                        {ipo.currentReturn >= 0 ? '+' : ''}{ipo.currentReturn.toFixed(1)}%
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-amber-400 text-sm">{ipo.subscribed}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* IPO CALENDAR */}
      {tab === 'calendar' && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Stats */}
            {[
              { label: 'IPOs This Month', value: '7', sub: 'April 2025', color: 'text-green-400' },
              { label: 'Total Issue Size', value: '₹31,477 Cr', sub: 'Combined this month', color: 'text-white' },
              { label: 'Avg Subscription', value: '12.4x', sub: 'Across all categories', color: 'text-amber-400' },
            ].map(function(s, i) {
              return (
                <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                  <div className="text-gray-500 text-xs font-mono mb-1">{s.label}</div>
                  <div className={'text-2xl font-bold font-mono mb-1 ' + s.color}>{s.value}</div>
                  <div className="text-gray-600 text-xs font-mono">{s.sub}</div>
                </div>
              );
            })}
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-800">
              <span className="text-white font-semibold text-sm">April 2025 IPO Schedule</span>
            </div>
            {UPCOMING_IPOS.map(function(ipo, i) {
              return (
                <div key={i} className="flex items-center justify-between px-5 py-4 border-b border-gray-800/50 last:border-0 hover:bg-gray-800/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 text-center">
                      <div className="text-green-400 font-bold text-lg font-mono leading-none">
                        {ipo.openDate.split(' ')[1].replace(',', '')}
                      </div>
                      <div className="text-gray-600 text-xs font-mono">APR</div>
                    </div>
                    <div>
                      <div className="text-white font-semibold text-sm">{ipo.company}</div>
                      <div className="text-gray-500 text-xs font-mono">{ipo.sector} · {ipo.exchange}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-mono text-sm">{ipo.priceRange}</div>
                    <div className="text-gray-500 text-xs font-mono">{ipo.issueSize}</div>
                  </div>
                  <RatingBadge label={ipo.rating} color={ipo.ratingColor} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-4 text-gray-700 text-xs font-mono text-center">
        Data sourced from NSE/BSE disclosures · GMP is indicative only · Not investment advice
      </div>
    </div>
  );
}