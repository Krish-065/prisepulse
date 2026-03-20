const mongoose = require('mongoose');

const holdingSchema = {
  symbol:   { type: String, required: true },
  name:     { type: String },
  type:     { type: String, enum: ['stock', 'crypto', 'commodity'], default: 'stock' },
  quantity: { type: Number, required: true },
  buyPrice: { type: Number, required: true },
  buyDate:  { type: Date, default: Date.now }
};

const PortfolioSchema = new mongoose.Schema({
  user:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  holdings: [holdingSchema]
});

module.exports = mongoose.model('Portfolio', PortfolioSchema);