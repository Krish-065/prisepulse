import React, { useState } from 'react';

export default function CompareStocks() {
  const [stocks, setStocks] = useState(['RELIANCE', 'TCS']);
  const [searchInput, setSearchInput] = useState('');

  const addStock = (e) => {
    e.preventDefault();
    if (searchInput && !stocks.includes(searchInput.toUpperCase()) && stocks.length < 4) {
      setStocks([...stocks, searchInput.toUpperCase()]);
      setSearchInput('');
    }
  };

  const removeStock = (stockToRemove) => {
    setStocks(stocks.filter(s => s !== stockToRemove));
  };

  // Mock data for comparison
  const mockData = {
    'RELIANCE': { price: '₹2,845.60', pe: '28.4', marketCap: '19.2T', divYield: '0.35%', roe: '9.2%' },
    'TCS': { price: '₹3,920.10', pe: '31.2', marketCap: '14.5T', divYield: '1.20%', roe: '43.6%' },
    'HDFC': { price: '₹1,530.00', pe: '18.5', marketCap: '11.6T', divYield: '1.05%', roe: '16.4%' },
    'INFY': { price: '₹1,450.25', pe: '24.8', marketCap: '6.1T', divYield: '2.10%', roe: '32.1%' }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight mb-2">Compare Stocks</h1>
        <p className="text-gray-500 dark:text-gray-400">Side-by-side comparison of up to 4 stocks.</p>
      </div>

      {/* Add Stock Bar */}
      <form onSubmit={addStock} className="flex gap-2 mb-8 max-w-xl">
        <input 
          type="text" 
          placeholder="Search symbol (e.g. HDFC)" 
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="flex-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-foreground px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button 
          type="submit" 
          disabled={stocks.length >= 4}
          className="bg-primary text-white font-bold px-6 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-500 transition-colors"
        >
          Add
        </button>
      </form>

      {/* Comparison Matrix */}
      <div className="overflow-x-auto bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
        <table className="w-full text-left border-collapse min-w-max">
          <thead>
            <tr>
              <th className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 font-medium">Metrics</th>
              {stocks.map(stock => (
                <th key={stock} className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-lg text-foreground">{stock}</span>
                    <button onClick={() => removeStock(stock)} className="text-gray-400 hover:text-red-500 transition-colors">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </th>
              ))}
              {Array.from({ length: 4 - stocks.length }).map((_, i) => (
                <th key={`empty-${i}`} className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 w-48 text-center text-gray-400 font-normal">
                  Add Stock
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {[
              { key: 'price', label: 'Current Price' },
              { key: 'pe', label: 'P/E Ratio' },
              { key: 'marketCap', label: 'Market Cap' },
              { key: 'divYield', label: 'Dividend Yield' },
              { key: 'roe', label: 'ROE' }
            ].map((metric) => (
              <tr key={metric.key} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
                <td className="p-4 font-medium text-gray-600 dark:text-gray-300">{metric.label}</td>
                {stocks.map(stock => (
                  <td key={`${stock}-${metric.key}`} className="p-4 text-foreground font-semibold">
                    {mockData[stock] ? mockData[stock][metric.key] : 'N/A'}
                  </td>
                ))}
                {Array.from({ length: 4 - stocks.length }).map((_, i) => (
                  <td key={`empty-cell-${i}`} className="p-4 text-gray-300 dark:text-gray-700 text-center">-</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
