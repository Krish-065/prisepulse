import React, { useEffect, useState, useRef } from 'react';

export default function BubbleCursor() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [clicked, setClicked] = useState(false);
  const [hidden, setHidden] = useState(true);
  
  // Ref to track actual mouse coordinate target
  const mouseRef = useRef({ x: 0, y: 0 });
  // Ref to track trailing bubble coordinates
  const trailRef = useRef({ x: 0, y: 0 });
  const bubbleRef = useRef(null);
  const dotRef = useRef(null);

  useEffect(() => {
    // Disable custom cursor on touch/mobile devices
    if (window.matchMedia('(max-width: 1024px)').matches || ('ontouchstart' in window)) {
      return;
    }

    setHidden(false);

    const handleMouseMove = (e) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
      
      // Instantly position the small inner dot
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      }
    };

    const handleMouseLeave = () => setHidden(true);
    const handleMouseEnter = () => setHidden(false);
    
    const handleMouseDown = () => setClicked(true);
    const handleMouseUp = () => setClicked(false);

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    // Animation loop for the trailing outer bubble (interpolation)
    let animationFrameId;
    
    const updateTrail = () => {
      const targetX = mouseRef.current.x;
      const targetY = mouseRef.current.y;
      
      // Interpolate coordinates: trail_pos += (target - trail_pos) * speed
      trailRef.current.x += (targetX - trailRef.current.x) * 0.12;
      trailRef.current.y += (targetY - trailRef.current.y) * 0.12;
      
      if (bubbleRef.current) {
        bubbleRef.current.style.transform = `translate3d(${trailRef.current.x}px, ${trailRef.current.y}px, 0)`;
      }
      
      animationFrameId = requestAnimationFrame(updateTrail);
    };

    animationFrameId = requestAnimationFrame(updateTrail);

    // Inject styles to hide default cursor in global body
    const styleElement = document.createElement('style');
    styleElement.innerHTML = `
      body, a, button, input, select, textarea, [role="button"] {
        cursor: none !important;
      }
    `;
    document.head.appendChild(styleElement);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      cancelAnimationFrame(animationFrameId);
      if (styleElement.parentNode) {
        styleElement.parentNode.removeChild(styleElement);
      }
    };
  }, []);

  if (hidden) return null;

  return (
    <>
      {/* Trailing Outer Bubble */}
      <div 
        ref={bubbleRef} 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: clicked ? '48px' : '36px',
          height: clicked ? '48px' : '36px',
          borderRadius: '50%',
          border: '2px solid rgba(0, 240, 255, 0.6)',
          background: clicked ? 'rgba(0, 255, 136, 0.15)' : 'rgba(0, 240, 255, 0.05)',
          boxShadow: clicked 
            ? '0 0 20px rgba(0, 255, 136, 0.5), inset 0 0 10px rgba(0, 255, 136, 0.3)' 
            : '0 0 12px rgba(0, 240, 255, 0.3)',
          pointerEvents: 'none',
          zIndex: 99999,
          transform: 'translate3d(-50%, -50%, 0)',
          marginTop: clicked ? '-24px' : '-18px',
          marginLeft: clicked ? '-24px' : '-18px',
          transition: 'width 0.2s ease, height 0.2s ease, background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
          willChange: 'transform'
        }}
      />
      
      {/* Sharp Inner Glow Dot */}
      <div 
        ref={dotRef} 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: '#00ff88',
          boxShadow: '0 0 8px #00ff88',
          pointerEvents: 'none',
          zIndex: 999999,
          transform: 'translate3d(-50%, -50%, 0)',
          marginTop: '-4px',
          marginLeft: '-4px',
          willChange: 'transform'
        }}
      />
    </>
  );
}
