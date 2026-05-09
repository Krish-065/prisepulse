import React from 'react';
import { useFetchData } from '../hooks/useFetchData';
import LoadingState from '../components/LoadingState';
import { formatCurrency, formatPercentage } from '../utils/formatters';

export default function AIInsights() {
  const { data: insights, loading } = useFetchData(
    `${process.env.REACT_APP_API_URL}/aiInsights/market/trends`
  );

  if (loading) return <LoadingState />;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-4xl font-bold mb-8">AI Market Insights</h1>

      {/* Market Sentiment */}
      <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
        <h2 className="text-2xl font-bold mb-4">Market Sentiment</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-green-100 to-green-200 p-6 rounded-lg">
            <p className="text-gray-700 font-semibold mb-2">Sentiment</p>
            <p className="text-3xl font-bold text-green-700">{insights?.marketSentiment || 'Neutral'}</p>
          </div>
          <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-6 rounded-lg">
            <p className="text-gray-700 font-semibold mb-2">Volatility Index (VIX)</p>
            <p className="text-3xl font-bold text-blue-700">{insights?.volatilityIndex || 20}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-100 to-purple-200 p-6 rounded-lg">
            <p className="text-gray-700 font-semibold mb-2">Market Prediction</p>
            <p className="text-3xl font-bold text-purple-700">{insights?.prediction || 'Neutral'}</p>
          </div>
        </div>
      </div>

      {/* Sector Performance */}
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4">Sector Performance</h2>
        <div className="grid grid-cols-1 gap-4">
          {insights?.sectors?.map(sector => (
            <div key={sector.name} className="flex justify-between items-center p-4 border rounded-lg hover:bg-gray-50">
              <div>
                <p className="font-semibold text-lg">{sector.name}</p>
                <p className={`text-sm ${
                  sector.sentiment === 'Bullish' ? 'text-green-600' :
                  sector.sentiment === 'Bearish' ? 'text-red-600' :
                  'text-gray-600'
                }`}>
                  {sector.sentiment}
                </p>
              </div>
              <div className={`text-2xl font-bold ${sector.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {sector.change > 0 ? '+' : ''}{formatPercentage(sector.change)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
