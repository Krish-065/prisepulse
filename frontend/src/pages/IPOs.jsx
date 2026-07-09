import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { apiClient } from '../services/api';
import { 
  Calendar, Users, Percent, ExternalLink, Calculator, 
  TrendingUp, Award, Layers, CheckCircle2, Search, ArrowUpRight 
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

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
`;

const StatCard = styled.div`
  background: #0a0e27;
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 12px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  
  .label {
    font-size: 12px;
    color: #9b9eac;
    text-transform: uppercase;
  }
  
  .value {
    font-size: 22px;
    font-weight: 800;
    color: #ffffff;
  }
  
  .trend {
    font-size: 12px;
    color: #00ff88;
    display: flex;
    align-items: center;
    gap: 4px;
  }
`;

const FilterToolbar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  background: rgba(10, 14, 39, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 16px;
`;

const SearchBox = styled.div`
  position: relative;
  flex: 1;
  min-width: 250px;
  display: flex;
  align-items: center;
`;

const SearchInput = styled.input`
  width: 100%;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 10px 12px 10px 38px;
  color: #ffffff;
  font-size: 13px;
  outline: none;
  transition: all 0.3s;
  
  &:focus {
    border-color: #00ff88;
  }
`;

const TabGroup = styled.div`
  display: flex;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  padding: 3px;
  border: 1px solid rgba(255, 255, 255, 0.05);
`;

const TabButton = styled.button`
  background: ${props => props.$active ? 'rgba(0, 255, 136, 0.15)' : 'transparent'};
  border: 1px solid ${props => props.$active ? '#00ff88' : 'transparent'};
  color: ${props => props.$active ? '#00ff88' : '#9b9eac'};
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 24px;
`;

const IpoCard = styled.div`
  background: #0a0e27;
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  gap: 16px;
  transition: transform 0.2s, border-color 0.2s;
  
  &:hover {
    transform: translateY(-4px);
    border-color: rgba(0, 255, 136, 0.3);
  }
`;

const IpoCardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
`;

const Badge = styled.span`
  font-size: 10px;
  padding: 3px 8px;
  border-radius: 4px;
  font-weight: 700;
  text-transform: uppercase;
  background: ${props => {
    if (props.$type === 'open') return 'rgba(0, 255, 136, 0.1)';
    if (props.$type === 'upcoming') return 'rgba(255, 193, 7, 0.1)';
    return 'rgba(255, 255, 255, 0.05)';
  }};
  color: ${props => {
    if (props.$type === 'open') return '#00ff88';
    if (props.$type === 'upcoming') return '#ffc107';
    return '#9b9eac';
  }};
  border: 1px solid ${props => {
    if (props.$type === 'open') return 'rgba(0, 255, 136, 0.2)';
    if (props.$type === 'upcoming') return 'rgba(255, 193, 7, 0.2)';
    return 'rgba(255, 255, 255, 0.1)';
  }};
`;

const DetailRow = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  background: rgba(255, 255, 255, 0.01);
  border: 1px solid rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  padding: 10px;
  text-align: center;
  
  .item {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  
  .lbl {
    font-size: 10px;
    color: #9b9eac;
    text-transform: uppercase;
  }
  
  .val {
    font-size: 12px;
    font-weight: 700;
    color: #ffffff;
  }
`;

const SubscriptionSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const SubBarWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  
  .info {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    
    .label { color: #9b9eac; }
    .multiple { color: #ffffff; font-weight: 700; }
  }
`;

const ProgressBar = styled.div`
  height: 6px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 3px;
  overflow: hidden;
  
  .fill {
    height: 100%;
    width: ${props => Math.min(100, props.$value * 4)}%;
    background: ${props => props.$color || '#00ff88'};
    border-radius: 3px;
  }
`;

const GmpBox = styled.div`
  background: rgba(0, 255, 136, 0.03);
  border: 1px solid rgba(0, 255, 136, 0.1);
  border-radius: 8px;
  padding: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  .gmp-details {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  
  .gain-text {
    font-size: 16px;
    font-weight: 800;
    color: #00ff88;
  }
`;

const CalcWrapper = styled.div`
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ActionButton = styled.button`
  width: 100%;
  padding: 12px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  
  &.apply {
    background: #00ff88;
    color: #0a0e27;
    border: none;
    
    &:hover {
      box-shadow: 0 0 15px rgba(0, 255, 136, 0.5);
    }
  }
  
  &.allotment {
    background: transparent;
    border: 1px solid #00bcd4;
    color: #00bcd4;
    
    &:hover {
      background: rgba(0, 188, 212, 0.1);
    }
  }
  
  &.disabled {
    background: rgba(255, 255, 255, 0.05);
    color: #9b9eac;
    border: 1px solid rgba(255, 255, 255, 0.08);
    cursor: not-allowed;
  }
`;

export default function IPOs() {
  const [ipos, setIpos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL'); // ALL, MAINBOARD, SME
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, OPEN, UPCOMING, CLOSED
  const [calculatorOpen, setCalculatorOpen] = useState({}); // ID map to toggle calc
  const [lotsApplied, setLotsApplied] = useState({}); // ID map to lots count

  const fetchIpos = async () => {
    try {
      const res = await apiClient.get('/market/ipos');
      setIpos(res.data || []);
    } catch (err) {
      console.error('Error fetching IPO data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIpos();
    const interval = setInterval(fetchIpos, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleCalculator = (id) => {
    setCalculatorOpen(prev => ({ ...prev, [id]: !prev[id] }));
    if (!lotsApplied[id]) {
      setLotsApplied(prev => ({ ...prev, [id]: 1 }));
    }
  };

  const updateLots = (id, val) => {
    setLotsApplied(prev => ({ ...prev, [id]: val }));
  };

  const getFilteredIpos = () => {
    return ipos.filter(ipo => {
      const matchesSearch = ipo.company.toLowerCase().includes(searchTerm.toLowerCase());
      
      const isSme = ipo.type.includes('SME');
      const matchesType = typeFilter === 'ALL' ||
        (typeFilter === 'MAINBOARD' && !isSme) ||
        (typeFilter === 'SME' && isSme);
        
      const matchesStatus = statusFilter === 'ALL' ||
        ipo.status.toUpperCase() === statusFilter;
        
      return matchesSearch && matchesType && matchesStatus;
    });
  };

  // Stats calculation
  const getStats = () => {
    const liveCount = ipos.filter(i => i.status === 'open').length;
    const avgGmpVal = ipos
      .filter(i => i.status !== 'closed' && parseFloat(i.gmp) > 0)
      .reduce((acc, i, _, arr) => acc + (parseFloat(i.gmpPercent) / arr.length), 0);
      
    const mostSubscribed = [...ipos]
      .sort((a, b) => parseFloat(b.subTotal || 0) - parseFloat(a.subTotal || 0))[0];

    return {
      liveCount,
      avgGmp: avgGmpVal.toFixed(1) + '%',
      mostSubscribed: mostSubscribed ? `${mostSubscribed.company} (${mostSubscribed.subTotal}x)` : 'N/A'
    };
  };

  const stats = getStats();
  const filtered = getFilteredIpos();

  if (loading) {
    return (
      <div className="loading" style={{ height: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00ff88', fontSize: '20px' }}>
        <TrendingUp style={{ animation: 'spin 1s linear infinite', marginRight: '8px' }} /> Fetching Live IPO Data & Subscription stats...
      </div>
    );
  }

  return (
    <Container>
      <Header>
        <div>
          <Title>Live IPO Intelligence Center</Title>
          <Subtitle>Monitor GMP trends, live subscriber books, listing estimates & allotment schedules</Subtitle>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="live-badge" style={{ background: '#00ff88', color: '#0a0e27', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 800 }}>LIVE TRACKING</span>
        </div>
      </Header>

      {/* ─── METRICS BLOCK ─── */}
      <StatsGrid>
        <StatCard>
          <div className="label">Open IPOs</div>
          <div className="value">{stats.liveCount}</div>
          <div className="trend">Bidding Active</div>
        </StatCard>
        <StatCard>
          <div className="label">Avg. Estimated Listing Gain</div>
          <div className="value" style={{ color: '#00ff88' }}>{stats.avgGmp}</div>
          <div className="trend">Across Active Offers</div>
        </StatCard>
        <StatCard>
          <div className="label">Most Subscribed Book</div>
          <div className="value" style={{ fontSize: '15px', color: '#00bcd4', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{stats.mostSubscribed}</div>
          <div className="trend">Institutional Favorite</div>
        </StatCard>
      </StatsGrid>

      {/* ─── FILTERS TOOLBAR ─── */}
      <FilterToolbar>
        <SearchBox>
          <Search size={16} style={{ position: 'absolute', left: '12px', color: '#9b9eac' }} />
          <SearchInput 
            type="text" 
            placeholder="Search IPOs by company name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </SearchBox>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <TabGroup>
            <TabButton $active={typeFilter === 'ALL'} onClick={() => setTypeFilter('ALL')}>All Categories</TabButton>
            <TabButton $active={typeFilter === 'MAINBOARD'} onClick={() => setTypeFilter('MAINBOARD')}>Mainboard</TabButton>
            <TabButton $active={typeFilter === 'SME'} onClick={() => setTypeFilter('SME')}>SME Board</TabButton>
          </TabGroup>

          <TabGroup>
            <TabButton $active={statusFilter === 'ALL'} onClick={() => setStatusFilter('ALL')}>All Status</TabButton>
            <TabButton $active={statusFilter === 'OPEN'} onClick={() => setStatusFilter('OPEN')}>Open</TabButton>
            <TabButton $active={statusFilter === 'UPCOMING'} onClick={() => setStatusFilter('UPCOMING')}>Upcoming</TabButton>
            <TabButton $active={statusFilter === 'CLOSED'} onClick={() => setStatusFilter('CLOSED')}>Closed</TabButton>
          </TabGroup>
        </div>
      </FilterToolbar>

      {/* ─── IPO CARDS LIST ─── */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px 0', color: '#9b9eac' }}>
          No IPOs found matching the filter criteria.
        </div>
      ) : (
        <Grid>
          {filtered.map((ipo) => {
            const minPrice = parseInt(ipo.price.split('-')[0]) || 100;
            const maxPrice = parseInt(ipo.price.split('-')[1]) || minPrice;
            const currentGMP = parseFloat(ipo.gmp) || 0;
            
            const estListingPrice = maxPrice + currentGMP;
            const listingGainPct = ((currentGMP / maxPrice) * 100).toFixed(1);
            
            const lotsCount = lotsApplied[ipo.id] || 1;
            const appliedInvestment = maxPrice * ipo.lotSize * lotsCount;
            const projectedGain = currentGMP * ipo.lotSize * lotsCount;

            return (
              <IpoCard key={ipo.id}>
                <IpoCardHeader>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '16px', color: '#ffffff' }}>{ipo.company}</h3>
                    <span style={{ fontSize: '11px', color: '#00bcd4', fontWeight: 600 }}>{ipo.type}</span>
                  </div>
                  <Badge $type={ipo.status}>{ipo.status}</Badge>
                </IpoCardHeader>

                <DetailRow>
                  <div className="item">
                    <span className="lbl">Price Band</span>
                    <span className="val">₹{ipo.price}</span>
                  </div>
                  <div className="item">
                    <span className="lbl">Lot Size</span>
                    <span className="val">{ipo.lotSize} Shares</span>
                  </div>
                  <div className="item">
                    <span className="lbl">Issue Size</span>
                    <span className="val">₹{ipo.issueSize} Cr</span>
                  </div>
                </DetailRow>

                {/* ─── SUBSCRIPTION PROGRESS ─── */}
                {ipo.status !== 'upcoming' && (
                  <SubscriptionSection>
                    <h4 style={{ margin: 0, fontSize: '11px', color: '#9b9eac', textTransform: 'uppercase' }}>Subscription Book</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <SubBarWrapper>
                        <div className="info">
                          <span className="label">Retail Investors</span>
                          <span className="multiple">{ipo.subRetail}x</span>
                        </div>
                        <ProgressBar $value={ipo.subRetail} $color="#00ff88" />
                      </SubBarWrapper>
                      <SubBarWrapper>
                        <div className="info">
                          <span className="label">Qualified Institutional (QIB)</span>
                          <span className="multiple">{ipo.subQib}x</span>
                        </div>
                        <ProgressBar $value={ipo.subQib} $color="#00bcd4" />
                      </SubBarWrapper>
                      <SubBarWrapper style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>
                        <div className="info">
                          <span className="label">Non-Institutional (NII)</span>
                          <span className="multiple">{ipo.subNii}x</span>
                        </div>
                        <ProgressBar $value={ipo.subNii} $color="#ffb300" />
                      </SubBarWrapper>
                      <div className="info" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700 }}>
                        <span style={{ color: '#ffffff' }}>Total Subscription</span>
                        <span style={{ color: '#00ff88' }}>{ipo.subTotal}x</span>
                      </div>
                    </div>
                  </SubscriptionSection>
                )}

                {/* ─── GMP / LISTING GAIN ESTIMATOR ─── */}
                <GmpBox>
                  <div className="gmp-details">
                    <span style={{ fontSize: '11px', color: '#9b9eac', textTransform: 'uppercase' }}>Grey Market Premium (GMP)</span>
                    <span style={{ fontSize: '13px', color: '#ffffff', fontWeight: 600 }}>₹{currentGMP} per share</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className="gain-text">+{listingGainPct}%</span>
                    <div style={{ fontSize: '11px', color: '#9b9eac' }}>Est. Listing: ₹{estListingPrice}</div>
                  </div>
                </GmpBox>

                {/* ─── EXPANDABLE CALCULATOR ─── */}
                {calculatorOpen[ipo.id] ? (
                  <CalcWrapper>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: '#9b9eac', display: 'flex', alignItems: 'center', gap: '4px' }}><Calculator size={14} /> Calculate Profit</span>
                      <button onClick={() => toggleCalculator(ipo.id)} style={{ background: 'none', border: 'none', color: '#ff4444', fontSize: '11px', cursor: 'pointer' }}>Close</button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                        <span>Lots Applied</span>
                        <span style={{ color: '#00ff88', fontWeight: 700 }}>{lotsCount} Lot ({lotsCount * ipo.lotSize} Shares)</span>
                      </div>
                      <input 
                        type="range" 
                        min={1} 
                        max={15} 
                        value={lotsCount} 
                        onChange={(e) => updateLots(ipo.id, Number(e.target.value))} 
                        style={{ width: '100%' }}
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#9b9eac' }}>
                        <span>Required Fund</span>
                        <span>₹{appliedInvestment.toLocaleString('en-IN')}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#9b9eac' }}>
                        <span>Projected Listing Gain</span>
                        <span style={{ color: '#00ff88', fontWeight: 600 }}>+₹{projectedGain.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </CalcWrapper>
                ) : (
                  <button 
                    onClick={() => toggleCalculator(ipo.id)}
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)', color: '#9b9eac', padding: '8px', borderRadius: '8px', cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  >
                    <Calculator size={12} /> Estimate Listing Gains for your application
                  </button>
                )}

                {/* ─── DATES SCHEDULER ─── */}
                <div style={{ fontSize: '11px', color: '#9b9eac', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '10px' }}>
                  <div>Allotment: <strong style={{ color: '#ffffff' }}>{ipo.allotment}</strong></div>
                  <div style={{ textAlign: 'right' }}>Listing: <strong style={{ color: '#ffffff' }}>{ipo.listing}</strong></div>
                </div>

                {/* ─── ACTION BUTTONS ─── */}
                {ipo.status === 'open' && (
                  <ActionButton className="apply" onClick={() => toast.success(`Redirecting to Broker Bid Portal... (SmartAPI)`)}>
                    Apply via Broker <ArrowUpRight size={14} />
                  </ActionButton>
                )}

                {ipo.status === 'upcoming' && (
                  <ActionButton className="disabled" disabled>
                    Bidding Opens: {ipo.open}
                  </ActionButton>
                )}

                {ipo.status === 'closed' && (
                  <a href={ipo.allotmentLink} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                    <ActionButton className="allotment">
                      Check Allotment Status <ExternalLink size={14} />
                    </ActionButton>
                  </a>
                )}
              </IpoCard>
            );
          })}
        </Grid>
      )}
    </Container>
  );
}