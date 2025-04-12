import { Scene, Types, GameObjects } from 'phaser';
import { Player } from '../entities/Player.ts';
import { CollisionManager } from '../systems/CollisionManager.ts';
import { MapManager } from '../systems/MapManager.ts';
import { WebSocketManager } from '../systems/WebSocketManager.ts';
import { NPCManager } from '../systems/NPCManager.ts';
import { BuildingManager } from '../systems/BuildingManager.ts';
import { BankNPCManager } from '../systems/BankNPCManager.ts';
import { StockMarketManager } from '../systems/StockMarketManager.ts';
import { ExtendedCamera } from '../systems/MapManager.ts';

// Scene interface for type safety
export interface MainGameScene extends Scene {
  getGameContainer(): GameObjects.Container;
  getPlayer(): Player;
  getCursors(): Types.Input.Keyboard.CursorKeys;
  mapManager: MapManager;
  getRupees(): number;
  updateRupees(amount: number): void;
}

export class MainScene extends Scene implements MainGameScene {
  private player!: Player;
  private cursors!: Types.Input.Keyboard.CursorKeys;
  private collisionManager!: CollisionManager;
  mapManager!: MapManager;
  private webSocketManager!: WebSocketManager;
  private npcManager!: NPCManager;
  private buildingManager!: BuildingManager;
  private bankNPCManager!: BankNPCManager;
  private stockMarketManager!: StockMarketManager;
  private gameContainer!: GameObjects.Container;
  private wasd!: Record<string, Phaser.Input.Keyboard.Key>;
  private loadingProgress: number = 0;
  private progressBar?: GameObjects.Graphics;
  private progressText?: GameObjects.Text;
  private playerRupees: number = 25000; // Store rupees in the scene
  private _bankingClosedListenerAdded: boolean = false;
  private _stockMarketClosedListenerAdded: boolean = false;

  constructor() {
    super({ key: 'MainScene' });
  }

  preload(): void {
    // Create loading progress bar
    this.createProgressBar();
    
    // Load assets with paths relative to the public directory
    this.load.image('map', '/maps/finalmap.png');
    this.load.image('interior', '/maps/bank.png');
    this.load.image('stockmarket', '/maps/stockmarket.png');
    
    this.load.spritesheet('character', '/characters/orange_browncap_guy.png', { 
      frameWidth: 64,
      frameHeight: 64
    });
    
    this.load.json('collisionData', '/collisions/collisions.json');
    
    // Load the speech bubble sprite sheet with proper dimensions
    this.load.spritesheet('speech_bubble_grey', '/UI/speech_bubble_grey.png', { 
      frameWidth: 64, 
      frameHeight: 64 
    });
    
    // Load sound effects for banking transactions
    this.load.audio('coin-deposit', '/sounds/coin-deposit.mp3');
    this.load.audio('coin-withdraw', '/sounds/coin-withdraw.mp3');
    
    // Track loading progress
    this.load.on('progress', (value: number) => {
      this.loadingProgress = value;
      this.updateProgressBar();
    });

    this.load.on('complete', () => {
      // Remove progress bar when loading is complete
      if (this.progressBar) {
        this.progressBar.destroy();
      }
      if (this.progressText) {
        this.progressText.destroy();
      }
    });
  }

  // Create takes care of establishing game elements
  create(): void {
    // Create game container - all game elements should be added to this container
    this.gameContainer = this.add.container(0, 0);

    // Create map first so it's at the bottom of the rendering order
    this.mapManager = new MapManager(this);
    
    // Setup collisions after map is created
    this.collisionManager = new CollisionManager(this);
    
    // Initialize keyboard controls with null checks
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.wasd = {
        up: this.input.keyboard.addKey('W'),
        down: this.input.keyboard.addKey('S'),
        left: this.input.keyboard.addKey('A'),
        right: this.input.keyboard.addKey('D')
      };
      
      // Additional interaction keys
      this.input.keyboard.addKey('E');
      this.input.keyboard.addKey('ESC');
    }

