import { GameObjects, Input } from 'phaser';
import { Player } from '../entities/Player';
import { MainScene } from '../scenes/MainScene';
import { Constants } from '../utils/Constants';

interface NPCSprite extends GameObjects.Sprite {
  nameText?: GameObjects.Text;
}

interface BankAccount {
  id: string;
  balance: number;
  fixedDeposits: FixedDeposit[];
}

interface FixedDeposit {
  id: string;
  amount: number;
  interestRate: number;
  startDate: number;
  duration: number; // in days
  maturityDate: number;
  matured: boolean;
}

export class BankNPCManager {
  private scene: MainScene;
  private banker: NPCSprite;
  private interactionKey: Input.Keyboard.Key | null = null;
  private readonly interactionDistance: number = 150;
  private interactionText: GameObjects.Text;
  private isPlayerNearBanker: boolean = false;
  private activeDialog: boolean = false;
  private speechBubble: GameObjects.Sprite | null = null;
  private playerBankAccount: BankAccount;

  constructor(scene: MainScene) {
    this.scene = scene;
    
    // Setup interaction key with null check
    if (scene.input.keyboard) {
      this.interactionKey = scene.input.keyboard.addKey('E');
      // Add SPACE and ENTER as alternative interaction keys
      const spaceKey = scene.input.keyboard.addKey('SPACE');
      const enterKey = scene.input.keyboard.addKey('ENTER');
      
      // Make these keys also trigger the interaction
      if (spaceKey) {
        spaceKey.on('down', () => {
          if (this.isPlayerNearBanker && !this.activeDialog) {
            this.startBankingInteraction();
          }
        });
      }
      
      if (enterKey) {
        enterKey.on('down', () => {
          if (this.isPlayerNearBanker && !this.activeDialog) {
            this.startBankingInteraction();
          }
        });
      }
    }
    
    // Initialize the player's bank account
    this.playerBankAccount = {
      id: 'player-account',
      balance: 0,
      fixedDeposits: []
    };
    
    // Create banker NPC at predefined position
    const bankerX = 800;
    const bankerY = 500;
    this.banker = scene.add.sprite(bankerX, bankerY, 'character') as NPCSprite;
    this.banker.setScale(5);
    this.banker.anims.play('idle-down');
    
    // Add banker name text
    const bankerNameText = scene.add.text(this.banker.x, this.banker.y - 50, "Bank Teller", {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#ffff00',
      align: 'center',
      backgroundColor: '#00000080',
      padding: { x: 4, y: 2 }
    }).setOrigin(0.5);
    
    // Add interaction text (initially hidden)
    this.interactionText = scene.add.text(this.banker.x, this.banker.y - 80, "Press E to interact", {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#ffffff',
      align: 'center',
      backgroundColor: '#00000080',
      padding: { x: 8, y: 4 }
    }).setOrigin(0.5).setAlpha(0).setScrollFactor(0).setDepth(100);
    
    // Add to game container
    const gameContainer = scene.getGameContainer();
    if (gameContainer) {
      gameContainer.add(this.banker);
      gameContainer.add(bankerNameText);
      gameContainer.add(this.interactionText);
      this.banker.nameText = bankerNameText;
    }
    
    // Hide the banker initially - will show only in the bank
    this.toggleVisibility(false);
    
    // Setup speech bubble animations
    this.setupSpeechBubbleAnimations();
    
    console.log("Bank NPC created at position:", bankerX, bankerY);
  }
  
  private setupSpeechBubbleAnimations(): void {
    try {
      // Check if the texture exists and animations are already created
      if (this.scene.anims.exists('speech-bubble-open')) {
        return; // Animations already set up
      }
      
      // Check if the texture exists first
      if (!this.scene.textures.exists('speech_bubble_grey')) {
        console.warn("speech_bubble_grey texture not found for bank NPC");
        return;
      }
      
      // Create opening animation (frames 8-14)
      this.scene.anims.create({
        key: 'speech-bubble-open',
        frames: this.scene.anims.generateFrameNumbers('speech_bubble_grey', { 
          start: 8, 
          end: 14 
        }),
        frameRate: 15,
        repeat: 0
      });
      
      // Create closing animation (frames 15-21)
      this.scene.anims.create({
        key: 'speech-bubble-close',
        frames: this.scene.anims.generateFrameNumbers('speech_bubble_grey', { 
          start: 15, 
          end: 21 
        }),
        frameRate: 15,
        repeat: 0
      });
    } catch (error) {
      console.error("Failed to create speech bubble animations for bank:", error);
    }
  }

