import React, { useState, useEffect } from 'react';
import StockDetail from './StockDetail.tsx';
import StockGraph from './StockGraph.tsx';
import NewsPopup from './NewsPopup.tsx';
import HelpPanel from './HelpPanel.tsx';
import TradeStockPopup from './TradeStockPopup.tsx';

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

interface StockHolding {
  stockId: string;
  quantity: number;
  averagePurchasePrice: number;
  totalInvestment: number;
}

interface StockTransaction {
  stockId: string;
  stockName: string;
  type: 'buy' | 'sell';
  price: number;
  quantity: number;
  timestamp: number;
  total: number;
}

interface PlayerPortfolio {
  holdings: StockHolding[];
  transactionHistory: StockTransaction[];
}

interface MarketStatus {
  isOpen: boolean;
  trend: 'bull' | 'bear' | 'neutral';
  volatility: number;
  nextOpenTime: number;
  nextCloseTime: number;
}

interface StockMarketDashboardProps {
  onClose: () => void;
  playerRupees: number;
  stocks: Stock[];
}

// Sort types for column headers
type SortField = 'name' | 'price' | 'marketCap' | 'peRatio' | 'debtEquity' | 'eps' | 'growth';
type SortDirection = 'asc' | 'desc';

// Filter options
type FilterOption = 'all' | 'undervalued' | 'highGrowth' | 'lowRisk' | 'highRisk';

// Tab options
type TabOption = 'market' | 'portfolio' | 'news';

