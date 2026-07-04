import React from 'react';

export default function Logo({ size = 48, showName = true, showTagline = true, alignment = 'row', nameSize = '24px', glowColor = 'rgba(0, 188, 212, 0.4)' }) {
  const isRow = alignment === 'row';

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: isRow ? 'row' : 'column', 
      alignItems: 'center', 
      justifyContent: isRow ? 'flex-start' : 'center',
      gap: isRow ? '12px' : '10px',
      textAlign: isRow ? 'left' : 'center'
    }}>
      {/* SVG Neon Candlestick Logo */}
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        style={{ filter: `drop-shadow(0 0 8px ${glowColor})`, flexShrink: 0 }}
      >
        <defs>
          <filter id="neon-glow-green" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="neon-glow-cyan" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Left Green Candlestick (Wick & Body) */}
        <line 
          x1="32" 
          y1="14" 
          x2="32" 
          y2="86" 
          stroke="#00ff88" 
          strokeWidth="4.5" 
          strokeLinecap="round" 
          filter="url(#neon-glow-green)" 
        />
        <rect 
          x="23" 
          y="26" 
          width="18" 
          height="48" 
          rx="5" 
          fill="#00ff88" 
          filter="url(#neon-glow-green)" 
        />

        {/* Right Cyan Candlestick (Wick & Body) */}
        <line 
          x1="68" 
          y1="14" 
          x2="68" 
          y2="86" 
          stroke="#00f0ff" 
          strokeWidth="4.5" 
          strokeLinecap="round" 
          filter="url(#neon-glow-cyan)" 
        />
        <rect 
          x="59" 
          y="26" 
          width="18" 
          height="48" 
          rx="5" 
          fill="#00f0ff" 
          filter="url(#neon-glow-cyan)" 
        />

        {/* Diagonal Trendline Arrow */}
        <path 
          d="M16 75 L45 44 L55 52 L82 18" 
          stroke="#00f0ff" 
          strokeWidth="7" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          filter="url(#neon-glow-cyan)" 
        />
        
        {/* Glowing Arrowhead */}
        <path 
          d="M64 18 H82 V36" 
          stroke="#00f0ff" 
          strokeWidth="7" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          filter="url(#neon-glow-cyan)" 
        />
      </svg>

      {/* Name and Tagline Container */}
      {(showName || showTagline) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {showName && (
            <span style={{ 
              fontSize: nameSize, 
              fontWeight: 900, 
              background: 'linear-gradient(135deg, #00ff88 0%, #00f0ff 100%)', 
              WebkitBackgroundClip: 'text', 
              backgroundClip: 'text', 
              color: 'transparent',
              letterSpacing: '0.8px',
              lineHeight: '1.1',
              textShadow: '0 0 15px rgba(0, 240, 255, 0.2)'
            }}>
              NonStock
            </span>
          )}
          {showTagline && (
            <span style={{ 
              fontSize: '10px', 
              fontWeight: 800, 
              color: '#00ff88', 
              textTransform: 'uppercase', 
              letterSpacing: '1px',
              opacity: 0.95,
              textShadow: '0 0 8px rgba(0, 255, 136, 0.4)'
            }}>
              Be Nonstop with NonStock
            </span>
          )}
        </div>
      )}
    </div>
  );
}
