const mongoose = require('mongoose');

const chatHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    sessionId: {
      type: String,
      required: true
    },
    messages: [
      {
        role: {
          type: String,
          enum: ['user', 'assistant'],
          required: true
        },
        content: {
          type: String,
          required: true
        },
        timestamp: {
          type: Date,
          default: Date.now
        },
        context: {
          symbol: String,
          timeframe: String,
          dataType: String
        }
      }
    ],
    title: String,
    category: {
      type: String,
      enum: ['stocks', 'crypto', 'markets', 'analysis', 'portfolio'],
      default: 'analysis'
    },
    isArchived: {
      type: Boolean,
      default: false
    },
    isPinned: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days
    }
  },
  { timestamps: true }
);

chatHistorySchema.index({ userId: 1, createdAt: -1 });
chatHistorySchema.index({ userId: 1, isPinned: 1 });
chatHistorySchema.ttl(0); // Use expiresAt for TTL

module.exports = mongoose.model('ChatHistory', chatHistorySchema);
