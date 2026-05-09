import React, { useState } from 'react';
import { useFetchData } from '../hooks/useFetchData';
import LoadingState from '../components/LoadingState';
import { formatCurrency, formatPercentage } from '../utils/formatters';
import { FaPlus, FaMinus } from 'react-icons/fa';

export default function Dashboard() {
  const { data: account, loading: accountLoading } = useFetchData(
    `${process.env.REACT_APP_API_URL}/trading/account`
  );
  const { data: trades, loading: tradesLoading } = useFetchData(
    `${process.env.REACT_APP_API_URL}/trading/trades`
  );

  if (accountLoading || tradesLoading) return <LoadingState />;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-4xl font-bold mb-8">Dashboard</h1>

      {/* Account Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-lg shadow-lg">
          <p className="text-sm opacity-80">Balance</p>
          <p className="text-3xl font-bold">{formatCurrency(account?.currentBalance)}</p>
          <p className="text-xs mt-2 opacity-60">Initial: {formatCurrency(account?.initialBalance)}</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-lg shadow-lg">
          <p className="text-sm opacity-80">Total Profit</p>
          <p className="text-3xl font-bold">{formatCurrency(account?.totalProfit)}</p>
          <p className="text-xs mt-2 opacity-60">{formatPercentage(account?.totalProfitPercent)}</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-lg shadow-lg">
          <p className="text-sm opacity-80">Total Trades</p>
          <p className="text-3xl font-bold">{account?.totalTrades}</p>
          <p className="text-xs mt-2 opacity-60">Win Rate: {account?.winRate?.toFixed(1)}%</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-lg shadow-lg">
          <p className="text-sm opacity-80">Max Drawdown</p>
          <p className="text-3xl font-bold">{formatPercentage(account?.maxDrawdown)}</p>
          <p className="text-xs mt-2 opacity-60">Sharpe Ratio: {account?.sharpeRatio?.toFixed(2)}</p>
        </div>
      </div>

      {/* Recent Trades */}
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4">Recent Trades</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b">
              <tr>
                <th className="text-left py-3 px-4">Symbol</th>
                <th className="text-left py-3 px-4">Type</th>
                <th className="text-left py-3 px-4">Qty</th>
                <th className="text-left py-3 px-4">Entry</th>
                <th className="text-left py-3 px-4">Exit</th>
                <th className="text-left py-3 px-4">P&L</th>
                <th className="text-left py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {trades?.trades?.map(trade => (
                <tr key={trade._id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 font-semibold">{trade.symbol}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-sm ${
                      trade.type === 'BUY' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {trade.type}
                    </span>
                  </td>
                  <td className="py-3 px-4">{trade.quantity}</td>
                  <td className="py-3 px-4">{formatCurrency(trade.entryPrice)}</td>
                  <td className="py-3 px-4">{trade.exitPrice ? formatCurrency(trade.exitPrice) : '-'}</td>
                  <td className={`py-3 px-4 font-semibold ${trade.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(trade.profitLoss || 0)}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-xs ${
                      trade.status === 'OPEN' ? 'bg-blue-100 text-blue-800' :
                      trade.status === 'CLOSED' ? 'bg-gray-100 text-gray-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {trade.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
