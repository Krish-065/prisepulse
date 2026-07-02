import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { apiClient } from '../services/api';
import { 
  TrendingUp, Activity, Play, RefreshCw, BarChart2, 
  Settings, Award, ShieldAlert, CheckCircle, ChevronRight, HelpCircle
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

  // Strategy Configurations
  const [buyIndicator, setBuyIndicator] = useState('RSI');
  const [buyPeriod, setBuyPeriod] = useState(14);
  const [buyOperator, setBuyOperator] = useState('lessThan');
  const [buyTarget, setBuyTarget] = useState(30);

  const [sellIndicator, setSellIndicator] = useState('RSI');
  const [sellPeriod, setSellPeriod] = useState(14);
  const [sellOperator, setSellOperator] = useState('greaterThan');
  const [sellTarget, setSellTarget] = useState(70);

  // Backtest Results
  const [signals, setSignals] = useState([]); // buy/sell indices
  const [trades, setTrades] = useState([]);
  const [performance, setPerformance] = useState(null);

  // Interactive Hover Crosshair
  const [hoverIndex, setHoverIndex] = useState(null);

  // Load TV Widget
  useEffect(() => {
    if (activeTab === 'tradingview') {
      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/tv.js';
      script.async = true;
      script.onload = () => {
        if (tvContainerRef.current) {
          new window.TradingView.widget({
            container_id: tvContainerRef.current.id,
            symbol: `NSE:${symbol}`,
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
        } catch (e) {
          // script already removed
        }
      };
    }
  }, [symbol, activeTab]);

  // Fetch Stock History
  const fetchStockData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      // Get historical series
      const histRes = await apiClient.get(`/market/stock-history/${symbol}`);
      setHistory(histRes.data);

      // Get current quote
      const nsSymbol = symbol.endsWith('.NS') ? symbol : `${symbol}.NS`;
      const quotesRes = await apiClient.get('/market/indices'); // fetches batch quotes
      const matched = quotesRes.data[nsSymbol] || quotesRes.data[symbol];
      if (matched && matched.price) {
        setStockInfo({
          price: matched.price,
          changePercent: matched.changePercent
        });
      } else if (histRes.data.length > 0) {
        // Fallback quote from latest historical close
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
    fetchStockData();
  }, [symbol]);

  // Math functions for indicator values
  const computeIndicators = () => {
    if (history.length === 0) return {};

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
    const rsi = indicators.rsi14;

    const generatedSignals = new Array(history.length).fill(null); // 'BUY', 'SELL', or null
    const executedTrades = [];
    let activeTrade = null;

    // Helper to extract indicator value at index
    const getValue = (indicator, period, idx) => {
      if (indicator === 'Price') return history[idx].close;
      if (indicator === 'SMA' && period === 20) return sma20[idx];
      if (indicator === 'SMA' && period === 50) return sma50[idx];
      if (indicator === 'RSI') return rsi[idx];
      return null;
    };

    // Helper to evaluate mathematical expression
    const evaluateRule = (ind, val, operator, target, idx) => {
      if (idx === 0) return false;
      const currVal = getValue(ind, 20, idx);
      const prevVal = getValue(ind, 20, idx - 1);
      
      const targetVal = parseFloat(target);

      if (currVal === null || prevVal === null) return false;

      switch (operator) {
        case 'lessThan':
          return currVal < targetVal;
        case 'greaterThan':
          return currVal > targetVal;
        case 'crossesBelow':
          return prevVal >= targetVal && currVal < targetVal;
        case 'crossesAbove':
          return prevVal <= targetVal && currVal > targetVal;
        default:
          return false;
      }
    };

    // Walk through historical ticks
    for (let i = 20; i < history.length; i++) {
      if (!activeTrade) {
        // Evaluate Buy Conditions
        const buyTriggered = evaluateRule(buyIndicator, buyPeriod, buyOperator, buyTarget, i);
        if (buyTriggered) {
          generatedSignals[i] = 'BUY';
          activeTrade = {
            entryIndex: i,
            entryDate: new Date(history[i].time).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
            entryPrice: history[i].close,
          };
        }
      } else {
        // Evaluate Sell Conditions
        const sellTriggered = evaluateRule(sellIndicator, sellPeriod, sellOperator, sellTarget, i);
        if (sellTriggered) {
          generatedSignals[i] = 'SELL';
          const pnl = ((history[i].close - activeTrade.entryPrice) / activeTrade.entryPrice) * 100;
          executedTrades.push({
            ...activeTrade,
            exitIndex: i,
            exitDate: new Date(history[i].time).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
            exitPrice: history[i].close,
            pnl: parseFloat(pnl.toFixed(2))
          });
          activeTrade = null;
        }
      }
    }

    setSignals(generatedSignals);
    setTrades(executedTrades);

    // Calculate overall stats
    if (executedTrades.length > 0) {
      const wins = executedTrades.filter(t => t.pnl > 0).length;
      const winRate = (wins / executedTrades.length) * 100;
      const cumulativeReturn = executedTrades.reduce((acc, t) => acc + t.pnl, 0);

      setPerformance({
        totalTrades: executedTrades.length,
        wins,
        losses: executedTrades.length - wins,
        winRate: parseFloat(winRate.toFixed(1)),
        netReturn: parseFloat(cumulativeReturn.toFixed(1))
      });
    } else {
      setPerformance({
        totalTrades: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        netReturn: 0
      });
    }
  };

  // Run default backtest when history is fetched
  useEffect(() => {
    if (history.length > 0) {
      runBacktest();
    }
  }, [history]);

  // Coordinate math helpers for SVG plot
  const svgWidth = 720;
  const svgHeight = 360;
  const paddingLeft = 45;
  const paddingRight = 15;
  const paddingTop = 20;
  const paddingBottom = 30;

  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  const minPrice = history.length > 0 ? Math.min(...history.map(h => h.low)) * 0.985 : 0;
  const maxPrice = history.length > 0 ? Math.max(...history.map(h => h.high)) * 1.015 : 100;

  const getYCoord = (price) => {
    return svgHeight - paddingBottom - ((price - minPrice) / (maxPrice - minPrice)) * chartHeight;
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
          PricePulse Algorithmic Strategy Lab
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'tradingview' ? (
        <div style={{
          background: 'rgba(16, 20, 39, 0.95)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '16px',
          overflow: 'hidden'
        }}>
          <div id="tradingview-chart-element" ref={tvContainerRef} style={{ height: '520px', borderRadius: '8px' }}></div>
        </div>
      ) : (
        <div>
          {/* Algo workspace layout grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px', alignItems: 'stretch', marginBottom: '24px' }}>
            
            {/* Split Left: SVG Interactive Chart */}
            <div style={{
              background: 'var(--bg-card-glass)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative'
            }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
                  Algo Strategy candlestick Chart
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '11px', marginBottom: '16px' }}>
                  Overlaying compiled Buy (▲) & Sell (▼) triggers on daily candlestick bars (3-Month Series).
                </p>
              </div>

              {/* Price Graph Canvas */}
              {history.length > 0 ? (
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
                      
                      // Map back to stock data index
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
                      opacity="0.7" 
                    />
                    <path 
                      d={getLinePath(indicators.sma50)} 
                      fill="none" 
                      stroke="#ffb300" 
                      strokeWidth="1.2" 
                      opacity="0.7" 
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
                          {/* Candle Wick */}
                          <line 
                            x1={x} 
                            y1={yHigh} 
                            x2={x} 
                            y2={yLow} 
                            stroke={color} 
                            strokeWidth={isSelected ? "1.8" : "1"} 
                          />
                          {/* Candle Body */}
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
              ) : (
                <div style={{ height: svgHeight, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
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

              {/* Buy condition builder */}
              <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px' }}>
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#00ff88', textTransform: 'uppercase' }}>🟢 Algo BUY RULE</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                  <select 
                    value={buyIndicator} 
                    onChange={(e) => setBuyIndicator(e.target.value)}
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '6px', borderRadius: '4px', color: '#ffffff', fontSize: '12px' }}
                  >
                    <option value="RSI">RSI (Relative Strength)</option>
                    <option value="Price">Close Price</option>
                  </select>

                  <select 
                    value={buyOperator} 
                    onChange={(e) => setBuyOperator(e.target.value)}
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '6px', borderRadius: '4px', color: '#ffffff', fontSize: '12px' }}
                  >
                    <option value="lessThan">is Less Than</option>
                    <option value="greaterThan">is Greater Than</option>
                    <option value="crossesBelow">Crosses Below</option>
                    <option value="crossesAbove">Crosses Above</option>
                  </select>

                  <input 
                    type="number" 
                    value={buyTarget}
                    onChange={(e) => setBuyTarget(e.target.value)}
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '6px', borderRadius: '4px', color: '#ffffff', fontSize: '12px' }}
                  />
                </div>
              </div>

              {/* Sell condition builder */}
              <div>
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#ff4444', textTransform: 'uppercase' }}>🔴 Algo SELL RULE</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                  <select 
                    value={sellIndicator} 
                    onChange={(e) => setSellIndicator(e.target.value)}
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '6px', borderRadius: '4px', color: '#ffffff', fontSize: '12px' }}
                  >
                    <option value="RSI">RSI (Relative Strength)</option>
                    <option value="Price">Close Price</option>
                  </select>

                  <select 
                    value={sellOperator} 
                    onChange={(e) => setSellOperator(e.target.value)}
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '6px', borderRadius: '4px', color: '#ffffff', fontSize: '12px' }}
                  >
                    <option value="greaterThan">is Greater Than</option>
                    <option value="lessThan">is Less Than</option>
                    <option value="crossesAbove">Crosses Above</option>
                    <option value="crossesBelow">Crosses Below</option>
                  </select>

                  <input 
                    type="number" 
                    value={sellTarget}
                    onChange={(e) => setSellTarget(e.target.value)}
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '6px', borderRadius: '4px', color: '#ffffff', fontSize: '12px' }}
                  />
                </div>
              </div>

              {/* Run backtest action button */}
              <button
                onClick={runBacktest}
                style={{
                  marginTop: 'auto',
                  padding: '12px',
                  background: 'linear-gradient(135deg, #00ff88, #00bcd4)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#000000',
                  fontWeight: '800',
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 15px rgba(0, 255, 136, 0.25)'
                }}
              >
                <Play size={14} fill="#000000" />
                Compile & Run backtest
              </button>
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
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Award size={18} style={{ color: '#ffb300' }} />
                Backtest Performance Card (3-Month simulation)
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>STRATEGY NET RETURN</div>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: performance.netReturn >= 0 ? '#00ff88' : '#ff4444', marginTop: '4px' }}>
                    {performance.netReturn >= 0 ? '+' : ''}{performance.netReturn}%
                  </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>WIN RATE PERCENTAGE</div>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: '#00bcd4', marginTop: '4px' }}>
                    {performance.winRate}%
                  </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>TOTAL EXECUTED TRADES</div>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: '#ffffff', marginTop: '4px' }}>
                    {performance.totalTrades}
                  </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>PROFITABLE VS LOSSES</div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', marginTop: '12px' }}>
                    🟢 {performance.wins} W / 🔴 {performance.losses} L
                  </div>
                </div>

              </div>
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
                      <th style={{ padding: '10px 12px', color: 'var(--text-secondary)', fontSize: '11px', fontWeight: '700' }}>ENTRY DATE</th>
                      <th style={{ padding: '10px 12px', color: 'var(--text-secondary)', fontSize: '11px', fontWeight: '700' }}>ENTRY PRICE</th>
                      <th style={{ padding: '10px 12px', color: 'var(--text-secondary)', fontSize: '11px', fontWeight: '700' }}>EXIT DATE</th>
                      <th style={{ padding: '10px 12px', color: 'var(--text-secondary)', fontSize: '11px', fontWeight: '700' }}>EXIT PRICE</th>
                      <th style={{ padding: '10px 12px', color: 'var(--text-secondary)', fontSize: '11px', fontWeight: '700', textAlign: 'right' }}>PROFIT / LOSS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trades.map((trade, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                        <td style={{ padding: '12px', color: '#9b9eac', fontSize: '12px' }}>#{idx + 1}</td>
                        <td style={{ padding: '12px', fontSize: '13px', fontWeight: '600' }}>{trade.entryDate}</td>
                        <td style={{ padding: '12px', fontSize: '13px' }}>₹{trade.entryPrice.toLocaleString('en-IN')}</td>
                        <td style={{ padding: '12px', fontSize: '13px', fontWeight: '600' }}>{trade.exitDate}</td>
                        <td style={{ padding: '12px', fontSize: '13px' }}>₹{trade.exitPrice.toLocaleString('en-IN')}</td>
                        <td style={{ 
                          padding: '12px', 
                          textAlign: 'right', 
                          fontWeight: '700', 
                          color: trade.pnl >= 0 ? '#00ff88' : '#ff4444' 
                        }}>
                          {trade.pnl >= 0 ? '+' : ''}{trade.pnl}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}