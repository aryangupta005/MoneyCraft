import { GameObjects, Input } from 'phaser';
import { MainGameScene } from '../scenes/MainScene.ts';

interface NPCSprite extends GameObjects.Sprite {
  nameText?: GameObjects.Text;
}

export class NPCManager {
  private scene: MainGameScene;
  private npc: NPCSprite;
  private npcDialog: GameObjects.Container | null = null;
  private interactionKey: Input.Keyboard.Key | null = null;
  private readonly interactionDistance: number = 150;
  private interactionText: GameObjects.Text;
  private isPlayerNearNPC: boolean = false;
  private activeDialog: boolean = false;
  private speechBubble: GameObjects.Sprite | null = null;

  constructor(scene: MainGameScene) {
    this.scene = scene;
    
    // Setup interaction key with null check
    if (scene.input.keyboard) {
      this.interactionKey = scene.input.keyboard.addKey('E');
    }
    
    // Create NPC at predefined position
    this.npc = scene.add.sprite(737, 3753, 'character') as NPCSprite;
    this.npc.setScale(5);
    this.npc.anims.play('idle-right');
    
    // Add NPC name text
    const npcNameText = scene.add.text(this.npc.x, this.npc.y - 50, "Village Elder", {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#ffff00',
      align: 'center',
      backgroundColor: '#00000080',
      padding: { x: 4, y: 2 }
    }).setOrigin(0.5);
    
    // Add interaction text (initially hidden)
    this.interactionText = scene.add.text(this.npc.x, this.npc.y - 80, "Press E to interact", {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#ffffff',
      align: 'center',
      backgroundColor: '#00000080',
      padding: { x: 8, y: 4 }
    }).setOrigin(0.5).setAlpha(0);
    
    // Add to game container
    const gameContainer = scene.getGameContainer();
    if (gameContainer) {
      gameContainer.add(this.npc);
      gameContainer.add(npcNameText);
      gameContainer.add(this.interactionText);
      this.npc.nameText = npcNameText;
    }
    
    // Create the speech bubble animations
    this.createSpeechBubbleAnimations();
  }
  
  private createSpeechBubbleAnimations(): void {
    try {
      // Check if the texture exists first
      if (!this.scene.textures.exists('speech_bubble_grey')) {
        console.warn("speech_bubble_grey texture not found - loading it now");
        
        // Load the texture dynamically if it doesn't exist
        this.scene.load.once('complete', () => {
          // Now create the animations after the texture is loaded
          this.createAnimationsFromLoadedTexture();
        });
        
        // Start loading the spritesheet
        this.scene.load.spritesheet('speech_bubble_grey', 'assets/speech_bubble_grey.png', {
          frameWidth: 64,
          frameHeight: 64
        });
        this.scene.load.start();
        return;
      }
      
      // If texture exists, create animations directly
      this.createAnimationsFromLoadedTexture();
      
    } catch (error) {
      console.error("Error in speech bubble animations setup:", error);
    }
  }
  
  private createAnimationsFromLoadedTexture(): void {
    try {
      // Check if animations already exist
      if (!this.scene.anims.exists('speech-bubble-open')) {
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
      }
      
      if (!this.scene.anims.exists('speech-bubble-close')) {
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
      }
      
      console.log("Speech bubble animations created successfully");
    } catch (error) {
      console.error("Failed to create speech bubble animations:", error);
      console.log("Make sure speech_bubble_grey spritesheet is properly structured");
    }
  }

