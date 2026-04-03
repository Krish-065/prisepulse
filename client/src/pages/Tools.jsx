import React, { useState } from 'react';

function Section(props) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden mb-6">
      <div className="px-5 py-4 border-b border-gray-800 bg-gray-800/50 flex items-center gap-3">
        <span className="text-2xl">{props.icon}</span>
        <div>
          <h2 className="text-white font-semibold text-sm">{props.title}</h2>
          {props.subtitle && <p className="text-gray-400 text-xs mt-0.5">{props.subtitle}</p>}
        </div>
      </div>
      <div className="p-5">{props.children}</div>
    </div>
  );
}

function InputField(props) {
  return (
    <div>
      <label className="text-gray-400 text-xs font-mono block mb-1">{props.label}</label>
      <input
        type="number"
        value={props.value}
        onChange={function(e) { props.onChange(e.target.value); }}
        placeholder={props.placeholder || '0'}
        className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm w-full outline-none focus:border-green-400 font-mono transition-colors"
      />
    </div>
  );
}

function Result(props) {
  return (
    <div className={'p-4 rounded-xl border ' + (props.highlight ? 'bg-green-400/10 border-green-400/30' : 'bg-gray-800 border-gray-700/50')}>
      <div className="text-gray-500 text-xs font-mono mb-1">{props.label}</div>
      <div className={'font-mono font-bold text-lg ' + (props.color || 'text-white')}>{props.value}</div>
      {props.sub && <div className="text-gray-600 text-xs font-mono mt-0.5">{props.sub}</div>}
    </div>
  );
}

function ProgressBar(props) {
  var pct = Math.max(0, Math.min(100, props.pct || 0));
  return (
    <div>
      <div className="flex justify-between text-xs font-mono mb-1">
        <span className="text-gray-500">{props.leftLabel}</span>
        <span className="text-gray-500">{props.rightLabel}</span>
      </div>
      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
        <div className={'h-full rounded-full ' + (props.color || 'bg-green-400')} style={{ width: pct + '%', transition: 'width 0.3s ease' }}></div>
      </div>
    </div>
  );
}

// ── 1. POSITION SIZE CALCULATOR ────────────────────────────────────
function PositionSizeCalc() {
  var [capital,    setCapital]    = useState('100000');
  var [riskPct,    setRiskPct]    = useState('1');
  var [entryPrice, setEntryPrice] = useState('');
  var [stopLoss,   setStopLoss]   = useState('');
  var [target,     setTarget]     = useState('');

  var riskAmount = (parseFloat(capital) * parseFloat(riskPct)) / 100;
  var slDistance = Math.abs(parseFloat(entryPrice) - parseFloat(stopLoss));
  var qty        = slDistance > 0 ? Math.floor(riskAmount / slDistance) : 0;
  var investment = qty * parseFloat(entryPrice);
  var maxLoss    = qty * slDistance;
  var maxProfit  = target ? qty * Math.abs(parseFloat(target) - parseFloat(entryPrice)) : 0;
  var rrRatio    = maxLoss > 0 ? (maxProfit / maxLoss).toFixed(2) : 0;

  return (
    <Section icon="📐" title="Position Size Calculator" subtitle="Calculate the right number of shares based on your risk tolerance">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
        <InputField label="CAPITAL (₹)"      value={capital}    onChange={setCapital}    placeholder="100000" />
        <InputField label="RISK PER TRADE %" value={riskPct}    onChange={setRiskPct}    placeholder="1"      />
        <InputField label="ENTRY PRICE (₹)"  value={entryPrice} onChange={setEntryPrice} placeholder="500"    />
        <InputField label="STOP LOSS (₹)"    value={stopLoss}   onChange={setStopLoss}   placeholder="480"    />
        <InputField label="TARGET (₹)"       value={target}     onChange={setTarget}     placeholder="540"    />
      </div>
      <ProgressBar leftLabel="Risk" rightLabel={parseFloat(riskPct || 0) + '% of capital'} pct={parseFloat(riskPct || 0) * 10} color="bg-red-400" />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
        <Result label="RISK AMOUNT"       value={'₹' + riskAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })} highlight />
        <Result label="QUANTITY TO BUY"   value={qty + ' shares'} highlight />
        <Result label="TOTAL INVESTMENT"  value={'₹' + investment.toLocaleString('en-IN', { maximumFractionDigits: 0 })} />
        <Result label="MAX LOSS"    value={'₹' + maxLoss.toLocaleString('en-IN',   { maximumFractionDigits: 0 })} color="text-red-400"   />
        <Result label="MAX PROFIT"  value={'₹' + maxProfit.toLocaleString('en-IN', { maximumFractionDigits: 0 })} color="text-green-400" />
        <Result label="RISK:REWARD" value={'1 : ' + rrRatio} color={parseFloat(rrRatio) >= 2 ? 'text-green-400' : 'text-amber-400'}
          sub={parseFloat(rrRatio) >= 2 ? 'Good trade setup' : parseFloat(rrRatio) >= 1 ? 'Acceptable setup' : 'Risky setup'} />
      </div>
      {qty > 0 && (
        <div className="mt-4 p-3 bg-gray-800 rounded-xl text-xs text-gray-400 font-mono">
          📌 Buy {qty} shares @ ₹{entryPrice} · Stop @ ₹{stopLoss} · Target ₹{target || '—'} · Risk ₹{maxLoss.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
        </div>
      )}
    </Section>
  );
}