  /**
   * Toggle banker visibility based on player location
   */
  public toggleVisibility(visible: boolean): void {
    if (this.banker) {
      this.banker.setVisible(visible);
      if (this.banker.nameText) {
        this.banker.nameText.setVisible(visible);
      }
    }
    
    // Also hide interaction text when banker is hidden
    if (!visible) {
      this.interactionText.setAlpha(0);
    }
  }

  /**
   * Main update function to be called each frame
   */
  public update(): void {
    if (!this.banker.visible) return;
    
    const player = this.scene.getPlayer();
    const playerPosition = player.getPosition();
    const playerX = playerPosition.x;
    const playerY = playerPosition.y;
    
    // Calculate distance between player and banker
    const distance = Phaser.Math.Distance.Between(
      playerX, playerY,
      this.banker.x, this.banker.y
    );
    
    // Check if player is close enough to interact
    const wasNearBanker = this.isPlayerNearBanker;
    this.isPlayerNearBanker = distance < this.interactionDistance;
    
    // Show interaction prompt if player is in range and no dialog is active
    if (this.isPlayerNearBanker && !this.activeDialog) {
      this.interactionText.setAlpha(1);
      this.interactionText.setPosition(this.banker.x, this.banker.y - 80);
      
      // Make the banker face the player
      this.updateBankerOrientation(playerX, playerY);
      
      // Check for interaction key press
      if (this.interactionKey && Phaser.Input.Keyboard.JustDown(this.interactionKey)) {
        this.startBankingInteraction();
      }
    } else if (!this.isPlayerNearBanker && wasNearBanker) {
      // Player just left interaction zone
      this.interactionText.setAlpha(0);
      this.banker.anims.play('idle-front', true);
    }
  }
  
  /**
   * Update the banker's facing direction to look at the player
   */
  private updateBankerOrientation(playerX: number, playerY: number): void {
    const dx = playerX - this.banker.x;
    const dy = playerY - this.banker.y;
    
    // Determine which direction the banker should face
    if (Math.abs(dx) > Math.abs(dy)) {
      // Horizontal movement is greater
      if (dx > 0) {
        this.banker.anims.play('idle-right', true);
      } else {
        this.banker.anims.play('idle-left', true);
      }
    } else {
      // Vertical movement is greater
      if (dy > 0) {
        this.banker.anims.play('idle-down', true);
      } else {
        this.banker.anims.play('idle-up', true);
      }
    }
  }
  
  /**
   * Start the banking interaction UI
   */
  private startBankingInteraction(): void {
    if (this.activeDialog) return;
    
    console.log("Starting bank interaction");
    this.activeDialog = true;
    this.interactionText.setAlpha(0);
    
    // Skip showing speech bubble - direct banking UI open
    
    // Force the banking UI container to be active
    document.getElementById('banking-ui-container')?.classList.add('active');
    
    // Signal to MainScene to open banking UI
    this.scene.openBankingUI(this.playerBankAccount);
  }
  
  /**
   * Show a speech bubble over the banker's head
   * Note: This is no longer used for bank teller interactions
   * but kept for potential future use
   */
  private showSpeechBubble(): void {
    // ...existing code...
  }
  
  /**
   * Close the banking interaction
   */
  public endBankingInteraction(): void {
    if (!this.activeDialog) return;
    
    console.log("Ending bank interaction");
    this.activeDialog = false;
    
    // Remove the active class from banking container
    document.getElementById('banking-ui-container')?.classList.remove('active');
    
    // Skip speech bubble closing animation since we're not showing it anymore
    
    // Show interaction text again if player is still nearby
    if (this.isPlayerNearBanker) {
      this.interactionText.setAlpha(1);
    }
  }
  
