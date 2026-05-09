const mongoose = require('mongoose');

const tradeHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    symbol: {
      type: String,
      required: true,
      uppercase: true
    },
    type: {
      type: String,
      enum: ['BUY', 'SELL'],
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 0
    },
    entryPrice: {
      type: Number,
      required: true,
      min: 0
    },
    exitPrice: Number,
    stopLoss: Number,
    targetProfit: Number,
    tradeValue: Number, // Quantity * EntryPrice
    profitLoss: Number,
    profitLossPercent: Number,
    status: {
      type: String,
      enum: ['OPEN', 'CLOSED', 'PENDING'],
      default: 'OPEN'
    },
    entryTime: {
      type: Date,
      default: Date.now
    },
    exitTime: Date,
    duration: String, // Human readable duration
    fees: {
      brokerage: { type: Number, default: 0 },
      tax: { type: Number, default: 0 },
      other: { type: Number, default: 0 }
    },
    notes: String,
    tags: [String],
    isPaperTrade: {
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

tradeHistorySchema.index({ userId: 1, symbol: 1 });
tradeHistorySchema.index({ userId: 1, status: 1 });
tradeHistorySchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('TradeHistory', tradeHistorySchema);
