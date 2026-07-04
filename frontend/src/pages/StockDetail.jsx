import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { apiClient } from '../services/api';
import { createChart, CandlestickSeries, LineSeries, createSeriesMarkers } from 'lightweight-charts';
import { 
  TrendingUp, Activity, Play, RefreshCw, BarChart2, 
  Settings, Award, ShieldAlert, CheckCircle, ChevronRight, HelpCircle, Sparkles
} from 'lucide-react';

export default function StockDetail() {
  const { symbol } = useParams();
  const tvContainerRef = useRef(null);

  // UI Tabs: 'tradingview' or 'algo'
  const [activeTab, setActiveTab] = useState('tradingview');
  
  // Historical data states
  const [history, setHistory] = useState([]);
  const [stockInfo, setStockInfo] = useState({ price: 0, changePercent: 0 });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Strategy Configurations (Compound Rules AND/OR logic)
  const [buyConditions, setBuyConditions] = useState([
    { indicator: 'RSI', operator: 'lessThan', targetType: 'value', targetValue: 35, targetIndicator: 'SMA20' }
  ]);
  const [buyLogicGate, setBuyLogicGate] = useState('AND');

  const [sellConditions, setSellConditions] = useState([
    { indicator: 'RSI', operator: 'greaterThan', targetType: 'value', targetValue: 65, targetIndicator: 'SMA20' }
  ]);
  const [sellLogicGate, setSellLogicGate] = useState('AND');

  // Automatic parameter optimizer state
  const [optimizationResult, setOptimizationResult] = useState(null);
  const [optimizing, setOptimizing] = useState(false);

  // Lightweight Charts Refs
  const priceChartContainerRef = useRef(null);
  const rsiChartContainerRef = useRef(null);
  const priceSeriesRef = useRef(null);
  const sma20SeriesRef = useRef(null);
  const sma50SeriesRef = useRef(null);
  const rsiSeriesRef = useRef(null);
  const priceChartRef = useRef(null);
  const rsiChartRef = useRef(null);

  // Risk Management
  const [stopLossPct, setStopLossPct] = useState(5);      // % below entry price, 0 = disabled
  const [takeProfitPct, setTakeProfitPct] = useState(10); // % above entry price, 0 = disabled
  const [trendFilter, setTrendFilter] = useState(false);  // only buy when price > SMA50

  // Backtest Configurations & Parameters
  const [chartInterval, setChartInterval] = useState('1d');       // '1m', '5m', '1d'
  const [timeRange, setTimeRange] = useState('3mo');             // range adapts to interval (e.g. '1d' for '1m')
  const [tradeDirection, setTradeDirection] = useState('long');   // 'long' (buy first) or 'short' (sell first)
  const [strategyExplanation, setStrategyExplanation] = useState('');

  const handleIntervalChange = (newInterval) => {
    setChartInterval(newInterval);
    if (newInterval === '1m') {
      setTimeRange('1d');
    } else if (newInterval === '5m') {
      setTimeRange('5d');
    } else {
      setTimeRange('3mo');
    }
  };

  // Backtest Results
  const [signals, setSignals] = useState([]); 
  const [trades, setTrades] = useState([]);
  const [performance, setPerformance] = useState(null);

  // Interactive Hover Crosshair
  const [hoverIndex, setHoverIndex] = useState(null);

  // ─── Smart TradingView Symbol Resolver ───
  // Maps Yahoo Finance symbols to correct TradingView exchange:ticker format
  const resolveTVSymbol = (rawSymbol) => {
    const s = rawSymbol.toUpperCase();

    // Indian Indices
    if (s === '^NSEI' || s === 'NSEI' || s === 'NIFTY' || s === 'NIFTY50') return 'NSE:NIFTY';
    if (s === '^BSESN' || s === 'BSESN' || s === 'SENSEX') return 'BSE:SENSEX';
    if (s === '^NSEBANK' || s === 'NSEBANK' || s === 'BANKNIFTY') return 'NSE:BANKNIFTY';
    if (s === '^CNXIT' || s === 'CNXIT' || s === 'NIFTYIT') return 'NSE:CNXIT';

    // Crypto — map to Binance/Coinbase for best coverage
    const cryptoBase = s.replace('-USD', '').replace('-USDT', '');
    const cryptoMap = {
      'BTC': 'BINANCE:BTCUSDT', 'ETH': 'BINANCE:ETHUSDT',
      'BNB': 'BINANCE:BNBUSDT', 'SOL': 'BINANCE:SOLUSDT',
      'XRP': 'BINANCE:XRPUSDT', 'DOGE': 'BINANCE:DOGEUSDT',
      'ADA': 'BINANCE:ADAUSDT', 'SHIB': 'BINANCE:SHIBUSDT',
      'AVAX': 'BINANCE:AVAXUSDT', 'TRX': 'BINANCE:TRXUSDT',
    };
    if (cryptoMap[cryptoBase]) return cryptoMap[cryptoBase];
    if (s.includes('USD') && (s.includes('-') || s.includes('USDT'))) {
      return `BINANCE:${cryptoBase}USDT`;
    }

    // Forex — map to FX prefix
    if (s.endsWith('=X') || s.endsWith('USD') || s.endsWith('INR') || s.includes('USD') || s.includes('EUR') || s.includes('GBP')) {
      const pair = s.replace('=X', '').replace('-', '').replace('/', '');
      if (pair.length === 6) {
        return `FX:${pair}`;
      }
    }

    // US Equities
    const usTickers = ['AAPL', 'MSFT', 'TSLA', 'GOOG', 'AMZN', 'META', 'NFLX', 'NVDA', 'AMD', 'INTC', 'COIN', 'MSTR'];
    const cleanSym = s.replace('.NS', '').replace('.BO', '');
    if (usTickers.includes(cleanSym)) {
      return `NASDAQ:${cleanSym}`;
    }

    if (rawSymbol.endsWith('.BO')) return `BSE:${cleanSym}`;

    // Default: Indian NSE equity
    return `NSE:${cleanSym}`;
  };

  // Load TV Widget once when symbol changes
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      if (tvContainerRef.current) {
        const tvSymbol = resolveTVSymbol(symbol);

        // Clear existing widget content if any
        tvContainerRef.current.innerHTML = '';

        new window.TradingView.widget({
          container_id: tvContainerRef.current.id,
          symbol: tvSymbol,
          interval: 'D',
          timezone: 'Asia/Kolkata',
          theme: 'dark',
          style: '1',
          locale: 'in',
          toolbar_bg: '#101427',
          enable_publishing: false,
          hide_top_toolbar: false,
          width: '100%',
          height: 520,
          studies: ['RSI@tv-basicstudies', 'MACD@tv-basicstudies']
        });
      }
    };
    document.head.appendChild(script);
    return () => {
      try {
        document.head.removeChild(script);
      } catch (e) {}
    };
  }, [symbol]);

  // Fetch Stock History
  const fetchStockData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const histRes = await apiClient.get(`/market/stock-history/${symbol}?range=${timeRange}&interval=${chartInterval}`);
      setHistory(histRes.data);

      const nsSymbol = symbol.endsWith('.NS') ? symbol : `${symbol}.NS`;
      const quotesRes = await apiClient.get('/market/indices'); 
      const matched = quotesRes.data[nsSymbol] || quotesRes.data[symbol];
      if (matched && matched.price) {
        setStockInfo({
          price: matched.price,
          changePercent: matched.changePercent
        });
      } else if (histRes.data.length > 0) {
        const latest = histRes.data[histRes.data.length - 1];
        const prev = histRes.data[histRes.data.length - 2] || latest;
        const changePct = prev.close ? ((latest.close - prev.close) / prev.close) * 100 : 0;
        setStockInfo({
          price: latest.close,
          changePercent: changePct
        });
      }
    } catch (err) {
      console.error('Error fetching stock data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Fetch initial data
    fetchStockData();
    setOptimizationResult(null); // reset optimization when settings/stock changes

    // Start silent polling for live updates every 10 seconds
    const intervalId = setInterval(() => {
      fetchStockData(true);
    }, 10000);

    return () => clearInterval(intervalId);
  }, [symbol, timeRange, chartInterval]);

  // Math functions for indicator values
  const computeIndicators = () => {
    if (history.length === 0) return { sma20: [], sma50: [], rsi14: [] };

    // 1. Calculate SMA 20
    const sma20 = new Array(history.length).fill(null);
    for (let i = 19; i < history.length; i++) {
      let sum = 0;
      for (let j = 0; j < 20; j++) sum += history[i - j].close;
      sma20[i] = parseFloat((sum / 20).toFixed(2));
    }

    // 2. Calculate SMA 50
    const sma50 = new Array(history.length).fill(null);
    for (let i = 49; i < history.length; i++) {
      let sum = 0;
      for (let j = 0; j < 50; j++) sum += history[i - j].close;
      sma50[i] = parseFloat((sum / 50).toFixed(2));
    }

    // 3. Calculate RSI 14
    const rsi14 = new Array(history.length).fill(null);
    if (history.length > 14) {
      let gains = 0;
      let losses = 0;

      for (let i = 1; i <= 14; i++) {
        const diff = history[i].close - history[i - 1].close;
        if (diff > 0) gains += diff;
        else losses -= diff;
      }

      let avgGain = gains / 14;
      let avgLoss = losses / 14;
      rsi14[14] = avgLoss === 0 ? 100 : parseFloat((100 - (100 / (1 + avgGain / avgLoss))).toFixed(2));

      for (let i = 15; i < history.length; i++) {
        const diff = history[i].close - history[i - 1].close;
        const gain = diff > 0 ? diff : 0;
        const loss = diff < 0 ? -diff : 0;

        avgGain = (avgGain * 13 + gain) / 14;
        avgLoss = (avgLoss * 13 + loss) / 14;

        rsi14[i] = avgLoss === 0 ? 100 : parseFloat((100 - (100 / (1 + avgGain / avgLoss))).toFixed(2));
      }
    }

    return { sma20, sma50, rsi14 };
  };

  // Run Strategy Engine
  const runBacktest = () => {
    if (history.length === 0) return;

    const indicators = computeIndicators();
    const sma20 = indicators.sma20;
    const sma50 = indicators.sma50;
    const rsi   = indicators.rsi14;

    const generatedSignals = new Array(history.length).fill(null);
    const executedTrades   = [];
    let activeTrade = null;

    const getValue = (indicator, idx) => {
      if (indicator === 'Price') return history[idx].close;
      if (indicator === 'SMA20') return sma20[idx];
      if (indicator === 'SMA50') return sma50[idx];
      if (indicator === 'RSI')   return rsi[idx];
      return null;
    };

    const formatBarDate = (timeMs) => {
      const dateObj = new Date(timeMs);
      if (chartInterval === '1d') {
        return dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      } else {
        const dateStr = dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
        const timeStr = dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
        return `${dateStr}, ${timeStr}`;
      }
    };

    const evaluateSingleCondition = (cond, idx) => {
      if (idx === 0) return false;
      const currVal = getValue(cond.indicator, idx);
      const prevVal = getValue(cond.indicator, idx - 1);

      let targetVal, prevTargetVal;
      if (cond.targetType === 'value') {
        targetVal     = parseFloat(cond.targetValue);
        prevTargetVal = targetVal;
      } else {
        targetVal     = getValue(cond.targetIndicator, idx);
        prevTargetVal = getValue(cond.targetIndicator, idx - 1);
      }

      if (currVal === null || prevVal === null || targetVal === null || isNaN(targetVal)) return false;

      switch (cond.operator) {
        case 'lessThan':    return currVal < targetVal;
        case 'greaterThan': return currVal > targetVal;
        case 'crossesBelow':
          return (prevVal >= (prevTargetVal ?? targetVal)) && currVal < targetVal;
        case 'crossesAbove':
          return (prevVal <= (prevTargetVal ?? targetVal)) && currVal > targetVal;
        default: return false;
      }
    };

    const isLong = tradeDirection === 'long';

    // ─── Walk through every candle/bar ───
    for (let i = 20; i < history.length; i++) {
      const price = history[i].close;

      const buyTriggered = buyLogicGate === 'AND'
        ? buyConditions.every(c => evaluateSingleCondition(c, i))
        : buyConditions.some(c => evaluateSingleCondition(c, i));

      const sellTriggered = sellLogicGate === 'AND'
        ? sellConditions.every(c => evaluateSingleCondition(c, i))
        : sellConditions.some(c => evaluateSingleCondition(c, i));

      if (!activeTrade) {
        // ─── Trend Filter Rule ───
        // For LONG: only buy if price is ABOVE SMA50
        // For SHORT: only sell if price is BELOW SMA50
        if (trendFilter && sma50[i] !== null) {
          if (isLong && price < sma50[i]) continue;
          if (!isLong && price > sma50[i]) continue;
        }

        const entryTriggered = isLong ? buyTriggered : sellTriggered;

        if (entryTriggered) {
          generatedSignals[i] = isLong ? 'BUY' : 'SELL';
          activeTrade = {
            entryIndex: i,
            entryDate:  formatBarDate(history[i].time),
            entryPrice: price,
          };
        }
      } else {
        // PnL calculation:
        // For LONG: (Price - EntryPrice) / EntryPrice
        // For SHORT: (EntryPrice - Price) / EntryPrice
        const rawPnL = isLong 
          ? (price - activeTrade.entryPrice) / activeTrade.entryPrice
          : (activeTrade.entryPrice - price) / activeTrade.entryPrice;
        const pnlPct = rawPnL * 100;

        // ─── Stop Loss & Take Profit ───
        const slHit = stopLossPct > 0 && pnlPct <= -Math.abs(stopLossPct);
        const tpHit = takeProfitPct > 0 && pnlPct >= Math.abs(takeProfitPct);

        const exitTriggered = isLong ? sellTriggered : buyTriggered;

        if (slHit || tpHit || exitTriggered) {
          const exitReason = slHit ? 'Stop Loss' : tpHit ? 'Take Profit' : 'Signal';
          generatedSignals[i] = isLong ? 'SELL' : 'BUY';
          executedTrades.push({
            ...activeTrade,
            exitIndex:  i,
            exitDate:   formatBarDate(history[i].time),
            exitPrice:  price,
            pnl:        parseFloat(pnlPct.toFixed(2)),
            duration:   i - activeTrade.entryIndex,
            exitReason,
          });
          activeTrade = null;
        }
      }
    }

    // ─── Auto-close any open position at period end ───
    if (activeTrade !== null) {
      const lastIdx  = history.length - 1;
      const lastPrice = history[lastIdx].close;
      const rawPnL = isLong 
        ? (lastPrice - activeTrade.entryPrice) / activeTrade.entryPrice
        : (activeTrade.entryPrice - lastPrice) / activeTrade.entryPrice;
      const pnl = rawPnL * 100;

      executedTrades.push({
        ...activeTrade,
        exitIndex:  lastIdx,
        exitDate:   formatBarDate(history[lastIdx].time),
        exitPrice:  lastPrice,
        pnl:        parseFloat(pnl.toFixed(2)),
        duration:   lastIdx - activeTrade.entryIndex,
        exitReason: 'Period End',
        isOpen:     true,
      });
    }

    setSignals(generatedSignals);
    setTrades(executedTrades);

    // ─── Compute rich statistics and build summary narrative ───
    if (executedTrades.length > 0) {
      const wins   = executedTrades.filter(t => t.pnl > 0);
      const losses = executedTrades.filter(t => t.pnl <= 0);
      const netReturn = executedTrades.reduce((acc, t) => acc + t.pnl, 0);
      const avgDuration = Math.round(executedTrades.reduce((a, t) => a + (t.duration || 0), 0) / executedTrades.length);
      const bestTrade  = Math.max(...executedTrades.map(t => t.pnl));
      const worstTrade = Math.min(...executedTrades.map(t => t.pnl));

      let runningPnl = 0, peak = 0, maxDrawdown = 0;
      executedTrades.forEach(t => {
        runningPnl += t.pnl;
        if (runningPnl > peak) peak = runningPnl;
        const dd = peak - runningPnl;
        if (dd > maxDrawdown) maxDrawdown = dd;
      });

      const winRateVal = parseFloat(((wins.length / executedTrades.length) * 100).toFixed(1));

      setPerformance({
        totalTrades:  executedTrades.length,
        wins:         wins.length,
        losses:       losses.length,
        winRate:      winRateVal,
        netReturn:    parseFloat(netReturn.toFixed(1)),
        avgDuration,
        bestTrade:    parseFloat(bestTrade.toFixed(2)),
        worstTrade:   parseFloat(worstTrade.toFixed(2)),
        maxDrawdown:  parseFloat(maxDrawdown.toFixed(1)),
      });

      // Generate clean summary text
      const timeStrMap = {
        '1d': '1 Day',
        '5d': '5 Days',
        '7d': '7 Days',
        '1mo': '1 Month',
        '3mo': '3 Months',
        '6mo': '6 Months',
        '1y': '1 Year'
      };
      const timeStr = timeStrMap[timeRange] || timeRange;
      const durationUnit = chartInterval === '1d' ? 'days' : chartInterval === '5m' ? 'bars (5-min)' : 'bars (1-min)';
      const performanceType = netReturn >= 0 ? 'net positive return' : 'net negative return';
      setStrategyExplanation(
        `During the backtest over the last ${timeStr} with a ${chartInterval === '1d' ? 'Daily' : chartInterval} resolution, the ${tradeDirection.toUpperCase()} strategy was executed ${executedTrades.length} times. The strategy finished with a ${performanceType} of ${netReturn.toFixed(1)}%. Out of the total executions, the strategy saw ${wins.length} profitable outcomes and ${losses.length} unprofitable outcomes, resulting in a Win Rate of ${winRateVal}%. The positions were held for an average of ${avgDuration} ${durationUnit}. The maximum drawdown peak-to-trough experienced during the period was -${maxDrawdown.toFixed(1)}%, with the most successful position capturing +${bestTrade.toFixed(2)}% and the least successful losing ${worstTrade.toFixed(2)}%.`
      );
    } else {
      setPerformance({ totalTrades: 0, wins: 0, losses: 0, winRate: 0, netReturn: 0, avgDuration: 0, bestTrade: 0, worstTrade: 0, maxDrawdown: 0 });
      setStrategyExplanation(
        `Over the selected backtesting window, no trade entries were triggered. This indicates that the entry criteria did not occur in the historical price series, or were filtered out by the Trend Filter. Try modifying your indicator thresholds or disabling the Trend Filter to check if setups existed.`
      );
    }
  };

  // Run backtest automatically on config/history load
  useEffect(() => {
    if (history.length > 0) runBacktest();
  }, [
    history,
    buyConditions, buyLogicGate,
    sellConditions, sellLogicGate,
    stopLossPct, takeProfitPct, trendFilter, tradeDirection
  ]);

  // Automatic Strategy Parameter Optimizer
  const runStrategyOptimizer = () => {
    if (history.length === 0) return;
    setOptimizing(true);

    setTimeout(() => {
      let bestReturn = -Infinity;
      let bestConfig = null;

      // Candidate parameter sweeps
      const slCandidates = [0, 1, 1.5, 2, 3, 5, 7];
      const tpCandidates = [0, 2, 3, 5, 8, 10, 12, 15];
      const tfCandidates = [true, false];

      const indicators = computeIndicators();
      const sma20 = indicators.sma20;
      const sma50 = indicators.sma50;
      const rsi   = indicators.rsi14;

      const getValue = (indicator, idx) => {
        if (indicator === 'Price') return history[idx].close;
        if (indicator === 'SMA20') return sma20[idx];
        if (indicator === 'SMA50') return sma50[idx];
        if (indicator === 'RSI')   return rsi[idx];
        return null;
      };

      const evaluateSingleCondition = (cond, idx) => {
        if (idx === 0) return false;
        const currVal = getValue(cond.indicator, idx);
        const prevVal = getValue(cond.indicator, idx - 1);
        let targetVal, prevTargetVal;
        if (cond.targetType === 'value') {
          targetVal     = parseFloat(cond.targetValue);
          prevTargetVal = targetVal;
        } else {
          targetVal     = getValue(cond.targetIndicator, idx);
          prevTargetVal = getValue(cond.targetIndicator, idx - 1);
        }
        if (currVal === null || prevVal === null || targetVal === null || isNaN(targetVal)) return false;

        switch (cond.operator) {
          case 'lessThan':    return currVal < targetVal;
          case 'greaterThan': return currVal > targetVal;
          case 'crossesBelow':
            return (prevVal >= (prevTargetVal ?? targetVal)) && currVal < targetVal;
          case 'crossesAbove':
            return (prevVal <= (prevTargetVal ?? targetVal)) && currVal > targetVal;
          default: return false;
        }
      };

      const isLong = tradeDirection === 'long';

      // Sweep through combinations in memory
      for (const sl of slCandidates) {
        for (const tp of tpCandidates) {
          for (const tf of tfCandidates) {
            
            let activeTrade = null;
            let netReturn = 0;
            let tradesCount = 0;

            for (let i = 20; i < history.length; i++) {
              const price = history[i].close;

              const buyTriggered = buyLogicGate === 'AND'
                ? buyConditions.every(c => evaluateSingleCondition(c, i))
                : buyConditions.some(c => evaluateSingleCondition(c, i));

              const sellTriggered = sellLogicGate === 'AND'
                ? sellConditions.every(c => evaluateSingleCondition(c, i))
                : sellConditions.some(c => evaluateSingleCondition(c, i));

              if (!activeTrade) {
                if (tf && sma50[i] !== null) {
                  if (isLong && price < sma50[i]) continue;
                  if (!isLong && price > sma50[i]) continue;
                }

                const entryTriggered = isLong ? buyTriggered : sellTriggered;

                if (entryTriggered) {
                  activeTrade = { entryPrice: price };
                }
              } else {
                const rawPnL = isLong 
                  ? (price - activeTrade.entryPrice) / activeTrade.entryPrice
                  : (activeTrade.entryPrice - price) / activeTrade.entryPrice;
                const pnlPct = rawPnL * 100;

                const slHit = sl > 0 && pnlPct <= -Math.abs(sl);
                const tpHit = tp > 0 && pnlPct >= Math.abs(tp);

                const exitTriggered = isLong ? sellTriggered : buyTriggered;

                if (slHit || tpHit || exitTriggered) {
                  netReturn += pnlPct;
                  tradesCount++;
                  activeTrade = null;
                }
              }
            }

            if (activeTrade !== null) {
              const lastPrice = history[history.length - 1].close;
              const rawPnL = isLong 
                ? (lastPrice - activeTrade.entryPrice) / activeTrade.entryPrice
                : (activeTrade.entryPrice - lastPrice) / activeTrade.entryPrice;
              netReturn += rawPnL * 100;
              tradesCount++;
            }

            if (tradesCount > 0 && netReturn > bestReturn) {
              bestReturn = netReturn;
              bestConfig = { stopLoss: sl, takeProfit: tp, trendFilter: tf, netReturn };
            }
          }
        }
      }

      setOptimizing(false);
      if (bestConfig) {
        setOptimizationResult(bestConfig);
      } else {
        setOptimizationResult({ noResult: true });
      }
    }, 150);
  };

  // Lightweight Charts Initialization and Synced Panning/Zooming
  useEffect(() => {
    if (activeTab !== 'algo' || history.length === 0 || !priceChartContainerRef.current || !rsiChartContainerRef.current) {
      return;
    }

    // 1. Clean up existing charts
    if (priceChartRef.current) {
      try { priceChartRef.current.remove(); } catch(e){}
      priceChartRef.current = null;
    }
    if (rsiChartRef.current) {
      try { rsiChartRef.current.remove(); } catch(e){}
      rsiChartRef.current = null;
    }

    const chartTheme = {
      layout: {
        background: { color: '#0a0e27' },
        textColor: '#9b9eaf',
        fontSize: 10,
        fontFamily: 'Inter, sans-serif',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.02)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.02)' },
      },
      crosshair: {
        mode: 0,
      },
    };

    // 2. Create Price Chart
    const priceChart = createChart(priceChartContainerRef.current, {
      ...chartTheme,
      height: 280,
      timeScale: {
        visible: false,
      },
    });
    priceChartRef.current = priceChart;

    const candlestickSeries = priceChart.addSeries(CandlestickSeries, {
      upColor: '#00ff88',
      downColor: '#ff4444',
      borderVisible: false,
      wickUpColor: '#00ff88',
      wickDownColor: '#ff4444',
    });
    priceSeriesRef.current = candlestickSeries;

    const sma20Series = priceChart.addSeries(LineSeries, {
      color: '#00bcd4',
      lineWidth: 1.5,
    });
    sma20SeriesRef.current = sma20Series;

    const sma50Series = priceChart.addSeries(LineSeries, {
      color: '#ffb300',
      lineWidth: 1.5,
    });
    sma50SeriesRef.current = sma50Series;

    // 3. Create RSI Chart
    const rsiChart = createChart(rsiChartContainerRef.current, {
      ...chartTheme,
      height: 110,
      timeScale: {
        visible: true,
        timeVisible: chartInterval !== '1d',
        secondsVisible: false,
      },
    });
    rsiChartRef.current = rsiChart;

    const rsiLineSeries = rsiChart.addSeries(LineSeries, {
      color: '#e040fb',
      lineWidth: 1.5,
    });
    rsiSeriesRef.current = rsiLineSeries;

    // RSI bounds lines (30, 70)
    rsiLineSeries.createPriceLine({
      price: 70,
      color: 'rgba(255, 68, 68, 0.3)',
      lineWidth: 1,
      lineStyle: 2,
      axisLabelVisible: true,
      title: '70',
    });
    rsiLineSeries.createPriceLine({
      price: 30,
      color: 'rgba(0, 255, 136, 0.3)',
      lineWidth: 1,
      lineStyle: 2,
      axisLabelVisible: true,
      title: '30',
    });

    // 4. Map & Format historical data
    const seenTimes = new Set();
    const formattedHistory = [];
    const formattedSma20 = [];
    const formattedSma50 = [];
    const formattedRsi = [];

    const indicators = computeIndicators();

    for (let i = 0; i < history.length; i++) {
      const candle = history[i];
      const timeSec = Math.floor(candle.time / 1000);
      if (seenTimes.has(timeSec)) continue;
      seenTimes.add(timeSec);

      formattedHistory.push({
        time: timeSec,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
      });

      if (indicators.sma20[i] !== null && !isNaN(indicators.sma20[i])) {
        formattedSma20.push({ time: timeSec, value: parseFloat(indicators.sma20[i]) });
      }
      if (indicators.sma50[i] !== null && !isNaN(indicators.sma50[i])) {
        formattedSma50.push({ time: timeSec, value: parseFloat(indicators.sma50[i]) });
      }
      if (indicators.rsi14[i] !== null && !isNaN(indicators.rsi14[i])) {
        formattedRsi.push({ time: timeSec, value: parseFloat(indicators.rsi14[i]) });
      }
    }

    candlestickSeries.setData(formattedHistory);
    sma20Series.setData(formattedSma20);
    sma50Series.setData(formattedSma50);
    rsiLineSeries.setData(formattedRsi);

    // 5. Draw Signals as interactive markers
    const markers = [];
    for (let i = 0; i < history.length; i++) {
      if (signals[i] === 'BUY') {
        const timeSec = Math.floor(history[i].time / 1000);
        markers.push({
          time: timeSec,
          position: 'belowBar',
          color: '#00ff88',
          shape: 'arrowUp',
          text: 'BUY',
        });
      } else if (signals[i] === 'SELL') {
        const timeSec = Math.floor(history[i].time / 1000);
        markers.push({
          time: timeSec,
          position: 'aboveBar',
          color: '#ff4444',
          shape: 'arrowDown',
          text: 'SELL',
        });
      }
    }
    createSeriesMarkers(candlestickSeries, markers);

    // 6. Synchronize Zoom/Pan ranges
    let isSyncing = false;
    const priceTimeScale = priceChart.timeScale();
    const rsiTimeScale = rsiChart.timeScale();

    priceTimeScale.subscribeVisibleLogicalRangeChange((range) => {
      if (isSyncing || !range) return;
      isSyncing = true;
      rsiTimeScale.setVisibleLogicalRange(range);
      isSyncing = false;
    });

    rsiTimeScale.subscribeVisibleLogicalRangeChange((range) => {
      if (isSyncing || !range) return;
      isSyncing = true;
      priceTimeScale.setVisibleLogicalRange(range);
      isSyncing = false;
    });

    // Fit content
    priceTimeScale.fitContent();
    rsiTimeScale.fitContent();

    return () => {
      if (priceChartRef.current) {
        try { priceChartRef.current.remove(); } catch(e){}
        priceChartRef.current = null;
      }
      if (rsiChartRef.current) {
        try { rsiChartRef.current.remove(); } catch(e){}
        rsiChartRef.current = null;
      }
    };
  }, [history, signals, activeTab, chartInterval]);

  // Strategy Presets Loader
  const applyPreset = (presetType) => {
    if (presetType === 'rsi_reversion') {
      setChartInterval('1d'); setTimeRange('3mo'); setTradeDirection('long');
      setBuyConditions([{ indicator: 'RSI', operator: 'lessThan', targetType: 'value', targetValue: 35, targetIndicator: 'SMA20' }]);
      setBuyLogicGate('AND');
      setSellConditions([{ indicator: 'RSI', operator: 'greaterThan', targetType: 'value', targetValue: 65, targetIndicator: 'SMA20' }]);
      setSellLogicGate('AND');
      setStopLossPct(7); setTakeProfitPct(12); setTrendFilter(false);
    } else if (presetType === 'sma_crossover') {
      setChartInterval('1d'); setTimeRange('3mo'); setTradeDirection('long');
      setBuyConditions([{ indicator: 'Price', operator: 'crossesAbove', targetType: 'indicator', targetValue: 0, targetIndicator: 'SMA20' }]);
      setBuyLogicGate('AND');
      setSellConditions([{ indicator: 'Price', operator: 'crossesBelow', targetType: 'indicator', targetValue: 0, targetIndicator: 'SMA20' }]);
      setSellLogicGate('AND');
      setStopLossPct(5); setTakeProfitPct(10); setTrendFilter(false);
    } else if (presetType === 'intraday_scalper') {
      // 5-Min Quick Scalper (Long Mean Reversion)
      setChartInterval('5m'); setTimeRange('5d'); setTradeDirection('long');
      setBuyConditions([{ indicator: 'RSI', operator: 'lessThan', targetType: 'value', targetValue: 30, targetIndicator: 'SMA20' }]);
      setBuyLogicGate('AND');
      setSellConditions([{ indicator: 'RSI', operator: 'greaterThan', targetType: 'value', targetValue: 70, targetIndicator: 'SMA20' }]);
      setSellLogicGate('AND');
      setStopLossPct(1.5); setTakeProfitPct(3.0); setTrendFilter(false);
    } else if (presetType === 'intraday_trend_rider') {
      // Intraday Trend Rider (Momentum Alignment: Buy above SMA50, trigger on SMA20 crosses)
      setChartInterval('5m'); setTimeRange('5d'); setTradeDirection('long');
      setBuyConditions([{ indicator: 'Price', operator: 'crossesAbove', targetType: 'indicator', targetValue: 0, targetIndicator: 'SMA20' }]);
      setBuyLogicGate('AND');
      setSellConditions([{ indicator: 'Price', operator: 'crossesBelow', targetType: 'indicator', targetValue: 0, targetIndicator: 'SMA20' }]);
      setSellLogicGate('AND');
      setStopLossPct(2.0); setTakeProfitPct(5.0); setTrendFilter(true); // Must align with SMA50
    } else if (presetType === 'intraday_short_scalp') {
      // Short Seller Scalper (Counter-Trend shorting in Downtrends)
      setChartInterval('5m'); setTimeRange('5d'); setTradeDirection('short');
      // For short: entry rule is Sell rule (RSI overbought), exit rule is Buy rule (RSI oversold)
      setBuyConditions([{ indicator: 'RSI', operator: 'lessThan', targetType: 'value', targetValue: 30, targetIndicator: 'SMA20' }]);
      setBuyLogicGate('AND');
      setSellConditions([{ indicator: 'RSI', operator: 'greaterThan', targetType: 'value', targetValue: 70, targetIndicator: 'SMA20' }]);
      setSellLogicGate('AND');
      setStopLossPct(1.5); setTakeProfitPct(3.0); setTrendFilter(true); // Short only if Price < SMA50
    }
  };

  // Coordinate math helpers for SVG plot
  const svgWidth = 720;
  const svgHeight = 280;
  const rsiSvgHeight = 100;
  
  const paddingLeft = 45;
  const paddingRight = 15;
  const paddingTop = 20;
  const paddingBottom = 25;

  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;
  const rsiChartHeight = rsiSvgHeight - 20 - 20; // top/bottom padding 20

  const minPrice = history.length > 0 ? Math.min(...history.map(h => h.low)) * 0.985 : 0;
  const maxPrice = history.length > 0 ? Math.max(...history.map(h => h.high)) * 1.015 : 100;

  const getYCoord = (price) => {
    return svgHeight - paddingBottom - ((price - minPrice) / (maxPrice - minPrice)) * chartHeight;
  };

  const getRsiYCoord = (rsiVal) => {
    // RSI scales 0 to 100
    const val = rsiVal === null ? 50 : rsiVal;
    return rsiSvgHeight - 20 - (val / 100) * rsiChartHeight;
  };

  const getXCoord = (index) => {
    if (history.length <= 1) return paddingLeft;
    return paddingLeft + (index / (history.length - 1)) * chartWidth;
  };

  // Render SVG Indicator lines
  const indicators = computeIndicators();

  const getLinePath = (values) => {
    const points = [];
    for (let i = 0; i < values.length; i++) {
      if (values[i] !== null) {
        points.push(`${getXCoord(i)},${getYCoord(values[i])}`);
      }
    }
    return points.length > 0 ? `M ${points.join(' L ')}` : '';
  };

  const getRsiLinePath = (values) => {
    const points = [];
    for (let i = 0; i < values.length; i++) {
      if (values[i] !== null) {
        points.push(`${getXCoord(i)},${getRsiYCoord(values[i])}`);
      }
    }
    return points.length > 0 ? `M ${points.join(' L ')}` : '';
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Title stock metadata block */}
      <div style={{
        background: 'var(--bg-card-glass)',
        border: '1px solid var(--border-color)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#00ff88', fontWeight: '700' }}>
            <Activity size={14} />
            TRADING WORKSPACE
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)', marginTop: '4px' }}>
            {symbol.toUpperCase()} Analytics Panel
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>LIVE SPOT PRICE</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', marginTop: '2px' }}>
              ₹{stockInfo.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>DAILY MOMENTUM</div>
            <div style={{ 
              fontSize: '18px', 
              fontWeight: '700', 
              color: stockInfo.changePercent >= 0 ? '#00ff88' : '#ff4444', 
              marginTop: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '4px'
            }}>
              {stockInfo.changePercent >= 0 ? '+' : ''}{stockInfo.changePercent.toFixed(2)}%
            </div>
          </div>
        </div>
      </div>

      {/* Tabs pills */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <button
          onClick={() => setActiveTab('tradingview')}
          style={{
            padding: '12px 20px',
            background: activeTab === 'tradingview' ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255, 255, 255, 0.03)',
            border: `1px solid ${activeTab === 'tradingview' ? '#00ff88' : 'rgba(255, 255, 255, 0.08)'}`,
            borderRadius: '8px',
            color: activeTab === 'tradingview' ? '#00ff88' : 'var(--text-secondary)',
            fontSize: '14px',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: '0.2s'
          }}
        >
          <BarChart2 size={16} />
          Interactive TradingView Widget
        </button>

        <button
          onClick={() => setActiveTab('algo')}
          style={{
            padding: '12px 20px',
            background: activeTab === 'algo' ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255, 255, 255, 0.03)',
            border: `1px solid ${activeTab === 'algo' ? '#00ff88' : 'rgba(255, 255, 255, 0.08)'}`,
            borderRadius: '8px',
            color: activeTab === 'algo' ? '#00ff88' : 'var(--text-secondary)',
            fontSize: '14px',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: '0.2s'
          }}
        >
          <Settings size={16} />
          NonStock Algorithmic Strategy Lab
        </button>
      </div>

      {/* Tab Contents: Render both but toggle visibility to prevent script remnant overlay bugs */}
      
      {/* 1. TradingView Widget Block */}
      <div style={{
        display: activeTab === 'tradingview' ? 'block' : 'none',
        background: 'rgba(16, 20, 39, 0.95)',
        border: '1px solid var(--border-color)',
        borderRadius: '16px',
        padding: '16px',
        overflow: 'hidden',
        marginBottom: '24px'
      }}>
        <div id="tradingview-chart-element" ref={tvContainerRef} style={{ height: '520px', borderRadius: '8px' }}></div>
      </div>

      {/* 2. Custom Strategy Lab Block */}
      <div style={{ display: activeTab === 'algo' ? 'block' : 'none' }}>
        
        {/* Strategy Guide Note */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(0, 255, 136, 0.04) 0%, rgba(10, 14, 39, 0.6) 100%)',
          border: '1px solid rgba(0, 255, 136, 0.15)',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px'
        }}>
          <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#00ff88', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <HelpCircle size={16} />
            Educational Note: What is Algorithmic Strategy Backtesting?
          </h4>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.6' }}>
            Backtesting is the process of testing a trading strategy or mathematical algorithm on historical price data to evaluate its performance and viability before risking capital. 
            By setting **Buy** (Entry) and **Sell** (Exit) rules using indicators like **RSI** or **Simple Moving Averages (SMA)**, you can see where trades would have executed in the past, and measure key metrics like **Win Rate %** and **Net Return %**.
          </p>
        </div>

        {/* Algo workspace layout grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'stretch', marginBottom: '24px' }}>
          
          {/* Split Left: SVG Interactive Chart */}
          <div style={{
            background: 'var(--bg-card-glass)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '4px' }}>
                  NonStock Backtesting Canvas
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>
                  Overlaying Buy (▲) & Sell (▼) triggers on candlesticks, with SMA 20 (<span style={{ color: '#00bcd4' }}>■</span>) & SMA 50 (<span style={{ color: '#ffb300' }}>■</span>) lines.
                </p>
              </div>

              {/* Resolution, Timeframe & Direction Config selectors */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <span style={{ fontSize: '9px', color: 'var(--text-secondary)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Resolution</span>
                  <select 
                    value={chartInterval}
                    onChange={(e) => handleIntervalChange(e.target.value)}
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      color: '#ffffff',
                      fontSize: '11px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      outline: 'none'
                    }}
                  >
                    <option value="1m">1 Min Intraday</option>
                    <option value="5m">5 Min Intraday</option>
                    <option value="1d">Daily Chart</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <span style={{ fontSize: '9px', color: 'var(--text-secondary)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Simulation Range</span>
                  <select 
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value)}
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      color: '#ffffff',
                      fontSize: '11px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      outline: 'none'
                    }}
                  >
                    {chartInterval === '1m' && (
                      <>
                        <option value="1d">1 Day History</option>
                        <option value="5d">5 Days History</option>
                        <option value="7d">7 Days History</option>
                      </>
                    )}
                    {chartInterval === '5m' && (
                      <>
                        <option value="1d">1 Day History</option>
                        <option value="5d">5 Days History</option>
                        <option value="7d">7 Days History</option>
                        <option value="1mo">1 Month History</option>
                      </>
                    )}
                    {chartInterval === '1d' && (
                      <>
                        <option value="1mo">1 Month History</option>
                        <option value="3mo">3 Months History</option>
                        <option value="6mo">6 Months History</option>
                        <option value="1y">1 Year History</option>
                      </>
                    )}
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <span style={{ fontSize: '9px', color: 'var(--text-secondary)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Position style</span>
                  <select 
                    value={tradeDirection}
                    onChange={(e) => setTradeDirection(e.target.value)}
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      color: '#ffffff',
                      fontSize: '11px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      outline: 'none'
                    }}
                  >
                    <option value="long">Long (Buy First, Sell to Exit)</option>
                    <option value="short">Short (Sell First, Buy to Cover)</option>
                  </select>
                </div>
              </div>
            </div>

            <div style={{ display: 'none' }}>
              <div>
                
                {/* 1. Candlestick Chart */}
                <div style={{ position: 'relative' }}>
                  <svg 
                    width="100%" 
                    height={svgHeight} 
                    viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                    style={{ background: 'rgba(10, 14, 39, 0.4)', borderRadius: '10px' }}
                    onMouseMove={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const xPos = e.clientX - rect.left;
                      const relativeX = (xPos / rect.width) * svgWidth;
                      
                      if (relativeX >= paddingLeft && relativeX <= svgWidth - paddingRight) {
                        const fraction = (relativeX - paddingLeft) / chartWidth;
                        const idx = Math.min(history.length - 1, Math.max(0, Math.round(fraction * (history.length - 1))));
                        setHoverIndex(idx);
                      }
                    }}
                    onMouseLeave={() => setHoverIndex(null)}
                  >
                    {/* Vertical grid lines */}
                    {[0.25, 0.5, 0.75].map((p, idx) => (
                      <line 
                        key={idx}
                        x1={paddingLeft + p * chartWidth}
                        y1={paddingTop}
                        x2={paddingLeft + p * chartWidth}
                        y2={svgHeight - paddingBottom}
                        stroke="rgba(255, 255, 255, 0.05)"
                        strokeDasharray="4 4"
                      />
                    ))}

                    {/* Horizontal grid lines */}
                    {[0.25, 0.5, 0.75].map((p, idx) => {
                      const val = minPrice + p * (maxPrice - minPrice);
                      const y = getYCoord(val);
                      return (
                        <g key={idx}>
                          <line 
                            x1={paddingLeft}
                            y1={y}
                            x2={svgWidth - paddingRight}
                            y2={y}
                            stroke="rgba(255, 255, 255, 0.05)"
                            strokeDasharray="4 4"
                          />
                          <text 
                            x={paddingLeft - 8} 
                            y={y + 3} 
                            fill="var(--text-secondary)" 
                            fontSize="8" 
                            textAnchor="end"
                          >
                            ₹{Math.round(val)}
                          </text>
                        </g>
                      );
                    })}

                    {/* Render EMA 20 & EMA 50 line overlays if checked */}
                    <path 
                      d={getLinePath(indicators.sma20)} 
                      fill="none" 
                      stroke="#00bcd4" 
                      strokeWidth="1.2" 
                      opacity="0.8" 
                    />
                    <path 
                      d={getLinePath(indicators.sma50)} 
                      fill="none" 
                      stroke="#ffb300" 
                      strokeWidth="1.2" 
                      opacity="0.8" 
                    />

                    {/* Draw Candlesticks */}
                    {history.map((candle, idx) => {
                      const x = getXCoord(idx);
                      const candleWidth = chartWidth / history.length;
                      const isBullish = candle.close >= candle.open;
                      const color = isBullish ? '#00ff88' : '#ff4444';

                      const yOpen = getYCoord(candle.open);
                      const yClose = getYCoord(candle.close);
                      const yHigh = getYCoord(candle.high);
                      const yLow = getYCoord(candle.low);

                      const isSelected = hoverIndex === idx;

                      return (
                        <g key={idx}>
                          <line 
                            x1={x} 
                            y1={yHigh} 
                            x2={x} 
                            y2={yLow} 
                            stroke={color} 
                            strokeWidth={isSelected ? "1.8" : "1"} 
                          />
                          <rect
                            x={x - candleWidth * 0.35}
                            y={Math.min(yOpen, yClose)}
                            width={Math.max(2, candleWidth * 0.7)}
                            height={Math.max(2, Math.abs(yOpen - yClose))}
                            fill={color}
                            rx="1"
                            opacity={isSelected ? "1" : "0.8"}
                          />

                          {/* Buy Arrow Overlay */}
                          {signals[idx] === 'BUY' && (
                            <g>
                              <polygon 
                                points={`${x},${yLow + 18} ${x - 5},${yLow + 8} ${x + 5},${yLow + 8}`} 
                                fill="#00ff88" 
                              />
                              <text x={x} y={yLow + 28} fill="#00ff88" fontSize="7" fontWeight="800" textAnchor="middle">BUY</text>
                            </g>
                          )}

                          {/* Sell Arrow Overlay */}
                          {signals[idx] === 'SELL' && (
                            <g>
                              <polygon 
                                points={`${x},${yHigh - 18} ${x - 5},${yHigh - 8} ${x + 5},${yHigh - 8}`} 
                                fill="#ff4444" 
                              />
                              <text x={x} y={yHigh - 28} fill="#ff4444" fontSize="7" fontWeight="800" textAnchor="middle">SELL</text>
                            </g>
                          )}
                        </g>
                      );
                    })}

                    {/* Interactive crosshair line */}
                    {hoverIndex !== null && (
                      <g>
                        <line
                          x1={getXCoord(hoverIndex)}
                          y1={paddingTop}
                          x2={getXCoord(hoverIndex)}
                          y2={svgHeight - paddingBottom}
                          stroke="rgba(255, 255, 255, 0.25)"
                          strokeWidth="1.2"
                          strokeDasharray="2 2"
                        />
                        {/* Selected Tooltip Details */}
                        <rect 
                          x={getXCoord(hoverIndex) > svgWidth / 2 ? getXCoord(hoverIndex) - 150 : getXCoord(hoverIndex) + 12}
                          y="24"
                          width="130"
                          height="75"
                          fill="rgba(10, 14, 39, 0.92)"
                          stroke="rgba(0, 255, 136, 0.3)"
                          rx="6"
                        />
                        <text 
                          x={getXCoord(hoverIndex) > svgWidth / 2 ? getXCoord(hoverIndex) - 140 : getXCoord(hoverIndex) + 22}
                          y="42"
                          fill="#ffffff"
                          fontSize="9"
                          fontWeight="700"
                        >
                          Date: {new Date(history[hoverIndex].time).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </text>
                        <text 
                          x={getXCoord(hoverIndex) > svgWidth / 2 ? getXCoord(hoverIndex) - 140 : getXCoord(hoverIndex) + 22}
                          y="56"
                          fill="var(--text-secondary)"
                          fontSize="9"
                        >
                          Price: ₹{history[hoverIndex].close.toFixed(2)}
                        </text>
                        <text 
                          x={getXCoord(hoverIndex) > svgWidth / 2 ? getXCoord(hoverIndex) - 140 : getXCoord(hoverIndex) + 22}
                          y="70"
                          fill="#00bcd4"
                          fontSize="8"
                        >
                          SMA(20): {indicators.sma20[hoverIndex] || 'N/A'}
                        </text>
                        <text 
                          x={getXCoord(hoverIndex) > svgWidth / 2 ? getXCoord(hoverIndex) - 140 : getXCoord(hoverIndex) + 22}
                          y="82"
                          fill="#ffb300"
                          fontSize="8"
                        >
                          RSI(14): {indicators.rsi14[hoverIndex] || 'N/A'}
                        </text>
                      </g>
                    )}
                  </svg>
                </div>

                {/* 2. RSI Oscillator Sub-chart */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    <span>RSI Oscillator (14)</span>
                    <span style={{ color: '#e040fb', fontWeight: '700' }}>
                      {hoverIndex !== null && indicators.rsi14[hoverIndex] ? `RSI: ${indicators.rsi14[hoverIndex]}` : ''}
                    </span>
                  </div>
                  <svg
                    width="100%"
                    height={rsiSvgHeight}
                    viewBox={`0 0 ${svgWidth} ${rsiSvgHeight}`}
                    style={{ background: 'rgba(10, 14, 39, 0.4)', borderRadius: '10px' }}
                  >
                    {/* Horizontal Reference Lines (30, 50, 70) */}
                    <line x1={paddingLeft} y1={getRsiYCoord(70)} x2={svgWidth - paddingRight} y2={getRsiYCoord(70)} stroke="rgba(255, 68, 68, 0.25)" strokeDasharray="3 3" />
                    <line x1={paddingLeft} y1={getRsiYCoord(50)} x2={svgWidth - paddingRight} y2={getRsiYCoord(50)} stroke="rgba(255, 255, 255, 0.1)" strokeDasharray="3 3" />
                    <line x1={paddingLeft} y1={getRsiYCoord(30)} x2={svgWidth - paddingRight} y2={getRsiYCoord(30)} stroke="rgba(0, 255, 136, 0.25)" strokeDasharray="3 3" />

                    <text x={paddingLeft - 8} y={getRsiYCoord(70) + 3} fill="#ff4444" fontSize="7" textAnchor="end">70</text>
                    <text x={paddingLeft - 8} y={getRsiYCoord(50) + 3} fill="var(--text-secondary)" fontSize="7" textAnchor="end">50</text>
                    <text x={paddingLeft - 8} y={getRsiYCoord(30) + 3} fill="#00ff88" fontSize="7" textAnchor="end">30</text>

                    {/* RSI Path */}
                    <path
                      d={getRsiLinePath(indicators.rsi14)}
                      fill="none"
                      stroke="#e040fb"
                      strokeWidth="1.2"
                    />

                    {/* Hover vertical bar */}
                    {hoverIndex !== null && (
                      <line
                        x1={getXCoord(hoverIndex)}
                        y1={0}
                        x2={getXCoord(hoverIndex)}
                        y2={rsiSvgHeight}
                        stroke="rgba(255, 255, 255, 0.15)"
                        strokeWidth="1.2"
                        strokeDasharray="2 2"
                      />
                    )}
                  </svg>
                </div>
              </div>
            </div>

            {/* Price Graph Canvas - TradingView Lightweight Charts */}
            {history.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(10, 14, 39, 0.2)', borderRadius: '12px', padding: '12px', border: '1px solid rgba(255,255,255,0.03)' }}>
                {/* Candlestick & SMA Chart container */}
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', top: '8px', left: '12px', zIndex: 10, display: 'flex', gap: '16px', pointerEvents: 'none' }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#ffffff' }}>Price Plot</span>
                    <span style={{ fontSize: '10px', color: '#00bcd4', fontWeight: '700' }}>SMA 20</span>
                    <span style={{ fontSize: '10px', color: '#ffb300', fontWeight: '700' }}>SMA 50</span>
                  </div>
                  <div ref={priceChartContainerRef} style={{ width: '100%', height: '280px' }} />
                </div>

                {/* RSI Chart container */}
                <div style={{ position: 'relative', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
                  <div style={{ position: 'absolute', top: '16px', left: '12px', zIndex: 10, pointerEvents: 'none' }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#e040fb' }}>RSI Oscillator (14)</span>
                  </div>
                  <div ref={rsiChartContainerRef} style={{ width: '100%', height: '110px' }} />
                </div>
              </div>
            ) : (
              <div style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                No historical data available.
              </div>
            )}
          </div>

          {/* Split Right: Strategy configuration Panel */}
          <div style={{
            background: 'var(--bg-card-glass)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <h3 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Settings size={18} style={{ color: '#00ff88' }} />
              Strategy settings
            </h3>

            {/* Quick Presets Block */}
            <div>
              <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase' }}>Load Strategy Preset</span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: '6px' }}>
                <button
                  onClick={() => applyPreset('rsi_reversion')}
                  style={{
                    padding: '8px',
                    background: 'rgba(224, 64, 251, 0.08)',
                    border: '1px solid rgba(224, 64, 251, 0.25)',
                    borderRadius: '6px',
                    color: '#e040fb',
                    fontSize: '10px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#e040fb', marginRight: '6px' }}></span>
                    RSI Reversion (1D)
                  </span>
                  <ChevronRight size={10} />
                </button>

                <button
                  onClick={() => applyPreset('sma_crossover')}
                  style={{
                    padding: '8px',
                    background: 'rgba(0, 188, 212, 0.08)',
                    border: '1px solid rgba(0, 188, 212, 0.25)',
                    borderRadius: '6px',
                    color: '#00bcd4',
                    fontSize: '10px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#00bcd4', marginRight: '6px' }}></span>
                    SMA(20) Cross (1D)
                  </span>
                  <ChevronRight size={10} />
                </button>

                <button
                  onClick={() => applyPreset('intraday_scalper')}
                  style={{
                    padding: '8px',
                    background: 'rgba(0, 255, 136, 0.08)',
                    border: '1px solid rgba(0, 255, 136, 0.25)',
                    borderRadius: '6px',
                    color: '#00ff88',
                    fontSize: '10px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#00ff88', marginRight: '6px' }}></span>
                    Scalper (5M Long)
                  </span>
                  <ChevronRight size={10} />
                </button>

                <button
                  onClick={() => applyPreset('intraday_trend_rider')}
                  style={{
                    padding: '8px',
                    background: 'rgba(255, 179, 0, 0.08)',
                    border: '1px solid rgba(255, 179, 0, 0.25)',
                    borderRadius: '6px',
                    color: '#ffb300',
                    fontSize: '10px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#ffb300', marginRight: '6px' }}></span>
                    Trend Rider (5M)
                  </span>
                  <ChevronRight size={10} />
                </button>

                <button
                  onClick={() => applyPreset('intraday_short_scalp')}
                  style={{
                    padding: '8px',
                    background: 'rgba(255, 68, 68, 0.08)',
                    border: '1px solid rgba(255, 68, 68, 0.25)',
                    borderRadius: '6px',
                    color: '#ff4444',
                    fontSize: '10px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gridColumn: 'span 2'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#ff4444', marginRight: '6px' }}></span>
                    Short Seller Scalper (5M Short)
                  </span>
                  <ChevronRight size={10} />
                </button>
              </div>
            </div>

             {/* Compound Buy condition builder */}
             <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                 <span style={{ fontSize: '11px', fontWeight: '800', color: '#00ff88', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                   <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#00ff88' }}></span>
                   Buy Setup
                 </span>
                 {buyConditions.length > 1 && (
                   <select
                     value={buyLogicGate}
                     onChange={(e) => setBuyLogicGate(e.target.value)}
                     style={{ background: 'rgba(0, 255, 136, 0.15)', border: '1px solid rgba(0, 255, 136, 0.3)', padding: '2px 6px', borderRadius: '4px', color: '#00ff88', fontSize: '9px', fontWeight: '800', outline: 'none' }}
                   >
                     <option value="AND" style={{ background: '#0a0e27', color: '#ffffff' }}>ALL (AND)</option>
                     <option value="OR" style={{ background: '#0a0e27', color: '#ffffff' }}>ANY (OR)</option>
                   </select>
                 )}
               </div>
 
               <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                 {buyConditions.map((cond, index) => (
                   <div key={index} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '8px', borderRadius: '6px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                       <span style={{ fontSize: '9px', color: 'var(--text-secondary)', fontWeight: '700' }}>Rule #{index + 1}</span>
                       {buyConditions.length > 1 && (
                         <button
                           onClick={() => {
                             const newConds = [...buyConditions];
                             newConds.splice(index, 1);
                             setBuyConditions(newConds);
                           }}
                           style={{ background: 'none', border: 'none', color: '#ff4444', fontSize: '10px', cursor: 'pointer', padding: 0 }}
                         >
                           Remove
                         </button>
                       )}
                     </div>
 
                     <select
                       value={cond.indicator}
                       onChange={(e) => {
                         const newConds = [...buyConditions];
                         newConds[index].indicator = e.target.value;
                         setBuyConditions(newConds);
                       }}
                       style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '4px 6px', borderRadius: '4px', color: '#ffffff', fontSize: '11px', outline: 'none' }}
                     >
                       <option value="RSI">RSI (Relative Strength)</option>
                       <option value="Price">Close Price</option>
                       <option value="SMA20">SMA 20</option>
                       <option value="SMA50">SMA 50</option>
                     </select>
 
                     <select
                       value={cond.operator}
                       onChange={(e) => {
                         const newConds = [...buyConditions];
                         newConds[index].operator = e.target.value;
                         setBuyConditions(newConds);
                       }}
                       style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '4px 6px', borderRadius: '4px', color: '#ffffff', fontSize: '11px', outline: 'none' }}
                     >
                       <option value="lessThan">is Less Than</option>
                       <option value="greaterThan">is Greater Than</option>
                       <option value="crossesBelow">Crosses Below</option>
                       <option value="crossesAbove">Crosses Above</option>
                     </select>
 
                     <div style={{ display: 'flex', gap: '6px' }}>
                       <select
                         value={cond.targetType}
                         onChange={(e) => {
                           const newConds = [...buyConditions];
                           newConds[index].targetType = e.target.value;
                           setBuyConditions(newConds);
                         }}
                         style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '4px 6px', borderRadius: '4px', color: '#ffffff', fontSize: '11px', flex: 1, outline: 'none' }}
                       >
                         <option value="value">Value</option>
                         <option value="indicator">Indicator</option>
                       </select>
 
                       {cond.targetType === 'value' ? (
                         <input
                           type="number"
                           value={cond.targetValue}
                           onChange={(e) => {
                             const newConds = [...buyConditions];
                             newConds[index].targetValue = parseFloat(e.target.value) || 0;
                             setBuyConditions(newConds);
                           }}
                           style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '4px 6px', borderRadius: '4px', color: '#ffffff', fontSize: '11px', width: '60px', outline: 'none' }}
                         />
                       ) : (
                         <select
                           value={cond.targetIndicator}
                           onChange={(e) => {
                             const newConds = [...buyConditions];
                             newConds[index].targetIndicator = e.target.value;
                             setBuyConditions(newConds);
                           }}
                           style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '4px 6px', borderRadius: '4px', color: '#ffffff', fontSize: '11px', flex: 1, outline: 'none' }}
                         >
                           <option value="Price">Close Price</option>
                           <option value="SMA20">SMA 20</option>
                           <option value="SMA50">SMA 50</option>
                           <option value="RSI">RSI</option>
                         </select>
                       )}
                     </div>
                   </div>
                 ))}
 
                 <button
                   onClick={() => setBuyConditions([...buyConditions, { indicator: 'RSI', operator: 'lessThan', targetType: 'value', targetValue: 35, targetIndicator: 'SMA20' }])}
                   style={{ background: 'rgba(0, 255, 136, 0.08)', border: '1px dashed rgba(0, 255, 136, 0.3)', padding: '6px', borderRadius: '6px', color: '#00ff88', fontSize: '10px', fontWeight: '700', cursor: 'pointer', transition: '0.2s' }}
                 >
                   + Add Buy Condition
                 </button>
               </div>
             </div>
 
             {/* Compound Sell condition builder */}
             <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                 <span style={{ fontSize: '11px', fontWeight: '800', color: '#ff4444', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                   <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#ff4444' }}></span>
                   Sell Setup
                 </span>
                 {sellConditions.length > 1 && (
                   <select
                     value={sellLogicGate}
                     onChange={(e) => setSellLogicGate(e.target.value)}
                     style={{ background: 'rgba(255, 68, 68, 0.15)', border: '1px solid rgba(255, 68, 68, 0.3)', padding: '2px 6px', borderRadius: '4px', color: '#ff4444', fontSize: '9px', fontWeight: '800', outline: 'none' }}
                   >
                     <option value="AND" style={{ background: '#0a0e27', color: '#ffffff' }}>ALL (AND)</option>
                     <option value="OR" style={{ background: '#0a0e27', color: '#ffffff' }}>ANY (OR)</option>
                   </select>
                 )}
               </div>
 
               <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                 {sellConditions.map((cond, index) => (
                   <div key={index} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '8px', borderRadius: '6px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                       <span style={{ fontSize: '9px', color: 'var(--text-secondary)', fontWeight: '700' }}>Rule #{index + 1}</span>
                       {sellConditions.length > 1 && (
                         <button
                           onClick={() => {
                             const newConds = [...sellConditions];
                             newConds.splice(index, 1);
                             setSellConditions(newConds);
                           }}
                           style={{ background: 'none', border: 'none', color: '#ff4444', fontSize: '10px', cursor: 'pointer', padding: 0 }}
                         >
                           Remove
                         </button>
                       )}
                     </div>
 
                     <select
                       value={cond.indicator}
                       onChange={(e) => {
                         const newConds = [...sellConditions];
                         newConds[index].indicator = e.target.value;
                         setSellConditions(newConds);
                       }}
                       style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '4px 6px', borderRadius: '4px', color: '#ffffff', fontSize: '11px', outline: 'none' }}
                     >
                       <option value="RSI">RSI (Relative Strength)</option>
                       <option value="Price">Close Price</option>
                       <option value="SMA20">SMA 20</option>
                       <option value="SMA50">SMA 50</option>
                     </select>
 
                     <select
                       value={cond.operator}
                       onChange={(e) => {
                         const newConds = [...sellConditions];
                         newConds[index].operator = e.target.value;
                         setSellConditions(newConds);
                       }}
                       style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '4px 6px', borderRadius: '4px', color: '#ffffff', fontSize: '11px', outline: 'none' }}
                     >
                       <option value="greaterThan">is Greater Than</option>
                       <option value="lessThan">is Less Than</option>
                       <option value="crossesAbove">Crosses Above</option>
                       <option value="crossesBelow">Crosses Below</option>
                     </select>
 
                     <div style={{ display: 'flex', gap: '6px' }}>
                       <select
                         value={cond.targetType}
                         onChange={(e) => {
                           const newConds = [...sellConditions];
                           newConds[index].targetType = e.target.value;
                           setSellConditions(newConds);
                         }}
                         style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '4px 6px', borderRadius: '4px', color: '#ffffff', fontSize: '11px', flex: 1, outline: 'none' }}
                       >
                         <option value="value">Value</option>
                         <option value="indicator">Indicator</option>
                       </select>
 
                       {cond.targetType === 'value' ? (
                         <input
                           type="number"
                           value={cond.targetValue}
                           onChange={(e) => {
                             const newConds = [...sellConditions];
                             newConds[index].targetValue = parseFloat(e.target.value) || 0;
                             setSellConditions(newConds);
                           }}
                           style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '4px 6px', borderRadius: '4px', color: '#ffffff', fontSize: '11px', width: '60px', outline: 'none' }}
                         />
                       ) : (
                         <select
                           value={cond.targetIndicator}
                           onChange={(e) => {
                             const newConds = [...sellConditions];
                             newConds[index].targetIndicator = e.target.value;
                             setSellConditions(newConds);
                           }}
                           style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '4px 6px', borderRadius: '4px', color: '#ffffff', fontSize: '11px', flex: 1, outline: 'none' }}
                         >
                           <option value="Price">Close Price</option>
                           <option value="SMA20">SMA 20</option>
                           <option value="SMA50">SMA 50</option>
                           <option value="RSI">RSI</option>
                         </select>
                       )}
                     </div>
                   </div>
                 ))}
 
                 <button
                   onClick={() => setSellConditions([...sellConditions, { indicator: 'RSI', operator: 'greaterThan', targetType: 'value', targetValue: 65, targetIndicator: 'SMA20' }])}
                   style={{ background: 'rgba(255, 68, 68, 0.08)', border: '1px dashed rgba(255, 68, 68, 0.3)', padding: '6px', borderRadius: '6px', color: '#ff4444', fontSize: '10px', fontWeight: '700', cursor: 'pointer', transition: '0.2s' }}
                 >
                   + Add Sell Condition
                 </button>
               </div>
             </div>

            {/* Risk & Trend Management Section */}
            <div>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#00bcd4', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldAlert size={12} style={{ color: '#00bcd4' }} />
                Risk & Trend Filter
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Stop Loss %:</span>
                  <input 
                    type="number" 
                    value={stopLossPct}
                    onChange={(e) => setStopLossPct(parseFloat(e.target.value) || 0)}
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '4px 6px', borderRadius: '4px', color: '#ffffff', fontSize: '11px', width: '60px', textAlign: 'right' }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Take Profit %:</span>
                  <input 
                    type="number" 
                    value={takeProfitPct}
                    onChange={(e) => setTakeProfitPct(parseFloat(e.target.value) || 0)}
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '4px 6px', borderRadius: '4px', color: '#ffffff', fontSize: '11px', width: '60px', textAlign: 'right' }}
                  />
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  <input 
                    type="checkbox" 
                    checked={trendFilter}
                    onChange={(e) => setTrendFilter(e.target.checked)}
                    style={{ cursor: 'pointer' }}
                  />
                  {tradeDirection === 'long' 
                    ? 'Trend filter (Buy only if Price > SMA50)' 
                    : 'Trend filter (Short only if Price < SMA50)'
                  }
                </label>
              </div>
            </div>
          </div>

        </div>

        {/* Backtest Statistics Scorecard */}
        {performance && (
          <div style={{
            background: 'var(--bg-card-glass)',
            border: '1px solid rgba(0,255,136,0.15)',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '24px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Award size={18} style={{ color: '#ffb300' }} />
                Backtest Performance Card ({timeRange === '1mo' ? '1-Month' : timeRange === '3mo' ? '3-Month' : timeRange === '6mo' ? '6-Month' : '1-Year'} Simulation)
              </h3>
              <button
                onClick={runStrategyOptimizer}
                disabled={optimizing}
                style={{
                  background: 'linear-gradient(135deg, #ffb300 0%, #ff8f00 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#000000',
                  padding: '8px 16px',
                  fontSize: '12px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 14px rgba(255, 179, 0, 0.3)',
                  transition: '0.2s',
                  opacity: optimizing ? 0.7 : 1,
                }}
              >
                {optimizing ? (
                  <>
                    <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
                    Sweeping Parameters...
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    Auto-Optimize Setup
                  </>
                )}
              </button>
            </div>

            {/* Optimization Suggestions Panel */}
            {optimizationResult && (
              <div style={{
                background: 'linear-gradient(135deg, rgba(255, 179, 0, 0.05) 0%, rgba(10, 14, 39, 0.8) 100%)',
                border: '1px solid rgba(255, 179, 0, 0.25)',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#ffb300', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Sparkles size={14} style={{ color: '#ffb300' }} />
                      Optimizer Parameter Sweeper Suggestions
                    </h4>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '11px', margin: '4px 0 0 0' }}>
                      Simulated 112 parameter combinations to find the best configuration matching your rules.
                    </p>
                  </div>
                  {optimizationResult.noResult ? (
                    <span style={{ fontSize: '11px', color: '#ff4444', fontWeight: '700' }}>No setups found</span>
                  ) : (
                    <button
                      onClick={() => {
                        setStopLossPct(optimizationResult.stopLoss);
                        setTakeProfitPct(optimizationResult.takeProfit);
                        setTrendFilter(optimizationResult.trendFilter);
                      }}
                      style={{
                        background: 'rgba(255, 179, 0, 0.15)',
                        border: '1px solid rgba(255, 179, 0, 0.3)',
                        borderRadius: '6px',
                        color: '#ffb300',
                        padding: '6px 12px',
                        fontSize: '11px',
                        fontWeight: '800',
                        cursor: 'pointer',
                        transition: '0.2s',
                      }}
                    >
                      Apply Optimization
                    </button>
                  )}
                </div>

                {!optimizationResult.noResult && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px' }}>
                    <div>
                      <span style={{ fontSize: '9px', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block' }}>Stop Loss Suggestion</span>
                      <span style={{ fontSize: '14px', fontWeight: '800', color: '#ffffff' }}>
                        {optimizationResult.stopLoss > 0 ? `${optimizationResult.stopLoss}%` : 'Disabled'}
                      </span>
                    </div>
                    <div>
                      <span style={{ fontSize: '9px', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block' }}>Take Profit Suggestion</span>
                      <span style={{ fontSize: '14px', fontWeight: '800', color: '#ffffff' }}>
                        {optimizationResult.takeProfit > 0 ? `${optimizationResult.takeProfit}%` : 'Disabled'}
                      </span>
                    </div>
                    <div>
                      <span style={{ fontSize: '9px', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block' }}>Trend Filter Suggestion</span>
                      <span style={{ fontSize: '14px', fontWeight: '800', color: '#ffffff' }}>
                        {optimizationResult.trendFilter ? 'Enabled (SMA50)' : 'Disabled'}
                      </span>
                    </div>
                    <div>
                      <span style={{ fontSize: '9px', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block' }}>Projected Net Return</span>
                      <span style={{ fontSize: '14px', fontWeight: '800', color: '#00ff88' }}>
                        +{optimizationResult.netReturn.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '20px' }}>
              
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: '700' }}>STRATEGY NET RETURN</div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: performance.netReturn >= 0 ? '#00ff88' : '#ff4444', marginTop: '4px' }}>
                  {performance.netReturn >= 0 ? '+' : ''}{performance.netReturn}%
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: '700' }}>WIN RATE PERCENTAGE</div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: '#00bcd4', marginTop: '4px' }}>
                  {performance.winRate}%
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: '700' }}>TOTAL EXECUTED TRADES</div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: '#ffffff', marginTop: '4px' }}>
                  {performance.totalTrades}
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: '700' }}>PROFITABLE VS LOSSES</div>
                <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#00ff88' }}></span>
                  {performance.wins} W 
                  <span style={{ color: 'rgba(255,255,255,0.15)' }}>|</span> 
                  <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#ff4444' }}></span>
                  {performance.losses} L
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: '700' }}>MAX DRAWDOWN</div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#ff4444', marginTop: '6px' }}>
                  -{performance.maxDrawdown}%
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: '700' }}>AVG HOLDING DURATION</div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#00bcd4', marginTop: '6px' }}>
                  {performance.avgDuration} {chartInterval === '1d' ? 'days' : chartInterval === '5m' ? 'bars (5m)' : 'bars (1m)'}
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: '700' }}>BEST / WORST TRADE</div>
                <div style={{ fontSize: '14px', fontWeight: '700', marginTop: '10px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#00ff88' }}></span>
                  <span style={{ color: '#00ff88' }}>{performance.bestTrade >= 0 ? '+' : ''}{performance.bestTrade}%</span>
                  <span style={{ color: 'rgba(255,255,255,0.15)' }}>/</span>
                  <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#ff4444' }}></span>
                  <span style={{ color: '#ff4444' }}>{performance.worstTrade}%</span>
                </div>
              </div>

            </div>

            {/* Strategy Narrative Explanation */}
            {strategyExplanation && (
              <div style={{
                background: 'rgba(255, 255, 255, 0.01)',
                border: '1px solid rgba(255, 255, 255, 0.04)',
                borderRadius: '8px',
                padding: '16px',
                lineHeight: '1.6'
              }}>
                <h4 style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  <Activity size={12} style={{ color: '#00ff88' }} />
                  Strategy Performance Summary & Interpretation
                </h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '12px', margin: 0 }}>
                  {strategyExplanation}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Trade logs list */}
        {trades.length > 0 && (
          <div style={{
            background: 'var(--bg-card-glass)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            padding: '24px'
          }}>
            <h3 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '16px' }}>
              Algorithmic Trade Execution Log
            </h3>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                    <th style={{ padding: '10px 12px', color: 'var(--text-secondary)', fontSize: '11px', fontWeight: '700' }}>TRADE ID</th>
                    <th style={{ padding: '10px 12px', color: 'var(--text-secondary)', fontSize: '11px', fontWeight: '700' }}>ENTRY</th>
                    <th style={{ padding: '10px 12px', color: 'var(--text-secondary)', fontSize: '11px', fontWeight: '700' }}>EXIT</th>
                    <th style={{ padding: '10px 12px', color: 'var(--text-secondary)', fontSize: '11px', fontWeight: '700' }}>DURATION</th>
                    <th style={{ padding: '10px 12px', color: 'var(--text-secondary)', fontSize: '11px', fontWeight: '700' }}>EXIT REASON</th>
                    <th style={{ padding: '10px 12px', color: 'var(--text-secondary)', fontSize: '11px', fontWeight: '700', textAlign: 'right' }}>PROFIT / LOSS</th>
                  </tr>
                </thead>
                <tbody>
                  {trades.map((trade, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', background: trade.isOpen ? 'rgba(255, 179, 0, 0.03)' : 'transparent' }}>
                      <td style={{ padding: '12px', color: '#9b9eac', fontSize: '12px' }}>
                        #{idx + 1}
                        {trade.isOpen && (
                          <span style={{ marginLeft: '6px', fontSize: '9px', background: 'rgba(255,179,0,0.2)', color: '#ffb300', padding: '2px 5px', borderRadius: '3px', fontWeight: '700' }}>OPEN</span>
                        )}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontSize: '13px', fontWeight: '600' }}>{trade.entryDate}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>₹{trade.entryPrice.toLocaleString('en-IN')}</div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: trade.isOpen ? '#ffb300' : 'var(--text-primary)' }}>
                          {trade.isOpen ? 'Period End' : trade.exitDate}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>₹{trade.exitPrice.toLocaleString('en-IN')}</div>
                      </td>
                      <td style={{ padding: '12px', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600' }}>
                        {trade.duration !== undefined 
                          ? `${trade.duration} ${chartInterval === '1d' ? 'days' : chartInterval === '5m' ? 'bars (5m)' : 'bars (1m)'}` 
                          : 'N/A'
                        }
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          fontSize: '10px',
                          fontWeight: '700',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          textTransform: 'uppercase',
                          background: trade.exitReason === 'Stop Loss' 
                            ? 'rgba(255, 68, 68, 0.15)' 
                            : trade.exitReason === 'Take Profit'
                            ? 'rgba(0, 255, 136, 0.15)'
                            : trade.exitReason === 'Period End'
                            ? 'rgba(255, 179, 0, 0.15)'
                            : 'rgba(0, 188, 212, 0.15)',
                          color: trade.exitReason === 'Stop Loss' 
                            ? '#ff4444' 
                            : trade.exitReason === 'Take Profit'
                            ? '#00ff88'
                            : trade.exitReason === 'Period End'
                            ? '#ffb300'
                            : '#00bcd4'
                        }}>
                          {trade.exitReason || 'Signal'}
                        </span>
                      </td>
                      <td style={{ 
                        padding: '12px', 
                        textAlign: 'right', 
                        fontWeight: '700', 
                        color: trade.pnl >= 0 ? '#00ff88' : '#ff4444',
                        fontSize: '13px'
                      }}>
                        {trade.pnl >= 0 ? '+' : ''}{trade.pnl}%
                        {trade.isOpen && <span style={{ fontSize: '9px', color: '#ffb300', block: 'block', display: 'block', fontWeight: '500' }}>(unrealised)</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}