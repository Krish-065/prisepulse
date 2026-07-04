import { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { createChart } from 'lightweight-charts';
import { apiClient } from '../services/api';
import { 
  Search, Calculator, BarChart2, Plus, Trash2, 
  ArrowUpRight, Shield, Award, Layers, TrendingUp 
} from 'lucide-react';
import toast from 'react-hot-toast';

// ─── STYLED COMPONENTS ───
const Container = styled.div`
  padding-bottom: 50px;
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 28px;
  font-weight: 800;
  background: linear-gradient(135deg, #00ff88, #00bcd4);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
`;

const Subtitle = styled.p`
  color: #9b9eac;
  margin: 4px 0 0 0;
  font-size: 14px;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1.6fr 1fr;
  gap: 24px;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled.div`
  background: #0a0e27;
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const SearchContainer = styled.div`
  position: relative;
  width: 100%;
`;

const SearchInputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const StyledSearchIcon = styled(Search)`
  position: absolute;
  left: 16px;
  color: #9b9eac;
  width: 20px;
  height: 20px;
`;

const SearchInput = styled.input`
  width: 100%;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 14px 16px 14px 48px;
  color: #ffffff;
  font-size: 14px;
  outline: none;
  transition: all 0.3s;
  
  &:focus {
    border-color: #00ff88;
    background: rgba(0, 255, 136, 0.02);
    box-shadow: 0 0 15px rgba(0, 255, 136, 0.1);
  }
`;

const AutocompleteDropdown = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  background: #0d1236;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-top: none;
  border-radius: 0 0 12px 12px;
  z-index: 100;
  max-height: 280px;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
`;

const AutocompleteItem = styled.div`
  padding: 12px 16px;
  color: #e1e3e6;
  font-size: 13px;
  cursor: pointer;
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
  transition: all 0.2s;
  
  &:hover {
    background: rgba(0, 255, 136, 0.1);
    color: #ffffff;
  }
`;

const FundDetailsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
`;

const DetailItem = styled.div`
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.04);
  padding: 14px;
  border-radius: 12px;
  
  .label {
    font-size: 11px;
    color: #9b9eac;
    text-transform: uppercase;
    margin-bottom: 6px;
  }
  
  .value {
    font-size: 16px;
    font-weight: 700;
    color: #ffffff;
  }
`;

const ReturnBadge = styled.span`
  color: ${props => props.$positive ? '#00ff88' : '#ff4444'};
  font-weight: 700;
`;

const ChartContainer = styled.div`
  width: 100%;
  height: 250px;
  background: #0c1033;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.03);
`;

const CalcToggle = styled.div`
  display: flex;
  background: rgba(255, 255, 255, 0.03);
  padding: 4px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.05);
`;

const CalcToggleButton = styled.button`
  flex: 1;
  background: ${props => props.$active ? 'rgba(0, 255, 136, 0.15)' : 'transparent'};
  border: 1px solid ${props => props.$active ? '#00ff88' : 'transparent'};
  color: ${props => props.$active ? '#00ff88' : '#9b9eac'};
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 12px;
  transition: all 0.2s;
`;

const SliderContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 10px;
  
  .header {
    display: flex;
    justify-content: space-between;
    font-size: 13px;
    color: #9b9eac;
    
    span.value {
      color: #00ff88;
      font-weight: 700;
    }
  }
  
  input[type=range] {
    -webkit-appearance: none;
    width: 100%;
    background: rgba(255, 255, 255, 0.1);
    height: 6px;
    border-radius: 3px;
    outline: none;
    
    &::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: #00ff88;
      cursor: pointer;
      box-shadow: 0 0 10px rgba(0, 255, 136, 0.5);
    }
  }
`;

const CalcResultBox = styled.div`
  background: rgba(0, 255, 136, 0.03);
  border: 1px solid rgba(0, 255, 136, 0.1);
  padding: 16px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const VisualBar = styled.div`
  display: flex;
  height: 8px;
  border-radius: 4px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.1);
  margin: 8px 0;
  
  .invested {
    width: ${props => props.$investPct}%;
    background: #00bcd4;
  }
  
  .gains {
    width: ${props => props.$gainsPct}%;
    background: #00ff88;
  }
`;

