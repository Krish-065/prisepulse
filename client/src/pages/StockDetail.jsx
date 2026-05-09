import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import AdvancedChart from '../components/AdvancedChart';

export default function StockDetail() {
  const { symbol } = useParams();
  const displaySymbol = symbol || 'RELIANCE.NS';
  const [isWatchlisted, setIsWatchlisted] = useState(false);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-extrabold text-foreground">{displaySymbol}</h1>
            <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2.5 py-1 rounded-md text-xs font-medium border border-gray-200 dark:border-gray-700">NSE</span>
          </div>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Reliance Industries Ltd.</p>
        </div>

        <div className="flex flex-col items-start md:items-end">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-foreground">₹2,845.60</span>
            <span className="text-primary font-semibold flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              +34.20 (+1.22%)
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">As of {new Date().toLocaleTimeString()} IST. Market Open</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mb-8">
        <button className="flex-1 md:flex-none bg-primary hover:bg-emerald-500 text-white font-bold py-2.5 px-8 rounded-lg shadow-lg shadow-primary/20 transition-all transform hover:-translate-y-0.5">
          BUY
        </button>
        <button className="flex-1 md:flex-none bg-red-500 hover:bg-red-400 text-white font-bold py-2.5 px-8 rounded-lg shadow-lg shadow-red-500/20 transition-all transform hover:-translate-y-0.5">
          SELL
        </button>
        <button 
          onClick={() => setIsWatchlisted(!isWatchlisted)}
          className={`flex-1 md:flex-none py-2.5 px-6 rounded-lg font-bold transition-all border ${
            isWatchlisted 
            ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-400 text-yellow-600 dark:text-yellow-500' 
            : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
          }`}
        >
          {isWatchlisted ? '★ Watchlisted' : '☆ Add to Watchlist'}
        </button>
      </div>

      {/* Chart Section */}
      <div className="mb-8">
        <AdvancedChart />
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Open', value: '2,810.00' },
          { label: 'High', value: '2,852.00' },
          { label: 'Low', value: '2,805.50' },
          { label: 'Prev Close', value: '2,811.40' },
          { label: '52W High', value: '3,024.90' },
          { label: '52W Low', value: '2,220.30' },
          { label: 'Volume', value: '4.2M' },
          { label: 'Mkt Cap', value: '19.2T' },
        ].map((metric, i) => (
          <div key={i} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 flex flex-col justify-center">
            <span className="text-gray-500 dark:text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">{metric.label}</span>
            <span className="text-foreground font-bold text-lg">{metric.value}</span>
          </div>
        ))}
      </div>

      {/* Details Tabs */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="flex border-b border-gray-200 dark:border-gray-800 overflow-x-auto">
          {['Overview', 'Financials', 'Peers', 'News', 'AI Analysis'].map((tab, i) => (
            <button key={tab} className={`px-6 py-4 font-medium text-sm whitespace-nowrap ${i === 0 ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
              {tab}
            </button>
          ))}
        </div>
        <div className="p-6">
          <h3 className="text-lg font-bold text-foreground mb-4">Company Overview</h3>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
            Reliance Industries Limited is an Indian multinational conglomerate company, headquartered in Mumbai. It has diverse businesses including energy, petrochemicals, natural gas, retail, telecommunications, mass media, and textiles. Reliance is one of the most profitable companies in India and the largest publicly traded company in India by market capitalization.
          </p>
        </div>
      </div>
    </div>
  );
}
