// Game state
let socket;
let playerId;
let gameState = {
    players: {},
    obstacles: [],
    gameStarted: false
};

// Canvas setup
const player1Canvas = document.getElementById('player1Canvas');
const player2Canvas = document.getElementById('player2Canvas');
const player1Ctx = player1Canvas.getContext('2d');
const player2Ctx = player2Canvas.getContext('2d');

// UI elements
const lobby = document.getElementById('lobby');
const gameArea = document.getElementById('gameArea');
const gameOver = document.getElementById('gameOver');
const playerNameInput = document.getElementById('playerName');
const joinBtn = document.getElementById('joinBtn');
const waitingMessage = document.getElementById('waitingMessage');
const gameStatus = document.getElementById('gameStatus');
const player1Score = document.getElementById('player1Score');
const player2Score = document.getElementById('player2Score');
const winnerMessage = document.getElementById('winnerMessage');
const finalScores = document.getElementById('finalScores');
const playAgainBtn = document.getElementById('playAgainBtn');

// Initialize the game
function init() {
    // Connect to WebSocket server
    socket = io();
    
    // Event listeners
    joinBtn.addEventListener('click', joinGame);
    playAgainBtn.addEventListener('click', restartGame);
    
    // Keyboard controls
    document.addEventListener('keydown', handleKeyPress);
    
    // Canvas click controls
    player1Canvas.addEventListener('click', () => jump());
    player2Canvas.addEventListener('click', () => jump());
    
    // Socket event listeners
    setupSocketListeners();
}

// Setup WebSocket event listeners
function setupSocketListeners() {
    socket.on('playerJoined', (player) => {
        playerId = player.id;
        console.log('Joined as:', player.name);
        
        if (Object.keys(gameState.players).length === 1) {
            showWaitingMessage();
        }
    });
    
    socket.on('updatePlayers', (players) => {
        gameState.players = players;
        updatePlayerDisplay();
    });
    
    socket.on('gameStart', () => {
        gameState.gameStarted = true;
        showGameArea();
        gameStatus.textContent = 'Game Started!';
    });
    
    socket.on('gameUpdate', (newGameState) => {
        gameState = newGameState;
        updateScores();
        renderGame();
        
        // Debug: log obstacles
        if (gameState.obstacles && gameState.obstacles.length > 0) {
            console.log(`Client received ${gameState.obstacles.length} obstacles:`, gameState.obstacles);
        }
    });
    
    socket.on('playerDied', (deadPlayerId) => {
        if (deadPlayerId === playerId) {
            gameStatus.textContent = 'You died!';
        } else {
            gameStatus.textContent = 'Opponent died!';
        }
    });
    
    socket.on('gameEnd', (winner) => {
        gameState.gameStarted = false;
        showGameOver(winner);
    });
    
    socket.on('gameRestart', () => {
        resetGame();
    });
    
    socket.on('gameFull', () => {
        alert('Game is full! Please wait for the next round.');
    });
    
    socket.on('gameInProgress', () => {
        alert('Game is already in progress! Please wait for the next round.');
    });
}

// Join game
function joinGame() {
    const playerName = playerNameInput.value.trim() || 'Anonymous';
    socket.emit('joinGame', playerName);
}

// Show waiting message
function showWaitingMessage() {
    waitingMessage.style.display = 'block';
    joinBtn.disabled = true;
    playerNameInput.disabled = true;
}

// Show game area
function showGameArea() {
    lobby.style.display = 'none';
    gameArea.style.display = 'block';
    gameOver.style.display = 'none';
}

// Show game over screen
function showGameOver(winner) {
    gameArea.style.display = 'none';
    gameOver.style.display = 'block';
    
    const players = Object.values(gameState.players);
    const sortedPlayers = players.sort((a, b) => b.score - a.score);
    
    winnerMessage.textContent = `${winner.name} wins with ${winner.score} points!`;
    
    let scoresText = '';
    sortedPlayers.forEach((player, index) => {
        const position = index === 0 ? '🥇' : '🥈';
        scoresText += `${position} ${player.name}: ${player.score} points\n`;
    });
    
    finalScores.textContent = scoresText;
}

// Restart game
function restartGame() {
    socket.emit('restartGame');
    resetGame();
}

// Reset game state
function resetGame() {
    gameState = {
        players: {},
        obstacles: [],
        gameStarted: false
    };
    
    gameArea.style.display = 'none';
    gameOver.style.display = 'none';
    lobby.style.display = 'block';
    waitingMessage.style.display = 'none';
    
    joinBtn.disabled = false;
    playerNameInput.disabled = false;
    playerNameInput.value = '';
    
    gameStatus.textContent = 'Ready to start!';
    player1Score.textContent = '0';
    player2Score.textContent = '0';
    
    // Clear canvases
    player1Ctx.clearRect(0, 0, player1Canvas.width, player1Canvas.height);
    player2Ctx.clearRect(0, 0, player2Canvas.width, player2Canvas.height);
}

