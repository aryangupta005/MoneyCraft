import React, { useState } from 'react';

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

interface StockDetailProps {
  stock: Stock;
  onShowGraph: () => void;
  onShowNews: () => void;
  onTrade: () => void;
}

interface TooltipProps {
  text: string;
  children: React.ReactNode;
}

// Tooltip component for displaying metric explanations
const Tooltip: React.FC<TooltipProps> = ({ text, children }) => {
  const [isVisible, setIsVisible] = useState(false);
  
  return (
    <div className="relative inline-flex items-center" 
      onMouseEnter={() => setIsVisible(true)} 
      onMouseLeave={() => setIsVisible(false)}
      onTouchStart={() => setIsVisible(!isVisible)}
    >
      {children}
      {isVisible && (
        <div className="absolute z-10 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 text-sm text-white bg-gray-800 rounded-lg shadow-lg w-64">
          {text}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-t-4 border-l-4 border-r-4 border-transparent border-t-gray-800"></div>
        </div>
      )}
    </div>
  );
}

const StockDetail: React.FC<StockDetailProps> = ({
  stock,
  onShowGraph,
  onShowNews,
  onTrade
}) => {
  // Determine if business growth is positive, negative or neutral
  const getGrowthColor = (growth: number) => {
    if (growth > 0) return 'text-green-400';
    if (growth < 0) return 'text-red-400';
    return 'text-gray-400';
  };

  // Get proper symbol for growth
  const getGrowthSymbol = (growth: number) => {
    if (growth > 0) return '↑';
    if (growth < 0) return '↓';
    return '→';
  };
  
  // Format large numbers with abbreviations
  const formatLargeNumber = (num: number): string => {
    if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
    return num.toString();
  };
  
  // Evaluate if stock is a strong buy based on fundamentals
  const isStrongBuy = (): boolean => {
    // High EPS relative to price
    const hasHighEPS = stock.eps > 30;
    // Debt ratio in safe range (less than 1.0)
    const hasSafeDebtRatio = stock.debtEquityRatio < 1.0;
    // P/E Ratio balanced or lower than industry average
    const hasGoodPE = stock.peRatio <= stock.industryAvgPE * 1.1;
    
    return hasHighEPS && hasSafeDebtRatio && hasGoodPE;
  };

  return (
    <tr className={`border-t border-gray-700 ${isStrongBuy() ? 'bg-green-900/20 ring-1 ring-green-500/50' : ''}`}>
      <td className="p-4 font-medium text-blue-300">
        {stock.name}
        {isStrongBuy() && (
          <span className="ml-2 px-2 py-1 text-xs bg-green-600/30 text-green-400 rounded-md">
            Undervalued Gem
          </span>
        )}
      </td>
      
      <td className="p-4">
        ₹{stock.currentPrice.toLocaleString()}
      </td>
      
      <td className="p-4 whitespace-nowrap">
        <Tooltip text="The total market value of a company's outstanding shares. Indicates company size and stability.">
          <div className="flex items-center">
            <span>₹{formatLargeNumber(stock.marketCap)}</span>
            <span className="ml-1 w-4 h-4 rounded-full bg-gray-700 text-xs flex items-center justify-center text-white cursor-help">i</span>
          </div>
        </Tooltip>
      </td>
      
      <td className={`p-4 ${stock.peRatio > stock.industryAvgPE * 1.2 ? 'text-orange-400' : stock.peRatio < stock.industryAvgPE * 0.8 ? 'text-green-400' : 'text-white'}`}>
        <Tooltip text="Price divided by Earnings Per Share. Tells how expensive a stock is relative to its earnings. Lower P/E can mean undervalued; higher can suggest overhyped.">
          <div className="flex items-center">
            <span>{stock.peRatio.toFixed(1)}</span>
            <span className="ml-1 w-4 h-4 rounded-full bg-gray-700 text-xs flex items-center justify-center text-white cursor-help">i</span>
          </div>
        </Tooltip>
      </td>
      
      <td className={`p-4 ${stock.debtEquityRatio > 1.5 ? 'text-orange-400' : stock.debtEquityRatio < 0.8 ? 'text-green-400' : 'text-white'}`}>
        <Tooltip text="Compares a company's total liabilities to shareholder equity. Used to assess risk from debt. Lower is generally better.">
          <div className="flex items-center">
            <span>{stock.debtEquityRatio.toFixed(1)}</span>
            <span className="ml-1 w-4 h-4 rounded-full bg-gray-700 text-xs flex items-center justify-center text-white cursor-help">i</span>
          </div>
        </Tooltip>
      </td>
      
      <td className="p-4">
        <Tooltip text="Portion of a company's profit allocated to each share of stock. Higher is generally better.">
          <div className="flex items-center">
            <span>₹{stock.eps.toFixed(1)}</span>
            <span className="ml-1 w-4 h-4 rounded-full bg-gray-700 text-xs flex items-center justify-center text-white cursor-help">i</span>
          </div>
        </Tooltip>
      </td>
      
      <td className={`p-4 ${getGrowthColor(stock.businessGrowth)}`}>
        {getGrowthSymbol(stock.businessGrowth)} {Math.abs(stock.businessGrowth)}%
      </td>
      
      <td className="p-4 space-x-2 whitespace-nowrap">
        <button
          onClick={onShowGraph}
          className="px-2 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-md text-sm"
          title="View Stock Price History"
        >
          <span className="flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
            Graph
          </span>
        </button>
        <button
          onClick={onShowNews}
          className="px-2 py-1.5 bg-gray-600 hover:bg-gray-700 rounded-md text-sm"
          title="View Latest News"
        >
          <span className="flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
            News
          </span>
        </button>
        <button
          onClick={onTrade}
          className="px-2 py-1.5 bg-green-600 hover:bg-green-700 rounded-md text-sm"
          title="Buy or Sell Shares"
        >
          <span className="flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Trade
          </span>
        </button>
      </td>
    </tr>
  );
};

export default StockDetail;