import { GameObjects, Input } from 'phaser';
import { MainScene } from '../scenes/MainScene';
import { Constants } from '../utils/Constants';

interface NPCSprite extends GameObjects.Sprite {
  nameText?: GameObjects.Text;
}

// Enhanced Stock interface with more realistic properties
interface Stock {
  id: string;
  name: string;
  sector: string;
  currentPrice: number;
  priceHistory: number[];
  debtEquityRatio: number;
  businessGrowth: number;
  news: string[];
  volatility: number;     // How much the price tends to fluctuate
  lastUpdate: number;     // Timestamp of last price update
  // New financial metrics
  marketCap: number;      // Total market value (price * outstanding shares)
  peRatio: number;        // Price-to-Earnings ratio
  eps: number;            // Earnings Per Share
  outstandingShares: number; // Number of shares available to the public
  industryAvgPE: number;  // Industry average P/E ratio for comparison
}

// Market status interface to track overall market conditions
interface MarketStatus {
  isOpen: boolean;        // Whether the market is currently open
  trend: 'bull' | 'bear' | 'neutral'; // Overall market trend
  volatility: number;     // Overall market volatility
  nextOpenTime: number;   // Next time the market will open
  nextCloseTime: number;  // Next time the market will close
}

// Player's portfolio to track owned stocks
interface StockHolding {
  stockId: string;
  quantity: number;
  averagePurchasePrice: number;
  totalInvestment: number;
}

interface PlayerPortfolio {
  holdings: StockHolding[];
  transactionHistory: StockTransaction[];
}

// Transaction history
interface StockTransaction {
  stockId: string;
  stockName: string;
  type: 'buy' | 'sell';
  price: number;
  quantity: number;
  timestamp: number;
  total: number;
}

export class StockMarketManager {
  private scene: MainScene;
  private broker: NPCSprite;
  private interactionKey: Input.Keyboard.Key | null = null;
  private readonly interactionDistance: number = 150;
  private interactionText: GameObjects.Text;
  private isPlayerNearBroker: boolean = false;
  private activeDialog: boolean = false;
  private speechBubble: GameObjects.Sprite | null = null;
  private stockData: Stock[];
  private newsItems: Record<string, string[]>;
  
  // New properties for enhanced stock market simulation
  private marketStatus: MarketStatus;
  private playerPortfolio: PlayerPortfolio;
  private marketTimerText: GameObjects.Text;
  private sectorInfluence: Record<string, number> = {}; // Sector-wide influences
  private marketEvents: string[]; // Global market events
  private lastRandomEvent: number = 0; // Timestamp of last random event
  private updateInterval: number = 15000; // 15 seconds between updates (faster for gameplay)
  
  // Market hours (game time)
  private readonly MARKET_OPEN_HOUR: number = 9;  // 9 AM
  private readonly MARKET_CLOSE_HOUR: number = 16; // 4 PM
  private readonly MILLISECONDS_PER_HOUR: number = 60000; // 1 minute real time = 1 hour game time

