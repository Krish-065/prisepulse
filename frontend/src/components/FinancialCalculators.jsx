import { useState } from 'react';

export default function FinancialCalculators() {
  const [activeCalc, setActiveCalc] = useState('sip');
  const [calcInputs, setCalcInputs] = useState({});
  const [result, setResult] = useState(null);

  // SIP Calculator
  const calculateSIP = () => {
    const { monthlyAmount, years, rate } = calcInputs;
    if (!monthlyAmount || !years || !rate) return;
    const monthlyRate = rate / 12 / 100;
    const months = years * 12;
    const futureValue = monthlyAmount * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate);
    const invested = monthlyAmount * months;
    const returns = futureValue - invested;
    setResult({ futureValue: futureValue.toFixed(2), invested: invested.toFixed(2), returns: returns.toFixed(2) });
  };

  // Lumpsum Calculator
  const calculateLumpsum = () => {
    const { amount, years, rate } = calcInputs;
    const futureValue = amount * Math.pow(1 + rate / 100, years);
    const returns = futureValue - amount;
    setResult({ futureValue: futureValue.toFixed(2), invested: amount, returns: returns.toFixed(2) });
  };

  // EMI Calculator
  const calculateEMI = () => {
    const { loanAmount, years, rate } = calcInputs;
    const monthlyRate = rate / 12 / 100;
    const months = years * 12;
    const emi = loanAmount * monthlyRate * Math.pow(1 + monthlyRate, months) / (Math.pow(1 + monthlyRate, months) - 1);
    const totalPayment = emi * months;
    const totalInterest = totalPayment - loanAmount;
    setResult({ emi: emi.toFixed(2), totalPayment: totalPayment.toFixed(2), totalInterest: totalInterest.toFixed(2) });
  };

  // Brokerage Calculator
  const calculateBrokerage = () => {
    const { buyPrice, sellPrice, quantity } = calcInputs;
    const turnover = (buyPrice + sellPrice) * quantity;
    const brokerage = turnover * 0.0003; // 0.03%
    const stt = sellPrice * quantity * 0.001; // 0.1%
    const gst = brokerage * 0.18;
    const sebi = 10;
    const stampDuty = buyPrice * quantity * 0.0001;
    const totalCharges = brokerage + stt + gst + sebi + stampDuty;
    const netProfit = (sellPrice - buyPrice) * quantity - totalCharges;
    setResult({ brokerage: brokerage.toFixed(2), stt: stt.toFixed(2), gst: gst.toFixed(2), totalCharges: totalCharges.toFixed(2), netProfit: netProfit.toFixed(2) });
  };

  // Position Size Calculator
  const calculatePositionSize = () => {
    const { capital, riskPercent, entryPrice, stopLoss } = calcInputs;
    const riskAmount = capital * riskPercent / 100;
    const riskPerShare = Math.abs(entryPrice - stopLoss);
    const quantity = Math.floor(riskAmount / riskPerShare);
    const positionValue = quantity * entryPrice;
    setResult({ quantity: quantity, positionValue: positionValue.toFixed(2), riskAmount: riskAmount.toFixed(2) });
  };

  // Compound Interest Calculator
  const calculateCompound = () => {
    const { principal, rate, years, frequency } = calcInputs;
    const n = frequency === 'yearly' ? 1 : frequency === 'halfyearly' ? 2 : 4;
    const amount = principal * Math.pow(1 + (rate / 100) / n, n * years);
    const interest = amount - principal;
    setResult({ amount: amount.toFixed(2), interest: interest.toFixed(2) });
  };

  // SWP Calculator
  const calculateSWP = () => {
    const { amount, monthlyWithdrawal, years, rate } = calcInputs;
    const monthlyRate = rate / 12 / 100;
    const months = years * 12;
    let remaining = amount;
    let totalWithdrawn = 0;
    for (let i = 0; i < months; i++) {
      remaining = remaining * (1 + monthlyRate);
      if (remaining >= monthlyWithdrawal) {
        remaining -= monthlyWithdrawal;
        totalWithdrawn += monthlyWithdrawal;
      }
    }
    setResult({ remainingBalance: remaining.toFixed(2), totalWithdrawn: totalWithdrawn.toFixed(2) });
  };

  const calculators = {
    sip: { name: 'SIP Calculator', fields: ['monthlyAmount', 'years', 'rate'], labels: ['Monthly Investment (₹)', 'Time Period (Years)', 'Expected Return (%)'], calculate: calculateSIP },
    lumpsum: { name: 'Lumpsum Calculator', fields: ['amount', 'years', 'rate'], labels: ['Investment Amount (₹)', 'Time Period (Years)', 'Expected Return (%)'], calculate: calculateLumpsum },
    emi: { name: 'EMI Calculator', fields: ['loanAmount', 'years', 'rate'], labels: ['Loan Amount (₹)', 'Tenure (Years)', 'Interest Rate (%)'], calculate: calculateEMI },
    brokerage: { name: 'Brokerage Calculator', fields: ['buyPrice', 'sellPrice', 'quantity'], labels: ['Buy Price (₹)', 'Sell Price (₹)', 'Quantity'], calculate: calculateBrokerage },
    position: { name: 'Position Size', fields: ['capital', 'riskPercent', 'entryPrice', 'stopLoss'], labels: ['Trading Capital (₹)', 'Risk per Trade (%)', 'Entry Price (₹)', 'Stop Loss (₹)'], calculate: calculatePositionSize },
    compound: { name: 'Compound Interest', fields: ['principal', 'rate', 'years', 'frequency'], labels: ['Principal (₹)', 'Interest Rate (%)', 'Years', 'Compounding'], calculate: calculateCompound },
    swp: { name: 'SWP Calculator', fields: ['amount', 'monthlyWithdrawal', 'years', 'rate'], labels: ['Investment Amount (₹)', 'Monthly Withdrawal (₹)', 'Years', 'Expected Return (%)'], calculate: calculateSWP }
  };

  const handleCalculate = () => {
    calculators[activeCalc].calculate();
  };

  const updateInput = (field, value) => {
    setCalcInputs({ ...calcInputs, [field]: parseFloat(value) || 0 });
  };

  return (
    <div className="calculators-section">
      <h2>Financial Calculators</h2>
      <div className="calc-tabs">
        {Object.keys(calculators).map(key => (
          <button key={key} className={`calc-tab ${activeCalc === key ? 'active' : ''}`} onClick={() => setActiveCalc(key)}>
            {calculators[key].name}
          </button>
        ))}
      </div>
      
      <div className="calc-content">
        <div className="calc-inputs">
          {calculators[activeCalc].fields.map((field, idx) => (
            <div key={field} className="calc-input-group">
              <label>{calculators[activeCalc].labels[idx]}</label>
              {field === 'frequency' ? (
                <select onChange={(e) => updateInput(field, e.target.value)}>
                  <option value="yearly">Yearly</option>
                  <option value="halfyearly">Half-Yearly</option>
                  <option value="quarterly">Quarterly</option>
                </select>
              ) : (
                <input type="number" placeholder={calculators[activeCalc].labels[idx]} onChange={(e) => updateInput(field, e.target.value)} />
              )}
            </div>
          ))}
          <button className="calc-btn" onClick={handleCalculate}>Calculate</button>
        </div>
        
        {result && (
          <div className="calc-result">
            <h3>Results:</h3>
            {Object.entries(result).map(([key, value]) => (
              <div key={key} className="result-item"><span>{key.replace(/([A-Z])/g, ' $1').toUpperCase()}:</span><strong>₹{value}</strong></div>
            ))}
          </div>
        )}
      </div>
      
      <style>{`
        .calculators-section { background: var(--bg-card); border-radius: 16px; padding: 24px; margin-top: 32px; }
        .calculators-section h2 { margin-bottom: 20px; }
        .calc-tabs { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 24px; }
        .calc-tab { padding: 8px 16px; background: var(--bg-elevated); border: 1px solid var(--border-color); border-radius: 8px; color: var(--text-secondary); cursor: pointer; font-size: 12px; }
        .calc-tab.active { background: linear-gradient(135deg, #00ff88, #00bcd4); color: #0a0e27; border-color: transparent; }
        .calc-content { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
        .calc-input-group { margin-bottom: 16px; }
        .calc-input-group label { display: block; margin-bottom: 6px; font-size: 12px; color: var(--text-secondary); }
        .calc-input-group input, .calc-input-group select { width: 100%; padding: 10px; background: var(--bg-elevated); border: 1px solid var(--border-color); border-radius: 8px; color: white; }
        .calc-btn { width: 100%; padding: 12px; background: linear-gradient(135deg, #00ff88, #00bcd4); border: none; border-radius: 8px; color: #0a0e27; font-weight: 700; cursor: pointer; margin-top: 8px; }
        .calc-result { background: var(--bg-elevated); border-radius: 12px; padding: 20px; }
        .calc-result h3 { margin-bottom: 16px; font-size: 16px; }
        .result-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--border-color); }
        @media (max-width: 768px) { .calc-content { grid-template-columns: 1fr; } .calc-tabs { overflow-x: auto; } }
      `}</style>
    </div>
  );
}