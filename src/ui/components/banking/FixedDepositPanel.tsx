import React, { useState } from 'react';

interface FixedDeposit {
  id: string;
  amount: number;
  interestRate: number;
  startDate: number;
  duration: number;
  maturityDate: number;
  matured: boolean;
}

interface FixedDepositPanelProps {
  bankBalance: number;
  fixedDeposits: FixedDeposit[];
  onCreateFD: (amount: number, duration: number) => boolean;
  onClaimFD: (id: string) => boolean;
}

const FixedDepositPanel: React.FC<FixedDepositPanelProps> = ({
  bankBalance,
  fixedDeposits,
  onCreateFD,
  onClaimFD
}) => {
  const [amount, setAmount] = useState(5000);
  const [duration, setDuration] = useState(90); // Days
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  
  // Predefined durations in days
  const durations = [
    { label: '3 Months (5.0%)', value: 90 },
    { label: '6 Months (6.5%)', value: 180 },
    { label: '1 Year (7.5%)', value: 365 },
    { label: '2 Years (8.5%)', value: 730 },
    { label: '3+ Years (9.5%)', value: 1095 }
  ];
  
  // Get the interest rate for the selected duration
  const getInterestRate = (durationDays: number) => {
    if (durationDays >= 1095) return 9.5;
    if (durationDays >= 730) return 8.5;
    if (durationDays >= 365) return 7.5;
    if (durationDays >= 180) return 6.5;
    return 5.0;
  };
  
  // Format a timestamp as a date string
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };
  
  // Calculate days remaining until maturity
  const getDaysRemaining = (maturityDate: number) => {
    const now = Date.now();
    const daysRemaining = Math.ceil((maturityDate - now) / (1000 * 60 * 60 * 24));
    return daysRemaining > 0 ? daysRemaining : 0;
  };
  
  // Calculate maturity amount
  const getMaturityAmount = (amount: number, rate: number, durationDays: number) => {
    const durationYears = durationDays / 365;
    const interest = amount * (rate / 100) * durationYears;
    return Math.round(amount + interest);
  };
  
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 0) {
      setAmount(value);
    }
  };
  
  const handleDurationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDuration(parseInt(e.target.value));
  };
  
  const handleCreateFD = () => {
    if (amount <= 0) {
      setMessage('Please enter a valid amount');
      setMessageType('error');
      return;
    }
    
    if (amount > bankBalance) {
      setMessage('Insufficient balance in your account!');
      setMessageType('error');
      return;
    }
    
    const success = onCreateFD(amount, duration);
    if (success) {
      setMessage(`Fixed deposit of ₹${amount.toLocaleString()} created successfully!`);
      setMessageType('success');
    } else {
      setMessage('Failed to create fixed deposit. Please try again.');
      setMessageType('error');
    }
  };
  
  const handleClaimFD = (id: string) => {
    const fd = fixedDeposits.find(d => d.id === id);
    if (!fd) return;
    
    const success = onClaimFD(id);
    if (success) {
      setMessage(`Successfully claimed fixed deposit with interest!`);
      setMessageType('success');
    } else {
      setMessage('Failed to claim fixed deposit. Please try again.');
      setMessageType('error');
    }
  };
  
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-yellow-400">Fixed Deposits</h2>
      
      {/* Create new FD section */}
      <div className="bg-gray-800 rounded-lg p-4 space-y-4">
        <h3 className="font-medium text-yellow-300">Create New Fixed Deposit</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="fd-amount" className="block text-gray-300">Deposit Amount</label>
            <input
              id="fd-amount"
              type="number"
              min="1000"
              value={amount}
              onChange={handleAmountChange}
              className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="fd-duration" className="block text-gray-300">Duration</label>
            <select
              id="fd-duration"
              value={duration}
              onChange={handleDurationChange}
              className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
            >
              {durations.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="bg-gray-700 p-3 rounded-md">
          <div className="text-gray-300">Summary:</div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div className="text-gray-400">Principal Amount:</div>
            <div className="text-yellow-300">₹{amount.toLocaleString()}</div>
            
            <div className="text-gray-400">Interest Rate:</div>
            <div className="text-yellow-300">{getInterestRate(duration)}% per annum</div>
            
            <div className="text-gray-400">Duration:</div>
            <div className="text-yellow-300">{Math.round(duration / 30.44)} months</div>
            
            <div className="text-gray-400">Maturity Date:</div>
            <div className="text-yellow-300">{formatDate(Date.now() + duration * 24 * 60 * 60 * 1000)}</div>
            
            <div className="text-gray-400">Maturity Amount:</div>
            <div className="text-yellow-300 font-semibold">
              ₹{getMaturityAmount(amount, getInterestRate(duration), duration).toLocaleString()}
            </div>
          </div>
        </div>
        
        <button
          onClick={handleCreateFD}
          className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors duration-200"
          disabled={amount > bankBalance}
        >
          Create Fixed Deposit
        </button>
        
        {amount > bankBalance && (
          <div className="text-red-400 text-sm">
            Insufficient balance in your bank account.
          </div>
        )}
      </div>
      
      {/* Existing FDs section */}
      <div className="space-y-4">
        <h3 className="font-medium text-yellow-300">Your Fixed Deposits</h3>
        
        {fixedDeposits.length > 0 ? (
          <div className="space-y-4">
            {fixedDeposits.map(fd => (
              <div 
                key={fd.id} 
                className={`p-4 rounded-md border ${
                  fd.matured 
                    ? 'bg-green-900/30 border-green-700' 
                    : 'bg-gray-800 border-gray-700'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-yellow-300">
                      ₹{fd.amount.toLocaleString()} at {fd.interestRate}%
                    </h4>
                    <div className="text-sm text-gray-400 mt-1">
                      Created on {formatDate(fd.startDate)}
                    </div>
                  </div>
                  
                  {fd.matured ? (
                    <span className="px-2 py-1 text-xs bg-green-800 text-green-300 rounded-full">
                      Matured
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs bg-blue-800 text-blue-300 rounded-full">
                      {getDaysRemaining(fd.maturityDate)} days left
                    </span>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-3 text-sm">
                  <div className="text-gray-400">Maturity Date:</div>
                  <div className="text-white">{formatDate(fd.maturityDate)}</div>
                  
                  <div className="text-gray-400">Duration:</div>
                  <div className="text-white">{Math.round(fd.duration / 30.44)} months</div>
                  
                  <div className="text-gray-400">Maturity Amount:</div>
                  <div className="text-white font-semibold">
                    ₹{getMaturityAmount(fd.amount, fd.interestRate, fd.duration).toLocaleString()}
                  </div>
                </div>
                
                {fd.matured && (
                  <button
                    onClick={() => handleClaimFD(fd.id)}
                    className="mt-3 w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors duration-200"
                  >
                    Claim with Interest
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 bg-gray-800 rounded-md text-gray-400 text-center">
            You don't have any fixed deposits yet. Create one to start earning interest!
          </div>
        )}
      </div>
      
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

export default FixedDepositPanel;