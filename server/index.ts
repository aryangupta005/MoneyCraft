import { Application, Router } from "https://deno.land/x/oak@v17.1.3/mod.ts";

interface Player {
    id: string;
    username: string;
    x: number;
    y: number;
    animation: string;
}

// Store active connections and players
const players = new Map<string, Player>();
const connections = new Map<string, WebSocket>();

// Create an Oak application
const app = new Application();
const router = new Router();

// Simple health check route to ensure the server is running
router.get("/", (ctx) => {
  ctx.response.body = "WebSocket server is running! Connect with a WebSocket client.";
});

// Handle WebSocket connections
router.get("/ws", async (ctx) => {
  if (!ctx.isUpgradable) {
    ctx.response.status = 400;
    ctx.response.body = "This endpoint requires a WebSocket connection";
    return;
  }

  // Upgrade the connection to WebSocket
  const ws = await ctx.upgrade();
  const playerId = crypto.randomUUID();
  console.log("New client connected, ID:", playerId);
  connections.set(playerId, ws);

  // Handle incoming messages
  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case "join":
          // Initialize player with username
          const player: Player = {
            id: playerId,
            username: data.username,
            x: data.x,
            y: data.y,
            animation: 'idle-down'
          };
          players.set(playerId, player);

          // Send join confirmation
          ws.send(JSON.stringify({
            type: "connect",
            id: playerId,
            player: player
          }));

          // Send existing players to the new player
          ws.send(JSON.stringify({
            type: "players",
            players: Array.from(players.values())
          }));

          // Broadcast new player to others
          connections.forEach((client, id) => {
            if (id !== playerId && client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                type: "playerJoined",
                player: player
              }));
            }
          });
          break;

        case "update":
          // Update player position and animation
          const playerData = players.get(playerId);
          if (playerData) {
            playerData.x = data.x;
            playerData.y = data.y;
            playerData.animation = data.animation;
            players.set(playerId, playerData);

            // Broadcast to all other clients
            connections.forEach((client, id) => {
              if (id !== playerId && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                  type: "playerUpdate",
                  player: playerData
                }));
              }
            });
          }
          break;
      }
    } catch (e) {
      console.error("Error processing message:", e);
    }
  };

  // Handle disconnection
  ws.onclose = () => {
    console.log("Client disconnected, ID:", playerId);
    const player = players.get(playerId);
    
    // Remove player and notify others
    players.delete(playerId);
    connections.delete(playerId);
    
    connections.forEach((client, id) => {
      if (id !== playerId && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: "playerDisconnect",
          id: playerId,
          username: player?.username
        }));
      }
    });
  };
});

// Add router middleware
app.use(router.routes());
app.use(router.allowedMethods());

// Define the server domain
const SERVER_DOMAIN = "dhaniverse.deno.dev";

// Start the server
const port = parseInt(Deno.env.get("PORT") || "8000");
console.log(`Server running on https://${SERVER_DOMAIN}`);

// Start the Oak application
await app.listen({ port });