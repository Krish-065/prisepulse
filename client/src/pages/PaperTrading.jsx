import React, { useState } from 'react';
import { useFetchData } from '../hooks/useFetchData';
import LoadingState from '../components/LoadingState';
import { formatCurrency, formatPercentage } from '../utils/formatters';

export default function PaperTrading() {
  const { data: account, loading } = useFetchData(
    `${process.env.REACT_APP_API_URL}/trading/account`
  );
  const [formData, setFormData] = useState({ symbol: '', quantity: '', price: '', type: 'BUY' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePlaceTrade = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/trading/trades`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        alert('Trade placed successfully!');
        setFormData({ symbol: '', quantity: '', price: '', type: 'BUY' });
      }
    } catch (err) {
      alert('Error placing trade: ' + err.message);
    }
  };

  if (loading) return <LoadingState />;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-4xl font-bold mb-8">Paper Trading</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Account Status */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-4">Account Status</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-blue-50 rounded">
              <span className="text-gray-700">Available Balance</span>
              <span className="text-2xl font-bold text-blue-600">{formatCurrency(account?.currentBalance)}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-green-50 rounded">
              <span className="text-gray-700">Total Invested</span>
              <span className="text-2xl font-bold text-green-600">{formatCurrency(account?.investedAmount)}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-purple-50 rounded">
              <span className="text-gray-700">Total Profit/Loss</span>
              <span className={`text-2xl font-bold ${account?.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(account?.totalProfit)}
              </span>
            </div>
            <div className="flex justify-between items-center p-4 bg-gray-100 rounded">
              <span className="text-gray-700">Win Rate</span>
              <span className="text-2xl font-bold text-gray-800">{account?.winRate?.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* Place Trade */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-4">Place Trade</h2>
          <form onSubmit={handlePlaceTrade} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Symbol</label>
              <input
                type="text"
                name="symbol"
                value={formData.symbol}
                onChange={handleChange}
                placeholder="e.g., TCS"
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Type</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="BUY">BUY</option>
                  <option value="SELL">SELL</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Quantity</label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  placeholder="Units"
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Price</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                placeholder="Entry Price"
                className="w-full border rounded px-3 py-2"
                step="0.01"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 font-semibold"
            >
              Place Trade
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
