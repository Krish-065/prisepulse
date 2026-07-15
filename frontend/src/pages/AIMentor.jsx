import { useState, useRef, useEffect } from 'react';
import { apiClient } from '../services/api';
import toast from 'react-hot-toast';
import { 
  Send, Sparkles, MessageSquare, AlertTriangle, Play, HelpCircle, 
  TrendingUp, TrendingDown, RefreshCw, BarChart2, ShieldAlert,
  Plus, Trash2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const SUGGESTED_PROMPTS = [
  "Should I buy Reliance?",
  "What is RSI indicator and how to use it?",
  "Is Bitcoin bullish right now?",
  "Explain Support and Resistance levels for beginners"
];

// Custom lightweight markdown/formatting parser
function formatAIMessage(text) {
  if (!text) return '';
  
  // Format lines
  const lines = text.split('\n');
  return lines.map((line, idx) => {
    let cleanLine = line.trim();
    
    // Check headers
    if (cleanLine.startsWith('###')) {
      return <h4 key={idx} style={{ fontSize: '13px', fontWeight: '800', color: '#00ff88', marginTop: '12px', marginBottom: '6px', textTransform: 'uppercase' }}>{cleanLine.replace('###', '')}</h4>;
    }
    if (cleanLine.startsWith('##')) {
      return <h3 key={idx} style={{ fontSize: '15px', fontWeight: '800', color: '#00bcd4', marginTop: '16px', marginBottom: '8px' }}>{cleanLine.replace('##', '')}</h3>;
    }
    if (cleanLine.startsWith('#')) {
      return <h2 key={idx} style={{ fontSize: '18px', fontWeight: '900', color: '#ffffff', marginTop: '20px', marginBottom: '10px' }}>{cleanLine.replace('#', '')}</h2>;
    }

    // Check bullet points
    if (cleanLine.startsWith('-') || cleanLine.startsWith('*')) {
      const content = cleanLine.substring(1).trim();
      return <li key={idx} style={{ marginLeft: '16px', marginBottom: '4px', fontSize: '13px', color: 'var(--text-secondary)' }}>{parseBoldText(content)}</li>;
    }

    // Check bold disclaimers
    if (cleanLine.includes('**Disclaimer:') || cleanLine.includes('**Not Financial Advice:')) {
      return (
        <div key={idx} style={{ background: 'rgba(255,179,0,0.06)', border: '1px solid rgba(255,179,0,0.2)', padding: '12px', borderRadius: '8px', color: '#ffb300', fontSize: '11px', marginTop: '16px', lineHeight: '1.4' }}>
          {cleanLine.replace(/\*\*/g, '')}
        </div>
      );
    }

    if (cleanLine === '') return <div key={idx} style={{ height: '8px' }} />;

    return <p key={idx} style={{ fontSize: '13px', margin: '0 0 8px 0', lineHeight: '1.5', color: '#e0e0e0' }}>{parseBoldText(cleanLine)}</p>;
  });
}

function parseBoldText(text) {
  const parts = text.split(/\*\*([^*]+)\*\*/g);
  return parts.map((part, i) => {
    if (i % 2 === 1) {
      return <strong key={i} style={{ color: '#ffffff', fontWeight: '800' }}>{part}</strong>;
    }
    return part;
  });
}

export default function AIMentor() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: 'Hello! I am your NonStock AI Mentor. Ask me any investing questions, ask about specific indicators (e.g. RSI, SMA), or check setup trend details like **"Should I buy Reliance?"**'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [activeTechnicals, setActiveTechnicals] = useState(null);
  const [activeMLEnsemble, setActiveMLEnsemble] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  
  const chatEndRef = useRef(null);

  const fetchConversations = async () => {
    try {
      const res = await apiClient.get('/ai/conversations');
      setConversations(res.data);
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleNewChat = () => {
    setActiveConversationId(null);
    setMessages([
      {
        sender: 'ai',
        text: 'Hello! I am your NonStock AI Mentor. Ask me any investing questions, ask about specific indicators (e.g. RSI, SMA), or check setup trend details like **"Should I buy Reliance?"**'
      }
    ]);
    setActiveTechnicals(null);
    setActiveMLEnsemble(null);
  };

  const handleSelectConversation = async (convId) => {
    try {
      setSending(true);
      const res = await apiClient.get(`/ai/conversations/${convId}/messages`);
      const mapped = res.data.map(m => ({
        sender: m.sender === 'model' ? 'ai' : m.sender,
        text: m.text
      }));
      setMessages(mapped.length > 0 ? mapped : [
        { sender: 'ai', text: 'Conversation is empty. Ask me any investing questions!' }
      ]);
      setActiveConversationId(convId);
      setActiveTechnicals(null);
      setActiveMLEnsemble(null);
    } catch (err) {
      toast.error('Failed to load messages');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteConversation = async (e, convId) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this conversation?')) return;

    try {
      await apiClient.delete(`/ai/conversations/${convId}`);
      toast.success('Conversation deleted');
      fetchConversations();
      if (activeConversationId === convId) {
        handleNewChat();
      }
    } catch (err) {
      toast.error('Failed to delete conversation');
    }
  };

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    // Check message quota for non-Pro users
    const userMsgCount = messages.filter(m => m.sender === 'user').length;
    if (userMsgCount >= 5 && !user?.is_pro) {
      toast.error('Tutorial limit reached! Please upgrade to Pro for unlimited AI Mentor conversations.');
      setMessages(prev => [
        ...prev,
        { sender: 'user', text },
        {
          sender: 'ai',
          text: '### 🔒 Pro Membership Required\n\nYou have completed your limit of 5 free sandbox messages with the AI Investing Mentor. Upgrade to **NonStock Pro** to enjoy unlimited conversational guidance, options scanner metrics, and custom SMS/WhatsApp notifications.\n\n[Upgrade to Pro Membership](/upgrade-pro)'
        }
      ]);
      if (!textToSend) setInputText('');
      return;
    }

    if (!textToSend) setInputText('');
    setSending(true);

    // Append user message
    setMessages(prev => [...prev, { sender: 'user', text }]);

    try {
      const res = await apiClient.post('/ai/ask', {
        message: text,
        conversationId: activeConversationId
      });
      
      // Append AI response
      setMessages(prev => [...prev, { sender: 'ai', text: res.data.response }]);
      
      if (!activeConversationId && res.data.conversationId) {
        setActiveConversationId(res.data.conversationId);
      }
      fetchConversations();

      // Update Technical context sidebar if found
      if (res.data.technicals) {
        setActiveTechnicals(res.data.technicals);
      }
      // Update ML Ensemble sidebar if found
      if (res.data.mlEnsemble) {
        setActiveMLEnsemble(res.data.mlEnsemble);
      } else {
        setActiveMLEnsemble(null);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'AI request failed');
      setMessages(prev => [...prev, { sender: 'ai', text: 'Error: Could not retrieve educational feedback. Please check if your Google Gemini API key is configured correctly.' }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', color: '#ffffff' }}>
      
      {/* Top Title Banner */}
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
            <Sparkles size={28} style={{ color: '#00ff88' }} />
            AI Investing Mentor
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0 }}>
            Learn technical concepts, ask details about specific stocks, and understand setups using live data charts.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)' }}>
            Powered by Gemini 2.5 Flash
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr 340px', gap: '24px', alignItems: 'stretch' }}>
        
        {/* Left Sidebar: Chat History */}
        <div style={{
          background: 'var(--bg-card-glass)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          height: '620px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
        }}>
          <button
            onClick={handleNewChat}
            style={{
              background: 'linear-gradient(135deg, rgba(0, 255, 136, 0.15) 0%, rgba(0, 255, 136, 0.05) 100%)',
              border: '1px solid rgba(0, 255, 136, 0.3)',
              borderRadius: '8px',
              color: '#00ff88',
              padding: '12px',
              fontWeight: '800',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(0, 255, 136, 0.22)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(0, 255, 136, 0.15)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <Plus size={16} />
            New Conversation
          </button>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', margin: '4px 0' }} />

          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Recent Chats
          </span>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
            {conversations.length === 0 ? (
              <div style={{ color: 'var(--text-secondary)', fontSize: '12px', textAlign: 'center', padding: '24px 0', fontStyle: 'italic' }}>
                No past conversations.
              </div>
            ) : (
              conversations.map(conv => {
                const isActive = activeConversationId === conv.id;
                return (
                  <div
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv.id)}
                    style={{
                      background: isActive ? 'rgba(0, 255, 136, 0.08)' : 'rgba(255,255,255,0.02)',
                      border: isActive ? '1px solid rgba(0, 255, 136, 0.3)' : '1px solid rgba(255,255,255,0.04)',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px',
                      transition: 'all 0.2s ease',
                      position: 'relative'
                    }}
                    onMouseEnter={e => {
                      if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                    }}
                    onMouseLeave={e => {
                      if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', flex: 1 }}>
                      <MessageSquare size={14} style={{ color: isActive ? '#00ff88' : 'var(--text-secondary)', flexShrink: 0 }} />
                      <span style={{
                        fontSize: '12px',
                        fontWeight: isActive ? '750' : '500',
                        color: isActive ? '#ffffff' : '#d0d2dd',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        flex: 1
                      }}>
                        {conv.title}
                      </span>
                    </div>
                    
                    <button
                      onClick={(e) => handleDeleteConversation(e, conv.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        padding: '2px',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'color 0.2s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = '#ff4444'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Chat Canvas Section */}
        <div style={{
          background: 'var(--bg-card-glass)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          height: '620px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
        }}>
          
          {/* Scrollable messages container */}
          <div style={{ flex: 1, overflowY: 'auto', paddingRight: '10px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                style={{
                  alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '75%',
                  background: msg.sender === 'user' 
                    ? 'linear-gradient(135deg, #00ff88 0%, #00bcd4 100%)' 
                    : 'rgba(255,255,255,0.03)',
                  border: msg.sender === 'user' ? 'none' : '1px solid rgba(255,255,255,0.06)',
                  borderRadius: msg.sender === 'user' ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                  padding: '16px',
                  color: msg.sender === 'user' ? '#0a0e27' : '#ffffff',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
              >
                {msg.sender === 'ai' ? (
                  <div>
                    {formatAIMessage(msg.text)}
                  </div>
                ) : (
                  <p style={{ margin: 0, fontSize: '13px', fontWeight: '700', lineHeight: '1.4' }}>
                    {msg.text}
                  </p>
                )}
              </div>
            ))}
            {sending && (
              <div style={{ alignSelf: 'flex-start', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '16px 16px 16px 2px', padding: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
                <RefreshCw className="animate-spin" size={14} />
                <span style={{ fontSize: '12px' }}>AI Mentor is compiling stock insights...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Suggested Prompts Block */}
          {messages.length === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '700' }}>SUGGESTED QUERIES</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {SUGGESTED_PROMPTS.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(p)}
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: '20px',
                      padding: '8px 14px',
                      color: 'var(--text-primary)',
                      fontSize: '11px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      transition: '0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,255,136,0.1)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                  >
                    <HelpCircle size={12} style={{ color: '#00ff88' }} />
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chat Input Area */}
          <div style={{ display: 'flex', gap: '12px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
            <input 
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask AI Mentor (e.g. 'Explain RSI' or 'Should I buy SBIN?')..."
              style={{
                flex: 1,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px',
                padding: '12px 16px',
                color: '#ffffff',
                fontSize: '13px',
                outline: 'none'
              }}
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={sending}
              style={{
                background: 'linear-gradient(135deg, #00ff88 0%, #00bcd4 100%)',
                border: 'none',
                borderRadius: '8px',
                color: '#0a0e27',
                padding: '12px 20px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: sending ? 0.6 : 1
              }}
            >
              <Send size={16} />
            </button>
          </div>

        </div>

        {/* Right Sidebar: Real-Time Technical Insights */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Real-Time Tech Widget */}
          <div style={{
            background: 'var(--bg-card-glass)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <h3 style={{ fontSize: '15px', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart2 size={18} style={{ color: '#00ff88' }} />
              Live Technicals Widget
            </h3>

            {activeTechnicals ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px' }}>
                  <span style={{ fontSize: '16px', fontWeight: '900', color: '#ffffff' }}>{activeTechnicals.symbol}</span>
                  <span style={{ fontSize: '18px', fontWeight: '900', color: '#00ff88' }}>₹{activeTechnicals.price.toLocaleString('en-IN')}</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>RSI (14):</span>
                    <span style={{ fontWeight: '800', color: activeTechnicals.rsi > 70 ? '#ff4444' : activeTechnicals.rsi < 30 ? '#00ff88' : '#00bcd4' }}>
                      {activeTechnicals.rsi} ({activeTechnicals.rsi > 70 ? 'Overbought' : activeTechnicals.rsi < 30 ? 'Oversold' : 'Neutral'})
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>30-Day Trend:</span>
                    <span style={{ fontWeight: '800', color: activeTechnicals.trend === 'BULLISH' ? '#00ff88' : '#ff4444', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {activeTechnicals.trend === 'BULLISH' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                      {activeTechnicals.trend}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Support:</span>
                    <span style={{ fontWeight: '800', color: '#00ff88' }}>₹{activeTechnicals.support.toLocaleString('en-IN')}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Resistance:</span>
                    <span style={{ fontWeight: '800', color: '#ff4444' }}>₹{activeTechnicals.resistance.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)', fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                  <strong>AI Note:</strong> RSI is sitting at {activeTechnicals.rsi}. A level below 30 represents oversold conditions, while a level above 70 indicates overbought conditions.
                </div>
              </div>
            ) : (
              <p style={{ color: 'var(--text-secondary)', fontSize: '12px', margin: 0, textAlign: 'center', padding: '36px 0' }}>
                Query a specific stock (e.g. "Should I buy Reliance?") to fetch real-time indicators context here.
              </p>
            )}
          </div>

          {activeMLEnsemble && (
            <div style={{
              background: 'var(--bg-card-glass)',
              border: '1px solid rgba(0, 188, 212, 0.2)',
              borderRadius: '16px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              boxShadow: '0 8px 32px rgba(0, 188, 212, 0.05)'
            }}>
              <h3 style={{ fontSize: '15px', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: '#00bcd4' }}>
                <Sparkles size={18} />
                ML Ensemble Forecast
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: '700' }}>ENSEMBLE DIRECTION PROBABILITY</span>
                <div style={{ height: '24px', borderRadius: '12px', overflow: 'hidden', display: 'flex', fontSize: '10px', fontWeight: '800', color: '#0a0e27' }}>
                  {activeMLEnsemble.overall.buy > 0 && (
                    <div style={{ background: '#00ff88', width: `${activeMLEnsemble.overall.buy}%`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      Buy {activeMLEnsemble.overall.buy}%
                    </div>
                  )}
                  {activeMLEnsemble.overall.hold > 0 && (
                    <div style={{ background: '#ffb300', width: `${activeMLEnsemble.overall.hold}%`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      Hold {activeMLEnsemble.overall.hold}%
                    </div>
                  )}
                  {activeMLEnsemble.overall.sell > 0 && (
                    <div style={{ background: '#ff4444', width: `${activeMLEnsemble.overall.sell}%`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      Sell {activeMLEnsemble.overall.sell}%
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: '700' }}>COMPONENT MODEL SIGNALS</span>
                {activeMLEnsemble.components.map((comp, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: '#c0c2cc' }}>{comp.name}</span>
                    <span style={{ 
                      fontWeight: '800', 
                      color: comp.signal === 'Buy' || comp.signal === 'Bullish' ? '#00ff88' : comp.signal === 'Sell' || comp.signal === 'Bearish' ? '#ff4444' : '#ffb300' 
                    }}>
                      {comp.signal} ({comp.strength}%)
                    </span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px', fontSize: '12px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Ensemble Confidence:</span>
                <span style={{ fontWeight: '900', color: '#00bcd4' }}>{activeMLEnsemble.confidence}%</span>
              </div>
            </div>
          )}

          {/* Education guidelines sidebar card */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(16, 20, 39, 0.9) 0%, rgba(22, 28, 59, 0.9) 100%)',
            border: '1px solid rgba(0, 255, 136, 0.15)',
            borderRadius: '16px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={16} style={{ color: '#ffb300' }} />
              Educational Principles
            </h3>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4' }}>
              NonStock is built to foster financial literacy. Our AI mentor translates dry data points into clear educational summaries.
            </p>
            <ul style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0, paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <li>Support stands for price floors where buying is historically strong.</li>
              <li>Resistance stands for ceilings where selling has halted upside.</li>
              <li>Always execute virtual trades on the paper trading sandbox first!</li>
            </ul>
          </div>

        </div>

      </div>

    </div>
  );
}
