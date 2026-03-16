import React, { useState } from 'react';

function Section(props) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden mb-6">
      <div className="px-5 py-4 border-b border-gray-800 bg-gray-800/50">
        <h2 className="text-white font-semibold text-sm">{props.title}</h2>
        {props.subtitle && <p className="text-gray-400 text-xs mt-1">{props.subtitle}</p>}
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
        className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm w-full outline-none focus:border-green-400 font-mono"
      />
    </div>
  );
}

function Result(props) {
  return (
    <div className={'p-4 rounded-lg border ' + (props.highlight ? 'bg-green-400/10 border-green-400/30' : 'bg-gray-800 border-gray-700')}>
      <div className="text-gray-400 text-xs font-mono mb-1">{props.label}</div>
      <div className={'font-mono font-bold text-lg ' + (props.color || 'text-white')}>{props.value}</div>
    </div>
  );
}

// ── 1. POSITION SIZE CALCULATOR ───────────────────────────────────
function PositionSizeCalc() {
  var [capital,    setCapital]    = useState('100000');
  var [riskPct,    setRiskPct]    = useState('1');
  var [entryPrice, setEntryPrice] = useState('');
  var [stopLoss,   setStopLoss]   = useState('');
  var [target,     setTarget]     = useState('');

  var riskAmount  = (parseFloat(capital) * parseFloat(riskPct)) / 100;
  var slDistance  = Math.abs(parseFloat(entryPrice) - parseFloat(stopLoss));
  var qty         = slDistance > 0 ? Math.floor(riskAmount / slDistance) : 0;
  var investment  = qty * parseFloat(entryPrice);
  var maxLoss     = qty * slDistance;
  var maxProfit   = target ? qty * Math.abs(parseFloat(target) - parseFloat(entryPrice)) : 0;
  var rrRatio     = maxLoss > 0 ? (maxProfit / maxLoss).toFixed(2) : 0;

  return (
    <Section title="Position Size Calculator" subtitle="Calculate the right number of shares to buy based on your risk tolerance">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        <InputField label="CAPITAL (RS.)"     value={capital}    onChange={setCapital}    placeholder="100000" />
        <InputField label="RISK PER TRADE (%)" value={riskPct}   onChange={setRiskPct}    placeholder="1"      />
        <InputField label="ENTRY PRICE (RS.)" value={entryPrice} onChange={setEntryPrice} placeholder="500"    />
        <InputField label="STOP LOSS (RS.)"   value={stopLoss}   onChange={setStopLoss}   placeholder="480"    />
        <InputField label="TARGET (RS.)"      value={target}     onChange={setTarget}     placeholder="540"    />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Result label="RISK AMOUNT"    value={'Rs.' + riskAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })} highlight />
        <Result label="QUANTITY TO BUY" value={qty + ' shares'} highlight />
        <Result label="TOTAL INVESTMENT" value={'Rs.' + investment.toLocaleString('en-IN', { maximumFractionDigits: 0 })} />
        <Result label="MAX LOSS"   value={'Rs.' + maxLoss.toLocaleString('en-IN',   { maximumFractionDigits: 0 })} color="text-red-400"   />
        <Result label="MAX PROFIT" value={'Rs.' + maxProfit.toLocaleString('en-IN', { maximumFractionDigits: 0 })} color="text-green-400" />
        <Result label="RISK:REWARD RATIO" value={'1 : ' + rrRatio} color={parseFloat(rrRatio) >= 2 ? 'text-green-400' : 'text-amber-400'} />
      </div>
      {qty > 0 && (
        <div className="mt-4 p-3 bg-gray-800 rounded-lg text-xs text-gray-400 font-mono">
          Buy {qty} shares of the stock at Rs.{entryPrice} | Stop at Rs.{stopLoss} | Target Rs.{target || 'not set'} | Risk Rs.{maxLoss.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
        </div>
      )}
    </Section>
  );
}

