import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const socket = io(process.env.REACT_APP_API_URL);
const STOCKS = [
  { sym: 'RELIANCE', name: 'Reliance Industries', price: 2912, chg: '+1.12%', up: true  },
  { sym: 'TCS',      name: 'Tata Consultancy',    price: 3887, chg: '-0.34%', up: false },
  { sym: 'HDFCBANK', name: 'HDFC Bank',            price: 1642, chg: '+0.67%', up: true  },
  { sym: 'INFY',     name: 'Infosys',              price: 1423, chg: '-0.88%', up: false },
  { sym: 'WIPRO',    name: 'Wipro',                price: 452,  chg: '+1.40%', up: true  },
];

function Markets() {
  const [prices, setPrices] = useState({ NIFTY: '22,000', SENSEX: '73,000' });

  useEffect(() => {
    socket.on('price-update', (data) => {
      setPrices({
        NIFTY:  Number(data.NIFTY).toLocaleString('en-IN'),
        SENSEX: Number(data.SENSEX).toLocaleString('en-IN'),
      });
    });
    return () => socket.off('price-update');
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto">

      {/* Live Index Cards */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {[
          { name: 'NIFTY 50',  value: prices.NIFTY,  chg: '+0.83%', up: true  },
          { name: 'SENSEX',    value: prices.SENSEX, chg: '+0.79%', up: true  },
        ].map(idx => (
          <div key={idx.name} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="text-gray-400 text-xs font-mono mb-1">{idx.name}</div>
            <div className="text-white text-2xl font-bold font-mono">₹{idx.value}</div>
            <div className={`text-sm font-mono mt-1 ${idx.up ? 'text-green-400' : 'text-red-400'}`}>
              {idx.chg}
            </div>
          </div>
        ))}
      </div>

      {/* Stocks Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800">
          <h2 className="text-white font-semibold">Top Stocks</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="text-gray-500 text-xs font-mono border-b border-gray-800">
              <th className="text-left px-5 py-3">SYMBOL</th>
              <th className="text-left px-5 py-3">NAME</th>
              <th className="text-right px-5 py-3">PRICE</th>
              <th className="text-right px-5 py-3">CHANGE</th>
            </tr>
          </thead>
          <tbody>
            {STOCKS.map(stock => (
              <tr key={stock.sym} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                <td className="px-5 py-4 font-mono font-bold text-white">{stock.sym}</td>
                <td className="px-5 py-4 text-gray-400 text-sm">{stock.name}</td>
                <td className="px-5 py-4 text-right font-mono text-white">₹{stock.price}</td>
                <td className={`px-5 py-4 text-right font-mono font-bold ${stock.up ? 'text-green-400' : 'text-red-400'}`}>
                  {stock.chg}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}

export default Markets;