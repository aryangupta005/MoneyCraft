import React, { useState, useEffect } from 'react';
import './GameHUD.css';

// Define props interface for type safety
interface GameHUDProps {
  rupees?: number;
}

const GameHUD: React.FC<GameHUDProps> = ({ rupees = 25000 }) => {
  // State can be added here for dynamic HUD elements
  const [currentRupees, setCurrentRupees] = useState(rupees);

  // Listen for events from the game engine (Phaser)
  useEffect(() => {
    // Update rupees when props change
    setCurrentRupees(rupees);

    // Example of how to listen for custom events from Phaser
    const handleRupeeUpdate = (e: CustomEvent) => {
      setCurrentRupees(e.detail.rupees);
    };

    // Add event listener
    window.addEventListener('rupee-update' as any, handleRupeeUpdate);

    // Clean up event listener on unmount
    return () => {
      window.removeEventListener('rupee-update' as any, handleRupeeUpdate);
    };
  }, [rupees]);

  return (
    <div className="game-hud">
      {/* Top right corner for rupee count */}
      <div className="rupee-counter">
        <span className="rupee-symbol">₹</span>
        <span className="rupee-value">{currentRupees}</span>
      </div>
      
      {/* You can add more HUD elements here */}
    </div>
  );
};

export default GameHUD;