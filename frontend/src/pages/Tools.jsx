import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Coins, 
  Percent, 
  Target, 
  ArrowUpRight, 
  Scale,
  Calculator,
  Briefcase,
  AlertCircle,
  HelpCircle
} from 'lucide-react';

export default function Tools() {
  const [calc, setCalc] = useState('sip');
  const [inputs, setInputs] = useState({
    // SIP default inputs
    sipMonthly: 25000,
    sipYears: 10,
    sipRate: 12,
    sipStepUp: 10,
    sipInflation: 6,
    sipAdjustInflation: false,

    // Lumpsum defaults
    lumpsumAmount: 100000,
    lumpsumYears: 10,
    lumpsumRate: 12,
    lumpsumInflation: 6,
    lumpsumAdjustInflation: false,

    // EMI defaults
    emiLoan: 3000000,
    emiYears: 15,
    emiRate: 8.5,

    // Brokerage defaults
    brokerageBuy: 1000,
    brokerageSell: 1050,
    brokerageQty: 100,
    brokerageType: 'delivery', // delivery | intraday | futures

    // Position sizing defaults
    positionCapital: 500000,
    positionRisk: 1,
    positionEntry: 100,
    positionStopLoss: 95,
    positionTarget: 115,

    // CAGR defaults
    cagrInitial: 50000,
    cagrFinal: 120000,
    cagrYears: 5
  });

  const [result, setResult] = useState(null);

  // Compute active calculation whenever inputs or active calculator change
  useEffect(() => {
    calculateResults();
  }, [inputs, calc]);

  const updateVal = (key, val) => {
    setInputs(prev => ({ ...prev, [key]: val }));
  };

  const calculateResults = () => {
    switch (calc) {
      case 'sip': {
        const monthly = parseFloat(inputs.sipMonthly) || 0;
        const years = parseFloat(inputs.sipYears) || 0;
        const rate = parseFloat(inputs.sipRate) || 0;
        const stepup = parseFloat(inputs.sipStepUp) || 0;
        const inflation = parseFloat(inputs.sipInflation) || 0;

        let totalInvested = 0;
        let futureValue = 0;
        let monthlyAmount = monthly;

        // Month-by-month simulation to account for annual step-up
        const r = rate / 12 / 100;
        for (let year = 1; year <= years; year++) {
          if (year > 1) {
            monthlyAmount = monthlyAmount * (1 + stepup / 100);
          }
          for (let month = 1; month <= 12; month++) {
            totalInvested += monthlyAmount;
            // Compound monthly
            futureValue = (futureValue + monthlyAmount) * (1 + r);
          }
        }

        let returns = futureValue - totalInvested;
        let inflationAdjustedValue = futureValue;
        if (inputs.sipAdjustInflation) {
          inflationAdjustedValue = futureValue / Math.pow(1 + inflation / 100, years);
        }

        setResult({
          invested: totalInvested.toFixed(0),
          returns: returns.toFixed(0),
          futureValue: futureValue.toFixed(0),
          inflationAdjusted: inputs.sipAdjustInflation ? inflationAdjustedValue.toFixed(0) : null
        });
        break;
      }
      case 'lumpsum': {
        const amount = parseFloat(inputs.lumpsumAmount) || 0;
        const years = parseFloat(inputs.lumpsumYears) || 0;
        const rate = parseFloat(inputs.lumpsumRate) || 0;
        const inflation = parseFloat(inputs.lumpsumInflation) || 0;

        const futureValue = amount * Math.pow(1 + rate / 100, years);
        const returns = futureValue - amount;
        let inflationAdjustedValue = futureValue;
        if (inputs.lumpsumAdjustInflation) {
          inflationAdjustedValue = futureValue / Math.pow(1 + inflation / 100, years);
        }

        setResult({
          invested: amount.toFixed(0),
          returns: returns.toFixed(0),
          futureValue: futureValue.toFixed(0),
          inflationAdjusted: inputs.lumpsumAdjustInflation ? inflationAdjustedValue.toFixed(0) : null
        });
        break;
      }
      case 'emi': {
        const loan = parseFloat(inputs.emiLoan) || 0;
        const years = parseFloat(inputs.emiYears) || 0;
        const rate = parseFloat(inputs.emiRate) || 0;

        const r = rate / 12 / 100;
        const n = years * 12;
        const emi = loan * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
        const totalPayment = emi * n;
        const interest = totalPayment - loan;

        setResult({
          monthlyEmi: emi.toFixed(0),
          principal: loan.toFixed(0),
          interest: interest.toFixed(0),
          totalPayment: totalPayment.toFixed(0)
        });
        break;
      }
      case 'brokerage': {
        const buy = parseFloat(inputs.brokerageBuy) || 0;
        const sell = parseFloat(inputs.brokerageSell) || 0;
        const qty = parseFloat(inputs.brokerageQty) || 0;
        const type = inputs.brokerageType; // delivery | intraday | futures

        const turnover = (buy + sell) * qty;
        const gross = (sell - buy) * qty;

        // Realistic Zerodha-like charges
        let brokerage = 0;
        if (type === 'intraday' || type === 'futures') {
          const buyBrokerage = Math.min(buy * qty * 0.0003, 20);
          const sellBrokerage = Math.min(sell * qty * 0.0003, 20);
          brokerage = buyBrokerage + sellBrokerage;
        }

        // STT (Securities Transaction Tax)
        let stt = 0;
        if (type === 'delivery') {
          stt = turnover * 0.001; // 0.1% on buy & sell
        } else if (type === 'intraday') {
          stt = sell * qty * 0.00025; // 0.025% on sell only
        } else if (type === 'futures') {
          stt = sell * qty * 0.000125; // 0.0125% on sell only
        }

        // Exchange transaction charges (NSE: ~0.00345%)
        const exchangeCharges = turnover * 0.0000345;

        // GST: 18% of (brokerage + exchange charges)
        const gst = (brokerage + exchangeCharges) * 0.18;

        // SEBI Charges: ₹10 per crore (0.0001%)
        const sebiCharges = turnover * 0.0000001;

        // Stamp Duty (on buy only)
        let stampDuty = 0;
        if (type === 'delivery') {
          stampDuty = buy * qty * 0.00015; // 0.015%
        } else if (type === 'intraday') {
          stampDuty = buy * qty * 0.00003; // 0.003%
        } else if (type === 'futures') {
          stampDuty = buy * qty * 0.00002; // 0.002%
        }

        const totalCharges = brokerage + stt + exchangeCharges + gst + sebiCharges + stampDuty;
        const netProfit = gross - totalCharges;

        setResult({
          grossProfit: gross.toFixed(2),
          brokerage: brokerage.toFixed(2),
          taxesAndCharges: totalCharges.toFixed(2),
          netProfit: netProfit.toFixed(2)
        });
        break;
      }
      case 'position': {
        const capital = parseFloat(inputs.positionCapital) || 0;
        const riskPercent = parseFloat(inputs.positionRisk) || 0;
        const entry = parseFloat(inputs.positionEntry) || 0;
        const stopLoss = parseFloat(inputs.positionStopLoss) || 0;
        const target = parseFloat(inputs.positionTarget) || 0;

        const riskAmount = capital * (riskPercent / 100);
        const riskPerShare = Math.abs(entry - stopLoss);
        
        let qty = 0;
        let positionValue = 0;
        let rrRatio = 0;
        let potentialGain = 0;

        if (riskPerShare > 0) {
          qty = Math.floor(riskAmount / riskPerShare);
          positionValue = qty * entry;
          const rewardPerShare = Math.abs(target - entry);
          rrRatio = rewardPerShare / riskPerShare;
          potentialGain = qty * rewardPerShare;
        }

        setResult({
          riskAmount: riskAmount.toFixed(0),
          quantity: qty,
          positionValue: positionValue.toFixed(0),
          riskRewardRatio: rrRatio.toFixed(2),
          potentialGain: potentialGain.toFixed(0)
        });
        break;
      }
      case 'cagr': {
        const initial = parseFloat(inputs.cagrInitial) || 0;
        const final = parseFloat(inputs.cagrFinal) || 0;
        const years = parseFloat(inputs.cagrYears) || 0;

        let cagr = 0;
        if (initial > 0 && final > 0 && years > 0) {
          cagr = (Math.pow(final / initial, 1 / years) - 1) * 100;
        }

        setResult({
          absoluteReturn: (((final - initial) / initial) * 100).toFixed(2),
          cagr: cagr.toFixed(2),
          gain: (final - initial).toFixed(0)
        });
        break;
      }
      default:
        break;
    }
  };

  const calculatorsList = [
    { id: 'sip', name: 'SIP Calculator', icon: <TrendingUp size={16} /> },
    { id: 'lumpsum', name: 'Lumpsum Calculator', icon: <Coins size={16} /> },
    { id: 'emi', name: 'EMI Loan Calculator', icon: <Calculator size={16} /> },
    { id: 'brokerage', name: 'Brokerage & Taxes', icon: <Percent size={16} /> },
    { id: 'position', name: 'Position Size & Risk', icon: <Scale size={16} /> },
    { id: 'cagr', name: 'CAGR Calculator', icon: <Briefcase size={16} /> }
  ];

  // Helper to draw clean custom SVG Pie chart
  const renderPieChart = () => {
    if (!result) return null;
    let title1 = "", val1 = 0, title2 = "", val2 = 0;

    if (calc === 'sip' || calc === 'lumpsum') {
      title1 = "Invested";
      val1 = parseFloat(result.invested);
      title2 = "Returns";
      val2 = parseFloat(result.returns);
    } else if (calc === 'emi') {
      title1 = "Principal";
      val1 = parseFloat(result.principal);
      title2 = "Interest";
      val2 = parseFloat(result.interest);
    } else if (calc === 'brokerage') {
      title1 = "Taxes & Charges";
      val1 = Math.max(parseFloat(result.taxesAndCharges), 0);
      title2 = "Net Profit";
      val2 = Math.max(parseFloat(result.netProfit), 0);
      if (val2 <= 0) {
        val2 = Math.abs(parseFloat(result.grossProfit)); // fallback
        title2 = "Gross Loss";
      }
    } else if (calc === 'position') {
      title1 = "Risk amount";
      val1 = parseFloat(result.riskAmount);
      title2 = "Target profit";
      val2 = parseFloat(result.potentialGain);
    } else if (calc === 'cagr') {
      title1 = "Initial Capital";
      val1 = parseFloat(inputs.cagrInitial);
      title2 = "Wealth Gained";
      val2 = parseFloat(result.gain);
    }

    const total = val1 + val2;
    if (total <= 0) return null;

    const r = 40;
    const circ = 2 * Math.PI * r;
    const pct1 = (val1 / total) * 100;
    const pct2 = (val2 / total) * 100;
    const strokeOffset = circ - (pct1 / 100) * circ;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '24px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '12px', padding: '16px' }}>
        <h4 style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#9b9eac' }}>Visual Breakdown</h4>
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <svg width="120" height="120" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
            {/* Outer Circle (representing val2) */}
            <circle 
              cx="50" 
              cy="50" 
              r={r} 
              fill="transparent" 
              stroke="#00bcd4" 
              strokeWidth="12" 
            />
            {/* Overlay Circle (representing val1) */}
            <circle 
              cx="50" 
              cy="50" 
              r={r} 
              fill="transparent" 
              stroke="#00ff88" 
              strokeWidth="12" 
              strokeDasharray={circ}
              strokeDashoffset={strokeOffset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.3s ease' }}
            />
          </svg>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#00ff88' }}></div>
              <span style={{ fontSize: '12px', color: '#9b9eac' }}>{title1} ({pct1.toFixed(1)}%)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#00bcd4' }}></div>
              <span style={{ fontSize: '12px', color: '#9b9eac' }}>{title2} ({pct2.toFixed(1)}%)</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ paddingBottom: '40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <h1 style={{ margin: 0, backgroundImage: 'linear-gradient(135deg, #00ff88, #00bcd4)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent', color: 'transparent' }}>
          Financial Tools & Calculators
        </h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '24px', alignItems: 'start' }}>
        {/* Navigation Sidebar */}
        <div style={{ background: '#0a0e27', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <h3 style={{ margin: '0 0 12px 6px', fontSize: '11px', fontWeight: 800, color: '#9b9eac', letterSpacing: '0.8px', textTransform: 'uppercase' }}>Available Calculators</h3>
          {calculatorsList.map(item => (
            <button 
              key={item.id} 
              onClick={() => setCalc(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 14px',
                border: 'none',
                borderRadius: '10px',
                background: calc === item.id ? 'rgba(0, 255, 136, 0.1)' : 'transparent',
                color: calc === item.id ? '#00ff88' : '#e1e3e6',
                cursor: 'pointer',
                fontWeight: calc === item.id ? '700' : '500',
                fontSize: '13px',
                textAlign: 'left',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                if (calc !== item.id) e.target.style.background = 'rgba(255,255,255,0.02)';
              }}
              onMouseOut={(e) => {
                if (calc !== item.id) e.target.style.background = 'transparent';
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', color: calc === item.id ? '#00ff88' : '#9b9eac' }}>
                {item.icon}
              </span>
              {item.name}
            </button>
          ))}
        </div>

        {/* Calculation Panel */}
        <div style={{ background: '#0a0e27', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '32px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '36px' }}>
            
            {/* Input Controls */}
            <div>
              {calc === 'sip' && (
                <>
                  <h2 style={{ margin: '0 0 24px 0', fontSize: '22px', display: 'flex', alignItems: 'center', gap: '8px' }}><TrendingUp size={20} style={{ color: '#00ff88' }} /> Systematic Investment Plan (SIP)</h2>
                  
                  <div className="input-group" style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '13px', color: '#9b9eac' }}>Monthly Investment</span>
                      <strong style={{ fontSize: '14px', color: '#ffffff' }}>₹{(inputs.sipMonthly).toLocaleString('en-IN')}</strong>
                    </div>
                    <input type="range" min="500" max="200000" step="500" value={inputs.sipMonthly} onChange={(e) => updateVal('sipMonthly', parseInt(e.target.value))} style={{ width: '100%', accentColor: '#00ff88' }} />
                  </div>

                  <div className="input-group" style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '13px', color: '#9b9eac' }}>Time Period</span>
                      <strong style={{ fontSize: '14px', color: '#ffffff' }}>{inputs.sipYears} Years</strong>
                    </div>
                    <input type="range" min="1" max="40" value={inputs.sipYears} onChange={(e) => updateVal('sipYears', parseInt(e.target.value))} style={{ width: '100%', accentColor: '#00ff88' }} />
                  </div>

                  <div className="input-group" style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '13px', color: '#9b9eac' }}>Expected Return Rate (p.a.)</span>
                      <strong style={{ fontSize: '14px', color: '#ffffff' }}>{inputs.sipRate}%</strong>
                    </div>
                    <input type="range" min="1" max="30" step="0.5" value={inputs.sipRate} onChange={(e) => updateVal('sipRate', parseFloat(e.target.value))} style={{ width: '100%', accentColor: '#00ff88' }} />
                  </div>

                  <div className="input-group" style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '13px', color: '#9b9eac' }}>Annual Step-Up (Salary Increase)</span>
                      <strong style={{ fontSize: '14px', color: '#ffffff' }}>{inputs.sipStepUp}%</strong>
                    </div>
                    <input type="range" min="0" max="30" step="1" value={inputs.sipStepUp} onChange={(e) => updateVal('sipStepUp', parseInt(e.target.value))} style={{ width: '100%', accentColor: '#00ff88' }} />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px' }}>
                    <input 
                      type="checkbox" 
                      id="sipInflationCheck" 
                      checked={inputs.sipAdjustInflation} 
                      onChange={(e) => updateVal('sipAdjustInflation', e.target.checked)}
                      style={{ width: '16px', height: '16px', accentColor: '#00ff88', cursor: 'pointer' }}
                    />
                    <label htmlFor="sipInflationCheck" style={{ fontSize: '13px', color: '#9b9eac', cursor: 'pointer' }}>Adjust results for inflation (6% p.a.)</label>
                  </div>
                </>
              )}

              {calc === 'lumpsum' && (
                <>
                  <h2 style={{ margin: '0 0 24px 0', fontSize: '22px', display: 'flex', alignItems: 'center', gap: '8px' }}><Coins size={20} style={{ color: '#00bcd4' }} /> Lumpsum Investment</h2>

                  <div className="input-group" style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '13px', color: '#9b9eac' }}>Total Investment Amount</span>
                      <strong style={{ fontSize: '14px', color: '#ffffff' }}>₹{(inputs.lumpsumAmount).toLocaleString('en-IN')}</strong>
                    </div>
                    <input type="range" min="5000" max="10000000" step="5000" value={inputs.lumpsumAmount} onChange={(e) => updateVal('lumpsumAmount', parseInt(e.target.value))} style={{ width: '100%', accentColor: '#00bcd4' }} />
                  </div>

                  <div className="input-group" style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '13px', color: '#9b9eac' }}>Time Period</span>
                      <strong style={{ fontSize: '14px', color: '#ffffff' }}>{inputs.lumpsumYears} Years</strong>
                    </div>
                    <input type="range" min="1" max="40" value={inputs.lumpsumYears} onChange={(e) => updateVal('lumpsumYears', parseInt(e.target.value))} style={{ width: '100%', accentColor: '#00bcd4' }} />
                  </div>

                  <div className="input-group" style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '13px', color: '#9b9eac' }}>Expected Return Rate (p.a.)</span>
                      <strong style={{ fontSize: '14px', color: '#ffffff' }}>{inputs.lumpsumRate}%</strong>
                    </div>
                    <input type="range" min="1" max="30" step="0.5" value={inputs.lumpsumRate} onChange={(e) => updateVal('lumpsumRate', parseFloat(e.target.value))} style={{ width: '100%', accentColor: '#00bcd4' }} />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px' }}>
                    <input 
                      type="checkbox" 
                      id="lumpInflationCheck" 
                      checked={inputs.lumpsumAdjustInflation} 
                      onChange={(e) => updateVal('lumpsumAdjustInflation', e.target.checked)}
                      style={{ width: '16px', height: '16px', accentColor: '#00bcd4', cursor: 'pointer' }}
                    />
                    <label htmlFor="lumpInflationCheck" style={{ fontSize: '13px', color: '#9b9eac', cursor: 'pointer' }}>Adjust results for inflation (6% p.a.)</label>
                  </div>
                </>
              )}

              {calc === 'emi' && (
                <>
                  <h2 style={{ margin: '0 0 24px 0', fontSize: '22px', display: 'flex', alignItems: 'center', gap: '8px' }}><Calculator size={20} style={{ color: '#00ff88' }} /> Home/Car Loan EMI</h2>

                  <div className="input-group" style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '13px', color: '#9b9eac' }}>Loan Amount</span>
                      <strong style={{ fontSize: '14px', color: '#ffffff' }}>₹{(inputs.emiLoan).toLocaleString('en-IN')}</strong>
                    </div>
                    <input type="range" min="50000" max="20000000" step="50000" value={inputs.emiLoan} onChange={(e) => updateVal('emiLoan', parseInt(e.target.value))} style={{ width: '100%', accentColor: '#00ff88' }} />
                  </div>

                  <div className="input-group" style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '13px', color: '#9b9eac' }}>Tenure</span>
                      <strong style={{ fontSize: '14px', color: '#ffffff' }}>{inputs.emiYears} Years</strong>
                    </div>
                    <input type="range" min="1" max="30" value={inputs.emiYears} onChange={(e) => updateVal('emiYears', parseInt(e.target.value))} style={{ width: '100%', accentColor: '#00ff88' }} />
                  </div>

                  <div className="input-group" style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '13px', color: '#9b9eac' }}>Interest Rate</span>
                      <strong style={{ fontSize: '14px', color: '#ffffff' }}>{inputs.emiRate}%</strong>
                    </div>
                    <input type="range" min="5" max="20" step="0.1" value={inputs.emiRate} onChange={(e) => updateVal('emiRate', parseFloat(e.target.value))} style={{ width: '100%', accentColor: '#00ff88' }} />
                  </div>
                </>
              )}

              {calc === 'brokerage' && (
                <>
                  <h2 style={{ margin: '0 0 24px 0', fontSize: '22px', display: 'flex', alignItems: 'center', gap: '8px' }}><Percent size={20} style={{ color: '#00bcd4' }} /> Brokerage & Indian Taxes</h2>

                  <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                    {['delivery', 'intraday', 'futures'].map(type => (
                      <button 
                        key={type}
                        onClick={() => updateVal('brokerageType', type)}
                        style={{
                          flex: 1,
                          padding: '10px',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: '8px',
                          background: inputs.brokerageType === type ? 'rgba(0,188,212,0.1)' : 'rgba(255,255,255,0.02)',
                          color: inputs.brokerageType === type ? '#00bcd4' : '#e1e3e6',
                          fontWeight: '600',
                          fontSize: '12px',
                          cursor: 'pointer',
                          textTransform: 'uppercase'
                        }}
                      >
                        {type}
                      </button>
                    ))}
                  </div>

                  <div className="input-group" style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '13px', color: '#9b9eac', marginBottom: '6px' }}>Buy Price (₹)</label>
                    <input 
                      type="number" 
                      value={inputs.brokerageBuy} 
                      onChange={(e) => updateVal('brokerageBuy', parseFloat(e.target.value) || 0)} 
                      style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#ffffff', outline: 'none' }}
                    />
                  </div>

                  <div className="input-group" style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '13px', color: '#9b9eac', marginBottom: '6px' }}>Sell Price (₹)</label>
                    <input 
                      type="number" 
                      value={inputs.brokerageSell} 
                      onChange={(e) => updateVal('brokerageSell', parseFloat(e.target.value) || 0)} 
                      style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#ffffff', outline: 'none' }}
                    />
                  </div>

                  <div className="input-group" style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '13px', color: '#9b9eac', marginBottom: '6px' }}>Quantity</label>
                    <input 
                      type="number" 
                      value={inputs.brokerageQty} 
                      onChange={(e) => updateVal('brokerageQty', parseFloat(e.target.value) || 0)} 
                      style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#ffffff', outline: 'none' }}
                    />
                  </div>
                </>
              )}

              {calc === 'position' && (
                <>
                  <h2 style={{ margin: '0 0 24px 0', fontSize: '22px', display: 'flex', alignItems: 'center', gap: '8px' }}><Scale size={20} style={{ color: '#00ff88' }} /> Risk & Position Sizing</h2>

                  <div className="input-group" style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '13px', color: '#9b9eac', marginBottom: '6px' }}>Trading Capital (₹)</label>
                    <input 
                      type="number" 
                      value={inputs.positionCapital} 
                      onChange={(e) => updateVal('positionCapital', parseFloat(e.target.value) || 0)} 
                      style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#ffffff', outline: 'none' }}
                    />
                  </div>

                  <div className="input-group" style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '13px', color: '#9b9eac' }}>Risk per Trade (%)</span>
                      <strong style={{ fontSize: '14px', color: '#ffffff' }}>{inputs.positionRisk}%</strong>
                    </div>
                    <input type="range" min="0.25" max="10" step="0.25" value={inputs.positionRisk} onChange={(e) => updateVal('positionRisk', parseFloat(e.target.value))} style={{ width: '100%', accentColor: '#00ff88' }} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '12px' }}>
                    <div className="input-group">
                      <label style={{ display: 'block', fontSize: '13px', color: '#9b9eac', marginBottom: '6px' }}>Entry Price (₹)</label>
                      <input 
                        type="number" 
                        value={inputs.positionEntry} 
                        onChange={(e) => updateVal('positionEntry', parseFloat(e.target.value) || 0)} 
                        style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#ffffff', outline: 'none' }}
                      />
                    </div>
                    <div className="input-group">
                      <label style={{ display: 'block', fontSize: '13px', color: '#9b9eac', marginBottom: '6px' }}>Stop Loss (₹)</label>
                      <input 
                        type="number" 
                        value={inputs.positionStopLoss} 
                        onChange={(e) => updateVal('positionStopLoss', parseFloat(e.target.value) || 0)} 
                        style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#ffffff', outline: 'none' }}
                      />
                    </div>
                  </div>

                  <div className="input-group" style={{ marginTop: '16px' }}>
                    <label style={{ display: 'block', fontSize: '13px', color: '#9b9eac', marginBottom: '6px' }}>Target Profit Price (₹)</label>
                    <input 
                      type="number" 
                      value={inputs.positionTarget} 
                      onChange={(e) => updateVal('positionTarget', parseFloat(e.target.value) || 0)} 
                      style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#ffffff', outline: 'none' }}
                    />
                  </div>
                </>
              )}

              {calc === 'cagr' && (
                <>
                  <h2 style={{ margin: '0 0 24px 0', fontSize: '22px', display: 'flex', alignItems: 'center', gap: '8px' }}><Briefcase size={20} style={{ color: '#00bcd4' }} /> CAGR Returns</h2>

                  <div className="input-group" style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '13px', color: '#9b9eac', marginBottom: '6px' }}>Initial Capital / Buy Value (₹)</label>
                    <input 
                      type="number" 
                      value={inputs.cagrInitial} 
                      onChange={(e) => updateVal('cagrInitial', parseFloat(e.target.value) || 0)} 
                      style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#ffffff', outline: 'none' }}
                    />
                  </div>

                  <div className="input-group" style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '13px', color: '#9b9eac', marginBottom: '6px' }}>Final Value / Sell Value (₹)</label>
                    <input 
                      type="number" 
                      value={inputs.cagrFinal} 
                      onChange={(e) => updateVal('cagrFinal', parseFloat(e.target.value) || 0)} 
                      style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#ffffff', outline: 'none' }}
                    />
                  </div>

                  <div className="input-group" style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '13px', color: '#9b9eac' }}>Investment Duration</span>
                      <strong style={{ fontSize: '14px', color: '#ffffff' }}>{inputs.cagrYears} Years</strong>
                    </div>
                    <input type="range" min="0.5" max="30" step="0.5" value={inputs.cagrYears} onChange={(e) => updateVal('cagrYears', parseFloat(e.target.value))} style={{ width: '100%', accentColor: '#00bcd4' }} />
                  </div>
                </>
              )}
            </div>

            {/* Results Output */}
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '380px' }}>
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '24px' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <HelpCircle size={16} style={{ color: '#00ff88' }} /> Results Overview
                </h3>

                {result && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {Object.entries(result).map(([k, v]) => {
                      if (v === null) return null;
                      
                      let formattedValue = v;
                      let isProfit = k.toLowerCase().includes('profit') || k.toLowerCase().includes('returns') || k.toLowerCase().includes('adjusted') || k.toLowerCase().includes('gain');
                      let isRatio = k.toLowerCase().includes('ratio') || k.toLowerCase().includes('multiplier');

                      if (!isRatio && !k.toLowerCase().includes('quantity') && !k.toLowerCase().includes('return') && !k.toLowerCase().includes('cagr')) {
                        formattedValue = '₹' + parseFloat(v).toLocaleString('en-IN');
                      } else if (k.toLowerCase().includes('return') || k.toLowerCase().includes('cagr')) {
                        formattedValue = v + '%';
                      }

                      // Label cleaning
                      let label = k.replace(/([A-Z])/g, ' $1').trim();
                      label = label.charAt(0).toUpperCase() + label.slice(1);

                      return (
                        <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '10px' }}>
                          <span style={{ fontSize: '13px', color: '#9b9eac' }}>{label}</span>
                          <span style={{ 
                            fontSize: '18px', 
                            fontWeight: '700', 
                            color: isProfit ? '#00ff88' : '#ffffff' 
                          }}>
                            {formattedValue}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Dynamic SVG Pie chart breakdown */}
              {renderPieChart()}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}