import React, { useState } from 'react';

interface DepositWithdrawPanelProps {
  playerRupees: number;
  bankBalance: number;
  onDeposit: (amount: number) => boolean;
  onWithdraw: (amount: number) => boolean;
}

const DepositWithdrawPanel: React.FC<DepositWithdrawPanelProps> = ({
  playerRupees,
  bankBalance,
  onDeposit,
  onWithdraw
}) => {
  const [amount, setAmount] = useState(1000);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [transactionType, setTransactionType] = useState<'deposit' | 'withdraw'>('deposit');
  
  // Predefined amounts for quick selection
  const predefinedAmounts = [500, 1000, 5000, 10000];
  
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 0) {
      setAmount(value);
    }
  };
  
  const handleTransaction = () => {
    if (amount <= 0) {
      setMessage('Please enter a valid amount');
      setMessageType('error');
      return;
    }
    
    let success = false;
    if (transactionType === 'deposit') {
      if (amount > playerRupees) {
        setMessage('You don\'t have enough rupees!');
        setMessageType('error');
        return;
      }
      success = onDeposit(amount);
      if (success) {
        setMessage(`Successfully deposited ₹${amount.toLocaleString()}`);
        setMessageType('success');
      }
    } else {
      if (amount > bankBalance) {
        setMessage('Insufficient balance in your account!');
        setMessageType('error');
        return;
      }
      success = onWithdraw(amount);
      if (success) {
        setMessage(`Successfully withdrew ₹${amount.toLocaleString()}`);
        setMessageType('success');
      }
    }
    
    if (!success) {
      setMessage('Transaction failed. Please try again.');
      setMessageType('error');
    }
  };
  
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-yellow-400">Account Management</h2>
      
      {/* Transaction Type Selector */}
      <div className="flex space-x-4">
        <button
          onClick={() => setTransactionType('deposit')}
          className={`px-4 py-2 rounded-md ${
            transactionType === 'deposit'
              ? 'bg-green-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Deposit
        </button>
        <button
          onClick={() => setTransactionType('withdraw')}
          className={`px-4 py-2 rounded-md ${
            transactionType === 'withdraw'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Withdraw
        </button>
      </div>
      
      {/* Current Balances */}
      <div className="grid grid-cols-2 gap-4 bg-gray-800 rounded-lg p-4">
        <div>
          <div className="text-gray-400">Your Rupees</div>
          <div className="text-2xl font-bold text-yellow-400">₹{playerRupees.toLocaleString()}</div>
        </div>
        <div>
          <div className="text-gray-400">Bank Balance</div>
          <div className="text-2xl font-bold text-yellow-400">₹{bankBalance.toLocaleString()}</div>
        </div>
      </div>
      
      {/* Amount Input */}
      <div className="space-y-2">
        <label htmlFor="amount" className="block text-gray-300">
          {transactionType === 'deposit' ? 'Deposit Amount' : 'Withdrawal Amount'}
        </label>
        <input
          id="amount"
          type="number"
          min="1"
          value={amount}
          onChange={handleAmountChange}
          className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
        />
      </div>
      
      {/* Quick Amount Selection */}
      <div className="space-y-2">
        <div className="text-gray-300">Quick Select Amount</div>
        <div className="flex flex-wrap gap-2">
          {predefinedAmounts.map((presetAmount) => (
            <button
              key={presetAmount}
              onClick={() => setAmount(presetAmount)}
              className={`px-4 py-2 text-sm rounded-md ${
                amount === presetAmount
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              ₹{presetAmount.toLocaleString()}
            </button>
          ))}
        </div>
      </div>
      
      {/* Transaction Button */}
      <button
        onClick={handleTransaction}
        className={`w-full py-3 rounded-md font-medium ${
          transactionType === 'deposit'
            ? 'bg-green-600 hover:bg-green-700 text-white'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
      >
        {transactionType === 'deposit' ? 'Deposit Rupees' : 'Withdraw Rupees'}
      </button>
      
      {/* Message */}
      {message && (
        <div className={`p-3 rounded-md ${
          messageType === 'success' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
        }`}>
          {message}
        </div>
      )}
    </div>
  );
};

export default DepositWithdrawPanel;