// ── 2. SIP CALCULATOR ─────────────────────────────────────────────
function SIPCalc() {
  var [monthly,  setMonthly]  = useState('5000');
  var [rate,     setRate]     = useState('12');
  var [years,    setYears]    = useState('10');

  var n          = parseFloat(years) * 12;
  var r          = parseFloat(rate) / 100 / 12;
  var invested   = parseFloat(monthly) * n;
  var maturity   = parseFloat(monthly) * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
  var gains      = maturity - invested;

  return (
    <Section title="SIP Calculator" subtitle="Calculate returns on your monthly Systematic Investment Plan">
      <div className="grid grid-cols-3 gap-3 mb-6">
        <InputField label="MONTHLY AMOUNT (RS.)" value={monthly} onChange={setMonthly} placeholder="5000" />
        <InputField label="EXPECTED RETURN (%)"  value={rate}    onChange={setRate}    placeholder="12"   />
        <InputField label="TIME PERIOD (YEARS)"  value={years}   onChange={setYears}   placeholder="10"   />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Result label="INVESTED AMOUNT"  value={'Rs.' + invested.toLocaleString('en-IN',  { maximumFractionDigits: 0 })} />
        <Result label="ESTIMATED GAINS"  value={'Rs.' + gains.toLocaleString('en-IN',     { maximumFractionDigits: 0 })} color="text-green-400" />
        <Result label="MATURITY VALUE"   value={'Rs.' + maturity.toLocaleString('en-IN',  { maximumFractionDigits: 0 })} highlight />
      </div>
    </Section>
  );
}

