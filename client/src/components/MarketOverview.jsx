import React from 'react';
import { formatCurrency, formatPercentage } from '../utils/formatters';

export const MarketOverview = ({ markets }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {markets?.map((market) => (
        <div key={market.id} className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
          <h3 className="text-sm font-semibold text-gray-700">{market.name}</h3>
          <p className="text-2xl font-bold mt-2">{market.value}</p>
          <p className={`text-sm mt-2 ${
            market.change >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {market.change >= 0 ? '▲' : '▼'} {formatPercentage(market.change)}
          </p>
        </div>
      ))}
    </div>
  );
};

export default MarketOverview;
