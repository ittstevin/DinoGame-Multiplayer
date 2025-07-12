const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// Game state
let gameState = {
  players: {},
  gameStarted: false,
  obstacles: [],
  gameSpeed: 5,
  lastObstacleTime: 0
};

// Game constants
const OBSTACLE_SPAWN_RATE = 2000; // milliseconds
const MAX_PLAYERS = 2;

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);

  // Handle player join
  socket.on('joinGame', (playerName) => {
    if (Object.keys(gameState.players).length >= MAX_PLAYERS) {
      socket.emit('gameFull');
      return;
    }

    if (gameState.gameStarted) {
      socket.emit('gameInProgress');
      return;
    }

    const playerId = socket.id;
    gameState.players[playerId] = {
      id: playerId,
      name: playerName || `Player ${Object.keys(gameState.players).length + 1}`,
      x: 50,
      y: 300,
      velocity: 0,
      isJumping: false,
      distance: 0,
      isAlive: true,
      score: 0
    };

    socket.emit('playerJoined', gameState.players[playerId]);
    io.emit('updatePlayers', gameState.players);

    // Start game if we have 2 players
    if (Object.keys(gameState.players).length === MAX_PLAYERS) {
      gameState.gameStarted = true;
      io.emit('gameStart');
      startGameLoop();
    }
  });

  // Handle player movement
  socket.on('playerJump', () => {
    if (gameState.players[socket.id] && gameState.players[socket.id].isAlive) {
      const player = gameState.players[socket.id];
      if (!player.isJumping) {
        player.velocity = -15;
        player.isJumping = true;
      }
    }
  });

  // Handle player disconnect
  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
    delete gameState.players[socket.id];
    
    if (Object.keys(gameState.players).length === 0) {
      resetGame();
    } else {
      io.emit('updatePlayers', gameState.players);
    }
  });

  // Handle game restart
  socket.on('restartGame', () => {
    resetGame();
    io.emit('gameRestart');
  });
});

// Game loop
function startGameLoop() {
  const gameLoop = setInterval(() => {
    if (!gameState.gameStarted) {
      clearInterval(gameLoop);
      return;
    }

    updateGame();
    io.emit('gameUpdate', gameState);
  }, 1000 / 60); // 60 FPS
}

// Update game state
function updateGame() {
  const currentTime = Date.now();

  // Update players
  Object.values(gameState.players).forEach(player => {
    if (!player.isAlive) return;

    // Update jump physics
    if (player.isJumping) {
      player.y += player.velocity;
      player.velocity += 0.8; // gravity

      if (player.y >= 300) {
        player.y = 300;
        player.velocity = 0;
        player.isJumping = false;
      }
    }

    // Update distance
    player.distance += gameState.gameSpeed;
    player.score = Math.floor(player.distance / 10);
  });

  // Spawn obstacles
  if (currentTime - gameState.lastObstacleTime > OBSTACLE_SPAWN_RATE) {
    spawnObstacle();
    gameState.lastObstacleTime = currentTime;
    console.log(`Obstacles count: ${gameState.obstacles.length}`);
  }

  // Update obstacles
  gameState.obstacles = gameState.obstacles.filter(obstacle => {
    obstacle.x -= gameState.gameSpeed;
    return obstacle.x > -50;
  });

  // Check collisions
  checkCollisions();

  // Check if game should end
  const alivePlayers = Object.values(gameState.players).filter(p => p.isAlive);
  if (alivePlayers.length === 0) {
    endGame();
  }
}

// Spawn random obstacle
function spawnObstacle() {
  const obstacleTypes = ['cactus', 'pterodactyl'];
  const type = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
  
  const obstacle = {
    id: Date.now(),
    type: type,
    x: 400, // Start closer to the screen
    y: type === 'cactus' ? 300 : 200 + Math.random() * 100,
    width: type === 'cactus' ? 30 : 50,
    height: type === 'cactus' ? 60 : 30
  };

  gameState.obstacles.push(obstacle);
  console.log(`Spawned ${type} obstacle at x=${obstacle.x}, y=${obstacle.y}`);
}

// Check for collisions
function checkCollisions() {
  Object.values(gameState.players).forEach(player => {
    if (!player.isAlive) return;

    gameState.obstacles.forEach(obstacle => {
      // Player collision box: x=50, width=60 (40 body + 20 head)
      // Player collision box: y=player.y, height=50
      if (50 < obstacle.x + obstacle.width &&
          50 + 60 > obstacle.x &&
          player.y < obstacle.y + obstacle.height &&
          player.y + 50 > obstacle.y) {
        player.isAlive = false;
        console.log(`Player ${player.name} died from ${obstacle.type} collision!`);
        io.emit('playerDied', player.id);
      }
    });
  });
}

// End game
function endGame() {
  gameState.gameStarted = false;
  const winner = Object.values(gameState.players).reduce((prev, current) => 
    (prev.score > current.score) ? prev : current
  );
  io.emit('gameEnd', winner);
}

// Reset game state
function resetGame() {
  gameState = {
    players: {},
    gameStarted: false,
    obstacles: [],
    gameSpeed: 5,
    lastObstacleTime: 0
  };
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} to play the game!`);
}); 