// ── 3. BROKERAGE CALCULATOR ───────────────────────────────────────
function BrokerageCalc() {
  var [buyPrice,  setBuyPrice]  = useState('');
  var [sellPrice, setSellPrice] = useState('');
  var [qty,       setQty]       = useState('');
  var [segment,   setSegment]   = useState('equity');

  var buy        = parseFloat(buyPrice)  || 0;
  var sell       = parseFloat(sellPrice) || 0;
  var quantity   = parseFloat(qty)       || 0;
  var buyValue   = buy  * quantity;
  var sellValue  = sell * quantity;
  var turnover   = buyValue + sellValue;
  var brokerage  = segment === 'equity' ? Math.min(20, turnover * 0.0003) * 2 : Math.min(20, turnover * 0.0003) * 2;
  var stt        = segment === 'equity' ? sellValue * 0.001 : turnover * 0.0005;
  var sebi       = turnover * 0.000001;
  var stampDuty  = buyValue * 0.00015;
  var gst        = (brokerage + sebi) * 0.18;
  var totalCost  = brokerage + stt + sebi + stampDuty + gst;
  var pnl        = (sell - buy) * quantity - totalCost;

  return (
    <Section title="Brokerage Calculator" subtitle="Calculate exact charges for Zerodha/Upstox style flat-fee brokers">
      <div className="flex gap-3 mb-4">
        {['equity', 'futures', 'options'].map(function(s) {
          return (
            <button key={s} onClick={function() { setSegment(s); }}
              className={
                'px-3 py-1 rounded text-xs font-mono capitalize ' +
                (segment === s ? 'bg-green-400 text-gray-950 font-bold' : 'bg-gray-800 text-gray-400')
              }
            >{s}</button>
          );
        })}
      </div>
      <div className="grid grid-cols-3 gap-3 mb-6">
        <InputField label="BUY PRICE (RS.)"  value={buyPrice}  onChange={setBuyPrice}  placeholder="500" />
        <InputField label="SELL PRICE (RS.)" value={sellPrice} onChange={setSellPrice} placeholder="520" />
        <InputField label="QUANTITY"         value={qty}       onChange={setQty}       placeholder="100" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Result label="BROKERAGE"   value={'Rs.' + brokerage.toFixed(2)}  />
        <Result label="STT"         value={'Rs.' + stt.toFixed(2)}        />
        <Result label="GST"         value={'Rs.' + gst.toFixed(2)}        />
        <Result label="SEBI CHARGES" value={'Rs.' + sebi.toFixed(4)}     />
        <Result label="STAMP DUTY"  value={'Rs.' + stampDuty.toFixed(2)} />
        <Result label="TOTAL COST"  value={'Rs.' + totalCost.toFixed(2)} color="text-amber-400" />
      </div>
      <div className="mt-4">
        <Result
          label="NET P&L (after charges)"
          value={'Rs.' + pnl.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          color={pnl >= 0 ? 'text-green-400' : 'text-red-400'}
          highlight
        />
      </div>
    </Section>
  );
}

// ── 4. EMI CALCULATOR ─────────────────────────────────────────────
function EMICalc() {
  var [principal, setPrincipal] = useState('1000000');
  var [rate,      setRate]      = useState('8.5');
  var [tenure,    setTenure]    = useState('20');

  var r   = parseFloat(rate) / 100 / 12;
  var n   = parseFloat(tenure) * 12;
  var emi = (parseFloat(principal) * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  var totalPayment = emi * n;
  var totalInterest = totalPayment - parseFloat(principal);

  return (
    <Section title="EMI / Loan Calculator" subtitle="Calculate monthly EMI for home, car or personal loan">
      <div className="grid grid-cols-3 gap-3 mb-6">
        <InputField label="LOAN AMOUNT (RS.)"  value={principal} onChange={setPrincipal} placeholder="1000000" />
        <InputField label="INTEREST RATE (% PA)" value={rate}    onChange={setRate}      placeholder="8.5"     />
        <InputField label="TENURE (YEARS)"     value={tenure}    onChange={setTenure}    placeholder="20"      />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Result label="MONTHLY EMI"     value={'Rs.' + emi.toLocaleString('en-IN',           { maximumFractionDigits: 0 })} highlight />
        <Result label="TOTAL INTEREST"  value={'Rs.' + totalInterest.toLocaleString('en-IN', { maximumFractionDigits: 0 })} color="text-red-400" />
        <Result label="TOTAL PAYMENT"   value={'Rs.' + totalPayment.toLocaleString('en-IN',  { maximumFractionDigits: 0 })} />
      </div>
    </Section>
  );
}

// ── 5. COMPOUND INTEREST CALCULATOR ──────────────────────────────
function CompoundCalc() {
  var [principal,  setPrincipal]  = useState('100000');
  var [rate,       setRate]       = useState('12');
  var [years,      setYears]      = useState('10');
  var [frequency,  setFrequency]  = useState('1');

  var n       = parseFloat(frequency);
  var t       = parseFloat(years);
  var r       = parseFloat(rate) / 100;
  var p       = parseFloat(principal);
  var amount  = p * Math.pow(1 + r / n, n * t);
  var interest = amount - p;

  return (
    <Section title="Compound Interest Calculator" subtitle="See how your money grows with the power of compounding">
      <div className="flex gap-3 mb-4">
        {[
          { label: 'Yearly', val: '1' },
          { label: 'Quarterly', val: '4' },
          { label: 'Monthly', val: '12' },
        ].map(function(f) {
          return (
            <button key={f.val} onClick={function() { setFrequency(f.val); }}
              className={
                'px-3 py-1 rounded text-xs font-mono ' +
                (frequency === f.val ? 'bg-green-400 text-gray-950 font-bold' : 'bg-gray-800 text-gray-400')
              }
            >{f.label}</button>
          );
        })}
      </div>
      <div className="grid grid-cols-3 gap-3 mb-6">
        <InputField label="PRINCIPAL (RS.)"    value={principal} onChange={setPrincipal} placeholder="100000" />
        <InputField label="INTEREST RATE (% PA)" value={rate}    onChange={setRate}      placeholder="12"     />
        <InputField label="TIME PERIOD (YEARS)" value={years}    onChange={setYears}     placeholder="10"     />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Result label="PRINCIPAL"       value={'Rs.' + p.toLocaleString('en-IN',        { maximumFractionDigits: 0 })} />
        <Result label="INTEREST EARNED" value={'Rs.' + interest.toLocaleString('en-IN', { maximumFractionDigits: 0 })} color="text-green-400" />
        <Result label="TOTAL AMOUNT"    value={'Rs.' + amount.toLocaleString('en-IN',   { maximumFractionDigits: 0 })} highlight />
      </div>
    </Section>
  );
}

// ── 6. MARGIN CALCULATOR ─────────────────────────────────────────
function MarginCalc() {
  var [stockPrice, setStockPrice] = useState('');
  var [qty,        setQty]        = useState('');
  var [leverage,   setLeverage]   = useState('5');

  var totalValue  = (parseFloat(stockPrice) || 0) * (parseFloat(qty) || 0);
  var marginReq   = totalValue / parseFloat(leverage);
  var exposure    = totalValue - marginReq;

  return (
    <Section title="Margin / Leverage Calculator" subtitle="Calculate margin required for intraday and F&O trades">
      <div className="grid grid-cols-3 gap-3 mb-6">
        <InputField label="STOCK PRICE (RS.)" value={stockPrice} onChange={setStockPrice} placeholder="500"  />
        <InputField label="QUANTITY"          value={qty}        onChange={setQty}        placeholder="100"  />
        <InputField label="LEVERAGE (X)"      value={leverage}   onChange={setLeverage}   placeholder="5"    />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Result label="TOTAL VALUE"    value={'Rs.' + totalValue.toLocaleString('en-IN',  { maximumFractionDigits: 0 })} />
        <Result label="MARGIN REQUIRED" value={'Rs.' + marginReq.toLocaleString('en-IN', { maximumFractionDigits: 0 })} highlight />
        <Result label="BROKER EXPOSURE" value={'Rs.' + exposure.toLocaleString('en-IN',  { maximumFractionDigits: 0 })} color="text-amber-400" />
      </div>
    </Section>
  );
}

// ── 7. RETURNS CALCULATOR ────────────────────────────────────────
function ReturnsCalc() {
  var [buyPrice,  setBuyPrice]  = useState('');
  var [sellPrice, setSellPrice] = useState('');
  var [qty,       setQty]       = useState('');
  var [holdDays,  setHoldDays]  = useState('');

  var buy      = parseFloat(buyPrice)  || 0;
  var sell     = parseFloat(sellPrice) || 0;
  var quantity = parseFloat(qty)       || 0;
  var days     = parseFloat(holdDays)  || 1;
  var invested = buy * quantity;
  var current  = sell * quantity;
  var absReturn = current - invested;
  var pctReturn = invested > 0 ? ((absReturn / invested) * 100) : 0;
  var annualized = invested > 0 ? ((Math.pow(1 + absReturn / invested, 365 / days) - 1) * 100) : 0;

  return (
    <Section title="Returns Calculator" subtitle="Calculate absolute and annualized returns on any investment">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <InputField label="BUY PRICE (RS.)"   value={buyPrice}  onChange={setBuyPrice}  placeholder="500" />
        <InputField label="SELL PRICE (RS.)"  value={sellPrice} onChange={setSellPrice} placeholder="600" />
        <InputField label="QUANTITY"          value={qty}       onChange={setQty}       placeholder="100" />
        <InputField label="HOLDING DAYS"      value={holdDays}  onChange={setHoldDays}  placeholder="365" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Result label="INVESTED"         value={'Rs.' + invested.toLocaleString('en-IN',  { maximumFractionDigits: 0 })} />
        <Result label="CURRENT VALUE"    value={'Rs.' + current.toLocaleString('en-IN',   { maximumFractionDigits: 0 })} />
        <Result label="ABSOLUTE RETURN"  value={'Rs.' + absReturn.toLocaleString('en-IN', { maximumFractionDigits: 0 })} color={absReturn >= 0 ? 'text-green-400' : 'text-red-400'} />
        <Result label="RETURN %"         value={pctReturn.toFixed(2) + '%'} color={pctReturn >= 0 ? 'text-green-400' : 'text-red-400'} />
        <Result label="ANNUALIZED RETURN" value={annualized.toFixed(2) + '% p.a.'} highlight color={annualized >= 0 ? 'text-green-400' : 'text-red-400'} />
      </div>
    </Section>
  );
}

// ── MAIN TOOLS PAGE ───────────────────────────────────────────────
export default function Tools() {
  var [activeCalc, setActiveCalc] = useState('position');

  var calcs = [
    { id: 'position',  label: 'Position Size'  },
    { id: 'sip',       label: 'SIP'            },
    { id: 'brokerage', label: 'Brokerage'      },
    { id: 'emi',       label: 'EMI / Loan'     },
    { id: 'compound',  label: 'Compound Interest' },
    { id: 'margin',    label: 'Margin'         },
    { id: 'returns',   label: 'Returns'        },
  ];

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-white text-2xl font-bold">Financial Tools</h1>
        <span className="text-gray-500 text-xs font-mono">7 calculators</span>
      </div>

      <div className="flex gap-2 flex-wrap mb-6">
        {calcs.map(function(c) {
          return (
            <button key={c.id} onClick={function() { setActiveCalc(c.id); }}
              className={
                'px-3 py-2 rounded-lg text-xs font-medium transition-all ' +
                (activeCalc === c.id
                  ? 'bg-green-400 text-gray-950 font-bold'
                  : 'bg-gray-800 text-gray-400 hover:text-white')
              }
            >{c.label}</button>
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
    </div>
  );
}