    // Create player after map and collisions are set up
    const username = this.registry.get('username') || 'Player';
    // Set fixed starting position for better gameplay experience 
    this.player = new Player(this, 800, 800, this.cursors, this.wasd);
    this.gameContainer.add(this.player.getSprite());
    this.gameContainer.add(this.player.getNameText());

    // Add player-dependent managers
    this.buildingManager = new BuildingManager(this);
    this.npcManager = new NPCManager(this);
    this.webSocketManager = new WebSocketManager(this, this.player);
    
    // Initialize the bank NPC manager (will be invisible until player enters the bank)
    this.bankNPCManager = new BankNPCManager(this);

    // Initialize the stock market manager (will be invisible until player enters the stock market)
    this.stockMarketManager = new StockMarketManager(this);
    
    // Connect to WebSocket server for multiplayer
    this.webSocketManager.connect(username);
    
    // Setup camera bounds to prevent showing areas outside the map
    this.setupCameraBounds();
    
    // Setup camera to follow player with smooth follow
    this.cameras.main.startFollow(this.player.getSprite(), true, 0.1, 0.1);
    
    // Set initial zoom and constraints
    const camera = this.cameras.main as ExtendedCamera;
    camera.setZoom(0.7);
    camera.minZoom = 0.25;
    camera.maxZoom = 2.0;
    
    // Enable round pixels to reduce flickering
    this.cameras.main.setRoundPixels(true);

    // Setup mouse wheel zoom
    this.input.on('wheel', (_pointer: Phaser.Input.Pointer, _gameObjects: unknown, _deltaX: number, deltaY: number) => {
      const camera = this.cameras.main as ExtendedCamera;
      const newZoom = camera.zoom + (deltaY > 0 ? -0.1 : 0.1);
      camera.setZoom(Phaser.Math.Clamp(newZoom, camera.minZoom!, camera.maxZoom!));
    });
    
    // Add event listener for banking UI rupee updates
    window.addEventListener('updatePlayerRupees', (event: any) => {
      if (event.detail && typeof event.detail.rupees === 'number') {
        this.playerRupees = event.detail.rupees;
        
        // Import here to avoid circular dependency
        import('../game.ts').then(({ updateGameHUD }) => {
          updateGameHUD(this.playerRupees);
        });
        
        console.log("Game received rupee update:", this.playerRupees);
      }
    });
    
