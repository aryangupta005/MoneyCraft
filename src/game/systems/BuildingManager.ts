import { GameObjects, Input } from 'phaser';
import { Constants } from '../utils/Constants.ts';
import { MainGameScene } from '../scenes/MainScene.ts';

export class BuildingManager {
  private scene: MainGameScene;
  private buildingEntrance: { x: number, y: number };
  private stockMarketEntrance: { x: number, y: number };
  private buildingInteractionText: GameObjects.Text;
  private stockMarketInteractionText: GameObjects.Text;
  private interactionKey: Input.Keyboard.Key | null = null;
  private spaceKey: Input.Keyboard.Key | null = null;
  private enterKey: Input.Keyboard.Key | null = null;
  private escKey: Input.Keyboard.Key | null = null;
  private isNearBuilding: boolean = false;
  private isNearStockMarket: boolean = false;
  private transitionInProgress: boolean = false;

  constructor(scene: MainGameScene) {
    this.scene = scene;
    this.buildingEntrance = { x: 9383, y: 6087 };
    this.stockMarketEntrance = { x: 2565, y: 3550 }; // Stock market building entrance
    
    // Initialize buildingInteractionText with improved visual style
    this.buildingInteractionText = scene.add.text(
      this.buildingEntrance.x, 
      this.buildingEntrance.y - 50, 
      "Press E to enter", 
      {
        fontFamily: 'Arial',
        fontSize: '16px',
        color: '#ffffff',
        align: 'center',
        backgroundColor: '#00000080',
        padding: { x: 8, y: 4 },
        shadow: {
          offsetX: 1,
          offsetY: 1,
          color: '#000000',
          blur: 3,
          fill: true
        }
      }
    ).setOrigin(0.5).setAlpha(0);
    
    // Add stock market interaction text
    this.stockMarketInteractionText = scene.add.text(
      this.stockMarketEntrance.x, 
      this.stockMarketEntrance.y - 50, 
      "Press E to enter Stock Market", 
      {
        fontFamily: 'Arial',
        fontSize: '16px',
        color: '#ffffff',
        align: 'center',
        backgroundColor: '#00000080',
        padding: { x: 8, y: 4 },
        shadow: {
          offsetX: 1,
          offsetY: 1,
          color: '#000000',
          blur: 3,
          fill: true
        }
      }
    ).setOrigin(0.5).setAlpha(0);
    
    // Setup keys for interaction with null checks
    if (scene.input.keyboard) {
      this.interactionKey = scene.input.keyboard.addKey('E');
      this.spaceKey = scene.input.keyboard.addKey('SPACE');
      this.enterKey = scene.input.keyboard.addKey('ENTER');
      this.escKey = scene.input.keyboard.addKey('ESC');
    }
    
    this.setupBuilding();
  }

  update(): void {
    // Skip update if transition is in progress
    if (this.transitionInProgress) return;
    
    this.handleBuildingInteraction();
    this.handleStockMarketInteraction();
  }

  private setupBuilding(): void {
    const gameContainer = this.scene.getGameContainer();
    if (gameContainer) {
      gameContainer.add(this.buildingInteractionText);
      gameContainer.add(this.stockMarketInteractionText);
    }
  }

  private handleBuildingInteraction(): void {
    const player = this.scene.getPlayer();
    const mapManager = this.scene.mapManager;
    if (!player || !mapManager) return;
    
    // Get player position
    const playerPos = player.getPosition();
    
    // If player is in building, check for ESC to exit
    if (mapManager.isPlayerInBuilding() && this.escKey && Phaser.Input.Keyboard.JustDown(this.escKey)) {
      this.exitBuilding();
      return;
    }
    
    // Calculate distance between player and building entrance
    const dx = playerPos.x - this.buildingEntrance.x;
    const dy = playerPos.y - this.buildingEntrance.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Check if player is within interaction distance
    const wasNearBuilding = this.isNearBuilding;
    this.isNearBuilding = distance <= Constants.BUILDING_INTERACTION_DISTANCE;
    
    // Only react to changes in proximity or handle interaction when near building
    if (this.isNearBuilding !== wasNearBuilding) {
      if (this.isNearBuilding && !mapManager.isPlayerInBuilding()) {
        // Player just entered interaction zone - show text with fade in
        this.scene.tweens.add({
          targets: this.buildingInteractionText,
          alpha: 1,
          duration: 200,
          ease: 'Power1'
        });
      } else if (!mapManager.isPlayerInBuilding()) {
        // Player just left interaction zone - hide text with fade out
        this.scene.tweens.add({
          targets: this.buildingInteractionText,
          alpha: 0,
          duration: 200,
          ease: 'Power1'
        });
      }
    }
    
    // Check for key press to enter building when near (now supports E, Space, or Enter)
    if (this.isNearBuilding && 
        !mapManager.isPlayerInBuilding() && 
        ((this.interactionKey && Phaser.Input.Keyboard.JustDown(this.interactionKey)) ||
         (this.spaceKey && Phaser.Input.Keyboard.JustDown(this.spaceKey)) ||
         (this.enterKey && Phaser.Input.Keyboard.JustDown(this.enterKey)))) {
      this.enterBuilding('bank');
    }
    
    // Update interaction text position to follow entrance point
    if (this.buildingInteractionText) {
      this.buildingInteractionText.x = this.buildingEntrance.x;
      this.buildingInteractionText.y = this.buildingEntrance.y - 50;
    }
  }
  
