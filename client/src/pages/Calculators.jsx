import React, { useState } from 'react';

export default function Calculators() {
  const [activeTab, setActiveTab] = useState('sip');
  
  // SIP Calculator State
  const [monthlyInvestment, setMonthlyInvestment] = useState(5000);
  const [expectedReturn, setExpectedReturn] = useState(12);
  const [timePeriod, setTimePeriod] = useState(10);

  // SIP Calculation logic
  const calculateSIP = () => {
    const P = monthlyInvestment;
    const n = timePeriod * 12;
    const i = expectedReturn / 12 / 100;
    const M = P * ((Math.pow(1 + i, n) - 1) / i) * (1 + i);
    const totalInvestment = P * n;
    const totalReturns = M - totalInvestment;
    return {
      totalInvestment: totalInvestment,
      totalReturns: totalReturns,
      maturityValue: M
    };
  };

  const sipResults = calculateSIP();

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight mb-2">Financial Calculators</h1>
        <p className="text-gray-500 dark:text-gray-400">Plan your investments and reach your financial goals.</p>
      </div>

      <div className="flex gap-4 mb-8 border-b border-gray-200 dark:border-gray-800 pb-2 overflow-x-auto">
        {['sip', 'lumpsum', 'emi'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
              activeTab === tab
                ? 'bg-primary text-white shadow-md shadow-primary/20'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            {tab.toUpperCase()} Calculator
          </button>
        ))}
      </div>

      {activeTab === 'sip' && (
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-bold text-foreground mb-6">SIP Details</h2>
            
            <div className="space-y-8">
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Monthly Investment</label>
                  <span className="font-bold text-primary bg-primary/10 px-2 py-0.5 rounded text-sm">
                    {formatCurrency(monthlyInvestment)}
                  </span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="100000"
                  step="500"
                  value={monthlyInvestment}
                  onChange={(e) => setMonthlyInvestment(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-primary"
                />
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Expected Return Rate (p.a)</label>
                  <span className="font-bold text-primary bg-primary/10 px-2 py-0.5 rounded text-sm">
                    {expectedReturn}%
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="30"
                  step="0.5"
                  value={expectedReturn}
                  onChange={(e) => setExpectedReturn(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-primary"
                />
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Time Period</label>
                  <span className="font-bold text-primary bg-primary/10 px-2 py-0.5 rounded text-sm">
                    {timePeriod} Years
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="40"
                  step="1"
                  value={timePeriod}
                  onChange={(e) => setTimePeriod(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-primary"
                />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-900 to-gray-800 dark:from-black dark:to-gray-900 rounded-2xl p-6 text-white shadow-xl flex flex-col justify-center relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-primary opacity-20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-accent opacity-20 rounded-full blur-3xl"></div>
            
            <h2 className="text-xl font-bold mb-8 z-10">Estimation Results</h2>
            
            <div className="space-y-6 z-10">
              <div className="flex justify-between items-center border-b border-gray-700 pb-4">
                <span className="text-gray-400">Invested Amount</span>
                <span className="text-xl font-semibold">{formatCurrency(sipResults.totalInvestment)}</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-700 pb-4">
                <span className="text-gray-400">Est. Returns</span>
                <span className="text-xl font-semibold text-primary">{formatCurrency(sipResults.totalReturns)}</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-lg font-medium">Total Value</span>
                <span className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400">
                  {formatCurrency(sipResults.maturityValue)}
                </span>
              </div>
            </div>

            <button className="mt-10 w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors font-medium backdrop-blur-sm z-10">
              Invest Now
            </button>
          </div>
        </div>
      )}

      {activeTab !== 'sip' && (
        <div className="p-12 text-center bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-200 dark:border-gray-800">
          <div className="text-5xl mb-4">🛠️</div>
          <h2 className="text-xl font-bold text-foreground mb-2">{activeTab.toUpperCase()} Calculator</h2>
          <p className="text-gray-500 dark:text-gray-400">This calculator is currently under development. Please check back soon.</p>
        </div>
      )}
    </div>
  );
}