// ── 2. SIP CALCULATOR ──────────────────────────────────────────────
function SIPCalc() {
  var [monthly, setMonthly] = useState('5000');
  var [rate,    setRate]    = useState('12');
  var [years,   setYears]   = useState('10');

  var n        = parseFloat(years) * 12;
  var r        = parseFloat(rate) / 100 / 12;
  var invested = parseFloat(monthly) * n;
  var maturity = parseFloat(monthly) * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
  var gains    = maturity - invested;
  var gainsPct = invested > 0 ? (gains / invested * 100).toFixed(1) : 0;

  var milestones = [5, 10, 15, 20, 25].filter(function(y) { return y <= parseFloat(years); }).map(function(y) {
    var yn = y * 12;
    var val = parseFloat(monthly) * ((Math.pow(1 + r, yn) - 1) / r) * (1 + r);
    return { years: y, value: val };
  });

  return (
    <Section icon="📈" title="SIP Calculator" subtitle="Systematic Investment Plan — monthly compounding returns">
      <div className="grid grid-cols-3 gap-3 mb-5">
        <InputField label="MONTHLY AMOUNT (₹)" value={monthly} onChange={setMonthly} placeholder="5000" />
        <InputField label="EXPECTED RETURN (%)" value={rate}    onChange={setRate}    placeholder="12"   />
        <InputField label="TIME PERIOD (YEARS)" value={years}   onChange={setYears}   placeholder="10"   />
      </div>
      <div className="grid grid-cols-3 gap-3 mb-5">
        <Result label="INVESTED"       value={'₹' + invested.toLocaleString('en-IN',  { maximumFractionDigits: 0 })} />
        <Result label="GAINS"          value={'₹' + gains.toLocaleString('en-IN',     { maximumFractionDigits: 0 }) + ' (+' + gainsPct + '%)'} color="text-green-400" />
        <Result label="MATURITY VALUE" value={'₹' + maturity.toLocaleString('en-IN',  { maximumFractionDigits: 0 })} highlight />
      </div>
      <ProgressBar leftLabel={'Invested (' + (100 - gainsPct / (1 + parseFloat(gainsPct) / 100) * 0).toFixed(0) + '%)'}
        rightLabel={'Gains ' + gainsPct + '%'} pct={gains / maturity * 100} color="bg-green-400" />
      {milestones.length > 0 && (
        <div className="mt-4">
          <div className="text-gray-500 text-xs font-mono mb-2">MILESTONE PROJECTIONS</div>
          <div className="flex gap-2 flex-wrap">
            {milestones.map(function(m, i) {
              return (
                <div key={i} className="bg-gray-800 rounded-lg px-3 py-2 text-center flex-1 min-w-20">
                  <div className="text-gray-500 text-xs font-mono">{m.years}Y</div>
                  <div className="text-white font-mono font-bold text-sm">₹{(m.value / 100000).toFixed(1)}L</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Section>
  );
}

// ── 3. BROKERAGE CALCULATOR ────────────────────────────────────────
function BrokerageCalc() {
  var [buyPrice,  setBuyPrice]  = useState('');
  var [sellPrice, setSellPrice] = useState('');
  var [qty,       setQty]       = useState('');
  var [segment,   setSegment]   = useState('equity');

  var buy       = parseFloat(buyPrice)  || 0;
  var sell      = parseFloat(sellPrice) || 0;
  var quantity  = parseFloat(qty)       || 0;
  var buyValue  = buy  * quantity;
  var sellValue = sell * quantity;
  var turnover  = buyValue + sellValue;
  var brokerage = Math.min(20, turnover * 0.0003) * 2;
  var stt       = segment === 'equity' ? sellValue * 0.001 : turnover * 0.0005;
  var sebi      = turnover * 0.000001;
  var stampDuty = buyValue * 0.00015;
  var gst       = (brokerage + sebi) * 0.18;
  var totalCost = brokerage + stt + sebi + stampDuty + gst;
  var pnl       = (sell - buy) * quantity - totalCost;

  return (
    <Section icon="🧾" title="Brokerage Calculator" subtitle="Zerodha / Upstox flat-fee broker — exact charges">
      <div className="flex gap-2 mb-4">
        {['equity', 'futures', 'options'].map(function(s) {
          return (
            <button key={s} onClick={function() { setSegment(s); }}
              className={'px-3 py-1.5 rounded-lg text-xs font-mono capitalize transition-all ' +
                (segment === s ? 'bg-green-400 text-gray-950 font-bold' : 'bg-gray-800 text-gray-400 hover:text-white')}
            >{s}</button>
          );
        })}
      </div>
      <div className="grid grid-cols-3 gap-3 mb-5">
        <InputField label="BUY PRICE (₹)"  value={buyPrice}  onChange={setBuyPrice}  placeholder="500" />
        <InputField label="SELL PRICE (₹)" value={sellPrice} onChange={setSellPrice} placeholder="520" />
        <InputField label="QUANTITY"        value={qty}       onChange={setQty}       placeholder="100" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Result label="BROKERAGE"    value={'₹' + brokerage.toFixed(2)}  />
        <Result label="STT"          value={'₹' + stt.toFixed(2)}        />
        <Result label="GST"          value={'₹' + gst.toFixed(2)}        />
        <Result label="SEBI CHARGES" value={'₹' + sebi.toFixed(4)}       />
        <Result label="STAMP DUTY"   value={'₹' + stampDuty.toFixed(2)}  />
        <Result label="TOTAL CHARGES" value={'₹' + totalCost.toFixed(2)} highlight />
        <Result label="NET P&L"      value={'₹' + pnl.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          color={pnl >= 0 ? 'text-green-400' : 'text-red-400'} />
      </div>
    </Section>
  );
}

// ── 4. EMI CALCULATOR ──────────────────────────────────────────────
function EMICalc() {
  var [principal, setPrincipal] = useState('500000');
  var [rate,      setRate]      = useState('8.5');
  var [years,     setYears]     = useState('5');

  var p      = parseFloat(principal) || 0;
  var r      = (parseFloat(rate) / 100) / 12;
  var n      = parseFloat(years) * 12;
  var emi    = r > 0 ? (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1) : p / n;
  var total  = emi * n;
  var interest = total - p;
  var interestPct = p > 0 ? (interest / p * 100).toFixed(1) : 0;

  return (
    <Section icon="🏦" title="EMI / Loan Calculator" subtitle="Home loan, car loan, or any fixed-rate EMI">
      <div className="grid grid-cols-3 gap-3 mb-5">
        <InputField label="LOAN AMOUNT (₹)"   value={principal} onChange={setPrincipal} placeholder="500000" />
        <InputField label="INTEREST RATE % PA" value={rate}     onChange={setRate}      placeholder="8.5"    />
        <InputField label="TENURE (YEARS)"     value={years}    onChange={setYears}     placeholder="5"      />
      </div>
      <div className="grid grid-cols-3 gap-3 mb-4">
        <Result label="MONTHLY EMI"     value={'₹' + emi.toLocaleString('en-IN',      { maximumFractionDigits: 0 })} highlight />
        <Result label="TOTAL INTEREST"  value={'₹' + interest.toLocaleString('en-IN', { maximumFractionDigits: 0 })} color="text-red-400" sub={'+' + interestPct + '% extra'} />
        <Result label="TOTAL AMOUNT"    value={'₹' + total.toLocaleString('en-IN',    { maximumFractionDigits: 0 })} />
      </div>
      <ProgressBar leftLabel={'Principal ₹' + (p/100000).toFixed(1) + 'L'} rightLabel={'Interest ₹' + (interest/100000).toFixed(1) + 'L'}
        pct={p / total * 100} color="bg-blue-400" />
    </Section>
  );
}

// ── 5. COMPOUND INTEREST ───────────────────────────────────────────
function CompoundCalc() {
  var [principal, setPrincipal] = useState('100000');
  var [rate,      setRate]      = useState('12');
  var [years,     setYears]     = useState('10');
  var [frequency, setFrequency] = useState('12');

  var n        = parseFloat(frequency);
  var t        = parseFloat(years);
  var r        = parseFloat(rate) / 100;
  var p        = parseFloat(principal);
  var amount   = p * Math.pow(1 + r / n, n * t);
  var interest = amount - p;
  var cagr     = (Math.pow(amount / p, 1 / t) - 1) * 100;

  return (
    <Section icon="🌱" title="Compound Interest Calculator" subtitle="The eighth wonder of the world — see your money grow">
      <div className="flex gap-2 mb-4">
        {[{ label: 'Yearly', val: '1' }, { label: 'Quarterly', val: '4' }, { label: 'Monthly', val: '12' }, { label: 'Daily', val: '365' }].map(function(f) {
          return (
            <button key={f.val} onClick={function() { setFrequency(f.val); }}
              className={'px-3 py-1.5 rounded-lg text-xs font-mono transition-all ' +
                (frequency === f.val ? 'bg-green-400 text-gray-950 font-bold' : 'bg-gray-800 text-gray-400 hover:text-white')}
            >{f.label}</button>
          );
        })}
      </div>
      <div className="grid grid-cols-3 gap-3 mb-5">
        <InputField label="PRINCIPAL (₹)"       value={principal} onChange={setPrincipal} placeholder="100000" />
        <InputField label="INTEREST RATE % PA"  value={rate}      onChange={setRate}      placeholder="12"     />
        <InputField label="TIME PERIOD (YEARS)" value={years}     onChange={setYears}     placeholder="10"     />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Result label="PRINCIPAL"       value={'₹' + p.toLocaleString('en-IN',        { maximumFractionDigits: 0 })} />
        <Result label="INTEREST EARNED" value={'₹' + interest.toLocaleString('en-IN', { maximumFractionDigits: 0 })} color="text-green-400" />
        <Result label="TOTAL AMOUNT"    value={'₹' + amount.toLocaleString('en-IN',   { maximumFractionDigits: 0 })} highlight />
        <Result label="CAGR"            value={cagr.toFixed(2) + '%'} color="text-amber-400" sub="Effective annual rate" />
      </div>
    </Section>
  );
}

// ── 6. MARGIN CALCULATOR ───────────────────────────────────────────
function MarginCalc() {
  var [stockPrice, setStockPrice] = useState('');
  var [qty,        setQty]        = useState('');
  var [leverage,   setLeverage]   = useState('5');

  var totalValue = (parseFloat(stockPrice) || 0) * (parseFloat(qty) || 0);
  var marginReq  = totalValue / parseFloat(leverage);
  var exposure   = totalValue - marginReq;
  var marginPct  = totalValue > 0 ? (marginReq / totalValue * 100).toFixed(1) : 0;

  return (
    <Section icon="⚡" title="Margin / Leverage Calculator" subtitle="Intraday and F&O margin requirements">
      <div className="grid grid-cols-3 gap-3 mb-5">
        <InputField label="STOCK PRICE (₹)" value={stockPrice} onChange={setStockPrice} placeholder="500"  />
        <InputField label="QUANTITY"         value={qty}        onChange={setQty}        placeholder="100"  />
        <InputField label="LEVERAGE (X)"     value={leverage}   onChange={setLeverage}   placeholder="5"    />
      </div>
      <div className="grid grid-cols-3 gap-3 mb-4">
        <Result label="TOTAL VALUE"     value={'₹' + totalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })} />
        <Result label="MARGIN REQUIRED" value={'₹' + marginReq.toLocaleString('en-IN',  { maximumFractionDigits: 0 })} highlight sub={marginPct + '% of total value'} />
        <Result label="BROKER EXPOSURE" value={'₹' + exposure.toLocaleString('en-IN',   { maximumFractionDigits: 0 })} color="text-amber-400" />
      </div>
      <ProgressBar leftLabel={'Your margin ' + marginPct + '%'} rightLabel={'Broker funds ' + (100 - parseFloat(marginPct)).toFixed(1) + '%'}
        pct={parseFloat(marginPct)} color="bg-green-400" />
    </Section>
  );
}

// ── 7. RETURNS CALCULATOR ──────────────────────────────────────────
function ReturnsCalc() {
  var [buyPrice,  setBuyPrice]  = useState('');
  var [sellPrice, setSellPrice] = useState('');
  var [qty,       setQty]       = useState('');
  var [holdDays,  setHoldDays]  = useState('');

  var buy        = parseFloat(buyPrice)  || 0;
  var sell       = parseFloat(sellPrice) || 0;
  var quantity   = parseFloat(qty)       || 0;
  var days       = parseFloat(holdDays)  || 1;
  var invested   = buy * quantity;
  var current    = sell * quantity;
  var absReturn  = current - invested;
  var pctReturn  = invested > 0 ? ((absReturn / invested) * 100) : 0;
  var annualized = invested > 0 ? ((Math.pow(1 + absReturn / invested, 365 / days) - 1) * 100) : 0;

  return (
    <Section icon="📊" title="Returns Calculator" subtitle="Absolute, percentage and annualized returns">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <InputField label="BUY PRICE (₹)"   value={buyPrice}  onChange={setBuyPrice}  placeholder="500" />
        <InputField label="SELL PRICE (₹)"  value={sellPrice} onChange={setSellPrice} placeholder="600" />
        <InputField label="QUANTITY"         value={qty}       onChange={setQty}       placeholder="100" />
        <InputField label="HOLDING DAYS"     value={holdDays}  onChange={setHoldDays}  placeholder="365" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Result label="INVESTED"          value={'₹' + invested.toLocaleString('en-IN',  { maximumFractionDigits: 0 })} />
        <Result label="CURRENT VALUE"     value={'₹' + current.toLocaleString('en-IN',   { maximumFractionDigits: 0 })} />
        <Result label="ABSOLUTE RETURN"   value={'₹' + absReturn.toLocaleString('en-IN', { maximumFractionDigits: 0 })} color={absReturn >= 0 ? 'text-green-400' : 'text-red-400'} />
        <Result label="RETURN %"          value={pctReturn.toFixed(2) + '%'} color={pctReturn >= 0 ? 'text-green-400' : 'text-red-400'} />
        <Result label="ANNUALIZED RETURN" value={annualized.toFixed(2) + '% p.a.'} highlight color={annualized >= 0 ? 'text-green-400' : 'text-red-400'}
          sub={days + ' days held'} />
      </div>
    </Section>
  );
}

// ── 8. XIRR / IRR CALCULATOR ──────────────────────────────────────
// Uses Newton-Raphson method to solve for XIRR given a series of cashflows
function XIRRCalc() {
  var [rows, setRows] = useState([
    { date: '2024-01-01', amount: '-50000'  },
    { date: '2024-04-01', amount: '-25000'  },
    { date: '2024-07-01', amount: '-25000'  },
    { date: '2025-01-01', amount: '120000'  },
  ]);
  var [result, setResult] = useState(null);
  var [error,  setError]  = useState('');

  var addRow = function() {
    setRows(function(r) { return [...r, { date: '', amount: '' }]; });
  };
  var removeRow = function(i) {
    setRows(function(r) { return r.filter(function(_, idx) { return idx !== i; }); });
  };
  var updateRow = function(i, field, value) {
    setRows(function(r) { return r.map(function(row, idx) { return idx === i ? { ...row, [field]: value } : row; }); });
  };

  // XIRR Newton-Raphson solver
  var calcXIRR = function() {
    setError('');
    try {
      var cashflows = rows
        .filter(function(r) { return r.date && r.amount; })
        .map(function(r) { return { date: new Date(r.date), amount: parseFloat(r.amount) }; });

      if (cashflows.length < 2) { setError('Enter at least 2 cashflows'); return; }
      var hasNeg = cashflows.some(function(c) { return c.amount < 0; });
      var hasPos = cashflows.some(function(c) { return c.amount > 0; });
      if (!hasNeg || !hasPos) { setError('Need both positive (receipts) and negative (investments) cashflows'); return; }

      var d0   = cashflows[0].date;
      var days = cashflows.map(function(c) { return (c.date - d0) / (1000 * 60 * 60 * 24); });
      var amounts = cashflows.map(function(c) { return c.amount; });

      var npv = function(rate) {
        return amounts.reduce(function(acc, cf, i) {
          return acc + cf / Math.pow(1 + rate, days[i] / 365);
        }, 0);
      };
      var dnpv = function(rate) {
        return amounts.reduce(function(acc, cf, i) {
          return acc - (days[i] / 365) * cf / Math.pow(1 + rate, days[i] / 365 + 1);
        }, 0);
      };

      var rate = 0.1;
      for (var iter = 0; iter < 100; iter++) {
        var npvVal  = npv(rate);
        var dnpvVal = dnpv(rate);
        if (Math.abs(dnpvVal) < 1e-10) break;
        var newRate = rate - npvVal / dnpvVal;
        if (Math.abs(newRate - rate) < 1e-8) { rate = newRate; break; }
        rate = newRate;
      }

      if (!isFinite(rate)) { setError('Could not converge — check your cashflows'); return; }
      setResult((rate * 100).toFixed(2));
    } catch (e) {
      setError('Error: ' + e.message);
    }
  };

  return (
    <Section icon="🧮" title="XIRR Calculator" subtitle="Extended Internal Rate of Return — for SIP, lumpsum, or any irregular cashflows">
      <div className="bg-gray-800/50 rounded-xl p-4 mb-4">
        <div className="grid grid-cols-3 gap-2 mb-2 text-gray-500 text-xs font-mono">
          <span>DATE</span>
          <span>AMOUNT (₹)</span>
          <span>NOTE</span>
        </div>
        {rows.map(function(row, i) {
          var isNeg = parseFloat(row.amount) < 0;
          return (
            <div key={i} className="grid grid-cols-3 gap-2 mb-2 items-center">
              <input type="date" value={row.date}
                onChange={function(e) { updateRow(i, 'date', e.target.value); }}
                className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-white text-xs w-full outline-none focus:border-green-400 font-mono"
              />
              <input type="number" value={row.amount} placeholder="-50000 or +120000"
                onChange={function(e) { updateRow(i, 'amount', e.target.value); }}
                className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-white text-xs w-full outline-none focus:border-green-400 font-mono"
              />
              <div className="flex items-center gap-2">
                <span className={'text-xs font-mono ' + (isNeg ? 'text-red-400' : 'text-green-400')}>
                  {isNeg ? '📤 Investment' : '📥 Receipt'}
                </span>
                {rows.length > 2 && (
                  <button onClick={function() { removeRow(i); }}
                    className="text-gray-600 hover:text-red-400 text-xs transition-colors ml-auto">✕</button>
                )}
              </div>
            </div>
          );
        })}
        <div className="flex gap-3 mt-3">
          <button onClick={addRow}
            className="text-xs text-gray-400 border border-gray-700 px-3 py-1.5 rounded-lg hover:border-gray-600 hover:text-white transition-colors font-mono">
            + Add Row
          </button>
          <button onClick={calcXIRR}
            className="text-xs bg-green-400 text-gray-950 font-bold px-4 py-1.5 rounded-lg hover:bg-green-300 transition-colors">
            Calculate XIRR
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-400/10 border border-red-400/20 text-red-400 text-xs font-mono px-3 py-2 rounded-lg mb-3">{error}</div>
      )}

      {result !== null && !error && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Result label="XIRR (Annualised)" value={result + '% p.a.'} highlight color={parseFloat(result) >= 0 ? 'text-green-400' : 'text-red-400'}
            sub={parseFloat(result) > 12 ? 'Excellent returns' : parseFloat(result) > 8 ? 'Good returns' : 'Below expectations'} />
          <div className="p-4 rounded-xl bg-gray-800 border border-gray-700 text-xs font-mono text-gray-400">
            <div className="mb-1 text-gray-500">WHAT IT MEANS</div>
            Your investment compounded at <span className="text-white font-bold">{result}%</span> per year, adjusting for timing of all cashflows.
          </div>
        </div>
      )}

      <div className="mt-4 text-gray-600 text-xs font-mono">
        💡 Enter investments as negative (−), receipts/redemptions as positive (+). Useful for SIP, real estate, or any investment with irregular cashflows.
      </div>
    </Section>
  );
}

// ── MAIN ──────────────────────────────────────────────────────────
export default function Tools() {
  var [activeCalc, setActiveCalc] = useState('position');

  var calcs = [
    { id: 'position',  label: 'Position Size',  icon: '📐' },
    { id: 'sip',       label: 'SIP',            icon: '📈' },
    { id: 'brokerage', label: 'Brokerage',      icon: '🧾' },
    { id: 'emi',       label: 'EMI / Loan',     icon: '🏦' },
    { id: 'compound',  label: 'Compound',       icon: '🌱' },
    { id: 'margin',    label: 'Margin',         icon: '⚡' },
    { id: 'returns',   label: 'Returns',        icon: '📊' },
    { id: 'xirr',      label: 'XIRR',          icon: '🧮' },
  ];

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-white text-2xl font-bold">Financial Tools</h1>
          <p className="text-gray-500 text-xs font-mono mt-1">{calcs.length} calculators for smart investing</p>
        </div>
      </div>

      <div className="grid grid-cols-4 md:grid-cols-8 gap-2 mb-6">
        {calcs.map(function(c) {
          return (
            <button key={c.id} onClick={function() { setActiveCalc(c.id); }}
              className={
                'flex flex-col items-center gap-1 p-2.5 rounded-xl text-xs font-medium transition-all border ' +
                (activeCalc === c.id
                  ? 'bg-green-400/15 text-green-400 border-green-400/30'
                  : 'bg-gray-900 text-gray-400 border-gray-800 hover:border-gray-700 hover:text-white')
              }
            >
              <span className="text-base">{c.icon}</span>
              <span className="text-center leading-tight">{c.label}</span>
            </button>
          );
        })}
      </div>

      {activeCalc === 'position'  && <PositionSizeCalc />}
      {activeCalc === 'sip'       && <SIPCalc />}
      {activeCalc === 'brokerage' && <BrokerageCalc />}
      {activeCalc === 'emi'       && <EMICalc />}
      {activeCalc === 'compound'  && <CompoundCalc />}
      {activeCalc === 'margin'    && <MarginCalc />}
      {activeCalc === 'returns'   && <ReturnsCalc />}
      {activeCalc === 'xirr'      && <XIRRCalc />}
    </div>
  );
}