// Handle keyboard input
function handleKeyPress(event) {
    if (event.code === 'Space' && gameState.gameStarted) {
        event.preventDefault();
        jump();
    }
}

// Jump function
function jump() {
    if (gameState.gameStarted) {
        socket.emit('playerJump');
    }
}

// Update player display
function updatePlayerDisplay() {
    const players = Object.values(gameState.players);
    if (players.length > 0) {
        // Update player labels based on who joined first
        const playerLabels = document.querySelectorAll('.player-label');
        players.forEach((player, index) => {
            if (playerLabels[index]) {
                playerLabels[index].textContent = player.name;
            }
        });
    }
}

// Update scores
function updateScores() {
    const players = Object.values(gameState.players);
    if (players.length >= 1) {
        player1Score.textContent = players[0].score || 0;
    }
    if (players.length >= 2) {
        player2Score.textContent = players[1].score || 0;
    }
}

// Render game
function renderGame() {
    // Clear canvases
    player1Ctx.clearRect(0, 0, player1Canvas.width, player1Canvas.height);
    player2Ctx.clearRect(0, 0, player2Canvas.width, player2Canvas.height);
    
    // Draw ground
    drawGround(player1Ctx);
    drawGround(player2Ctx);
    
    // Draw players
    const players = Object.values(gameState.players);
    if (players.length >= 1) {
        drawPlayer(player1Ctx, players[0], 50);
    }
    if (players.length >= 2) {
        drawPlayer(player2Ctx, players[1], 50);
    }
    
    // Draw obstacles
    gameState.obstacles.forEach(obstacle => {
        drawObstacle(player1Ctx, obstacle);
        drawObstacle(player2Ctx, obstacle);
    });
}

// Draw ground
function drawGround(ctx) {
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(0, 350, ctx.canvas.width, 50);
    
    // Draw ground texture
    ctx.strokeStyle = '#34495e';
    ctx.lineWidth = 2;
    for (let i = 0; i < ctx.canvas.width; i += 20) {
        ctx.beginPath();
        ctx.moveTo(i, 350);
        ctx.lineTo(i, 400);
        ctx.stroke();
    }
}

// Draw player
function drawPlayer(ctx, player, x) {
    if (!player.isAlive) {
        // Draw dead player (red)
        ctx.fillStyle = '#e74c3c';
    } else {
        ctx.fillStyle = '#27ae60';
    }
    
    // Draw dino body
    ctx.fillRect(x, player.y, 40, 50);
    
    // Draw dino head
    ctx.fillRect(x + 35, player.y - 10, 20, 25);
    
    // Draw dino eye
    ctx.fillStyle = '#fff';
    ctx.fillRect(x + 45, player.y - 5, 5, 5);
    
    // Draw dino legs
    ctx.fillStyle = '#27ae60';
    ctx.fillRect(x + 5, player.y + 50, 8, 15);
    ctx.fillRect(x + 25, player.y + 50, 8, 15);
    
    // Draw player name
    ctx.fillStyle = '#2c3e50';
    ctx.font = '12px Courier New';
    ctx.fillText(player.name, x, player.y - 20);
}

// Draw obstacle
function drawObstacle(ctx, obstacle) {
    if (obstacle.type === 'cactus') {
        // Draw cactus
        ctx.fillStyle = '#27ae60';
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        
        // Draw cactus details
        ctx.fillStyle = '#2ecc71';
        ctx.fillRect(obstacle.x + 5, obstacle.y + 10, 5, 10);
        ctx.fillRect(obstacle.x + 20, obstacle.y + 15, 5, 10);
        
        // Debug: draw collision box
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 1;
        ctx.strokeRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    } else if (obstacle.type === 'pterodactyl') {
        // Draw pterodactyl
        ctx.fillStyle = '#8e44ad';
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        
        // Draw wings
        ctx.fillStyle = '#9b59b6';
        ctx.fillRect(obstacle.x - 10, obstacle.y + 5, 15, 8);
        ctx.fillRect(obstacle.x + obstacle.width - 5, obstacle.y + 5, 15, 8);
        
        // Draw head
        ctx.fillStyle = '#8e44ad';
        ctx.fillRect(obstacle.x + obstacle.width - 10, obstacle.y - 5, 10, 10);
        
        // Debug: draw collision box
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 1;
        ctx.strokeRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    }
}

// Initialize the game when page loads
document.addEventListener('DOMContentLoaded', init); 