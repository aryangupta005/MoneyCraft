import { Scene, GameObjects, Types } from 'phaser';
import { Constants } from '../utils/Constants.ts';

export class Player {
  private scene: Scene;
  private sprite: GameObjects.Sprite;
  private nameText: GameObjects.Text;
  private cursors: Types.Input.Keyboard.CursorKeys;
  private wasd: Record<string, Phaser.Input.Keyboard.Key>;
  private shiftKey: Phaser.Input.Keyboard.Key; // Add shift key
  private currentAnimation: string = 'idle-down';
  private lastSentPosition: { x: number; y: number } | null = null;
  private lastSentAnimation: string | null = null;
  private username: string;
  private movementSmoothing: number = 0.2; // Controls movement smoothness (lower = smoother)

  constructor(scene: Scene, x: number, y: number, cursors: Types.Input.Keyboard.CursorKeys, wasd: Record<string, Phaser.Input.Keyboard.Key>) {
    this.scene = scene;
    this.cursors = cursors;
    this.wasd = wasd;
    this.username = scene.registry.get('username') || 'Player';
    
    // Register shift key for running
    this.shiftKey = scene.input.keyboard!.addKey('SHIFT');
    
    // Create player sprite
    this.sprite = scene.add.sprite(x, y, 'character');
    this.sprite.setScale(5); // Make character bigger
    
    // Create animations
    this.createAnimations();
    
    // Set initial animation
    this.sprite.anims.play('idle-down');
    
    // Add physics to player
    scene.physics.add.existing(this.sprite);
    
    if (this.sprite.body) {
      const body = this.sprite.body as Phaser.Physics.Arcade.Body;
      body.setCollideWorldBounds(true);
      body.setSize(32, 32);
      body.setOffset(8, 8);
      body.setDamping(true);
      body.setDrag(0.85, 0.85);
    }
    
    // Create username text
    this.nameText = scene.add.text(x, y + 350, this.username, {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#ffffff',
      align: 'center',
      backgroundColor: '#00000020',
      padding: { x: 4, y: 2 }
    }).setOrigin(0.5);
  }

  update(deltaFactor: number = 1): void {
    this.handleMovement(deltaFactor);
    this.updateNamePosition();
  }