const CompareTableContainer = styled.div`
  overflow-x: auto;
  border-radius: 12px;
  background: #0a0e27;
  border: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
    white-space: nowrap;
  }

  th {
    background: rgba(255, 255, 255, 0.03);
    padding: 16px 14px;
    text-align: left;
    color: #9b9eac;
    font-weight: 600;
    border-bottom: 2px solid rgba(0, 255, 136, 0.2);
    text-transform: uppercase;
    font-size: 11px;
    letter-spacing: 0.5px;
  }

  td {
    padding: 14px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.03);
    color: #e1e3e6;
  }

  tr:hover {
    background: rgba(255, 255, 255, 0.02);
  }
`;

const Badge = styled.span`
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 600;
  text-transform: uppercase;
  background: ${props => {
    if (props.$type === 'high') return 'rgba(255, 51, 102, 0.15)';
    if (props.$type === 'low') return 'rgba(0, 255, 136, 0.15)';
    return 'rgba(255, 193, 7, 0.15)';
  }};
  color: ${props => {
    if (props.$type === 'high') return '#ff3366';
    if (props.$type === 'low') return '#00ff88';
    return '#ffc107';
  }};
`;

export default function MutualFunds() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedFund, setSelectedFund] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Compare bucket
  const [compareBucket, setCompareBucket] = useState([]);

  // Calculator states
  const [calcMode, setCalcMode] = useState('SIP'); // SIP or Lumpsum
  const [monthlyAmount, setMonthlyAmount] = useState(5000);
  const [expectedReturn, setExpectedReturn] = useState(12);
  const [tenureYears, setTenureYears] = useState(10);
  
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);

  // Load a default fund on mount
  useEffect(() => {
    // Nippon India Small Cap Fund Direct Growth code = 118778
    fetchFundDetails('118778');
  }, []);

  const handleSearchChange = async (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (val.length >= 3) {
      try {
        const res = await apiClient.get(`/market/mutual-funds/search?query=${val}`);
        setSearchResults(res.data || []);
        setIsDropdownOpen(true);
      } catch (err) {
        console.error('Search failed', err);
      }
    } else {
      setSearchResults([]);
      setIsDropdownOpen(false);
    }
  };

  const fetchFundDetails = async (schemeCode) => {
    setLoading(true);
    setIsDropdownOpen(false);
    try {
      const res = await apiClient.get(`/market/mutual-funds/${schemeCode}`);
      setSelectedFund(res.data);
      // Auto-set the expected return in calculator to matches fund's 3Y return if available
      const ret3Y = parseFloat(res.data.returns['3Y']);
      if (!isNaN(ret3Y) && ret3Y > 0) {
        setExpectedReturn(Math.min(30, Math.max(5, Math.round(ret3Y))));
      }
    } catch (err) {
      toast.error('Failed to load fund details');
    } finally {
      setLoading(false);
    }
  };

  // Render TradingView Lightweight Chart
  useEffect(() => {
    if (!chartContainerRef.current || !selectedFund || !selectedFund.chartData || selectedFund.chartData.length === 0) return;
    
    // Clear container
    chartContainerRef.current.innerHTML = '';
    
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: '#0a0e27' },
        textColor: '#9b9eac',
        fontFamily: 'Inter, sans-serif',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.015)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.015)' },
      },
      width: chartContainerRef.current.clientWidth || 500,
      height: 250,
      timeScale: {
        borderVisible: false,
        timeVisible: true,
      },
      rightPriceScale: {
        borderVisible: false,
      },
    });
    chartRef.current = chart;

    const areaSeries = chart.addAreaSeries({
      lineColor: '#00ff88',
      topColor: 'rgba(0, 255, 136, 0.2)',
      bottomColor: 'rgba(0, 255, 136, 0.0)',
      lineWidth: 2.5,
    });
    
    // Sort chronological
    const sortedData = [...selectedFund.chartData].sort((a, b) => new Date(a.time) - new Date(b.time));
    areaSeries.setData(sortedData);
    chart.timeScale().fitContent();

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [selectedFund]);

  // SIP / Lumpsum calculations
  const calculateReturns = () => {
    const P = monthlyAmount;
    const r = expectedReturn / 100;
    const t = tenureYears;
    
    let totalInvested = 0;
    let totalValue = 0;
    
    if (calcMode === 'SIP') {
      const monthlyRate = r / 12;
      const months = t * 12;
      totalInvested = P * months;
      // Formula: M = P * [ ( (1 + i)^n - 1 ) / i ] * (1 + i)
      totalValue = P * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate);
    } else {
      totalInvested = P;
      // Formula: A = P * (1 + r)^t
      totalValue = P * Math.pow(1 + r, t);
    }
    
    const estReturns = Math.max(0, totalValue - totalInvested);
    const investedPct = totalValue > 0 ? (totalInvested / totalValue) * 100 : 100;
    const gainsPct = 100 - investedPct;

    return {
      totalInvested: Math.round(totalInvested),
      estReturns: Math.round(estReturns),
      totalValue: Math.round(totalValue),
      investedPct,
      gainsPct
    };
  };

  const calc = calculateReturns();

  const handleAddToCompare = (fund) => {
    if (compareBucket.find(f => f.schemeCode === fund.schemeCode)) {
      toast.error('Fund already in comparison matrix');
      return;
    }
    if (compareBucket.length >= 3) {
      toast.error('You can compare a maximum of 3 funds');
      return;
    }
    setCompareBucket([...compareBucket, fund]);
    toast.success(`${fund.name.substring(0, 20)}... added to compare`);
  };

  const handleRemoveFromCompare = (code) => {
    setCompareBucket(compareBucket.filter(f => f.schemeCode !== code));
  };

  return (
    <Container>
      <Header>
        <div>
          <Title>Mutual Funds Research Hub</Title>
          <Subtitle>Interactive analysis terminal featuring live NAV data, historical charts, and wealth calculators</Subtitle>
        </div>
      </Header>

      {/* ─── LIVE AUTOCOMPLETE SEARCH ─── */}
      <SearchContainer>
        <SearchInputWrapper>
          <StyledSearchIcon />
          <SearchInput 
            type="text" 
            placeholder="Search 45,000+ Indian Mutual Fund Schemes (e.g. Parag Parikh, Quant Small)..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </SearchInputWrapper>
        {isDropdownOpen && searchResults.length > 0 && (
          <AutocompleteDropdown>
            {searchResults.map((result) => (
              <AutocompleteItem 
                key={result.schemeCode}
                onClick={() => fetchFundDetails(result.schemeCode)}
              >
                {result.schemeName}
              </AutocompleteItem>
            ))}
          </AutocompleteDropdown>
        )}
      </SearchContainer>

      <Grid>
        {/* ─── LEFT COLUMN: DETAILS & CHARTS ─── */}
        <Card style={{ justifyContent: 'space-between' }}>
          {loading ? (
            <div style={{ height: '350px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00ff88' }}>
              <TrendingUp style={{ animation: 'spin 1s linear infinite', marginRight: '8px' }} /> Loading Live AMFI Scheme Data...
            </div>
          ) : selectedFund ? (
            <>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '18px', color: '#ffffff' }}>{selectedFund.name}</h2>
                    <span style={{ fontSize: '12px', color: '#9b9eac', background: 'rgba(255,255,255,0.05)', padding: '3px 8px', borderRadius: '4px', marginTop: '6px', display: 'inline-block' }}>
                      {selectedFund.category}
                    </span>
                  </div>
                  <button 
                    onClick={() => handleAddToCompare(selectedFund)}
                    style={{ background: 'rgba(0, 255, 136, 0.1)', border: '1px solid #00ff88', color: '#00ff88', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Plus size={14} /> Compare
                  </button>
                </div>

                <FundDetailsGrid>
                  <DetailItem>
                    <div className="label">Current NAV</div>
                    <div className="value" style={{ color: '#00ff88' }}>₹{selectedFund.nav}</div>
                  </DetailItem>
                  <DetailItem>
                    <div className="label">Simulated AUM</div>
                    <div className="value">₹{selectedFund.aum} Cr</div>
                  </DetailItem>
                  <DetailItem>
                    <div className="label">Risk Profile</div>
                    <div className="value">
                      <Badge $type={selectedFund.risk}>{selectedFund.risk}</Badge>
                    </div>
                  </DetailItem>
                  <DetailItem>
                    <div className="label">AMFI Rating</div>
                    <div className="value" style={{ color: '#ffc107', letterSpacing: '2px', fontSize: '14px' }}>
                      {'★'.repeat(selectedFund.rating)}{'☆'.repeat(5 - selectedFund.rating)}
                    </div>
                  </DetailItem>
                </FundDetailsGrid>
              </div>

              <div>
                <h3 style={{ margin: '14px 0 8px 0', fontSize: '13px', color: '#9b9eac', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <BarChart2 size={16} /> 1-Year NAV Trend
                </h3>
                <ChartContainer ref={chartContainerRef} />
              </div>

              <div>
                <h3 style={{ margin: '14px 0 8px 0', fontSize: '13px', color: '#9b9eac', textTransform: 'uppercase' }}>CAGR / Return Summary</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', textAlign: 'center' }}>
                  <div style={{ background: 'rgba(255,255,255,0.01)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)' }}>
                    <div style={{ fontSize: '11px', color: '#9b9eac' }}>1Y Returns</div>
                    <ReturnBadge $positive={parseFloat(selectedFund.returns['1Y']) >= 0}>{selectedFund.returns['1Y']}</ReturnBadge>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.01)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)' }}>
                    <div style={{ fontSize: '11px', color: '#9b9eac' }}>3Y CAGR</div>
                    <ReturnBadge $positive={parseFloat(selectedFund.returns['3Y']) >= 0}>{selectedFund.returns['3Y']}</ReturnBadge>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.01)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)' }}>
                    <div style={{ fontSize: '11px', color: '#9b9eac' }}>5Y CAGR</div>
                    <ReturnBadge $positive={parseFloat(selectedFund.returns['5Y']) >= 0}>{selectedFund.returns['5Y']}</ReturnBadge>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '50px 0', color: '#9b9eac' }}>
              Select a fund from the search bar to view interactive data.
            </div>
          )}
        </Card>

        {/* ─── RIGHT COLUMN: COMPOUND SIP CALCULATOR ─── */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: '18px', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calculator style={{ color: '#00ff88' }} /> Future Value Calculator
            </h2>
            <CalcToggle>
              <CalcToggleButton $active={calcMode === 'SIP'} onClick={() => setCalcMode('SIP')}>SIP</CalcToggleButton>
              <CalcToggleButton $active={calcMode === 'Lumpsum'} onClick={() => setCalcMode('Lumpsum')}>Lumpsum</CalcToggleButton>
            </CalcToggle>
          </div>

          <SliderContainer>
            <div className="header">
              <span>{calcMode === 'SIP' ? 'Monthly Investment' : 'Initial Lumpsum'}</span>
              <span className="value">₹{monthlyAmount.toLocaleString('en-IN')}</span>
            </div>
            <input 
              type="range" 
              min={calcMode === 'SIP' ? 500 : 5000} 
              max={calcMode === 'SIP' ? 100000 : 1000000} 
              step={500} 
              value={monthlyAmount} 
              onChange={(e) => setMonthlyAmount(Number(e.target.value))} 
            />
          </SliderContainer>

          <SliderContainer>
            <div className="header">
              <span>Expected Annual Return</span>
              <span className="value">{expectedReturn}%</span>
            </div>
            <input 
              type="range" 
              min={5} 
              max={30} 
              step={0.5} 
              value={expectedReturn} 
              onChange={(e) => setExpectedReturn(Number(e.target.value))} 
            />
          </SliderContainer>

          <SliderContainer>
            <div className="header">
              <span>Investment Period</span>
              <span className="value">{tenureYears} Years</span>
            </div>
            <input 
              type="range" 
              min={1} 
              max={40} 
              step={1} 
              value={tenureYears} 
              onChange={(e) => setTenureYears(Number(e.target.value))} 
            />
          </SliderContainer>

          <CalcResultBox>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ color: '#9b9eac', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#00bcd4' }} /> Invested Amount
              </span>
              <span style={{ fontWeight: 700, color: '#ffffff' }}>₹{calc.totalInvested.toLocaleString('en-IN')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ color: '#9b9eac', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#00ff88' }} /> Estimated Return
              </span>
              <span style={{ fontWeight: 700, color: '#00ff88' }}>₹{calc.estReturns.toLocaleString('en-IN')}</span>
            </div>
            
            <VisualBar $investPct={calc.investedPct} $gainsPct={calc.gainsPct}>
              <div className="invested" />
              <div className="gains" />
            </VisualBar>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px', marginTop: '4px' }}>
              <span style={{ fontWeight: 600, color: '#ffffff' }}>Total Value</span>
              <span style={{ fontWeight: 800, color: '#00ff88' }}>₹{calc.totalValue.toLocaleString('en-IN')}</span>
            </div>
          </CalcResultBox>
        </Card>
      </Grid>

      {/* ─── BOTTOM SECTION: COMPARISON MATRIX ─── */}
      <Card>
        <h2 style={{ margin: 0, fontSize: '18px', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Layers style={{ color: '#00bcd4' }} /> Comparison Matrix
        </h2>
        
        {compareBucket.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 0', color: '#9b9eac', fontSize: '13px', background: 'rgba(255,255,255,0.01)', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.1)' }}>
            No funds added to comparison. Click the "Compare" button on any fund above.
          </div>
        ) : (
          <CompareTableContainer>
            <table>
              <thead>
                <tr>
                  <th>Fund Details</th>
                  <th>Risk Profile</th>
                  <th>AMFI Rating</th>
                  <th>NAV (₹)</th>
                  <th>AUM (Cr)</th>
                  <th>1Y Return</th>
                  <th>3Y Return</th>
                  <th>5Y Return</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {compareBucket.map((fund) => (
                  <tr key={fund.schemeCode}>
                    <td>
                      <span style={{ fontWeight: 700, color: '#ffffff', display: 'block' }}>{fund.name}</span>
                      <span style={{ fontSize: '11px', color: '#9b9eac' }}>{fund.category}</span>
                    </td>
                    <td>
                      <Badge $type={fund.risk}>{fund.risk}</Badge>
                    </td>
                    <td style={{ color: '#ffc107', letterSpacing: '2px' }}>
                      {'★'.repeat(fund.rating)}{'☆'.repeat(5 - fund.rating)}
                    </td>
                    <td style={{ fontWeight: 600 }}>₹{fund.nav}</td>
                    <td>₹{fund.aum}</td>
                    <td style={{ color: parseFloat(fund.returns['1Y']) >= 0 ? '#00ff88' : '#ff4444', fontWeight: 600 }}>
                      {fund.returns['1Y']}
                    </td>
                    <td style={{ color: parseFloat(fund.returns['3Y']) >= 0 ? '#00ff88' : '#ff4444', fontWeight: 600 }}>
                      {fund.returns['3Y']}
                    </td>
                    <td style={{ color: parseFloat(fund.returns['5Y']) >= 0 ? '#00ff88' : '#ff4444', fontWeight: 600 }}>
                      {fund.returns['5Y']}
                    </td>
                    <td>
                      <button 
                        onClick={() => handleRemoveFromCompare(fund.schemeCode)}
                        style={{ background: 'transparent', border: 'none', color: '#ff4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Trash2 size={16} /> Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CompareTableContainer>
        )}
      </Card>
    </Container>
  );
}