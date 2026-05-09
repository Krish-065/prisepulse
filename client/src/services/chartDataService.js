import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class ChartDataService {
  constructor() {
    this.cache = {};
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
  }

  getCacheKey(symbol, interval) {
    return `${symbol}-${interval}`;
  }

  isCacheValid(key) {
    const cached = this.cache[key];
    if (!cached) return false;
    return Date.now() - cached.timestamp < this.cacheExpiry;
  }

  async getChartData(symbol, interval = '1d', range = '1mo') {
    const cacheKey = this.getCacheKey(symbol, interval);

    if (this.isCacheValid(cacheKey)) {
      return this.cache[cacheKey].data;
    }

    try {
      const response = await axios.get(`${API_URL}/market/chart/${symbol}`, {
        params: { interval, range }
      });

      const data = response.data;
      this.cache[cacheKey] = {
        data,
        timestamp: Date.now()
      };

      return data;
    } catch (error) {
      console.error('Error fetching chart data:', error);
      throw error;
    }
  }

  async getIntraday(symbol) {
    return this.getChartData(symbol, '1m', '1d');
  }

  async getDaily(symbol, range = '1mo') {
    return this.getChartData(symbol, '1d', range);
  }

  async getWeekly(symbol) {
    return this.getChartData(symbol, '1w', '1y');
  }

  async getMonthly(symbol) {
    return this.getChartData(symbol, '1mo', '5y');
  }

  formatCandles(data) {
    if (!data) return [];
    return data.map(candle => ({
      time: new Date(candle.time).getTime() / 1000,
      open: parseFloat(candle.open),
      high: parseFloat(candle.high),
      low: parseFloat(candle.low),
      close: parseFloat(candle.close),
      volume: candle.volume
    }));
  }

  clearCache() {
    this.cache = {};
  }

  clearCacheFor(symbol) {
    Object.keys(this.cache).forEach(key => {
      if (key.startsWith(symbol)) {
        delete this.cache[key];
      }
    });
  }
}

export default new ChartDataService();