  constructor(scene: MainScene) {
    this.scene = scene;
    
    // Setup interaction key with null check
    if (scene.input.keyboard) {
      this.interactionKey = scene.input.keyboard.addKey('E');
    }
    
    // Initialize market status with a default value to satisfy TypeScript
    this.marketStatus = {
      isOpen: false,
      trend: 'neutral',
      volatility: 1.0,
      nextOpenTime: Date.now(),
      nextCloseTime: Date.now()
    };
    
    // Then properly initialize it
    this.initializeMarketStatus();
    
    // Initialize player portfolio
    this.playerPortfolio = {
      holdings: [],
      transactionHistory: []
    };
    
    // Initialize sector influences
    this.initializeSectorInfluences();
    
    // Initialize market events
    this.marketEvents = this.setupMarketEvents();
    
    // Initialize mock stock data
    this.stockData = this.generateInitialStockData();
    
    // Initialize news database
    this.newsItems = this.setupNewsDatabase();
    
    // Create broker NPC at predefined position (will be moved by game system)
    const brokerX = 800;
    const brokerY = 600;
    this.broker = scene.add.sprite(brokerX, brokerY, 'character') as NPCSprite;
    this.broker.setScale(5);
    this.broker.anims.play('idle-down');
    
    // Add broker name text
    const brokerNameText = scene.add.text(this.broker.x, this.broker.y - 50, "Stock Broker", {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#00ffff',
      align: 'center',
      backgroundColor: '#00000080',
      padding: { x: 4, y: 2 }
    }).setOrigin(0.5);
    
    // Add interaction text (initially hidden)
    this.interactionText = scene.add.text(this.broker.x, this.broker.y - 80, "Press E to interact", {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#ffffff',
      align: 'center',
      backgroundColor: '#00000080',
      padding: { x: 8, y: 4 }
    }).setOrigin(0.5).setAlpha(0).setScrollFactor(0).setDepth(100);
    
    // Add market timer text
    this.marketTimerText = scene.add.text(this.broker.x, this.broker.y + 30, "", {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#ffffff',
      align: 'center',
      backgroundColor: '#00000080',
      padding: { x: 6, y: 3 }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(100);
    
    // Add to game container
    const gameContainer = scene.getGameContainer();
    if (gameContainer) {
      gameContainer.add(this.broker);
      gameContainer.add(brokerNameText);
      gameContainer.add(this.interactionText);
      gameContainer.add(this.marketTimerText);
      this.broker.nameText = brokerNameText;
    }
    
    // Hide the broker initially - will show only in the stock market
    this.toggleVisibility(false);
    
    // Setup speech bubble animations
    this.setupSpeechBubbleAnimations();
    
    console.log("Stock Market NPC created at position:", brokerX, brokerY);
    
    // Start the stock price simulation with a faster update interval
    this.simulateStockPrices();
  }
  
  private setupSpeechBubbleAnimations(): void {
    // Create speech bubble for NPC dialog (initially hidden)
    this.speechBubble = this.scene.add.sprite(this.broker.x, this.broker.y - 70, 'speech-bubble');
    this.speechBubble.setVisible(false);
    this.speechBubble.setDepth(100);
    this.speechBubble.setScale(0.1);
    this.speechBubble.setAlpha(0);
    
    // Add to game container
    const gameContainer = this.scene.getGameContainer();
    if (gameContainer && this.speechBubble) {
      gameContainer.add(this.speechBubble);
    }
  }

  /**
   * Initialize market status and set up initial market conditions
   */
  private initializeMarketStatus(): void {
    // Randomly determine initial market trend
    const trends: ('bull' | 'bear' | 'neutral')[] = ['bull', 'bear', 'neutral'];
    const randomTrend = trends[Math.floor(Math.random() * trends.length)];
    
    const now = Date.now();
    const currentHour = new Date().getHours();
    
    // Determine if market should be open based on game time
    const isMarketHours = currentHour >= this.MARKET_OPEN_HOUR && currentHour < this.MARKET_CLOSE_HOUR;
    
    // Calculate next open/close times
    let nextOpenTime: number;
    let nextCloseTime: number;
    
    if (isMarketHours) {
      // Market is currently open, calculate today's close time and tomorrow's open time
      const today = new Date();
      today.setHours(this.MARKET_CLOSE_HOUR, 0, 0, 0);
      nextCloseTime = today.getTime();
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(this.MARKET_OPEN_HOUR, 0, 0, 0);
      nextOpenTime = tomorrow.getTime();
    } else {
      // Market is closed, calculate next open time
      const nextOpen = new Date();
      if (currentHour >= this.MARKET_CLOSE_HOUR) {
        // It's after closing today, open tomorrow
        nextOpen.setDate(nextOpen.getDate() + 1);
      }
      nextOpen.setHours(this.MARKET_OPEN_HOUR, 0, 0, 0);
      nextOpenTime = nextOpen.getTime();
      
      // Calculate next close time after the open
      const nextClose = new Date(nextOpenTime);
      nextClose.setHours(this.MARKET_CLOSE_HOUR, 0, 0, 0);
      nextCloseTime = nextClose.getTime();
    }
    
    // For gameplay purposes, scale times to be much shorter
    const scaleFactor = 60; // Make time pass 60x faster for gameplay
    const timeToNextOpen = (nextOpenTime - now) / scaleFactor;
    const timeToNextClose = (nextCloseTime - now) / scaleFactor;
    
    nextOpenTime = now + timeToNextOpen;
    nextCloseTime = now + timeToNextClose;
    
    // Set up market status
    this.marketStatus = {
      isOpen: isMarketHours,
      trend: randomTrend,
      volatility: 1.0 + Math.random(), // Base volatility between 1.0 and 2.0
      nextOpenTime: nextOpenTime,
      nextCloseTime: nextCloseTime
    };
    
    console.log(`Market initialized: ${isMarketHours ? 'OPEN' : 'CLOSED'}, Trend: ${randomTrend}`);
    
    // Schedule market open/close events
    this.scheduleMarketStatusChanges();
  }
  
  /**
   * Initialize sector-specific influences
   */
  private initializeSectorInfluences(): void {
    // Set up initial sector influences (these will change over time)
    this.sectorInfluence = {
      'Technology': 1 + (Math.random() * 0.4 - 0.2), // 0.8 to 1.2 multiplier
      'Energy': 1 + (Math.random() * 0.4 - 0.2),
      'Finance': 1 + (Math.random() * 0.4 - 0.2),
      'Healthcare': 1 + (Math.random() * 0.4 - 0.2),
      'Consumer': 1 + (Math.random() * 0.4 - 0.2)
    };
  }
  
  /**
   * Setup a database of market events that can affect multiple stocks
   */
  private setupMarketEvents(): string[] {
    return [
      "Central bank raises interest rates by 0.5%",
      "Government announces new tech industry regulations",
      "International trade tensions escalate",
      "Energy prices surge due to global supply constraints",
      "Major cybersecurity breach affects multiple companies",
      "Economic growth exceeds expectations",
      "Currency value fluctuates significantly",
      "Unexpected inflation data released",
      "Healthcare reform bill passes legislature",
      "Major natural disaster disrupts supply chains"
    ];
  }
  
  /**
   * Schedule events to change market open/close status
   */
  private scheduleMarketStatusChanges(): void {
    // Proper way to handle delayed calls in Phaser 3
    this.scene.time.removeAllEvents(); // Clear any existing timers related to market events
    
    const now = Date.now();
    
    // Schedule market open
    if (!this.marketStatus.isOpen) {
      const timeToOpen = this.marketStatus.nextOpenTime - now;
      if (timeToOpen > 0) {
        this.scene.time.delayedCall(timeToOpen, this.openMarket, [], this);
        console.log(`Market will open in ${Math.round(timeToOpen / 1000)} seconds`);
      }
    }
    
    // Schedule market close
    if (this.marketStatus.isOpen) {
      const timeToClose = this.marketStatus.nextCloseTime - now;
      if (timeToClose > 0) {
        this.scene.time.delayedCall(timeToClose, this.closeMarket, [], this);
        console.log(`Market will close in ${Math.round(timeToClose / 1000)} seconds`);
      }
    }
  }
  
  /**
   * Open the market
   */
  private openMarket(): void {
    this.marketStatus.isOpen = true;
    console.log("Market is now OPEN");
    
    // Generate a market event on opening (30% chance)
    if (Math.random() < 0.3) {
      this.generateMarketEvent();
    }
    
    // Calculate next close time
    const nextClose = Date.now() + (this.MILLISECONDS_PER_HOUR * (this.MARKET_CLOSE_HOUR - this.MARKET_OPEN_HOUR));
    this.marketStatus.nextCloseTime = nextClose;
    
    // Schedule market close
    const timeToClose = nextClose - Date.now();
    this.scene.time.delayedCall(timeToClose, this.closeMarket, [], this);
    
    // Update market timer text
    this.updateMarketTimerText();
    
    // Update sector influences for the day
    this.updateSectorInfluences();
    
    // If market UI is open, update it with new status
    this.updateMarketUI();
  }
  
  /**
   * Close the market
   */
  private closeMarket(): void {
    this.marketStatus.isOpen = false;
    console.log("Market is now CLOSED");
    
    // Calculate next open time (next day)
    const now = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(this.MARKET_OPEN_HOUR, 0, 0, 0);
    
    // Scale for gameplay
    const scaleFactor = 60;
    const realTimeToNextOpen = (tomorrow.getTime() - now.getTime()) / scaleFactor;
    
    this.marketStatus.nextOpenTime = Date.now() + realTimeToNextOpen;
    
    // Schedule market open
    this.scene.time.delayedCall(realTimeToNextOpen, this.openMarket, [], this);
    
    // Update market timer text
    this.updateMarketTimerText();
    
    // Occasionally change market trend overnight (25% chance)
    if (Math.random() < 0.25) {
      const trends: ('bull' | 'bear' | 'neutral')[] = ['bull', 'bear', 'neutral'];
      this.marketStatus.trend = trends[Math.floor(Math.random() * trends.length)];
      console.log(`Market trend changed to ${this.marketStatus.trend}`);
    }
    
    // Update market UI if open
    this.updateMarketUI();
  }
  
  /**
   * Update the market timer text
   */
  private updateMarketTimerText(): void {
    if (!this.marketTimerText) return;
    
    const now = Date.now();
    let timeString: string;
    let color: string;
    
    if (this.marketStatus.isOpen) {
      const timeToClose = Math.max(0, this.marketStatus.nextCloseTime - now);
      const minutesToClose = Math.ceil(timeToClose / 60000);
      timeString = `Market: OPEN (Closes in ${minutesToClose} mins)`;
      color = '#4ade80'; // Green
    } else {
      const timeToOpen = Math.max(0, this.marketStatus.nextOpenTime - now);
      const minutesToOpen = Math.ceil(timeToOpen / 60000);
      timeString = `Market: CLOSED (Opens in ${minutesToOpen} mins)`;
      color = '#f87171'; // Red
    }
    
    // Add trend indicator
    const trendIndicator = this.marketStatus.trend === 'bull' ? '↑' : 
                          this.marketStatus.trend === 'bear' ? '↓' : '→';
    
    const trendColor = this.marketStatus.trend === 'bull' ? '#4ade80' : 
                      this.marketStatus.trend === 'bear' ? '#f87171' : '#94a3b8';
                      
    timeString += ` | Trend: ${trendIndicator}`;
    
    this.marketTimerText.setText(timeString);
    this.marketTimerText.setColor(color);
    
    // Make sure timer text is visible when broker is visible
    if (this.broker.visible) {
      this.marketTimerText.setAlpha(1);
      this.marketTimerText.setPosition(this.broker.x, this.broker.y + 30);
    } else {
      this.marketTimerText.setAlpha(0);
    }
  }
  
  /**
   * Update sector influences (internal economic factors)
   */
  private updateSectorInfluences(): void {
    Object.keys(this.sectorInfluence).forEach(sector => {
      // Adjust sector influence by small random amount
      const change = (Math.random() * 0.2) - 0.1; // -0.1 to +0.1
      this.sectorInfluence[sector] = Math.max(0.5, Math.min(1.5, this.sectorInfluence[sector] + change));
      console.log(`Sector ${sector} influence updated to ${this.sectorInfluence[sector].toFixed(2)}`);
    });
  }
  
  /**
   * Generate random market event that affects multiple stocks
   */
  private generateMarketEvent(): void {
    // Limit frequency of market events
    const now = Date.now();
    if (now - this.lastRandomEvent < 300000) { // No more than one event every 5 minutes
      return;
    }
    
    // Select random event
    const eventIndex = Math.floor(Math.random() * this.marketEvents.length);
    const event = this.marketEvents[eventIndex];
    
    console.log(`Market Event: ${event}`);
    this.lastRandomEvent = now;
    
    // Determine which sectors are affected
    const affectedSectors: string[] = [];
    
    // Map event to sectors (simplified logic)
    if (event.includes('tech')) {
      affectedSectors.push('Technology');
    }
    if (event.includes('energy') || event.includes('supply chain')) {
      affectedSectors.push('Energy');
    }
    if (event.includes('interest rates') || event.includes('economic') || event.includes('inflation')) {
      affectedSectors.push('Finance');
    }
    if (event.includes('healthcare')) {
      affectedSectors.push('Healthcare');
    }
    
    // If no specific sectors found, affect all sectors
    if (affectedSectors.length === 0) {
      affectedSectors.push('Technology', 'Energy', 'Finance', 'Healthcare', 'Consumer');
    }
    
    // Apply market event effects to stocks in affected sectors
    this.applyMarketEventToStocks(event, affectedSectors);
  }
  
  /**
   * Apply market event effects to stocks
   */
  private applyMarketEventToStocks(event: string, affectedSectors: string[]): void {
    // Determine if event is positive or negative
    let impactDirection = 0;
    
    if (event.includes('exceeds expectations') || event.includes('passes') || event.includes('surge')) {
      impactDirection = 1; // positive
    } else if (event.includes('breach') || event.includes('tensions') || event.includes('disaster') || 
               event.includes('constraints') || event.includes('raises')) {
      impactDirection = -1; // negative
    }
    
    // If direction is still neutral, randomly decide
    if (impactDirection === 0) {
      impactDirection = Math.random() > 0.5 ? 1 : -1;
    }
    
    // Calculate impact magnitude based on event significance
    const impactBase = 3 + Math.random() * 7; // 3-10% base impact
    
    // Apply to affected stocks
    this.stockData.forEach(stock => {
      if (affectedSectors.includes(stock.sector)) {
        // Calculate stock-specific impact with some randomization
        const stockImpact = impactDirection * impactBase * (0.8 + Math.random() * 0.4);
        
        // Apply price change
        const priceChange = stock.currentPrice * (stockImpact / 100);
        stock.currentPrice = Math.max(1, stock.currentPrice + priceChange);
        
        // Add event as news
        const newsItem = `${event}. Impact on ${stock.name}: ${impactDirection > 0 ? 'Positive' : 'Negative'}.`;
        if (!stock.news.includes(newsItem)) {
          stock.news.unshift(newsItem);
          if (stock.news.length > 3) {
            stock.news.pop();
          }
        }
      }
    });
    
    // Update UI if open
    this.updateMarketUI();
  }
  
  /**
   * Update the market UI if it's currently open
   */
  private updateMarketUI(): void {
    if (this.activeDialog) {
      // Dispatch event to update the UI
      window.dispatchEvent(new CustomEvent('updateStockMarketUI', {
        detail: {
          stocks: this.stockData,
          marketStatus: this.marketStatus
        }
      }));
    }
  }

  /**
   * Generate initial stock data for the market
   */
  private generateInitialStockData(): Stock[] {
    return [
      {
        id: 'technova',
        name: 'TechNova',
        sector: 'Technology',
        currentPrice: 1500,
        priceHistory: Array.from({ length: 15 }, 
          (_, i) => 1500 + Math.random() * 300 - 150),
        debtEquityRatio: 0.7,
        businessGrowth: 4.2,
        news: [],
        volatility: 1.5,
        lastUpdate: Date.now(),
        marketCap: 1500000000,
        peRatio: 25,
        eps: 60,
        outstandingShares: 1000000,
        industryAvgPE: 20
      },
      {
        id: 'greenedge',
        name: 'GreenEdge',
        sector: 'Energy',
        currentPrice: 850,
        priceHistory: Array.from({ length: 15 }, 
          (_, i) => 850 + Math.random() * 200 - 100),
        debtEquityRatio: 1.2,
        businessGrowth: 2.8,
        news: [],
        volatility: 2.0,
        lastUpdate: Date.now(),
        marketCap: 850000000,
        peRatio: 18,
        eps: 47.22,
        outstandingShares: 1000000,
        industryAvgPE: 15
      },
      {
        id: 'bytex',
        name: 'ByteX',
        sector: 'Technology',
        currentPrice: 3200,
        priceHistory: Array.from({ length: 15 }, 
          (_, i) => 3200 + Math.random() * 600 - 300),
        debtEquityRatio: 0.5,
        businessGrowth: -1.3,
        news: [],
        volatility: 3.0,
        lastUpdate: Date.now(),
        marketCap: 3200000000,
        peRatio: 30,
        eps: 106.67,
        outstandingShares: 1000000,
        industryAvgPE: 20
      },
      {
        id: 'solarsphere',
        name: 'SolarSphere',
        sector: 'Energy',
        currentPrice: 620,
        priceHistory: Array.from({ length: 15 }, 
          (_, i) => 620 + Math.random() * 150 - 75),
        debtEquityRatio: 1.8,
        businessGrowth: 6.5,
        news: [],
        volatility: 1.8,
        lastUpdate: Date.now(),
        marketCap: 620000000,
        peRatio: 12,
        eps: 51.67,
        outstandingShares: 1000000,
        industryAvgPE: 15
      }
    ];
  }

  /**
   * Setup a database of possible news items for each stock
   */
  private setupNewsDatabase(): Record<string, string[]> {
    return {
      technova: [
        "TechNova announces new AI platform, expected to boost revenues by 15%.",
        "TechNova's CEO steps down unexpectedly, interim CEO appointed.",
        "TechNova reports quarterly earnings above analyst expectations.",
        "TechNova acquires promising startup for ₹500 million.",
        "TechNova faces patent infringement lawsuit from competitor."
      ],
      greenedge: [
        "GreenEdge secures government contract for sustainable energy project.",
        "GreenEdge's new solar panel achieves 30% higher efficiency.",
        "GreenEdge expands operations to three new countries.",
        "Regulatory changes pose challenges for GreenEdge's main product line.",
        "GreenEdge partners with major tech company for smart energy solutions."
      ],
      bytex: [
        "ByteX launches revolutionary quantum computing service, stock surges.",
        "ByteX's cloud platform experiences major outage affecting thousands.",
        "ByteX reports disappointing quarterly results due to increased competition.",
        "ByteX announces stock buyback program of ₹2 billion.",
        "ByteX's new encryption algorithm receives industry acclaim."
      ],
      solarsphere: [
        "SolarSphere's new manufacturing process cuts costs by 22%.",
        "SolarSphere begins construction on world's largest solar farm.",
        "SolarSphere forms strategic partnership with major utility provider.",
        "SolarSphere's CFO resigns amid accounting concerns.",
        "SolarSphere wins environmental innovation award for new technology."
      ]
    };
  }

  /**
   * Ensure each stock has at least one news item
   */
  private ensureStocksHaveNews(): void {
    this.stockData.forEach(stock => {
      if (stock.news.length === 0 && this.newsItems[stock.id]) {
        // Select a random news item for this stock
        const availableNews = this.newsItems[stock.id];
        const randomNewsIndex = Math.floor(Math.random() * availableNews.length);
        const newsItem = availableNews[randomNewsIndex];
        stock.news.push(newsItem);
        
        console.log(`Added news item to ${stock.name}: ${newsItem}`);
      }
    });
  }

  /**
   * Simulate daily stock price changes
   */
  private simulateStockPrices(): void {
    // Create a recurring timer to update stock prices
    this.scene.time.addEvent({
      delay: 60000, // Update every minute (60,000ms)
      callback: this.updateStocks,
      callbackScope: this,
      loop: true
    });
  }

  /**
   * Update stock prices and metrics
   */
  private updateStocks(): void {
    this.stockData.forEach(stock => {
      // Calculate price change percentage (-3% to +3%)
      const changePercent = (Math.random() * 6) - 3;
      const priceChange = stock.currentPrice * (changePercent / 100);
      
      // Update current price
      const newPrice = Math.max(1, stock.currentPrice + priceChange);
      stock.currentPrice = Math.round(newPrice * 100) / 100;
      
      // Update price history
      stock.priceHistory.push(stock.currentPrice);
      if (stock.priceHistory.length > 20) {
        stock.priceHistory.shift(); // Remove oldest price data
      }
      
      // Update market cap based on new price
      stock.marketCap = stock.currentPrice * stock.outstandingShares;
      
      // Occasionally update business growth (10% chance)
      if (Math.random() < 0.1) {
        const growthChange = (Math.random() * 2) - 1; // -1% to +1%
        stock.businessGrowth = Math.round((stock.businessGrowth + growthChange) * 10) / 10;
      }
      
      // Occasionally update debt-equity ratio (5% chance)
      if (Math.random() < 0.05) {
        const ratioChange = (Math.random() * 0.4) - 0.2; // -0.2 to +0.2
        stock.debtEquityRatio = Math.max(0.1, Math.round((stock.debtEquityRatio + ratioChange) * 10) / 10);
      }
      
      // Occasionally update EPS and PE ratio (8% chance)
      if (Math.random() < 0.08) {
        // EPS can change based on company performance
        const epsChange = (Math.random() * 4) - 2; // -2% to +2%
        stock.eps = Math.max(0.1, stock.eps * (1 + epsChange/100));
        stock.eps = Math.round(stock.eps * 100) / 100; // Round to 2 decimal places
        
        // PE ratio is calculated from price and EPS
        stock.peRatio = stock.eps > 0 ? Math.round((stock.currentPrice / stock.eps) * 10) / 10 : stock.peRatio;
      }
      
      // Generate random news (2% chance per stock per update)
      if (Math.random() < 0.02 && this.newsItems[stock.id]) {
        const availableNews = this.newsItems[stock.id];
        const randomNewsIndex = Math.floor(Math.random() * availableNews.length);
        const newsItem = availableNews[randomNewsIndex];
        
        // Add news if it's not already in the stock's news array
        if (!stock.news.includes(newsItem)) {
          stock.news.unshift(newsItem);
          if (stock.news.length > 3) {
            stock.news.pop(); // Keep only 3 most recent news items
          }
          
          // News can affect stock price
          const newsImpact = Math.random() * 10 - 5; // -5% to +5%
          const impactAmount = stock.currentPrice * (newsImpact / 100);
          stock.currentPrice = Math.max(1, stock.currentPrice + impactAmount);
          
          // Update market cap after news impact
          stock.marketCap = stock.currentPrice * stock.outstandingShares;
        }
      }
    });
    
    // Log updated data for debugging
    console.log("Stock market updated:", new Date().toLocaleTimeString());
  }

  /**
   * Toggle broker visibility based on player location
   */
  public toggleVisibility(visible: boolean): void {
    if (this.broker) {
      this.broker.setVisible(visible);
      if (this.broker.nameText) {
        this.broker.nameText.setVisible(visible);
      }
    }
    
    // Also hide interaction text when broker is hidden
    if (!visible) {
      this.interactionText.setAlpha(0);
    }
  }

  /**
   * Main update function to be called each frame
   */
  public update(): void {
    if (!this.broker.visible) return;
    
    const player = this.scene.getPlayer();
    const playerPosition = player.getPosition();
    const playerX = playerPosition.x;
    const playerY = playerPosition.y;
    
    // Calculate distance between player and broker
    const distance = Phaser.Math.Distance.Between(
      playerX, playerY,
      this.broker.x, this.broker.y
    );
    
    // Check if player is close enough to interact
    const wasNearBroker = this.isPlayerNearBroker;
    this.isPlayerNearBroker = distance < this.interactionDistance;
    
    // Show interaction prompt if player is in range and no dialog is active
    if (this.isPlayerNearBroker && !this.activeDialog) {
      this.interactionText.setAlpha(1);
      this.interactionText.setPosition(this.broker.x, this.broker.y - 80);
      
      // Make the broker face the player
      this.updateBrokerOrientation(playerX, playerY);
      
      // Check for interaction key press
      if (this.interactionKey && Phaser.Input.Keyboard.JustDown(this.interactionKey)) {
        this.startStockMarketInteraction();
      }
    } else if (!this.isPlayerNearBroker && wasNearBroker) {
      // Player just left interaction zone
      this.interactionText.setAlpha(0);
      this.broker.anims.play('idle-front', true);
    }
  }
  
  /**
   * Update the broker's facing direction to look at the player
   */
  private updateBrokerOrientation(playerX: number, playerY: number): void {
    const dx = playerX - this.broker.x;
    const dy = playerY - this.broker.y;
    
    // Determine which direction the broker should face
    if (Math.abs(dx) > Math.abs(dy)) {
      // Horizontal movement is greater
      if (dx > 0) {
        this.broker.anims.play('idle-right', true);
      } else {
        this.broker.anims.play('idle-left', true);
      }
    } else {
      // Vertical movement is greater
      if (dy > 0) {
        this.broker.anims.play('idle-down', true);
      } else {
        this.broker.anims.play('idle-up', true);
      }
    }
  }
  
  /**
   * Start the stock market interaction UI
   */
  private startStockMarketInteraction(): void {
    if (this.activeDialog) return;
    
    console.log("Starting stock market interaction");
    this.activeDialog = true;
    this.interactionText.setAlpha(0);
    
    // Ensure stocks have news before opening the UI
    this.ensureStocksHaveNews();
    
    // Force the stock market UI container to be active
    document.getElementById('stock-market-ui-container')?.classList.add('active');
    
    // Signal to MainScene to open stock market UI
    this.scene.openStockMarketUI(this.stockData);
  }
  
  /**
   * Close the stock market interaction
   */
  public endStockMarketInteraction(): void {
    if (!this.activeDialog) return;
    
    console.log("Ending stock market interaction");
    this.activeDialog = false;
    
    // Remove the active class from stock market container
    document.getElementById('stock-market-ui-container')?.classList.remove('active');
    
    // Skip speech bubble closing animation since we're not showing it anymore
    
    // Show interaction text again if player is still nearby
    if (this.isPlayerNearBroker) {
      this.interactionText.setAlpha(1);
    }
  }
  
  /**
   * Get the current stock market data
   */
  public getStockMarketData(): Stock[] {
    return this.stockData;
  }
  
  /**
   * Called when the player enters a building
   * @param buildingType The type of building entered (optional)
   */
  public onEnterBuilding(buildingType?: string): void {
    // Show the broker only if the player is in the stock market building
    if (buildingType === 'stockmarket') {
      this.toggleVisibility(true);
      console.log("Player entered stock market building, showing broker");
    }
  }

  /**
   * Called when the player exits a building
   */
  public onExitBuilding(): void {
    // Hide the broker when exiting any building
    this.toggleVisibility(false);
    console.log("Player exited building, hiding broker");
  }
  
  /**
   * Clean up resources when scene is being destroyed
   */
  public destroy(): void {
    if (this.broker.nameText) {
      this.broker.nameText.destroy();
    }
    
    if (this.speechBubble) {
      this.speechBubble.destroy();
    }
    
    this.broker.destroy();
    this.interactionText.destroy();
  }

  /**
   * Get market status for UI
   */
  public getMarketStatus(): MarketStatus {
    // Update the market timer before returning to ensure values are current
    this.updateMarketTimerText();
    return this.marketStatus;
  }

  /**
   * Get player's portfolio
   */
  public getPlayerPortfolio(): PlayerPortfolio {
    return this.playerPortfolio;
  }
  
  /**
   * Execute a stock purchase
   * @param stockId ID of the stock to purchase
   * @param quantity Number of shares to purchase
   * @returns Success status and message
   */
  public buyStock(stockId: string, quantity: number): { success: boolean; message: string } {
    // Validate quantity
    if (quantity <= 0) {
      return { success: false, message: "Please enter a valid quantity." };
    }
    
    // Check if market is open
    if (!this.marketStatus.isOpen) {
      return { success: false, message: "Cannot trade while market is closed." };
    }
    
    // Find the stock
    const stock = this.stockData.find(s => s.id === stockId);
    if (!stock) {
      return { success: false, message: "Stock not found." };
    }
    
    // Calculate total cost
    const totalCost = stock.currentPrice * quantity;
    
    // Check if player has enough money
    const playerRupees = this.scene.getPlayerRupees();
    if (totalCost > playerRupees) {
      return { success: false, message: "Not enough rupees for this purchase." };
    }
    
    // Deduct rupees from player
    this.scene.deductPlayerRupees(totalCost);
    
    // Update player portfolio
    const existingHolding = this.playerPortfolio.holdings.find(h => h.stockId === stockId);
    if (existingHolding) {
      // Update existing holding with new average price
      const totalShares = existingHolding.quantity + quantity;
      const totalInvestment = existingHolding.totalInvestment + totalCost;
      existingHolding.quantity = totalShares;
      existingHolding.totalInvestment = totalInvestment;
      existingHolding.averagePurchasePrice = totalInvestment / totalShares;
    } else {
      // Add new holding
      this.playerPortfolio.holdings.push({
        stockId,
        quantity,
        averagePurchasePrice: stock.currentPrice,
        totalInvestment: totalCost
      });
    }
    
    // Record transaction
    this.playerPortfolio.transactionHistory.push({
      stockId,
      stockName: stock.name,
      type: 'buy',
      price: stock.currentPrice,
      quantity,
      timestamp: Date.now(),
      total: totalCost
    });
    
    // Log transaction
    console.log(`Purchased ${quantity} shares of ${stock.name} for ₹${totalCost}`);
    
    return { 
      success: true, 
      message: `Successfully purchased ${quantity} shares of ${stock.name} for ₹${totalCost.toLocaleString()}.` 
    };
  }
  
  /**
   * Execute a stock sale
   * @param stockId ID of the stock to sell
   * @param quantity Number of shares to sell
   * @returns Success status and message
   */
  public sellStock(stockId: string, quantity: number): { success: boolean; message: string } {
    // Validate quantity
    if (quantity <= 0) {
      return { success: false, message: "Please enter a valid quantity." };
    }
    
    // Check if market is open
    if (!this.marketStatus.isOpen) {
      return { success: false, message: "Cannot trade while market is closed." };
    }
    
    // Find the stock
    const stock = this.stockData.find(s => s.id === stockId);
    if (!stock) {
      return { success: false, message: "Stock not found." };
    }
    
    // Check if player owns the stock
    const holdingIndex = this.playerPortfolio.holdings.findIndex(h => h.stockId === stockId);
    if (holdingIndex === -1) {
      return { success: false, message: `You don't own any shares of ${stock.name}.` };
    }
    
    const holding = this.playerPortfolio.holdings[holdingIndex];
    
    // Check if player owns enough shares
    if (holding.quantity < quantity) {
      return { success: false, message: `You only have ${holding.quantity} shares of ${stock.name}.` };
    }
    
    // Calculate sale value
    const saleValue = stock.currentPrice * quantity;
    
    // Add rupees to player
    this.scene.addPlayerRupees(saleValue);
    
    // Update portfolio
    if (holding.quantity === quantity) {
      // Remove holding completely if selling all shares
      this.playerPortfolio.holdings.splice(holdingIndex, 1);
    } else {
      // Update quantity and investment value for remaining shares
      const remainingShares = holding.quantity - quantity;
      const investmentPerShare = holding.totalInvestment / holding.quantity;
      holding.quantity = remainingShares;
      holding.totalInvestment -= investmentPerShare * quantity;
      // Average price stays the same
    }
    
    // Record transaction
    this.playerPortfolio.transactionHistory.push({
      stockId,
      stockName: stock.name,
      type: 'sell',
      price: stock.currentPrice,
      quantity,
      timestamp: Date.now(),
      total: saleValue
    });
    
    // Calculate profit/loss
    const profit = saleValue - (holding.averagePurchasePrice * quantity);
    const profitPercent = (profit / (holding.averagePurchasePrice * quantity)) * 100;
    
    const profitMessage = profit >= 0 ? 
      `with a profit of ₹${profit.toLocaleString()} (${profitPercent.toFixed(2)}%)` : 
      `with a loss of ₹${Math.abs(profit).toLocaleString()} (${Math.abs(profitPercent).toFixed(2)}%)`;
    
    console.log(`Sold ${quantity} shares of ${stock.name} for ₹${saleValue} ${profitMessage}`);
    
    return { 
      success: true, 
      message: `Successfully sold ${quantity} shares of ${stock.name} for ₹${saleValue.toLocaleString()} ${profitMessage}.`
    };
  }
  
  /**
   * Calculate portfolio value and performance metrics
   */
  public getPortfolioSummary(): { 
    totalValue: number;
    totalInvestment: number;
    totalProfit: number;
    profitPercent: number;
  } {
    let totalValue = 0;
    let totalInvestment = 0;
    
    // Calculate current value of all holdings
    this.playerPortfolio.holdings.forEach(holding => {
      const stock = this.stockData.find(s => s.id === holding.stockId);
      if (stock) {
        totalValue += stock.currentPrice * holding.quantity;
        totalInvestment += holding.totalInvestment;
      }
    });
    
    const totalProfit = totalValue - totalInvestment;
    const profitPercent = totalInvestment > 0 ? (totalProfit / totalInvestment) * 100 : 0;
    
    return {
      totalValue,
      totalInvestment,
      totalProfit,
      profitPercent
    };
  }
}