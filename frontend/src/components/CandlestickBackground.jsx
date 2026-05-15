export default function CandlestickBackground() {
  return (
    <>
      <div className="candlestick-bg"></div>
      <div className="candlestick-grid"></div>
      
      {/* Floating candlestick chart lines */}
      <svg className="candlestick-svg-bg" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="candlestickPattern" x="0" y="0" width="100" height="150" patternUnits="userSpaceOnUse">
            {/* Green candle (bullish) */}
            <rect x="10" y="30" width="8" height="60" fill="#00ff88" opacity="0.3" />
            <rect x="13" y="20" width="2" height="80" fill="#00ff88" opacity="0.4" />
            {/* Red candle (bearish) */}
            <rect x="50" y="50" width="8" height="50" fill="#ff4444" opacity="0.3" />
            <rect x="53" y="60" width="2" height="70" fill="#ff4444" opacity="0.4" />
            {/* Green candle 2 */}
            <rect x="80" y="70" width="8" height="40" fill="#00ff88" opacity="0.2" />
            <rect x="83" y="65" width="2" height="50" fill="#00ff88" opacity="0.3" />
            {/* Volume bars */}
            <rect x="10" y="110" width="6" height="30" fill="#00ff88" opacity="0.1" />
            <rect x="50" y="115" width="6" height="25" fill="#ff4444" opacity="0.1" />
            <rect x="80" y="108" width="6" height="32" fill="#00ff88" opacity="0.1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#candlestickPattern)" />
      </svg>

      <style>{`
        .candlestick-bg {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: -3;
          pointer-events: none;
          overflow: hidden;
        }
        
        .candlestick-bg::before {
          content: '';
          position: absolute;
          width: 100%;
          height: 100%;
          background-image: 
            linear-gradient(0deg, transparent 20%, #00ff88 20%, #00ff88 40%, transparent 40%),
            linear-gradient(90deg, transparent 48%, #00ff88 48%, #00ff88 52%, transparent 52%),
            linear-gradient(0deg, transparent 30%, #ff4444 30%, #ff4444 50%, transparent 50%),
            linear-gradient(90deg, transparent 48%, #ff4444 48%, #ff4444 52%, transparent 52%);
          background-repeat: repeat;
          background-size: 60px 100px, 60px 100px, 80px 120px, 80px 120px;
          background-position: 10% 20%, 10% 20%, 60% 50%, 60% 50%;
          opacity: 0.08;
          animation: candleFade 8s ease-in-out infinite;
        }
        
        .candlestick-bg::after {
          content: '';
          position: absolute;
          width: 100%;
          height: 100%;
          background-image: 
            linear-gradient(0deg, transparent 25%, #00bcd4 25%, #00bcd4 35%, transparent 35%),
            linear-gradient(90deg, transparent 47%, #00bcd4 47%, #00bcd4 53%, transparent 53%),
            linear-gradient(0deg, transparent 35%, #ff6666 35%, #ff6666 45%, transparent 45%),
            linear-gradient(90deg, transparent 47%, #ff6666 47%, #ff6666 53%, transparent 53%);
          background-repeat: repeat;
          background-size: 40px 70px, 40px 70px, 50px 80px, 50px 80px;
          background-position: 85% 75%, 85% 75%, 25% 85%, 25% 85%;
          opacity: 0.06;
          animation: candleFadeReverse 12s ease-in-out infinite;
        }
        
        .candlestick-grid {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: -1;
          background-image: 
            linear-gradient(rgba(0, 255, 136, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 255, 136, 0.05) 1px, transparent 1px);
          background-size: 40px 40px;
          pointer-events: none;
        }
        
        .candlestick-svg-bg {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: -2;
          pointer-events: none;
          opacity: 0.04;
        }
        
        @keyframes candleFade {
          0%, 100% { opacity: 0.06; transform: scale(1); }
          50% { opacity: 0.12; transform: scale(1.05); }
        }
        
        @keyframes candleFadeReverse {
          0%, 100% { opacity: 0.04; transform: scale(1.05); }
          50% { opacity: 0.1; transform: scale(1); }
        }
      `}</style>
    </>
  );
}