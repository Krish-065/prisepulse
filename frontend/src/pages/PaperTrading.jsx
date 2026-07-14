import { useState, useEffect, useRef } from 'react';
import { createChart, CandlestickSeries, LineSeries } from 'lightweight-charts';
import { apiClient } from '../services/api';
import toast from 'react-hot-toast';
import { 
  TrendingUp, 
  TrendingDown, 
  RotateCcw, 
  Search, 
  CheckCircle, 
  XCircle, 
  DollarSign, 
  Briefcase, 
  History, 
  Award,
  ChevronRight,
  MousePointer,
  PenTool,
  Grid,
  Activity,
  Plus,
  Play,
  X,
  Layers,
  ArrowDownCircle,
  HelpCircle
} from 'lucide-react';

const POPULAR_WATCHLIST = [
  // Indian Equities
  { symbol: 'RELIANCE', name: 'Reliance Industries', category: 'Indian Stock' },
  { symbol: 'TCS', name: 'Tata Consultancy Services', category: 'Indian Stock' },
  { symbol: 'INFY', name: 'Infosys Ltd', category: 'Indian Stock' },
  { symbol: 'HDFCBANK', name: 'HDFC Bank', category: 'Indian Stock' },
  // Crypto
  { symbol: 'BTC', name: 'Bitcoin', category: 'Crypto' },
  { symbol: 'ETH', name: 'Ethereum', category: 'Crypto' },
  { symbol: 'SOL', name: 'Solana', category: 'Crypto' },
  // Forex
  { symbol: 'EURUSD=X', name: 'EUR/USD', category: 'Forex' },
  { symbol: 'GBPUSD=X', name: 'GBP/USD', category: 'Forex' },
  // Commodities
  { symbol: 'GC=F', name: 'Gold Futures', category: 'Commodity' },
  { symbol: 'CL=F', name: 'Crude Oil Futures', category: 'Commodity' }
];

const isIndianSymbol = (sym) => {
  if (!sym) return false;
  const s = sym.toUpperCase();
  const isCrypto = s.endsWith('-USD') || s.endsWith('-USDT') || ['BTC', 'ETH', 'SOL', 'XRP', 'DOGE', 'ADA'].includes(s);
  const isForex = s.endsWith('=X') || (s.includes('USD') && s.includes('INR')) || s.includes('EURUSD') || s.includes('GBPUSD');
  const isCommodity = s.endsWith('=F');
  if (isCrypto || isForex || isCommodity) return false;
  return s.endsWith('.NS') || s.endsWith('.BO') || ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK', 'NIFTY', 'SENSEX', 'BANKNIFTY', 'NSEI', 'BSESN'].includes(s);
};

const getLotMultiplier = (sym) => {
  if (!sym) return 1;
  const s = sym.toUpperCase();
  const isCrypto = s.endsWith('-USD') || s.endsWith('-USDT') || ['BTC', 'ETH', 'SOL', 'XRP', 'DOGE', 'ADA'].includes(s);
  const isForex = s.endsWith('=X') || (s.includes('USD') && s.includes('INR')) || s.includes('EURUSD') || s.includes('GBPUSD');
  const isCommodity = s.endsWith('=F');
  
  if (isCrypto) return 1; // Crypto: 1 coin
  if (isForex) return 100000; // Forex: 100,000 units (Standard Lot)
  if (isCommodity) return 100; // Commodities: 100 units
  return 100; // Stocks: 100 shares (Standard Lot)
};

