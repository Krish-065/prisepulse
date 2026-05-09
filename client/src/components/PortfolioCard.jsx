import React from 'react';
import { formatCurrency, formatPercentage, calculateReturn } from '../utils/formatters';
import { FaTrash } from 'react-icons/fa';

export const PortfolioCard = ({ holding, onDelete, onEdit }) => {
  const currentValue = holding.quantity * holding.currentPrice;
  const invested = holding.quantity * holding.price;
  const gain = currentValue - invested;
  const gainPercent = calculateReturn(invested, currentValue);

  return (
    <div className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-bold text-lg">{holding.symbol}</h3>
          <p className="text-gray-600 text-sm">{holding.quantity} units</p>
        </div>
        <button
          onClick={() => onDelete(holding.id)}
          className="text-red-500 hover:text-red-700"
        >
          <FaTrash />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm mb-3">
        <div>
          <p className="text-gray-600">Entry Price</p>
          <p className="font-semibold">{formatCurrency(holding.price)}</p>
        </div>
        <div>
          <p className="text-gray-600">Current Price</p>
          <p className="font-semibold">{formatCurrency(holding.currentPrice)}</p>
        </div>
      </div>

      <div className="flex justify-between items-end border-t pt-3">
        <div>
          <p className="text-gray-600 text-sm">Value</p>
          <p className="font-bold">{formatCurrency(currentValue)}</p>
        </div>
        <div className={`text-right ${gain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          <p className="text-sm">{gain >= 0 ? 'Gain' : 'Loss'}</p>
          <p className="font-bold">{formatCurrency(gain)}</p>
          <p className="text-xs">{formatPercentage(gainPercent)}</p>
        </div>
      </div>
    </div>
  );
};

export default PortfolioCard;
