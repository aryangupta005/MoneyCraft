import React, { useEffect, useRef } from 'react';

interface Stock {
  id: string;
  name: string;
  currentPrice: number;
  priceHistory: number[];
  debtEquityRatio: number;
  businessGrowth: number;
  news: string[];
  marketCap: number;
  peRatio: number;
  eps: number;
  industryAvgPE: number;
  outstandingShares: number;
  volatility: number;
  lastUpdate: number;
}

interface StockGraphProps {
  stock: Stock;
  onClose: () => void;
}

const StockGraph: React.FC<StockGraphProps> = ({
  stock,
  onClose
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Calculate if the stock is considered an "Undervalued Gem"
  const isUndervalued = stock.peRatio <= stock.industryAvgPE * 1.1 && 
                        stock.eps > 30 && 
                        stock.debtEquityRatio < 1.0;
  
  // Format large numbers for display
  const formatLargeNumber = (num: number): string => {
    if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
    return num.toString();
  };
  
  // Get the appropriate color for PE ratio
  const getPERatioColor = () => {
    if (stock.peRatio < stock.industryAvgPE * 0.8) return 'text-green-400'; // Potentially undervalued
    if (stock.peRatio > stock.industryAvgPE * 1.2) return 'text-orange-400'; // Potentially overvalued
    return 'text-blue-300'; // Fair value
  };
  
  // Get the appropriate color for debt-equity ratio
  const getDebtEquityColor = () => {
    if (stock.debtEquityRatio < 0.8) return 'text-green-400'; // Low debt, safer
    if (stock.debtEquityRatio > 1.5) return 'text-orange-400'; // High debt, riskier
    return 'text-blue-300'; // Moderate debt
  };
  
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Get price history data
    const prices = [...stock.priceHistory];
    if (prices.length === 0) return;
    
    // Find min and max values
    const minPrice = Math.min(...prices) * 0.95;
    const maxPrice = Math.max(...prices) * 1.05;
    const priceRange = maxPrice - minPrice;
    
    // Graph dimensions
    const padding = 40;
    const graphWidth = canvas.width - padding * 2;
    const graphHeight = canvas.height - padding * 2;
    
    // Draw background
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw axes
    ctx.strokeStyle = '#6b7280';
    ctx.lineWidth = 1;
    ctx.beginPath();
    
    // X-axis
    ctx.moveTo(padding, canvas.height - padding);
    ctx.lineTo(canvas.width - padding, canvas.height - padding);
    
    // Y-axis
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, canvas.height - padding);
    ctx.stroke();
    
    // Draw grid lines
    ctx.strokeStyle = '#374151';
    ctx.beginPath();
    
    // Horizontal grid lines (5 lines)
    for (let i = 1; i <= 5; i++) {
      const y = padding + (graphHeight * i / 5);
      ctx.moveTo(padding, y);
      ctx.lineTo(canvas.width - padding, y);
    }
    
    // Vertical grid lines (based on data points)
    const totalPoints = prices.length;
    for (let i = 1; i < totalPoints; i++) {
      const x = padding + (graphWidth * i / (totalPoints - 1));
      ctx.moveTo(x, padding);
      ctx.lineTo(x, canvas.height - padding);
    }
    ctx.stroke();
    
    // Draw price labels
    ctx.fillStyle = '#d1d5db';
    ctx.font = '12px Arial';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    
    // Y-axis labels
    for (let i = 0; i <= 5; i++) {
      const price = minPrice + (priceRange * i / 5);
      const y = canvas.height - padding - (graphHeight * i / 5);
      ctx.fillText(`₹${Math.round(price).toLocaleString()}`, padding - 10, y);
    }
    
    // X-axis labels (show only a few dates for readability)
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    
    // Show dates at regular intervals
    const labelInterval = Math.max(1, Math.floor(totalPoints / 5));
    for (let i = 0; i < totalPoints; i += labelInterval) {
      const x = padding + (graphWidth * i / (totalPoints - 1));
      const daysAgo = totalPoints - i - 1;
      let label = daysAgo === 0 ? 'Today' : `${daysAgo}d ago`;
      ctx.fillText(label, x, canvas.height - padding + 10);
    }
    
    // Draw the price line
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    // Draw each data point
    prices.forEach((price, index) => {
      const x = padding + (graphWidth * index / (totalPoints - 1));
      const y = canvas.height - padding - ((price - minPrice) / priceRange * graphHeight);
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();
    
    // Draw points at each data point
    prices.forEach((price, index) => {
      const x = padding + (graphWidth * index / (totalPoints - 1));
      const y = canvas.height - padding - ((price - minPrice) / priceRange * graphHeight);
      
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw point outline
      ctx.strokeStyle = '#1f2937';
      ctx.lineWidth = 1;
      ctx.stroke();
    });
    
    // Add price change percentage label
    const firstPrice = prices[0];
    const lastPrice = prices[prices.length - 1];
    const changePercent = ((lastPrice - firstPrice) / firstPrice) * 100;
    
    ctx.font = '14px Arial';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    
    if (changePercent >= 0) {
      ctx.fillStyle = '#10b981'; // Green for positive change
      ctx.fillText(`+${changePercent.toFixed(2)}%`, canvas.width - padding, padding);
    } else {
      ctx.fillStyle = '#ef4444'; // Red for negative change
      ctx.fillText(`${changePercent.toFixed(2)}%`, canvas.width - padding, padding);
    }
  }, [stock]);

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[60]">
      <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>
      <div className="relative bg-gray-900 p-6 rounded-lg shadow-xl border border-blue-500 max-w-4xl w-full">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <h3 className="text-xl font-semibold text-blue-400 mb-4 flex items-center">
          {stock.name} - Detailed Analysis
          {isUndervalued && (
            <span className="ml-3 px-3 py-1 text-sm bg-green-600/30 text-green-400 rounded-md">
              Undervalued Gem
            </span>
          )}
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left column - Price chart */}
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-3">
              <div>
                <div className="text-gray-400">Current Price</div>
                <div className="text-2xl font-bold text-blue-300">₹{stock.currentPrice.toLocaleString()}</div>
              </div>
            </div>
            
            <div className="bg-gray-900 rounded-md p-3 mb-4">
              <canvas 
                ref={canvasRef} 
                width={600} 
                height={300}
                className="w-full h-auto"
              ></canvas>
            </div>
            
            <div className="text-sm text-gray-400">
              <p>This chart shows the stock price movement over the last {stock.priceHistory.length} days.</p>
              <p>Past performance is not indicative of future results.</p>
            </div>
          </div>
          
          {/* Right column - Financial metrics */}
          <div className="bg-gray-800 p-4 rounded-lg">
            <h4 className="text-lg font-medium text-blue-400 mb-4">Financial Metrics</h4>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-700/50 p-3 rounded-md">
                  <div className="text-gray-400 text-sm">Market Cap</div>
                  <div className="text-lg font-medium text-blue-300">
                    ₹{formatLargeNumber(stock.marketCap)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {stock.marketCap > 1000000000 ? 'Large Cap' : 
                     stock.marketCap > 250000000 ? 'Mid Cap' : 'Small Cap'}
                  </div>
                </div>
                
                <div className="bg-gray-700/50 p-3 rounded-md">
                  <div className="text-gray-400 text-sm">Outstanding Shares</div>
                  <div className="text-lg font-medium text-blue-300">
                    {formatLargeNumber(stock.outstandingShares)}
                  </div>
                </div>
                
                <div className="bg-gray-700/50 p-3 rounded-md">
                  <div className="text-gray-400 text-sm flex items-center">
                    P/E Ratio
                    <span className="ml-1 text-xs text-gray-500">
                      (Industry Avg: {stock.industryAvgPE.toFixed(1)})
                    </span>
                  </div>
                  <div className={`text-lg font-medium ${getPERatioColor()}`}>
                    {stock.peRatio.toFixed(1)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {stock.peRatio < stock.industryAvgPE * 0.8 ? 'Potentially undervalued' : 
                     stock.peRatio > stock.industryAvgPE * 1.2 ? 'Potentially overvalued' : 'Fair value'}
                  </div>
                </div>
                
                <div className="bg-gray-700/50 p-3 rounded-md">
                  <div className="text-gray-400 text-sm">Earnings Per Share</div>
                  <div className="text-lg font-medium text-blue-300">
                    ₹{stock.eps.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {stock.eps > 50 ? 'Strong profitability' : 
                     stock.eps > 20 ? 'Good profitability' : 'Moderate profitability'}
                  </div>
                </div>
                
                <div className="bg-gray-700/50 p-3 rounded-md">
                  <div className="text-gray-400 text-sm">Debt/Equity Ratio</div>
                  <div className={`text-lg font-medium ${getDebtEquityColor()}`}>
                    {stock.debtEquityRatio.toFixed(1)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {stock.debtEquityRatio < 0.8 ? 'Low financial risk' : 
                     stock.debtEquityRatio > 1.5 ? 'Higher financial risk' : 'Moderate leverage'}
                  </div>
                </div>
                
                <div className="bg-gray-700/50 p-3 rounded-md">
                  <div className="text-gray-400 text-sm">Business Growth</div>
                  <div className={`text-lg font-medium ${stock.businessGrowth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {stock.businessGrowth >= 0 ? '+' : ''}{stock.businessGrowth}%
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {stock.businessGrowth > 5 ? 'Strong growth' : 
                     stock.businessGrowth > 0 ? 'Moderate growth' : 'Contraction'}
                  </div>
                </div>
              </div>
              
              {/* Analysis summary */}
              <div className="mt-4 pt-4 border-t border-gray-700">
                <h5 className="font-medium text-blue-400 mb-2">Investment Analysis</h5>
                <p className="text-sm text-gray-300">
                  {isUndervalued ? 
                    `${stock.name} shows strong potential with a favorable P/E ratio (${stock.peRatio.toFixed(1)} vs industry ${stock.industryAvgPE.toFixed(1)}), solid earnings (₹${stock.eps.toFixed(2)} per share), and manageable debt (${stock.debtEquityRatio.toFixed(1)} D/E ratio). This stock appears fundamentally undervalued.` :
                    `${stock.name} currently has a P/E ratio of ${stock.peRatio.toFixed(1)} (industry average: ${stock.industryAvgPE.toFixed(1)}), earnings of ₹${stock.eps.toFixed(2)} per share, and a debt-to-equity ratio of ${stock.debtEquityRatio.toFixed(1)}. Consider these metrics when making investment decisions.`
                  }
                </p>
              </div>
              
              <div className="mt-2 text-xs text-gray-500 italic">
                This analysis is for educational purposes only and does not constitute financial advice.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockGraph;