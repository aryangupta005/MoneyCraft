import { Scene, GameObjects, Cameras } from 'phaser';
import { MainGameScene } from '../scenes/MainScene.ts';

interface MapCache {
  width: number;
  height: number;
}

// Extended camera interface to support zoom constraint properties
export interface ExtendedCamera extends Cameras.Scene2D.Camera {
  _origMinZoom?: number;
  _origMaxZoom?: number;
  minZoom?: number;
  maxZoom?: number;
}

export class MapManager {
  private scene: MainGameScene;
  private map: GameObjects.Image;
  private mapCache: MapCache;
  private isInBuilding: boolean = false;
  private currentBuildingType: 'bank' | 'stockmarket' | null = null;
  private lastOutdoorPosition: { x: number, y: number } | null = null;
  private textureLoadPromises: Map<string, Promise<void>> = new Map();

  constructor(scene: MainGameScene) {
    this.scene = scene;
    
    // Create map image with better origin setting for performance
    this.map = scene.add.image(0, 0, 'map');
    this.map.setOrigin(0, 0);
    
    // Store map dimensions in cache for quick access
    this.mapCache = {
      width: this.map.width,
      height: this.map.height
    };
    
    // Add to game container
    const gameContainer = scene.getGameContainer();
    gameContainer.add(this.map);
    
    // Set world bounds
    scene.physics.world.setBounds(0, 0, this.mapCache.width, this.mapCache.height);
    
    // Preload interior textures to avoid stutter when entering buildings
    this.preloadTextures();
  }

  private preloadTextures(): void {
    // Make sure the bank interior texture is ready before needed
    if (!this.scene.textures.exists('interior')) {
      const bankLoadPromise = new Promise<void>((resolve) => {
        this.scene.load.once('complete', () => {
          console.log('Bank interior texture loaded successfully');
          resolve();
        });
        this.scene.load.image('interior', 'test.png');
        
        // Preload door sound effects
        if (!this.scene.cache.audio.exists('door-open')) {
          this.scene.load.audio('door-open', 'assets/sounds/door-open.mp3');
        }
        if (!this.scene.cache.audio.exists('door-close')) {
          this.scene.load.audio('door-close', 'assets/sounds/door-close.mp3');
        }
        
        this.scene.load.start();
      });
      this.textureLoadPromises.set('interior', bankLoadPromise);
    }
    
    // Make sure the stock market interior texture is ready
    if (!this.scene.textures.exists('stockmarket')) {
      const stockMarketLoadPromise = new Promise<void>((resolve) => {
        this.scene.load.once('complete', () => {
          console.log('Stock market interior texture loaded successfully');
          resolve();
        });
        this.scene.load.image('stockmarket', '/maps/stockmarket.png');
        this.scene.load.start();
      });
      this.textureLoadPromises.set('stockmarket', stockMarketLoadPromise);
    }
  }

  enterBuilding(playerX: number, playerY: number, buildingType: 'bank' | 'stockmarket' = 'bank'): { x: number, y: number } {
    try {
      // Store current position
      this.lastOutdoorPosition = { x: playerX, y: playerY };
      
      // Set building state - do this first to prevent any rendering issues
      this.isInBuilding = true;
      this.currentBuildingType = buildingType;
      
      // Determine which texture to use based on building type
      const textureKey = buildingType === 'bank' ? 'interior' : 'stockmarket';
      
      // Switch to interior map - immediate texture swap
      this.map.setTexture(textureKey);
      this.map.setDepth(-10); // Ensure map is behind all other elements
      
      // Reset origin to 0.5 for proper centering
      this.map.setOrigin(0.5, 0.5);
      
      // Apply a larger scale to make the map bigger
      const scale = 2.3; // Scale factor for larger map
      this.map.setScale(scale);
      
      // Get the device dimensions
      const deviceWidth = this.scene.scale.width;
      const deviceHeight = this.scene.scale.height;
      
      // Get interior dimensions
      let interiorWidth = 800;  // Default fallback width
      let interiorHeight = 600; // Default fallback height
      
      if (this.scene.textures.exists(textureKey)) {
        const interiorImage = this.scene.textures.get(textureKey);
        if (interiorImage && interiorImage.source && interiorImage.source[0]) {
          interiorWidth = interiorImage.source[0].width;
          interiorHeight = interiorImage.source[0].height;
        }
      }
      
      // Apply scale factor to calculate the actual displayed dimensions
      const scaledWidth = interiorWidth * scale;
      const scaledHeight = interiorHeight * scale;
      
      // Position the interior map precisely at the center
      const centerX = Math.floor(deviceWidth / 2);
      const centerY = Math.floor(deviceHeight / 2);
      this.map.setPosition(centerX, centerY);
      
      // Set camera and physics bounds to match the scaled interior size and position
      const boundsX = centerX - (scaledWidth / 2);
      const boundsY = centerY - (scaledHeight / 2);
      
      this.scene.physics.world.setBounds(
        boundsX,
        boundsY,
        scaledWidth,
        scaledHeight
      );
      
      this.scene.cameras.main.setBounds(
        boundsX,
        boundsY,
        scaledWidth,
        scaledHeight
      );
      
      // Simple, fixed maxZoom for interior areas
      const maxZoom = 0.7; // Adjust this value to change how zoomed in you are inside buildings
      
      // Get camera and set zoom
      const camera = this.scene.cameras.main as ExtendedCamera;
      camera.setZoom(maxZoom);
      
      // Store camera settings for restoration later
      camera._origMinZoom = camera.minZoom || 0.25;
      camera._origMaxZoom = camera.maxZoom || 2.0;
      
      // Set both minZoom and maxZoom to the same value to lock zoom
      camera.minZoom = maxZoom;
      camera.maxZoom = maxZoom;
      
      return { x: centerX, y: centerY };
    } catch (error) {
      console.error('Error entering building:', error);
      this.isInBuilding = false;
      this.currentBuildingType = null;
      return { x: playerX, y: playerY };
    }
  }

