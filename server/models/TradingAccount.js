const mongoose = require('mongoose');

const tradingAccountSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    accountType: {
      type: String,
      enum: ['paper', 'demo', 'live'],
      default: 'paper'
    },
    initialBalance: {
      type: Number,
      default: 100000,
      min: 0
    },
    currentBalance: {
      type: Number,
      default: 100000,
      min: 0
    },
    investedAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    totalProfit: {
      type: Number,
      default: 0
    },
    totalProfitPercent: {
      type: Number,
      default: 0
    },
    totalTrades: {
      type: Number,
      default: 0,
      min: 0
    },
    winningTrades: {
      type: Number,
      default: 0,
      min: 0
    },
    loosingTrades: {
      type: Number,
      default: 0,
      min: 0
    },
    winRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    avgWin: {
      type: Number,
      default: 0
    },
    avgLoss: {
      type: Number,
      default: 0
    },
    maxDrawdown: {
      type: Number,
      default: 0
    },
    sharpeRatio: {
      type: Number,
      default: 0
    },
    positions: [
      {
        symbol: String,
        quantity: Number,
        buyPrice: Number,
        currentPrice: Number,
        marketValue: Number,
        profitLoss: Number,
        profitLossPercent: Number,
        entryTime: Date
      }
    ],
    transactions: [
      {
        type: {
          type: String,
          enum: ['DEPOSIT', 'WITHDRAWAL', 'DIVIDEND', 'INTEREST'],
          required: true
        },
        amount: {
          type: Number,
          required: true
        },
        timestamp: {
          type: Date,
          default: Date.now
        }
      }
    ],
    isActive: {
      type: Boolean,
      default: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

tradingAccountSchema.index({ userId: 1 });

module.exports = mongoose.model('TradingAccount', tradingAccountSchema);
