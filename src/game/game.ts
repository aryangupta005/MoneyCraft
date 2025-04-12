// Add proper type reference directive to ensure browser types are available
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />

import Phaser from 'phaser';
import { MainScene } from './scenes/MainScene.ts';
import { Constants } from './utils/Constants.ts';
import { initializeHUD, updateHUD } from '../main.ts';

let game: Phaser.Game | null = null;
let gameContainer: HTMLElement | null = null;
let loadingText: HTMLElement | null = null;

/**
 * Start game with the provided username
 */
export function startGame(username: string): void {
  // Hide join screen and show game container
  const joinScreen = document.getElementById('join-screen');
  gameContainer = document.getElementById('game-container');
  
  if (joinScreen && gameContainer) {
    joinScreen.style.display = 'none';
    gameContainer.style.display = 'block';
    
    // Create loading indicator
    loadingText = document.createElement('div');
    loadingText.innerHTML = 'Loading game assets...';
    loadingText.style.fontFamily = 'Pixeloid';
    loadingText.style.fontSize = '24px';
    loadingText.style.position = 'absolute';
    loadingText.style.top = '50%';
    loadingText.style.left = '50%';
    loadingText.style.transform = 'translate(-50%, -50%)';
    loadingText.style.color = 'white';
    loadingText.style.fontSize = '24px';
    loadingText.style.fontFamily = 'Arial';
    gameContainer.appendChild(loadingText);

    // Store username in browser storage for persistence
    localStorage.setItem('username', username);
    
    // Configure the game
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: globalThis.innerWidth,
      height: globalThis.innerHeight,
      parent: 'game-container',
      backgroundColor: '#2d2d2d',
      scene: [MainScene],
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: Constants.SHOW_DEBUG_VISUALS
        }
      },
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
      },
      render: {
        pixelArt: false,
        antialias: true, // Turn off antialiasing for pixel art
        powerPreference: 'high-performance' // Request high-performance GPU
      }
    };
    
    // Initialize the game after a short delay to allow DOM to update
    setTimeout(() => {
      game = new Phaser.Game(config);
      
      // Register the username for the game
      game.registry.set('username', username);
      
      // Initialize the React HUD when game is ready
      game.events.once('ready', () => {
        // Initialize HUD with default 25000 rupees
        initializeHUD(25000);
        
        // Remove loading indicator
        if (loadingText && gameContainer) {
          gameContainer.removeChild(loadingText);
          loadingText = null;
        }
      });
    }, 100);
  }
}

/**
 * Stops and destroys the current game instance
 */
export function stopGame(): void {
  if (game) {
    game.destroy(true);
    game = null;
  }
}

// Expose updateHUD for MainScene to use
export function updateGameHUD(rupees: number): void {
  updateHUD(rupees);
}

// Handle window resizing
globalThis.addEventListener('resize', () => {
  if (game) {
    game.scale.resize(globalThis.innerWidth, globalThis.innerHeight);
  }
});