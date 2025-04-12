import React from 'react';
import LandingPage from './components/LandingPage';

const App: React.FC = () => {
  return (
    <>
      <LandingPage />
      {/* BankingUI is now mounted separately in its own container */}
    </>
  );
};

export default App;