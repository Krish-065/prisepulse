const finnhubService = require('./finnhubService');
const alphaVantageService = require('./alphaVantageService');
const twelveDataService = require('./twelveDataService');

// Convert data to OHLC format for charts
const formatCandles = (data) => {
  return data.map(candle => ({
    time: candle.time,
    open: parseFloat(candle.open),
    high: parseFloat(candle.high),
    low: parseFloat(candle.low),
    close: parseFloat(candle.close),
    volume: parseFloat(candle.volume)
  }));
};

// Get candle data for stock
exports.getCandles = async (symbol, timeframe = '1min', limit = 200) => {
  try {
    let data;
    
    if (timeframe === '1min' || timeframe === '5min' || timeframe === '15min') {
      data = await twelveDataService.getTimeSeries(symbol, timeframe, limit);
    } else if (timeframe === '1h' || timeframe === '1d') {
      data = await alphaVantageService.getDaily(symbol);
    }
    
    return formatCandles(data);
  } catch (err) {
    throw new Error(`Chart Data Error: ${err.message}`);
  }
};

// Get historical data for specific period
exports.getHistoricalData = async (symbol, days = 365) => {
  try {
    const data = await alphaVantageService.getDaily(symbol);
    return formatCandles(data.slice(0, days));
  } catch (err) {
    throw new Error(`Historical Data Error: ${err.message}`);
  }
};