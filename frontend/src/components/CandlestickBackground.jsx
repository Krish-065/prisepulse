export default function CandlestickBackground() {
  return (
    <div className="candlestick-bg">
      <style>{`
        .candlestick-bg {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 0;
          opacity: 0.08;
          background-image: 
            repeating-linear-gradient(90deg, 
              #00ff88 0px, #00ff88 2px, 
              transparent 2px, transparent 8px,
              #ff4444 8px, #ff4444 10px,
              transparent 10px, transparent 30px
            ),
            repeating-linear-gradient(0deg,
              transparent 0px, transparent 20px,
              #00ff88 20px, #00ff88 22px,
              transparent 22px, transparent 50px
            );
          background-size: 40px 100px;
          background-repeat: repeat;
          animation: candleMove 30s linear infinite;
        }
        
        @keyframes candleMove {
          0% { background-position: 0 0; }
          100% { background-position: 200px 0; }
        }
      `}</style>
    </div>
  );
}