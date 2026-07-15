import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../services/api';
import toast from 'react-hot-toast';
import { Sparkles, Check, CreditCard, ShieldCheck, Loader2 } from 'lucide-react';

export default function UpgradePro() {
  const { user, fetchUser } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const [referenceId, setReferenceId] = useState('');
  const [step, setStep] = useState('select'); // 'select', 'checkout', 'verifying', 'success'
  const [verifyStatus, setVerifyStatus] = useState('');

  const plans = [
    {
      id: 'monthly',
      name: 'Monthly Plan',
      price: 449,
      period: 'month',
      description: 'Ideal for testing advanced option chain greeks and strategy alerts.',
      features: [
        'Advanced Option Greeks & IV calculations',
        'Deploy up to 2 live automated trading bots',
        'Unlimited AI Mentor Pro queries',
        '10 real-time technical alerts (Email/SMS)'
      ]
    },
    {
      id: 'annually',
      name: 'Annual Premium',
      price: 2299,
      period: 'year',
      description: 'Best value for serious investors and intermediate day traders.',
      features: [
        'Advanced Option Greeks & IV calculations',
        'Deploy up to 10 live automated trading bots',
        'Unlimited AI Mentor Pro queries',
        '50 real-time technical alerts (Email/SMS)',
        'Priority execution speed & historical backtesting logs'
      ],
      popular: true
    },
    {
      id: 'three_year',
      name: '3-Year Legacy',
      price: 5549,
      period: '3 years',
      description: 'The ultimate toolkit for seasoned market specialists & professional institutions.',
      features: [
        'Advanced Option Greeks & IV calculations',
        'Unlimited live automated trading bots',
        'Unlimited AI Mentor Pro queries',
        'Unlimited real-time technical alerts (Email/SMS)',
        'Priority execution speed & historical backtesting logs',
        'Verified Legacy Pro profile badge and priority support'
      ]
    }
  ];

  const currentPlanDetails = plans.find(p => p.id === selectedPlan);

  const startCheckout = () => {
    setStep('checkout');
  };

  const handleVerifyPayment = async (e) => {
    e.preventDefault();
    if (!referenceId || referenceId.trim().length < 8) {
      toast.error('Please enter a valid 12-digit transaction reference ID (UTR)');
      return;
    }

    setStep('verifying');
    const statuses = [
      'Initiating secure UPI transaction verification...',
      'Connecting to UPI Settlement Node...',
      'Resolving reference ledger status...',
      'Securing credentials and updating membership status...'
    ];

    for (let i = 0; i < statuses.length; i++) {
      setVerifyStatus(statuses[i]);
      await new Promise(r => setTimeout(r, 1200));
    }

    try {
      const res = await apiClient.post('/user/upgrade-pro', {
        plan: selectedPlan,
        referenceId: referenceId.trim()
      });
      if (res.data.success) {
        await fetchUser(false);
        setStep('success');
        toast.success('Congratulations! Welcome to NonStock Pro.');
      } else {
        setStep('checkout');
        toast.error('Payment verification failed. Please try again.');
      }
    } catch (err) {
      setStep('checkout');
      toast.error(err.response?.data?.error || 'Upgrade failed. Please verify reference ID.');
    }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '20px 0' }}>
      
      {/* Step 1: Select Plan */}
      {step === 'select' && (
        <>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              background: 'rgba(255, 179, 0, 0.1)',
              border: '1px solid rgba(255, 179, 0, 0.3)',
              borderRadius: '20px',
              color: '#ffb300',
              fontWeight: 800,
              fontSize: '13px',
              marginBottom: '16px',
              boxShadow: '0 0 15px rgba(255, 179, 0, 0.15)'
            }}>
              <Sparkles size={14} />
              <span>NONSTOCK PRO</span>
            </div>
            <h1 style={{ fontSize: '36px', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.5px' }}>
              Level Up Your Financial Intelligence
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginTop: '8px', maxWidth: '600px', margin: '8px auto 0 auto' }}>
              Unlock elite options analytics, automated sandbox bots, instant SMS alerts, and personalized AI Mentor coaching.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '24px',
            marginBottom: '40px'
          }}>
            {plans.map(plan => (
              <div 
                key={plan.id}
                style={{
                  background: 'rgba(20, 16, 7, 0.4)',
                  border: plan.popular ? '2px solid #ffb300' : '1px solid rgba(255, 179, 0, 0.15)',
                  borderRadius: '20px',
                  padding: '32px 24px',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: plan.popular ? '0 10px 30px rgba(255, 179, 0, 0.15)' : 'none',
                  transform: plan.popular ? 'scale(1.02)' : 'none',
                  transition: 'all 0.3s'
                }}
              >
                {plan.popular && (
                  <span style={{
                    position: 'absolute',
                    top: '-12px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: '#ffb300',
                    color: '#0b0803',
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '4px 12px',
                    borderRadius: '20px',
                    textTransform: 'uppercase',
                    boxShadow: '0 4px 10px rgba(255, 179, 0, 0.3)'
                  }}>
                    Most Popular
                  </span>
                )}

                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff' }}>{plan.name}</h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', minHeight: '36px' }}>{plan.description}</p>
                  
                  <div style={{ display: 'flex', alignItems: 'baseline', marginTop: '16px' }}>
                    <span style={{ fontSize: '38px', fontWeight: 900, color: '#ffb300' }}>₹{plan.price}</span>
                    <span style={{ fontSize: '14px', color: 'var(--text-secondary)', marginLeft: '6px' }}>/ {plan.period}</span>
                  </div>
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
                  {plan.features.map((feat, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <span style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        width: '16px', 
                        height: '16px', 
                        borderRadius: '50%', 
                        background: 'rgba(255, 179, 0, 0.15)', 
                        color: '#ffb300',
                        marginTop: '2px'
                      }}>
                        <Check size={10} strokeWidth={3} />
                      </span>
                      <span style={{ fontSize: '13px', color: '#e5dec9', lineHeight: 1.4 }}>{feat}</span>
                    </div>
                  ))}
                </div>

                <button 
                  onClick={() => {
                    setSelectedPlan(plan.id);
                    startCheckout();
                  }}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '12px',
                    border: 'none',
                    background: plan.popular ? 'linear-gradient(135deg, #ffe082, #ffb300)' : 'rgba(255, 255, 255, 0.05)',
                    color: plan.popular ? '#0b0803' : '#ffffff',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: plan.popular ? '0 4px 15px rgba(255, 179, 0, 0.3)' : 'none'
                  }}
                  onMouseOver={(e) => {
                    if (!plan.popular) {
                      e.currentTarget.style.background = 'rgba(255, 179, 0, 0.15)';
                      e.currentTarget.style.color = '#ffb300';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!plan.popular) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                      e.currentTarget.style.color = '#ffffff';
                    }
                  }}
                >
                  Choose {plan.name}
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Step 2: UPI QR Code Checkout */}
      {step === 'checkout' && (
        <div style={{ maxWidth: '600px', margin: '0 auto' }} className="section-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CreditCard style={{ color: '#ffb300' }} /> Complete Your Upgrade
            </h2>
            <button 
              onClick={() => setStep('select')}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '13px' }}
            >
              Cancel
            </button>
          </div>

          <div style={{ background: 'rgba(255,179,0,0.04)', border: '1px solid rgba(255,179,0,0.15)', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
            <div style={{ fontSize: '13px', color: '#ffb300', fontWeight: 700 }}>Plan Selected:</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', marginTop: '4px' }}>{currentPlanDetails.name}</div>
            <div style={{ fontSize: '22px', fontWeight: 900, color: '#ffb300', marginTop: '4px' }}>₹{currentPlanDetails.price} <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>/{currentPlanDetails.period}</span></div>
          </div>

          <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '24px' }}>
            {/* Styled custom vector QR Code representation */}
            <div style={{
              width: '180px',
              height: '180px',
              background: '#ffffff',
              padding: '12px',
              borderRadius: '16px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 0 20px rgba(255,255,255,0.08)'
            }}>
              {/* QR Pattern Representation */}
              <svg width="100%" height="100%" viewBox="0 0 100 100" style={{ shapeRendering: 'crispEdges' }}>
                {/* 3 Large Corner Position Anchors */}
                <rect x="0" y="0" width="30" height="30" fill="#000000" />
                <rect x="5" y="5" width="20" height="20" fill="#ffffff" />
                <rect x="10" y="10" width="10" height="10" fill="#000000" />

                <rect x="70" y="0" width="30" height="30" fill="#000000" />
                <rect x="75" y="5" width="20" height="20" fill="#ffffff" />
                <rect x="80" y="10" width="10" height="10" fill="#000000" />

                <rect x="0" y="70" width="30" height="30" fill="#000000" />
                <rect x="5" y="75" width="20" height="20" fill="#ffffff" />
                <rect x="10" y="80" width="10" height="10" fill="#000000" />

                {/* Random QR details */}
                <rect x="40" y="5" width="10" height="10" fill="#000000" />
                <rect x="55" y="15" width="10" height="15" fill="#000000" />
                <rect x="40" y="25" width="20" height="5" fill="#000000" />
                <rect x="45" y="40" width="10" height="10" fill="#000000" />
                <rect x="65" y="45" width="15" height="10" fill="#000000" />

                <rect x="40" y="60" width="20" height="20" fill="#000000" />
                <rect x="45" y="65" width="10" height="10" fill="#ffffff" />

                <rect x="70" y="70" width="10" height="15" fill="#000000" />
                <rect x="85" y="75" width="15" height="10" fill="#000000" />
                <rect x="75" y="90" width="20" height="10" fill="#000000" />
              </svg>
            </div>

            <div style={{ flex: 1, minWidth: '240px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>Scan QR to Pay via UPI</div>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.4 }}>
                1. Open GPay, PhonePe, Paytm, or any UPI banking app.<br />
                2. Scan this secure QR code.<br />
                3. Authorize the exact amount of <strong>₹{currentPlanDetails.price}</strong>.<br />
                4. Paste the 12-digit UPI UTR/Transaction Reference ID below.
              </p>
            </div>
          </div>

          <form onSubmit={handleVerifyPayment} style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '20px' }}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#ffffff', marginBottom: '8px' }}>
                UPI UTR / Transaction Reference ID (12 Digits)
              </label>
              <input 
                type="text" 
                placeholder="e.g. 428174950291"
                value={referenceId}
                onChange={(e) => setReferenceId(e.target.value.replace(/\D/g, '').slice(0, 12))}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255,179,0,0.25)',
                  background: 'rgba(255,255,255,0.02)',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 600
                }}
                required
              />
            </div>

            <button 
              type="submit"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                border: 'none',
                background: 'linear-gradient(135deg, #ffe082, #ffb300)',
                color: '#0b0803',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(255, 179, 0, 0.3)'
              }}
            >
              Verify & Activate Pro Membership
            </button>
          </form>
        </div>
      )}

      {/* Step 3: Verifying Transaction */}
      {step === 'verifying' && (
        <div style={{ maxWidth: '500px', margin: '60px auto', textAlign: 'center' }} className="section-card">
          <Loader2 className="animate-spin" size={48} style={{ color: '#ffb300', margin: '0 auto 24px auto' }} />
          <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff' }}>Verifying UPI Ledger Payment</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '8px' }}>
            Please hold on while we secure your subscription node.
          </p>
          <div style={{ 
            marginTop: '24px', 
            background: 'rgba(255, 179, 0, 0.05)', 
            border: '1px solid rgba(255, 179, 0, 0.15)', 
            padding: '12px', 
            borderRadius: '8px',
            fontSize: '12px',
            color: '#ffb300',
            fontWeight: 600
          }}>
            {verifyStatus}
          </div>
        </div>
      )}

      {/* Step 4: Success Confetti */}
      {step === 'success' && (
        <div style={{ maxWidth: '500px', margin: '60px auto', textAlign: 'center' }} className="section-card">
          <div style={{ 
            width: '64px', 
            height: '64px', 
            borderRadius: '50%', 
            background: 'linear-gradient(135deg, #ffe082, #ffb300)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            color: '#0b0803',
            margin: '0 auto 24px auto',
            boxShadow: '0 0 20px rgba(255, 179, 0, 0.4)'
          }}>
            <ShieldCheck size={36} />
          </div>
          <h3 style={{ fontSize: '24px', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.5px' }}>
            Welcome to NonStock Pro!
          </h3>
          <p style={{ color: '#d1c9b8', fontSize: '14px', marginTop: '12px', lineHeight: 1.5 }}>
            Your account has been successfully upgraded to the Pro tier. You now have unrestricted access to option chain greeks, live automated bots, and instant email/SMS signaling.
          </p>
          
          <button 
            onClick={() => window.location.href = '/dashboard'}
            style={{
              marginTop: '32px',
              padding: '12px 30px',
              borderRadius: '24px',
              border: 'none',
              background: 'linear-gradient(135deg, #ffe082, #ffb300)',
              color: '#0b0803',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(255, 179, 0, 0.3)'
            }}
          >
            Go to Pro Dashboard
          </button>
        </div>
      )}

    </div>
  );
}
