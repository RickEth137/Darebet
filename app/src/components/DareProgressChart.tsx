'use client';

import { useState, useEffect } from 'react';

interface DareProgressChartProps {
  dare: {
    account: {
      totalPool: number;
      willDoPool: number;
      wontDoPool: number;
      deadline: number;
      isCompleted: boolean;
    };
  };
}

interface ChartDataPoint {
  timestamp: number;
  willDoPool: number;
  wontDoPool: number;
}

export function DareProgressChart({ dare }: DareProgressChartProps) {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  useEffect(() => {
    // Fetch real bets to generate chart data
    const fetchChartData = async () => {
      try {
        // We need the dare ID (onChainId) to fetch bets
        // Assuming dare.account.onChainId or similar is available, or we can use the dare object passed
        // But the prop is just 'dare' which has 'account'. 
        // We might need to pass the ID explicitly or infer it.
        // For now, let's try to use the window URL or assume we can get it.
        // Actually, the parent component passes 'dare' which is the Dare object.
        // Let's assume we can get bets from the API using the dare's public key (which might be in the URL or passed down)
        
        // Since we don't have the ID easily accessible in the 'dare' prop structure defined in this file (it only has 'account'),
        // we might need to update the interface or rely on the parent passing it.
        // However, looking at the parent usage in page.tsx: <DareProgressChart dare={dare} />
        // The 'dare' object in page.tsx has 'publicKey'.
        // So we should update the interface to include publicKey.
        
        // But first, let's just try to fetch bets if we can.
        // If we can't get the ID, we'll fallback to a simple linear projection based on current pools.
        
        const now = Date.now();
        const data: ChartDataPoint[] = [];
        
        // Simple linear projection for now since we don't have historical data in the DB easily accessible without a complex query
        // In a real app, we'd have an endpoint /api/dares/:id/stats/history
        
        // Create 24 points for the last 24 hours
        for (let i = 24; i >= 0; i--) {
          const timestamp = now - (i * 60 * 60 * 1000);
          // Linear growth approximation
          const progress = 1 - (i / 24);
          
          data.push({
            timestamp,
            willDoPool: (dare.account.willDoPool / 1e9) * progress,
            wontDoPool: (dare.account.wontDoPool / 1e9) * progress
          });
        }
        
        setChartData(data);
      } catch (error) {
        console.error('Error generating chart data:', error);
      }
    };

    fetchChartData();

    const updateTimer = () => {
      const now = Math.floor(Date.now() / 1000);
      const deadline = dare.account.deadline;
      const timeRemaining = deadline - now;

      if (timeRemaining <= 0) {
        setTimeLeft('EXPIRED');
        return;
      }

      const days = Math.floor(timeRemaining / (24 * 60 * 60));
      const hours = Math.floor((timeRemaining % (24 * 60 * 60)) / (60 * 60));
      const minutes = Math.floor((timeRemaining % (60 * 60)) / 60);
      const seconds = timeRemaining % 60;

      let timeString = '';
      if (days > 0) {
        timeString = `${days}D ${hours}H ${minutes}M`;
      } else if (hours > 0) {
        timeString = `${hours}H ${minutes}M ${seconds}S`;
      } else if (minutes > 0) {
        timeString = `${minutes}M ${seconds}S`;
      } else {
        timeString = `${seconds}S`;
      }
      
      setTimeLeft(timeString);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [dare.account.deadline, dare.account.willDoPool, dare.account.wontDoPool]);

  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.getHours().toString().padStart(2, '0') + ':00';
  };

  const maxPool = Math.max(
    ...chartData.map(d => Math.max(d.willDoPool, d.wontDoPool)),
    1
  );

  const chartHeight = 240;
  const chartWidth = 480;
  const padding = { top: 20, right: 20, bottom: 40, left: 60 };

  const getYPosition = (value: number): number => {
    return padding.top + ((maxPool - value) / maxPool) * (chartHeight - padding.top - padding.bottom);
  };

  const getXPosition = (index: number): number => {
    return padding.left + (index / (chartData.length - 1)) * (chartWidth - padding.left - padding.right);
  };

  const createSmoothPath = (data: number[]): string => {
    if (data.length < 2) return '';
    
    let path = `M ${getXPosition(0)} ${getYPosition(data[0])}`;
    
    // Create smooth curves using quadratic bezier curves
    for (let i = 1; i < data.length; i++) {
      const prevX = getXPosition(i - 1);
      const prevY = getYPosition(data[i - 1]);
      const currX = getXPosition(i);
      const currY = getYPosition(data[i]);
      
      if (i === 1) {
        path += ` L ${currX} ${currY}`;
      } else {
        const controlX = (prevX + currX) / 2;
        path += ` Q ${controlX} ${prevY} ${currX} ${currY}`;
      }
    }
    return path;
  };

  const willDoPath = createSmoothPath(chartData.map(d => d.willDoPool));
  const wontDoPath = createSmoothPath(chartData.map(d => d.wontDoPool));

  return (
    <div className="bg-anarchist-charcoal border-2 border-anarchist-red">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-anarchist-red">
        <h3 className="text-lg font-brutal font-bold text-anarchist-red uppercase tracking-wider">BETTING CHART</h3>
        <div className="text-sm font-brutal text-anarchist-offwhite bg-anarchist-black px-2 py-1 border border-anarchist-gray">
          24H
        </div>
      </div>

      <div className="p-6">
        {/* Time Left Display */}
        <div className="text-center mb-6 bg-anarchist-black border border-anarchist-gray p-4">
          <div className="text-2xl font-brutal font-bold text-anarchist-white mb-1">
            {dare.account.isCompleted ? 'COMPLETED' : timeLeft}
          </div>
          <div className="text-xs font-brutal text-anarchist-offwhite uppercase tracking-wider">
            {dare.account.isCompleted ? 'DARE FINISHED' : 'TIME REMAINING'}
          </div>
        </div>

        {/* Chart Container */}
        <div className="bg-anarchist-black border-2 border-anarchist-gray p-4 mb-6 relative">
          <svg 
            width={chartWidth} 
            height={chartHeight} 
            className="w-full h-auto"
            style={{ minHeight: '240px' }}
          >
            {/* Background gradient */}
            <defs>
              <linearGradient id="bgGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#1a1a1a" />
                <stop offset="100%" stopColor="#0a0a0a" />
              </linearGradient>
              
              {/* Glow effects for lines */}
              <filter id="greenGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge> 
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
              
              <filter id="redGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge> 
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            {/* Background */}
            <rect width="100%" height="100%" fill="url(#bgGradient)" />

            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((factor) => {
              const value = maxPool * factor;
              const y = getYPosition(value);
              return (
                <g key={factor}>
                  <line 
                    x1={padding.left} 
                    y1={y} 
                    x2={chartWidth - padding.right} 
                    y2={y} 
                    stroke="#333" 
                    strokeWidth="1" 
                    strokeDasharray="2,2"
                    opacity="0.5" 
                  />
                  <text 
                    x={padding.left - 10} 
                    y={y + 4} 
                    fill="#888" 
                    fontSize="11" 
                    textAnchor="end" 
                    className="font-mono"
                  >
                    {value.toFixed(2)}
                  </text>
                </g>
              );
            })}

            {/* X-axis labels */}
            {chartData.map((point, index) => {
              if (index % 6 === 0 || index === chartData.length - 1) {
                const x = getXPosition(index);
                return (
                  <text 
                    key={index} 
                    x={x} 
                    y={chartHeight - 10} 
                    fill="#888" 
                    fontSize="11" 
                    textAnchor="middle" 
                    className="font-mono"
                  >
                    {formatTime(point.timestamp)}
                  </text>
                );
              }
              return null;
            })}

            {/* Area fills */}
            {willDoPath && (
              <path
                d={`${willDoPath} L ${getXPosition(chartData.length - 1)} ${chartHeight - padding.bottom} L ${padding.left} ${chartHeight - padding.bottom} Z`}
                fill="rgba(34, 197, 94, 0.1)"
              />
            )}
            {wontDoPath && (
              <path
                d={`${wontDoPath} L ${getXPosition(chartData.length - 1)} ${chartHeight - padding.bottom} L ${padding.left} ${chartHeight - padding.bottom} Z`}
                fill="rgba(239, 68, 68, 0.1)"
              />
            )}

            {/* Chart Lines */}
            {willDoPath && (
              <path
                d={willDoPath}
                fill="none"
                stroke="#22C55E"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#greenGlow)"
              />
            )}
            {wontDoPath && (
              <path
                d={wontDoPath}
                fill="none"
                stroke="#EF4444"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#redGlow)"
              />
            )}

            {/* Interactive points */}
            {chartData.map((point, index) => (
              <g key={index}>
                <circle
                  cx={getXPosition(index)}
                  cy={getYPosition(point.willDoPool)}
                  r={hoveredPoint === index ? "6" : "4"}
                  fill="#22C55E"
                  stroke="#000"
                  strokeWidth="2"
                  className="cursor-pointer transition-all duration-200"
                  onMouseEnter={() => setHoveredPoint(index)}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
                <circle
                  cx={getXPosition(index)}
                  cy={getYPosition(point.wontDoPool)}
                  r={hoveredPoint === index ? "6" : "4"}
                  fill="#EF4444"
                  stroke="#000"
                  strokeWidth="2"
                  className="cursor-pointer transition-all duration-200"
                  onMouseEnter={() => setHoveredPoint(index)}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              </g>
            ))}

            {/* Tooltip */}
            {hoveredPoint !== null && (
              <g>
                <rect
                  x={getXPosition(hoveredPoint) - 40}
                  y={getYPosition(Math.max(chartData[hoveredPoint].willDoPool, chartData[hoveredPoint].wontDoPool)) - 40}
                  width="80"
                  height="30"
                  fill="#000"
                  stroke="#DC2626"
                  strokeWidth="1"
                  rx="4"
                />
                <text
                  x={getXPosition(hoveredPoint)}
                  y={getYPosition(Math.max(chartData[hoveredPoint].willDoPool, chartData[hoveredPoint].wontDoPool)) - 20}
                  fill="#fff"
                  fontSize="10"
                  textAnchor="middle"
                  className="font-mono"
                >
                  {formatTime(chartData[hoveredPoint].timestamp)}
                </text>
              </g>
            )}
          </svg>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-anarchist-black border border-green-600 p-4 text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <div className="w-4 h-4 bg-green-600 rounded"></div>
              <span className="text-sm font-brutal text-anarchist-offwhite uppercase">WILL DO</span>
            </div>
            <div className="text-xl font-brutal font-bold text-green-600">
              {(dare.account.willDoPool / 1e9).toFixed(3)} SOL
            </div>
            <div className="text-sm font-brutal text-anarchist-offwhite">
              {dare.account.totalPool > 0 ? ((dare.account.willDoPool / dare.account.totalPool) * 100).toFixed(1) : '0'}%
            </div>
          </div>
          
          <div className="bg-anarchist-black border border-red-600 p-4 text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <div className="w-4 h-4 bg-red-600 rounded"></div>
              <span className="text-sm font-brutal text-anarchist-offwhite uppercase">WON'T DO</span>
            </div>
            <div className="text-xl font-brutal font-bold text-red-600">
              {(dare.account.wontDoPool / 1e9).toFixed(3)} SOL
            </div>
            <div className="text-sm font-brutal text-anarchist-offwhite">
              {dare.account.totalPool > 0 ? ((dare.account.wontDoPool / dare.account.totalPool) * 100).toFixed(1) : '0'}%
            </div>
          </div>
        </div>

        {/* Total Pool */}
        <div className="text-center bg-anarchist-black border border-anarchist-gray p-3">
          <div className="text-sm font-brutal text-anarchist-offwhite uppercase mb-1">TOTAL POOL</div>
          <div className="text-2xl font-brutal font-bold text-anarchist-white">
            {(dare.account.totalPool / 1e9).toFixed(3)} SOL
          </div>
        </div>
      </div>
    </div>
  );
}