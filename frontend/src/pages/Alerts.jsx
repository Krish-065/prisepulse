import { useState, useEffect } from 'react';
import { apiClient } from '../services/api';
import toast from 'react-hot-toast';
import { 
  Bell, Trash2, PlusCircle, RefreshCw, Smartphone, Mail, MessageSquare, CheckCircle, Clock
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Alerts() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);

  // New Alert form states
  const [symbol, setSymbol] = useState('RELIANCE');
  const [triggerType, setTriggerType] = useState('price'); // price | rsi | ema
  const [indicatorPeriod, setIndicatorPeriod] = useState(14);
  const [condition, setCondition] = useState('above'); // above | below | crosses
  const [targetValue, setTargetValue] = useState('');
  const [channel, setChannel] = useState('in-app'); // in-app | email | sms | whatsapp
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/alerts');
      setAlerts(res.data);
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
      toast.error('Failed to fetch active alerts');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAlert = async (e) => {
    e.preventDefault();
    if (!symbol.trim() || !targetValue.trim()) {
      toast.error('Please fill in the symbol and comparison value');
      return;
    }

    if ((channel === 'sms' || channel === 'whatsapp') && !user?.is_pro) {
      toast.error('SMS & WhatsApp notifications are premium Pro features. Please upgrade your plan!');
      window.location.href = '/upgrade-pro';
      return;
    }

    setCreating(true);
    try {
      await apiClient.post('/alerts', {
        symbol: symbol.toUpperCase(),
        target_price: parseFloat(targetValue),
        channel,
        trigger_type: triggerType,
        indicator_period: parseInt(indicatorPeriod),
        condition
      });
      toast.success('Alert configuration saved successfully!');
      setTargetValue('');
      fetchAlerts();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to register alert');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteAlert = async (id) => {
    try {
      await apiClient.delete(`/alerts/${id}`);
      toast.success('Alert rule deleted');
      fetchAlerts();
    } catch (err) {
      toast.error('Failed to delete alert');
    }
  };

  const activeAlerts = alerts.filter(a => a.status === 'active');
  const triggeredAlerts = alerts.filter(a => a.status === 'triggered');

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
            <Bell size={28} style={{ color: '#00ff88' }} />
            Automated Alerts Hub
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0 }}>
            Configure real-time price limits and indicator thresholds (RSI, EMA) delivered straight to your preferred channels.
          </p>
        </div>
        <div>
          <button 
            onClick={fetchAlerts}
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
            Scan & Refresh
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '24px', alignItems: 'start' }}>
        
        {/* Left Side: Create Alert Form */}
        <div style={{
          background: 'var(--bg-card-glass)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '24px'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: '800', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px', color: '#00ff88' }}>
            <PlusCircle size={18} />
            Create Alert Rule
          </h3>
          
          <form onSubmit={handleCreateAlert} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase' }}>Ticker Symbol</label>
              <input
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                placeholder="e.g. RELIANCE, NIFTY, BTC"
                style={{ background: 'rgba(10,14,39,0.5)', border: '1px solid rgba(255,255,255,0.08)', padding: '10px 12px', borderRadius: '8px', color: '#ffffff', fontSize: '13px', fontWeight: '700' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase' }}>Trigger Indicator</label>
                <select
                  value={triggerType}
                  onChange={(e) => setTriggerType(e.target.value)}
                  style={{ background: 'rgba(10,14,39,0.5)', border: '1px solid rgba(255,255,255,0.08)', padding: '10px 12px', borderRadius: '8px', color: '#ffffff', fontSize: '13px', outline: 'none' }}
                >
                  <option value="price">Price (₹ / $)</option>
                  <option value="rsi">RSI</option>
                  <option value="ema">EMA</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase' }}>Period</label>
                <input
                  type="number"
                  disabled={triggerType === 'price'}
                  value={indicatorPeriod}
                  onChange={(e) => setIndicatorPeriod(e.target.value)}
                  style={{ background: 'rgba(10,14,39,0.5)', border: '1px solid rgba(255,255,255,0.08)', padding: '10px 12px', borderRadius: '8px', color: '#ffffff', fontSize: '13px', fontWeight: '700', opacity: triggerType === 'price' ? 0.4 : 1 }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase' }}>Condition</label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  style={{ background: 'rgba(10,14,39,0.5)', border: '1px solid rgba(255,255,255,0.08)', padding: '10px 12px', borderRadius: '8px', color: '#ffffff', fontSize: '13px', outline: 'none' }}
                >
                  <option value="above">Is Above</option>
                  <option value="below">Is Below</option>
                  <option value="crosses">Crosses</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase' }}>Comparison Value</label>
                <input
                  type="number"
                  step="0.01"
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  placeholder={triggerType === 'rsi' ? 'e.g. 30' : 'e.g. 2400'}
                  style={{ background: 'rgba(10,14,39,0.5)', border: '1px solid rgba(255,255,255,0.08)', padding: '10px 12px', borderRadius: '8px', color: '#ffffff', fontSize: '13px', fontWeight: '700' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase' }}>Delivery Channel</label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                style={{ background: 'rgba(10,14,39,0.5)', border: '1px solid rgba(255,255,255,0.08)', padding: '10px 12px', borderRadius: '8px', color: '#ffffff', fontSize: '13px', outline: 'none' }}
              >
                <option value="in-app">🔔 In-App Notifications</option>
                <option value="email">📧 Email Notification</option>
                <option value="sms">📱 SMS Alerts (PRO)</option>
                <option value="whatsapp">💬 WhatsApp Alerts (PRO)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={creating}
              style={{
                marginTop: '6px',
                background: 'linear-gradient(135deg, #00ff88 0%, #00bcd4 100%)',
                border: 'none',
                borderRadius: '8px',
                color: '#0a0e27',
                padding: '12px',
                fontWeight: '800',
                fontSize: '13px',
                cursor: 'pointer',
                opacity: creating ? 0.6 : 1
              }}
            >
              {creating ? 'Creating Alert...' : 'Set Active Alert'}
            </button>
          </form>
        </div>

        {/* Right Side: Alert Lists (Active & History) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Active Alerts */}
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={20} style={{ color: '#00bcd4' }} />
              Active Alert Conditions ({activeAlerts.length})
            </h2>

            {loading && activeAlerts.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <RefreshCw className="animate-spin" />
              </div>
            ) : activeAlerts.length === 0 ? (
              <div style={{
                background: 'var(--bg-card-glass)',
                border: '1px solid var(--border-color)',
                borderRadius: '16px',
                padding: '36px',
                textAlign: 'center',
                color: 'var(--text-secondary)'
              }}>
                No active alert parameters set. Define a setup condition on the left to start!
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {activeAlerts.map(alert => (
                  <div key={alert.id} style={{
                    background: 'var(--bg-card-glass)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '16px',
                    padding: '18px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '15px', fontWeight: '900', color: '#ffffff' }}>{alert.symbol}</span>
                      <span style={{ 
                        fontSize: '9px', 
                        background: 'rgba(0, 188, 212, 0.1)', 
                        color: '#00bcd4', 
                        padding: '2px 8px', 
                        borderRadius: '4px', 
                        fontWeight: '800',
                        textTransform: 'uppercase',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        {alert.channel === 'email' ? <Mail size={10} /> : alert.channel === 'sms' ? <Smartphone size={10} /> : alert.channel === 'whatsapp' ? <MessageSquare size={10} /> : <Bell size={10} />}
                        {alert.channel}
                      </span>
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)', fontSize: '12px' }}>
                      Trigger: <strong style={{ color: '#00ff88', textTransform: 'uppercase' }}>{alert.trigger_type}</strong>{' '}
                      {alert.trigger_type !== 'price' ? `(${alert.indicator_period}) ` : ''}
                      <span style={{ color: 'var(--text-secondary)' }}>{alert.condition}</span>{' '}
                      <strong style={{ color: '#ffffff' }}>{alert.target_price}</strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--text-secondary)' }}>
                      <span>Created: {new Date(alert.created_at).toLocaleDateString('en-IN')}</span>
                      <button
                        onClick={() => handleDeleteAlert(alert.id)}
                        style={{
                          background: 'rgba(255, 68, 68, 0.1)',
                          border: 'none',
                          color: '#ff4444',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '11px'
                        }}
                      >
                        <Trash2 size={12} />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Triggered Alerts History */}
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={20} style={{ color: '#00ff88' }} />
              Triggered Alerts History ({triggeredAlerts.length})
            </h2>

            {triggeredAlerts.length === 0 ? (
              <div style={{
                background: 'var(--bg-card-glass)',
                border: '1px solid var(--border-color)',
                borderRadius: '16px',
                padding: '36px',
                textAlign: 'center',
                color: 'var(--text-secondary)'
              }}>
                No alert history recorded yet. Setup parameters will auto-trigger when conditions match live data scans.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {triggeredAlerts.map(alert => (
                  <div key={alert.id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'rgba(0, 255, 136, 0.03)',
                    border: '1px solid rgba(0, 255, 136, 0.12)',
                    borderRadius: '8px',
                    padding: '12px 16px'
                  }}>
                    <div>
                      <span style={{ fontSize: '13px', fontWeight: '900', color: '#ffffff' }}>{alert.symbol}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginLeft: '12px' }}>
                        Indicator <strong>{alert.trigger_type}</strong> ({alert.condition} {alert.target_price})
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '11px', color: '#00ff88', fontWeight: '700' }}>
                        Triggered: {new Date(alert.triggered_at).toLocaleDateString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <button
                        onClick={() => handleDeleteAlert(alert.id)}
                        style={{ background: 'transparent', border: 'none', color: '#9b9eac', cursor: 'pointer' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
