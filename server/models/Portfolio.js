const mongoose = require('mongoose');
const PortfolioSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  holdings: [{
    symbol:   { type: String, required: true },
    name:     { type: String },
    quantity: { type: Number, required: true },
    buyPrice: { type: Number, required: true },
    buyDate:  { type: Date, default: Date.now }
  }]
});
module.exports = mongoose.model('Portfolio', PortfolioSchema);