  update(): void {
    const player = this.scene.getPlayer();
    if (!player) return;

    // If dialog is already open, don't show interaction prompt and don't allow new interactions
    if (this.activeDialog) {
      this.interactionText.setAlpha(0);
      return;
    }

    // Calculate distance between player and NPC
    const playerPos = player.getPosition();
    const dx = playerPos.x - this.npc.x;
    const dy = playerPos.y - this.npc.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Check if player is within interaction distance
    const wasNearNPC = this.isPlayerNearNPC;
    this.isPlayerNearNPC = distance <= this.interactionDistance;
    
    // Only react to changes in proximity
    if (this.isPlayerNearNPC !== wasNearNPC) {
      if (this.isPlayerNearNPC) {
        // Player just entered interaction zone - show text with fade in
        this.scene.tweens.add({
          targets: this.interactionText,
          alpha: 1,
          duration: 200,
          ease: 'Power1'
        });
      } else {
        // Player just left interaction zone - hide text with fade out
        this.scene.tweens.add({
          targets: this.interactionText,
          alpha: 0,
          duration: 200,
          ease: 'Power1'
        });
      }
    }
    
    // Update interaction text position
    this.updateInteractionTextPosition();

    // Check for interaction key press when near NPC
    if (this.isPlayerNearNPC && this.interactionKey && Phaser.Input.Keyboard.JustDown(this.interactionKey) && !this.activeDialog) {
      this.showDialog();
    }
  }

  private updateInteractionTextPosition(): void {
    if (this.interactionText) {
      this.interactionText.x = this.npc.x;
      this.interactionText.y = this.npc.y - 80;
    }
  }

  private showDialog(): void {
    // Mark dialog as active
    this.activeDialog = true;
    
    // Create a dialog box
    const dialogBox = this.scene.add.rectangle(
      this.scene.cameras.main.centerX, 
      this.scene.cameras.main.height - 150,
      this.scene.cameras.main.width * 0.8,
      150,
      0x000000,
      0.8
    );
    dialogBox.setScrollFactor(0).setDepth(2000);
    
    // Add dialog text with word wrap
    const dialogText = this.scene.add.text(
      dialogBox.x, 
      dialogBox.y, 
      "Greetings adventurer! I am the Village Elder.\nWelcome to our humble village.",
      {
        fontFamily: 'Arial',
        fontSize: '18px',
        color: '#ffffff',
        align: 'center',
        wordWrap: { width: dialogBox.width - 40 }
      }
    ).setOrigin(0.5).setScrollFactor(0).setDepth(2001);
    
    // Add close instruction
    const closeText = this.scene.add.text(
      dialogBox.x,
      dialogBox.y + 60,
      "Press E, Space or Enter to close",
      {
        fontFamily: 'Arial',
        fontSize: '16px',
        color: '#aaaaaa',
        align: 'center'
      }
    ).setOrigin(0.5).setScrollFactor(0).setDepth(2001);
    
    // Create a container for dialog elements
    const dialogContainer = this.scene.add.container(0, 0);
    dialogContainer.add([dialogBox, dialogText, closeText]);
    this.npcDialog = dialogContainer;
    
    // Create speech bubble animation directly above the NPC (centered) and larger
    this.speechBubble = this.scene.add.sprite(
      this.npc.x, // Center above the NPC (was this.npc.x + 40)
      this.npc.y - 120, // Position higher above the NPC (was this.npc.y - 30)
      'speech_bubble_grey'
    );
    this.speechBubble.setScale(2.5); // Make it significantly larger (was 1.5)
    this.speechBubble.setDepth(2002); // Make sure it appears above other elements
    this.speechBubble.setScrollFactor(1); // Make it move with the game world
    
    // Play the opening animation
    this.speechBubble.play('speech-bubble-open');
    
    // Setup keyboard listeners
    this.scene.input.keyboard?.once('keydown-E', () => this.closeDialog());
    this.scene.input.keyboard?.once('keydown-SPACE', () => this.closeDialog());
    this.scene.input.keyboard?.once('keydown-ENTER', () => this.closeDialog());
  }

  private closeDialog(): void {
    if (!this.npcDialog) return;

    // Play the closing animation if speech bubble exists
    if (this.speechBubble) {
      this.speechBubble.play('speech-bubble-close');
      
      // Wait for the closing animation to complete
      this.speechBubble.once('animationcomplete', () => {
        if (this.speechBubble) {
          this.speechBubble.destroy();
          this.speechBubble = null;
        }
      });
    }

    // Clean up dialog with fade out animation
    this.scene.tweens.add({
      targets: this.npcDialog,
      alpha: 0,
      duration: 200,
      onComplete: () => {
        if (this.npcDialog) {
          this.npcDialog.destroy();
          this.npcDialog = null;
        }
        this.activeDialog = false;
      }
    });
  }
}