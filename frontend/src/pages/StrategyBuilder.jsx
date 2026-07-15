import { useState, useEffect } from 'react';
import { apiClient } from '../services/api';
import toast from 'react-hot-toast';
import { 
  TrendingUp, Award, ShieldAlert, Settings, Play, Save, Share2, 
  Trash2, Copy, Sparkles, RefreshCw, BarChart2, Calendar, Clock, DollarSign
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const POPULAR_STOCKS = [
  { label: 'RELIANCE', value: 'RELIANCE' },
  { label: 'SBIN', value: 'SBIN' },
  { label: 'TCS', value: 'TCS' },
  { label: 'INFY', value: 'INFY' },
  { label: 'HDFCBANK', value: 'HDFCBANK' },
  { label: 'ICICIBANK', value: 'ICICIBANK' },
  { label: 'TATAMOTORS', value: 'TATAMOTORS' },
  { label: 'ZOMATO', value: 'ZOMATO' },
  { label: 'Bitcoin (BTC)', value: 'BTC' },
  { label: 'Ethereum (ETH)', value: 'ETH' }
];

export default function StrategyBuilder() {
  const { user } = useAuth();
  const [symbol, setSymbol] = useState('RELIANCE');

  const handleDeployBot = () => {
    if (!user?.is_pro) {
      toast.error('Gated Premium Feature: Please upgrade to Pro to deploy live automated bots!');
      window.location.href = '/upgrade-pro';
      return;
    }
    toast.success('🤖 Automated Bot successfully deployed to your sandbox account! It is now monitoring live market streams.');
  };

  const [timeRange, setTimeRange] = useState('1y');
  const [chartInterval, setChartInterval] = useState('1d');
  const [capital, setCapital] = useState(1000000);
  const [stopLossPct, setStopLossPct] = useState(2.5);
  const [takeProfitPct, setTakeProfitPct] = useState(5.0);
  const [riskPercent, setRiskPercent] = useState(2.0);
  
  // Strategy Builder rules
  const [buyConditions, setBuyConditions] = useState([
    { indicator: 'RSI', operator: 'lessThan', targetType: 'value', targetValue: 30, targetIndicator: 'SMA20' }
  ]);
  const [buyLogicGate, setBuyLogicGate] = useState('AND');

  const [sellConditions, setSellConditions] = useState([
    { indicator: 'RSI', operator: 'greaterThan', targetType: 'value', targetValue: 70, targetIndicator: 'SMA20' }
  ]);
  const [sellLogicGate, setSellLogicGate] = useState('AND');

  // Backend States
  const [savedStrategies, setSavedStrategies] = useState([]);
  const [backtestResult, setBacktestResult] = useState(null);
  const [running, setRunning] = useState(false);
  const [newStrategyName, setNewStrategyName] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);

  useEffect(() => {
    fetchSavedStrategies();
    
    // Check if there is a shared strategy to import from URL query
    const params = new URLSearchParams(window.location.search);
    const importId = params.get('import');
    if (importId) {
      handleImportSharedStrategy(importId);
    }
  }, []);

  const handleImportSharedStrategy = async (importId) => {
    const loadingToast = toast.loading('Importing shared strategy template...');
    try {
      const res = await apiClient.get(`/strategy/shared/${importId}`);
      const shared = res.data;
      if (shared.indicators) {
        if (shared.indicators.buyConditions) setBuyConditions(shared.indicators.buyConditions);
        if (shared.indicators.buyLogicGate) setBuyLogicGate(shared.indicators.buyLogicGate);
        if (shared.indicators.sellConditions) setSellConditions(shared.indicators.sellConditions);
        if (shared.indicators.sellLogicGate) setSellLogicGate(shared.indicators.sellLogicGate);
        
        toast.success(`Imported template "${shared.strategyName}" by ${shared.authorName}!`, { id: loadingToast });
      }
    } catch (err) {
      console.error('Failed to import strategy:', err);
      toast.error('Failed to import shared strategy template', { id: loadingToast });
    }
  };

  const fetchSavedStrategies = async () => {
    try {
      const res = await apiClient.get('/strategy/saved');
      setSavedStrategies(res.data);
    } catch (err) {
      console.error('Failed to fetch saved strategies:', err);
    }
  };

  const handleRunBacktest = async () => {
    setRunning(true);
    setBacktestResult(null);
    try {
      const res = await apiClient.post('/strategy/backtest', {
        symbol,
        range: timeRange,
        interval: chartInterval,
        buyConditions,
        sellConditions,
        buyLogicGate,
        sellLogicGate,
        stopLoss: stopLossPct,
        takeProfit: takeProfitPct,
        capital,
        riskPercent
      });
      setBacktestResult(res.data);
      toast.success('Backtest simulation completed!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to execute backtest simulation');
    } finally {
      setRunning(false);
    }
  };

  const handleSaveStrategy = async () => {
    if (!newStrategyName.trim()) {
      toast.error('Please enter a strategy name');
      return;
    }

    try {
      await apiClient.post('/strategy/saved', {
        name: newStrategyName,
        indicators: {
          buyConditions,
          buyLogicGate,
          sellConditions,
          sellLogicGate
        },
        stopLoss: stopLossPct,
        takeProfit: takeProfitPct,
        capital,
        riskPercent
      });
      toast.success('Strategy saved successfully!');
      setNewStrategyName('');
      setShowSaveModal(false);
      fetchSavedStrategies();
    } catch (err) {
      toast.error('Failed to save strategy');
    }
  };

  const handleDeleteStrategy = async (id) => {
    try {
      await apiClient.delete(`/strategy/saved/${id}`);
      toast.success('Strategy deleted');
      fetchSavedStrategies();
    } catch (err) {
      toast.error('Failed to delete strategy');
    }
  };

  const handleShareStrategy = async () => {
    if (!backtestResult) {
      toast.error('Please run a backtest first to publish results!');
      return;
    }

    const shareName = prompt('Enter a name to share this strategy with the community:');
    if (!shareName) return;

    try {
      const res = await apiClient.post('/strategy/share', {
        strategyName: shareName,
        indicators: {
          buyConditions,
          buyLogicGate,
          sellConditions,
          sellLogicGate
        },
        winRate: backtestResult.winRate,
        netProfit: backtestResult.profit,
        drawdown: backtestResult.drawdown
      });
      const sharedId = res.data.sharedId;
      const shareUrl = `${window.location.origin}/strategy-lab?import=${sharedId}`;
      
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Strategy shared! Shareable import link copied to clipboard.');
      } catch (clipErr) {
        prompt('Strategy shared! Copy this link to share:', shareUrl);
      }
    } catch (err) {
      toast.error('Failed to publish strategy');
    }
  };

  const loadPreset = (preset) => {
    const isProPreset = ['ema_golden_cross', 'adx_breakout'].includes(preset);
    if (isProPreset && !user?.is_pro) {
      toast.error('Gated Pro Feature: Upgrade to NonStock Pro to access advanced strategy presets!');
      window.location.href = '/upgrade-pro';
      return;
    }

    if (preset === 'rsi_reversion') {
      setBuyConditions([{ indicator: 'RSI', operator: 'lessThan', targetType: 'value', targetValue: 30 }]);
      setSellConditions([{ indicator: 'RSI', operator: 'greaterThan', targetType: 'value', targetValue: 70 }]);
      setStopLossPct(2);
      setTakeProfitPct(6);
    } else if (preset === 'sma_cross') {
      setBuyConditions([{ indicator: 'Price', operator: 'crossesAbove', targetType: 'indicator', targetIndicator: 'SMA50' }]);
      setSellConditions([{ indicator: 'Price', operator: 'crossesBelow', targetType: 'indicator', targetIndicator: 'SMA50' }]);
      setStopLossPct(3);
      setTakeProfitPct(9);
    } else if (preset === 'macd_momentum') {
      setBuyConditions([{ indicator: 'MACD', operator: 'crossesAbove', targetType: 'indicator', targetIndicator: 'SignalLine' }]);
      setSellConditions([{ indicator: 'MACD', operator: 'crossesBelow', targetType: 'indicator', targetIndicator: 'SignalLine' }]);
      setStopLossPct(1.5);
      setTakeProfitPct(4.5);
    } else if (preset === 'ema_golden_cross') {
      setBuyConditions([{ indicator: 'EMA20', operator: 'crossesAbove', targetType: 'indicator', targetIndicator: 'EMA50' }]);
      setSellConditions([{ indicator: 'EMA20', operator: 'crossesBelow', targetType: 'indicator', targetIndicator: 'EMA50' }]);
      setStopLossPct(4.0);
      setTakeProfitPct(12.0);
    } else if (preset === 'adx_breakout') {
      setBuyConditions([
        { indicator: 'ADX', operator: 'greaterThan', targetType: 'value', targetValue: 25 },
        { indicator: 'Price', operator: 'crossesAbove', targetType: 'indicator', targetIndicator: 'SMA20' }
      ]);
      setBuyLogicGate('AND');
      setSellConditions([{ indicator: 'Price', operator: 'crossesBelow', targetType: 'indicator', targetIndicator: 'SMA20' }]);
      setStopLossPct(2.0);
      setTakeProfitPct(8.0);
    }
    toast.success('Preset loaded successfully!');
  };

  const handleAddCondition = (type) => {
    const list = type === 'buy' ? buyConditions : sellConditions;
    const setter = type === 'buy' ? setBuyConditions : setSellConditions;
    setter([...list, { indicator: 'RSI', operator: 'lessThan', targetType: 'value', targetValue: 50, targetIndicator: 'SMA20' }]);
  };

  const handleRemoveCondition = (type, idx) => {
    const list = type === 'buy' ? buyConditions : sellConditions;
    const setter = type === 'buy' ? setBuyConditions : setSellConditions;
    setter(list.filter((_, i) => i !== idx));
  };

  const handleConditionChange = (type, idx, key, val) => {
    const list = type === 'buy' ? buyConditions : sellConditions;
    const setter = type === 'buy' ? setBuyConditions : setSellConditions;
    const updated = [...list];
    updated[idx][key] = val;
    setter(updated);
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', color: '#ffffff' }}>
      
      {/* Top Banner Header */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(16, 20, 39, 0.6) 0%, rgba(22, 28, 59, 0.4) 100%)',
        border: '1px solid rgba(0, 255, 136, 0.15)',
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
          <h1 style={{ fontSize: '28px', fontWeight: '900', margin: '0 0 6px 0', background: 'linear-gradient(135deg, #00ff88 0%, #00bcd4 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sparkles size={28} style={{ color: '#00ff88' }} />
            NonStock Strategy Lab
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0 }}>
            Build, save, and simulate multi-indicator algorithmic systems on historical market assets.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => loadPreset('rsi_reversion')}
            style={{ padding: '8px 14px', background: 'rgba(224, 64, 251, 0.08)', border: '1px solid rgba(224, 64, 251, 0.25)', borderRadius: '8px', color: '#e040fb', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
          >
            RSI Reversion Preset
          </button>
          <button 
            onClick={() => loadPreset('sma_cross')}
            style={{ padding: '8px 14px', background: 'rgba(0, 188, 212, 0.08)', border: '1px solid rgba(0, 188, 212, 0.25)', borderRadius: '8px', color: '#00bcd4', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
          >
            SMA Cross Preset
          </button>
          <button 
            onClick={() => loadPreset('macd_momentum')}
            style={{ padding: '8px 14px', background: 'rgba(0, 255, 136, 0.05)', border: '1px solid rgba(0, 255, 136, 0.15)', borderRadius: '8px', color: '#00ff88', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
          >
            MACD Cross Preset
          </button>
          <button 
            onClick={() => loadPreset('ema_golden_cross')}
            style={{ 
              padding: '8px 14px', 
              background: 'rgba(255, 179, 0, 0.05)', 
              border: '1px solid rgba(255, 179, 0, 0.25)', 
              borderRadius: '8px', 
              color: '#ffb300', 
              fontSize: '12px', 
              fontWeight: '700', 
              cursor: 'pointer',
              boxShadow: '0 0 10px rgba(255, 179, 0, 0.05)'
            }}
          >
            ⭐ Golden Cross (PRO)
          </button>
          <button 
            onClick={() => loadPreset('adx_breakout')}
            style={{ 
              padding: '8px 14px', 
              background: 'rgba(255, 179, 0, 0.05)', 
              border: '1px solid rgba(255, 179, 0, 0.25)', 
              borderRadius: '8px', 
              color: '#ffb300', 
              fontSize: '12px', 
              fontWeight: '700', 
              cursor: 'pointer',
              boxShadow: '0 0 10px rgba(255, 179, 0, 0.05)'
            }}
          >
            ⭐ ADX Breakout (PRO)
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '24px', alignItems: 'stretch' }}>
        
        {/* Left Side: Setup Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Asset & Risk config */}
          <div style={{
            background: 'var(--bg-card-glass)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Settings size={18} style={{ color: '#00bcd4' }} />
              1. Simulation Parameters & Asset Setup
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase' }}>Target Asset</label>
                <select
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  style={{ background: 'rgba(10,14,39,0.5)', border: '1px solid rgba(255,255,255,0.08)', padding: '10px 12px', borderRadius: '8px', color: '#ffffff', fontSize: '13px', fontWeight: '700' }}
                >
                  {POPULAR_STOCKS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase' }}>Backtest Time Period</label>
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  style={{ background: 'rgba(10,14,39,0.5)', border: '1px solid rgba(255,255,255,0.08)', padding: '10px 12px', borderRadius: '8px', color: '#ffffff', fontSize: '13px', fontWeight: '700' }}
                >
                  <option value="1mo">1 Month</option>
                  <option value="3mo">3 Months</option>
                  <option value="6mo">6 Months</option>
                  <option value="1y">1 Year</option>
                  <option value="2y">2 Years</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase' }}>Bar Interval</label>
                <select
                  value={chartInterval}
                  onChange={(e) => setChartInterval(e.target.value)}
                  style={{ background: 'rgba(10,14,39,0.5)', border: '1px solid rgba(255,255,255,0.08)', padding: '10px 12px', borderRadius: '8px', color: '#ffffff', fontSize: '13px', fontWeight: '700' }}
                >
                  <option value="5m">5 Minute</option>
                  <option value="15m">15 Minute</option>
                  <option value="60m">1 Hour</option>
                  <option value="1d">Daily (1 Day)</option>
                </select>
              </div>

            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase' }}>Initial Capital</label>
                <input
                  type="number"
                  value={capital}
                  onChange={(e) => setCapital(parseFloat(e.target.value) || 0)}
                  style={{ background: 'rgba(10,14,39,0.5)', border: '1px solid rgba(255,255,255,0.08)', padding: '10px 12px', borderRadius: '8px', color: '#ffffff', fontSize: '13px', fontWeight: '700' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase' }}>Stop Loss %</label>
                <input
                  type="number"
                  step="0.1"
                  value={stopLossPct}
                  onChange={(e) => setStopLossPct(parseFloat(e.target.value) || 0)}
                  style={{ background: 'rgba(10,14,39,0.5)', border: '1px solid rgba(255,255,255,0.08)', padding: '10px 12px', borderRadius: '8px', color: '#ffffff', fontSize: '13px', fontWeight: '700' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase' }}>Take Profit %</label>
                <input
                  type="number"
                  step="0.1"
                  value={takeProfitPct}
                  onChange={(e) => setTakeProfitPct(parseFloat(e.target.value) || 0)}
                  style={{ background: 'rgba(10,14,39,0.5)', border: '1px solid rgba(255,255,255,0.08)', padding: '10px 12px', borderRadius: '8px', color: '#ffffff', fontSize: '13px', fontWeight: '700' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase' }}>Risk % Per Trade</label>
                <input
                  type="number"
                  step="0.1"
                  value={riskPercent}
                  onChange={(e) => setRiskPercent(parseFloat(e.target.value) || 0)}
                  style={{ background: 'rgba(10,14,39,0.5)', border: '1px solid rgba(255,255,255,0.08)', padding: '10px 12px', borderRadius: '8px', color: '#ffffff', fontSize: '13px', fontWeight: '700' }}
                />
              </div>

            </div>
          </div>

          {/* Rules Builder Stack */}
          <div style={{
            background: 'var(--bg-card-glass)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            padding: '24px',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '24px'
          }}>
            
            {/* Entry Buy Rules */}
            <div style={{ borderRight: '1px solid rgba(255,255,255,0.05)', paddingRight: '24px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#00ff88', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={16} />
                Buy Rules Setup
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {buyConditions.map((cond, idx) => (
                  <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: '800' }}>RULE #{idx+1}</span>
                      {buyConditions.length > 1 && (
                        <button onClick={() => handleRemoveCondition('buy', idx)} style={{ background: 'transparent', border: 'none', color: '#ff4444', fontSize: '10px', cursor: 'pointer' }}>Delete</button>
                      )}
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <select
                        value={cond.indicator}
                        onChange={(e) => handleConditionChange('buy', idx, 'indicator', e.target.value)}
                        style={{ background: 'rgba(10,14,39,0.5)', border: '1px solid rgba(255,255,255,0.08)', padding: '6px', borderRadius: '6px', color: '#ffffff', fontSize: '12px' }}
                      >
                        <option value="RSI">RSI (14)</option>
                        <option value="Price">Price</option>
                        <option value="EMA20">EMA 20</option>
                        <option value="EMA50">EMA 50</option>
                        <option value="SMA20">SMA 20</option>
                        <option value="SMA50">SMA 50</option>
                        <option value="MACD">MACD Line</option>
                        <option value="ADX">ADX Trend Strength</option>
                      </select>
                      
                      <select
                        value={cond.operator}
                        onChange={(e) => handleConditionChange('buy', idx, 'operator', e.target.value)}
                        style={{ background: 'rgba(10,14,39,0.5)', border: '1px solid rgba(255,255,255,0.08)', padding: '6px', borderRadius: '6px', color: '#ffffff', fontSize: '12px' }}
                      >
                        <option value="lessThan">is less than</option>
                        <option value="greaterThan">is greater than</option>
                        <option value="crossesAbove">crosses above</option>
                        <option value="crossesBelow">crosses below</option>
                      </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '8px', alignItems: 'center' }}>
                      <select
                        value={cond.targetType}
                        onChange={(e) => handleConditionChange('buy', idx, 'targetType', e.target.value)}
                        style={{ background: 'rgba(10,14,39,0.5)', border: '1px solid rgba(255,255,255,0.08)', padding: '6px', borderRadius: '6px', color: '#ffffff', fontSize: '11px' }}
                      >
                        <option value="value">Value</option>
                        <option value="indicator">Indicator</option>
                      </select>
                      
                      {cond.targetType === 'value' ? (
                        <input
                          type="number"
                          value={cond.targetValue}
                          onChange={(e) => handleConditionChange('buy', idx, 'targetValue', parseFloat(e.target.value) || 0)}
                          style={{ background: 'rgba(10,14,39,0.5)', border: '1px solid rgba(255,255,255,0.08)', padding: '6px', borderRadius: '6px', color: '#ffffff', fontSize: '12px', width: '100%', boxSizing: 'border-box' }}
                        />
                      ) : (
                        <select
                          value={cond.targetIndicator}
                          onChange={(e) => handleConditionChange('buy', idx, 'targetIndicator', e.target.value)}
                          style={{ background: 'rgba(10,14,39,0.5)', border: '1px solid rgba(255,255,255,0.08)', padding: '6px', borderRadius: '6px', color: '#ffffff', fontSize: '12px' }}
                        >
                          <option value="EMA20">EMA 20</option>
                          <option value="EMA50">EMA 50</option>
                          <option value="SMA20">SMA 20</option>
                          <option value="SMA50">SMA 50</option>
                          <option value="SignalLine">Signal Line</option>
                        </select>
                      )}
                    </div>
                  </div>
                ))}

                {buyConditions.length > 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Logic gate:</span>
                    <select 
                      value={buyLogicGate} 
                      onChange={(e) => setBuyLogicGate(e.target.value)}
                      style={{ background: 'rgba(10,14,39,0.5)', border: '1px solid rgba(255,255,255,0.08)', padding: '4px', borderRadius: '4px', color: '#ffffff', fontSize: '11px', fontWeight: '800' }}
                    >
                      <option value="AND">AND (All rules must match)</option>
                      <option value="OR">OR (Any rule can match)</option>
                    </select>
                  </div>
                )}

                <button
                  onClick={() => handleAddCondition('buy')}
                  style={{ background: 'rgba(0, 255, 136, 0.08)', border: '1px dashed rgba(0, 255, 136, 0.25)', borderRadius: '8px', color: '#00ff88', padding: '8px', fontSize: '12px', cursor: 'pointer', fontWeight: '800' }}
                >
                  + Add Buy Rule
                </button>
              </div>
            </div>

            {/* Exit Sell Rules */}
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#ff4444', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={16} style={{ transform: 'rotate(180deg)' }} />
                Sell Rules Setup
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {sellConditions.map((cond, idx) => (
                  <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: '800' }}>RULE #{idx+1}</span>
                      {sellConditions.length > 1 && (
                        <button onClick={() => handleRemoveCondition('sell', idx)} style={{ background: 'transparent', border: 'none', color: '#ff4444', fontSize: '10px', cursor: 'pointer' }}>Delete</button>
                      )}
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <select
                        value={cond.indicator}
                        onChange={(e) => handleConditionChange('sell', idx, 'indicator', e.target.value)}
                        style={{ background: 'rgba(10,14,39,0.5)', border: '1px solid rgba(255,255,255,0.08)', padding: '6px', borderRadius: '6px', color: '#ffffff', fontSize: '12px' }}
                      >
                        <option value="RSI">RSI (14)</option>
                        <option value="Price">Price</option>
                        <option value="EMA20">EMA 20</option>
                        <option value="EMA50">EMA 50</option>
                        <option value="SMA20">SMA 20</option>
                        <option value="SMA50">SMA 50</option>
                        <option value="MACD">MACD Line</option>
                        <option value="ADX">ADX Trend Strength</option>
                      </select>
                      
                      <select
                        value={cond.operator}
                        onChange={(e) => handleConditionChange('sell', idx, 'operator', e.target.value)}
                        style={{ background: 'rgba(10,14,39,0.5)', border: '1px solid rgba(255,255,255,0.08)', padding: '6px', borderRadius: '6px', color: '#ffffff', fontSize: '12px' }}
                      >
                        <option value="lessThan">is less than</option>
                        <option value="greaterThan">is greater than</option>
                        <option value="crossesAbove">crosses above</option>
                        <option value="crossesBelow">crosses below</option>
                      </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '8px', alignItems: 'center' }}>
                      <select
                        value={cond.targetType}
                        onChange={(e) => handleConditionChange('sell', idx, 'targetType', e.target.value)}
                        style={{ background: 'rgba(10,14,39,0.5)', border: '1px solid rgba(255,255,255,0.08)', padding: '6px', borderRadius: '6px', color: '#ffffff', fontSize: '11px' }}
                      >
                        <option value="value">Value</option>
                        <option value="indicator">Indicator</option>
                      </select>
                      
                      {cond.targetType === 'value' ? (
                        <input
                          type="number"
                          value={cond.targetValue}
                          onChange={(e) => handleConditionChange('sell', idx, 'targetValue', parseFloat(e.target.value) || 0)}
                          style={{ background: 'rgba(10,14,39,0.5)', border: '1px solid rgba(255,255,255,0.08)', padding: '6px', borderRadius: '6px', color: '#ffffff', fontSize: '12px', width: '100%', boxSizing: 'border-box' }}
                        />
                      ) : (
                        <select
                          value={cond.targetIndicator}
                          onChange={(e) => handleConditionChange('sell', idx, 'targetIndicator', e.target.value)}
                          style={{ background: 'rgba(10,14,39,0.5)', border: '1px solid rgba(255,255,255,0.08)', padding: '6px', borderRadius: '6px', color: '#ffffff', fontSize: '12px' }}
                        >
                          <option value="EMA20">EMA 20</option>
                          <option value="EMA50">EMA 50</option>
                          <option value="SMA20">SMA 20</option>
                          <option value="SMA50">SMA 50</option>
                          <option value="SignalLine">Signal Line</option>
                        </select>
                      )}
                    </div>
                  </div>
                ))}

                {sellConditions.length > 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Logic gate:</span>
                    <select 
                      value={sellLogicGate} 
                      onChange={(e) => setSellLogicGate(e.target.value)}
                      style={{ background: 'rgba(10,14,39,0.5)', border: '1px solid rgba(255,255,255,0.08)', padding: '4px', borderRadius: '4px', color: '#ffffff', fontSize: '11px', fontWeight: '800' }}
                    >
                      <option value="AND">AND (All rules must match)</option>
                      <option value="OR">OR (Any rule can match)</option>
                    </select>
                  </div>
                )}

                <button
                  onClick={() => handleAddCondition('sell')}
                  style={{ background: 'rgba(255, 68, 68, 0.08)', border: '1px dashed rgba(255, 68, 68, 0.25)', borderRadius: '8px', color: '#ff4444', padding: '8px', fontSize: '12px', cursor: 'pointer', fontWeight: '800' }}
                >
                  + Add Sell Rule
                </button>
              </div>
            </div>

          </div>

          {/* Action Row */}
          <div style={{ display: 'flex', gap: '16px' }}>
            <button
              onClick={handleRunBacktest}
              disabled={running}
              style={{
                flex: 1,
                background: 'linear-gradient(135deg, #00ff88 0%, #00bcd4 100%)',
                border: 'none',
                borderRadius: '12px',
                color: '#0a0e27',
                padding: '16px',
                fontWeight: '900',
                fontSize: '15px',
                cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(0, 255, 136, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                opacity: running ? 0.6 : 1
              }}
            >
              {running ? (
                <>
                  <RefreshCw className="animate-spin" size={18} />
                  Running Strategy Simulation...
                </>
              ) : (
                <>
                  <Play size={18} />
                  Run Backtest Simulation
                </>
              )}
            </button>
            <button
              onClick={() => setShowSaveModal(true)}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                color: '#ffffff',
                padding: '16px 24px',
                fontWeight: '800',
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Save size={18} />
              Save Config
            </button>
            <button
              onClick={handleShareStrategy}
              disabled={!backtestResult}
              style={{
                background: 'rgba(0, 255, 136, 0.05)',
                border: '1px solid rgba(0, 255, 136, 0.15)',
                borderRadius: '12px',
                color: '#00ff88',
                padding: '16px 24px',
                fontWeight: '800',
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                opacity: backtestResult ? 1 : 0.5
              }}
            >
              <Share2 size={18} />
              Share to Feed
            </button>
            <button
              onClick={handleDeployBot}
              style={{
                background: user?.is_pro ? 'linear-gradient(135deg, #ffe082 0%, #ffb300 100%)' : 'rgba(255, 179, 0, 0.05)',
                border: user?.is_pro ? 'none' : '1px dashed rgba(255, 179, 0, 0.3)',
                borderRadius: '12px',
                color: user?.is_pro ? '#0b0803' : '#ffb300',
                padding: '16px 24px',
                fontWeight: '900',
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: user?.is_pro ? '0 4px 15px rgba(255, 179, 0, 0.2)' : 'none'
              }}
            >
              <Sparkles size={18} />
              {user?.is_pro ? 'Deploy Bot' : '🔒 Deploy Bot'}
            </button>
          </div>

          {/* Simulation Output Scorecard */}
          {backtestResult && (
            <div style={{
              background: 'var(--bg-card-glass)',
              border: '1px solid rgba(0, 255, 136, 0.2)',
              borderRadius: '16px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Award size={20} style={{ color: '#ffb300' }} />
                  Simulation Performance Summary
                </h3>
                <span style={{ fontSize: '11px', background: 'rgba(0, 255, 136, 0.1)', color: '#00ff88', padding: '4px 10px', borderRadius: '4px', fontWeight: '700' }}>
                  SUCCESS
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px' }}>
                
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase' }}>Win Rate</span>
                  <span style={{ fontSize: '24px', fontWeight: '900', color: backtestResult.winRate >= 50 ? '#00ff88' : '#ff4444' }}>
                    {backtestResult.winRate}%
                  </span>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase' }}>Net Profit</span>
                  <span style={{ fontSize: '24px', fontWeight: '900', color: backtestResult.profit >= 0 ? '#00ff88' : '#ff4444' }}>
                    {backtestResult.profit >= 0 ? '+' : ''}{backtestResult.profit}%
                  </span>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase' }}>Max Drawdown</span>
                  <span style={{ fontSize: '24px', fontWeight: '900', color: '#ff9800' }}>
                    {backtestResult.drawdown}%
                  </span>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase' }}>Sharpe Ratio</span>
                  <span style={{ fontSize: '24px', fontWeight: '900', color: '#00bcd4' }}>
                    {backtestResult.sharpeRatio}
                  </span>
                </div>

              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.01)', padding: '12px', borderRadius: '8px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Max Peak Loss (₹):</span>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: '#ff4444' }}>
                    ₹{backtestResult.maxLoss.toLocaleString('en-IN')}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.01)', padding: '12px', borderRadius: '8px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Avg Holding Time:</span>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: '#ffffff' }}>
                    {backtestResult.avgHoldingTime} bars
                  </span>
                </div>
              </div>

              {/* Trade Logs List */}
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase', margin: '0 0 10px 0' }}>
                  Simulated Trade Execution Logs
                </h4>
                <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <th style={{ padding: '8px 12px' }}>Entry Date</th>
                        <th style={{ padding: '8px 12px' }}>Exit Date</th>
                        <th style={{ padding: '8px 12px' }}>Entry Price</th>
                        <th style={{ padding: '8px 12px' }}>Exit Price</th>
                        <th style={{ padding: '8px 12px' }}>PnL %</th>
                        <th style={{ padding: '8px 12px' }}>Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {backtestResult.trades.map((t, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                          <td style={{ padding: '8px 12px' }}>{t.entryDate}</td>
                          <td style={{ padding: '8px 12px' }}>{t.exitDate}</td>
                          <td style={{ padding: '8px 12px' }}>₹{t.entryPrice.toFixed(2)}</td>
                          <td style={{ padding: '8px 12px' }}>₹{t.exitPrice.toFixed(2)}</td>
                          <td style={{ padding: '8px 12px', fontWeight: '800', color: t.pnl >= 0 ? '#00ff88' : '#ff4444' }}>
                            {t.pnl >= 0 ? '+' : ''}{t.pnl}%
                          </td>
                          <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>{t.exitReason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Right Side: Saved Strategies column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div style={{
            background: 'var(--bg-card-glass)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Copy size={16} style={{ color: '#00ff88' }} />
              Saved Systems ({savedStrategies.length})
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '550px', overflowY: 'auto' }}>
              {savedStrategies.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', fontSize: '12px', margin: 0, textAlign: 'center', padding: '24px 0' }}>
                  No saved strategy configurations yet. Customize buy/sell rules and click Save Config to persist.
                </p>
              ) : (
                savedStrategies.map(strat => (
                  <div key={strat.id} style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.04)',
                    borderRadius: '10px',
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', fontWeight: '800', color: '#00ff88' }}>{strat.name}</span>
                      <button
                        onClick={() => handleDeleteStrategy(strat.id)}
                        style={{ background: 'transparent', border: 'none', color: '#ff4444', cursor: 'pointer', padding: 0 }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                      <strong>Buy Rules:</strong> {strat.indicators?.buyConditions?.length || 0} setups <br/>
                      <strong>Sell Rules:</strong> {strat.indicators?.sellConditions?.length || 0} setups <br/>
                      <strong>SL:</strong> {strat.stopLoss}% | <strong>TP:</strong> {strat.takeProfit}%
                    </div>

                    <button
                      onClick={() => {
                        setBuyConditions(strat.indicators?.buyConditions || []);
                        setBuyLogicGate(strat.indicators?.buyLogicGate || 'AND');
                        setSellConditions(strat.indicators?.sellConditions || []);
                        setSellLogicGate(strat.indicators?.sellLogicGate || 'AND');
                        setStopLossPct(strat.stopLoss || 0);
                        setTakeProfitPct(strat.takeProfit || 0);
                        setCapital(strat.capital || 1000000);
                        toast.success(`Loaded strategy "${strat.name}"`);
                      }}
                      style={{
                        background: 'rgba(0, 255, 136, 0.08)',
                        border: '1px solid rgba(0, 255, 136, 0.15)',
                        borderRadius: '6px',
                        color: '#00ff88',
                        padding: '6px',
                        fontSize: '11px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        textAlign: 'center'
                      }}
                    >
                      Load Configuration
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Save Strategy Modal */}
      {showSaveModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            background: 'var(--bg-card-glass)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            padding: '24px',
            width: '400px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', margin: 0 }}>Save Strategy Configuration</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Strategy Name</label>
              <input
                type="text"
                value={newStrategyName}
                onChange={(e) => setNewStrategyName(e.target.value)}
                placeholder="e.g. Dual SMA Cross System"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  padding: '10px',
                  borderRadius: '8px',
                  color: '#ffffff',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button
                onClick={handleSaveStrategy}
                style={{
                  flex: 1,
                  background: 'linear-gradient(135deg, #00ff88 0%, #00bcd4 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#0a0e27',
                  padding: '12px',
                  fontWeight: '800',
                  cursor: 'pointer'
                }}
              >
                Save
              </button>
              <button
                onClick={() => {
                  setShowSaveModal(false);
                  setNewStrategyName('');
                }}
                style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.05)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#ffffff',
                  padding: '12px',
                  fontWeight: '800',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
