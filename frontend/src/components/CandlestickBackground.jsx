export default function CandlestickBackground() {
  return (
    <div className="candlestick-bg-layer">
      <div className="candlestick-main"></div>
      <div className="candlestick-secondary"></div>
      <div className="chart-grid"></div>
      <div className="moving-average-lines"></div>
      
      <style>{`
        .candlestick-bg-layer {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 0;
        }
        
        .candlestick-main {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          opacity: 0.15;
          background-image: 
            linear-gradient(90deg, #00ff88 0%, #00ff88 100%),
            linear-gradient(90deg, #00ff88 0%, #00ff88 100%),
            linear-gradient(90deg, #ff4444 0%, #ff4444 100%),
            linear-gradient(90deg, #ff4444 0%, #ff4444 100%),
            linear-gradient(90deg, #00ff88 0%, #00ff88 100%),
            linear-gradient(90deg, #ff4444 0%, #ff4444 100%);
          background-repeat: no-repeat;
          background-size: 12px 60px, 2px 80px, 12px 50px, 2px 70px, 10px 45px, 10px 55px;
          background-position: 15% 30%, 20.5% 25%, 35% 45%, 40.5% 40%, 55% 25%, 70% 60%;
          animation: candleFloat 20s ease-in-out infinite;
        }
        
        .candlestick-secondary {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          opacity: 0.1;
          background-image: 
            radial-gradient(circle at 20% 70%, #00ff88 2px, transparent 2px),
            radial-gradient(circle at 30% 40%, #ff4444 2px, transparent 2px),
            radial-gradient(circle at 45% 80%, #00bcd4 2px, transparent 2px),
            radial-gradient(circle at 60% 20%, #ff6666 2px, transparent 2px),
            radial-gradient(circle at 75% 60%, #00ff88 2px, transparent 2px),
            radial-gradient(circle at 88% 30%, #ff4444 2px, transparent 2px),
            radial-gradient(circle at 95% 75%, #00ff88 2px, transparent 2px),
            radial-gradient(circle at 10% 45%, #ff4444 2px, transparent 2px);
          background-repeat: repeat;
          background-size: 40px 40px, 35px 35px, 45px 45px, 30px 30px, 38px 38px, 42px 42px, 32px 32px, 36px 36px;
          animation: candleFloatReverse 25s ease-in-out infinite;
        }
        
        .chart-grid {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          opacity: 0.08;
          background-image: linear-gradient(0deg, #00ff88 1px, transparent 1px), linear-gradient(90deg, #00ff88 1px, transparent 1px);
          background-size: 50px 50px;
          animation: gridPulse 4s ease-in-out infinite;
        }
        
        .moving-average-lines {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          opacity: 0.05;
          background-image: linear-gradient(45deg, transparent 30%, #00bcd4 30%, #00bcd4 35%, transparent 35%), linear-gradient(135deg, transparent 40%, #ff4444 40%, #ff4444 45%, transparent 45%);
          background-size: 200px 200px, 180px 180px;
          background-repeat: repeat;
          animation: maMove 30s linear infinite;
        }
        
        @keyframes candleFloat {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.15; }
          50% { transform: translateY(-10px) scale(1.02); opacity: 0.22; }
        }
        
        @keyframes candleFloatReverse {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.1; }
          50% { transform: translateY(10px) scale(0.98); opacity: 0.15; }
        }
        
        @keyframes gridPulse {
          0%, 100% { opacity: 0.06; }
          50% { opacity: 0.12; }
        }
        
        @keyframes maMove {
          0% { background-position: 0 0, 100px 50px; }
          100% { background-position: 200px 200px, 300px 250px; }
        }
      `}</style>
    </div>
  );
}