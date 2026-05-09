import React from 'react';
import { formatCurrency, formatPercentage } from '../utils/formatters';

export const StockCard = ({ symbol, name, price, change, changePercent, onClick }) => {
  const isPositive = change >= 0;

  return (
    <div
      onClick={onClick}
      className="bg-white p-4 rounded-lg shadow hover:shadow-lg cursor-pointer transition"
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-bold text-lg">{symbol}</h3>
          <p className="text-gray-600 text-sm">{name}</p>
        </div>
        <span className={`px-2 py-1 rounded text-sm font-semibold ${
          isPositive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {formatPercentage(changePercent)}
        </span>
      </div>
      
      <div className="flex justify-between items-end">
        <p className="text-xl font-bold">{formatCurrency(price)}</p>
        <p className={`text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {isPositive ? '+' : ''}{formatCurrency(change)}
        </p>
      </div>
    </div>
  );
};

export default StockCard;
