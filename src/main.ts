import './style.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './ui/App.tsx';
import GameHUD from './ui/components/hud/GameHUD.tsx';
import BankingUI from './ui/components/banking/BankingUI.tsx';
import StockMarketUI from './ui/components/stockmarket/StockMarketUI.tsx';

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Get join-screen container for React
  const joinScreen = document.getElementById('join-screen');
  
  // Render the React app in the join screen
  if (joinScreen) {
    const root = ReactDOM.createRoot(joinScreen);
    root.render(React.createElement(App));
  }
  
  // Initialize the banking UI separately
  initializeBankingUI();
  
  // Initialize the stock market UI separately
  initializeStockMarketUI();
});

// Function to initialize banking UI
function initializeBankingUI() {
  const bankingUIContainer = document.getElementById('banking-ui-container');
  
  if (bankingUIContainer) {
    // Create a root and explicitly render the BankingUI component
    const bankingUIRoot = ReactDOM.createRoot(bankingUIContainer);
    bankingUIRoot.render(React.createElement(BankingUI));
    
    // Make sure the banking container is visible
    bankingUIContainer.style.display = 'block';
    
    console.log("Banking UI initialized and mounted");
  } else {
    console.error("Could not find banking-ui-container element");
  }
}

// Function to initialize stock market UI
function initializeStockMarketUI() {
  const stockMarketUIContainer = document.getElementById('stock-market-ui-container');
  
  if (stockMarketUIContainer) {
    // Create a root and explicitly render the StockMarketUI component
    const stockMarketUIRoot = ReactDOM.createRoot(stockMarketUIContainer);
    stockMarketUIRoot.render(React.createElement(StockMarketUI));
    
    // Make sure the stock market container is visible
    stockMarketUIContainer.style.display = 'block';
    
    console.log("Stock Market UI initialized and mounted");
  } else {
    console.error("Could not find stock-market-ui-container element");
  }
}

// Function to initialize HUD - will be called from game.ts when game starts
export function initializeHUD(initialRupees = 25000) {
  const hudContainer = document.getElementById('hud-container');
  
  if (hudContainer) {
    // Make HUD visible
    hudContainer.style.display = 'block';
    
    // Mount React component
    const hudRoot = ReactDOM.createRoot(hudContainer);
    hudRoot.render(
      React.createElement(GameHUD, { rupees: initialRupees })
    );
    
    return hudRoot; // Return the root so we can update it later if needed
  }
  
  return null;
}

// Create a function to update the HUD from Phaser
export function updateHUD(rupees: number) {
  // Dispatch a custom event that the React component will listen for
  window.dispatchEvent(
    new CustomEvent('rupee-update', { detail: { rupees } })
  );
}
