import React, { useState, useEffect } from 'react';

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

interface TradeStockPopupProps {
  stock: Stock;
  playerRupees: number;
  holdings: StockHolding[];
  onBuy: (stockId: string, quantity: number) => { success: boolean; message: string };
  onSell: (stockId: string, quantity: number) => { success: boolean; message: string };
  onClose: () => void;
}

const TradeStockPopup: React.FC<TradeStockPopupProps> = ({
  stock,
  playerRupees,
  holdings,
  onBuy,
  onSell,
  onClose
}) => {
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [quantity, setQuantity] = useState<number>(1);
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  
  // Find if player already owns this stock
  const existingHolding = holdings.find(h => h.stockId === stock.id);
  const sharesOwned = existingHolding ? existingHolding.quantity : 0;
  const averagePrice = existingHolding ? existingHolding.averagePurchasePrice : 0;
  
  // Calculate total cost/value for the transaction
  const totalAmount = stock.currentPrice * quantity;
  
  // Calculate profit/loss for selling
  const potentialProfit = tradeType === 'sell' && existingHolding 
    ? (stock.currentPrice - averagePrice) * quantity
    : 0;
  
  // Calculate profit/loss percentage
  const profitPercentage = averagePrice > 0
    ? ((stock.currentPrice - averagePrice) / averagePrice) * 100
    : 0;
  
  // Check if player can afford to buy the selected quantity
  const canAfford = playerRupees >= totalAmount;
  
  // Check if player owns enough shares to sell
  const canSell = sharesOwned >= quantity;

  // Handle quantity input change
  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 1) {
      setQuantity(value);
    }
  };
  
  // Handle quick quantity selection
  const handleQuickQuantitySelect = (amount: number) => {
    setQuantity(amount);
  };
  
  // Generate quick quantity options based on affordability and shares owned
  const getQuantityOptions = () => {
    if (tradeType === 'buy') {
      const maxAffordable = Math.floor(playerRupees / stock.currentPrice);
      return [1, 5, 10, 25, Math.min(50, maxAffordable), Math.min(100, maxAffordable)];
    } else {
      return [1, 5, 10, Math.min(25, sharesOwned), Math.min(50, sharesOwned), sharesOwned];
    }
  };
  
  // Execute the trade
  const handleTrade = () => {
    if (quantity <= 0) {
      setMessage("Please enter a valid quantity.");
      setMessageType('error');
      return;
    }
    
    let result;
    
    if (tradeType === 'buy') {
      if (!canAfford) {
        setMessage("You don't have enough rupees for this purchase.");
        setMessageType('error');
        return;
      }
      
      result = onBuy(stock.id, quantity);
    } else {
      if (!canSell) {
        setMessage(`You only have ${sharesOwned} shares to sell.`);
        setMessageType('error');
        return;
      }
      
      result = onSell(stock.id, quantity);
    }
    
    if (result.success) {
      setMessage(result.message);
      setMessageType('success');
      
      // Reset quantity after successful trade
      setQuantity(1);
    } else {
      setMessage(result.message);
      setMessageType('error');
    }
  };
  
  return (
    <div className="fixed inset-0 flex items-center justify-center z-[60]">
      <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>
      <div className="relative bg-gray-900 p-6 rounded-lg shadow-xl border border-blue-500 max-w-md w-full">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <h3 className="text-xl font-semibold text-blue-400 mb-4 pr-6">
          Trade {stock.name} Shares
        </h3>
        
        {/* Stock info summary */}
        <div className="bg-gray-800 p-4 rounded-md mb-5">
          <div className="flex justify-between">
            <div>
              <div className="text-gray-400 text-sm">Current Price</div>
              <div className="text-xl font-bold text-blue-300">₹{stock.currentPrice.toLocaleString()}</div>
            </div>
            <div className="text-right">
              <div className="text-gray-400 text-sm">Shares Owned</div>
              <div className="text-xl font-medium text-blue-300">{sharesOwned}</div>
            </div>
          </div>
          
          {existingHolding && (
            <div className="mt-3 pt-3 border-t border-gray-700">
              <div className="flex justify-between text-sm">
                <div className="text-gray-400">Average Price</div>
                <div className="font-medium text-blue-300">
                  ₹{averagePrice.toFixed(2)}
                </div>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <div className="text-gray-400">Current P/L</div>
                <div className={`font-medium ${profitPercentage >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {profitPercentage >= 0 ? '+' : ''}{profitPercentage.toFixed(2)}%
                </div>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <div className="text-gray-400">Investment Value</div>
                <div className="font-medium text-blue-300">
                  ₹{existingHolding.totalInvestment.toLocaleString()}
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Trade type selector */}
        <div className="flex space-x-2 mb-4">
          <button
            onClick={() => setTradeType('buy')}
            className={`flex-1 py-2 rounded-md font-medium ${
              tradeType === 'buy'
                ? 'bg-green-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Buy
          </button>
          <button
            onClick={() => setTradeType('sell')}
            className={`flex-1 py-2 rounded-md font-medium ${
              tradeType === 'sell'
                ? 'bg-red-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            disabled={!existingHolding || sharesOwned === 0}
          >
            Sell
          </button>
        </div>
        
        {/* Quantity input */}
        <div className="mb-4">
          <label className="block text-gray-300 mb-2">
            Quantity
          </label>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={handleQuantityChange}
            className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        {/* Quick quantity selection */}
        <div className="mb-5">
          <div className="text-sm text-gray-300 mb-2">Quick Select</div>
          <div className="flex flex-wrap gap-2">
            {getQuantityOptions().map((amt, index) => (
              <button
                key={index}
                onClick={() => handleQuickQuantitySelect(amt)}
                className={`px-3 py-1 text-sm rounded-md ${
                  quantity === amt
                    ? tradeType === 'buy' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {amt}
              </button>
            ))}
          </div>
        </div>
        
        {/* Transaction summary */}
        <div className="bg-gray-800 p-4 rounded-md mb-5">
          <div className="flex justify-between mb-3">
            <div className="text-gray-400">Total {tradeType === 'buy' ? 'Cost' : 'Value'}</div>
            <div className="text-xl font-bold text-blue-300">₹{totalAmount.toLocaleString()}</div>
          </div>
          
          {tradeType === 'buy' && (
            <div className="flex justify-between text-sm">
              <div className="text-gray-400">Remaining Balance</div>
              <div className={`font-medium ${canAfford ? 'text-green-400' : 'text-red-400'}`}>
                ₹{(playerRupees - totalAmount).toLocaleString()}
              </div>
            </div>
          )}
          
          {tradeType === 'sell' && existingHolding && (
            <div className="flex justify-between text-sm">
              <div className="text-gray-400">Estimated Profit/Loss</div>
              <div className={`font-medium ${potentialProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {potentialProfit >= 0 ? '+' : ''}₹{potentialProfit.toLocaleString()}
              </div>
            </div>
          )}
        </div>
        
        {/* Action button */}
        <button
          onClick={handleTrade}
          className={`w-full py-3 font-medium rounded-md ${
            tradeType === 'buy'
              ? canAfford ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 cursor-not-allowed'
              : canSell ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 cursor-not-allowed'
          } text-white`}
          disabled={(tradeType === 'buy' && !canAfford) || (tradeType === 'sell' && !canSell)}
        >
          {tradeType === 'buy' ? 'Buy Shares' : 'Sell Shares'}
        </button>
        
        {/* Message */}
        {message && (
          <div className={`mt-4 p-3 rounded-md ${
            messageType === 'success' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
          }`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

export default TradeStockPopup;