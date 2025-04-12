import React, { useState } from 'react';
import { startGame } from '../../game/game.ts';
import './LandingPage.css';

const LandingPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  const handleJoin = () => {
    if (username.trim().length >= 3) {
      setError('');
      startGame(username.trim());
    } else {
      setError('Username must be at least 3 characters long');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleJoin();
    }
  };

  return (
    <div className="landing-container">
      <div className="join-container pixeloid">
        <h2>Join Dhaniverse</h2>
        <input 
          type="text" 
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter your username" 
          maxLength={15}
          onKeyDown={handleKeyPress}
          autoFocus
          className="pixeloid"
        />
        {error && <div className="error-message">{error}</div>}
        <button type="submit" onClick={handleJoin}>Join Game</button>
      </div>
    </div>
  );
};

export default LandingPage;