  /**
   * Deposit money into the player's bank account
   */
  public depositMoney(amount: number): boolean {
    if (amount <= 0) return false;
    
    // Check if player has enough money (would need PlayerInventory integration)
    // For now, just add it directly
    this.playerBankAccount.balance += amount;
    console.log(`Deposited ${amount} coins, new balance: ${this.playerBankAccount.balance}`);
    return true;
  }
  
  /**
   * Withdraw money from the player's bank account
   */
  public withdrawMoney(amount: number): boolean {
    if (amount <= 0 || amount > this.playerBankAccount.balance) return false;
    
    this.playerBankAccount.balance -= amount;
    console.log(`Withdrew ${amount} coins, new balance: ${this.playerBankAccount.balance}`);
    return true;
  }
  
  /**
   * Create a new fixed deposit
   */
  public createFixedDeposit(amount: number, duration: number): boolean {
    if (amount <= 0 || amount > this.playerBankAccount.balance) return false;
    if (duration < 1) return false;
    
    // Deduct the amount from balance
    this.playerBankAccount.balance -= amount;
    
    // Calculate interest rate based on duration (longer duration = better rate)
    const baseRate = 0.05; // 5% annual
    const interestRate = baseRate + (duration / 365 * 0.02); // Additional 2% for each year
    
    const now = Date.now();
    const maturityDate = now + (duration * 24 * 60 * 60 * 1000); // Convert days to milliseconds
    
    // Create and add the fixed deposit
    const newDeposit: FixedDeposit = {
      id: `fd-${now}-${Math.floor(Math.random() * 1000)}`,
      amount,
      interestRate,
      startDate: now,
      duration,
      maturityDate,
      matured: false
    };
    
    this.playerBankAccount.fixedDeposits.push(newDeposit);
    console.log(`Created fixed deposit for ${amount} coins for ${duration} days`);
    return true;
  }
  
  /**
   * Check if any fixed deposits have matured and process them
   */
  public checkMaturedDeposits(): FixedDeposit[] {
    const now = Date.now();
    const maturedDeposits: FixedDeposit[] = [];
    
    this.playerBankAccount.fixedDeposits.forEach(deposit => {
      if (!deposit.matured && now >= deposit.maturityDate) {
        // Mark as matured
        deposit.matured = true;
        maturedDeposits.push(deposit);
        
        // Calculate interest earned
        const interestEarned = deposit.amount * deposit.interestRate * (deposit.duration / 365);
        const totalAmount = deposit.amount + interestEarned;
        
        // Add to balance
        this.playerBankAccount.balance += totalAmount;
        console.log(`Fixed deposit matured! Added ${totalAmount} coins to balance`);
      }
    });
    
    return maturedDeposits;
  }
  
  /**
   * Get the current player bank account data
   */
  public getBankAccountData(): BankAccount {
    return this.playerBankAccount;
  }
  
  /**
   * Called when the player enters a building
   * @param buildingType The type of building entered (optional)
   */
  public onEnterBuilding(buildingType?: string): void {
    // Show the banker only if the player is in the bank building
    // If buildingType isn't provided, we'll assume it's the bank for now
    // In a more complex game, you'd check if buildingType === 'bank'
    this.toggleVisibility(true);
    console.log("Player entered bank building, showing banker");
  }

  /**
   * Called when the player exits a building
   */
  public onExitBuilding(): void {
    // Hide the banker when exiting any building
    this.toggleVisibility(false);
    console.log("Player exited building, hiding banker");
  }
  
  /**
   * Clean up resources when scene is being destroyed
   */
  public destroy(): void {
    if (this.banker.nameText) {
      this.banker.nameText.destroy();
    }
    
    if (this.speechBubble) {
      this.speechBubble.destroy();
    }
    
    this.banker.destroy();
    this.interactionText.destroy();
  }
}