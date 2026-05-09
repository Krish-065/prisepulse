import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdvancedChart from '../components/AdvancedChart';
import { FaSpinner } from 'react-icons/fa';

export default function StockDetail() {
  const { symbol } = useParams();
  const navigate = useNavigate();
  const displaySymbol = symbol || 'RELIANCE.NS';
  const token = localStorage.getItem('token');
  
  const [isWatchlisted, setIsWatchlisted] = useState(false);
  const [currentPrice, setCurrentPrice] = useState(2800);
  const [priceChange, setPriceChange] = useState(0);
  const [isPlacingTrade, setIsPlacingTrade] = useState(false);
  
  const [tradeForm, setTradeForm] = useState({
    type: 'BUY',
    quantity: '',
    stopLoss: '',
    targetProfit: ''
  });

  // Called by AdvancedChart whenever the simulation engine ticks
  const handlePriceUpdate = (newPrice) => {
    setCurrentPrice(prev => {
      setPriceChange(newPrice - prev);
      return newPrice;
    });
  };

  const handleTradeChange = (e) => {
    const { name, value } = e.target;
    setTradeForm(prev => ({ ...prev, [name]: value }));
  };

  const handleExecuteTrade = async (e) => {
    e.preventDefault();
    if (!token) {
      navigate('/login');
      return;
    }

    setIsPlacingTrade(true);
    try {
      const payload = {
        symbol: displaySymbol,
        type: tradeForm.type,
        quantity: Number(tradeForm.quantity),
        entryPrice: currentPrice,
        stopLoss: tradeForm.stopLoss ? Number(tradeForm.stopLoss) : undefined,
        targetProfit: tradeForm.targetProfit ? Number(tradeForm.targetProfit) : undefined
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
        alert(`Successfully executed ${tradeForm.type} for ${tradeForm.quantity} units of ${displaySymbol}!`);
        setTradeForm({ ...tradeForm, quantity: '', stopLoss: '', targetProfit: '' });
      } else {
        alert('Error: ' + result.error);
      }
    } catch (err) {
      alert('Error placing trade: ' + err.message);
    } finally {
      setIsPlacingTrade(false);
    }
  };

  const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-extrabold text-foreground tracking-tight">{displaySymbol}</h1>
            <span className="bg-primary/10 text-primary px-2.5 py-1 rounded-md text-xs font-bold border border-primary/20">EQ</span>
          </div>
          <p className="text-gray-500 dark:text-gray-400 font-medium text-lg">Market Live Simulation</p>
        </div>

        <div className="flex flex-col items-start md:items-end">
          <div className="flex items-baseline gap-2">
            <span className={`text-4xl font-extrabold ${priceChange > 0 ? 'text-green-500' : priceChange < 0 ? 'text-red-500' : 'text-foreground'}`}>
              {formatCurrency(currentPrice)}
            </span>
            <span className={`font-semibold flex items-center ${priceChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {priceChange >= 0 ? '▲' : '▼'} {Math.abs(priceChange).toFixed(2)}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1 font-medium">Live Market Data Stream</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Chart Section */}
        <div className="lg:col-span-2">
          <AdvancedChart symbol={displaySymbol} onPriceUpdate={handlePriceUpdate} />
        </div>

        {/* Paper Trading Panel */}
        <div className="lg:col-span-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm flex flex-col h-full">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-foreground">Trade Order</h3>
            <button 
              onClick={() => setIsWatchlisted(!isWatchlisted)}
              className={`p-2 rounded-full transition-colors ${isWatchlisted ? 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
            >
              <svg className="w-6 h-6" fill={isWatchlisted ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
            </button>
          </div>

          <form onSubmit={handleExecuteTrade} className="flex flex-col flex-grow">
            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-6">
              <button type="button" onClick={() => setTradeForm({...tradeForm, type: 'BUY'})} className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${tradeForm.type === 'BUY' ? 'bg-white dark:bg-gray-700 text-green-500 shadow-sm' : 'text-gray-500 hover:text-foreground'}`}>BUY</button>
              <button type="button" onClick={() => setTradeForm({...tradeForm, type: 'SELL'})} className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${tradeForm.type === 'SELL' ? 'bg-white dark:bg-gray-700 text-red-500 shadow-sm' : 'text-gray-500 hover:text-foreground'}`}>SELL</button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1.5">Quantity</label>
                <input type="number" name="quantity" value={tradeForm.quantity} onChange={handleTradeChange} placeholder="0" min="1" required className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-foreground font-bold focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1.5">Target Profit</label>
                  <input type="number" name="targetProfit" value={tradeForm.targetProfit} onChange={handleTradeChange} placeholder="Optional" step="0.05" min="0" className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1.5">Stop Loss</label>
                  <input type="number" name="stopLoss" value={tradeForm.stopLoss} onChange={handleTradeChange} placeholder="Optional" step="0.05" min="0" className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                </div>
              </div>
            </div>

            <div className="mt-auto pt-6 border-t border-gray-100 dark:border-gray-800">
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">Margin Required</span>
                <span className="text-foreground font-bold text-lg">{formatCurrency(currentPrice * (Number(tradeForm.quantity) || 0))}</span>
              </div>
              <button type="submit" disabled={isPlacingTrade} className={`w-full py-4 rounded-xl font-bold text-white text-lg transition-all shadow-lg transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed ${tradeForm.type === 'BUY' ? 'bg-green-500 hover:bg-green-600 shadow-green-500/20' : 'bg-red-500 hover:bg-red-600 shadow-red-500/20'}`}>
                {isPlacingTrade ? <FaSpinner className="inline w-5 h-5 animate-spin" /> : `Execute ${tradeForm.type}`}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Open', value: formatCurrency(currentPrice - 34) },
          { label: 'High', value: formatCurrency(currentPrice + 45) },
          { label: 'Low', value: formatCurrency(currentPrice - 60) },
          { label: 'Prev Close', value: formatCurrency(currentPrice - 12) },
          { label: '52W High', value: '₹3,024.90' },
          { label: '52W Low', value: '₹2,220.30' },
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
            This is a real-time simulation view. Reliance Industries Limited is an Indian multinational conglomerate company, headquartered in Mumbai. It has diverse businesses including energy, petrochemicals, natural gas, retail, telecommunications, mass media, and textiles.
          </p>
        </div>
      </div>
    </div>
  );
}
