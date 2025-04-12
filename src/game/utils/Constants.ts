/**
 * Game-wide constants
 */
export const Constants = {
  // Player settings
  PLAYER_SPEED: 500,
  
  // Interaction distances
  BUILDING_INTERACTION_DISTANCE: 100,
  INTERACTION_DISTANCE: 100,
  
  // WebSocket settings
  WS_SERVER_URL: 'wss://dhaniverseapi.deno.dev/ws',
  WS_RECONNECT_DELAY: 5000,
  WS_POSITION_THRESHOLD: 5, // Only send updates when player moves more than this amount
  
  // Debug settings
  SHOW_DEBUG_VISUALS: false,
  COLLISION_COLOR: 0xff0000,
  COLLISION_ALPHA: 0.3
};