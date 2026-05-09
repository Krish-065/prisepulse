import React, { useState } from 'react';

export default function PriceAlerts() {
  const [alerts, setAlerts] = useState([
    { id: 1, symbol: 'RELIANCE', type: 'above', targetPrice: 2900, active: true },
    { id: 2, symbol: 'TCS', type: 'below', targetPrice: 3800, active: false }
  ]);

  const [isFormOpen, setIsFormOpen] = useState(false);

  const toggleAlert = (id) => {
    setAlerts(alerts.map(a => a.id === id ? { ...a, active: !a.active } : a));
  };

  const deleteAlert = (id) => {
    setAlerts(alerts.filter(a => a.id !== id));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight mb-2">Price Alerts</h1>
          <p className="text-gray-500 dark:text-gray-400">Get notified when stocks hit your target prices.</p>
        </div>
        <button 
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="bg-primary hover:bg-emerald-500 text-white font-bold py-2.5 px-6 rounded-lg shadow-lg shadow-primary/20 transition-all transform hover:-translate-y-0.5"
        >
          {isFormOpen ? 'Cancel' : '+ New Alert'}
        </button>
      </div>

      {isFormOpen && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 mb-8 shadow-sm">
          <h2 className="text-xl font-bold text-foreground mb-4">Create New Alert</h2>
          <form className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Symbol</label>
              <input type="text" placeholder="e.g. INF" className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-foreground px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Condition</label>
              <select className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-foreground px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="above">Goes Above</option>
                <option value="below">Goes Below</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Target Price</label>
              <input type="number" placeholder="₹0.00" className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-foreground px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <button type="button" onClick={() => setIsFormOpen(false)} className="w-full bg-foreground text-background font-bold py-2 rounded-lg hover:opacity-90 transition-opacity">
              Save Alert
            </button>
          </form>
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        {alerts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No active alerts found. Create one above!</div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-800">
            {alerts.map(alert => (
              <li key={alert.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white ${alert.active ? 'bg-primary' : 'bg-gray-400 dark:bg-gray-600'}`}>
                    {alert.symbol.substring(0, 1)}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-foreground">{alert.symbol}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Alert me when price is <strong className={alert.type === 'above' ? 'text-green-500' : 'text-red-500'}>{alert.type}</strong> ₹{alert.targetPrice}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => toggleAlert(alert.id)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                      alert.active 
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400' 
                      : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500'
                    }`}
                  >
                    {alert.active ? 'Active' : 'Paused'}
                  </button>
                  <button onClick={() => deleteAlert(alert.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
