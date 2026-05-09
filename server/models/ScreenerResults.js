const mongoose = require('mongoose');

const screenerResultsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    screenName: {
      type: String,
      required: true
    },
    criteria: {
      marketCap: {
        min: Number,
        max: Number
      },
      peRatio: {
        min: Number,
        max: Number
      },
      pbRatio: {
        min: Number,
        max: Number
      },
      dividendYield: {
        min: Number,
        max: Number
      },
      priceChange: {
        min: Number,
        max: Number
      },
      volume: {
        min: Number,
        max: Number
      },
      industry: [String],
      sector: [String]
    },
    results: [
      {
        symbol: String,
        name: String,
        currentPrice: Number,
        marketCap: Number,
        peRatio: Number,
        pbRatio: Number,
        dividendYield: Number,
        priceChange: Number,
        priceChangePercent: Number,
        volume: Number,
        avgVolume: Number,
        high52Week: Number,
        low52Week: Number,
        matchScore: Number // 0-100
      }
    ],
    totalMatches: {
      type: Number,
      default: 0
    },
    isSaved: {
      type: Boolean,
      default: false
    },
    isPublic: {
      type: Boolean,
      default: false
    },
    lastRunAt: Date,
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

screenerResultsSchema.index({ userId: 1, isSaved: 1 });
screenerResultsSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('ScreenerResult', screenerResultsSchema);
