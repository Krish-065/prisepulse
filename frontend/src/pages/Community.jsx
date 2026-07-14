import { useState, useEffect, useRef } from 'react';
import { apiClient } from '../services/api';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';
import { 
  Users, Award, Copy, Share2, Play, Star, Sparkles, TrendingUp, 
  TrendingDown, RefreshCw, Trophy, ShieldCheck, Flame, MessageSquare,
  BookOpen, ThumbsUp, PlusCircle, ExternalLink, Send, Search, Lock,
  Globe, AlertCircle, CheckCircle, XCircle
} from 'lucide-react';

export default function Community() {
  const { user } = useAuth();
  const [tab, setTab] = useState('systems'); // systems | feed | educator | chats
  
  // Shared Strategies & Leaderboard
  const [sharedStrategies, setSharedStrategies] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loadingStrategies, setLoadingStrategies] = useState(false);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

  // Market Discussion Feed
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [posting, setPosting] = useState(false);

  // Educator & Contests Hub
  const [courses, setCourses] = useState([]);
  const [contests, setContests] = useState([]);
  const [loadingEdu, setLoadingEdu] = useState(false);
  const [eduSearchQuery, setEduSearchQuery] = useState('');

  // Host a Contest Request State
  const [isHostContestOpen, setIsHostContestOpen] = useState(false);
  const [newContestTitle, setNewContestTitle] = useState('');
  const [newContestDesc, setNewContestDesc] = useState('');
  const [newContestPrize, setNewContestPrize] = useState('');
  const [newContestStart, setNewContestStart] = useState('');
  const [newContestEnd, setNewContestEnd] = useState('');
  const [newContestProofs, setNewContestProofs] = useState('');
  const [submittingContest, setSubmittingContest] = useState(false);

  // Admin Pending Contests List
  const [pendingContests, setPendingContests] = useState([]);
  const [loadingPendingContests, setLoadingPendingContests] = useState(false);

  // Discuss Groups & Custom Channels
  const [activeGroupId, setActiveGroupId] = useState('nifty'); // nifty | options | basics | crypto | UUID
  const [chatMessages, setChatMessages] = useState([]);
  const [loadingChat, setLoadingChat] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);

  // Public Channel Search & Previews
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Create Public Room Modal State
  const [isCreatePublicRoomOpen, setIsCreatePublicRoomOpen] = useState(false);
  const [newRoomId, setNewRoomId] = useState('');
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomFeatures, setNewRoomFeatures] = useState('admin-only-chat');
  const [creatingRoom, setCreatingRoom] = useState(false);

  const [groups, setGroups] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupFeatures, setNewGroupFeatures] = useState('all-can-chat');
  const [inviteEmails, setInviteEmails] = useState('');
  const [isManageGroupOpen, setIsManageGroupOpen] = useState(false);
  const [groupMembers, setGroupMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const chatEndRef = useRef(null);

  useEffect(() => {
    // Initial fetch depending on tab
    if (tab === 'systems') {
      fetchSharedStrategies();
      fetchLeaderboard();
    } else if (tab === 'feed') {
      fetchPosts();
    } else if (tab === 'educator') {
      fetchEducatorData();
    } else if (tab === 'chats') {
      fetchGroups();
      fetchInvitations();
      fetchChatMessages(activeGroupId);
    }
  }, [tab, activeGroupId]);

  useEffect(() => {
    if (tab === 'chats' && activeGroupId && isManageGroupOpen) {
      fetchGroupMembers(activeGroupId);
    }
  }, [tab, activeGroupId, isManageGroupOpen]);

  useEffect(() => {
    if (tab === 'chats') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, tab]);

  useEffect(() => {
    if (tab !== 'chats' || !activeGroupId) return;

    const socketUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace('/api', '');
    const token = localStorage.getItem('token');

    const socket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      console.log('🔌 Connected to group chat socket');
      socket.emit('joinGroup', activeGroupId);
    });

    socket.on('newChatMessage', (msg) => {
      if (msg.group_id !== activeGroupId) return;
      setChatMessages(prev => {
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    socket.on('connect_error', (err) => {
      console.warn('Chat socket connection error:', err);
    });

    return () => {
      socket.emit('leaveGroup', activeGroupId);
      socket.disconnect();
    };
  }, [tab, activeGroupId]);

  // Shared Strategies & Leaderboard
  const fetchSharedStrategies = async () => {
    setLoadingStrategies(true);
    try {
      const res = await apiClient.get('/strategy/shared');
      setSharedStrategies(res.data);
    } catch (err) {
      console.error('Failed to fetch shared strategies:', err);
    } finally {
      setLoadingStrategies(false);
    }
  };

  const fetchLeaderboard = async () => {
    setLoadingLeaderboard(true);
    try {
      const res = await apiClient.get('/paper/leaderboard');
      setLeaderboard(res.data.leaderboard || []);
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  const handleCopyStrategy = async (id, name) => {
    try {
      await apiClient.post(`/strategy/copy/${id}`);
      toast.success(`Strategy "${name}" copied to your Saved Systems!`);
      fetchSharedStrategies(); // refresh count
    } catch (err) {
      toast.error('Failed to copy strategy');
    }
  };

  // Discussion Feed API Call
  const fetchPosts = async () => {
    setLoadingPosts(true);
    try {
      const res = await apiClient.get('/community/posts');
      setPosts(res.data);
    } catch (err) {
      console.error('Failed to fetch posts:', err);
    } finally {
      setLoadingPosts(false);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPostTitle.trim() || !newPostContent.trim()) {
      toast.error('Please enter both title and content');
      return;
    }
    setPosting(true);
    try {
      await apiClient.post('/community/posts', {
        title: newPostTitle,
        content: newPostContent
      });
      toast.success('Post published to Market Feed!');
      setNewPostTitle('');
      setNewPostContent('');
      fetchPosts();
    } catch (err) {
      toast.error('Failed to publish post');
    } finally {
      setPosting(false);
    }
  };

  const handleLikePost = async (id) => {
    try {
      await apiClient.post(`/community/posts/${id}/like`);
      // Optimistic update
      setPosts(prev => prev.map(p => p.id === id ? { ...p, likes: p.likes + 1 } : p));
    } catch (err) {
      toast.error('Failed to like post');
    }
  };

  // Educator & Contests API
  const fetchEducatorData = async () => {
    setLoadingEdu(true);
    try {
      const courseRes = await apiClient.get('/community/courses');
      const contestRes = await apiClient.get('/community/contests');
      setCourses(courseRes.data);
      setContests(contestRes.data);
      if (user?.is_admin) {
        fetchPendingContests();
      }
    } catch (err) {
      console.error('Failed to fetch educator data:', err);
    } finally {
      setLoadingEdu(false);
    }
  };

  const fetchPendingContests = async () => {
    setLoadingPendingContests(true);
    try {
      const res = await apiClient.get('/community/contests/pending');
      setPendingContests(res.data);
    } catch (err) {
      console.error('Failed to fetch pending contests:', err);
    } finally {
      setLoadingPendingContests(false);
    }
  };

  const handleJoinContest = async (id, title) => {
    try {
      await apiClient.post(`/community/contests/${id}/join`);
      toast.success(`You have successfully joined the "${title}" contest!`);
      fetchEducatorData();
    } catch (err) {
      toast.error('Failed to join contest');
    }
  };

  // Group Chat & Group Management API
  const fetchGroups = async () => {
    try {
      const res = await apiClient.get('/community/groups');
      setGroups(res.data);
      if (res.data.length > 0) {
        const activeExists = res.data.some(g => g.id === activeGroupId);
        if (!activeExists) {
          setActiveGroupId(res.data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch groups:', err);
    }
  };

  const fetchInvitations = async () => {
    try {
      const res = await apiClient.get('/community/invitations');
      setInvitations(res.data);
    } catch (err) {
      console.error('Failed to fetch invitations:', err);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) {
      toast.error('Group name is required');
      return;
    }
    try {
      const res = await apiClient.post('/community/groups', {
        name: newGroupName,
        features: newGroupFeatures
      });
      toast.success(`Group "${newGroupName}" created successfully!`);
      setNewGroupName('');
      setNewGroupFeatures('all-can-chat');
      setIsCreateGroupOpen(false);
      await fetchGroups();
      setActiveGroupId(res.data.id);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create group');
    }
  };

  const handleSendInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmails.trim()) {
      toast.error('Please enter at least one email');
      return;
    }
    try {
      const res = await apiClient.post(`/community/groups/${activeGroupId}/invite`, {
        emails: inviteEmails
      });
      if (res.data.invited && res.data.invited.length > 0) {
        toast.success(`Sent invitation to: ${res.data.invited.join(', ')}`);
        setInviteEmails('');
      }
      if (res.data.errors && res.data.errors.length > 0) {
        res.data.errors.forEach(err => toast.error(err));
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send invite');
    }
  };

  const handleAcceptInvite = async (inviteId, groupName) => {
    try {
      await apiClient.post(`/community/invitations/${inviteId}/accept`);
      toast.success(`Accepted invitation to join "${groupName}"!`);
      await fetchInvitations();
      await fetchGroups();
    } catch (err) {
      toast.error('Failed to accept invitation');
    }
  };

  const handleRejectInvite = async (inviteId, groupName) => {
    try {
      await apiClient.post(`/community/invitations/${inviteId}/reject`);
      toast.success(`Rejected invitation to join "${groupName}"`);
      await fetchInvitations();
    } catch (err) {
      toast.error('Failed to reject invitation');
    }
  };

  const fetchGroupMembers = async (groupId) => {
    setLoadingMembers(true);
    try {
      const res = await apiClient.get(`/community/groups/${groupId}/members`);
      setGroupMembers(res.data);
    } catch (err) {
      console.error('Failed to fetch group members:', err);
    } finally {
      setLoadingMembers(false);
    }
  };

  const handlePromoteMember = async (userId, userName) => {
    try {
      await apiClient.post(`/community/groups/${activeGroupId}/members/${userId}/role`, {
        role: 'admin'
      });
      toast.success(`${userName} has been promoted to Admin!`);
      fetchGroupMembers(activeGroupId);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to promote member');
    }
  };

  const fetchChatMessages = async (groupId) => {
    setLoadingChat(true);
    try {
      const res = await apiClient.get(`/community/chat/${groupId}`);
      setChatMessages(res.data);
    } catch (err) {
      console.error('Failed to fetch chat messages:', err);
    } finally {
      setLoadingChat(false);
    }
  };

  // Search public channels debouncer
  useEffect(() => {
    if (tab !== 'chats' || !searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await apiClient.get(`/community/groups/search?q=${encodeURIComponent(searchQuery)}`);
        setSearchResults(res.data);
      } catch (err) {
        console.error('Failed to search public channels:', err);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery, tab]);

  // Join a public room
  const handleJoinPublicRoom = async (groupId) => {
    try {
      await apiClient.post(`/community/groups/${groupId}/join`);
      toast.success('Successfully joined public room/channel!');
      await fetchGroups();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to join group');
    }
  };

  // Create a public room
  const handleCreatePublicRoom = async (e) => {
    e.preventDefault();
    if (!newRoomName.trim() || !newRoomId.trim()) {
      toast.error('Room Name and Room ID are required');
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(newRoomId)) {
      toast.error('Room ID must contain only alphanumeric characters and underscores');
      return;
    }
    setCreatingRoom(true);
    try {
      const res = await apiClient.post('/community/groups', {
        name: newRoomName,
        roomId: newRoomId,
        features: newRoomFeatures,
        isPublic: true
      });
      toast.success(`Public room #${newRoomName} created!`);
      setNewRoomName('');
      setNewRoomId('');
      setNewRoomFeatures('admin-only-chat');
      setIsCreatePublicRoomOpen(false);
      await fetchGroups();
      setActiveGroupId(res.data.id);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create public room');
    } finally {
      setCreatingRoom(false);
    }
  };

  // Submit contest request
  const handleHostContest = async (e) => {
    e.preventDefault();
    if (!newContestTitle.trim() || !newContestDesc.trim() || !newContestPrize.trim() || !newContestStart || !newContestEnd || !newContestProofs.trim()) {
      toast.error('All fields, including verification proofs, are required');
      return;
    }
    setSubmittingContest(true);
    try {
      await apiClient.post('/community/contests', {
        title: newContestTitle,
        description: newContestDesc,
        prizePool: newContestPrize,
        startDate: newContestStart,
        endDate: newContestEnd,
        proofs: newContestProofs
      });
      toast.success('Contest request submitted and is pending admin approval.');
      setIsHostContestOpen(false);
      setNewContestTitle('');
      setNewContestDesc('');
      setNewContestPrize('');
      setNewContestStart('');
      setNewContestEnd('');
      setNewContestProofs('');
      fetchEducatorData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit contest request');
    } finally {
      setSubmittingContest(false);
    }
  };

  // Admin Approve Contest
  const handleApproveContest = async (id, title) => {
    try {
      await apiClient.post(`/community/contests/${id}/approve`);
      toast.success(`Contest "${title}" approved and live!`);
      fetchEducatorData();
    } catch (err) {
      toast.error('Failed to approve contest');
    }
  };

  // Admin Reject Contest
  const handleRejectContest = async (id, title) => {
    try {
      await apiClient.post(`/community/contests/${id}/reject`);
      toast.success(`Contest "${title}" request rejected.`);
      fetchEducatorData();
    } catch (err) {
      toast.error('Failed to reject contest');
    }
  };

  const handleSendChatMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setSendingMsg(true);
    try {
      const res = await apiClient.post(`/community/chat/${activeGroupId}`, {
        message: chatInput
      });
      setChatMessages(prev => [...prev, res.data]);
      setChatInput('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send message');
    } finally {
      setSendingMsg(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', color: '#ffffff' }}>
      
      {/* Top Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(16, 20, 39, 0.6) 0%, rgba(22, 28, 59, 0.4) 100%)',
        border: '1px solid rgba(0, 255, 136, 0.15)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '900', margin: '0 0 6px 0', background: 'linear-gradient(135deg, #00ff88 0%, #00bcd4 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users size={28} style={{ color: '#00ff88' }} />
            NonStock Community Hub
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0 }}>
            Clone high-performing community strategies, view ranking leaderboard stats, and discuss setup results.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => {
              if (tab === 'systems') { fetchSharedStrategies(); fetchLeaderboard(); }
              else if (tab === 'feed') { fetchPosts(); }
              else if (tab === 'educator') { fetchEducatorData(); }
              else if (tab === 'chats') { fetchChatMessages(activeGroupId); }
            }}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: '#ffffff',
              padding: '8px 16px',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <RefreshCw size={14} />
            Refresh Hub
          </button>
        </div>
      </div>

      {/* Tabs Row */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px' }}>
        {[
          { id: 'systems', name: 'Systems & Rankings', icon: <Flame size={16} /> },
          { id: 'feed', name: 'Market Discussion', icon: <MessageSquare size={16} /> },
          { id: 'educator', name: 'Educator & Contests', icon: <BookOpen size={16} /> },
          { id: 'chats', name: 'Discuss Groups', icon: <Users size={16} /> }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              border: 'none',
              borderRadius: '8px',
              background: tab === t.id ? 'rgba(0, 255, 136, 0.1)' : 'transparent',
              color: tab === t.id ? '#00ff88' : '#e0e0e0',
              fontWeight: tab === t.id ? '800' : '500',
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {t.icon}
            {t.name}
          </button>
        ))}
      </div>

      {/* Tab Content rendering */}
      {tab === 'systems' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '24px', alignItems: 'stretch' }}>
          
          {/* Left Side: Shared Strategy Feed */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Flame size={20} style={{ color: '#ff5722' }} />
              Trending Trading Systems
            </h2>

            {loadingStrategies ? (
              <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <RefreshCw className="animate-spin" style={{ margin: '0 auto 12px auto' }} />
                Loading shared strategy configurations...
              </div>
            ) : sharedStrategies.length === 0 ? (
              <div style={{
                background: 'var(--bg-card-glass)',
                border: '1px solid var(--border-color)',
                borderRadius: '16px',
                padding: '48px',
                textAlign: 'center',
                color: 'var(--text-secondary)'
              }}>
                No shared strategies on the feed yet. Create a backtest inside the Strategy Lab and click Share to post!
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {sharedStrategies.map(strat => (
                  <div key={strat.id} style={{
                    background: 'var(--bg-card-glass)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '16px',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h4 style={{ fontSize: '15px', fontWeight: '900', color: '#ffffff', margin: '0 0 4px 0' }}>{strat.strategyName}</h4>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Created by: <strong>{strat.authorName}</strong></span>
                      </div>
                      <span style={{ fontSize: '10px', background: 'rgba(0, 255, 136, 0.1)', color: '#00ff88', padding: '2px 8px', borderRadius: '4px', fontWeight: '800' }}>
                        {strat.winRate}% WIN
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontSize: '9px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Net Profit</span>
                        <span style={{ fontSize: '13px', fontWeight: '900', color: strat.netProfit >= 0 ? '#00ff88' : '#ff4444' }}>
                          {strat.netProfit >= 0 ? '+' : ''}{strat.netProfit}%
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontSize: '9px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Max DD</span>
                        <span style={{ fontSize: '13px', fontWeight: '900', color: '#ff9800' }}>
                          {strat.drawdown}%
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontSize: '9px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Cloned</span>
                        <span style={{ fontSize: '13px', fontWeight: '900', color: '#00bcd4' }}>
                          {strat.copiedCount} times
                        </span>
                      </div>
                    </div>

                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                      <strong>Buy Setups:</strong> {strat.indicators?.buyConditions?.length || 0} configurations <br/>
                      <strong>Sell Setups:</strong> {strat.indicators?.sellConditions?.length || 0} configurations
                    </div>

                    <button
                      onClick={() => handleCopyStrategy(strat.id, strat.strategyName)}
                      style={{
                        marginTop: '8px',
                        background: 'linear-gradient(135deg, #00ff88 0%, #00bcd4 100%)',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#0a0e27',
                        padding: '10px',
                        fontWeight: '800',
                        fontSize: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <Copy size={13} />
                      Clone Setup System
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Side: Paper Trading Leaderboard */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Trophy size={20} style={{ color: '#ffb300' }} />
              Sandbox Leaderboards
            </h2>

            <div style={{
              background: 'var(--bg-card-glass)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '12px', margin: 0, lineHeight: '1.4' }}>
                Real-time ranking of paper trading accounts by current virtual balance.
              </p>

              {loadingLeaderboard ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  <RefreshCw className="animate-spin" />
                </div>
              ) : leaderboard.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', fontSize: '12px', textAlign: 'center' }}>No users ranked yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {leaderboard.map((user, idx) => {
                    const balance = parseFloat(user.virtualBalance || 1000000);
                    const pnlPercent = ((balance - 1000000) / 1000000) * 100;
                    
                    return (
                      <div key={idx} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.04)',
                        borderRadius: '8px',
                        padding: '10px 12px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: idx === 0 ? '#ffb300' : idx === 1 ? '#e0e0e0' : idx === 2 ? '#cd7f32' : 'rgba(255,255,255,0.05)',
                            color: idx < 3 ? '#0a0e27' : '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '11px',
                            fontWeight: '900'
                          }}>
                            {idx + 1}
                          </span>
                          <div>
                            <span style={{ fontSize: '12px', fontWeight: '800' }}>{user.name}</span>
                            <span style={{ display: 'block', fontSize: '9px', color: 'var(--text-secondary)' }}>
                              {pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}% P&L
                            </span>
                          </div>
                        </div>
                        <span style={{ fontSize: '13px', fontWeight: '900', color: '#00ff88' }}>
                          ₹{balance.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === 'feed' && (
        <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '24px', alignItems: 'start' }}>
          {/* Create Post Card */}
          <div style={{
            background: 'var(--bg-card-glass)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            padding: '24px',
            position: 'sticky',
            top: '24px'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px', color: '#00ff88' }}>
              <PlusCircle size={18} />
              Write Market Post
            </h3>
            <form onSubmit={handleCreatePost} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Post Title</label>
                <input
                  type="text"
                  value={newPostTitle}
                  onChange={(e) => setNewPostTitle(e.target.value)}
                  placeholder="e.g. Reliance breakout setup"
                  style={{ background: 'rgba(10,14,39,0.5)', border: '1px solid rgba(255,255,255,0.08)', padding: '10px 12px', borderRadius: '8px', color: '#ffffff', fontSize: '13px' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Content Explanation</label>
                <textarea
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="Explain your technical indicators, target price, and logic..."
                  rows={6}
                  style={{ background: 'rgba(10,14,39,0.5)', border: '1px solid rgba(255,255,255,0.08)', padding: '10px 12px', borderRadius: '8px', color: '#ffffff', fontSize: '13px', resize: 'none' }}
                />
              </div>
              <button
                type="submit"
                disabled={posting}
                style={{
                  background: 'linear-gradient(135deg, #00ff88 0%, #00bcd4 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#0a0e27',
                  padding: '12px',
                  fontWeight: '800',
                  fontSize: '13px',
                  cursor: 'pointer',
                  opacity: posting ? 0.6 : 1
                }}
              >
                {posting ? 'Publishing...' : 'Publish Post'}
              </button>
            </form>
          </div>

          {/* Feed Posts */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageSquare size={20} style={{ color: '#00bcd4' }} />
              Market Discussion Feed
            </h2>

            {loadingPosts ? (
              <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <RefreshCw className="animate-spin" />
              </div>
            ) : posts.length === 0 ? (
              <div style={{
                background: 'var(--bg-card-glass)',
                border: '1px solid var(--border-color)',
                borderRadius: '16px',
                padding: '48px',
                textAlign: 'center',
                color: 'var(--text-secondary)'
              }}>
                No market posts yet. Write your thoughts and post it!
              </div>
            ) : (
              posts.map(post => (
                <div key={post.id} style={{
                  background: 'var(--bg-card-glass)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '16px',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: '#00ff88', fontWeight: '800' }}>{post.author_name}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      {new Date(post.created_at).toLocaleDateString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#ffffff', margin: 0 }}>{post.title}</h3>
                  <p style={{ fontSize: '13px', color: '#d0d2dd', margin: 0, lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{post.content}</p>
                  
                  <div style={{ display: 'flex', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px', marginTop: '4px' }}>
                    <button
                      onClick={() => handleLikePost(post.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-secondary)',
                        fontSize: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: '0.2s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = '#00ff88'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                    >
                      <ThumbsUp size={14} />
                      Like ({post.likes})
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}      {tab === 'educator' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Top Actions: Search Filter & Host Contest Button */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '16px',
            flexWrap: 'wrap',
            background: 'rgba(255,255,255,0.01)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: '12px',
            padding: '16px 20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '10px 16px', width: '360px' }}>
              <Search size={16} style={{ color: 'var(--text-secondary)' }} />
              <input
                type="text"
                placeholder="Filter contests or course playlists..."
                value={eduSearchQuery}
                onChange={(e) => setEduSearchQuery(e.target.value)}
                style={{ background: 'transparent', border: 'none', color: '#ffffff', fontSize: '13px', outline: 'none', width: '100%' }}
              />
            </div>
            
            <button
              onClick={() => setIsHostContestOpen(true)}
              style={{
                background: 'linear-gradient(135deg, #ffb300 0%, #ff8f00 100%)',
                border: 'none',
                borderRadius: '8px',
                color: '#0a0e27',
                padding: '12px 24px',
                fontWeight: '800',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 15px rgba(255, 179, 0, 0.25)',
                transition: '0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <Trophy size={16} />
              Host a Contest
            </button>
          </div>

          {/* Admin Pending Requests Dashboard */}
          {user?.is_admin && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(255, 179, 0, 0.08) 0%, rgba(255, 179, 0, 0.02) 100%)',
              border: '1px solid rgba(255, 179, 0, 0.25)',
              borderRadius: '16px',
              padding: '24px'
            }}>
              <h2 style={{ fontSize: '18px', fontWeight: '850', color: '#ffb300', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={20} />
                Contest Host Review Panel (Admin Dashboard)
              </h2>
              {loadingPendingContests ? (
                <div style={{ color: 'var(--text-secondary)', display: 'flex', gap: '8px', alignItems: 'center', padding: '12px 0' }}>
                  <RefreshCw className="animate-spin" size={14} /> Loading pending contest requests...
                </div>
              ) : pendingContests.length === 0 ? (
                <div style={{ color: 'var(--text-secondary)', fontSize: '13px', fontStyle: 'italic', padding: '8px 0' }}>
                  No pending contest verification requests.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {pendingContests.map(req => (
                    <div key={req.id} style={{
                      background: 'rgba(10, 14, 39, 0.6)',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      borderRadius: '12px',
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                        <div>
                          <h3 style={{ fontSize: '15px', fontWeight: '800', margin: '0 0 4px 0', color: '#ffffff' }}>{req.title}</h3>
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                            Requested by: <strong>{req.host_name}</strong> ({req.host_email})
                          </span>
                        </div>
                        <span style={{ fontSize: '10px', background: 'rgba(255, 179, 0, 0.1)', color: '#ffb300', padding: '4px 10px', borderRadius: '6px', fontWeight: '800', border: '1px solid rgba(255, 179, 0, 0.2)' }}>
                          PENDING APPROVAL
                        </span>
                      </div>
                      <p style={{ fontSize: '12px', color: '#d0d2dd', margin: 0, lineHeight: '1.5' }}>{req.description}</p>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', background: 'rgba(255,255,255,0.02)', padding: '12px 16px', borderRadius: '8px', fontSize: '11px' }}>
                        <div>
                          <span style={{ display: 'block', color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: '9px', marginBottom: '2px' }}>Prize Pool</span>
                          <strong style={{ color: '#00ff88', fontSize: '13px' }}>{req.prize_pool}</strong>
                        </div>
                        <div>
                          <span style={{ display: 'block', color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: '9px', marginBottom: '2px' }}>Timeline</span>
                          <strong>{req.start_date} - {req.end_date}</strong>
                        </div>
                      </div>

                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px', marginTop: '4px' }}>
                        <span style={{ fontSize: '10px', color: '#ffb300', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                          <ShieldCheck size={12} /> Host Credentials & Background Verification:
                        </span>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, whiteSpace: 'pre-wrap', fontStyle: 'italic', lineHeight: '1.4' }}>
                          {req.proofs}
                        </p>
                      </div>

                      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
                        <button
                          onClick={() => handleRejectContest(req.id, req.title)}
                          style={{
                            background: 'rgba(255, 68, 68, 0.1)',
                            border: '1px solid rgba(255, 68, 68, 0.25)',
                            borderRadius: '6px',
                            color: '#ff4444',
                            padding: '8px 16px',
                            fontWeight: '800',
                            fontSize: '11px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: '0.2s'
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 68, 68, 0.18)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 68, 68, 0.1)'}
                        >
                          <XCircle size={13} /> Reject Request
                        </button>
                        <button
                          onClick={() => handleApproveContest(req.id, req.title)}
                          style={{
                            background: 'rgba(0, 255, 136, 0.1)',
                            border: '1px solid rgba(0, 255, 136, 0.25)',
                            borderRadius: '6px',
                            color: '#00ff88',
                            padding: '8px 16px',
                            fontWeight: '800',
                            fontSize: '11px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: '0.2s'
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(0, 255, 136, 0.18)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'rgba(0, 255, 136, 0.1)'}
                        >
                          <CheckCircle size={13} /> Approve & Publish
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Contests Block */}
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Trophy size={20} style={{ color: '#ffb300' }} />
              Active Paper Trading Contests
            </h2>

            {loadingEdu ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <RefreshCw className="animate-spin" />
              </div>
            ) : contests.filter(ct => 
              ct.title.toLowerCase().includes(eduSearchQuery.toLowerCase()) ||
              ct.description.toLowerCase().includes(eduSearchQuery.toLowerCase())
            ).length === 0 ? (
              <div style={{
                background: 'var(--bg-card-glass)',
                border: '1px solid var(--border-color)',
                borderRadius: '16px',
                padding: '32px',
                textAlign: 'center',
                color: 'var(--text-secondary)',
                fontSize: '13px'
              }}>
                No active contests found matching filters.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: '16px' }}>
                {contests.filter(ct => 
                  ct.title.toLowerCase().includes(eduSearchQuery.toLowerCase()) ||
                  ct.description.toLowerCase().includes(eduSearchQuery.toLowerCase())
                ).map(ct => (
                  <div key={ct.id} style={{
                    background: 'var(--bg-card-glass)',
                    border: '1px solid rgba(255, 179, 0, 0.25)',
                    borderRadius: '16px',
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h3 style={{ fontSize: '16px', fontWeight: '800', margin: 0, color: '#ffffff' }}>{ct.title}</h3>
                        <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                          Hosted by: <strong>{ct.host_name}</strong>
                        </span>
                      </div>
                      <span style={{ fontSize: '10px', background: ct.status === 'approved' ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255, 179, 0, 0.1)', color: ct.status === 'approved' ? '#00ff88' : '#ffb300', padding: '2px 8px', borderRadius: '4px', fontWeight: '800' }}>
                        {ct.status ? ct.status.toUpperCase() : 'ACTIVE'}
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>{ct.description}</p>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', fontSize: '11px' }}>
                      <div>
                        <span style={{ display: 'block', color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: '9px' }}>Prize Pool</span>
                        <strong style={{ color: '#00ff88', fontSize: '13px' }}>{ct.prize_pool}</strong>
                      </div>
                      <div>
                        <span style={{ display: 'block', color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: '9px' }}>Timeline</span>
                        <strong>{ct.start_date} - {ct.end_date}</strong>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Participants: <strong>{ct.participants} students</strong></span>
                      {ct.status === 'approved' && (
                        <button
                          onClick={() => handleJoinContest(ct.id, ct.title)}
                          style={{
                            background: 'linear-gradient(135deg, #00ff88 0%, #00bcd4 100%)',
                            border: 'none',
                            borderRadius: '6px',
                            color: '#0a0e27',
                            padding: '8px 16px',
                            fontWeight: '800',
                            fontSize: '11px',
                            cursor: 'pointer'
                          }}
                        >
                          Join Contest
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Courses Block */}
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookOpen size={20} style={{ color: '#00ff88' }} />
              Educator Course Playlists
            </h2>

            {loadingEdu ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <RefreshCw className="animate-spin" />
              </div>
            ) : courses.filter(course => 
              course.title.toLowerCase().includes(eduSearchQuery.toLowerCase()) ||
              course.description.toLowerCase().includes(eduSearchQuery.toLowerCase()) ||
              course.category.toLowerCase().includes(eduSearchQuery.toLowerCase())
            ).length === 0 ? (
              <div style={{
                background: 'var(--bg-card-glass)',
                border: '1px solid var(--border-color)',
                borderRadius: '16px',
                padding: '32px',
                textAlign: 'center',
                color: 'var(--text-secondary)',
                fontSize: '13px'
              }}>
                No courses found matching filters.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                {courses.filter(course => 
                  course.title.toLowerCase().includes(eduSearchQuery.toLowerCase()) ||
                  course.description.toLowerCase().includes(eduSearchQuery.toLowerCase()) ||
                  course.category.toLowerCase().includes(eduSearchQuery.toLowerCase())
                ).map(course => (
                  <div key={course.id} style={{
                    background: 'var(--bg-card-glass)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '16px',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}>
                    <span style={{ fontSize: '9px', background: 'rgba(0, 255, 136, 0.1)', color: '#00ff88', padding: '2px 6px', borderRadius: '4px', alignSelf: 'flex-start', fontWeight: '800' }}>
                      {course.category}
                    </span>
                    <h3 style={{ fontSize: '14px', fontWeight: '800', margin: 0, color: '#ffffff', minHeight: '38px', lineHeight: '1.4' }}>{course.title}</h3>
                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0, minHeight: '50px', lineHeight: '1.4' }}>{course.description}</p>
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Instructor: <strong>{course.instructor}</strong></span>
                      <a
                        href={course.youtube_link}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          color: '#00bcd4',
                          textDecoration: 'none',
                          fontWeight: '800',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        Watch <ExternalLink size={11} />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      {tab === 'chats' && (
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '24px', alignItems: 'stretch' }}>
          {/* Chat Groups & Invites Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Sidebar main card */}
            <div style={{
              background: 'var(--bg-card-glass)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              minHeight: '450px'
            }}>
              
              {/* Search Public Channels */}
              <div style={{ position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '8px 12px' }}>
                  <Search size={14} style={{ color: 'var(--text-secondary)' }} />
                  <input
                    type="text"
                    placeholder="Search rooms/channels..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: '12px',
                      outline: 'none',
                      width: '100%'
                    }}
                  />
                </div>
                {searchQuery.trim() && (
                  <div style={{
                    position: 'absolute',
                    top: '42px',
                    left: 0,
                    right: 0,
                    background: '#11152a',
                    border: '1px solid rgba(0, 255, 136, 0.2)',
                    borderRadius: '8px',
                    padding: '8px',
                    zIndex: 100,
                    maxHeight: '200px',
                    overflowY: 'auto',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(10px)'
                  }}>
                    {searching ? (
                      <div style={{ padding: '8px', textAlign: 'center', fontSize: '11px', color: 'var(--text-secondary)' }}>
                        Searching...
                      </div>
                    ) : searchResults.length === 0 ? (
                      <div style={{ padding: '8px', textAlign: 'center', fontSize: '11px', color: 'var(--text-secondary)' }}>
                        No public rooms found
                      </div>
                    ) : (
                      searchResults.map(group => (
                        <button
                          key={group.id}
                          onClick={() => {
                            const joined = groups.find(g => g.id === group.id);
                            if (!joined) {
                              setSearchResults(prev => prev.some(p => p.id === group.id) ? prev : [...prev, group]);
                            }
                            setActiveGroupId(group.id);
                            setSearchQuery('');
                          }}
                          style={{
                            width: '100%',
                            textAlign: 'left',
                            padding: '8px',
                            background: 'transparent',
                            border: 'none',
                            color: '#ffffff',
                            fontSize: '12px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <span># {group.name}</span>
                          <span style={{ fontSize: '9px', color: 'var(--text-secondary)' }}>
                            @{group.room_id}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Public Rooms */}
              <div>
                <h3 style={{ fontSize: '11px', fontWeight: '800', color: '#00ff88', letterSpacing: '0.8px', textTransform: 'uppercase', margin: '0 0 10px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Public Rooms</span>
                  <button
                    onClick={() => setIsCreatePublicRoomOpen(true)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#00ff88',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      padding: 0
                    }}
                    title="Create public room/channel"
                  >
                    <PlusCircle size={14} />
                  </button>
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {groups.filter(g => g.created_by === null || g.is_public === true).map(room => (
                    <button
                      key={room.id}
                      onClick={() => {
                        setActiveGroupId(room.id);
                        setIsManageGroupOpen(false);
                      }}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '10px 12px',
                        background: activeGroupId === room.id ? 'rgba(0, 255, 136, 0.1)' : 'transparent',
                        color: activeGroupId === room.id ? '#00ff88' : '#e0e0e0',
                        fontWeight: activeGroupId === room.id ? '800' : '500',
                        fontSize: '12px',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: '0.2s',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <span># {room.name}</span>
                      {room.features === 'admin-only-chat' && (
                        <span style={{ fontSize: '9px', background: 'rgba(255, 68, 68, 0.1)', color: '#ff4444', padding: '1px 4px', borderRadius: '4px' }}>
                          Channel
                        </span>
                      )}
                    </button>
                  ))}
                  {/* Also show any active preview group if selected and not joined */}
                  {!groups.some(g => g.id === activeGroupId) && searchResults.some(g => g.id === activeGroupId) && (
                    (() => {
                      const prevRoom = searchResults.find(g => g.id === activeGroupId);
                      return (
                        <button
                          key={prevRoom.id}
                          style={{
                            width: '100%',
                            textAlign: 'left',
                            padding: '10px 12px',
                            background: 'rgba(0, 255, 136, 0.05)',
                            color: '#00ff88',
                            fontWeight: '800',
                            fontSize: '12px',
                            border: '1px dashed rgba(0, 255, 136, 0.3)',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                        >
                          <span># {prevRoom.name} (Preview)</span>
                        </button>
                      );
                    })()
                  )}
                </div>
              </div>

              {/* Private Groups */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h3 style={{ fontSize: '11px', fontWeight: '800', color: '#00bcd4', letterSpacing: '0.8px', textTransform: 'uppercase', margin: 0 }}>
                    My Groups
                  </h3>
                  <button
                    onClick={() => setIsCreateGroupOpen(true)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#00bcd4',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      padding: 0
                    }}
                    title="Create custom group"
                  >
                    <PlusCircle size={16} />
                  </button>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '220px', overflowY: 'auto' }}>
                  {groups.filter(g => g.created_by !== null && g.is_public !== true).length === 0 ? (
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', padding: '0 6px', fontStyle: 'italic' }}>
                      No custom groups yet.
                    </span>
                  ) : (
                    groups.filter(g => g.created_by !== null && g.is_public !== true).map(group => (
                      <button
                        key={group.id}
                        onClick={() => {
                          setActiveGroupId(group.id);
                          setIsManageGroupOpen(false);
                        }}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '10px 12px',
                          background: activeGroupId === group.id ? 'rgba(0, 188, 212, 0.15)' : 'transparent',
                          color: activeGroupId === group.id ? '#00bcd4' : '#e0e0e0',
                          fontWeight: activeGroupId === group.id ? '800' : '500',
                          fontSize: '12px',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          transition: '0.2s',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '180px' }}>
                          👥 {group.name}
                        </span>
                        {group.my_role === 'admin' && (
                          <span style={{ fontSize: '9px', background: 'rgba(0, 255, 136, 0.1)', color: '#00ff88', padding: '1px 4px', borderRadius: '4px' }}>
                            Admin
                          </span>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Invitations Box */}
            {invitations.length > 0 && (
              <div style={{
                background: 'rgba(255, 179, 0, 0.05)',
                border: '1px solid rgba(255, 179, 0, 0.2)',
                borderRadius: '16px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <h4 style={{ fontSize: '11px', fontWeight: '800', color: '#ffb300', textTransform: 'uppercase', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Award size={14} />
                  Pending Invites ({invitations.length})
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                  {invitations.map(invite => (
                    <div
                      key={invite.id}
                      style={{
                        background: 'rgba(10, 14, 39, 0.6)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '8px',
                        padding: '10px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                      }}
                    >
                      <span style={{ fontSize: '11px', fontWeight: '700' }}>{invite.group_name}</span>
                      <span style={{ fontSize: '9px', color: 'var(--text-secondary)' }}>Invited by: {invite.inviter_name}</span>
                      <div style={{ display: 'flex', gap: '6px', marginTop: '2px' }}>
                        <button
                          onClick={() => handleAcceptInvite(invite.id, invite.group_name)}
                          style={{
                            flex: 1,
                            background: '#00ff88',
                            color: '#0a0e27',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '4px',
                            fontSize: '10px',
                            fontWeight: '800',
                            cursor: 'pointer'
                          }}
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleRejectInvite(invite.id, invite.group_name)}
                          style={{
                            flex: 1,
                            background: 'rgba(255,255,255,0.05)',
                            color: '#ff4444',
                            border: '1px solid rgba(255,68,68,0.3)',
                            borderRadius: '4px',
                            padding: '4px',
                            fontSize: '10px',
                            fontWeight: '800',
                            cursor: 'pointer'
                          }}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Group Chat Canvas */}
          <div style={{
            background: 'var(--bg-card-glass)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            height: '600px',
            position: 'relative'
          }}>
            {/* Header info */}
            {(() => {
              const activeGroup = groups.find(g => g.id === activeGroupId) || searchResults.find(g => g.id === activeGroupId) || { name: 'Loading...', created_by: null, features: 'all-can-chat' };
              const isPrivate = activeGroup.created_by !== null && !activeGroup.is_public;
              const isPreview = activeGroup.created_by !== null && activeGroup.my_role === null;
              const isAdmin = activeGroup.my_role === 'admin';
              
              return (
                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '16px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h2 style={{ fontSize: '18px', fontWeight: '900', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {isPrivate ? `👥 ${activeGroup.name}` : `# ${activeGroup.name}`}
                      {isPrivate && (
                        <span style={{ fontSize: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-secondary)', padding: '2px 6px', borderRadius: '4px', fontWeight: '500' }}>
                          Private Group
                        </span>
                      )}
                      {!isPrivate && activeGroup.is_public && (
                        <span style={{ fontSize: '10px', background: 'rgba(0, 255, 136, 0.1)', color: '#00ff88', padding: '2px 6px', borderRadius: '4px', fontWeight: '800' }}>
                          Public Channel
                        </span>
                      )}
                      {activeGroup.features === 'admin-only-chat' && (
                        <span style={{ fontSize: '10px', background: 'rgba(255,68,68,0.1)', color: '#ff4444', padding: '2px 6px', borderRadius: '4px', fontWeight: '800' }}>
                          Announcement Only
                        </span>
                      )}
                      {isPreview && (
                        <span style={{ fontSize: '10px', background: 'rgba(255, 179, 0, 0.1)', color: '#ffb300', padding: '2px 6px', borderRadius: '4px', fontWeight: '800', border: '1px dashed rgba(255, 179, 0, 0.3)' }}>
                          Previewing
                        </span>
                      )}
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '11px', margin: 0 }}>
                      {isPrivate ? `Created by ${activeGroup.creator_name || 'User'}` : `Public channel @${activeGroup.room_id || 'system'} - Share and debate investing configurations in real-time`}
                    </p>
                  </div>
                  
                  {isPrivate && isAdmin && (
                    <button
                      onClick={() => setIsManageGroupOpen(prev => !prev)}
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '8px',
                        color: '#ffffff',
                        padding: '8px 14px',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        transition: '0.2s'
                      }}
                    >
                      {isManageGroupOpen ? 'Close Settings' : 'Manage Group'}
                    </button>
                  )}
                  {isPreview && (
                    <button
                      onClick={() => handleJoinPublicRoom(activeGroup.id)}
                      style={{
                        background: 'linear-gradient(135deg, #00ff88 0%, #00bcd4 100%)',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#0a0e27',
                        padding: '8px 16px',
                        fontSize: '12px',
                        fontWeight: '800',
                        cursor: 'pointer',
                        transition: '0.2s'
                      }}
                    >
                      Join Room
                    </button>
                  )}
                </div>
              );
            })()}

            {/* Message Area & Settings Side-by-Side */}
            <div style={{ display: 'flex', flex: 1, gap: '20px', minHeight: 0, marginBottom: '16px' }}>
              
              {/* Messages list */}
              <div style={{ flex: 1, overflowY: 'auto', paddingRight: '8px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {loadingChat && chatMessages.length === 0 ? (
                  <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                    <RefreshCw className="animate-spin" style={{ marginRight: '8px' }} /> Loading chat messages...
                  </div>
                ) : chatMessages.length === 0 ? (
                  <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: '12px', fontStyle: 'italic' }}>
                    No messages in this group yet. Say hello!
                  </div>
                ) : (
                  chatMessages.map(msg => (
                    <div key={msg.id} style={{
                      alignSelf: 'flex-start',
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.04)',
                      borderRadius: '12px',
                      padding: '12px 16px',
                      maxWidth: '85%',
                      lineHeight: '1.4'
                    }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontSize: '11px', fontWeight: '800', color: '#00ff88' }}>{msg.author_name}</span>
                        <span style={{ fontSize: '9px', color: 'var(--text-secondary)' }}>
                          {new Date(msg.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p style={{ fontSize: '12px', color: '#e0e0e0', margin: 0, whiteSpace: 'pre-wrap' }}>{msg.message}</p>
                    </div>
                  ))
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Group Settings / Admin Panel */}
              {isManageGroupOpen && (
                <div style={{
                  width: '320px',
                  background: 'rgba(10, 14, 39, 0.4)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  overflowY: 'auto'
                }}>
                  {/* Invite Users Form */}
                  <div>
                    <h4 style={{ fontSize: '12px', fontWeight: '800', color: '#00bcd4', margin: '0 0 10px 0' }}>Invite Members</h4>
                    <form onSubmit={handleSendInvite} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <input
                        type="text"
                        placeholder="e.g. user1@mail.com, user2@mail.com"
                        value={inviteEmails}
                        onChange={(e) => setInviteEmails(e.target.value)}
                        style={{
                          background: 'rgba(255,255,255,0.02)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: '6px',
                          padding: '8px 10px',
                          color: '#ffffff',
                          fontSize: '11px',
                          outline: 'none'
                        }}
                      />
                      <button
                        type="submit"
                        style={{
                          background: 'linear-gradient(135deg, #00ff88 0%, #00bcd4 100%)',
                          border: 'none',
                          borderRadius: '6px',
                          color: '#0a0e27',
                          padding: '8px',
                          fontWeight: '800',
                          fontSize: '11px',
                          cursor: 'pointer'
                        }}
                      >
                        Send Invite(s)
                      </button>
                    </form>
                  </div>

                  {/* Members List */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <h4 style={{ fontSize: '12px', fontWeight: '800', color: '#00ff88', margin: '0 0 4px 0' }}>Group Members</h4>
                    
                    {loadingMembers ? (
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Loading members list...</span>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {groupMembers.map(member => (
                          <div
                            key={member.id}
                            style={{
                              background: 'rgba(255,255,255,0.02)',
                              borderRadius: '6px',
                              padding: '8px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}
                          >
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontSize: '11px', fontWeight: '700' }}>{member.name}</span>
                              <span style={{ fontSize: '9px', color: 'var(--text-secondary)', textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: '160px' }}>{member.email}</span>
                            </div>
                            
                            {member.role === 'admin' ? (
                              <span style={{ fontSize: '9px', color: '#00ff88', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '2px' }}>
                                <ShieldCheck size={10} /> Admin
                              </span>
                            ) : (
                              <button
                                onClick={() => handlePromoteMember(member.id, member.name)}
                                style={{
                                  background: 'rgba(0, 255, 136, 0.1)',
                                  border: '1px solid rgba(0, 255, 136, 0.2)',
                                  borderRadius: '4px',
                                  color: '#00ff88',
                                  padding: '2px 6px',
                                  fontSize: '9px',
                                  fontWeight: '800',
                                  cursor: 'pointer'
                                }}
                              >
                                Promote
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input or Warning Panel */}
            {(() => {
              const activeGroup = groups.find(g => g.id === activeGroupId) || searchResults.find(g => g.id === activeGroupId) || { created_by: null, features: 'all-can-chat' };
              const isAnnouncementOnly = activeGroup.features === 'admin-only-chat';
              const isCreatorOrAdmin = activeGroup.created_by === user?.id || activeGroup.my_role === 'admin';
              const isPreview = activeGroup.created_by !== null && activeGroup.my_role === null;
              const canChat = !isPreview && (!isAnnouncementOnly || isCreatorOrAdmin);

              if (isPreview) {
                return (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    background: 'rgba(0, 255, 136, 0.05)',
                    border: '1px solid rgba(0, 255, 136, 0.15)',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: '700'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Globe size={16} style={{ color: '#00ff88' }} />
                      <span>You are previewing this room. Join to join the conversation.</span>
                    </div>
                    <button
                      onClick={() => handleJoinPublicRoom(activeGroup.id)}
                      style={{
                        background: 'linear-gradient(135deg, #00ff88 0%, #00bcd4 100%)',
                        border: 'none',
                        borderRadius: '6px',
                        color: '#0a0e27',
                        padding: '8px 16px',
                        fontWeight: '800',
                        cursor: 'pointer',
                        fontSize: '11px'
                      }}
                    >
                      Join Room
                    </button>
                  </div>
                );
              }

              if (!canChat) {
                return (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    background: 'rgba(255, 68, 68, 0.05)',
                    border: '1px solid rgba(255, 68, 68, 0.15)',
                    borderRadius: '8px',
                    padding: '12px',
                    color: '#ff4444',
                    fontSize: '12px',
                    fontWeight: '700'
                  }}>
                    🔒 Only the room creator or channel admins can post announcements here.
                  </div>
                );
              }

              return (
                <form onSubmit={handleSendChatMessage} style={{ display: 'flex', gap: '10px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder={isAnnouncementOnly ? "Post an announcement..." : `Send a message in # ${activeGroup.name}...`}
                    style={{
                      flex: 1,
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '8px',
                      padding: '12px 14px',
                      color: '#ffffff',
                      fontSize: '12px',
                      outline: 'none'
                    }}
                  />
                  <button
                    type="submit"
                    disabled={sendingMsg}
                    style={{
                      background: 'linear-gradient(135deg, #00ff88 0%, #00bcd4 100%)',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#0a0e27',
                      padding: '10px 20px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: sendingMsg ? 0.6 : 1
                    }}
                  >
                    <Send size={14} />
                  </button>
                </form>
              );
            })()}
          </div>
        </div>
      )}

      {/* Create Group Modal Overlay */}
      {isCreateGroupOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(10, 14, 39, 0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #11152a 0%, #171c3b 100%)',
            border: '1px solid rgba(0, 255, 136, 0.2)',
            borderRadius: '16px',
            padding: '28px',
            width: '400px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
          }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '950', margin: '0 0 6px 0', color: '#ffffff' }}>Create Discussion Group</h3>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0 }}>Establish a new hub and invite members by email.</p>
            </div>
            
            <form onSubmit={handleCreateGroup} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Group Name</label>
                <input
                  type="text"
                  placeholder="e.g. F&O Mastermind"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    color: '#ffffff',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                  autoFocus
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Posting Permissions</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setNewGroupFeatures('all-can-chat')}
                    style={{
                      flex: 1,
                      padding: '10px',
                      background: newGroupFeatures === 'all-can-chat' ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255,255,255,0.02)',
                      border: newGroupFeatures === 'all-can-chat' ? '1px solid #00ff88' : '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '8px',
                      color: newGroupFeatures === 'all-can-chat' ? '#00ff88' : '#ffffff',
                      fontSize: '11px',
                      fontWeight: '800',
                      cursor: 'pointer',
                      transition: '0.2s'
                    }}
                  >
                    All Can Chat
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewGroupFeatures('admin-only-chat')}
                    style={{
                      flex: 1,
                      padding: '10px',
                      background: newGroupFeatures === 'admin-only-chat' ? 'rgba(255, 68, 68, 0.1)' : 'rgba(255,255,255,0.02)',
                      border: newGroupFeatures === 'admin-only-chat' ? '1px solid #ff4444' : '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '8px',
                      color: newGroupFeatures === 'admin-only-chat' ? '#ff4444' : '#ffffff',
                      fontSize: '11px',
                      fontWeight: '800',
                      cursor: 'pointer',
                      transition: '0.2s'
                    }}
                  >
                    Admins Only
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsCreateGroupOpen(false)}
                  style={{
                    flex: 1,
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '8px',
                    color: '#ffffff',
                    padding: '10px',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    background: 'linear-gradient(135deg, #00ff88 0%, #00bcd4 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#0a0e27',
                    padding: '10px',
                    fontSize: '12px',
                    fontWeight: '800',
                    cursor: 'pointer'
                  }}
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Public Room Modal Overlay */}
      {isCreatePublicRoomOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(10, 14, 39, 0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #11152a 0%, #171c3b 100%)',
            border: '1px solid rgba(0, 255, 136, 0.2)',
            borderRadius: '16px',
            padding: '28px',
            width: '400px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
          }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '950', margin: '0 0 6px 0', color: '#ffffff' }}>Create Public Channel</h3>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0 }}>Establish a new public channel searchable by any user.</p>
            </div>
            
            <form onSubmit={handleCreatePublicRoom} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Room Name</label>
                <input
                  type="text"
                  placeholder="e.g. Crypto Signals"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    color: '#ffffff',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                  autoFocus
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Room ID / Handle</label>
                <input
                  type="text"
                  placeholder="e.g. cryptosignals (alphanumeric & underscore only)"
                  value={newRoomId}
                  onChange={(e) => setNewRoomId(e.target.value)}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    color: '#ffffff',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Channel Permissions</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setNewRoomFeatures('all-can-chat')}
                    style={{
                      flex: 1,
                      padding: '10px',
                      background: newRoomFeatures === 'all-can-chat' ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255,255,255,0.02)',
                      border: newRoomFeatures === 'all-can-chat' ? '1px solid #00ff88' : '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '8px',
                      color: newRoomFeatures === 'all-can-chat' ? '#00ff88' : '#ffffff',
                      fontSize: '11px',
                      fontWeight: '800',
                      cursor: 'pointer'
                    }}
                  >
                    All Can Chat
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewRoomFeatures('admin-only-chat')}
                    style={{
                      flex: 1,
                      padding: '10px',
                      background: newRoomFeatures === 'admin-only-chat' ? 'rgba(255, 68, 68, 0.1)' : 'rgba(255,255,255,0.02)',
                      border: newRoomFeatures === 'admin-only-chat' ? '1px solid #ff4444' : '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '8px',
                      color: newRoomFeatures === 'admin-only-chat' ? '#ff4444' : '#ffffff',
                      fontSize: '11px',
                      fontWeight: '800',
                      cursor: 'pointer'
                    }}
                  >
                    Only Creator Posts
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsCreatePublicRoomOpen(false)}
                  style={{
                    flex: 1,
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '8px',
                    color: '#ffffff',
                    padding: '10px',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingRoom}
                  style={{
                    flex: 1,
                    background: 'linear-gradient(135deg, #00ff88 0%, #00bcd4 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#0a0e27',
                    padding: '10px',
                    fontSize: '12px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    opacity: creatingRoom ? 0.6 : 1
                  }}
                >
                  Create Channel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Host Contest Request Modal Overlay */}
      {isHostContestOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(10, 14, 39, 0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #11152a 0%, #171c3b 100%)',
            border: '1px solid rgba(255, 179, 0, 0.3)',
            borderRadius: '16px',
            padding: '28px',
            width: '500px',
            maxHeight: '90vh',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
          }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '950', margin: '0 0 6px 0', color: '#ffb300', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Trophy size={18} />
                Request to Host a Contest
              </h3>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0 }}>
                To host a contest, submit the details and credentials for security verification by the NonStock main admin.
              </p>
            </div>
            
            <form onSubmit={handleHostContest} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Contest Title</label>
                <input
                  type="text"
                  placeholder="e.g. Option Strategy Face-Off"
                  value={newContestTitle}
                  onChange={(e) => setNewContestTitle(e.target.value)}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    color: '#ffffff',
                    fontSize: '12px',
                    outline: 'none'
                  }}
                  autoFocus
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Description & Rules</label>
                <textarea
                  placeholder="Describe the contest goals, restrictions, or special guidelines..."
                  value={newContestDesc}
                  onChange={(e) => setNewContestDesc(e.target.value)}
                  rows={3}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    color: '#ffffff',
                    fontSize: '12px',
                    outline: 'none',
                    resize: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Start Date</label>
                  <input
                    type="date"
                    value={newContestStart}
                    onChange={(e) => setNewContestStart(e.target.value)}
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      color: '#ffffff',
                      fontSize: '12px',
                      outline: 'none'
                    }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>End Date</label>
                  <input
                    type="date"
                    value={newContestEnd}
                    onChange={(e) => setNewContestEnd(e.target.value)}
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      color: '#ffffff',
                      fontSize: '12px',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Prize Pool Details</label>
                <input
                  type="text"
                  placeholder="e.g. ₹50,000 cash prize or premium community membership"
                  value={newContestPrize}
                  onChange={(e) => setNewContestPrize(e.target.value)}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    color: '#ffffff',
                    fontSize: '12px',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <ShieldCheck size={12} style={{ color: '#ffb300' }} />
                  Verification Proofs & Background Check
                </label>
                <textarea
                  placeholder="Provide details proving this contest is legitimate (e.g., links to your social profiles, past successful contests hosted, sponsor verification, contact info)..."
                  value={newContestProofs}
                  onChange={(e) => setNewContestProofs(e.target.value)}
                  rows={4}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    color: '#ffffff',
                    fontSize: '12px',
                    outline: 'none',
                    resize: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsHostContestOpen(false)}
                  style={{
                    flex: 1,
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '8px',
                    color: '#ffffff',
                    padding: '10px',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingContest}
                  style={{
                    flex: 1,
                    background: 'linear-gradient(135deg, #ffb300 0%, #ff8f00 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#0a0e27',
                    padding: '10px',
                    fontSize: '12px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    opacity: submittingContest ? 0.6 : 1
                  }}
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
