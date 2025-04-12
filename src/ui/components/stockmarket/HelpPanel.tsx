import React from 'react';

interface HelpPanelProps {
  onClose: () => void;
}

const HelpPanel: React.FC<HelpPanelProps> = ({
  onClose
}) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-[60]">
      <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>
      <div className="relative bg-gray-900 p-6 rounded-lg shadow-xl border border-blue-500 max-w-3xl w-full">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <h3 className="text-xl font-semibold text-blue-400 mb-4">
          Stock Market Guide
        </h3>
        
        <div className="space-y-6">
          <div className="bg-gray-800 p-4 rounded-md">
            <h4 className="text-lg font-medium text-blue-300 mb-2">Debt-Equity Ratio</h4>
            <p className="text-gray-300">
              The debt-equity ratio measures a company's financial leverage by comparing its total debt to shareholder equity.
            </p>
            <ul className="mt-2 text-sm text-gray-400 list-disc list-inside">
              <li>A lower ratio (0.5-1.0) typically indicates financial stability</li>
              <li>A higher ratio (above 1.5) suggests higher risk but potentially higher returns</li>
              <li>Different industries have different typical ratios</li>
            </ul>
          </div>
          
          <div className="bg-gray-800 p-4 rounded-md">
            <h4 className="text-lg font-medium text-blue-300 mb-2">Business Growth</h4>
            <p className="text-gray-300">
              Business growth shows the percentage increase or decrease in a company's revenue or operations over time.
            </p>
            <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
              <div className="bg-gray-700 p-2 rounded">
                <span className="text-green-400">↑ Positive Growth</span>
                <p className="text-gray-400 mt-1">Indicates company expansion and potential for future earnings.</p>
              </div>
              <div className="bg-gray-700 p-2 rounded">
                <span className="text-red-400">↓ Negative Growth</span>
                <p className="text-gray-400 mt-1">Can signal challenges or industry-wide decline.</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800 p-4 rounded-md">
            <h4 className="text-lg font-medium text-blue-300 mb-2">Company News</h4>
            <p className="text-gray-300">
              News events can have a significant impact on stock prices, both positive and negative.
            </p>
            <ul className="mt-2 text-sm text-gray-400 list-disc list-inside">
              <li>New product launches often drive prices up</li>
              <li>Management changes can create uncertainty</li>
              <li>Industry trends affect all related stocks</li>
              <li>Regulatory changes may impact future profitability</li>
            </ul>
          </div>
          
          <div className="bg-gray-800 p-4 rounded-md">
            <h4 className="text-lg font-medium text-blue-300 mb-2">Stock Price History</h4>
            <p className="text-gray-300">
              Historical price charts help you identify patterns and trends in stock performance.
            </p>
            <ul className="mt-2 text-sm text-gray-400 list-disc list-inside">
              <li>Upward trends may indicate growing investor confidence</li>
              <li>Downward trends might suggest declining performance</li>
              <li>Volatility (large price swings) indicates higher risk</li>
              <li>Past performance is not always indicative of future results</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-6 bg-blue-900/30 p-3 rounded-md text-blue-300 text-sm">
          <div className="flex items-start">
            <div className="flex-shrink-0 mr-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p>
              Remember: Investing in stocks always carries risk. It's recommended to diversify your investments and research thoroughly before making decisions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpPanel;