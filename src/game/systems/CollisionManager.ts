import { GameObjects, Physics } from 'phaser';
import { Constants } from '../utils/Constants.ts';
import { MainGameScene } from '../scenes/MainScene.ts';

interface CollisionBoxData {
  id?: string;
  points: {
    A: { x: number; y: number; };
    B: { x: number; y: number; };
    C: { x: number; y: number; };
    D: { x: number; y: number; };
  };
}

interface CollisionBox extends GameObjects.Rectangle {
  label?: GameObjects.Text;
}

export class CollisionManager {
  private scene: MainGameScene;
  private collisionObjects: CollisionBox[] = [];
  private spatialGrid: Map<string, CollisionBox[]> = new Map(); // Grid for spatial partitioning
  private gridCellSize: number = 500; // Size of each grid cell
  private collisionCache: Map<string, boolean> = new Map(); // Cache collision results
  private cacheTTL: number = 100; // Time in ms before cache entry expires

  constructor(scene: MainGameScene) {
    this.scene = scene;
    this.setupCollisions();
  }

  update(): void {
    const player = this.scene.getPlayer();
    if (!player || this.collisionObjects.length === 0) return;
    
    // Get player sprite for collision checks
    const playerSprite = player.getSprite();
    
    // Get grid cell for player position
    const gridX = Math.floor(playerSprite.x / this.gridCellSize);
    const gridY = Math.floor(playerSprite.y / this.gridCellSize);
    
    // Check nearby grid cells for collisions
    const relevantColliders: CollisionBox[] = [];
    
    // Check the current cell and adjacent cells
    for (let x = gridX - 1; x <= gridX + 1; x++) {
      for (let y = gridY - 1; y <= gridY + 1; y++) {
        const cellKey = `${x},${y}`;
        const cellColliders = this.spatialGrid.get(cellKey);
        
        if (cellColliders) {
          relevantColliders.push(...cellColliders);
        }
      }
    }
    
    // Apply collisions only with nearby objects
    if (relevantColliders.length > 0) {
      this.scene.physics.collide(playerSprite, relevantColliders);
    }
    
    // Clear expired cache entries
    const now = Date.now();
    for (const [key, _entry] of this.collisionCache.entries()) {
      if (now - parseInt(key.split('|')[2]) > this.cacheTTL) {
        this.collisionCache.delete(key);
      }
    }
  }

  private setupCollisions(): void {
    this.createRectangleCollisions();
  }

  private createRectangleCollisions(): void {
    const collisionData = this.scene.cache.json.get('collisionData');
    const gameContainer = this.scene.getGameContainer();
    
    if (!collisionData?.rectangles || !gameContainer) {
      console.warn('No collision data found or game container not available');
      return;
    }
    
    collisionData.rectangles.forEach((boxData: CollisionBoxData) => {
      const { points } = boxData;
      
      if (!points?.A || !points?.B || !points?.C || !points?.D) {
        console.error('Invalid collision rectangle format:', boxData);
        return;
      }
      
      // Calculate width and height from points
      const width = Math.abs(points.B.x - points.A.x);
      const height = Math.abs(points.C.y - points.B.y);
      
      // Calculate center point
      const centerX = points.A.x + (width / 2);
      const centerY = points.A.y + (height / 2);
      
      // Create a rectangle for each collision box
      const box = this.scene.add.rectangle(
        centerX, 
        centerY,
        width, 
        height
      ) as CollisionBox;
      
      // Add physics to the collision box
      this.scene.physics.add.existing(box, true);
      
      // Make the physics body match the visual rectangle exactly
      const body = box.body as Physics.Arcade.StaticBody;
      body.setSize(width, height);
      body.offset.x = 0;
      body.offset.y = 0;
      
      // Optimize collision checking
      body.updateFromGameObject();
      
      // Only show debug visuals if enabled
      if (Constants.SHOW_DEBUG_VISUALS) {
        box.setStrokeStyle(2, Constants.COLLISION_COLOR);
        box.setFillStyle(Constants.COLLISION_COLOR, Constants.COLLISION_ALPHA);
        
        // Add label with ID if debug mode is on and ID exists
        if (boxData.id) {
          const idText = this.scene.add.text(centerX, centerY, `ID: ${boxData.id}`, {
            fontSize: '14px',
            color: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 4, y: 2 }
          }).setOrigin(0.5);
          
          gameContainer.add(idText);
          box.label = idText;
        }
      } else {
        box.setAlpha(0);
      }
      
      // Add to collision objects array
      this.collisionObjects.push(box);
      
      // Add to game container
      gameContainer.add(box);
      
      // Add to spatial grid for more efficient collision detection
      this.addToSpatialGrid(box, centerX, centerY, width, height);
    });
    
    console.log(`Created ${this.collisionObjects.length} collision objects across ${this.spatialGrid.size} grid cells`);
  }
  
  private addToSpatialGrid(box: CollisionBox, x: number, y: number, width: number, height: number): void {
    // Calculate grid cells that this collision box overlaps
    const startGridX = Math.floor((x - width/2) / this.gridCellSize);
    const endGridX = Math.floor((x + width/2) / this.gridCellSize);
    const startGridY = Math.floor((y - height/2) / this.gridCellSize);
    const endGridY = Math.floor((y + height/2) / this.gridCellSize);
    
    // Add to all overlapping grid cells
    for (let gridX = startGridX; gridX <= endGridX; gridX++) {
      for (let gridY = startGridY; gridY <= endGridY; gridY++) {
        const cellKey = `${gridX},${gridY}`;
        
        if (!this.spatialGrid.has(cellKey)) {
          this.spatialGrid.set(cellKey, []);
        }
        
        this.spatialGrid.get(cellKey)?.push(box);
      }
    }
  }
  
  // Helper method to check if a point would collide with any collision object
  hasCollisionAt(x: number, y: number): boolean {
    // Check cache first
    const now = Date.now();
    const cacheKey = `${Math.round(x)},${Math.round(y)}|${now}`;
    
    if (this.collisionCache.has(cacheKey)) {
      return this.collisionCache.get(cacheKey) as boolean;
    }
    
    // Get grid cell for the position
    const gridX = Math.floor(x / this.gridCellSize);
    const gridY = Math.floor(y / this.gridCellSize);
    const cellKey = `${gridX},${gridY}`;
    
    const cellColliders = this.spatialGrid.get(cellKey);
    if (!cellColliders) {
      // No colliders in this cell
      this.collisionCache.set(cacheKey, false);
      return false;
    }
    
    // Check collision with each object in the cell
    for (const box of cellColliders) {
      const body = box.body as Physics.Arcade.StaticBody;
      if (body) {
        const left = box.x - body.width / 2;
        const right = box.x + body.width / 2;
        const top = box.y - body.height / 2;
        const bottom = box.y + body.height / 2;
        
        if (x >= left && x <= right && y >= top && y <= bottom) {
          this.collisionCache.set(cacheKey, true);
          return true;
        }
      }
    }
    
    this.collisionCache.set(cacheKey, false);
    return false;
  }
  
  getCollisionObjects(): CollisionBox[] {
    return this.collisionObjects;
  }
}