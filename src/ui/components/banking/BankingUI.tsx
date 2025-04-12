import React, { useState, useEffect, useRef } from 'react';
import BankingDashboard from './BankingDashboard';

const BankingUI: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [playerRupees, setPlayerRupees] = useState(0);
  const [bankAccount, setBankAccount] = useState(null);
  // Keep track of the rupees at opening time to calculate the difference later
  const initialRupeesRef = useRef(0);
  
  useEffect(() => {
    // Listen for the custom event from the game to open the banking UI
    const handleOpenBankingUI = (event: CustomEvent) => {
      console.log("Banking UI received open event with rupees:", event.detail.playerRupees);
      
      // Store the initial rupees value when banking UI opens
      initialRupeesRef.current = event.detail.playerRupees;
      
      // Get player rupees from the event
      setPlayerRupees(event.detail.playerRupees);
      
      // Store bank account data if provided
      if (event.detail.bankAccount) {
        setBankAccount(event.detail.bankAccount);
      }
      
      // Show the banking UI
      setIsOpen(true);
      
      // Add the active class to the container to enable pointer events
      const container = document.getElementById('banking-ui-container');
      if (container) {
        container.classList.add('active');
        console.log("Banking UI activated");
      }
    };
    
    // Listen for rupee updates from the game while banking UI is open
    const handleRupeeUpdate = (event: CustomEvent) => {
      if (event.detail.rupees !== undefined) {
        console.log("Banking UI received rupee update:", event.detail.rupees);
        setPlayerRupees(event.detail.rupees);
        
        if (isOpen) {
          initialRupeesRef.current = event.detail.rupees;
        }
      }
    };
    
    // Add event listeners
    window.addEventListener('openBankingUI', handleOpenBankingUI as EventListener);
    window.addEventListener('rupee-update', handleRupeeUpdate as EventListener);
    
    // Clean up event listeners when the component unmounts
    return () => {
      window.removeEventListener('openBankingUI', handleOpenBankingUI as EventListener);
      window.removeEventListener('rupee-update', handleRupeeUpdate as EventListener);
    };
  }, [isOpen]);
  
  // Close the banking UI
  const handleClose = () => {
    setIsOpen(false);
    
    // Remove the active class from the container
    const container = document.getElementById('banking-ui-container');
    if (container) {
      container.classList.remove('active');
    }
    
    // Notify any game components that may need to know the banking UI was closed
    window.dispatchEvent(new CustomEvent('closeBankingUI'));
  };
  
  // Render nothing if the banking UI is closed
  if (!isOpen) return null;
  
  // Otherwise, render the BankingDashboard
  return (
    <BankingDashboard
      onClose={handleClose}
      playerRupees={playerRupees}
      initialRupees={initialRupeesRef.current}
    />
  );
};

export default BankingUI;