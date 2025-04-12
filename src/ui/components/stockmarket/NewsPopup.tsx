import React, { useState, useEffect } from 'react';

interface Stock {
  id: string;
  name: string;
  currentPrice: number;
  priceHistory: number[];
  debtEquityRatio: number;
  businessGrowth: number;
  news: string[];
}

interface NewsPopupProps {
  stock: Stock;
  onClose: () => void;
}

// News placeholder items when no real news is available
const placeholderNews = [
  "Market analysts remain optimistic about future growth potential.",
  "Company reports stable performance in quarterly review.",
  "Investors maintain confidence in long-term business strategy.",
  "Industry experts predict stable market conditions ahead.",
  "Board of directors approves continuation of existing business plan."
];

const NewsPopup: React.FC<NewsPopupProps> = ({
  stock,
  onClose
}) => {
  // Create a state to hold the news items that will be displayed
  const [displayNews, setDisplayNews] = useState<string[]>([]);

  useEffect(() => {
    // If stock has news, use it; otherwise select a random placeholder
    if (stock.news && stock.news.length > 0) {
      setDisplayNews(stock.news);
    } else {
      // Select a random placeholder news item
      const randomIndex = Math.floor(Math.random() * placeholderNews.length);
      setDisplayNews([placeholderNews[randomIndex]]);
    }
  }, [stock]);

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[60]">
      <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>
      <div className="relative bg-gray-900 p-6 rounded-lg shadow-xl border border-blue-500 max-w-2xl w-full">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <h3 className="text-xl font-semibold text-blue-400 mb-4">
          {stock.name} - Latest News
        </h3>
        
        <div className="space-y-4">
          {displayNews.length > 0 ? (
            <>
              {displayNews.map((item, index) => (
                <div key={index} className="bg-gray-800 p-4 rounded-md border-l-4 border-blue-500">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mr-3">
                      <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                      </svg>
                    </div>
                    <p className="text-gray-300">{item}</p>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    Published: {new Date(Date.now() - Math.random() * 86400000 * 10).toLocaleDateString()}
                  </div>
                </div>
              ))}
              
              <p className="text-sm text-gray-500 mt-3">
                News can significantly impact stock prices. Keep an eye on the latest developments to make informed investment decisions.
              </p>
            </>
          ) : (
            <div className="bg-gray-800 p-4 rounded-md text-center">
              No recent news available for {stock.name}.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewsPopup;