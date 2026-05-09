const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const PriceAlert = require('../models/PriceAlert');

// GET all alerts for user
router.get('/', verifyToken, async (req, res) => {
  try {
    const alerts = await PriceAlert.find({ userId: req.user.id });
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE new alert
router.post('/', verifyToken, async (req, res) => {
  try {
    const { symbol, type, targetPrice, changePercent, notificationMethods } = req.body;
    
    const alert = new PriceAlert({
      userId: req.user.id,
      symbol: symbol.toUpperCase(),
      type,
      targetPrice,
      changePercent,
      notificationMethods
    });

    await alert.save();
    res.status(201).json(alert);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// UPDATE alert
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const alert = await PriceAlert.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true, runValidators: true }
    );
    
    if (!alert) return res.status(404).json({ error: 'Alert not found' });
    res.json(alert);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE alert
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const alert = await PriceAlert.findByIdAndDelete(req.params.id);
    if (!alert) return res.status(404).json({ error: 'Alert not found' });
    res.json({ message: 'Alert deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// TOGGLE alert active status
router.patch('/:id/toggle', verifyToken, async (req, res) => {
  try {
    const alert = await PriceAlert.findById(req.params.id);
    if (!alert) return res.status(404).json({ error: 'Alert not found' });
    
    alert.isActive = !alert.isActive;
    await alert.save();
    res.json(alert);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