export default function PaperTrading() {
  // Navigation & Page State
  const [selectedSymbol, setSelectedSymbol] = useState('BTC');
  const [interval, setInterval] = useState('1d');
  const [activeConsoleTab, setActiveConsoleTab] = useState('positions');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  
  // Virtual Portfolio State
  const [virtualBalance, setVirtualBalance] = useState(50000);
  const [refillCount, setRefillCount] = useState(1);
  const [consecutiveSlHits, setConsecutiveSlHits] = useState(0);
  const [totalHoldingsValue, setTotalHoldingsValue] = useState(0);
  const [holdings, setHoldings] = useState([]);
  const [orderHistory, setOrderHistory] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [balanceHistory, setBalanceHistory] = useState([]);
  
  // Form State
  const [isBuy, setIsBuy] = useState(true);
  const [orderType, setOrderType] = useState('market'); // market, limit, stop
  const [quantity, setQuantity] = useState(1);
  const [limitPrice, setLimitPrice] = useState('');
  const [triggerPrice, setTriggerPrice] = useState('');
  const [tradeMode, setTradeMode] = useState('units'); // units, lots
  
  // Position SL/TP inputs state
  const [slInputs, setSlInputs] = useState({});
  const [tpInputs, setTpInputs] = useState({});
  
  // Live Price & FX State
  const [livePrice, setLivePrice] = useState(0);
  const [priceChange, setPriceChange] = useState(0);
  const [priceChangePercent, setPriceChangePercent] = useState(0);
  const [chartData, setChartData] = useState([]);
  const [usdInrRate, setUsdInrRate] = useState(83.5);
  
  // Chart Drawings & Indicators State
  const [drawingMode, setDrawingMode] = useState('none');
  const [activeIndicators, setActiveIndicators] = useState({
    sma20: false,
    ema50: false,
    bollinger: false,
    rsi: false
  });
  
  // Chart Refs
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const candlestickSeriesRef = useRef(null);
  const sma20SeriesRef = useRef(null);
  const ema50SeriesRef = useRef(null);
  const bbUpperSeriesRef = useRef(null);
  const bbLowerSeriesRef = useRef(null);
  const bbBasisSeriesRef = useRef(null);
  
  // Sub-chart RSI Ref
  const rsiContainerRef = useRef(null);
  const rsiChartRef = useRef(null);
  const rsiSeriesRef = useRef(null);
  
  // Chart levels refs
  const avgPriceLineRef = useRef(null);
  const slPriceLineRef = useRef(null);
  const tpPriceLineRef = useRef(null);
  
  // Drawing Tools Click Tracking
  const drawingClicksRef = useRef([]);
  const drawnLinesRef = useRef([]);
  
  // Live Tick Simulation Ref
  const lastCandleRef = useRef(null);
  const livePriceRef = useRef(0);
  const pendingOrdersRef = useRef([]);
  const holdingsRef = useRef([]);

  // Sync refs to access inside simulated tick loop
  useEffect(() => {
    pendingOrdersRef.current = pendingOrders;
  }, [pendingOrders]);

  useEffect(() => {
    holdingsRef.current = holdings;
  }, [holdings]);

  // Format price based on symbol context
  const formatPrice = (val, symbol) => {
    const isIndian = isIndianSymbol(symbol);
    return `${isIndian ? '₹' : '$'}${parseFloat(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Fetch exchange rate on mount
  useEffect(() => {
    const fetchExchangeRate = async () => {
      try {
        const res = await apiClient.get('/market/stock/INR=X');
        if (res.data && res.data.price) {
          setUsdInrRate(parseFloat(res.data.price));
        }
      } catch (err) {
        console.warn('Failed to load USD/INR rate, using fallback:', err);
      }
    };
    fetchExchangeRate();
  }, []);

  // Fetch virtual balance and history
  const fetchPaperPortfolio = async () => {
    try {
      const res = await apiClient.get('/paper/portfolio');
      setVirtualBalance(parseFloat(res.data.virtualBalance));
      setTotalHoldingsValue(parseFloat(res.data.totalHoldingsValue));
      setHoldings(res.data.holdings || []);
      setRefillCount(parseInt(res.data.refillCount || 1));
      setConsecutiveSlHits(parseInt(res.data.consecutiveSlHits || 0));

      // Preset SL/TP inputs
      const sls = {};
      const tps = {};
      res.data.holdings?.forEach(h => {
        sls[h.symbol] = h.stopLoss || '';
        tps[h.symbol] = h.takeProfit || '';
      });
      setSlInputs(sls);
      setTpInputs(tps);
    } catch (err) {
      console.error('Failed to fetch paper portfolio:', err);
    }
  };

  const fetchOrderHistory = async () => {
    try {
      const res = await apiClient.get('/paper/history');
      setOrderHistory(res.data.history || []);
    } catch (err) {
      console.error('Failed to fetch order history:', err);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const res = await apiClient.get('/paper/leaderboard');
      setLeaderboard(res.data.leaderboard || []);
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
    }
  };

  const fetchPendingOrders = async () => {
    try {
      const res = await apiClient.get('/paper/orders');
      setPendingOrders(res.data.orders || []);
    } catch (err) {
      console.error('Failed to fetch pending orders:', err);
    }
  };

  const fetchBalanceHistory = async () => {
    try {
      const res = await apiClient.get('/paper/balance-history');
      setBalanceHistory(res.data.history || []);
    } catch (err) {
      console.error('Failed to fetch balance history:', err);
    }
  };

  const handleResetPortfolio = async () => {
    if (!window.confirm('Are you sure you want to reset your simulated portfolio? All holdings and trade history will be deleted.')) {
      return;
    }
    try {
      const res = await apiClient.post('/paper/reset');
      toast.success(res.data.message);
      fetchPaperPortfolio();
      fetchOrderHistory();
      fetchPendingOrders();
      fetchBalanceHistory();
    } catch (err) {
      toast.error('Failed to reset portfolio');
    }
  };

  const handleRefillAccount = async () => {
    try {
      const res = await apiClient.post('/paper/refill');
      if (res.data.success) {
        toast.success(res.data.message, { duration: 8000 });
        fetchPaperPortfolio();
        fetchBalanceHistory();
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Refill failed';
      toast.error(errorMsg);
    }
  };

  const handleSaveSlTp = async (symbol, slVal, tpVal) => {
    try {
      const res = await apiClient.post('/paper/set-sltp', {
        symbol,
        stopLoss: slVal ? parseFloat(slVal) : null,
        takeProfit: tpVal ? parseFloat(tpVal) : null
      });
      if (res.data.success) {
        toast.success(`SL/TP levels updated for ${symbol}`);
        fetchPaperPortfolio();
      }
    } catch (err) {
      toast.error('Failed to update SL/TP levels');
    }
  };

  // Search symbols
  const handleSearch = async (val) => {
    setSearchQuery(val);
    if (!val) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await apiClient.get(`/market/search/${val}`);
      setSearchResults(res.data || []);
    } catch (err) {
      console.error('Error searching symbols:', err);
    }
  };

  // Fetch history & setup chart
  const fetchChartData = async () => {
    try {
      let querySymbol = selectedSymbol;
      const popularInfo = POPULAR_WATCHLIST.find(p => p.symbol === selectedSymbol);
      if (popularInfo && popularInfo.category === 'Indian Stock') {
        querySymbol = `${selectedSymbol}.NS`;
      } else if (popularInfo && popularInfo.category === 'Crypto') {
        querySymbol = `${selectedSymbol}-USD`;
      }
      
      const range = interval === '1d' ? '1y' : '5d';
      const res = await apiClient.get(`/market/stock-history/${querySymbol}`, {
        params: { interval, range }
      });
      
      if (res.data && res.data.length > 0) {
        const formatted = res.data.map(d => ({
          time: Math.floor(new Date(d.date).getTime() / 1000),
          open: parseFloat(d.open),
          high: parseFloat(d.high),
          low: parseFloat(d.low),
          close: parseFloat(d.close),
          volume: parseFloat(d.volume)
        }));
        
        formatted.sort((a, b) => a.time - b.time);
        
        const uniqueFormatted = [];
        const seenTimes = new Set();
        for (const candle of formatted) {
          if (!seenTimes.has(candle.time)) {
            seenTimes.add(candle.time);
            uniqueFormatted.push(candle);
          }
        }

        setChartData(uniqueFormatted);
        
        const latest = uniqueFormatted[uniqueFormatted.length - 1];
        setLivePrice(latest.close);
        livePriceRef.current = latest.close;
        
        const quoteRes = await apiClient.get(`/market/stock/${querySymbol}`).catch(() => null);
        if (quoteRes && quoteRes.data) {
          setPriceChange(quoteRes.data.change || 0);
          setPriceChangePercent(quoteRes.data.changePercent || 0);
        }
      }
    } catch (err) {
      console.error('Failed to fetch chart history:', err);
      toast.error('Error fetching stock data');
    }
  };

  useEffect(() => {
    fetchChartData();
    fetchPaperPortfolio();
    fetchOrderHistory();
    fetchLeaderboard();
    fetchPendingOrders();
    fetchBalanceHistory();
  }, [selectedSymbol, interval]);

  // Main Chart Creation & Update
  useEffect(() => {
    if (!chartContainerRef.current || chartData.length === 0) return;

    if (chartRef.current) {
      chartRef.current.remove();
    }
    if (rsiChartRef.current) {
      rsiChartRef.current.remove();
    }
    drawnLinesRef.current = [];

    const chartTheme = {
      layout: {
        background: { color: 'rgba(10, 14, 39, 0.4)' },
        textColor: '#9b9eac',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.04)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.04)' },
      },
      crosshair: {
        mode: 1,
        vertLine: { color: '#00ff88', width: 0.5, style: 3 },
        horzLine: { color: '#00ff88', width: 0.5, style: 3 },
      },
      rightPriceScale: {
        borderColor: 'rgba(0, 255, 136, 0.15)',
      },
    };

    const chart = createChart(chartContainerRef.current, {
      ...chartTheme,
      height: 400,
      timeScale: {
        visible: !activeIndicators.rsi,
        borderColor: 'rgba(0, 255, 136, 0.15)',
      },
    });
    chartRef.current = chart;

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#00ff88',
      downColor: '#ff4444',
      borderVisible: false,
      wickUpColor: '#00ff88',
      wickDownColor: '#ff4444',
    });
    candlestickSeries.setData(chartData);
    candlestickSeriesRef.current = candlestickSeries;

    lastCandleRef.current = { ...chartData[chartData.length - 1] };

    // Indicators Setup
    if (activeIndicators.sma20) {
      const smaData = calculateSMA(chartData, 20);
      const smaSeries = chart.addSeries(LineSeries, { color: '#00bcd4', lineWidth: 1.5, title: 'SMA 20' });
      smaSeries.setData(smaData);
      sma20SeriesRef.current = smaSeries;
    }

    if (activeIndicators.ema50) {
      const emaData = calculateEMA(chartData, 50);
      const emaSeries = chart.addSeries(LineSeries, { color: '#ff9800', lineWidth: 1.5, title: 'EMA 50' });
      emaSeries.setData(emaData);
      ema50SeriesRef.current = emaSeries;
    }

    if (activeIndicators.bollinger) {
      const { basis, upper, lower } = calculateBollingerBands(chartData, 20, 2);
      const basisSeries = chart.addSeries(LineSeries, { color: 'rgba(156, 39, 176, 0.6)', lineWidth: 1, title: 'BB Basis' });
      basisSeries.setData(basis);
      bbBasisSeriesRef.current = basisSeries;

      const upperSeries = chart.addSeries(LineSeries, { color: 'rgba(0, 230, 118, 0.4)', lineWidth: 1, title: 'BB Upper' });
      upperSeries.setData(upper);
      bbUpperSeriesRef.current = upperSeries;

      const lowerSeries = chart.addSeries(LineSeries, { color: 'rgba(255, 23, 68, 0.4)', lineWidth: 1, title: 'BB Lower' });
      lowerSeries.setData(lower);
      bbLowerSeriesRef.current = lowerSeries;
    }

    // RSI setup
    if (activeIndicators.rsi) {
      const rsiChart = createChart(rsiContainerRef.current, {
        ...chartTheme,
        height: 120,
        timeScale: { visible: true, borderColor: 'rgba(0, 255, 136, 0.15)' },
      });
      rsiChartRef.current = rsiChart;

      const rsiLineSeries = rsiChart.addSeries(LineSeries, { color: '#e040fb', lineWidth: 1.5, title: 'RSI 14' });
      const rsiData = calculateRSI(chartData, 14);
      rsiLineSeries.setData(rsiData);
      rsiSeriesRef.current = rsiLineSeries;

      rsiLineSeries.createPriceLine({ price: 70, color: 'rgba(255, 68, 68, 0.3)', lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: 'Overbought' });
      rsiLineSeries.createPriceLine({ price: 30, color: 'rgba(0, 255, 136, 0.3)', lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: 'Oversold' });

      chart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
        rsiChart.timeScale().setVisibleLogicalRange(range);
      });
      rsiChart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
        chart.timeScale().setVisibleLogicalRange(range);
      });
    }

    // Average Price, Stop Loss, and Take Profit lines
    const symbolHolding = holdings.find(h => h.symbol === selectedSymbol);
    if (symbolHolding) {
      const avgPrice = parseFloat(symbolHolding.buyPrice || 0);
      const slPrice = symbolHolding.stopLoss ? parseFloat(symbolHolding.stopLoss) : null;
      const tpPrice = symbolHolding.takeProfit ? parseFloat(symbolHolding.takeProfit) : null;

      // 1. Avg Buy Price line
      if (avgPrice > 0) {
        avgPriceLineRef.current = candlestickSeries.createPriceLine({
          price: avgPrice,
          color: '#00ff88',
          lineWidth: 1.5,
          lineStyle: 2,
          axisLabelVisible: true,
          title: `Avg Buy: ${avgPrice.toFixed(2)}`
        });
      }

      // 2. Stop Loss line
      if (slPrice && slPrice > 0) {
        slPriceLineRef.current = candlestickSeries.createPriceLine({
          price: slPrice,
          color: '#ff4444',
          lineWidth: 1.5,
          lineStyle: 2,
          axisLabelVisible: true,
          title: `SL: ${slPrice.toFixed(2)}`
        });
      }

      // 3. Take Profit line
      if (tpPrice && tpPrice > 0) {
        tpPriceLineRef.current = candlestickSeries.createPriceLine({
          price: tpPrice,
          color: '#2196f3',
          lineWidth: 1.5,
          lineStyle: 2,
          axisLabelVisible: true,
          title: `TP: ${tpPrice.toFixed(2)}`
        });
      }
    }

    // Historical Trade execution markers
    const markers = orderHistory
      .filter(trade => trade.symbol === selectedSymbol)
      .map(trade => {
        const tradeTime = Math.floor(new Date(trade.timestamp).getTime() / 1000);
        return {
          time: tradeTime,
          position: trade.action === 'BUY' ? 'belowBar' : 'aboveBar',
          color: trade.action === 'BUY' ? '#00ff88' : '#ff4444',
          shape: trade.action === 'BUY' ? 'arrowUp' : 'arrowDown',
          text: `${trade.action} ${parseFloat(trade.quantity)}`
        };
      });
    
    markers.sort((a, b) => a.time - b.time);
    if (markers.length > 0) {
      candlestickSeries.setMarkers(markers);
    }

    // Click Subscription for drawings
    chart.subscribeClick((param) => {
      if (drawingMode === 'none' || !param.point || !param.time) return;
      
      const price = candlestickSeries.coordinateToPrice(param.point.y);
      if (!price) return;

      if (drawingMode === 'horizontal') {
        const horLineSeries = chart.addSeries(LineSeries, { color: '#e91e63', lineWidth: 1.5 });
        const horData = chartData.map(c => ({ time: c.time, value: price }));
        horLineSeries.setData(horData);
        drawnLinesRef.current.push(horLineSeries);
        toast.success('Horizontal support line plotted');
        setDrawingMode('none');
      } else if (drawingMode === 'trendline') {
        drawingClicksRef.current.push({ time: param.time, price });
        
        if (drawingClicksRef.current.length === 1) {
          toast('Click second point to draw Trendline');
        } else if (drawingClicksRef.current.length === 2) {
          const [p1, p2] = drawingClicksRef.current;
          const t1 = p1.time;
          const t2 = p2.time;
          const pr1 = p1.price;
          const pr2 = p2.price;

          const trendLineSeries = chart.addSeries(LineSeries, { color: '#2196f3', lineWidth: 2 });
          const trendData = chartData.map(c => {
            if (c.time >= Math.min(t1, t2) && c.time <= Math.max(t1, t2)) {
              const tDiff = t2 - t1;
              const ratio = tDiff !== 0 ? (c.time - t1) / tDiff : 0;
              const val = pr1 + ratio * (pr2 - pr1);
              return { time: c.time, value: val };
            }
            return null;
          }).filter(x => x !== null);

          trendLineSeries.setData(trendData);
          drawnLinesRef.current.push(trendLineSeries);
          toast.success('Trendline plotted');
          
          drawingClicksRef.current = [];
          setDrawingMode('none');
        }
      }
    });

    const resizeObserver = new ResizeObserver((entries) => {
      if (entries.length === 0) return;
      const { width } = entries[0].contentRect;
      chart.resize(width, 400);
      if (rsiChartRef.current) {
        rsiChartRef.current.resize(width, 120);
      }
    });
    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
      if (rsiChartRef.current) {
        rsiChartRef.current.remove();
        rsiChartRef.current = null;
      }
    };
  }, [chartData, activeIndicators, drawingMode]);

  // Simulated Tick Engine Loop
  useEffect(() => {
    if (chartData.length === 0 || !candlestickSeriesRef.current) return;

    const intervalId = setInterval(() => {
      const candle = lastCandleRef.current;
      if (!candle) return;

      const pctChange = (Math.random() - 0.5) * 0.003;
      const delta = candle.close * pctChange;
      const newPrice = Math.max(0.01, candle.close + delta);

      candle.close = newPrice;
      if (newPrice > candle.high) candle.high = newPrice;
      if (newPrice < candle.low) candle.low = newPrice;

      setLivePrice(newPrice);
      livePriceRef.current = newPrice;

      candlestickSeriesRef.current.update(candle);

      checkPendingOrders(newPrice);
      checkSlTpLevels(newPrice);
    }, 800);

    return () => clearInterval(intervalId);
  }, [chartData]);

  // Check Limit/Stop Loss pending orders
  const checkPendingOrders = (currentPrice) => {
    const activePending = [...pendingOrdersRef.current];
    if (activePending.length === 0) return;

    const remaining = [];
    let stateChanged = false;

    for (const order of activePending) {
      let triggered = false;

      if (order.symbol !== selectedSymbol) {
        remaining.push(order);
        continue;
      }

      if (order.type === 'limit') {
        if (order.action === 'BUY' && currentPrice <= order.price) {
          triggered = true;
        } else if (order.action === 'SELL' && currentPrice >= order.price) {
          triggered = true;
        }
      } else if (order.type === 'stop') {
        if (order.action === 'BUY' && currentPrice >= order.triggerPrice) {
          triggered = true;
        } else if (order.action === 'SELL' && currentPrice <= order.triggerPrice) {
          triggered = true;
        }
      }

      if (triggered) {
        stateChanged = true;
        executeSimulatedOrder(order.symbol, order.action, order.quantity, currentPrice, order.type, null, order.id);
      } else {
        remaining.push(order);
      }
    }

    if (stateChanged) {
      setPendingOrders(remaining);
    }
  };

  // Check Stop Loss & Take Profit limits of current holdings
  const checkSlTpLevels = (currentPrice) => {
    const activeHoldings = [...holdingsRef.current];
    if (activeHoldings.length === 0) return;

    for (const holding of activeHoldings) {
      if (holding.symbol !== selectedSymbol) continue;

      // 1. Stop Loss check (exiting at loss)
      if (holding.stopLoss && currentPrice <= holding.stopLoss) {
        executeSimulatedOrder(
          holding.symbol, 
          'SELL', 
          holding.quantity, 
          holding.stopLoss, 
          'Stop Loss Auto-Trigger', 
          'stop_loss'
        );
      }
      
      // 2. Take Profit check (exiting at profit)
      if (holding.takeProfit && currentPrice >= holding.takeProfit) {
        executeSimulatedOrder(
          holding.symbol, 
          'SELL', 
          holding.quantity, 
          holding.takeProfit, 
          'Take Profit Auto-Trigger', 
          'take_profit'
        );
      }
    }
  };

  // Execute Simulated Order
  const executeSimulatedOrder = async (symbol, action, qty, executionPrice, typeLabel, triggerReason = null, pendingOrderId = null) => {
    try {
      const res = await apiClient.post('/paper/trade', {
        symbol,
        action,
        quantity: qty,
        price: executionPrice,
        triggerReason,
        pendingOrderId
      });
      if (res.data.success) {
        toast.success(`Filled: ${typeLabel.toUpperCase()} ${action} ${qty} units of ${symbol} at ${formatPrice(executionPrice, symbol)}`);
        fetchPaperPortfolio();
        fetchOrderHistory();
        fetchPendingOrders();
        fetchBalanceHistory();
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Order execution failed';
      toast.error(`Order Failed: ${errorMsg}`);
    }
  };

  // Order Submit Form
  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    let qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      toast.error('Invalid quantity');
      return;
    }

    // Apply lot multiplier if Lot size mode is active
    if (tradeMode === 'lots') {
      const multiplier = getLotMultiplier(selectedSymbol);
      qty = qty * multiplier;
    }

    const action = isBuy ? 'BUY' : 'SELL';

    if (orderType === 'limit') {
      const limit = parseFloat(limitPrice);
      if (isNaN(limit) || limit <= 0) {
        toast.error('Invalid Limit Price');
        return;
      }
      
      try {
        const res = await apiClient.post('/paper/orders', {
          symbol: selectedSymbol,
          action,
          type: 'limit',
          quantity: qty,
          price: limit
        });
        if (res.data.success) {
          toast.success(`Limit ${action} order placed at ${formatPrice(limit, selectedSymbol)}`);
          fetchPendingOrders();
          fetchPaperPortfolio();
          fetchBalanceHistory();
          setLimitPrice('');
        }
      } catch (err) {
        toast.error(`Order Failed: ${err.response?.data?.error || 'Unknown error'}`);
      }
      return;
    }

    if (orderType === 'stop') {
      const stop = parseFloat(triggerPrice);
      const limit = parseFloat(limitPrice) || livePriceRef.current;
      if (isNaN(stop) || stop <= 0) {
        toast.error('Invalid Trigger Price');
        return;
      }

      try {
        const res = await apiClient.post('/paper/orders', {
          symbol: selectedSymbol,
          action,
          type: 'stop',
          quantity: qty,
          price: limit,
          triggerPrice: stop
        });
        if (res.data.success) {
          toast.success(`Stop ${action} order placed (Trigger: ${formatPrice(stop, selectedSymbol)})`);
          fetchPendingOrders();
          fetchPaperPortfolio();
          fetchBalanceHistory();
          setTriggerPrice('');
          setLimitPrice('');
        }
      } catch (err) {
        toast.error(`Order Failed: ${err.response?.data?.error || 'Unknown error'}`);
      }
      return;
    }

    // Market Order
    const executionPrice = livePriceRef.current;
    await executeSimulatedOrder(selectedSymbol, action, qty, executionPrice, 'market');
  };

  const handleCancelPendingOrder = async (id) => {
    try {
      const res = await apiClient.delete(`/paper/orders/${id}`);
      if (res.data.success) {
        toast.success('Pending order cancelled');
        fetchPendingOrders();
        fetchPaperPortfolio();
        fetchBalanceHistory();
      }
    } catch (err) {
      toast.error('Failed to cancel order');
    }
  };

  const handleClosePosition = async (holding) => {
    const executionPrice = livePriceRef.current;
    await executeSimulatedOrder(holding.symbol, 'SELL', holding.quantity, executionPrice, 'Market Close');
  };

  const calculateSMA = (data, count) => {
    const sma = [];
    for (let i = 0; i < data.length; i++) {
      if (i < count - 1) continue;
      let sum = 0;
      for (let j = 0; j < count; j++) sum += data[i - j].close;
      sma.push({ time: data[i].time, value: sum / count });
    }
    return sma;
  };

  const calculateEMA = (data, count) => {
    const ema = [];
    const k = 2 / (count + 1);
    let emaVal = data[0].close;
    ema.push({ time: data[0].time, value: emaVal });
    for (let i = 1; i < data.length; i++) {
      emaVal = data[i].close * k + emaVal * (1 - k);
      ema.push({ time: data[i].time, value: emaVal });
    }
    return ema;
  };

  const calculateBollingerBands = (data, count, stdDevs) => {
    const basis = [];
    const upper = [];
    const lower = [];

    for (let i = 0; i < data.length; i++) {
      if (i < count - 1) continue;
      let sum = 0;
      for (let j = 0; j < count; j++) sum += data[i - j].close;
      const mean = sum / count;
      basis.push({ time: data[i].time, value: mean });

      let sumSqDiff = 0;
      for (let j = 0; j < count; j++) sumSqDiff += Math.pow(data[i - j].close - mean, 2);
      const std = Math.sqrt(sumSqDiff / count);
      upper.push({ time: data[i].time, value: mean + stdDevs * std });
      lower.push({ time: data[i].time, value: mean - stdDevs * std });
    }
    return { basis, upper, lower };
  };

  const calculateRSI = (data, period) => {
    const rsi = [];
    let gains = 0;
    let losses = 0;

    for (let i = 1; i <= period; i++) {
      const diff = data[i].close - data[i - 1].close;
      if (diff >= 0) gains += diff;
      else losses -= diff;
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;
    let rs = avgLoss !== 0 ? avgGain / avgLoss : 0;
    rsi.push({ time: data[period].time, value: 100 - (100 / (1 + rs)) });

    for (let i = period + 1; i < data.length; i++) {
      const diff = data[i].close - data[i - 1].close;
      const gain = diff >= 0 ? diff : 0;
      const loss = diff < 0 ? -diff : 0;
      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;
      rs = avgLoss !== 0 ? avgGain / avgLoss : 0;
      rsi.push({ time: data[i].time, value: 100 - (100 / (1 + rs)) });
    }
    return rsi;
  };

  const clearDrawings = () => {
    if (chartRef.current) {
      for (const line of drawnLinesRef.current) chartRef.current.removeSeries(line);
      drawnLinesRef.current = [];
      toast.success('Clear drawings');
    }
  };

  // UI Calculations
  const isIndian = isIndianSymbol(selectedSymbol);
  const rawQty = parseFloat(quantity) || 0;
  const lotMultiplier = getLotMultiplier(selectedSymbol);
  const finalQuantity = tradeMode === 'lots' ? rawQty * lotMultiplier : rawQty;
  const currentTargetPrice = orderType === 'market' ? livePrice : (parseFloat(limitPrice) || livePrice);
  const estimatedCostNative = finalQuantity * currentTargetPrice;
  const estimatedCostUsd = isIndian ? estimatedCostNative / usdInrRate : estimatedCostNative;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', paddingBottom: '40px' }}>
      
      {/* 1. Stop Loss consecutive warnings notification */}
      {consecutiveSlHits >= 3 && (
        <div style={{
          background: 'rgba(255, 68, 68, 0.1)',
          border: '1px solid rgba(255, 68, 68, 0.3)',
          borderRadius: '12px',
          padding: '16px 20px',
          color: '#ff4444',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          fontSize: '13px',
          lineHeight: '1.6',
          boxShadow: '0 8px 32px rgba(255, 68, 68, 0.05)',
          backdropFilter: 'blur(10px)'
        }}>
          <strong style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: 800 }}>
            ⚠️ Mindful Trading Break Recommended (Consecutive SL Hits: {consecutiveSlHits})
          </strong>
          <span>
            You have hit your Stop Loss {consecutiveSlHits} times consecutively. To prevent emotional trading and revenge losses, we strongly advise taking a break from the charts for a few days. Clear your mind, empty your emotions, and return when you are calm and refreshed!
          </span>
        </div>
      )}

      {/* Title & Stats Ribbon */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(0, 255, 136, 0.15)',
        padding: '16px 24px',
        borderRadius: '16px',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity style={{ color: '#00ff88' }} size={24} /> Paper Trading Simulator
            </h1>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#9b9eac' }}>
              Real-time multi-market virtual environment
            </p>
          </div>
        </div>

        {/* Portfolio Stats Summary */}
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '11px', color: '#9b9eac', fontWeight: 700, textTransform: 'uppercase' }}>Virtual Balance</span>
            <span style={{ fontSize: '18px', fontWeight: 800, color: '#00ff88' }}>
              ${virtualBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div style={{ width: '1px', height: '32px', background: 'rgba(255, 255, 255, 0.08)' }}></div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '11px', color: '#9b9eac', fontWeight: 700, textTransform: 'uppercase' }}>Invested Capital</span>
            <span style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff' }}>
              ${totalHoldingsValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div style={{ width: '1px', height: '32px', background: 'rgba(255, 255, 255, 0.08)' }}></div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '11px', color: '#9b9eac', fontWeight: 700, textTransform: 'uppercase' }}>Total Equity</span>
            <span style={{ fontSize: '18px', fontWeight: 800, color: '#00bcd4' }}>
              ${(virtualBalance + totalHoldingsValue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {/* Refill Button */}
            <button
              onClick={handleRefillAccount}
              disabled={refillCount >= 2}
              style={{
                background: refillCount >= 2 ? 'rgba(255,255,255,0.02)' : 'rgba(0, 255, 136, 0.08)',
                border: `1px solid ${refillCount >= 2 ? 'rgba(255,255,255,0.05)' : 'rgba(0, 255, 136, 0.25)'}`,
                borderRadius: '8px',
                color: refillCount >= 2 ? '#666' : '#00ff88',
                cursor: refillCount >= 2 ? 'not-allowed' : 'pointer',
                padding: '8px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                fontWeight: 700,
                transition: 'all 0.2s'
              }}
              onMouseOver={e => { if (refillCount < 2) e.currentTarget.style.background = 'rgba(0, 255, 136, 0.16)'; }}
              onMouseOut={e => { if (refillCount < 2) e.currentTarget.style.background = 'rgba(0, 255, 136, 0.08)'; }}
            >
              <ArrowDownCircle size={14} /> 
              {refillCount >= 2 ? 'Refill Limit Reached' : 'Refill ($50k)'}
            </button>
            
            {/* Reset Button */}
            <button 
              onClick={handleResetPortfolio}
              style={{ 
                background: 'rgba(255, 68, 68, 0.08)', 
                border: '1px solid rgba(255, 68, 68, 0.25)', 
                borderRadius: '8px', 
                color: '#ff4444', 
                cursor: 'pointer', 
                padding: '8px 12px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px', 
                fontSize: '12px', 
                fontWeight: 700,
                transition: 'all 0.2s'
              }}
              onMouseOver={e => e.currentTarget.style.background = 'rgba(255, 68, 68, 0.16)'}
              onMouseOut={e => e.currentTarget.style.background = 'rgba(255, 68, 68, 0.08)'}
            >
              <RotateCcw size={14} /> Reset
            </button>
          </div>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '20px', alignItems: 'start' }}>
        
        {/* Chart Window */}
        <div style={{
          background: 'rgba(10, 14, 39, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          
          {/* Chart Header controls */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative' }}>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9b9eac' }} />
                <input 
                  type="text"
                  placeholder="Search Asset..."
                  value={searchQuery}
                  onChange={e => handleSearch(e.target.value)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '8px',
                    padding: '8px 12px 8px 34px',
                    color: 'white',
                    fontSize: '13px',
                    width: '200px',
                    outline: 'none',
                    transition: 'all 0.2s'
                  }}
                  onFocus={e => e.target.style.borderColor = 'rgba(0, 255, 136, 0.3)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)'}
                />
                
                {/* Search Results Dropdown */}
                {searchResults.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: 'rgba(10, 14, 39, 0.95)',
                    border: '1px solid rgba(0, 255, 136, 0.2)',
                    borderRadius: '8px',
                    marginTop: '4px',
                    maxHeight: '240px',
                    overflowY: 'auto',
                    zIndex: 100,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
                  }}>
                    {searchResults.map(res => (
                      <div 
                        key={res.symbol}
                        onClick={() => {
                          setSelectedSymbol(res.symbol.replace('.NS', '').replace('-USD', ''));
                          setSearchQuery('');
                          setSearchResults([]);
                        }}
                        style={{
                          padding: '10px 14px',
                          borderBottom: '1px solid rgba(255,255,255,0.05)',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: '12px'
                        }}
                        onMouseOver={e => e.currentTarget.style.background = 'rgba(0, 255, 136, 0.05)'}
                        onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <div>
                          <strong style={{ color: '#ffffff' }}>{res.symbol.replace('.NS', '').replace('-USD', '')}</strong>
                          <span style={{ color: '#9b9eac', marginLeft: '6px' }}>{res.name}</span>
                        </div>
                        <span style={{ fontSize: '10px', padding: '2px 6px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', color: '#9b9eac' }}>
                          {res.symbol.includes('.NS') ? 'NSE' : res.symbol.includes('-USD') ? 'Crypto' : 'Equity'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Ticker Live info display */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff' }}>{selectedSymbol}</span>
                <span style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff' }}>{formatPrice(livePrice, selectedSymbol)}</span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: priceChange >= 0 ? '#00ff88' : '#ff4444' }}>
                  {priceChange >= 0 ? '▲' : '▼'} {Math.abs(parseFloat(priceChange || 0)).toFixed(2)} ({parseFloat(priceChangePercent || 0).toFixed(2)}%)
                </span>
              </div>
            </div>

            {/* Interval Toggles */}
            <div style={{ display: 'flex', background: 'rgba(255, 255, 255, 0.02)', padding: '4px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
              {['1m', '5m', '15m', '60m', '1d'].map(i => (
                <button
                  key={i}
                  onClick={() => setInterval(i)}
                  style={{
                    background: interval === i ? 'rgba(0, 255, 136, 0.08)' : 'transparent',
                    border: 'none',
                    color: interval === i ? '#00ff88' : '#9b9eac',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>

          {/* Drawings and Chart Wrapper */}
          <div style={{ display: 'flex', position: 'relative', width: '100%' }}>
            
            {/* Left drawing toolbar */}
            <div style={{
              width: '48px',
              borderRight: '1px solid rgba(255, 255, 255, 0.06)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '12px 0',
              gap: '12px',
              background: 'rgba(10, 14, 39, 0.2)'
            }}>
              <button
                title="Cursor / Navigate"
                onClick={() => setDrawingMode('none')}
                style={{
                  background: drawingMode === 'none' ? 'rgba(0, 255, 136, 0.08)' : 'transparent',
                  border: drawingMode === 'none' ? '1px solid rgba(0, 255, 136, 0.2)' : '1px solid transparent',
                  borderRadius: '8px',
                  color: drawingMode === 'none' ? '#00ff88' : '#9b9eac',
                  padding: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <MousePointer size={16} />
              </button>
              <button
                title="Draw Trendline"
                onClick={() => setDrawingMode('trendline')}
                style={{
                  background: drawingMode === 'trendline' ? 'rgba(0, 255, 136, 0.08)' : 'transparent',
                  border: drawingMode === 'trendline' ? '1px solid rgba(0, 255, 136, 0.2)' : '1px solid transparent',
                  borderRadius: '8px',
                  color: drawingMode === 'trendline' ? '#00ff88' : '#9b9eac',
                  padding: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <PenTool size={16} />
              </button>
              <button
                title="Horizontal Support/Resistance Line"
                onClick={() => setDrawingMode('horizontal')}
                style={{
                  background: drawingMode === 'horizontal' ? 'rgba(0, 255, 136, 0.08)' : 'transparent',
                  border: drawingMode === 'horizontal' ? '1px solid rgba(0, 255, 136, 0.2)' : '1px solid transparent',
                  borderRadius: '8px',
                  color: drawingMode === 'horizontal' ? '#00ff88' : '#9b9eac',
                  padding: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Layers size={16} />
              </button>
              <div style={{ height: '1px', width: '20px', background: 'rgba(255,255,255,0.06)' }}></div>
              <button
                title="Clear Drawings"
                onClick={clearDrawings}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#ff4444',
                  padding: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Chart Container */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
              <div style={{
                position: 'absolute',
                top: '12px',
                left: '20px',
                zIndex: 10,
                display: 'flex',
                gap: '8px',
                flexWrap: 'wrap'
              }}>
                <button
                  onClick={() => setActiveIndicators({ ...activeIndicators, sma20: !activeIndicators.sma20 })}
                  style={{
                    background: activeIndicators.sma20 ? '#00bcd4' : 'rgba(10, 14, 39, 0.8)',
                    color: activeIndicators.sma20 ? '#ffffff' : '#9b9eac',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    fontSize: '10px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  SMA (20)
                </button>
                <button
                  onClick={() => setActiveIndicators({ ...activeIndicators, ema50: !activeIndicators.ema50 })}
                  style={{
                    background: activeIndicators.ema50 ? '#ff9800' : 'rgba(10, 14, 39, 0.8)',
                    color: activeIndicators.ema50 ? '#ffffff' : '#9b9eac',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    fontSize: '10px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  EMA (50)
                </button>
                <button
                  onClick={() => setActiveIndicators({ ...activeIndicators, bollinger: !activeIndicators.bollinger })}
                  style={{
                    background: activeIndicators.bollinger ? 'rgba(156, 39, 176, 0.8)' : 'rgba(10, 14, 39, 0.8)',
                    color: activeIndicators.bollinger ? '#ffffff' : '#9b9eac',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    fontSize: '10px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Bollinger Bands
                </button>
                <button
                  onClick={() => setActiveIndicators({ ...activeIndicators, rsi: !activeIndicators.rsi })}
                  style={{
                    background: activeIndicators.rsi ? '#e040fb' : 'rgba(10, 14, 39, 0.8)',
                    color: activeIndicators.rsi ? '#ffffff' : '#9b9eac',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    fontSize: '10px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  RSI (14)
                </button>
              </div>

              <div ref={chartContainerRef} style={{ width: '100%', height: '400px' }} />
              {activeIndicators.rsi && (
                <div ref={rsiContainerRef} style={{ width: '100%', height: '120px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }} />
              )}
            </div>
          </div>

          {/* Quick Watchlist Selector */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            padding: '12px 20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            gap: '12px',
            overflowX: 'auto',
            background: 'rgba(10, 14, 39, 0.15)'
          }}>
            <span style={{ fontSize: '11px', color: '#9b9eac', fontWeight: 700, textTransform: 'uppercase', flexShrink: 0 }}>
              Quick Watchlist:
            </span>
            {POPULAR_WATCHLIST.map(item => (
              <button
                key={item.symbol}
                onClick={() => setSelectedSymbol(item.symbol)}
                style={{
                  background: selectedSymbol === item.symbol ? 'rgba(0, 255, 136, 0.08)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${selectedSymbol === item.symbol ? 'rgba(0, 255, 136, 0.25)' : 'rgba(255,255,255,0.06)'}`,
                  borderRadius: '6px',
                  color: selectedSymbol === item.symbol ? '#00ff88' : '#ffffff',
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'all 0.2s'
                }}
              >
                {item.symbol}
              </button>
            ))}
          </div>
        </div>

        {/* Trade Execution Sidebar */}
        <div style={{
          background: 'rgba(10, 14, 39, 0.4)',
          border: '1px solid rgba(0, 255, 136, 0.15)',
          borderRadius: '16px',
          padding: '24px',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: 'rgba(255, 255, 255, 0.03)', padding: '4px', borderRadius: '8px' }}>
            <button
              onClick={() => setIsBuy(true)}
              style={{
                background: isBuy ? '#00ff88' : 'transparent',
                border: 'none',
                color: isBuy ? '#0a0e27' : '#9b9eac',
                padding: '10px',
                borderRadius: '6px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              BUY
            </button>
            <button
              onClick={() => setIsBuy(false)}
              style={{
                background: !isBuy ? '#ff4444' : 'transparent',
                border: 'none',
                color: !isBuy ? '#ffffff' : '#9b9eac',
                padding: '10px',
                borderRadius: '6px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              SELL
            </button>
          </div>

          <form onSubmit={handlePlaceOrder} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Size Mode Selector (Units or Lots) */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: '#9b9eac', fontWeight: 700, textTransform: 'uppercase' }}>Trading Size Mode</span>
              <div style={{ display: 'flex', background: 'rgba(255, 255, 255, 0.02)', padding: '2px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <button
                  type="button"
                  onClick={() => setTradeMode('units')}
                  style={{
                    background: tradeMode === 'units' ? 'rgba(0, 255, 136, 0.08)' : 'transparent',
                    border: 'none',
                    color: tradeMode === 'units' ? '#00ff88' : '#9b9eac',
                    padding: '4px 10px',
                    fontSize: '11px',
                    fontWeight: 700,
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Units
                </button>
                <button
                  type="button"
                  onClick={() => setTradeMode('lots')}
                  style={{
                    background: tradeMode === 'lots' ? 'rgba(0, 255, 136, 0.08)' : 'transparent',
                    border: 'none',
                    color: tradeMode === 'lots' ? '#00ff88' : '#9b9eac',
                    padding: '4px 10px',
                    fontSize: '11px',
                    fontWeight: 700,
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Lots
                </button>
              </div>
            </div>

            {/* Order Type Selector */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '11px', color: '#9b9eac', fontWeight: 700, textTransform: 'uppercase' }}>Order Type</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', background: 'rgba(255, 255, 255, 0.02)', padding: '4px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                {['market', 'limit', 'stop'].map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setOrderType(t)}
                    style={{
                      background: orderType === t ? 'rgba(255,255,255,0.06)' : 'transparent',
                      border: 'none',
                      color: orderType === t ? '#ffffff' : '#9b9eac',
                      padding: '6px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textTransform: 'capitalize'
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity Input (Shows descriptive label if lots) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '11px', color: '#9b9eac', fontWeight: 700, textTransform: 'uppercase' }}>
                  Quantity ({tradeMode === 'lots' ? 'Lots' : 'Units'})
                </label>
                {tradeMode === 'lots' && (
                  <span style={{ fontSize: '10px', color: '#00ff88', fontWeight: 600 }}>
                    1 Lot = {lotMultiplier.toLocaleString()} units
                  </span>
                )}
              </div>
              <input
                type="number"
                min="0.0001"
                step="any"
                value={quantity}
                onChange={e => setQuantity(parseFloat(e.target.value) || '')}
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  color: 'white',
                  fontSize: '14px',
                  outline: 'none'
                }}
                required
              />
            </div>

            {/* Limit Price Input */}
            {orderType !== 'market' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', color: '#9b9eac', fontWeight: 700, textTransform: 'uppercase' }}>
                  Limit Price ({isIndian ? '₹' : '$'})
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="any"
                  value={limitPrice}
                  placeholder={parseFloat(livePrice || 0).toFixed(2)}
                  onChange={e => setLimitPrice(e.target.value)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    color: 'white',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                  required
                />
              </div>
            )}

            {/* Trigger Price Input */}
            {orderType === 'stop' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', color: '#9b9eac', fontWeight: 700, textTransform: 'uppercase' }}>
                  Trigger Price ({isIndian ? '₹' : '$'})
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="any"
                  value={triggerPrice}
                  placeholder={parseFloat(livePrice || 0).toFixed(2)}
                  onChange={e => setTriggerPrice(e.target.value)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    color: 'white',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                  required
                />
              </div>
            )}

            {/* Order Cost Estimate (Shows USD conversion if Indian) */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '8px',
              padding: '12px 16px',
              marginTop: '8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: '#9b9eac' }}>Total Position Size:</span>
                <strong style={{ fontSize: '12px', color: '#fff' }}>{finalQuantity.toLocaleString()} units</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: '#9b9eac' }}>Estimated Native Cost:</span>
                <strong style={{ fontSize: '13px', color: '#ffffff' }}>
                  {formatPrice(estimatedCostNative, selectedSymbol)}
                </strong>
              </div>
              {isIndian && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed rgba(255,255,255,0.06)', paddingTop: '4px' }}>
                  <span style={{ fontSize: '11px', color: '#00ff88' }}>Virtual Balance Cut:</span>
                  <strong style={{ fontSize: '13px', color: '#00ff88' }}>
                    ${estimatedCostUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </strong>
                </div>
              )}
            </div>

            {/* CTA Button */}
            <button
              type="submit"
              style={{
                background: isBuy ? '#00ff88' : '#ff4444',
                border: 'none',
                color: isBuy ? '#0a0e27' : '#ffffff',
                padding: '14px',
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: '14px',
                cursor: 'pointer',
                boxShadow: `0 4px 14px ${isBuy ? 'rgba(0, 255, 136, 0.2)' : 'rgba(255, 68, 68, 0.2)'}`,
                transition: 'all 0.2s',
                marginTop: '8px'
              }}
              onMouseOver={e => e.currentTarget.style.transform = 'translateY(-1px)'}
              onMouseOut={e => e.currentTarget.style.transform = 'none'}
            >
              Place {isBuy ? 'BUY' : 'SELL'} {orderType.toUpperCase()} Order
            </button>
          </form>
        </div>
      </div>

      {/* Trade Console */}
      <div style={{
        background: 'rgba(10, 14, 39, 0.3)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderRadius: '16px',
        overflow: 'hidden'
      }}>
        {/* Console Tab Headers */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          background: 'rgba(10, 14, 39, 0.15)'
        }}>
          {[
            { id: 'positions', label: 'Active Positions', icon: <Briefcase size={14} /> },
            { id: 'pending', label: `Pending Orders (${pendingOrders.length})`, icon: <Plus size={14} /> },
            { id: 'history', label: 'Order History', icon: <History size={14} /> },
            { id: 'balance', label: 'Balance History', icon: <TrendingUp size={14} /> },
            { id: 'leaderboard', label: 'Rankings Leaderboard', icon: <Award size={14} /> }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveConsoleTab(t.id)}
              style={{
                background: activeConsoleTab === t.id ? 'rgba(0, 255, 136, 0.05)' : 'transparent',
                border: 'none',
                borderBottom: `2px solid ${activeConsoleTab === t.id ? '#00ff88' : 'transparent'}`,
                color: activeConsoleTab === t.id ? '#00ff88' : '#9b9eac',
                padding: '14px 20px',
                fontSize: '13px',
                fontWeight: activeConsoleTab === t.id ? 700 : 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s'
              }}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        <div style={{ padding: '20px' }}>
          
          {/* Active Positions Tab */}
          {activeConsoleTab === 'positions' && (
            <div style={{ overflowX: 'auto' }}>
              {holdings.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 0', color: '#9b9eac' }}>
                  No active virtual positions. Use the Trade Execution panel to purchase virtual shares.
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', color: '#9b9eac', fontSize: '11px', textTransform: 'uppercase' }}>
                      <th style={{ padding: '12px' }}>Symbol</th>
                      <th style={{ padding: '12px' }}>Qty</th>
                      <th style={{ padding: '12px' }}>Avg Price</th>
                      <th style={{ padding: '12px' }}>Live Price</th>
                      <th style={{ padding: '12px' }}>Stop Loss</th>
                      <th style={{ padding: '12px' }}>Take Profit</th>
                      <th style={{ padding: '12px' }}>Valuation</th>
                      <th style={{ padding: '12px' }}>Simulated PnL</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {holdings.map(h => {
                      const curPrice = h.symbol === selectedSymbol ? livePrice : h.livePrice;
                      const isHoldingInd = isIndianSymbol(h.symbol);
                      
                      // Aggregates valuation in USD
                      const valuationUsd = parseFloat(h.quantity || 0) * (isHoldingInd ? parseFloat(curPrice || 0) / usdInrRate : parseFloat(curPrice || 0));
                      const costUsd = parseFloat(h.quantity || 0) * (isHoldingInd ? parseFloat(h.buyPrice || 0) / usdInrRate : parseFloat(h.buyPrice || 0));
                      const pnlUsd = valuationUsd - costUsd;
                      const pnlPct = costUsd > 0 ? (pnlUsd / costUsd) * 100 : 0;
                      
                      return (
                        <tr key={h.symbol} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '13px', color: '#ffffff' }}>
                          <td style={{ padding: '12px', fontWeight: 700 }}>{h.symbol}</td>
                          <td style={{ padding: '12px' }}>{parseFloat(h.quantity).toLocaleString()}</td>
                          <td style={{ padding: '12px' }}>{formatPrice(h.buyPrice, h.symbol)}</td>
                          <td style={{ padding: '12px' }}>{formatPrice(curPrice, h.symbol)}</td>
                          
                          {/* Stop Loss Input Cell */}
                          <td style={{ padding: '8px' }}>
                            <input
                              type="number"
                              step="any"
                              value={slInputs[h.symbol] ?? ''}
                              placeholder="Set SL price"
                              onChange={e => setSlInputs({ ...slInputs, [h.symbol]: e.target.value })}
                              style={{
                                width: '100px',
                                background: 'rgba(255,255,255,0.02)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: '6px',
                                padding: '4px 8px',
                                color: 'white',
                                fontSize: '12px',
                                outline: 'none'
                              }}
                            />
                          </td>

                          {/* Take Profit Input Cell */}
                          <td style={{ padding: '8px' }}>
                            <input
                              type="number"
                              step="any"
                              value={tpInputs[h.symbol] ?? ''}
                              placeholder="Set TP target"
                              onChange={e => setTpInputs({ ...tpInputs, [h.symbol]: e.target.value })}
                              style={{
                                width: '100px',
                                background: 'rgba(255,255,255,0.02)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: '6px',
                                padding: '4px 8px',
                                color: 'white',
                                fontSize: '12px',
                                outline: 'none'
                              }}
                            />
                          </td>

                          <td style={{ padding: '12px' }}>
                            ${valuationUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td style={{ padding: '12px', fontWeight: 700, color: pnlUsd >= 0 ? '#00ff88' : '#ff4444' }}>
                            ${pnlUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({pnlPct.toFixed(2)}%)
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right', display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                            <button
                              onClick={() => handleSaveSlTp(h.symbol, slInputs[h.symbol], tpInputs[h.symbol])}
                              style={{
                                background: 'rgba(0, 188, 212, 0.08)',
                                border: '1px solid rgba(0, 188, 212, 0.25)',
                                color: '#00bcd4',
                                padding: '6px 10px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                              }}
                              onMouseOver={e => e.currentTarget.style.background = 'rgba(0, 188, 212, 0.16)'}
                              onMouseOut={e => e.currentTarget.style.background = 'rgba(0, 188, 212, 0.08)'}
                            >
                              Save SL/TP
                            </button>
                            <button
                              onClick={() => handleClosePosition(h)}
                              style={{
                                background: 'rgba(255, 68, 68, 0.08)',
                                border: '1px solid rgba(255, 68, 68, 0.25)',
                                color: '#ff4444',
                                padding: '6px 10px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                              }}
                              onMouseOver={e => e.currentTarget.style.background = 'rgba(255, 68, 68, 0.16)'}
                              onMouseOut={e => e.currentTarget.style.background = 'rgba(255, 68, 68, 0.08)'}
                            >
                              Market Close
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Pending Orders Tab */}
          {activeConsoleTab === 'pending' && (
            <div style={{ overflowX: 'auto' }}>
              {pendingOrders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 0', color: '#9b9eac' }}>
                  No pending Limit or Stop Loss orders active.
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', color: '#9b9eac', fontSize: '11px', textTransform: 'uppercase' }}>
                      <th style={{ padding: '12px' }}>Time</th>
                      <th style={{ padding: '12px' }}>Symbol</th>
                      <th style={{ padding: '12px' }}>Action</th>
                      <th style={{ padding: '12px' }}>Type</th>
                      <th style={{ padding: '12px' }}>Qty</th>
                      <th style={{ padding: '12px' }}>Limit Price</th>
                      <th style={{ padding: '12px' }}>Trigger Price</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingOrders.map(o => (
                      <tr key={o.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '13px', color: '#ffffff' }}>
                        <td style={{ padding: '12px', color: '#9b9eac' }}>{new Date(o.timestamp).toLocaleTimeString()}</td>
                        <td style={{ padding: '12px', fontWeight: 700 }}>{o.symbol}</td>
                        <td style={{ padding: '12px', fontWeight: 700, color: o.action === 'BUY' ? '#00ff88' : '#ff4444' }}>{o.action}</td>
                        <td style={{ padding: '12px', textTransform: 'uppercase', fontSize: '11px' }}>{o.type}</td>
                        <td style={{ padding: '12px' }}>{o.quantity.toLocaleString()}</td>
                        <td style={{ padding: '12px' }}>{formatPrice(o.price, o.symbol)}</td>
                        <td style={{ padding: '12px' }}>{o.triggerPrice ? formatPrice(o.triggerPrice, o.symbol) : '--'}</td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          <button
                            onClick={() => handleCancelPendingOrder(o.id)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#9b9eac',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '12px'
                            }}
                            onMouseOver={e => e.currentTarget.style.color = '#ff4444'}
                            onMouseOut={e => e.currentTarget.style.color = '#9b9eac'}
                          >
                            <XCircle size={14} /> Cancel
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Order History Tab */}
          {activeConsoleTab === 'history' && (
            <div style={{ overflowX: 'auto' }}>
              {orderHistory.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 0', color: '#9b9eac' }}>
                  No past executed trades found.
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', color: '#9b9eac', fontSize: '11px', textTransform: 'uppercase' }}>
                      <th style={{ padding: '12px' }}>Timestamp</th>
                      <th style={{ padding: '12px' }}>Symbol</th>
                      <th style={{ padding: '12px' }}>Action</th>
                      <th style={{ padding: '12px' }}>Qty</th>
                      <th style={{ padding: '12px' }}>Entry Price</th>
                      <th style={{ padding: '12px' }}>Exit Price</th>
                      <th style={{ padding: '12px' }}>Realized P&L (USD)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderHistory.map((trade, idx) => (
                      <tr key={trade.id || idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '13px', color: '#ffffff' }}>
                        <td style={{ padding: '12px', color: '#9b9eac' }}>{new Date(trade.timestamp).toLocaleString()}</td>
                        <td style={{ padding: '12px', fontWeight: 700 }}>{trade.symbol}</td>
                        <td style={{ padding: '12px', fontWeight: 700, color: trade.action === 'BUY' ? '#00ff88' : '#ff4444' }}>{trade.action}</td>
                        <td style={{ padding: '12px' }}>{parseFloat(trade.quantity).toLocaleString()}</td>
                        <td style={{ padding: '12px' }}>
                          {trade.action === 'BUY' 
                            ? formatPrice(trade.price, trade.symbol) 
                            : (trade.buyPrice ? formatPrice(trade.buyPrice, trade.symbol) : '--')
                          }
                        </td>
                        <td style={{ padding: '12px' }}>
                          {trade.action === 'SELL' 
                            ? formatPrice(trade.price, trade.symbol) 
                            : '--'
                          }
                        </td>
                        <td style={{ padding: '12px', fontWeight: 700, color: parseFloat(trade.pnl) > 0 ? '#00ff88' : parseFloat(trade.pnl) < 0 ? '#ff4444' : '#ffffff' }}>
                          {trade.action === 'SELL' && parseFloat(trade.pnl) !== 0 
                            ? `$${parseFloat(trade.pnl).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                            : '--'
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Balance History Tab */}
          {activeConsoleTab === 'balance' && (
            <div style={{ overflowX: 'auto' }}>
              {balanceHistory.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 0', color: '#9b9eac' }}>
                  No balance events logged.
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', color: '#9b9eac', fontSize: '11px', textTransform: 'uppercase' }}>
                      <th style={{ padding: '12px' }}>Timestamp</th>
                      <th style={{ padding: '12px' }}>Event Type</th>
                      <th style={{ padding: '12px' }}>Change (USD)</th>
                      <th style={{ padding: '12px' }}>New Balance (USD)</th>
                      <th style={{ padding: '12px' }}>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {balanceHistory.map((item, idx) => {
                      const amount = parseFloat(item.amount);
                      const isNegative = amount < 0;
                      const isZero = amount === 0;
                      return (
                        <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '13px', color: '#ffffff' }}>
                          <td style={{ padding: '12px', color: '#9b9eac' }}>{new Date(item.timestamp).toLocaleString()}</td>
                          <td style={{ padding: '12px', fontWeight: 700, color: '#00bcd4' }}>{item.type}</td>
                          <td style={{ padding: '12px', fontWeight: 700, color: isZero ? '#ffffff' : isNegative ? '#ff4444' : '#00ff88' }}>
                            {isZero ? '--' : `${isNegative ? '-' : '+'}$${Math.abs(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                          </td>
                          <td style={{ padding: '12px', fontWeight: 600 }}>
                            ${parseFloat(item.newBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td style={{ padding: '12px', color: '#e0e0e0' }}>{item.description}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Rankings Leaderboard Tab */}
          {activeConsoleTab === 'leaderboard' && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', color: '#9b9eac', fontSize: '11px', textTransform: 'uppercase' }}>
                    <th style={{ padding: '12px', width: '80px' }}>Rank</th>
                    <th style={{ padding: '12px' }}>Name</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Total Valuation (USD)</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((user, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '13px', color: '#ffffff' }}>
                      <td style={{ padding: '12px', fontWeight: 700, color: idx === 0 ? '#ffb300' : idx === 1 ? '#e0e0e0' : idx === 2 ? '#cd7f32' : '#9b9eac' }}>
                        #{idx + 1}
                      </td>
                      <td style={{ padding: '12px', fontWeight: 600 }}>{user.name}</td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 700, color: '#00ff88' }}>
                        ${parseFloat(user.virtualBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