const StockMarketDashboard: React.FC<StockMarketDashboardProps> = ({
  onClose,
  playerRupees,
  stocks
}) => {
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [showGraph, setShowGraph] = useState(false);
  const [showNews, setShowNews] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showTrade, setShowTrade] = useState(false);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [filterOption, setFilterOption] = useState<FilterOption>('all');
  const [filteredStocks, setFilteredStocks] = useState<Stock[]>(stocks);
  const [currentRupees, setCurrentRupees] = useState(playerRupees);
  const [activeTab, setActiveTab] = useState<TabOption>('market');
  const [marketStatus, setMarketStatus] = useState<MarketStatus>({
    isOpen: true,
    trend: 'neutral',
    volatility: 1.0,
    nextOpenTime: Date.now() + 3600000,
    nextCloseTime: Date.now() + 3600000
  });
  
  // Portfolio state
  const [portfolio, setPortfolio] = useState<PlayerPortfolio>({
    holdings: [],
    transactionHistory: []
  });
  
  // Load portfolio data from localStorage on initial render
  useEffect(() => {
    try {
      const savedPortfolio = localStorage.getItem('dhaniverse_stock_portfolio');
      if (savedPortfolio) {
        setPortfolio(JSON.parse(savedPortfolio));
      }
    } catch (error) {
      console.error("Error loading stock portfolio:", error);
    }
  }, []);
  
  // Save portfolio to localStorage when it changes
  useEffect(() => {
    try {
      localStorage.setItem('dhaniverse_stock_portfolio', JSON.stringify(portfolio));
    } catch (error) {
      console.error("Error saving stock portfolio:", error);
    }
  }, [portfolio]);

  // Apply sorting and filtering whenever related states change
  useEffect(() => {
    let result = [...stocks];
    
    // Apply filters
    if (filterOption !== 'all') {
      result = result.filter(stock => {
        switch(filterOption) {
          case 'undervalued':
            return stock.peRatio < stock.industryAvgPE && stock.eps > 30;
          case 'highGrowth':
            return stock.businessGrowth > 3;
          case 'lowRisk':
            return stock.debtEquityRatio < 0.8 && stock.marketCap > 1000000000;
          case 'highRisk':
            return stock.debtEquityRatio > 1.5 || stock.volatility > 2.5;
          default:
            return true;
        }
      });
    }
    
    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'price':
          comparison = a.currentPrice - b.currentPrice;
          break;
        case 'marketCap':
          comparison = a.marketCap - b.marketCap;
          break;
        case 'peRatio':
          comparison = a.peRatio - b.peRatio;
          break;
        case 'debtEquity':
          comparison = a.debtEquityRatio - b.debtEquityRatio;
          break;
        case 'eps':
          comparison = a.eps - b.eps;
          break;
        case 'growth':
          comparison = a.businessGrowth - b.businessGrowth;
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    
    setFilteredStocks(result);
  }, [stocks, sortField, sortDirection, filterOption]);

  // Handle showing stock graph
  const handleShowGraph = (stock: Stock) => {
    setSelectedStock(stock);
    setShowGraph(true);
    setShowNews(false);
    setShowTrade(false);
  };

  // Handle showing news for a stock
  const handleShowNews = (stock: Stock) => {
    setSelectedStock(stock);
    setShowNews(true);
    setShowGraph(false);
    setShowTrade(false);
  };
  
  // Handle showing trade UI for a stock
  const handleShowTrade = (stock: Stock) => {
    setSelectedStock(stock);
    setShowTrade(true);
    setShowGraph(false);
    setShowNews(false);
  };

  // Toggle help panel
  const toggleHelp = () => {
    setShowHelp(!showHelp);
    // Close other popups when help is opened
    if (!showHelp) {
      setShowGraph(false);
      setShowNews(false);
      setShowTrade(false);
    }
  };

  // Close all popups
  const closeAllPopups = () => {
    setShowGraph(false);
    setShowNews(false);
    setShowHelp(false);
    setShowTrade(false);
  };
  
  // Handle sorting when column header is clicked
  const handleSort = (field: SortField) => {
    if (field === sortField) {
      // Toggle sort direction if same field is clicked
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default to ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  // Render sort indicator
  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) return null;
    
    return (
      <span className="ml-1">
        {sortDirection === 'asc' ? '↑' : '↓'}
      </span>
    );
  };
  
  // Handle buying stock
  const handleBuyStock = (stockId: string, quantity: number) => {
    // Find the stock
    const stock = stocks.find(s => s.id === stockId);
    if (!stock) {
      return { success: false, message: "Stock not found." };
    }
    
    // Check if market is open
    if (!marketStatus.isOpen) {
      return { success: false, message: "Cannot trade while market is closed." };
    }
    
    // Calculate total cost
    const totalCost = stock.currentPrice * quantity;
    
    // Check if player has enough money
    if (totalCost > currentRupees) {
      return { success: false, message: "Not enough rupees for this purchase." };
    }
    
    // Deduct rupees from player
    setCurrentRupees(prevRupees => prevRupees - totalCost);
    
    // Dispatch an event to notify the game about the rupee change
    window.dispatchEvent(new CustomEvent('updatePlayerRupees', {
      detail: { rupees: currentRupees - totalCost }
    }));
    
    // Update player portfolio
    const updatedPortfolio = { ...portfolio };
    const existingHolding = updatedPortfolio.holdings.find(h => h.stockId === stockId);
    
    if (existingHolding) {
      // Update existing holding with new average price
      const totalShares = existingHolding.quantity + quantity;
      const totalInvestment = existingHolding.totalInvestment + totalCost;
      existingHolding.quantity = totalShares;
      existingHolding.totalInvestment = totalInvestment;
      existingHolding.averagePurchasePrice = totalInvestment / totalShares;
    } else {
      // Add new holding
      updatedPortfolio.holdings.push({
        stockId,
        quantity,
        averagePurchasePrice: stock.currentPrice,
        totalInvestment: totalCost
      });
    }
    
    // Record transaction
    updatedPortfolio.transactionHistory.push({
      stockId,
      stockName: stock.name,
      type: 'buy',
      price: stock.currentPrice,
      quantity,
      timestamp: Date.now(),
      total: totalCost
    });
    
    // Update portfolio state
    setPortfolio(updatedPortfolio);
    
    // Log transaction
    console.log(`Purchased ${quantity} shares of ${stock.name} for ₹${totalCost}`);
    
    return { 
      success: true, 
      message: `Successfully purchased ${quantity} shares of ${stock.name} for ₹${totalCost.toLocaleString()}.` 
    };
  };
  
  // Handle selling stock
  const handleSellStock = (stockId: string, quantity: number) => {
    // Find the stock
    const stock = stocks.find(s => s.id === stockId);
    if (!stock) {
      return { success: false, message: "Stock not found." };
    }
    
    // Check if market is open
    if (!marketStatus.isOpen) {
      return { success: false, message: "Cannot trade while market is closed." };
    }
    
    // Check if player owns the stock
    const updatedPortfolio = { ...portfolio };
    const holdingIndex = updatedPortfolio.holdings.findIndex(h => h.stockId === stockId);
    
    if (holdingIndex === -1) {
      return { success: false, message: `You don't own any shares of ${stock.name}.` };
    }
    
    const holding = updatedPortfolio.holdings[holdingIndex];
    
    // Check if player owns enough shares
    if (holding.quantity < quantity) {
      return { success: false, message: `You only have ${holding.quantity} shares of ${stock.name}.` };
    }
    
    // Calculate sale value
    const saleValue = stock.currentPrice * quantity;
    
    // Add rupees to player
    setCurrentRupees(prevRupees => prevRupees + saleValue);
    
    // Dispatch an event to notify the game about the rupee change
    window.dispatchEvent(new CustomEvent('updatePlayerRupees', {
      detail: { rupees: currentRupees + saleValue }
    }));
    
    // Update portfolio
    if (holding.quantity === quantity) {
      // Remove holding completely if selling all shares
      updatedPortfolio.holdings.splice(holdingIndex, 1);
    } else {
      // Update quantity and investment value for remaining shares
      const remainingShares = holding.quantity - quantity;
      const investmentPerShare = holding.totalInvestment / holding.quantity;
      holding.quantity = remainingShares;
      holding.totalInvestment -= investmentPerShare * quantity;
      // Average price stays the same
    }
    
    // Record transaction
    updatedPortfolio.transactionHistory.push({
      stockId,
      stockName: stock.name,
      type: 'sell',
      price: stock.currentPrice,
      quantity,
      timestamp: Date.now(),
      total: saleValue
    });
    
    // Update portfolio state
    setPortfolio(updatedPortfolio);
    
    // Calculate profit/loss
    const profit = saleValue - (holding.averagePurchasePrice * quantity);
    const profitPercent = (profit / (holding.averagePurchasePrice * quantity)) * 100;
    
    const profitMessage = profit >= 0 ? 
      `with a profit of ₹${profit.toLocaleString()} (${profitPercent.toFixed(2)}%)` : 
      `with a loss of ₹${Math.abs(profit).toLocaleString()} (${Math.abs(profitPercent).toFixed(2)}%)`;
    
    console.log(`Sold ${quantity} shares of ${stock.name} for ₹${saleValue} ${profitMessage}`);
    
    return { 
      success: true, 
      message: `Successfully sold ${quantity} shares of ${stock.name} for ₹${saleValue.toLocaleString()} ${profitMessage}.`
    };
  };
  
  // Calculate portfolio value
  const calculatePortfolioValue = () => {
    let totalValue = 0;
    let totalInvestment = 0;
    
    portfolio.holdings.forEach(holding => {
      const stock = stocks.find(s => s.id === holding.stockId);
      if (stock) {
        totalValue += stock.currentPrice * holding.quantity;
        totalInvestment += holding.totalInvestment;
      }
    });
    
    const totalProfit = totalValue - totalInvestment;
    const profitPercent = totalInvestment > 0 ? (totalProfit / totalInvestment) * 100 : 0;
    
    return {
      totalValue,
      totalInvestment,
      totalProfit,
      profitPercent
    };
  };
  
  // Convert timestamp to readable date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString() + ' ' + 
           new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {/* Semi-transparent overlay */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>
      
      {/* Stock Market UI */}
      <div className="relative w-4/5 max-w-5xl max-h-[90vh] bg-gray-900 text-white rounded-lg shadow-xl border border-blue-600 overflow-auto">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-blue-800 to-blue-600 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Dhaniverse Stock Exchange</h1>
          
          {/* Player's rupees */}
          <div className="flex items-center space-x-4">
            <div className="bg-gray-800 rounded-full px-4 py-2 text-yellow-300 font-medium">
              Your Rupees: ₹{currentRupees.toLocaleString()}
            </div>
            <button
              onClick={toggleHelp}
              className="bg-blue-700 hover:bg-blue-800 text-white p-2 rounded-full"
              title="Show Help"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b border-gray-700">
          <button
            onClick={() => setActiveTab('market')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'market'
                ? 'bg-gray-800 text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            }`}
          >
            Market View
          </button>
          <button
            onClick={() => setActiveTab('portfolio')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'portfolio'
                ? 'bg-gray-800 text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            }`}
          >
            Portfolio
          </button>
        </div>
        
        {/* Main Content */}
        <div className="p-6">
          {/* Market View Tab */}
          {activeTab === 'market' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-blue-400">Market Overview</h2>
                
                {/* Filtering options */}
                <div className="flex items-center space-x-3">
                  <label className="text-sm text-gray-400">Filter by:</label>
                  <select 
                    className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm"
                    value={filterOption}
                    onChange={(e) => setFilterOption(e.target.value as FilterOption)}
                  >
                    <option value="all">All Stocks</option>
                    <option value="undervalued">Undervalued Gems</option>
                    <option value="highGrowth">High Growth</option>
                    <option value="lowRisk">Low Risk</option>
                    <option value="highRisk">High Risk/Reward</option>
                  </select>
                  
                  {/* Market status display */}
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    marketStatus.isOpen 
                      ? 'bg-green-900/50 text-green-400' 
                      : 'bg-red-900/50 text-red-400'
                  }`}>
                    Market: {marketStatus.isOpen ? 'OPEN' : 'CLOSED'}
                  </span>
                </div>
              </div>
              
              {/* Stock listings */}
              <div className="overflow-x-auto">
                <table className="w-full bg-gray-800 rounded-lg">
                  <thead>
                    <tr className="bg-gray-700 text-left text-sm">
                      <th className="p-4 rounded-tl-lg cursor-pointer hover:bg-gray-600" onClick={() => handleSort('name')}>
                        Company Name {renderSortIndicator('name')}
                      </th>
                      <th className="p-4 cursor-pointer hover:bg-gray-600" onClick={() => handleSort('price')}>
                        Current Price {renderSortIndicator('price')}
                      </th>
                      <th className="p-4 cursor-pointer hover:bg-gray-600" onClick={() => handleSort('marketCap')}>
                        Market Cap {renderSortIndicator('marketCap')}
                      </th>
                      <th className="p-4 cursor-pointer hover:bg-gray-600" onClick={() => handleSort('peRatio')}>
                        P/E Ratio {renderSortIndicator('peRatio')}
                      </th>
                      <th className="p-4 cursor-pointer hover:bg-gray-600" onClick={() => handleSort('debtEquity')}>
                        Debt/Equity {renderSortIndicator('debtEquity')}
                      </th>
                      <th className="p-4 cursor-pointer hover:bg-gray-600" onClick={() => handleSort('eps')}>
                        EPS {renderSortIndicator('eps')}
                      </th>
                      <th className="p-4 cursor-pointer hover:bg-gray-600" onClick={() => handleSort('growth')}>
                        Growth {renderSortIndicator('growth')}
                      </th>
                      <th className="p-4 rounded-tr-lg">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStocks.length > 0 ? (
                      filteredStocks.map((stock) => (
                        <StockDetail
                          key={stock.id}
                          stock={stock}
                          onShowGraph={() => handleShowGraph(stock)}
                          onShowNews={() => handleShowNews(stock)}
                          onTrade={() => handleShowTrade(stock)}
                        />
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="p-4 text-center text-gray-400">
                          No stocks match the selected filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {/* Portfolio Tab */}
          {activeTab === 'portfolio' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-blue-400">Your Portfolio</h2>
                
                {/* Portfolio summary */}
                {portfolio.holdings.length > 0 && (
                  <div className="text-sm text-right">
                    <div className="text-gray-400">Total Value: 
                      <span className="ml-2 text-blue-300 font-medium">
                        ₹{calculatePortfolioValue().totalValue.toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="text-gray-400 mt-1">Total Profit/Loss: 
                      <span className={`ml-2 font-medium ${
                        calculatePortfolioValue().totalProfit >= 0 
                          ? 'text-green-400' 
                          : 'text-red-400'
                      }`}>
                        {calculatePortfolioValue().totalProfit >= 0 ? '+' : ''}
                        ₹{calculatePortfolioValue().totalProfit.toLocaleString()} 
                        ({calculatePortfolioValue().totalProfit >= 0 ? '+' : ''}
                        {calculatePortfolioValue().profitPercent.toFixed(2)}%)
                      </span>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Current Holdings */}
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-lg font-medium text-blue-300 mb-3">Current Holdings</h3>
                
                {portfolio.holdings.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-sm border-b border-gray-700">
                          <th className="p-2">Stock</th>
                          <th className="p-2">Quantity</th>
                          <th className="p-2">Avg. Price</th>
                          <th className="p-2">Current Price</th>
                          <th className="p-2">Market Value</th>
                          <th className="p-2">Profit/Loss</th>
                          <th className="p-2">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {portfolio.holdings.map(holding => {
                          const stock = stocks.find(s => s.id === holding.stockId);
                          if (!stock) return null;
                          
                          const currentValue = stock.currentPrice * holding.quantity;
                          const profit = currentValue - holding.totalInvestment;
                          const profitPercent = (profit / holding.totalInvestment) * 100;
                          
                          return (
                            <tr key={holding.stockId} className="border-b border-gray-700 hover:bg-gray-700/30">
                              <td className="p-3">
                                <div className="font-medium text-blue-300">{stock.name}</div>
                              </td>
                              <td className="p-3">{holding.quantity}</td>
                              <td className="p-3">₹{holding.averagePurchasePrice.toFixed(2)}</td>
                              <td className="p-3">₹{stock.currentPrice.toLocaleString()}</td>
                              <td className="p-3">₹{currentValue.toLocaleString()}</td>
                              <td className={`p-3 ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {profit >= 0 ? '+' : ''}₹{profit.toLocaleString()} 
                                <span className="text-xs ml-1">
                                  ({profit >= 0 ? '+' : ''}{profitPercent.toFixed(2)}%)
                                </span>
                              </td>
                              <td className="p-3 space-x-1">
                                <button
                                  onClick={() => handleShowTrade(stock)}
                                  className="px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-xs"
                                >
                                  Trade
                                </button>
                                <button
                                  onClick={() => handleShowGraph(stock)}
                                  className="px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs"
                                >
                                  Graph
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    You don't own any stocks yet. Start investing by trading on the Market tab!
                  </div>
                )}
              </div>
              
              {/* Transaction History */}
              {portfolio.transactionHistory.length > 0 && (
                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-blue-300 mb-3">Transaction History</h3>
                  <div className="overflow-x-auto max-h-64 overflow-y-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-sm border-b border-gray-700">
                          <th className="p-2">Date</th>
                          <th className="p-2">Stock</th>
                          <th className="p-2">Type</th>
                          <th className="p-2">Quantity</th>
                          <th className="p-2">Price</th>
                          <th className="p-2">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {portfolio.transactionHistory
                          .sort((a, b) => b.timestamp - a.timestamp) // Sort by newest first
                          .map((transaction, index) => (
                            <tr key={index} className="border-b border-gray-700 hover:bg-gray-700/30">
                              <td className="p-3 text-sm">{formatDate(transaction.timestamp)}</td>
                              <td className="p-3">{transaction.stockName}</td>
                              <td className={`p-3 ${transaction.type === 'buy' ? 'text-green-400' : 'text-red-400'}`}>
                                {transaction.type === 'buy' ? 'BUY' : 'SELL'}
                              </td>
                              <td className="p-3">{transaction.quantity}</td>
                              <td className="p-3">₹{transaction.price.toLocaleString()}</td>
                              <td className="p-3">₹{transaction.total.toLocaleString()}</td>
                            </tr>
                          ))
                        }
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="border-t border-gray-700 p-4 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-red-700 hover:bg-red-800 text-white rounded-md transition-colors duration-200"
          >
            Exit Stock Market
          </button>
        </div>
      </div>
      
      {/* Popups */}
      {showGraph && selectedStock && (
        <StockGraph
          stock={selectedStock}
          onClose={() => setShowGraph(false)}
        />
      )}
      
      {showNews && selectedStock && (
        <NewsPopup
          stock={selectedStock}
          onClose={() => setShowNews(false)}
        />
      )}
      
      {showTrade && selectedStock && (
        <TradeStockPopup
          stock={selectedStock}
          playerRupees={currentRupees}
          holdings={portfolio.holdings}
          onBuy={handleBuyStock}
          onSell={handleSellStock}
          onClose={() => setShowTrade(false)}
        />
      )}
      
      {showHelp && (
        <HelpPanel onClose={() => setShowHelp(false)} />
      )}
    </div>
  );
};

export default StockMarketDashboard;