  private handleMovement(deltaFactor: number): void {
    // Calculate movement
    let dx = 0;
    let dy = 0;
    const isRunning = this.shiftKey.isDown;
    const speed = isRunning ? 
      Constants.PLAYER_SPEED * 1.6 * deltaFactor : // 60% faster when running
      Constants.PLAYER_SPEED * deltaFactor;

    // Check both arrow keys and WASD
    if (this.cursors.left?.isDown || this.wasd.left?.isDown) {
      dx = -speed;
      if (isRunning) {
        this.sprite.anims.play('run-left', true);
        this.currentAnimation = 'run-left';
      } else {
        this.sprite.anims.play('walk-left', true);
        this.currentAnimation = 'walk-left';
      }
    } else if (this.cursors.right?.isDown || this.wasd.right?.isDown) {
      dx = speed;
      if (isRunning) {
        this.sprite.anims.play('run-right', true);
        this.currentAnimation = 'run-right';
      } else {
        this.sprite.anims.play('walk-right', true);
        this.currentAnimation = 'walk-right';
      }
    }

    if (this.cursors.up?.isDown || this.wasd.up?.isDown) {
      dy = -speed;
      if (dx === 0) {
        if (isRunning) {
          this.sprite.anims.play('run-up', true);
          this.currentAnimation = 'run-up';
        } else {
          this.sprite.anims.play('walk-up', true);
          this.currentAnimation = 'walk-up';
        }
      }
    } else if (this.cursors.down?.isDown || this.wasd.down?.isDown) {
      dy = speed;
      if (dx === 0) {
        if (isRunning) {
          this.sprite.anims.play('run-down', true);
          this.currentAnimation = 'run-down';
        } else {
          this.sprite.anims.play('walk-down', true);
          this.currentAnimation = 'walk-down';
        }
      }
    }

    // Handle idle animations
    if (dx === 0 && dy === 0) {
      // Get current animation key
      const currentAnim = this.sprite.anims.currentAnim;
      if (currentAnim) {
        const direction = currentAnim.key.split('-')[1];
        this.sprite.anims.play('idle-' + direction, true);
        this.currentAnimation = 'idle-' + direction;
      }
    }

    // Normalize diagonal movement
    if (dx !== 0 && dy !== 0) {
      dx *= Math.SQRT1_2;
      dy *= Math.SQRT1_2;
    }

    // Set player velocity using physics body
    if (this.sprite.body) {
      // Direct velocity setting for smoother movement
      (this.sprite.body as Phaser.Physics.Arcade.Body).setVelocity(dx, dy);
      
      // Apply integer pixel positions to reduce flickering
      if (dx === 0 && dy === 0) {
        // Only snap position when not moving to prevent jitter
        this.sprite.x = Math.round(this.sprite.x);
        this.sprite.y = Math.round(this.sprite.y);
        
        // Also stop the body velocity completely when not moving
        (this.sprite.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
      }
    }
  }

  private createAnimations(): void {
    const { anims } = this.scene;

    // Only create animations if they don't exist already
    if (anims.exists('idle-down')) return;

    // Down animations
    anims.create({
      key: 'idle-down',
      frames: anims.generateFrameNumbers('character', { frames: [0] }),
      frameRate: 1,
      repeat: -1
    });
    anims.create({
      key: 'walk-down',
      frames: anims.generateFrameNumbers('character', { start: 32, end: 37 }),
      frameRate: 10,
      repeat: -1
    });
    anims.create({
      key: 'run-down',
      frames: anims.generateFrameNumbers('character', { frames: [38, 0, 39, 0] }),
      frameRate: 10,
      repeat: -1
    });
    
    // Up animations
    anims.create({
      key: 'idle-up',
      frames: anims.generateFrameNumbers('character', { frames: [8] }),
      frameRate: 1,
      repeat: -1
    });
    anims.create({
      key: 'walk-up',
      frames: anims.generateFrameNumbers('character', { start: 40, end: 45 }),
      frameRate: 10,
      repeat: -1
    });
    anims.create({
      key: 'run-up',
      frames: anims.generateFrameNumbers('character', { frames: [46, 8, 47, 8] }),
      frameRate: 10,
      repeat: -1
    });
    
    // Left animations
    anims.create({
      key: 'idle-left',
      frames: anims.generateFrameNumbers('character', { frames: [24] }),
      frameRate: 1,
      repeat: -1
    });
    anims.create({
      key: 'walk-left',
      frames: anims.generateFrameNumbers('character', { start: 56, end: 61 }),
      frameRate: 10,
      repeat: -1
    });
    anims.create({
      key: 'run-left',
      frames: anims.generateFrameNumbers('character', { frames: [62, 24, 63, 24] }),
      frameRate: 10,
      repeat: -1
    });
    
    // Right animations
    anims.create({
      key: 'idle-right',
      frames: anims.generateFrameNumbers('character', { frames: [16] }),
      frameRate: 1,
      repeat: -1
    });
    anims.create({
      key: 'walk-right',
      frames: anims.generateFrameNumbers('character', { start: 48, end: 53 }),
      frameRate: 10,
      repeat: -1
    });
    anims.create({
      key: 'run-right',
      frames: anims.generateFrameNumbers('character', { frames: [54, 16, 55, 16] }),
      frameRate: 10,
      repeat: -1
    });
  }

  private updateNamePosition(): void {
    this.nameText.x = this.sprite.x;
    this.nameText.y = this.sprite.y - 50;
  }

  // Getters and utility methods
  getSprite(): GameObjects.Sprite {
    return this.sprite;
  }

  getNameText(): GameObjects.Text {
    return this.nameText;
  }

  getPosition(): { x: number, y: number } {
    return { x: this.sprite.x, y: this.sprite.y };
  }

  getCurrentAnimation(): string | null {
    return this.currentAnimation || null;
  }

  setLastSentPosition(position: { x: number, y: number }): void {
    this.lastSentPosition = position;
  }

  getLastSentPosition(): { x: number, y: number } | null {
    return this.lastSentPosition;
  }

  setLastSentAnimation(animation: string): void {
    this.lastSentAnimation = animation;
  }

  getLastSentAnimation(): string | null {
    return this.lastSentAnimation;
  }

  getUsername(): string {
    return this.username;
  }
}