  private handleStockMarketInteraction(): void {
    const player = this.scene.getPlayer();
    const mapManager = this.scene.mapManager;
    if (!player || !mapManager) return;
    
    // Get player position
    const playerPos = player.getPosition();
    
    // Calculate distance between player and stock market entrance
    const dx = playerPos.x - this.stockMarketEntrance.x;
    const dy = playerPos.y - this.stockMarketEntrance.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Check if player is within interaction distance
    const wasNearStockMarket = this.isNearStockMarket;
    this.isNearStockMarket = distance <= Constants.BUILDING_INTERACTION_DISTANCE;
    
    // Only react to changes in proximity or handle interaction when near stock market
    if (this.isNearStockMarket !== wasNearStockMarket) {
      if (this.isNearStockMarket && !mapManager.isPlayerInBuilding()) {
        // Player just entered interaction zone - show text with fade in
        this.scene.tweens.add({
          targets: this.stockMarketInteractionText,
          alpha: 1,
          duration: 200,
          ease: 'Power1'
        });
      } else if (!mapManager.isPlayerInBuilding()) {
        // Player just left interaction zone - hide text with fade out
        this.scene.tweens.add({
          targets: this.stockMarketInteractionText,
          alpha: 0,
          duration: 200,
          ease: 'Power1'
        });
      }
    }
    
    // Check for key press to enter stock market when near
    if (this.isNearStockMarket && 
        !mapManager.isPlayerInBuilding() && 
        ((this.interactionKey && Phaser.Input.Keyboard.JustDown(this.interactionKey)) ||
         (this.spaceKey && Phaser.Input.Keyboard.JustDown(this.spaceKey)) ||
         (this.enterKey && Phaser.Input.Keyboard.JustDown(this.enterKey)))) {
      this.enterBuilding('stockmarket');
    }
    
    // Update interaction text position to follow entrance point
    if (this.stockMarketInteractionText) {
      this.stockMarketInteractionText.x = this.stockMarketEntrance.x;
      this.stockMarketInteractionText.y = this.stockMarketEntrance.y - 50;
    }
  }

