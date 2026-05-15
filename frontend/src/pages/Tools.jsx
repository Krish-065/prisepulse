import { useState } from 'react';

export default function Tools() {
  const [activeCalc, setActiveCalc] = useState('position');
  const [inputs, setInputs] = useState({});
  const [result, setResult] = useState(null);

  const calculators = {
    position: {
      name: 'Position Size Calculator',
      fields: ['capital', 'riskPercent', 'entryPrice', 'stopLoss', 'target'],
      labels: ['Capital (₹)', 'Risk per trade %', 'Entry Price (₹)', 'Stop Loss (₹)', 'Target (₹)'],
      calculate: (vals) => {
        const riskAmount = vals.capital * vals.riskPercent / 100;
        const riskPerShare = Math.abs(vals.entryPrice - vals.stopLoss);
        const quantity = riskPerShare > 0 ? Math.floor(riskAmount / riskPerShare) : 0;
        const totalInvestment = quantity * vals.entryPrice;
        const potentialProfit = quantity * (vals.target - vals.entryPrice);
        return { quantity, riskAmount: riskAmount.toFixed(2), totalInvestment: totalInvestment.toFixed(2), potentialProfit: potentialProfit.toFixed(2) };
      }
    },
    sip: {
      name: 'SIP Calculator',
      fields: ['monthly', 'years', 'rate'],
      labels: ['Monthly Investment (₹)', 'Time (Years)', 'Expected Return (%)'],
      calculate: (vals) => {
        const monthlyRate = vals.rate / 12 / 100;
        const months = vals.years * 12;
        const future = vals.monthly * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate);
        const invested = vals.monthly * months;
        const returns = future - invested;
        return { futureValue: future.toFixed(2), invested: invested.toFixed(2), returns: returns.toFixed(2) };
      }
    },
    lumpsum: {
      name: 'Lumpsum Calculator',
      fields: ['amount', 'years', 'rate'],
      labels: ['Amount (₹)', 'Time (Years)', 'Rate (%)'],
      calculate: (vals) => {
        const amount = vals.amount * Math.pow(1 + vals.rate / 100, vals.years);
        const profit = amount - vals.amount;
        return { amount: amount.toFixed(2), profit: profit.toFixed(2) };
      }
    },
    emi: {
      name: 'EMI Calculator',
      fields: ['loan', 'years', 'rate'],
      labels: ['Loan Amount (₹)', 'Tenure (Years)', 'Interest Rate (%)'],
      calculate: (vals) => {
        const monthlyRate = vals.rate / 12 / 100;
        const months = vals.years * 12;
        const emi = vals.loan * monthlyRate * Math.pow(1 + monthlyRate, months) / (Math.pow(1 + monthlyRate, months) - 1);
        const total = emi * months;
        const interest = total - vals.loan;
        return { emi: emi.toFixed(2), total: total.toFixed(2), interest: interest.toFixed(2) };
      }
    },
    brokerage: {
      name: 'Brokerage Calculator',
      fields: ['buyPrice', 'sellPrice', 'quantity'],
      labels: ['Buy Price (₹)', 'Sell Price (₹)', 'Quantity'],
      calculate: (vals) => {
        const turnover = (vals.buyPrice + vals.sellPrice) * vals.quantity;
        const brokerage = turnover * 0.0003;
        const stt = vals.sellPrice * vals.quantity * 0.001;
        const gst = brokerage * 0.18;
        const sebi = 10;
        const total = brokerage + stt + gst + sebi;
        const netProfit = (vals.sellPrice - vals.buyPrice) * vals.quantity - total;
        return { brokerage: brokerage.toFixed(2), stt: stt.toFixed(2), totalCharges: total.toFixed(2), netProfit: netProfit.toFixed(2) };
      }
    }
  };

  const handleCalculate = () => {
    const calc = calculators[activeCalc];
    const values = {};
    calc.fields.forEach(field => { values[field] = parseFloat(inputs[field]) || 0; });
    const res = calc.calculate(values);
    setResult(res);
  };

  const updateInput = (field, val) => {
    setInputs({ ...inputs, [field]: parseFloat(val) || 0 });
  };

  return (
    <div className="tools-container">
      <h1>Financial Tools</h1>
      <p>8 calculators for smart investing</p>

      <div className="calc-tabs">
        {Object.keys(calculators).map(key => (
          <button key={key} className={`calc-tab ${activeCalc === key ? 'active' : ''}`} onClick={() => setActiveCalc(key)}>
            {calculators[key].name}
          </button>
        ))}
      </div>

      <div className="calc-card">
        <h2>{calculators[activeCalc].name}</h2>
        <div className="calc-inputs">
          {calculators[activeCalc].fields.map((field, idx) => (
            <div className="input-group" key={field}>
              <label>{calculators[activeCalc].labels[idx]}</label>
              <input type="number" placeholder="0" onChange={(e) => updateInput(field, e.target.value)} />
            </div>
          ))}
        </div>
        <button onClick={handleCalculate} className="calc-btn">Calculate</button>

        {result && (
          <div className="calc-results">
            {Object.entries(result).map(([key, val]) => (
              <div key={key} className="result-row">
                <span>{key.replace(/([A-Z])/g, ' $1').toUpperCase()}:</span>
                <strong>₹{val}</strong>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .tools-container { max-width: 1000px; margin: 0 auto; padding: 20px; }
        .calc-tabs { display: flex; flex-wrap: wrap; gap: 12px; margin: 24px 0; }
        .calc-tab { padding: 8px 20px; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 40px; cursor: pointer; }
        .calc-tab.active { background: linear-gradient(135deg, #00ff88, #00bcd4); color: #0a0e27; }
        .calc-card { background: var(--bg-card); border-radius: 20px; padding: 28px; border: 1px solid var(--border-color); }
        .calc-inputs { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px,1fr)); gap: 20px; margin: 24px 0; }
        .input-group label { display: block; font-size: 13px; margin-bottom: 6px; }
        .input-group input { width: 100%; padding: 10px; background: var(--bg-elevated); border: 1px solid var(--border-color); border-radius: 10px; color: white; }
        .calc-btn { background: linear-gradient(135deg, #00ff88, #00bcd4); border: none; padding: 12px 24px; border-radius: 40px; font-weight: 700; cursor: pointer; }
        .calc-results { margin-top: 28px; padding-top: 20px; border-top: 1px solid var(--border-color); display: grid; grid-template-columns: repeat(2,1fr); gap: 12px; }
        .result-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed var(--border-color); }
      `}</style>
    </div>
  );
}