  exitBuilding(): { x: number, y: number } | null {
    if (!this.lastOutdoorPosition) return null;
    
    // Reset building state immediately
    this.isInBuilding = false;
    this.currentBuildingType = null;
    
    // Switch back to outdoor map - immediate texture swap
    this.map.setTexture('map');
    this.map.setDepth(-10);
    
    // Reset origin to 0,0 for outdoor map
    this.map.setOrigin(0, 0);
    
    // Reset position to origin
    this.map.setPosition(0, 0);
    
    // Reset scale to 1
    this.map.setScale(1);
    
    // Restore original min/max zoom constraints if they were saved
    const camera = this.scene.cameras.main as ExtendedCamera;
    
    if (camera._origMinZoom !== undefined && camera._origMaxZoom !== undefined) {
      camera.minZoom = camera._origMinZoom;
      camera.maxZoom = camera._origMaxZoom;
      
      // Reset zoom to a comfortable default value
      camera.setZoom(0.7);
    }
    
    // Reset physics world bounds to outdoor map dimensions
    this.scene.physics.world.setBounds(0, 0, this.mapCache.width, this.mapCache.height);
    
    // Use the main scene's setupCameraBounds method for consistent camera bounds handling
    // This is cleaner than duplicating the logic here
    if (this.scene instanceof Scene) {
      // Call the setupCameraBounds method if it exists on the scene
      const sceneWithBounds = this.scene as { setupCameraBounds?: () => void };
      if (typeof sceneWithBounds.setupCameraBounds === 'function') {
        sceneWithBounds.setupCameraBounds();
      } else {
        // Fallback if the method doesn't exist
        this.setDefaultCameraBounds();
      }
    } else {
      // Fallback if scene is not a Scene instance
      this.setDefaultCameraBounds();
    }
    
    return this.lastOutdoorPosition;
  }
  
  // Fallback method for setting camera bounds
  private setDefaultCameraBounds(): void {
    const camera = this.scene.cameras.main as ExtendedCamera;
    const zoom = camera.zoom || 0.7;
    
    // Calculate the visible area based on zoom level
    const visibleWidth = camera.width / zoom;
    const visibleHeight = camera.height / zoom;
    
    // Calculate the bounds with half the visible area as padding
    const boundsX = Math.min(visibleWidth / 2, this.mapCache.width / 4);
    const boundsY = Math.min(visibleHeight / 2, this.mapCache.height / 4);
    const boundsWidth = Math.max(0, this.mapCache.width - visibleWidth);
    const boundsHeight = Math.max(0, this.mapCache.height - visibleHeight);
    
    // Set camera bounds
    camera.setBounds(boundsX, boundsY, boundsWidth, boundsHeight);
  }

  getMapWidth(): number {
    return this.mapCache.width;
  }

  getMapHeight(): number {
    return this.mapCache.height;
  }

  isPlayerInBuilding(): boolean {
    return this.isInBuilding;
  }
  
  getCurrentBuildingType(): 'bank' | 'stockmarket' | null {
    return this.currentBuildingType;
  }
}