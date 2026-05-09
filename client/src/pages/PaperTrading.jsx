import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useFetchData } from '../hooks/useFetchData';
import { FaSpinner } from 'react-icons/fa';

export default function PaperTrading() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = localStorage.getItem('token');
  
  // Get initial symbol from URL query parameter (e.g., from Chart page)
  const initialSymbol = searchParams.get('symbol') || '';

  const { data: account, loading: accountLoading, error: accountError } = useFetchData(
    `${process.env.REACT_APP_API_URL}/trading/account`
  );
  
  const { data: tradesData, loading: tradesLoading } = useFetchData(
    `${process.env.REACT_APP_API_URL}/trading/trades`
  );

  const [formData, setFormData] = useState({ 
    symbol: initialSymbol, 
    quantity: '', 
    price: '', 
    type: 'BUY',
    stopLoss: '',
    targetProfit: ''
  });

  const [isPlacingTrade, setIsPlacingTrade] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate('/login');
    }
  }, [token, navigate]);

  const formatCurrency = (value) => {
    if (value === undefined || value === null || isNaN(value)) return '₹0.00';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePlaceTrade = async (e) => {
    e.preventDefault();
    setIsPlacingTrade(true);
    try {
      const payload = {
        symbol: formData.symbol,
        type: formData.type,
        quantity: Number(formData.quantity),
        entryPrice: Number(formData.price),
        stopLoss: formData.stopLoss ? Number(formData.stopLoss) : undefined,
        targetProfit: formData.targetProfit ? Number(formData.targetProfit) : undefined
      };

      const response = await fetch(`${process.env.REACT_APP_API_URL}/trading/trades`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      const result = await response.json();
      
      if (response.ok) {
        alert('Trade placed successfully!');
        setFormData({ symbol: '', quantity: '', price: '', type: 'BUY', stopLoss: '', targetProfit: '' });
        // In a real app, we would invalidate the SWR/React-Query cache here to refresh the data
        window.location.reload(); 
      } else {
        alert('Error: ' + result.error);
      }
    } catch (err) {
      alert('Error placing trade: ' + err.message);
    } finally {
      setIsPlacingTrade(false);
    }
  };

  if (accountLoading || tradesLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <FaSpinner className="w-8 h-8 text-primary animate-spin" />
        <p className="mt-4 text-foreground">Loading trading data...</p>
      </div>
    );
  }

  if (accountError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-red-500">
        Failed to load account data. Please try again.
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight mb-2">Paper Trading</h1>
        <p className="text-gray-500 dark:text-gray-400">Practice your trading strategies with real market data without risking real money.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Account Status */}
        <div className="lg:col-span-1 bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-bold mb-6 text-foreground">Account Status</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-primary/10 rounded-xl">
              <span className="text-primary font-medium">Available Balance</span>
              <span className="text-2xl font-extrabold text-primary">{formatCurrency(account?.currentBalance)}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <span className="text-gray-700 dark:text-gray-300">Total Invested</span>
              <span className="text-xl font-bold text-foreground">{formatCurrency(account?.investedAmount)}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <span className="text-gray-700 dark:text-gray-300">Total Profit/Loss</span>
              <span className={`text-xl font-bold ${account?.totalProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {account?.totalProfit > 0 ? '+' : ''}{formatCurrency(account?.totalProfit)}
              </span>
            </div>
            <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <span className="text-gray-700 dark:text-gray-300">Win Rate</span>
              <span className="text-xl font-bold text-foreground">{account?.winRate?.toFixed(1) || 0}%</span>
            </div>
          </div>
        </div>

        {/* Place Trade */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-bold mb-6 text-foreground">Execute Trade</h2>
          <form onSubmit={handlePlaceTrade} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Symbol / Ticker</label>
                <input
                  type="text"
                  name="symbol"
                  value={formData.symbol}
                  onChange={handleChange}
                  placeholder="e.g., RELIANCE.NS"
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-foreground px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Trade Type</label>
                <div className="flex gap-4">
                  <label className={`flex-1 flex justify-center items-center py-3 rounded-xl cursor-pointer font-bold border-2 transition-all ${formData.type === 'BUY' ? 'border-primary bg-primary/10 text-primary' : 'border-gray-200 dark:border-gray-700 text-gray-400 hover:border-gray-300'}`}>
                    <input type="radio" name="type" value="BUY" checked={formData.type === 'BUY'} onChange={handleChange} className="hidden" />
                    BUY (Long)
                  </label>
                  <label className={`flex-1 flex justify-center items-center py-3 rounded-xl cursor-pointer font-bold border-2 transition-all ${formData.type === 'SELL' ? 'border-red-500 bg-red-500/10 text-red-500' : 'border-gray-200 dark:border-gray-700 text-gray-400 hover:border-gray-300'}`}>
                    <input type="radio" name="type" value="SELL" checked={formData.type === 'SELL'} onChange={handleChange} className="hidden" />
                    SELL (Short)
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Quantity (Units)</label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  placeholder="10"
                  min="1"
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-foreground px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Entry Price (₹)</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="2800.50"
                  step="0.05"
                  min="0"
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-foreground px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Target Profit (₹) <span className="text-xs text-gray-400 font-normal">(Optional)</span></label>
                <input
                  type="number"
                  name="targetProfit"
                  value={formData.targetProfit}
                  onChange={handleChange}
                  placeholder="2900.00"
                  step="0.05"
                  min="0"
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-green-700/50 text-foreground px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Stop Loss (₹) <span className="text-xs text-gray-400 font-normal">(Optional)</span></label>
                <input
                  type="number"
                  name="stopLoss"
                  value={formData.stopLoss}
                  onChange={handleChange}
                  placeholder="2750.00"
                  step="0.05"
                  min="0"
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-red-700/50 text-foreground px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
              <button
                type="submit"
                disabled={isPlacingTrade}
                className="w-full bg-primary hover:bg-emerald-500 text-white py-4 px-4 rounded-xl font-bold text-lg shadow-lg shadow-primary/20 transition-all transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isPlacingTrade ? <FaSpinner className="inline w-5 h-5 animate-spin" /> : `Execute ${formData.type} Order`}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Trade History */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">
        <h2 className="text-xl font-bold mb-6 text-foreground">Trade History</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="p-4 border-b border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 font-medium">Date</th>
                <th className="p-4 border-b border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 font-medium">Symbol</th>
                <th className="p-4 border-b border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 font-medium">Type</th>
                <th className="p-4 border-b border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 font-medium">Qty</th>
                <th className="p-4 border-b border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 font-medium">Entry</th>
                <th className="p-4 border-b border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 font-medium">TP / SL</th>
                <th className="p-4 border-b border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 font-medium">Status</th>
                <th className="p-4 border-b border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 font-medium">P&L</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {tradesData?.trades?.length > 0 ? tradesData.trades.map(trade => (
                <tr key={trade._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="p-4 text-sm text-gray-600 dark:text-gray-300">{new Date(trade.entryTime).toLocaleDateString()}</td>
                  <td className="p-4 font-bold text-foreground">{trade.symbol}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${trade.type === 'BUY' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                      {trade.type}
                    </span>
                  </td>
                  <td className="p-4 text-foreground font-medium">{trade.quantity}</td>
                  <td className="p-4 text-foreground">{formatCurrency(trade.entryPrice)}</td>
                  <td className="p-4 text-xs text-gray-500 dark:text-gray-400">
                    <div className="text-green-500">{trade.targetProfit ? formatCurrency(trade.targetProfit) : '-'}</div>
                    <div className="text-red-500">{trade.stopLoss ? formatCurrency(trade.stopLoss) : '-'}</div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      trade.status === 'OPEN' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 
                      'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                    }`}>
                      {trade.status}
                    </span>
                  </td>
                  <td className={`p-4 font-bold ${trade.profitLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {trade.profitLoss ? formatCurrency(trade.profitLoss) : '-'}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-gray-500 dark:text-gray-400">No trades found. Execute a trade to see your history.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
