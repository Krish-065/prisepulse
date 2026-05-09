import React, { useEffect, useRef } from 'react';
import { createChart, ColorType } from 'lightweight-charts';

export default function AdvancedChart({ 
  data, 
  colors: {
    backgroundColor = 'transparent',
    lineColor = '#10b981',
    textColor = '#64748b',
    areaTopColor = 'rgba(16, 185, 129, 0.4)',
    areaBottomColor = 'rgba(16, 185, 129, 0.0)',
  } = {} 
}) {
  const chartContainerRef = useRef();

  useEffect(() => {
    if (!chartContainerRef.current) return;
    
    const handleResize = () => {
      chart.applyOptions({ width: chartContainerRef.current.clientWidth });
    };

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
        secondsVisible: false,
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

    // Generate mock data if none provided
    const chartData = data || generateMockData();
    newSeries.setData(chartData);

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [data, backgroundColor, lineColor, textColor, areaTopColor, areaBottomColor]);

  return (
    <div className="w-full relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg text-foreground">Price Chart</h3>
        <div className="flex gap-2">
          {['1D', '1W', '1M', '1Y', 'ALL'].map((tf) => (
            <button key={tf} className="px-3 py-1 text-xs font-medium rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:bg-primary focus:text-white dark:focus:bg-primary">
              {tf}
            </button>
          ))}
        </div>
      </div>
      <div ref={chartContainerRef} className="w-full h-[400px]" />
    </div>
  );
}

function generateMockData() {
  const data = [];
  let price = 150;
  const now = new Date();
  
  for (let i = 100; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    price = price + (Math.random() - 0.45) * 5;
    data.push({
      time: time.toISOString().split('T')[0],
      value: Number(price.toFixed(2))
    });
  }
  return data;
}
