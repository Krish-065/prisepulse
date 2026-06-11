import { useEffect, useRef } from 'react';

export default function Markets() {
  const container = useRef();

  useEffect(() => {
    // Clear container to prevent duplicate widgets on re-renders
    if (container.current) {
      container.current.innerHTML = '';
    }

    const script = document.createElement("script");
    script.src = "https://s.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = `
      {
        "autosize": true,
        "symbol": "BSE:SENSEX",
        "interval": "D",
        "timezone": "Asia/Kolkata",
        "theme": "dark",
        "style": "1",
        "locale": "in",
        "enable_publishing": false,
        "backgroundColor": "#131722",
        "gridColor": "#1f293d",
        "hide_top_toolbar": false,
        "hide_legend": false,
        "save_image": false,
        "container_id": "tradingview_widget",
        "toolbar_bg": "#f1f3f6",
        "studies": [
          "Volume@tv-basicstudies"
        ],
        "details": true,
        "hotlist": true,
        "calendar": false
      }`;
    
    if (container.current) {
      container.current.appendChild(script);
    }
  }, []);

  return (
    <div style={{ paddingBottom: '40px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: 0, backgroundImage: 'linear-gradient(135deg, #00ff88, #00bcd4)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent', color: 'transparent' }}>Live Market Charting</h1>
          <p style={{ color: '#9b9eac', margin: '4px 0 0 0', fontSize: '14px' }}>Advanced charting with full indicator support for all Indian stocks</p>
        </div>
      </div>
      
      <div style={{ background: '#131722', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.05)', height: '700px', width: '100%', overflow: 'hidden' }}>
        <div id="tradingview_widget" className="tradingview-widget-container" ref={container} style={{ height: '100%', width: '100%' }}>
          <div className="tradingview-widget-container__widget" style={{ height: 'calc(100% - 32px)', width: '100%' }}></div>
        </div>
      </div>
    </div>
  );
}