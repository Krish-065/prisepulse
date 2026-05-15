import { useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';

export default function StockDetail() {
  const { symbol } = useParams();
  const containerRef = useRef(null);

  useEffect(() => {
    // Load TradingView widget script
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      new window.TradingView.widget({
        container_id: containerRef.current.id,
        symbol: `NSE:${symbol}`,
        interval: 'D',
        timezone: 'Asia/Kolkata',
        theme: 'dark',
        style: '1',
        locale: 'in',
        toolbar_bg: '#131722',
        enable_publishing: false,
        hide_top_toolbar: false,
        width: '100%',
        height: 500,
        studies: ['RSI@tv-basicstudies', 'MACD@tv-basicstudies']
      });
    };
    document.head.appendChild(script);
    return () => { document.head.removeChild(script); };
  }, [symbol]);

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-4">{symbol} Live Chart</h1>
        <div id="tradingview-chart" ref={containerRef} style={{ height: '500px' }}></div>
      </div>
    </div>
  );
}