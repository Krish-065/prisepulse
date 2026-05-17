import { useState } from 'react';

export default function Tools() {
  const [calc, setCalc] = useState('sip');
  const [inputs, setInputs] = useState({});
  const [result, setResult] = useState(null);

  const calculators = {
    sip: {
      name: 'SIP Calculator',
      fields: ['monthly', 'years', 'rate'],
      labels: ['Monthly Investment (₹)', 'Time (Years)', 'Expected Return (%)'],
      compute: (v) => {
        const r = v.rate / 12 / 100;
        const n = v.years * 12;
        const future = v.monthly * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
        return { 'Future Value': future.toFixed(2), 'Invested': (v.monthly * n).toFixed(2), 'Returns': (future - v.monthly * n).toFixed(2) };
      },
    },
    lumpsum: {
      name: 'Lumpsum Calculator',
      fields: ['amount', 'years', 'rate'],
      labels: ['Amount (₹)', 'Years', 'Rate (%)'],
      compute: (v) => {
        const amount = v.amount * Math.pow(1 + v.rate / 100, v.years);
        return { 'Total Amount': amount.toFixed(2), 'Profit': (amount - v.amount).toFixed(2) };
      },
    },
    emi: {
      name: 'EMI / Loan',
      fields: ['loan', 'years', 'rate'],
      labels: ['Loan Amount (₹)', 'Tenure (Years)', 'Interest Rate (%)'],
      compute: (v) => {
        const r = v.rate / 12 / 100;
        const n = v.years * 12;
        const emi = v.loan * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
        const total = emi * n;
        return { 'EMI': emi.toFixed(2), 'Total Payment': total.toFixed(2), 'Interest Paid': (total - v.loan).toFixed(2) };
      },
    },
    brokerage: {
      name: 'Brokerage',
      fields: ['buy', 'sell', 'qty'],
      labels: ['Buy Price (₹)', 'Sell Price (₹)', 'Quantity'],
      compute: (v) => {
        const turnover = (v.buy + v.sell) * v.qty;
        const brokerage = turnover * 0.0003; // Assume 0.03% intraday
        const stt = v.sell * v.qty * 0.00025;
        const total = brokerage + stt + brokerage * 0.18;
        const net = (v.sell - v.buy) * v.qty - total;
        return { 'Brokerage': brokerage.toFixed(2), 'STT': stt.toFixed(2), 'Total Charges': total.toFixed(2), 'Net Profit': net.toFixed(2) };
      },
    },
    position: {
      name: 'Position Sizing',
      fields: ['capital', 'risk', 'entry', 'stoploss'],
      labels: ['Capital (₹)', 'Risk per Trade (%)', 'Entry Price (₹)', 'Stop Loss (₹)'],
      compute: (v) => {
        const riskAmount = v.capital * (v.risk / 100);
        const riskPerShare = Math.abs(v.entry - v.stoploss);
        const qty = Math.floor(riskAmount / riskPerShare);
        const actualRisk = qty * riskPerShare;
        return { 'Quantity (Shares)': qty, 'Total Risk': actualRisk.toFixed(2) };
      },
    },
    compound: {
      name: 'Compound Interest',
      fields: ['principal', 'rate', 'years', 'frequency'],
      labels: ['Principal (₹)', 'Interest Rate (%)', 'Years', 'Compounding Frequency (per year)'],
      compute: (v) => {
        const n = v.frequency || 1;
        const amount = v.principal * Math.pow(1 + (v.rate/100)/n, n * v.years);
        return { 'Total Value': amount.toFixed(2), 'Interest Earned': (amount - v.principal).toFixed(2) };
      },
    },
    margin: {
      name: 'Margin Calculator',
      fields: ['price', 'qty', 'leverage'],
      labels: ['Share Price (₹)', 'Quantity', 'Leverage (x)'],
      compute: (v) => {
        const totalValue = v.price * v.qty;
        const marginReq = totalValue / v.leverage;
        return { 'Total Trade Value': totalValue.toFixed(2), 'Margin Required': marginReq.toFixed(2) };
      },
    },
    returns: {
      name: 'Absolute Returns',
      fields: ['buy', 'sell'],
      labels: ['Buy Value (₹)', 'Sell Value (₹)'],
      compute: (v) => {
        const profit = v.sell - v.buy;
        const percent = (profit / v.buy) * 100;
        return { 'Profit/Loss': profit.toFixed(2), 'Return (%)': percent.toFixed(2) };
      },
    }
  };

  const handleCalculate = () => {
    const fn = calculators[calc].compute;
    const values = {};
    calculators[calc].fields.forEach(f => { values[f] = parseFloat(inputs[f]) || 0; });
    setResult(fn(values));
  };

  const update = (field, val) => setInputs({ ...inputs, [field]: parseFloat(val) || 0 });

  return (
    <div>
      <h1 style={{ marginBottom: '24px' }}>Financial Tools</h1>
      <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '24px', alignItems: 'start' }}>
        <div className="section-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px' }}>
          <h3 style={{ marginBottom: '12px', fontSize: '14px', color: 'var(--text-secondary)' }}>CALCULATORS</h3>
          {Object.keys(calculators).map(key => (
            <button 
              key={key} 
              className={calc === key ? 'btn-premium' : ''} 
              onClick={() => { setCalc(key); setResult(null); }} 
              style={{ 
                padding: '12px 16px', 
                textAlign: 'left',
                borderRadius: '10px',
                background: calc === key ? 'var(--accent-green)' : 'transparent',
                color: calc === key ? '#0a0e27' : 'var(--text-primary)',
                border: calc === key ? 'none' : '1px solid var(--border-color)',
                cursor: 'pointer',
                fontWeight: calc === key ? '600' : '500',
                transition: '0.2s'
              }}
            >
              {calculators[key].name}
            </button>
          ))}
        </div>
        
        <div className="section-card" style={{ padding: '32px' }}>
          <h2 style={{ marginBottom: '24px', fontSize: '24px', color: 'var(--accent-green)' }}>{calculators[calc].name}</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            {calculators[calc].fields.map((f, i) => (
              <div key={f} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{calculators[calc].labels[i]}</label>
                <input 
                  type="number" 
                  className="global-search" 
                  onChange={(e) => update(f, e.target.value)} 
                  style={{ marginBottom: '0', background: 'var(--bg-glass-light)' }}
                />
              </div>
            ))}
          </div>
          
          <button onClick={handleCalculate} className="btn-premium" style={{ marginTop: '32px', width: '100%', padding: '16px', fontSize: '16px' }}>Calculate Results</button>
          
          {result && (
            <div style={{ marginTop: '32px', padding: '24px', background: 'var(--bg-glass-heavy)', borderRadius: '16px', border: '1px solid var(--accent-green)' }}>
              <h3 style={{ marginBottom: '16px', color: 'var(--text-primary)' }}>Results Overview</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                {Object.entries(result).map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{k.toUpperCase()}</span>
                    <strong style={{ fontSize: '20px', color: k.toLowerCase().includes('profit') || k.toLowerCase().includes('return') ? 'var(--accent-green)' : 'var(--text-primary)' }}>
                      {k.toLowerCase().includes('quantity') || k.toLowerCase().includes('%') ? '' : '₹'}{v}
                    </strong>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}