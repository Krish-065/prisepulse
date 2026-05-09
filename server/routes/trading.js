const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const TradingAccount = require('../models/TradingAccount');
const TradeHistory = require('../models/TradeHistory');

// GET trading account
router.get('/account', verifyToken, async (req, res) => {
  try {
    let account = await TradingAccount.findOne({ userId: req.user.id });
    
    if (!account) {
      account = new TradingAccount({ userId: req.user.id });
      await account.save();
    }
    
    res.json(account);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET all trades
router.get('/trades', verifyToken, async (req, res) => {
  try {
    const { status, symbol, page = 1, limit = 20 } = req.query;
    let query = { userId: req.user.id };
    
    if (status) query.status = status;
    if (symbol) query.symbol = symbol.toUpperCase();
    
    const trades = await TradeHistory.find(query)
      .sort({ entryTime: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await TradeHistory.countDocuments(query);
    
    res.json({ trades, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PLACE trade (BUY/SELL)
router.post('/trades', verifyToken, async (req, res) => {
  try {
    const { symbol, type, quantity, entryPrice, stopLoss, targetProfit } = req.body;
    const account = await TradingAccount.findOne({ userId: req.user.id });
    
    if (!account) return res.status(404).json({ error: 'Trading account not found' });
    
    const tradeValue = quantity * entryPrice;
    
    if (type === 'BUY' && tradeValue > account.currentBalance) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }
    
    const trade = new TradeHistory({
      userId: req.user.id,
      symbol: symbol.toUpperCase(),
      type,
      quantity,
      entryPrice,
      stopLoss,
      targetProfit,
      tradeValue,
      isPaperTrade: true
    });
    
    await trade.save();
    
    // Update account
    if (type === 'BUY') {
      account.currentBalance -= tradeValue;
      account.investedAmount += tradeValue;
    }
    account.totalTrades += 1;
    await account.save();
    
    res.status(201).json(trade);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// CLOSE trade
router.post('/trades/:id/close', verifyToken, async (req, res) => {
  try {
    const { exitPrice } = req.body;
    const trade = await TradeHistory.findById(req.params.id);
    
    if (!trade) return res.status(404).json({ error: 'Trade not found' });
    
    trade.exitPrice = exitPrice;
    trade.exitTime = new Date();
    trade.status = 'CLOSED';
    trade.profitLoss = (exitPrice - trade.entryPrice) * trade.quantity;
    trade.profitLossPercent = ((exitPrice - trade.entryPrice) / trade.entryPrice) * 100;
    
    await trade.save();
    
    // Update account
    const account = await TradingAccount.findOne({ userId: req.user.id });
    if (account) {
      account.currentBalance += (exitPrice * trade.quantity);
      account.totalProfit += trade.profitLoss;
      
      if (trade.profitLoss > 0) account.winningTrades += 1;
      else account.loosingTrades += 1;
      
      account.totalProfitPercent = (account.totalProfit / account.initialBalance) * 100;
      account.winRate = (account.winningTrades / account.totalTrades) * 100;
      
      await account.save();
    }
    
    res.json(trade);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DEPOSIT funds
router.post('/account/deposit', verifyToken, async (req, res) => {
  try {
    const { amount } = req.body;
    if (amount <= 0) return res.status(400).json({ error: 'Invalid amount' });
    
    const account = await TradingAccount.findOne({ userId: req.user.id });
    if (!account) return res.status(404).json({ error: 'Account not found' });
    
    account.currentBalance += amount;
    account.transactions.push({ type: 'DEPOSIT', amount });
    await account.save();
    
    res.json(account);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
