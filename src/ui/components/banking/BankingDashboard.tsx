import React, { useState, useEffect } from 'react';
import DepositWithdrawPanel from './DepositWithdrawPanel';
import FixedDepositPanel from './FixedDepositPanel';

interface FixedDeposit {
  id: string;
  amount: number;
  interestRate: number;
  startDate: number;
  duration: number;
  maturityDate: number;
  matured: boolean;
}

// Update the interface to include initialRupees
interface BankingDashboardProps {
  onClose: () => void;
  playerRupees: number;
  initialRupees: number;
}

const BankingDashboard: React.FC<BankingDashboardProps> = ({
  onClose,
  playerRupees,
  initialRupees
}) => {
  const [activeTab, setActiveTab] = useState('account');
  const [bankBalance, setBankBalance] = useState(0);
  const [fixedDeposits, setFixedDeposits] = useState<FixedDeposit[]>([]);
  const [totalRupeesChange, setTotalRupeesChange] = useState(0);
  
  // Use playerRupees directly from props in the useEffect dependency array
  useEffect(() => {
    try {
      // Load bank account data
      const bankData = localStorage.getItem('dhaniverse_bank_account');
      if (bankData) {
        const parsedData = JSON.parse(bankData);
        setBankBalance(parsedData.balance || 0);
      }
      
      // Load fixed deposits data
      const fdData = localStorage.getItem('dhaniverse_fixed_deposits');
      if (fdData) {
        let parsedFDs = JSON.parse(fdData);
        
        // Check for matured deposits that haven't been marked as matured yet
        const currentTime = Date.now();
        parsedFDs = parsedFDs.map((fd: FixedDeposit) => {
          if (!fd.matured && fd.maturityDate <= currentTime) {
            return { ...fd, matured: true };
          }
          return fd;
        });
        
        setFixedDeposits(parsedFDs);
      }
    } catch (error) {
      console.error("Error loading bank data:", error);
    }
  }, []);
  
  // Every time playerRupees changes externally, reset the change tracking
  useEffect(() => {
    // Reset total change when player rupees are updated externally
    setTotalRupeesChange(0);
    console.log("Banking dashboard received updated player rupees:", playerRupees);
  }, [initialRupees]);
  
  // Save bank data to local storage
  const saveBankData = () => {
    try {
      localStorage.setItem('dhaniverse_bank_account', JSON.stringify({ 
        balance: bankBalance,
        created: true 
      }));
      
      localStorage.setItem('dhaniverse_fixed_deposits', JSON.stringify(fixedDeposits));
    } catch (error) {
      console.error("Error saving bank data:", error);
    }
  };
  
  // Handle deposit to bank account
  const handleDeposit = (amount: number) => {
    // Verify player has enough money, using playerRupees from props
    if (amount > playerRupees) {
      console.error("Cannot deposit more than playerRupees:", playerRupees, "amount:", amount);
      return false;
    }
    
    setBankBalance(prevBalance => prevBalance + amount);
    setTotalRupeesChange(prev => prev - amount);
    
    // Immediately dispatch an event to update the game and HUD
    const newRupees = playerRupees - amount;
    window.dispatchEvent(new CustomEvent('updatePlayerRupees', {
      detail: { rupees: newRupees }
    }));
    
    saveBankData();
    return true;
  };
  
  // Handle withdraw from bank account
  const handleWithdraw = (amount: number) => {
    if (amount > bankBalance) {
      return false;
    }
    
    setBankBalance(prevBalance => prevBalance - amount);
    setTotalRupeesChange(prev => prev + amount);
    
    // Immediately dispatch an event to update the game and HUD
    const newRupees = playerRupees + amount;
    window.dispatchEvent(new CustomEvent('updatePlayerRupees', {
      detail: { rupees: newRupees }
    }));
    
    saveBankData();
    return true;
  };
  
  // Handle creating a fixed deposit
  const handleCreateFD = (amount: number, durationDays: number) => {
    if (amount > bankBalance) {
      return false;
    }
    
    // Calculate interest rate based on duration
    let interestRate = 5.0; // Base rate
    if (durationDays >= 730) interestRate = 9.5;
    else if (durationDays >= 365) interestRate = 8.5;
    else if (durationDays >= 180) interestRate = 7.5;
    else if (durationDays >= 90) interestRate = 6.5;
    
    const startDate = Date.now();
    const maturityDate = startDate + (durationDays * 24 * 60 * 60 * 1000);
    
    const newFD: FixedDeposit = {
      id: `fd-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      amount,
      interestRate,
      startDate,
      duration: durationDays,
      maturityDate,
      matured: false
    };
    
    // Update bank balance and fixed deposits
    setBankBalance(prevBalance => prevBalance - amount);
    setFixedDeposits(prevDeposits => [...prevDeposits, newFD]);
    
    // Save data
    setTimeout(saveBankData, 0);
    
    return true;
  };
  
  // Handle claiming a matured fixed deposit
  const handleClaimFD = (fdId: string) => {
    const fd = fixedDeposits.find(d => d.id === fdId);
    if (!fd || !fd.matured) return false;
    
    // Calculate interest earned
    const durationInYears = fd.duration / 365;
    const interestEarned = Math.round(fd.amount * (fd.interestRate / 100) * durationInYears);
    const totalAmount = fd.amount + interestEarned;
    
    // Update balance and remove the FD
    setBankBalance(prevBalance => prevBalance + totalAmount);
    setFixedDeposits(prevDeposits => prevDeposits.filter(d => d.id !== fdId));
    
    // Save data
    setTimeout(saveBankData, 0);
    
    return true;
  };
  
  // Handle closing the banking UI and update player rupees
  const handleClose = () => {
    // Save bank data one last time
    saveBankData();
    
    // Calculate the new total rupees - use playerRupees directly
    const newTotalRupees = playerRupees;
    
    // First update the game's internal rupee state if needed
    if (totalRupeesChange !== 0) {
      console.log("Banking UI closing with updated rupee balance:", newTotalRupees);
      window.dispatchEvent(new CustomEvent('updatePlayerRupees', {
        detail: { 
          rupees: newTotalRupees,
          closeUI: true  // Add flag to indicate UI should close
        }
      }));
    } else {
      // Even if no rupee changes, we need to trigger UI close
      window.dispatchEvent(new CustomEvent('updatePlayerRupees', {
        detail: { 
          rupees: newTotalRupees,
          closeUI: true 
        }
      }));
    }
    
    // Close the UI
    onClose();
  };
  
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {/* Semi-transparent overlay */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>
      
      {/* Banking UI */}
      <div className="relative w-4/5 max-w-5xl max-h-[90vh] bg-gray-900 text-white rounded-lg shadow-xl border border-yellow-600 overflow-auto">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-yellow-800 to-yellow-600 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Royal Bank of Dhaniverse</h1>
          
          {/* Player's rupees and account balance */}
          <div className="flex items-center space-x-4">
            <div className="bg-gray-800 rounded-full px-4 py-2 text-yellow-300 font-medium">
              Your Rupees: ₹{(playerRupees + totalRupeesChange).toLocaleString()}
            </div>
            <div className="bg-gray-800 rounded-full px-4 py-2 text-yellow-300 font-medium">
              Bank Balance: ₹{bankBalance.toLocaleString()}
            </div>
          </div>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-700">
          <button
            onClick={() => setActiveTab('account')}
            className={`px-6 py-3 font-medium ${activeTab === 'account' 
              ? 'bg-gray-800 text-yellow-400 border-b-2 border-yellow-400' 
              : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}
          >
            Account
          </button>
          <button
            onClick={() => setActiveTab('fd')}
            className={`px-6 py-3 font-medium ${activeTab === 'fd' 
              ? 'bg-gray-800 text-yellow-400 border-b-2 border-yellow-400' 
              : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}
          >
            Fixed Deposits
          </button>
        </div>
        
        {/* Main Content */}
        <div className="p-6">
          {activeTab === 'account' && (
            <DepositWithdrawPanel
              playerRupees={playerRupees + totalRupeesChange}
              bankBalance={bankBalance}
              onDeposit={handleDeposit}
              onWithdraw={handleWithdraw}
            />
          )}
          
          {activeTab === 'fd' && (
            <FixedDepositPanel
              bankBalance={bankBalance}
              fixedDeposits={fixedDeposits}
              onCreateFD={handleCreateFD}
              onClaimFD={handleClaimFD}
            />
          )}
        </div>
        
        {/* Footer */}
        <div className="border-t border-gray-700 p-4 flex justify-end">
          <button 
            onClick={handleClose}
            className="px-6 py-2 bg-red-700 hover:bg-red-800 text-white rounded-md transition-colors duration-200"
          >
            Exit Banking
          </button>
        </div>
      </div>
    </div>
  );
};

export default BankingDashboard;