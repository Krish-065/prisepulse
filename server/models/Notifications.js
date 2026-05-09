const mongoose = require('mongoose');

const notificationsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    type: {
      type: String,
      enum: ['price_alert', 'trade_execution', 'portfolio_update', 'news', 'system'],
      required: true
    },
    title: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    icon: String,
    color: String,
    data: {
      symbol: String,
      price: Number,
      change: Number,
      changePercent: Number,
      link: String
    },
    isRead: {
      type: Boolean,
      default: false
    },
    readAt: Date,
    actionUrl: String,
    expiresAt: Date,
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 2592000 // 30 days
    }
  },
  { timestamps: true }
);

notificationsSchema.index({ userId: 1, isRead: 1 });
notificationsSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationsSchema);
