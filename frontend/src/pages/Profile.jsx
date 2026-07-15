import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../services/api';
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
  Award,
  Settings,
  Trash2,
  Edit3,
  Radio,
  FileText,
  PlusCircle,
  Clock,
  Heart,
  CheckCircle,
  Lock
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

  input, textarea {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 8px;
    padding: 12px;
    color: #ffffff;
    font-size: 14px;
    outline: none;
    transition: all 0.2s;
    font-family: inherit;

    &:focus {
      border-color: #00ff88;
      background: rgba(255, 255, 255, 0.04);
    }
  }

  textarea {
    resize: vertical;
    min-height: 80px;
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

const ChannelItem = styled.div`
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: all 0.2s;

  &:hover {
    border-color: rgba(0, 255, 136, 0.2);
    background: rgba(255, 255, 255, 0.03);
  }
`;

const ChannelHeaderView = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  justify-content: space-between;
`;

const ChannelAvatar = styled.img`
  width: 48px;
  height: 48px;
  border-radius: 8px;
  object-fit: cover;
  background: rgba(255, 255, 255, 0.05);
`;

const ChannelAvatarFallback = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 8px;
  background: linear-gradient(135deg, #00ff88 0%, #00bcd4 100%);
  color: #0a0e27;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 20px;
`;

const ChannelInfo = styled.div`
  flex: 1;
  h4 {
    margin: 0;
    color: #ffffff;
    font-size: 15px;
    font-weight: 700;
  }
  p {
    margin: 4px 0 0 0;
    color: #9b9eac;
    font-size: 12px;
    line-height: 1.4;
  }
`;

const ChannelMeta = styled.div`
  display: flex;
  gap: 16px;
  color: #9b9eac;
  font-size: 12px;
  margin-top: 4px;
`;

const PostItem = styled.div`
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: all 0.2s;

  &:hover {
    border-color: rgba(0, 188, 212, 0.2);
    background: rgba(255, 255, 255, 0.03);
  }

  .post-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }

  h4 {
    margin: 0;
    color: #ffffff;
    font-size: 15px;
    font-weight: 700;
  }

  .post-body {
    color: #cbd5e1;
    font-size: 13px;
    line-height: 1.5;
    white-space: pre-wrap;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .post-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 11px;
    color: #9b9eac;
    margin-top: 4px;
  }
`;

const ActionButton = styled.button`
  background: ${props => props.$danger ? 'rgba(255, 51, 102, 0.1)' : 'rgba(0, 255, 136, 0.1)'};
  border: 1px solid ${props => props.$danger ? 'rgba(255, 51, 102, 0.3)' : 'rgba(0, 255, 136, 0.3)'};
  color: ${props => props.$danger ? '#ff3366' : '#00ff88'};
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s;

  &:hover {
    background: ${props => props.$danger ? '#ff3366' : '#00ff88'};
    color: #0a0e27;
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

  // Channels states
  const [myChannels, setMyChannels] = useState([]);
  const [loadingChannels, setLoadingChannels] = useState(true);
  const [editingChannelId, setEditingChannelId] = useState(null);
  const [editChannelName, setEditChannelName] = useState('');
  const [editChannelDesc, setEditChannelDesc] = useState('');
  const [editChannelAvatar, setEditChannelAvatar] = useState('');
  const [editChannelIsPremium, setEditChannelIsPremium] = useState(false);
  const [editChannelPrice, setEditChannelPrice] = useState(0);

  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDesc, setNewChannelDesc] = useState('');
  const [newChannelAvatar, setNewChannelAvatar] = useState('');
  const [newChannelIsPremium, setNewChannelIsPremium] = useState(false);
  const [newChannelPrice, setNewChannelPrice] = useState(0);

  // Posts states
  const [myPosts, setMyPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  // Creator verification states
  const [verificationTitle, setVerificationTitle] = useState('');
  const [verificationProof, setVerificationProof] = useState('');
  const [submittingVerification, setSubmittingVerification] = useState(false);

  // Admin verification dashboard states
  const [verificationRequests, setVerificationRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  // Sync state with authenticated user
  useEffect(() => {
    if (user) {
      setPersonalName(user.name || '');
      fetchMyChannels();
      fetchMyPosts();
      const isAdmin = user.is_admin || user.email?.toLowerCase().startsWith('admin@');
      if (isAdmin) {
        fetchVerificationRequests();
      }
    }
  }, [user]);

  const fetchVerificationRequests = async () => {
    try {
      setLoadingRequests(true);
      const res = await apiClient.get('/user/verification-requests');
      setVerificationRequests(res.data);
    } catch (err) {
      console.error('Error fetching verification requests:', err);
    } finally {
      setLoadingRequests(false);
    }
  };

  const fetchMyChannels = async () => {
    try {
      setLoadingChannels(true);
      const res = await apiClient.get('/community/my-channels');
      setMyChannels(res.data);
    } catch (err) {
      console.error('Error fetching my channels:', err);
    } finally {
      setLoadingChannels(false);
    }
  };

  const fetchMyPosts = async () => {
    try {
      setLoadingPosts(true);
      const res = await apiClient.get('/community/my-posts');
      setMyPosts(res.data);
    } catch (err) {
      console.error('Error fetching my posts:', err);
    } finally {
      setLoadingPosts(false);
    }
  };

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

  const handleCreateChannel = async (e) => {
    e.preventDefault();
    if (!newChannelName.trim()) {
      return toast.error('Channel name is required');
    }
    try {
      await apiClient.post('/community/channels', {
        name: newChannelName,
        description: newChannelDesc,
        avatar_url: newChannelAvatar,
        is_premium: newChannelIsPremium,
        price: newChannelPrice
      });
      toast.success('Channel created successfully!');
      setNewChannelName('');
      setNewChannelDesc('');
      setNewChannelAvatar('');
      setNewChannelIsPremium(false);
      setNewChannelPrice(0);
      setShowCreateChannel(false);
      fetchMyChannels();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create channel');
    }
  };

  const handleEditChannelClick = (channel) => {
    setEditingChannelId(channel.id);
    setEditChannelName(channel.name);
    setEditChannelDesc(channel.description || '');
    setEditChannelAvatar(channel.avatar_url || '');
    setEditChannelIsPremium(channel.is_premium || false);
    setEditChannelPrice(channel.price || 0);
  };

  const handleUpdateChannelSubmit = async (e) => {
    e.preventDefault();
    if (!editChannelName.trim()) {
      return toast.error('Channel name is required');
    }
    try {
      await apiClient.put(`/community/channels/${editingChannelId}`, {
        name: editChannelName,
        description: editChannelDesc,
        avatar_url: editChannelAvatar,
        is_premium: editChannelIsPremium,
        price: editChannelPrice
      });
      toast.success('Channel updated successfully');
      setEditingChannelId(null);
      fetchMyChannels();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update channel');
    }
  };

  const handleDeleteChannel = async (channelId) => {
    if (!window.confirm('Are you sure you want to delete this channel? All channel posts will also be deleted.')) {
      return;
    }
    try {
      await apiClient.delete(`/community/channels/${channelId}`);
      toast.success('Channel deleted successfully');
      fetchMyChannels();
      fetchMyPosts();
    } catch (err) {
      toast.error('Failed to delete channel');
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) {
      return;
    }
    try {
      await apiClient.delete(`/community/posts/${postId}`);
      toast.success('Post deleted successfully');
      fetchMyPosts();
    } catch (err) {
      toast.error('Failed to delete post');
    }
  };

  const handleRequestVerification = async (e) => {
    e.preventDefault();
    if (!verificationTitle.trim() || !verificationProof.trim()) {
      return toast.error('Please fill in all verification fields');
    }
    try {
      setSubmittingVerification(true);
      await apiClient.post('/user/request-verification', {
        title: verificationTitle,
        proof: verificationProof
      });
      toast.success('Verification request submitted successfully!');
      setVerificationTitle('');
      setVerificationProof('');
      if (updateProfile) {
        await updateProfile();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit verification request');
    } finally {
      setSubmittingVerification(false);
    }
  };

  const handleVerifyUser = async (userId, status, title) => {
    try {
      await apiClient.post(`/user/verify/${userId}`, { status, title });
      toast.success(`Verification ${status} successfully!`);
      fetchVerificationRequests();
      if (updateProfile) {
        await updateProfile();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Action failed');
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
            {user?.is_pro ? (
              <Badge type="secondary" style={{ background: 'linear-gradient(135deg, rgba(255, 179, 0, 0.2), rgba(255, 224, 130, 0.08))', color: '#ffb300', border: '1px solid rgba(255, 179, 0, 0.4)', boxShadow: '0 0 10px rgba(255, 179, 0, 0.15)' }}>
                <Award size={12} /> PRO MEMBER ({user?.pro_plan === 'lifetime' ? 'Lifetime' : user?.pro_plan || 'Pro'})
              </Badge>
            ) : (
              <Badge type="secondary" style={{ background: 'rgba(255, 255, 255, 0.05)', color: '#9b9eac', border: '1px solid rgba(255, 255, 255, 0.1)', cursor: 'pointer' }} onClick={() => window.location.href = '/upgrade-pro'}>
                <Lock size={12} /> Get Pro Member
              </Badge>
            )}
            {user?.is_verified && (
              <Badge type="primary" style={{ background: 'rgba(0, 255, 136, 0.1)', color: '#00ff88', border: '1px solid rgba(0, 255, 136, 0.3)' }}>
                <CheckCircle size={12} /> {user.verification_title || 'Verified Creator'}
              </Badge>
            )}
            {user?.verification_status === 'pending' && (
              <Badge type="secondary" style={{ background: 'rgba(255, 179, 0, 0.1)', color: '#ffb300', border: '1px solid rgba(255, 179, 0, 0.3)' }}>
                <Clock size={12} /> Verification Pending
              </Badge>
            )}
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
          
          {(user?.is_admin || user?.email?.toLowerCase().startsWith('admin@')) && (
            <Card style={{ border: '1px solid rgba(255, 179, 0, 0.4)' }}>
              <CardHeader>
                <h3 style={{ color: '#ffb300' }}>
                  <IconContainer $color="#ffb300"><ShieldCheck size={16} /></IconContainer>
                  Admin Portal: Educator Verifications
                </h3>
              </CardHeader>
              {loadingRequests ? (
                <div style={{ color: 'var(--text-secondary)', fontSize: '13px', padding: '12px 0', textAlign: 'center' }}>
                  Loading verification requests...
                </div>
              ) : verificationRequests.length === 0 ? (
                <div style={{ color: 'var(--text-secondary)', fontSize: '13px', padding: '12px 0', textAlign: 'center' }}>
                  No pending educator verification requests.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {verificationRequests.map(req => (
                    <div key={req.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <strong style={{ color: '#ffffff', fontSize: '14px' }}>{req.name}</strong>
                          <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)' }}>{req.email}</span>
                        </div>
                        <span style={{ fontSize: '10px', background: 'rgba(255, 179, 0, 0.1)', color: '#ffb300', padding: '2px 8px', borderRadius: '4px', fontWeight: '800' }}>
                          PENDING
                        </span>
                      </div>
                      <div style={{ marginTop: '10px' }}>
                        <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Requested Badge Title</span>
                        <strong style={{ color: '#00ff88', fontSize: '13px' }}>{req.verification_title}</strong>
                      </div>
                      <div style={{ marginTop: '8px' }}>
                        <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Submitted Proofs</span>
                        <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#cbd5e1', whiteSpace: 'pre-wrap', lineHeight: '1.4', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '6px' }}>
                          {req.verification_proof}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '10px', marginTop: '12px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => handleVerifyUser(req.id, 'rejected', null)}
                          style={{
                            background: 'rgba(255, 68, 68, 0.1)',
                            border: '1px solid rgba(255, 68, 68, 0.25)',
                            borderRadius: '6px',
                            color: '#ff4444',
                            padding: '6px 12px',
                            fontWeight: '800',
                            fontSize: '11px',
                            cursor: 'pointer'
                          }}
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleVerifyUser(req.id, 'approved', req.verification_title)}
                          style={{
                            background: 'rgba(0, 255, 136, 0.1)',
                            border: '1px solid rgba(0, 255, 136, 0.25)',
                            borderRadius: '6px',
                            color: '#00ff88',
                            padding: '6px 12px',
                            fontWeight: '800',
                            fontSize: '11px',
                            cursor: 'pointer'
                          }}
                        >
                          Approve Verification
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

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

          {/* MY CHANNELS SETTINGS */}
          <Card>
            <CardHeader>
              <h3>
                <IconContainer $color="#00ff88"><Radio size={16} /></IconContainer> 
                My Creator Channels
              </h3>
              {!showCreateChannel ? (
                <EditButton onClick={() => setShowCreateChannel(true)}>Create Channel</EditButton>
              ) : (
                <CancelButton onClick={() => setShowCreateChannel(false)}>Back</CancelButton>
              )}
            </CardHeader>

            {showCreateChannel && (
              <div style={{ marginBottom: '24px', padding: '16px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '12px', border: '1px solid rgba(0, 255, 136, 0.2)' }}>
                <h4 style={{ margin: '0 0 16px 0', color: '#ffffff', fontSize: '15px' }}>Start a New Channel</h4>
                <Form onSubmit={handleCreateChannel}>
                  <input 
                    type="text" 
                    placeholder="Channel Name (e.g. Option Strategy Masters)" 
                    value={newChannelName}
                    onChange={(e) => setNewChannelName(e.target.value)}
                    required
                  />
                  <textarea 
                    placeholder="Describe your channel focus, strategies taught, etc." 
                    value={newChannelDesc}
                    onChange={(e) => setNewChannelDesc(e.target.value)}
                  />
                  <input 
                    type="text" 
                    placeholder="Avatar image URL (Optional)" 
                    value={newChannelAvatar}
                    onChange={(e) => setNewChannelAvatar(e.target.value)}
                  />
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '8px 0' }}>
                    <input
                      type="checkbox"
                      id="profIsPremium"
                      checked={newChannelIsPremium}
                      onChange={(e) => setNewChannelIsPremium(e.target.checked)}
                      style={{ cursor: 'pointer' }}
                    />
                    <label htmlFor="profIsPremium" style={{ fontSize: '12px', color: '#ffffff', fontWeight: '750', cursor: 'pointer' }}>
                      Premium Channel (Requires Subscription)
                    </label>
                  </div>

                  {newChannelIsPremium && (
                    <input
                      type="number"
                      min="1"
                      placeholder="Subscription Price (Credits)"
                      value={newChannelPrice}
                      onChange={(e) => setNewChannelPrice(e.target.value)}
                      required={newChannelIsPremium}
                    />
                  )}

                  <button type="submit">Create Channel</button>
                </Form>
              </div>
            )}

            {loadingChannels ? (
              <div style={{ color: '#9b9eac', fontSize: '14px', textAlign: 'center', padding: '16px 0' }}>Loading channels...</div>
            ) : myChannels.length === 0 ? (
              <div style={{ color: '#9b9eac', fontSize: '14px', textAlign: 'center', padding: '24px 0' }}>
                You have not created any creator channels yet. Use the button above to start one!
              </div>
            ) : (
              myChannels.map((channel) => (
                <ChannelItem key={channel.id}>
                  {editingChannelId === channel.id ? (
                    <Form onSubmit={handleUpdateChannelSubmit}>
                      <h4 style={{ margin: '0 0 12px 0', color: '#ffffff', fontSize: '14px' }}>Edit Channel Settings</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '8px' }}>
                        <label style={{ fontSize: '11px', color: '#9b9eac' }}>Channel Name</label>
                        <input 
                          type="text" 
                          value={editChannelName} 
                          onChange={(e) => setEditChannelName(e.target.value)} 
                          placeholder="Channel Name"
                          required
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '8px' }}>
                        <label style={{ fontSize: '11px', color: '#9b9eac' }}>Description</label>
                        <textarea 
                          value={editChannelDesc} 
                          onChange={(e) => setEditChannelDesc(e.target.value)} 
                          placeholder="Description"
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '8px' }}>
                        <label style={{ fontSize: '11px', color: '#9b9eac' }}>Avatar URL</label>
                        <input 
                          type="text" 
                          value={editChannelAvatar} 
                          onChange={(e) => setEditChannelAvatar(e.target.value)} 
                          placeholder="Avatar URL"
                        />
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '8px 0' }}>
                        <input
                          type="checkbox"
                          id="editProfIsPremium"
                          checked={editChannelIsPremium}
                          onChange={(e) => setEditChannelIsPremium(e.target.checked)}
                          style={{ cursor: 'pointer' }}
                        />
                        <label htmlFor="editProfIsPremium" style={{ fontSize: '12px', color: '#ffffff', fontWeight: '750', cursor: 'pointer' }}>
                          Premium Channel (Requires Subscription)
                        </label>
                      </div>

                      {editChannelIsPremium && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
                          <label style={{ fontSize: '11px', color: '#9b9eac' }}>Subscription Price (Credits)</label>
                          <input
                            type="number"
                            min="1"
                            placeholder="Price"
                            value={editChannelPrice}
                            onChange={(e) => setEditChannelPrice(e.target.value)}
                            required={editChannelIsPremium}
                          />
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <CancelButton type="button" onClick={() => setEditingChannelId(null)}>Cancel</CancelButton>
                        <button type="submit" style={{ padding: '8px 16px', fontSize: '12px', width: 'auto' }}>Save Changes</button>
                      </div>
                    </Form>
                  ) : (
                    <>
                      <ChannelHeaderView>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                          {channel.avatar_url ? (
                            <ChannelAvatar src={channel.avatar_url} alt={channel.name} onError={(e) => { e.target.style.display = 'none'; }} />
                          ) : (
                            <ChannelAvatarFallback>{channel.name.charAt(0).toUpperCase()}</ChannelAvatarFallback>
                          )}
                          <ChannelInfo>
                            <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {channel.name}
                              {channel.is_premium && (
                                <span style={{ fontSize: '9px', background: 'rgba(255, 179, 0, 0.1)', color: '#ffb300', padding: '1px 5px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                                  <Lock size={10} /> Premium (₹{channel.price})
                                </span>
                              )}
                            </h4>
                            <p>{channel.description || 'No description provided.'}</p>
                            <ChannelMeta>
                              <span>📺 Creator Channel</span>
                              <span>👥 {channel.followers_count} Followers</span>
                            </ChannelMeta>
                          </ChannelInfo>
                        </div>
                        <div style={{ display: 'flex', gap: '6px', marginLeft: '12px' }}>
                          <button 
                            onClick={() => handleEditChannelClick(channel)}
                            style={{ background: 'none', border: 'none', color: '#00ff88', cursor: 'pointer', padding: '6px' }}
                            title="Edit Channel Settings"
                          >
                            <Settings size={16} />
                          </button>
                          <button 
                            onClick={() => handleDeleteChannel(channel.id)}
                            style={{ background: 'none', border: 'none', color: '#ff3366', cursor: 'pointer', padding: '6px' }}
                            title="Delete Channel"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </ChannelHeaderView>
                    </>
                  )}
                </ChannelItem>
              ))
            )}
          </Card>

          {/* MY PUBLISHED POSTS */}
          <Card>
            <CardHeader>
              <h3>
                <IconContainer $color="#00bcd4"><FileText size={16} /></IconContainer> 
                My Published Posts
              </h3>
            </CardHeader>

            {loadingPosts ? (
              <div style={{ color: '#9b9eac', fontSize: '14px', textAlign: 'center', padding: '16px 0' }}>Loading posts...</div>
            ) : myPosts.length === 0 ? (
              <div style={{ color: '#9b9eac', fontSize: '14px', textAlign: 'center', padding: '24px 0' }}>
                You haven't published any community posts yet. Share your thoughts in the Community Hub!
              </div>
            ) : (
              myPosts.map((post) => (
                <PostItem key={post.id}>
                  <div className="post-header">
                    <div>
                      <h4>{post.title}</h4>
                      {post.channel_name && (
                        <span style={{ fontSize: '11px', color: '#00ff88', background: 'rgba(0, 255, 136, 0.08)', padding: '2px 6px', borderRadius: '4px', display: 'inline-block', marginTop: '4px' }}>
                          📢 Posted in {post.channel_name}
                        </span>
                      )}
                    </div>
                    <button 
                      onClick={() => handleDeletePost(post.id)}
                      style={{ background: 'none', border: 'none', color: '#ff3366', cursor: 'pointer', padding: '4px' }}
                      title="Delete Post"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <div className="post-body">{post.content}</div>
                  <div className="post-footer">
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} /> {new Date(post.created_at).toLocaleDateString()}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#00bcd4' }}>
                      <Heart size={12} fill="#00bcd4" /> {post.likes} Likes
                    </span>
                  </div>
                </PostItem>
              ))
            )}
          </Card>

          {!user?.is_verified && user?.verification_status !== 'pending' && (
            <Card style={{ border: '1px solid rgba(0, 188, 212, 0.3)' }}>
              <CardHeader>
                <h3>
                  <IconContainer $color="#00bcd4"><ShieldCheck size={16} /></IconContainer>
                  Apply for Educator Verification
                </h3>
              </CardHeader>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 16px 0', lineHeight: '1.5' }}>
                Verified creators stand out in the community hub with a badge, premium follow pricing option, and public contests capability. Submit your credentials for review.
              </p>
              <Form onSubmit={handleRequestVerification}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', color: '#9b9eac' }}>Requested Verification Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Certified Options Trainer, Nifty Analyst"
                    value={verificationTitle}
                    onChange={(e) => setVerificationTitle(e.target.value)}
                    required
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
                  <label style={{ fontSize: '11px', color: '#9b9eac' }}>Credentials & Proof of Track Record</label>
                  <textarea
                    placeholder="Describe your background and paste links to your social channels, YouTube videos, SEBI registrations, or profit statements..."
                    value={verificationProof}
                    onChange={(e) => setVerificationProof(e.target.value)}
                    rows={4}
                    required
                  />
                </div>
                <button type="submit" disabled={submittingVerification} style={{ marginTop: '12px' }}>
                  {submittingVerification ? 'Submitting Application...' : 'Submit Verification Request'}
                </button>
              </Form>
            </Card>
          )}

          {user?.verification_status === 'pending' && (
            <Card style={{ border: '1px solid rgba(255, 179, 0, 0.3)' }}>
              <CardHeader>
                <h3 style={{ color: '#ffb300' }}>
                  <IconContainer $color="#ffb300"><Clock size={16} /></IconContainer>
                  Verification Request Under Review
                </h3>
              </CardHeader>
              <p style={{ fontSize: '13px', color: '#d0d2dd', margin: 0, lineHeight: '1.5' }}>
                Your request to be verified as <strong>"{user.verification_title}"</strong> is currently pending admin validation. This usually takes 24-48 hours. We will update your profile badge once approved.
              </p>
            </Card>
          )}

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
