const mongoose = require('mongoose');

const priceAlertSchema = new mongoose.Schema(
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
      enum: ['above', 'below', 'change'],
      required: true
    },
    targetPrice: {
      type: Number,
      required: true,
      min: 0
    },
    changePercent: {
      type: Number,
      min: 0,
      max: 100
    },
    isActive: {
      type: Boolean,
      default: true
    },
    isTriggered: {
      type: Boolean,
      default: false
    },
    triggeredAt: Date,
    notificationMethods: {
      email: { type: Boolean, default: true },
      inApp: { type: Boolean, default: true },
      sms: { type: Boolean, default: false }
    },
    lastCheckedAt: Date,
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

priceAlertSchema.index({ userId: 1, symbol: 1 });
priceAlertSchema.index({ isActive: 1, isTriggered: 1 });

module.exports = mongoose.model('PriceAlert', priceAlertSchema);
