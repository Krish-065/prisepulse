import { useState } from 'react';
import { Mail, MapPin, MessageSquare, Info, Sparkles, Send, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

export default function ContactUs() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    subject: 'General Inquiry',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.message.trim()) {
      toast.error('Please enter your message.');
      return;
    }

    setLoading(true);
    // Simulate API request
    await new Promise(r => setTimeout(r, 1500));
    setLoading(false);
    setSubmitted(true);
    toast.success('Your message has been sent to support!');
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px', color: '#ffffff' }}>
      
      {/* Title Header */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(16, 20, 39, 0.6) 0%, rgba(22, 28, 59, 0.4) 100%)',
        border: '1px solid rgba(0, 255, 136, 0.15)',
        borderRadius: '16px',
        padding: '32px',
        marginBottom: '32px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }} className="section-card">
        <div style={{
          position: 'absolute',
          top: '-50px',
          right: '-50px',
          width: '200px',
          height: '200px',
          background: 'radial-gradient(circle, rgba(0, 255, 136, 0.1) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />
        
        <h1 style={{ 
          fontSize: '36px', 
          fontWeight: '900', 
          margin: '0 0 10px 0', 
          background: 'linear-gradient(135deg, #00ff88 0%, #00bcd4 100%)', 
          WebkitBackgroundClip: 'text', 
          WebkitTextFillColor: 'transparent',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <Sparkles size={32} style={{ color: '#00ff88' }} />
          About NonStock & Support
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px', maxWidth: '600px', margin: '0 auto' }}>
          Empowering retail traders with high-end algorithmic intelligence, real-time insights, and community collaboration.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '32px', alignItems: 'start' }} className="two-column">
        
        {/* Left Side: About Us */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div style={{
            background: 'var(--bg-card-glass)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }} className="section-card">
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#00ff88', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
              <Info size={20} /> Our Mission
            </h3>
            <p style={{ color: '#d1c9b8', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
              At <strong>NonStock</strong>, we believe professional-grade quantitative tools shouldn't be locked behind expensive institutional paywalls. Our mission is to democratize financial markets by providing easy-to-use strategy builders, fast real-time options greeks, and automated sandbox simulators.
            </p>
            <p style={{ color: '#d1c9b8', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
              Whether you are a beginner learning technical signals or a seasoned professional executing custom derivative templates, NonStock supplies the framework you need to test, analyze, and build confidence.
            </p>
          </div>

          <div style={{
            background: 'var(--bg-card-glass)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }} className="section-card">
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#00bcd4', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
              <MessageSquare size={20} /> Direct Contact Information
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(0, 188, 212, 0.1)', display: 'flex', alignItems: 'center', justifyContents: 'center', paddingLeft: '10px', color: '#00bcd4' }}>
                  <Mail size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>Official Email Support</div>
                  <a href="mailto:krishshah8201@gmail.com" style={{ fontSize: '14px', color: '#ffffff', textDecoration: 'none', fontWeight: 600, transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = '#00bcd4'} onMouseOut={e => e.currentTarget.style.color = '#ffffff'}>
                    krishshah8201@gmail.com
                  </a>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(0, 255, 136, 0.1)', display: 'flex', alignItems: 'center', justifyContents: 'center', paddingLeft: '10px', color: '#00ff88' }}>
                  <MapPin size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>Headquarters</div>
                  <div style={{ fontSize: '14px', color: '#ffffff', fontWeight: 600 }}>Mumbai, Maharashtra, India</div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Side: Contact Form */}
        <div style={{
          background: 'var(--bg-card-glass)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '32px'
        }} className="section-card">
          {submitted ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <CheckCircle2 size={56} style={{ color: '#00ff88', margin: '0 auto 20px auto' }} />
              <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#ffffff', marginBottom: '8px' }}>Thank You!</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '300px', margin: '0 auto 24px auto' }}>
                We have received your message and will get back to you at <strong>{formData.email}</strong> as soon as possible.
              </p>
              <button 
                onClick={() => {
                  setSubmitted(false);
                  setFormData(prev => ({ ...prev, message: '' }));
                }}
                style={{
                  padding: '10px 24px',
                  borderRadius: '20px',
                  border: 'none',
                  background: 'rgba(255,255,255,0.08)',
                  color: '#ffffff',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff', margin: '0 0 4px 0' }}>
                Send us a Message
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }} className="two-column">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>Your Name</label>
                  <input 
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter name"
                    style={{ padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(10,14,39,0.4)', color: '#ffffff', fontSize: '13px' }}
                    required
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>Your Email</label>
                  <input 
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Enter email address"
                    style={{ padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(10,14,39,0.4)', color: '#ffffff', fontSize: '13px' }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>Subject</label>
                <select
                  value={formData.subject}
                  onChange={e => setFormData({ ...formData, subject: e.target.value })}
                  style={{ padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(10,14,39,0.4)', color: '#ffffff', fontSize: '13px' }}
                >
                  <option value="General Inquiry">General Inquiry</option>
                  <option value="Pro Plan Support">Pro Plan Support</option>
                  <option value="Feature Suggestion">Feature Suggestion</option>
                  <option value="Bug Report">Bug Report</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>Message</label>
                <textarea 
                  value={formData.message}
                  onChange={e => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Tell us what you need help with..."
                  rows={5}
                  style={{ padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(10,14,39,0.4)', color: '#ffffff', fontSize: '13px', resize: 'vertical' }}
                  required
                />
              </div>

              <button 
                type="submit"
                disabled={loading}
                style={{
                  padding: '12px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #00ff88 0%, #00bcd4 100%)',
                  color: '#0a0e27',
                  fontWeight: 700,
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 15px rgba(0, 255, 136, 0.2)',
                  opacity: loading ? 0.7 : 1
                }}
              >
                <Send size={16} />
                {loading ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          )}
        </div>

      </div>

    </div>
  );
}
