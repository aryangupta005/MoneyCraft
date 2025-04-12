import React, { useState, useEffect, useRef } from 'react';
import StockMarketDashboard from './StockMarketDashboard.tsx';

interface Stock {
  id: string;
  name: string;
  currentPrice: number;
  priceHistory: number[];
  debtEquityRatio: number;
  businessGrowth: number;
  news: string[];
}

const StockMarketUI: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [playerRupees, setPlayerRupees] = useState(0);
  const [stocks, setStocks] = useState<Stock[]>([]);
  
  useEffect(() => {
    // Listen for the custom event from the game to open the stock market UI
    const handleOpenStockMarketUI = (event: CustomEvent) => {
      console.log("Stock Market UI received open event");
      
      // Get player rupees from the event
      if (event.detail.playerRupees !== undefined) {
        setPlayerRupees(event.detail.playerRupees);
      }
      
      // Store stocks data if provided
      if (event.detail.stocks) {
        setStocks(event.detail.stocks);
      }
      
      // Show the stock market UI
      setIsOpen(true);
      
      // Add the active class to the container to enable pointer events
      const container = document.getElementById('stock-market-ui-container');
      if (container) {
        container.classList.add('active');
        console.log("Stock Market UI activated");
      }
    };
    
    // Listen for rupee updates from the game while stock market UI is open
    const handleRupeeUpdate = (event: CustomEvent) => {
      if (event.detail.rupees !== undefined) {
        console.log("Stock Market UI received rupee update:", event.detail.rupees);
        setPlayerRupees(event.detail.rupees);
      }
    };
    
    // Add event listeners
    window.addEventListener('openStockMarketUI', handleOpenStockMarketUI as EventListener);
    window.addEventListener('rupee-update', handleRupeeUpdate as EventListener);
    
    // Clean up event listeners when the component unmounts
    return () => {
      window.removeEventListener('openStockMarketUI', handleOpenStockMarketUI as EventListener);
      window.removeEventListener('rupee-update', handleRupeeUpdate as EventListener);
    };
  }, []);
  
  // Close the stock market UI
  const handleClose = () => {
    setIsOpen(false);
    
    // Remove the active class from the container
    const container = document.getElementById('stock-market-ui-container');
    if (container) {
      container.classList.remove('active');
    }
    
    // Notify any game components that may need to know the stock market UI was closed
    window.dispatchEvent(new CustomEvent('closeStockMarketUI'));
  };
  
  // Render nothing if the stock market UI is closed
  if (!isOpen) return null;
  
  // Otherwise, render the StockMarketDashboard
  return (
    <StockMarketDashboard
      onClose={handleClose}
      playerRupees={playerRupees}
      stocks={stocks}
    />
  );
};

export default StockMarketUI;