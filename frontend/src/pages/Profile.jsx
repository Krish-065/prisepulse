import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import styled from 'styled-components';
import toast from 'react-hot-toast';

const ProfileContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding-bottom: 50px;
`;

const ProfileHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 24px;
  background: linear-gradient(135deg, #0f1635 0%, #070a1e 100%);
  padding: 32px;
  border-radius: 16px;
  border: 1px solid rgba(0, 255, 136, 0.15);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  margin-bottom: 24px;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    flex-direction: column;
    text-align: center;
    align-items: center;
  }
`;

const Avatar = styled.div`
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: linear-gradient(135deg, #00ff88, #00bcd4);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  font-weight: 800;
  color: #0a0e27;
  box-shadow: 0 0 20px rgba(0, 255, 136, 0.3);
  text-transform: uppercase;
`;

const HeaderInfo = styled.div`
  flex: 1;

  h2 {
    margin: 0;
    font-size: 28px;
    font-weight: 800;
    color: #ffffff;
  }

  p {
    margin: 6px 0 0 0;
    color: #9b9eac;
    font-size: 15px;
  }

  .badges {
    display: flex;
    gap: 8px;
    margin-top: 12px;
    
    @media (max-width: 768px) {
      justify-content: center;
    }
  }
`;

const Badge = styled.span`
  font-size: 11px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 20px;
  text-transform: uppercase;
  background: ${props => props.type === 'primary' ? 'rgba(0, 255, 136, 0.1)' : 'rgba(0, 188, 212, 0.1)'};
  color: ${props => props.type === 'primary' ? '#00ff88' : '#00bcd4'};
  border: 1px solid ${props => props.type === 'primary' ? 'rgba(0, 255, 136, 0.2)' : 'rgba(0, 188, 212, 0.2)'};
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
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
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);

  h3 {
    margin-top: 0;
    margin-bottom: 20px;
    font-size: 18px;
    color: #ffffff;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    padding-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  padding-bottom: 12px;

  h3 {
    margin: 0;
    font-size: 18px;
    color: #ffffff;
    display: flex;
    align-items: center;
    gap: 8px;
    border-bottom: none;
    padding-bottom: 0;
  }
`;

const EditButton = styled.button`
  background: rgba(0, 255, 136, 0.1);
  border: 1px solid rgba(0, 255, 136, 0.3);
  color: #00ff88;
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #00ff88;
    color: #0a0e27;
    box-shadow: 0 0 10px rgba(0, 255, 136, 0.3);
  }
`;

const ActionButtonGroup = styled.div`
  display: flex;
  gap: 8px;
`;

const CancelButton = styled.button`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #e1e3e6;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
  font-size: 14px;
  min-height: 48px;
  box-sizing: border-box;

  &:last-child {
    border-bottom: none;
  }

  .label {
    color: #9b9eac;
  }

  .value {
    color: #ffffff;
    font-weight: 600;
    text-align: right;
  }
`;

const RowInput = styled.input`
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 8px 12px;
  color: #ffffff;
  font-size: 14px;
  width: 60%;
  text-align: right;
  outline: none;
  transition: all 0.2s;

  &:focus {
    border-color: #00ff88;
    background: rgba(255, 255, 255, 0.08);
    box-shadow: 0 0 8px rgba(0, 255, 136, 0.2);
  }
`;

const QuickLinks = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const NavButton = styled.button`
  width: 100%;
  padding: 14px 18px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  color: #ffffff;
  font-weight: 600;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(0, 255, 136, 0.08);
    border-color: rgba(0, 255, 136, 0.3);
    transform: translateY(-2px);
  }

  .icon {
    font-size: 18px;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;

  input {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 8px;
    padding: 12px;
    color: #ffffff;
    font-size: 14px;
    outline: none;
    transition: all 0.2s;

    &:focus {
      border-color: #00ff88;
      background: rgba(255, 255, 255, 0.04);
    }
  }

  button {
    background: linear-gradient(135deg, #00ff88, #00bcd4);
    border: none;
    color: #0a0e27;
    padding: 12px;
    border-radius: 8px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      box-shadow: 0 0 12px rgba(0, 255, 136, 0.4);
    }
  }
`;

const PreferenceGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-bottom: 20px;

  label {
    font-size: 13px;
    color: #9b9eac;
  }

  .options-row {
    display: flex;
    gap: 8px;
  }
`;

const PreferenceBtn = styled.button`
  flex: 1;
  padding: 10px;
  background: ${props => props.active ? 'rgba(0, 255, 136, 0.15)' : 'rgba(255,255,255,0.02)'};
  border: 1px solid ${props => props.active ? '#00ff88' : 'rgba(255,255,255,0.08)'};
  color: ${props => props.active ? '#00ff88' : '#e1e3e6'};
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${props => props.active ? 'rgba(0, 255, 136, 0.2)' : 'rgba(255,255,255,0.05)'};
  }
`;

export default function Profile() {
  const { user, logout, updateProfile, changePassword } = useAuth();
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Interactive Preferences
  const [baseCurrency, setBaseCurrency] = useState('INR');
  const [refreshRate, setRefreshRate] = useState('15s');
  const [landingPage, setLandingPage] = useState('Dashboard');

  // Edit states
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [personalName, setPersonalName] = useState('');

  const [isEditingDemat, setIsEditingDemat] = useState(false);
  const [brokerCode, setBrokerCode] = useState('');
  const [dematId, setDematId] = useState('');
  const [dpName, setDpName] = useState('');
  const [panId, setPanId] = useState('');
  const [brokeragePlan, setBrokeragePlan] = useState('');

  // Sync state with authenticated user
  useEffect(() => {
    if (user) {
      setPersonalName(user.name || '');
      setBrokerCode(user.broker_code || 'PRP065');
      setDematId(user.demat_id || '1208160001094852');
      setDpName(user.dp_name || 'PricePulse Securities Pvt Ltd');
      setPanId(user.pan_id || 'ABCDE*****F');
      setBrokeragePlan(user.brokerage_plan || '₹0 Equity Delivery / ₹20 F&O Intraday');

      if (user.base_currency) setBaseCurrency(user.base_currency);
      if (user.refresh_rate) setRefreshRate(user.refresh_rate);
      if (user.landing_page) setLandingPage(user.landing_page);
    }
  }, [user]);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      return toast.error('Please fill in all fields');
    }
    if (newPassword !== confirmPassword) {
      return toast.error('New passwords do not match');
    }
    if (newPassword.length < 8) {
      return toast.error('Password must be at least 8 characters long');
    }
    
    const res = await changePassword(currentPassword, newPassword);
    if (res?.success) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  const handleCurrencyChange = async (curr) => {
    setBaseCurrency(curr);
    localStorage.setItem('baseCurrency', curr);
    await updateProfile({ base_currency: curr });
  };

  const handleRefreshChange = async (rate) => {
    setRefreshRate(rate);
    localStorage.setItem('refreshRate', rate);
    await updateProfile({ refresh_rate: rate });
  };

  const handleLandingPageChange = async (e) => {
    const page = e.target.value;
    setLandingPage(page);
    localStorage.setItem('landingPage', page);
    await updateProfile({ landing_page: page });
  };

  const handleSavePersonal = async () => {
    if (!personalName.trim()) {
      return toast.error('Name cannot be empty');
    }
    const success = await updateProfile({ name: personalName });
    if (success) {
      setIsEditingPersonal(false);
    }
  };

  const handleSaveDemat = async () => {
    const success = await updateProfile({
      broker_code: brokerCode,
      demat_id: dematId,
      dp_name: dpName,
      pan_id: panId,
      brokerage_plan: brokeragePlan
    });
    if (success) {
      setIsEditingDemat(false);
    }
  };

  const userInitial = user?.name ? user.name.charAt(0) : (user?.email ? user.email.charAt(0) : 'U');

  return (
    <ProfileContainer>
      <ProfileHeader>
        <Avatar>{userInitial}</Avatar>
        <HeaderInfo>
          <h2>{user?.name || 'Investor Profile'}</h2>
          <p>{user?.email || 'investor@prisepulse.com'}</p>
          <div className="badges">
            <Badge type="primary">✓ KYC Verified</Badge>
            <Badge type="secondary">Pro Account</Badge>
          </div>
        </HeaderInfo>
        <div>
          <button 
            onClick={logout} 
            style={{ padding: '12px 24px', background: 'rgba(255, 51, 102, 0.1)', border: '1px solid rgba(255, 51, 102, 0.3)', color: '#ff3366', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseOver={(e) => { e.target.style.background = '#ff3366'; e.target.style.color = '#0a0e27'; }}
            onMouseOut={(e) => { e.target.style.background = 'rgba(255, 51, 102, 0.1)'; e.target.style.color = '#ff3366'; }}
          >
            Logout Account
          </button>
        </div>
      </ProfileHeader>

      <Grid>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <Card>
            <CardHeader>
              <h3>👤 Personal & Account Details</h3>
              {isEditingPersonal ? (
                <ActionButtonGroup>
                  <CancelButton onClick={() => { setIsEditingPersonal(false); setPersonalName(user?.name || ''); }}>Cancel</CancelButton>
                  <EditButton onClick={handleSavePersonal}>Save</EditButton>
                </ActionButtonGroup>
              ) : (
                <EditButton onClick={() => setIsEditingPersonal(true)}>Edit Details</EditButton>
              )}
            </CardHeader>

            <InfoRow>
              <span className="label">Full Name</span>
              {isEditingPersonal ? (
                <RowInput value={personalName} onChange={(e) => setPersonalName(e.target.value)} />
              ) : (
                <span className="value">{user?.name || 'Investor'}</span>
              )}
            </InfoRow>
            <InfoRow>
              <span className="label">Registered Email</span>
              <span className="value">{user?.email || 'investor@prisepulse.com'}</span>
            </InfoRow>
            <InfoRow>
              <span className="label">KYC Verification Status</span>
              <span className="value" style={{ color: '#00ff88' }}>Verified</span>
            </InfoRow>
            <InfoRow>
              <span className="label">Account ID</span>
              <span className="value" style={{ fontFamily: 'monospace', fontSize: '12px' }}>{user?.id || 'PP-829104-X'}</span>
            </InfoRow>
            <InfoRow>
              <span className="label">Member Since</span>
              <span className="value">June 2026</span>
            </InfoRow>
          </Card>

          <Card>
            <CardHeader>
              <h3>📊 Demat & Brokerage Details</h3>
              {isEditingDemat ? (
                <ActionButtonGroup>
                  <CancelButton onClick={() => {
                    setIsEditingDemat(false);
                    setBrokerCode(user?.broker_code || 'PRP065');
                    setDematId(user?.demat_id || '1208160001094852');
                    setDpName(user?.dp_name || 'PricePulse Securities Pvt Ltd');
                    setPanId(user?.pan_id || 'ABCDE*****F');
                    setBrokeragePlan(user?.brokerage_plan || '₹0 Equity Delivery / ₹20 F&O Intraday');
                  }}>Cancel</CancelButton>
                  <EditButton onClick={handleSaveDemat}>Save</EditButton>
                </ActionButtonGroup>
              ) : (
                <EditButton onClick={() => setIsEditingDemat(true)}>Edit Details</EditButton>
              )}
            </CardHeader>

            <InfoRow>
              <span className="label">Broker Code / Client Code</span>
              {isEditingDemat ? (
                <RowInput value={brokerCode} onChange={(e) => setBrokerCode(e.target.value)} />
              ) : (
                <span className="value">{user?.broker_code || 'PRP065'}</span>
              )}
            </InfoRow>
            <InfoRow>
              <span className="label">Demat BO ID</span>
              {isEditingDemat ? (
                <RowInput value={dematId} onChange={(e) => setDematId(e.target.value)} />
              ) : (
                <span className="value" style={{ fontFamily: 'monospace' }}>{user?.demat_id || '1208160001094852'}</span>
              )}
            </InfoRow>
            <InfoRow>
              <span className="label">DP Name</span>
              {isEditingDemat ? (
                <RowInput value={dpName} onChange={(e) => setDpName(e.target.value)} />
              ) : (
                <span className="value">{user?.dp_name || 'PricePulse Securities Pvt Ltd'}</span>
              )}
            </InfoRow>
            <InfoRow>
              <span className="label">PAN ID</span>
              {isEditingDemat ? (
                <RowInput value={panId} onChange={(e) => setPanId(e.target.value)} />
              ) : (
                <span className="value" style={{ fontFamily: 'monospace' }}>{user?.pan_id || 'ABCDE*****F'}</span>
              )}
            </InfoRow>
            <InfoRow>
              <span className="label">Brokerage Plan</span>
              {isEditingDemat ? (
                <RowInput value={brokeragePlan} onChange={(e) => setBrokeragePlan(e.target.value)} />
              ) : (
                <span className="value" style={{ color: '#00bcd4' }}>{user?.brokerage_plan || '₹0 Equity Delivery / ₹20 F&O Intraday'}</span>
              )}
            </InfoRow>
          </Card>

          <Card>
            <h3>⚙️ App Preferences</h3>
            <PreferenceGroup>
              <label>Default Launch Page</label>
              <select 
                value={landingPage} 
                onChange={handleLandingPageChange}
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '10px', color: '#ffffff', outline: 'none' }}
              >
                <option value="Dashboard" style={{ background: '#0a0e27' }}>Dashboard</option>
                <option value="Watchlist" style={{ background: '#0a0e27' }}>Watchlist</option>
                <option value="Screener" style={{ background: '#0a0e27' }}>Stock Screener</option>
                <option value="IPOs" style={{ background: '#0a0e27' }}>IPO Center</option>
              </select>
            </PreferenceGroup>

            <PreferenceGroup>
              <label>Display & Pricing Currency</label>
              <div className="options-row">
                <PreferenceBtn active={baseCurrency === 'INR'} onClick={() => handleCurrencyChange('INR')}>INR (₹)</PreferenceBtn>
                <PreferenceBtn active={baseCurrency === 'USD'} onClick={() => handleCurrencyChange('USD')}>USD ($)</PreferenceBtn>
                <PreferenceBtn active={baseCurrency === 'EUR'} onClick={() => handleCurrencyChange('EUR')}>EUR (€)</PreferenceBtn>
              </div>
            </PreferenceGroup>

            <PreferenceGroup>
              <label>Market Data Poll Interval</label>
              <div className="options-row">
                <PreferenceBtn active={refreshRate === '5s'} onClick={() => handleRefreshChange('5s')}>Fast (5s)</PreferenceBtn>
                <PreferenceBtn active={refreshRate === '15s'} onClick={() => handleRefreshChange('15s')}>Normal (15s)</PreferenceBtn>
                <PreferenceBtn active={refreshRate === '30s'} onClick={() => handleRefreshChange('30s')}>Slow (30s)</PreferenceBtn>
              </div>
            </PreferenceGroup>
          </Card>

        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <Card>
            <h3>🔗 Quick Links</h3>
            <QuickLinks>
              <NavButton onClick={() => navigate('/portfolio')}>
                <span>📁 Go to Portfolio</span>
                <span className="icon">→</span>
              </NavButton>
              <NavButton onClick={() => navigate('/watchlist')}>
                <span>⭐ Go to Watchlist</span>
                <span className="icon">→</span>
              </NavButton>
              <NavButton onClick={() => navigate('/screener')}>
                <span>🔍 Go to Screener</span>
                <span className="icon">→</span>
              </NavButton>
            </QuickLinks>
          </Card>

          <Card>
            <h3>🔑 Change Password</h3>
            <Form onSubmit={handlePasswordChange}>
              <input 
                type="password" 
                placeholder="Current Password" 
                value={currentPassword} 
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
              <input 
                type="password" 
                placeholder="New Password" 
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <input 
                type="password" 
                placeholder="Confirm New Password" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button type="submit">Update Password</button>
            </Form>
          </Card>

          <Card>
            <h3>⚡ System Diagnostics</h3>
            <InfoRow>
              <span className="label">Server Link</span>
              <span className="value" style={{ color: '#00ff88' }}>Connected</span>
            </InfoRow>
            <InfoRow>
              <span className="label">Feed Source</span>
              <span className="value">Yahoo Finance</span>
            </InfoRow>
            <InfoRow>
              <span className="label">WebSockets</span>
              <span className="value">Inactive (Polling Active)</span>
            </InfoRow>
            <InfoRow>
              <span className="label">App Version</span>
              <span className="value">v2.4.0 (Stable)</span>
            </InfoRow>
          </Card>

        </div>
      </Grid>
    </ProfileContainer>
  );
}