    // Notify game is ready
    this.game.events.emit('ready');
  }

  override update(_time: number, delta: number): void {
    // Delta-based time stepping for consistent movement regardless of framerate
    const deltaFactor = delta / (1000 / 60); // Normalize to 60fps

    // Update player first
    this.player.update(deltaFactor);
    
    // Then update all managers
    this.collisionManager.update();
    this.webSocketManager.update();
    this.npcManager.update();
    this.buildingManager.update();
    this.bankNPCManager.update();
    this.stockMarketManager.update();
  }

  // Method to open the banking UI
  openBankingUI(bankAccount: any): void {
    // Dispatch custom event for the React component to catch
    const bankingEvent = new CustomEvent('openBankingUI', { 
      detail: { 
        playerRupees: this.playerRupees,
        bankAccount: bankAccount
      } 
    });
    window.dispatchEvent(bankingEvent);
    
    // Add event listener for banking UI closed event if not already added
    if (!this._bankingClosedListenerAdded) {
      window.addEventListener('closeBankingUI', () => {
        console.log("Banking UI closed, ending interaction");
        if (this.bankNPCManager) {
          this.bankNPCManager.endBankingInteraction();
        }
      });
      this._bankingClosedListenerAdded = true;
    }
  }
  
  // Method to open the stock market UI
  openStockMarketUI(stocks: any): void {
    // Dispatch custom event for the React component to catch
    const stockMarketEvent = new CustomEvent('openStockMarketUI', { 
      detail: { 
        playerRupees: this.playerRupees,
        stocks: stocks
      } 
    });
    window.dispatchEvent(stockMarketEvent);
    
    // Add event listener for stock market UI closed event if not already added
    if (!this._stockMarketClosedListenerAdded) {
      window.addEventListener('closeStockMarketUI', () => {
        console.log("Stock Market UI closed, ending interaction");
        if (this.stockMarketManager) {
          this.stockMarketManager.endStockMarketInteraction();
        }
      });
      this._stockMarketClosedListenerAdded = true;
    }
  }

  // Method to update rupees count
  updateRupees(amount: number): void {
    // Instead of adding to the current amount, set it directly
    this.playerRupees = amount;
    
    // Import here to avoid circular dependency
    import('../game.ts').then(({ updateGameHUD }) => {
      updateGameHUD(this.playerRupees);
    });
    
    console.log("Game updated rupee count to:", this.playerRupees);
  }

  // Method to get current rupees
  getRupees(): number {
    return this.playerRupees;
  }

  // Method to get player rupees (alias for getRupees to match StockMarketManager usage)
  getPlayerRupees(): number {
    return this.getRupees();
  }
  
  // Method to add rupees to player's current amount
  addPlayerRupees(amount: number): void {
    const newTotal = this.playerRupees + amount;
    this.updateRupees(newTotal);
    
    // Dispatch event to update UI components
    window.dispatchEvent(new CustomEvent('rupee-update', { 
      detail: { 
        rupees: this.playerRupees
      } 
    }));
  }
  
  // Method to deduct rupees from player's current amount
  deductPlayerRupees(amount: number): void {
    const newTotal = Math.max(0, this.playerRupees - amount);
    this.updateRupees(newTotal);
    
    // Dispatch event to update UI components
    window.dispatchEvent(new CustomEvent('rupee-update', { 
      detail: { 
        rupees: this.playerRupees
      } 
    }));
  }

  // Create a loading progress bar
  private createProgressBar(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    // Draw progress bar background
    this.progressBar = this.add.graphics();
    this.progressBar.fillStyle(0x222222, 0.8);
    this.progressBar.fillRect(width / 4, height / 2 - 30, width / 2, 60);
    
    // Add loading text
    this.progressText = this.add.text(width / 2, height / 2 - 50, 'Loading...', {
      fontFamily: 'Arial',
      fontSize: '32px',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    // Initial progress update
    this.updateProgressBar();
  }

  // Update the loading progress bar
  private updateProgressBar(): void {
    if (this.progressBar) {
      // Clear the current progress
      this.progressBar.clear();
      
      // Draw background
      this.progressBar.fillStyle(0x222222, 0.8);
      this.progressBar.fillRect(this.cameras.main.width / 4, this.cameras.main.height / 2 - 30, this.cameras.main.width / 2, 60);
      
      // Draw progress
      this.progressBar.fillStyle(0x00aa00, 1);
      this.progressBar.fillRect(
        this.cameras.main.width / 4 + 10, 
        this.cameras.main.height / 2 - 20, 
        (this.cameras.main.width / 2 - 20) * this.loadingProgress, 
        40
      );
      
      // Update text if needed
      if (this.progressText) {
        this.progressText.setText(`Loading... ${Math.floor(this.loadingProgress * 100)}%`);
      }
    }
  }

  // Public accessors required by the MainGameScene interface
  getGameContainer(): GameObjects.Container {
    return this.gameContainer;
  }

  getPlayer(): Player {
    return this.player;
  }

  getCursors(): Types.Input.Keyboard.CursorKeys {
    return this.cursors;
  }

  // Setup camera bounds to prevent showing areas outside the map
  private setupCameraBounds(): void {
    const mapWidth = this.mapManager.getMapWidth();
    const mapHeight = this.mapManager.getMapHeight();
    this.cameras.main.setBounds(0, 0, mapWidth, mapHeight);
  }
}