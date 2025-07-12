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

// Available games lobby
let availableGames = {};
let activeGames = {}; // Store games that are currently running
let gameCounter = 0;

// Game constants
const OBSTACLE_SPAWN_RATE = 2000; // milliseconds
const MAX_PLAYERS = 2;
const DIFFICULTY_SPEED_INCREASE = 0.5; // speed increase per 10 seconds
const MAX_GAME_SPEED = 15;

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);

  // Handle start game
  socket.on('startGame', (playerData) => {
    const { playerName, gameMode, difficulty, character } = playerData;
    
    gameCounter++;
    const gameId = `game_${gameCounter}`;
    
    const newGame = {
      id: gameId,
      host: socket.id,
      hostName: playerName,
      gameMode: gameMode,
      difficulty: difficulty || 'medium',
      players: {},
      gameStarted: false,
      obstacles: [],
      gameSpeed: 5,
      lastObstacleTime: 0,
      countdown: 3,
      gameTime: 0,
      createdAt: Date.now()
    };
    
    // Add host as first player
    newGame.players[socket.id] = {
      id: socket.id,
      name: playerName || 'Host',
      x: 50,
      y: 300,
      velocity: 0,
      isJumping: false,
      distance: 0,
      isAlive: true,
      score: 0,
      character: character || 'dino',
      gameMode: gameMode
    };
    
    availableGames[gameId] = newGame;
    
    socket.join(gameId);
    socket.emit('gameStarted', { gameId, game: newGame });
    socket.emit('gameUpdate', newGame);
    io.emit('updateAvailableGames', getAvailableGamesList());
    
    console.log(`Game ${gameId} started by ${playerName}`);
  });

  // Handle join specific game
  socket.on('joinGame', (data) => {
    const { gameId, playerName, character } = data;
    
    console.log(`Player ${playerName} trying to join game ${gameId}`);
    
    if (!availableGames[gameId]) {
      console.log(`Game ${gameId} not found`);
      socket.emit('gameNotFound');
      return;
    }
    
    const game = availableGames[gameId];
    
    if (Object.keys(game.players).length >= MAX_PLAYERS) {
      console.log(`Game ${gameId} is full`);
      socket.emit('gameFull');
      return;
    }
    
    if (game.gameStarted) {
      console.log(`Game ${gameId} already in progress`);
      socket.emit('gameInProgress');
      return;
    }
    
    const playerId = socket.id;
    game.players[playerId] = {
      id: playerId,
      name: playerName || `Player ${Object.keys(game.players).length + 1}`,
      x: 50,
      y: 300,
      velocity: 0,
      isJumping: false,
      distance: 0,
      isAlive: true,
      score: 0,
      character: character || 'dino',
      gameMode: game.gameMode
    };
    
    console.log(`Player ${playerName} joined game ${gameId}. Total players: ${Object.keys(game.players).length}`);
    
    socket.join(gameId);
    socket.emit('playerJoined', game.players[playerId]);
    io.to(gameId).emit('updatePlayers', game.players);
    
    // Send current game state to the joining player
    socket.emit('gameUpdate', game);
    
    // Start game if we have 2 players
    if (Object.keys(game.players).length === MAX_PLAYERS) {
      console.log(`Starting game ${gameId} with 2 players`);
      game.gameStarted = true;
      
      // Move game from available to active
      activeGames[gameId] = game;
      delete availableGames[gameId];
      
      io.to(gameId).emit('gameStart');
      startCountdown(gameId);
      io.emit('updateAvailableGames', getAvailableGamesList());
    }
  });

  // Handle get available games
  socket.on('getAvailableGames', () => {
    socket.emit('updateAvailableGames', getAvailableGamesList());
  });

  // Handle player movement
  socket.on('playerJump', () => {
    // Find the game this player is in
    const game = findPlayerGame(socket.id);
    if (game && game.players[socket.id] && game.players[socket.id].isAlive) {
      const player = game.players[socket.id];
      if (!player.isJumping) {
        player.velocity = -15;
        player.isJumping = true;
      }
    }
  });

  // Handle player disconnect
  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
    
    // Find and remove player from their game
    const game = findPlayerGame(socket.id);
    if (game) {
      delete game.players[socket.id];
      
      if (Object.keys(game.players).length === 0) {
        // Remove empty game
        if (availableGames[game.id]) {
          delete availableGames[game.id];
        }
        if (activeGames[game.id]) {
          delete activeGames[game.id];
        }
        io.emit('updateAvailableGames', getAvailableGamesList());
      } else {
        io.to(game.id).emit('updatePlayers', game.players);
      }
    }
  });

  // Handle game restart
  socket.on('restartGame', () => {
    const game = findPlayerGame(socket.id);
    if (game) {
      resetGame(game);
      io.to(game.id).emit('gameRestart');
    }
  });
});

