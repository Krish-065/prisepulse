import React, { useEffect, useState } from 'react';
import axios from 'axios';

var API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

var TICKER_ITEMS = [
  { sym: '^NSEI',     label: 'NIFTY 50'    },
  { sym: '^BSESN',    label: 'SENSEX'      },
  { sym: '^NSEBANK',  label: 'BANK NIFTY'  },
  { sym: 'NIFTY_IT.NS', label: 'NIFTY IT' },
  { sym: 'RELIANCE.NS', label: 'RELIANCE'  },
  { sym: 'TCS.NS',    label: 'TCS'         },
  { sym: 'HDFCBANK.NS', label: 'HDFC BANK' },
  { sym: 'INFY.NS',   label: 'INFOSYS'     },
  { sym: 'ICICIBANK.NS', label: 'ICICI BK' },
  { sym: 'SBIN.NS',   label: 'SBI'         },
];

export default function TickerTape() {
  var [items, setItems] = useState(
    TICKER_ITEMS.map(function(t) { return { ...t, price: null, change: null }; })
  );

  var fetchPrices = function() {
    var syms = TICKER_ITEMS.map(function(t) { return t.sym; }).join(',');
    axios.get(
      'https://query1.finance.yahoo.com/v8/finance/quote?symbols=' + encodeURIComponent(syms),
      { timeout: 8000, headers: { Accept: 'application/json' } }
    ).then(function(res) {
      var quotes = (res.data && res.data.quoteResponse && res.data.quoteResponse.result) || [];
      setItems(function(prev) {
        return prev.map(function(item) {
          var q = quotes.find(function(x) { return x.symbol === item.sym; });
          if (!q) return item;
          return {
            ...item,
            price:  q.regularMarketPrice,
            change: q.regularMarketChangePercent,
          };
        });
      });
    }).catch(function() {});
  };

  useEffect(function() {
    fetchPrices();
    var t = setInterval(fetchPrices, 30000);
    return function() { clearInterval(t); };
  }, []);

  var displayItems = [...items, ...items];

  return (
    <div className="bg-gray-950 border-b border-gray-800 overflow-hidden h-8 flex items-center">
      <div className="ticker-scroll flex gap-0 whitespace-nowrap">
        {displayItems.map(function(item, i) {
          var up = (item.change || 0) >= 0;
          return (
            <span key={i} className="inline-flex items-center gap-2 px-4 border-r border-gray-800/60 text-xs font-mono">
              <span className="text-gray-400">{item.label}</span>
              {item.price != null ? (
                <>
                  <span className="text-white font-semibold">
                    {item.price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </span>
                  <span className={up ? 'text-green-400' : 'text-red-400'}>
                    {up ? '▲' : '▼'} {Math.abs(item.change).toFixed(2)}%
                  </span>
                </>
              ) : (
                <span className="text-gray-700">---</span>
              )}
            </span>
          );
        })}
      </div>
      <style>{`
        .ticker-scroll {
          animation: ticker 60s linear infinite;
        }
        .ticker-scroll:hover {
          animation-play-state: paused;
        }
        @keyframes ticker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}