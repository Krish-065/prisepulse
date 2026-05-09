import React, { useState } from 'react';

export default function IPOTracker() {
  const [activeTab, setActiveTab] = useState('upcoming');

  const ipos = {
    upcoming: [
      { name: 'TechVision AI Ltd', date: 'May 15, 2026', priceBand: '₹450 - ₹475', issueSize: '₹1,200 Cr', gmp: '+₹85 (18%)' },
      { name: 'GreenEnergy Solutions', date: 'May 22, 2026', priceBand: '₹120 - ₹128', issueSize: '₹850 Cr', gmp: '+₹15 (11%)' }
    ],
    current: [
      { name: 'FinServe Payments', date: 'Closes May 11, 2026', priceBand: '₹210 - ₹225', issueSize: '₹2,500 Cr', subscription: '4.2x' }
    ],
    past: [
      { name: 'Global Logistics', date: 'Listed May 2, 2026', issuePrice: '₹340', listingPrice: '₹410', currentPrice: '₹425' }
    ]
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight mb-2">IPO Tracker</h1>
        <p className="text-gray-500 dark:text-gray-400">Track upcoming, current, and recently listed Initial Public Offerings.</p>
      </div>

      <div className="flex gap-4 mb-8 border-b border-gray-200 dark:border-gray-800 pb-2">
        {['upcoming', 'current', 'past'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all capitalize ${
              activeTab === tab
                ? 'bg-primary text-white shadow-md shadow-primary/20'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            {tab} IPOs
          </button>
        ))}
      </div>

      <div className="grid gap-6">
        {ipos[activeTab].map((ipo, idx) => (
          <div key={idx} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-gray-100 dark:border-gray-800 pb-4 mb-4">
              <div>
                <h2 className="text-xl font-bold text-foreground mb-1">{ipo.name}</h2>
                <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {ipo.date}
                </span>
              </div>
              {activeTab !== 'past' && (
                <button className="bg-foreground text-background font-bold py-2 px-6 rounded-lg hover:opacity-90 transition-opacity">
                  View Details
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {activeTab === 'past' ? (
                <>
                  <div><p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Issue Price</p><p className="font-semibold text-foreground">{ipo.issuePrice}</p></div>
                  <div><p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Listing Price</p><p className="font-semibold text-foreground">{ipo.listingPrice}</p></div>
                  <div><p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Current Price</p><p className="font-semibold text-primary">{ipo.currentPrice}</p></div>
                </>
              ) : (
                <>
                  <div><p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Price Band</p><p className="font-semibold text-foreground">{ipo.priceBand}</p></div>
                  <div><p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Issue Size</p><p className="font-semibold text-foreground">{ipo.issueSize}</p></div>
                  {ipo.gmp && <div><p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Est. GMP</p><p className="font-semibold text-green-500">{ipo.gmp}</p></div>}
                  {ipo.subscription && <div><p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Subscription</p><p className="font-semibold text-accent">{ipo.subscription}</p></div>}
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