// Get available games list
function getAvailableGamesList() {
  return Object.values(availableGames).map(game => ({
    id: game.id,
    hostName: game.hostName,
    gameMode: game.gameMode,
    difficulty: game.difficulty,
    createdAt: game.createdAt,
    timeAgo: Math.floor((Date.now() - game.createdAt) / 1000)
  }));
}

// Countdown function
function startCountdown(gameId) {
  const game = availableGames[gameId] || activeGames[gameId];
  if (!game) {
    console.log(`Game ${gameId} not found for countdown`);
    return;
  }
  
  console.log(`Starting countdown for game ${gameId}`);
  game.countdown = 3;
  io.to(gameId).emit('countdown', game.countdown);
  
  const countdownInterval = setInterval(() => {
    game.countdown--;
    io.to(gameId).emit('countdown', game.countdown);
    
    if (game.countdown <= 0) {
      clearInterval(countdownInterval);
      startGameLoop(gameId);
    }
  }, 1000);
}

// Find which game a player is in
function findPlayerGame(playerId) {
  // Check available games
  for (const gameId in availableGames) {
    const game = availableGames[gameId];
    if (game.players[playerId]) {
      return game;
    }
  }
  
  // Check active games
  for (const gameId in activeGames) {
    const game = activeGames[gameId];
    if (game.players[playerId]) {
      return game;
    }
  }
  
  return null;
}

// Get game by ID
function getGameById(gameId) {
  // Check available games first
  if (availableGames[gameId]) {
    return availableGames[gameId];
  }
  
  // Check active games
  if (activeGames[gameId]) {
    return activeGames[gameId];
  }
  
  return null;
}

// Game loop
function startGameLoop(gameId) {
  const game = availableGames[gameId] || activeGames[gameId];
  if (!game) {
    console.log(`Game ${gameId} not found for game loop`);
    return;
  }
  
  console.log(`Starting game loop for game ${gameId}`);
  
  const gameLoop = setInterval(() => {
    if (!game.gameStarted) {
      console.log(`Game ${gameId} stopped, clearing loop`);
      clearInterval(gameLoop);
      return;
    }

    updateGame(game);
    io.to(gameId).emit('gameUpdate', game);
  }, 1000 / 60); // 60 FPS
}

// Update game state
function updateGame(game) {
  const currentTime = Date.now();
  game.gameTime += 1/60; // Increment game time

  // Increase difficulty over time
  if (game.gameTime > 0 && game.gameTime % 10 < 1/60) { // Every 10 seconds
    if (game.gameSpeed < MAX_GAME_SPEED) {
      game.gameSpeed += DIFFICULTY_SPEED_INCREASE;
      console.log(`Speed increased to: ${game.gameSpeed}`);
    }
  }

  // Update players
  Object.values(game.players).forEach(player => {
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
    player.distance += game.gameSpeed;
    player.score = Math.floor(player.distance / 10);
  });

  // Spawn obstacles based on difficulty
  const spawnRate = game.difficulty === 'easy' ? 2500 : 
                   game.difficulty === 'medium' ? 2000 : 1500;
  
  if (currentTime - game.lastObstacleTime > spawnRate) {
    spawnObstacle(game);
    game.lastObstacleTime = currentTime;
    console.log(`Obstacles count: ${game.obstacles.length}`);
  }

  // Update obstacles
  game.obstacles = game.obstacles.filter(obstacle => {
    obstacle.x -= game.gameSpeed;
    return obstacle.x > -50;
  });

  // Check collisions
  checkCollisions(game);

  // Check if game should end
  const alivePlayers = Object.values(game.players).filter(p => p.isAlive);
  if (alivePlayers.length === 0) {
    endGame(game);
  }
}

// Spawn random obstacle
function spawnObstacle(game) {
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

  game.obstacles.push(obstacle);
  console.log(`Spawned ${type} obstacle at x=${obstacle.x}, y=${obstacle.y}`);
}

// Check for collisions
function checkCollisions(game) {
  Object.values(game.players).forEach(player => {
    if (!player.isAlive) return;

    game.obstacles.forEach(obstacle => {
      // Player collision box: x=50, width=60 (40 body + 20 head)
      // Player collision box: y=player.y, height=50
      if (50 < obstacle.x + obstacle.width &&
          50 + 60 > obstacle.x &&
          player.y < obstacle.y + obstacle.height &&
          player.y + 50 > obstacle.y) {
        player.isAlive = false;
        console.log(`Player ${player.name} died from ${obstacle.type} collision!`);
        io.to(game.id).emit('playerDied', player.id);
      }
    });
  });
}

// End game
function endGame(game) {
  game.gameStarted = false;
  const winner = Object.values(game.players).reduce((prev, current) => 
    (prev.score > current.score) ? prev : current
  );
  io.to(game.id).emit('gameEnd', winner);
}

// Reset game state
function resetGame(game) {
  if (game) {
    game.players = {};
    game.gameStarted = false;
    game.obstacles = [];
    game.gameSpeed = 5;
    game.lastObstacleTime = 0;
    game.countdown = 3;
    game.gameTime = 0;
  }
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} to play the game!`);
}); 