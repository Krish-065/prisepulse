import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType } from 'lightweight-charts';

export default function AdvancedChart({ 
  symbol = 'RELIANCE.NS',
  onPriceUpdate = () => {},
  colors: {
    backgroundColor = 'transparent',
    lineColor = '#10b981',
    textColor = '#64748b',
    areaTopColor = 'rgba(16, 185, 129, 0.4)',
    areaBottomColor = 'rgba(16, 185, 129, 0.0)',
  } = {} 
}) {
  const chartContainerRef = useRef();
  const [isLive, setIsLive] = useState(true);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Determine if we are in dark mode to adjust colors
    const isDark = document.documentElement.classList.contains('dark');
    const adjustedTextColor = isDark ? '#94a3b8' : textColor;
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: backgroundColor },
        textColor: adjustedTextColor,
      },
      grid: {
        vertLines: { color: gridColor },
        horzLines: { color: gridColor },
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
      timeScale: {
        timeVisible: true,
        secondsVisible: true,
      },
      rightPriceScale: {
        borderVisible: false,
      },
    });

    // Create Area Series
    const newSeries = chart.addAreaSeries({
      lineColor,
      topColor: areaTopColor,
      bottomColor: areaBottomColor,
      lineWidth: 2,
    });

    // 1. Generate Historical Mock Data (last 30 minutes)
    const chartData = [];
    let currentPrice = 2800 + Math.random() * 100;
    const now = new Date();
    
    // Start 30 minutes ago, add a data point every 5 seconds
    const startTime = Math.floor(now.getTime() / 1000) - (30 * 60);
    
    for (let t = startTime; t < Math.floor(now.getTime() / 1000); t += 5) {
      currentPrice += (Math.random() - 0.48) * 2; // slight upward bias
      chartData.push({
        time: t,
        value: Number(currentPrice.toFixed(2))
      });
    }
    
    newSeries.setData(chartData);
    onPriceUpdate(currentPrice);

    // 2. Start Live Data Simulation Engine
    let simulationInterval;
    if (isLive) {
      simulationInterval = setInterval(() => {
        const lastTime = chartData[chartData.length - 1].time;
        const newTime = lastTime + 1; // 1 second ticks
        
        // Random walk for price
        const change = (Math.random() - 0.5) * 1.5;
        currentPrice = currentPrice + change;
        
        const tick = {
          time: newTime,
          value: Number(currentPrice.toFixed(2))
        };
        
        chartData.push(tick);
        newSeries.update(tick);
        onPriceUpdate(currentPrice);
      }, 1000); // Update every second
    }

    const handleResize = () => {
      chart.applyOptions({ width: chartContainerRef.current.clientWidth });
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (simulationInterval) clearInterval(simulationInterval);
      chart.remove();
    };
  }, [backgroundColor, lineColor, textColor, areaTopColor, areaBottomColor, isLive, symbol]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="w-full relative rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <h3 className="font-bold text-xl text-foreground">Live Market Data</h3>
          {isLive && (
            <span className="flex items-center text-xs font-bold text-red-500 bg-red-500/10 px-2 py-1 rounded-full animate-pulse">
              <span className="w-2 h-2 rounded-full bg-red-500 mr-1.5"></span> LIVE
            </span>
          )}
        </div>
        <div className="flex gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
          {['1D', '1W', '1M', '1Y', 'ALL'].map((tf) => (
            <button key={tf} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${tf === '1D' ? 'bg-white dark:bg-gray-700 text-foreground shadow-sm' : 'text-gray-500 hover:text-foreground'}`}>
              {tf}
            </button>
          ))}
        </div>
      </div>
      <div ref={chartContainerRef} className="w-full h-[400px]" />
    </div>
  );
}
