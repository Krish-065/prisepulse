import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import styled from 'styled-components';
import toast from 'react-hot-toast';
import { 
  User, 
  Check, 
  BarChart3, 
  Link2, 
  KeyRound, 
  Activity, 
  FolderClosed, 
  Star, 
  Search, 
  ArrowRight,
  ShieldCheck,
  Award
} from 'lucide-react';

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
  display: inline-flex;
  align-items: center;
  gap: 4px;
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

const IconContainer = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: ${props => props.$color ? `${props.$color}15` : 'rgba(255, 255, 255, 0.03)'};
  border: 1px solid ${props => props.$color ? `${props.$color}30` : 'rgba(255, 255, 255, 0.08)'};
  color: ${props => props.$color || '#ffffff'};
  box-shadow: 0 0 10px ${props => props.$color ? `${props.$color}12` : 'transparent'};
  flex-shrink: 0;
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
    display: flex;
    align-items: center;
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

export default function Profile() {
  const { user, logout, updateProfile, changePassword } = useAuth();
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Edit states
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [personalName, setPersonalName] = useState('');

  // Sync state with authenticated user
  useEffect(() => {
    if (user) {
      setPersonalName(user.name || '');
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

  const handleSavePersonal = async () => {
    if (!personalName.trim()) {
      return toast.error('Name cannot be empty');
    }
    const success = await updateProfile({ name: personalName });
    if (success) {
      setIsEditingPersonal(false);
    }
  };



  const userInitial = user?.name ? user.name.charAt(0) : (user?.email ? user.email.charAt(0) : 'U');

  return (
    <ProfileContainer>
      <ProfileHeader>
        <Avatar>{userInitial}</Avatar>
        <HeaderInfo>
          <h2>{user?.name || 'Investor Profile'}</h2>
          <p>{user?.email || 'investor@nonstock.com'}</p>
          <div className="badges">
            <Badge type="primary"><Check size={12} /> KYC Verified</Badge>
            <Badge type="secondary"><ShieldCheck size={12} /> Pro Account</Badge>
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
              <h3><IconContainer $color="#00ff88"><User size={16} /></IconContainer> Personal & Account Details</h3>
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
              <span className="value">{user?.email || 'investor@nonstock.com'}</span>
            </InfoRow>
            <InfoRow>
              <span className="label">KYC Verification Status</span>
              <span className="value" style={{ color: '#00ff88', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Check size={14} /> Verified
              </span>
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
              <h3><IconContainer $color="#00bcd4"><BarChart3 size={16} /></IconContainer> Broker Integration</h3>
            </CardHeader>

            {!user?.connected_broker ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '24px 12px', textAlign: 'center' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255, 170, 0, 0.1)', border: '1px solid rgba(255, 170, 0, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffaa00' }}>
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', color: '#ffffff', fontWeight: '700' }}>No Broker Account Connected</h4>
                  <p style={{ margin: 0, fontSize: '13px', color: '#9b9eac', lineHeight: '1.5' }}>
                    Connect your Angel One or sandbox broker account to view linked holdings and credentials.
                  </p>
                </div>
                <button 
                  onClick={() => navigate('/portfolio', { state: { openConnect: true } })}
                  style={{
                    background: 'linear-gradient(135deg, #00ff88 0%, #00bcd4 100%)',
                    border: 'none',
                    color: '#0a0e27',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    fontWeight: '700',
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: '0 4px 12px rgba(0, 255, 136, 0.2)'
                  }}
                  onMouseOver={(e) => { e.target.style.transform = 'translateY(-1px)'; e.target.style.boxShadow = '0 6px 16px rgba(0, 255, 136, 0.35)'; }}
                  onMouseOut={(e) => { e.target.style.transform = 'none'; e.target.style.boxShadow = '0 4px 12px rgba(0, 255, 136, 0.2)'; }}
                >
                  Connect Broker Account
                </button>
              </div>
            ) : (
              <>
                <InfoRow>
                  <span className="label">Connected Broker</span>
                  <span className="value" style={{ color: '#00ff88', fontWeight: '700' }}>{user.connected_broker}</span>
                </InfoRow>
                <InfoRow>
                  <span className="label">Client Code / ID</span>
                  <span className="value">{user?.broker_code || 'Not Configured'}</span>
                </InfoRow>
              </>
            )}
          </Card>

        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <Card>
            <h3><IconContainer $color="#00ff88"><Link2 size={16} /></IconContainer> Quick Links</h3>
            <QuickLinks>
              <NavButton onClick={() => navigate('/portfolio')}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FolderClosed size={16} style={{ color: '#9b9eac' }} /> Go to Portfolio
                </span>
                <span className="icon"><ArrowRight size={16} /></span>
              </NavButton>
              <NavButton onClick={() => navigate('/watchlist')}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Star size={16} style={{ color: '#9b9eac' }} /> Go to Watchlist
                </span>
                <span className="icon"><ArrowRight size={16} /></span>
              </NavButton>
              <NavButton onClick={() => navigate('/screener')}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Search size={16} style={{ color: '#9b9eac' }} /> Go to Screener
                </span>
                <span className="icon"><ArrowRight size={16} /></span>
              </NavButton>
              <NavButton onClick={() => navigate('/mutual-funds')}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Award size={16} style={{ color: '#9b9eac' }} /> Go to Mutual Funds
                </span>
                <span className="icon"><ArrowRight size={16} /></span>
              </NavButton>
            </QuickLinks>
          </Card>

          <Card>
            <h3><IconContainer $color="#00ff88"><KeyRound size={16} /></IconContainer> Change Password</h3>
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
            <h3><IconContainer $color="#00bcd4"><Activity size={16} /></IconContainer> System Diagnostics</h3>
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
