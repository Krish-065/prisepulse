export default function CandlestickBackground() {
  return (
    <>
      {/* Main Candlestick Pattern Layer */}
      <div className="candlestick-main"></div>
      
      {/* Secondary Layer - More Candles */}
      <div className="candlestick-secondary"></div>
      
      {/* Chart Grid Lines */}
      <div className="chart-grid"></div>
      
      {/* Moving Average Lines Effect */}
      <div className="moving-average-lines"></div>

      <style>{`
        /* ============================================
           PROMINENT CANDLESTICK BACKGROUND FOR ALL PAGES
           ============================================ */
        
        /* Base container for all backgrounds */
        .candlestick-main,
        .candlestick-secondary,
        .chart-grid,
        .moving-average-lines {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 0;
        }
        
        /* ===== LAYER 1: Large Candlestick Pattern ===== */
        .candlestick-main {
          opacity: 0.15;
          background-image: 
            /* Green Candle 1 */
            linear-gradient(90deg, #00ff88 0%, #00ff88 100%),
            /* Green Candle Wick */
            linear-gradient(90deg, #00ff88 0%, #00ff88 100%),
            /* Red Candle 1 */
            linear-gradient(90deg, #ff4444 0%, #ff4444 100%),
            /* Red Candle Wick */
            linear-gradient(90deg, #ff4444 0%, #ff4444 100%),
            /* Green Candle 2 */
            linear-gradient(90deg, #00ff88 0%, #00ff88 100%),
            /* Red Candle 2 */
            linear-gradient(90deg, #ff4444 0%, #ff4444 100%),
            /* Green Candle 3 */
            linear-gradient(90deg, #00ff88 0%, #00ff88 100%),
            /* Red Candle 3 */
            linear-gradient(90deg, #ff4444 0%, #ff4444 100%);
          
          background-repeat: no-repeat;
          background-size: 
            12px 60px, 2px 80px,
            12px 50px, 2px 70px,
            10px 45px,
            10px 55px,
            14px 65px,
            14px 55px;
          background-position: 
            15% 30%, 20.5% 25%,
            35% 45%, 40.5% 40%,
            55% 25%,
            70% 60%,
            85% 35%,
            92% 50%;
          animation: candleFloat 20s ease-in-out infinite;
        }
        
        /* ===== LAYER 2: Scattered Small Candles ===== */
        .candlestick-secondary {
          opacity: 0.12;
          background-image: 
            radial-gradient(circle at 20% 70%, #00ff88 2px, transparent 2px),
            radial-gradient(circle at 30% 40%, #ff4444 2px, transparent 2px),
            radial-gradient(circle at 45% 80%, #00bcd4 2px, transparent 2px),
            radial-gradient(circle at 60% 20%, #ff6666 2px, transparent 2px),
            radial-gradient(circle at 75% 60%, #00ff88 2px, transparent 2px),
            radial-gradient(circle at 88% 30%, #ff4444 2px, transparent 2px),
            radial-gradient(circle at 95% 75%, #00ff88 2px, transparent 2px),
            radial-gradient(circle at 10% 45%, #ff4444 2px, transparent 2px);
          background-size: 30px 30px, 25px 25px, 35px 35px, 20px 20px, 28px 28px, 32px 32px, 22px 22px, 26px 26px;
          background-repeat: repeat;
          animation: candleFloatReverse 25s ease-in-out infinite;
        }
        
        /* ===== LAYER 3: Chart Grid Lines ===== */
        .chart-grid {
          opacity: 0.08;
          background-image: 
            linear-gradient(0deg, #00ff88 1px, transparent 1px),
            linear-gradient(90deg, #00ff88 1px, transparent 1px);
          background-size: 50px 50px;
          animation: gridPulse 4s ease-in-out infinite;
        }
        
        /* ===== LAYER 4: Moving Average Lines ===== */
        .moving-average-lines {
          opacity: 0.06;
          background-image: 
            linear-gradient(45deg, transparent 30%, #00bcd4 30%, #00bcd4 35%, transparent 35%),
            linear-gradient(135deg, transparent 40%, #ff4444 40%, #ff4444 45%, transparent 45%),
            linear-gradient(60deg, transparent 50%, #00ff88 50%, #00ff88 55%, transparent 55%);
          background-size: 200px 200px, 180px 180px, 220px 220px;
          background-repeat: repeat;
          background-position: 0 0, 100px 50px, 50px 100px;
          animation: maMove 30s linear infinite;
        }
        
        /* ===== Additional Solid Candlesticks ===== */
        .candlestick-main::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-image: 
            /* Doji candlestick */
            linear-gradient(0deg, #ffaa44 0%, #ffaa44 2px, transparent 2px, transparent 6px, #ffaa44 6px, #ffaa44 8px, transparent 8px),
            /* Hammer candlestick */
            linear-gradient(0deg, #00ff88 0%, #00ff88 3px, transparent 3px, transparent 10px, #00ff88 10px, #00ff88 13px, transparent 13px),
            /* Shooting star */
            linear-gradient(0deg, #ff4444 0%, #ff4444 2px, transparent 2px, transparent 8px, #ff4444 8px, #ff4444 10px, transparent 10px);
          background-repeat: repeat;
          background-size: 20px 40px, 25px 50px, 18px 38px;
          background-position: 25% 35%, 65% 55%, 85% 25%;
          opacity: 0.5;
        }
        
        /* ===== Animations ===== */
        @keyframes candleFloat {
          0%, 100% {
            transform: translateY(0) scale(1);
            opacity: 0.15;
          }
          50% {
            transform: translateY(-20px) scale(1.05);
            opacity: 0.22;
          }
        }
        
        @keyframes candleFloatReverse {
          0%, 100% {
            transform: translateY(0) scale(1);
            opacity: 0.12;
          }
          50% {
            transform: translateY(20px) scale(0.95);
            opacity: 0.18;
          }
        }
        
        @keyframes gridPulse {
          0%, 100% {
            opacity: 0.06;
          }
          50% {
            opacity: 0.12;
          }
        }
        
        @keyframes maMove {
          0% {
            background-position: 0 0, 100px 50px, 50px 100px;
          }
          100% {
            background-position: 200px 200px, 300px 250px, 250px 300px;
          }
        }
        
        /* Ensure content appears above background */
        .layout, .landing-container, .login-container, .register-container, 
        .dashboard-main, .forgot-container, .reset-container {
          position: relative;
          z-index: 1;
        }
      `}</style>
    </>
  );
}