  private enterBuilding(buildingType: 'bank' | 'stockmarket' = 'bank'): void {
    const player = this.scene.getPlayer();
    const mapManager = this.scene.mapManager;
    if (!player || !mapManager || this.transitionInProgress) return;
    
    // Set transition in progress to prevent multiple transitions
    this.transitionInProgress = true;
    
    // Hide interaction texts immediately
    this.buildingInteractionText.setAlpha(0);
    this.stockMarketInteractionText.setAlpha(0);
    
    // Get current player position
    const playerPos = player.getPosition();
    
    // Instantly enter building through map manager
    const newPosition = mapManager.enterBuilding(playerPos.x, playerPos.y, buildingType);
    
    // Instantly move player to new position
    if (newPosition) {
      const sprite = player.getSprite();
      sprite.x = newPosition.x;
      sprite.y = newPosition.y;
      
      // Stop following and center camera immediately
      this.scene.cameras.main.stopFollow();
      this.scene.cameras.main.centerOn(newPosition.x, newPosition.y);
      
      // Resume camera follow
      this.scene.cameras.main.startFollow(sprite, true, 0.9, 0.9);
      
      // Clear transition flag after a short delay
      this.scene.time.delayedCall(50, () => {
        this.transitionInProgress = false;
      });
    } else {
      this.transitionInProgress = false;
    }
    
    // Play sound effect if available
    try {
      if (this.scene.sound && this.scene.cache.audio.exists('door-open')) {
        const doorSound = this.scene.sound.add('door-open', { volume: 0.5 });
        doorSound.play();
      }
    } catch (error) {
      console.warn('Could not play door-open sound:', error);
    }
    
    // Notify the BankNPCManager or StockMarketManager that we've entered a building
    const mainScene = this.scene as any;
    
    if (buildingType === 'bank') {
      // Handle bank building entrance
      if (mainScene.bankNPCManager && typeof mainScene.bankNPCManager.onEnterBuilding === 'function') {
        mainScene.bankNPCManager.onEnterBuilding('bank');
        
        // Force the banking UI to be active container
        document.getElementById('banking-ui-container')?.classList.add('active');
        
        // Ensure playerRupees is available for the banking UI
        if (mainScene.playerRupees !== undefined) {
          // Manually trigger the banking UI to open with current bank account data
          this.scene.time.delayedCall(300, () => {
            if (mainScene.bankNPCManager) {
              const bankAccount = mainScene.bankNPCManager.getBankAccountData();
              mainScene.openBankingUI(bankAccount);
            }
          });
        }
      }
    } else if (buildingType === 'stockmarket') {
      // Handle stock market building entrance
      if (mainScene.stockMarketManager && typeof mainScene.stockMarketManager.onEnterBuilding === 'function') {
        mainScene.stockMarketManager.onEnterBuilding('stockmarket');
        
        // Force the stock market UI to be active container
        document.getElementById('stock-market-ui-container')?.classList.add('active');
        
        // Trigger the stock market UI to open
        this.scene.time.delayedCall(300, () => {
          if (mainScene.stockMarketManager) {
            // Fixed: Changed getStocksData to getStockMarketData to match the method name in StockMarketManager
            const stocksData = mainScene.stockMarketManager.getStockMarketData();
            mainScene.openStockMarketUI(stocksData);
          }
        });
      }
    }
  }

  private exitBuilding(): void {
    const player = this.scene.getPlayer();
    const mapManager = this.scene.mapManager;
    if (!player || !mapManager || this.transitionInProgress) return;
    
    // Set transition in progress
    this.transitionInProgress = true;
    
    // Exit building through map manager
    const outdoorPosition = mapManager.exitBuilding();
    
    // Instantly move player to last outdoor position
    if (outdoorPosition) {
      const sprite = player.getSprite();
      sprite.x = outdoorPosition.x;
      sprite.y = outdoorPosition.y;
      
      // Stop following and center camera immediately
      this.scene.cameras.main.stopFollow();
      this.scene.cameras.main.centerOn(outdoorPosition.x, outdoorPosition.y);
      
      // Resume camera follow with slight smoothness
      this.scene.cameras.main.startFollow(sprite, true, 0.9, 0.9);
      
      // Clear transition flag after a short delay
      this.scene.time.delayedCall(50, () => {
        this.transitionInProgress = false;
      });
    } else {
      this.transitionInProgress = false;
    }
    
    // Notify NPCManagers that we're exiting the building
    const mainScene = this.scene as any;
    if (mainScene.bankNPCManager && typeof mainScene.bankNPCManager.onExitBuilding === 'function') {
      mainScene.bankNPCManager.onExitBuilding();
    }
    if (mainScene.stockMarketManager && typeof mainScene.stockMarketManager.onExitBuilding === 'function') {
      mainScene.stockMarketManager.onExitBuilding();
    }
    
    // Play sound effect if available
    try {
      if (this.scene.sound && this.scene.cache.audio.exists('door-close')) {
        const doorSound = this.scene.sound.add('door-close', { volume: 0.5 });
        doorSound.play();
      }
    } catch (error) {
      console.warn('Could not play door-close sound:', error);
    }
  }
  
  // Public getter for building entrance position
  getBuildingEntrancePosition(): { x: number, y: number } {
    return this.buildingEntrance;
  }
  
  // Public getter for stock market entrance position
  getStockMarketEntrancePosition(): { x: number, y: number } {
    return this.stockMarketEntrance;
  }
}