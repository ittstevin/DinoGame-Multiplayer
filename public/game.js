// Game state
let socket;
let playerId;
let gameState = {
    players: {},
    obstacles: [],
    gameStarted: false,
    gameSpeed: 5,
    gameTime: 0
};

// UI state
let selectedGameMode = 'multiplayer';
let selectedDifficulty = 'medium';
let selectedCharacter = 'dino';

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
const waitingMessage = document.getElementById('waitingMessage');
const gameStatus = document.getElementById('gameStatus');
const player1Score = document.getElementById('player1Score');
const player2Score = document.getElementById('player2Score');
const winnerMessage = document.getElementById('winnerMessage');
const finalScores = document.getElementById('finalScores');
const playAgainBtn = document.getElementById('playAgainBtn');

// New UI elements
const countdownOverlay = document.getElementById('countdownOverlay');
const countdownText = document.getElementById('countdownText');
const gameSpeed = document.getElementById('gameSpeed');
const gameMode = document.getElementById('gameMode');
const player1Name = document.getElementById('player1Name');
const player2Name = document.getElementById('player2Name');
const player2Info = document.getElementById('player2Info');
const player2Container = document.getElementById('player2Container');
const player1Label = document.getElementById('player1Label');
const player2Label = document.getElementById('player2Label');
const jumpBtn = document.getElementById('jumpBtn');
const difficultySelection = document.getElementById('difficultySelection');

// Lobby elements
const startGameBtn = document.getElementById('startGameBtn');
const joinGameBtn = document.getElementById('joinGameBtn');
const startGameForm = document.getElementById('startGameForm');
const joinGameList = document.getElementById('joinGameList');
const createGameBtn = document.getElementById('createGameBtn');
const refreshGamesBtn = document.getElementById('refreshGamesBtn');
const availableGames = document.getElementById('availableGames');
const joinPlayerName = document.getElementById('joinPlayerName');

// Initialize the game
function init() {
    // Connect to WebSocket server
    socket = io();
    
    // Event listeners
    createGameBtn.addEventListener('click', createGame);
    playAgainBtn.addEventListener('click', restartGame);
    jumpBtn.addEventListener('click', jump);
    startGameBtn.addEventListener('click', showStartGameForm);
    joinGameBtn.addEventListener('click', showJoinGameList);
    refreshGamesBtn.addEventListener('click', refreshGames);
    
    // Keyboard controls
    document.addEventListener('keydown', handleKeyPress);
    
    // Canvas click controls
    player1Canvas.addEventListener('click', () => jump());
    player2Canvas.addEventListener('click', () => jump());
    
    // Game mode selection
    setupGameModeSelection();
    
    // Character selection
    setupCharacterSelection();
    
    // Socket event listeners
    setupSocketListeners();
    
    // Get available games on load
    socket.emit('getAvailableGames');
}

// Setup WebSocket event listeners
function setupSocketListeners() {
    socket.on('gameStarted', (data) => {
        console.log('Game started:', data.gameId);
        showWaitingMessage();
    });
    
    socket.on('playerJoined', (player) => {
        playerId = player.id;
        console.log('Joined as:', player.name);
        
        // Show game area when joining
        showGameArea();
        
        // Check if we should show waiting message
        if (gameState.players && Object.keys(gameState.players).length === 1) {
            showWaitingMessage();
        }
    });
    
    socket.on('updateAvailableGames', (games) => {
        updateAvailableGames(games);
    });
    
    socket.on('gameNotFound', () => {
        alert('Game not found or already started!');
        socket.emit('getAvailableGames');
    });
    
    socket.on('gameFull', () => {
        alert('Game is full! Please try another game.');
        socket.emit('getAvailableGames');
    });
    
    socket.on('gameInProgress', () => {
        alert('Game is already in progress! Please try another game.');
        socket.emit('getAvailableGames');
    });
    
    socket.on('updatePlayers', (players) => {
        console.log('Received players update:', players);
        gameState.players = players;
        updatePlayerDisplay();
        updateScores();
    });
    
    socket.on('gameStart', () => {
        gameState.gameStarted = true;
        showGameArea();
        gameStatus.textContent = 'Game Started!';
        
        // Update game mode display
        if (selectedGameMode === 'singleplayer') {
            gameMode.textContent = `Single Player - ${selectedDifficulty.charAt(0).toUpperCase() + selectedDifficulty.slice(1)}`;
            player2Container.style.display = 'none';
            player2Info.style.display = 'none';
        } else {
            gameMode.textContent = 'Multiplayer';
        }
        
        console.log('Game started, players:', gameState.players);
    });
    
    socket.on('countdown', (count) => {
        if (count > 0) {
            countdownOverlay.style.display = 'flex';
            countdownText.textContent = count;
        } else {
            countdownOverlay.style.display = 'none';
        }
    });
    
    socket.on('gameUpdate', (newGameState) => {
        console.log('Received game update:', newGameState);
        gameState = newGameState;
        updateScores();
        updateGameSpeed();
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

// Setup game mode selection
function setupGameModeSelection() {
    const modeButtons = document.querySelectorAll('.mode-btn');
    const difficultyButtons = document.querySelectorAll('.difficulty-btn');
    
    modeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons
            modeButtons.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            btn.classList.add('active');
            
            selectedGameMode = btn.dataset.mode;
            
            // Show/hide difficulty selection
            if (selectedGameMode === 'singleplayer') {
                difficultySelection.style.display = 'block';
            } else {
                difficultySelection.style.display = 'none';
            }
        });
    });
    
    difficultyButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            difficultyButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedDifficulty = btn.dataset.difficulty;
        });
    });
}

// Setup character selection
function setupCharacterSelection() {
    const characterOptions = document.querySelectorAll('.character-option');
    
    characterOptions.forEach(option => {
        option.addEventListener('click', () => {
            characterOptions.forEach(o => o.classList.remove('active'));
            option.classList.add('active');
            selectedCharacter = option.dataset.character;
        });
    });
}

// Show start game form
function showStartGameForm() {
    startGameForm.style.display = 'block';
    joinGameList.style.display = 'none';
}

// Show join game list
function showJoinGameList() {
    joinGameList.style.display = 'block';
    startGameForm.style.display = 'none';
    socket.emit('getAvailableGames');
}

// Create game
function createGame() {
    const playerName = playerNameInput.value.trim() || 'Anonymous';
    const playerData = {
        playerName: playerName,
        gameMode: selectedGameMode,
        difficulty: selectedDifficulty,
        character: selectedCharacter
    };
    console.log('Creating game with data:', playerData);
    socket.emit('startGame', playerData);
}

// Join specific game
function joinGame(gameId) {
    const playerName = joinPlayerName.value.trim() || 'Anonymous';
    if (!playerName) {
        alert('Please enter your name before joining a game!');
        return;
    }
    
    const playerData = {
        gameId: gameId,
        playerName: playerName,
        character: selectedCharacter
    };
    console.log('Joining game with data:', playerData);
    socket.emit('joinGame', playerData);
}

// Refresh games list
function refreshGames() {
    socket.emit('getAvailableGames');
}

// Update available games list
function updateAvailableGames(games) {
    if (games.length === 0) {
        availableGames.innerHTML = '<p class="no-games">No games available. Start a new game!</p>';
        return;
    }
    
    availableGames.innerHTML = '';
    games.forEach(game => {
        const gameItem = document.createElement('div');
        gameItem.className = 'game-item';
        gameItem.onclick = () => joinGame(game.id);
        
        const timeAgo = game.timeAgo < 60 ? `${game.timeAgo}s ago` : `${Math.floor(game.timeAgo / 60)}m ago`;
        
        gameItem.innerHTML = `
            <div class="game-item-header">
                <span class="game-host">${game.hostName}</span>
                <span class="game-time">${timeAgo}</span>
            </div>
            <div class="game-details">
                <span class="game-mode">${game.gameMode}</span>
                ${game.gameMode === 'singleplayer' ? `<span class="game-difficulty">${game.difficulty}</span>` : ''}
            </div>
        `;
        
        availableGames.appendChild(gameItem);
    });
}

// Show waiting message
function showWaitingMessage() {
    waitingMessage.style.display = 'block';
    joinBtn.disabled = true;
    playerNameInput.disabled = true;
}

// Show game area
function showGameArea() {
    console.log('Showing game area, current state:', gameState);
    lobby.style.display = 'none';
    gameArea.style.display = 'block';
    gameOver.style.display = 'none';
    
    // Force initial render
    renderGame();
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
        player1Name.textContent = players[0].name;
        player1Label.textContent = players[0].name;
    }
    if (players.length >= 2) {
        player2Score.textContent = players[1].score || 0;
        player2Name.textContent = players[1].name;
        player2Label.textContent = players[1].name;
        player2Container.style.display = 'block';
        player2Info.style.display = 'block';
    }
}

// Update game speed display
function updateGameSpeed() {
    if (gameState.gameSpeed) {
        gameSpeed.textContent = Math.round(gameState.gameSpeed * 10) / 10;
    }
}

// Render game
function renderGame() {
    console.log('Rendering game with state:', gameState);
    
    // Clear canvases
    player1Ctx.clearRect(0, 0, player1Canvas.width, player1Canvas.height);
    player2Ctx.clearRect(0, 0, player2Canvas.width, player2Canvas.height);
    
    // Draw ground
    drawGround(player1Ctx);
    drawGround(player2Ctx);
    
    // Draw players
    const players = Object.values(gameState.players);
    console.log('Players to render:', players);
    
    if (players.length >= 1) {
        drawPlayer(player1Ctx, players[0], 50);
    }
    if (players.length >= 2) {
        drawPlayer(player2Ctx, players[1], 50);
    }
    
    // Draw obstacles
    if (gameState.obstacles) {
        gameState.obstacles.forEach(obstacle => {
            drawObstacle(player1Ctx, obstacle);
            drawObstacle(player2Ctx, obstacle);
        });
    }
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
    const character = player.character || 'dino';
    
    if (!player.isAlive) {
        // Draw dead player (red)
        ctx.fillStyle = '#e74c3c';
    } else {
        // Different colors for different characters
        switch(character) {
            case 'robot':
                ctx.fillStyle = '#34495e';
                break;
            case 'ninja':
                ctx.fillStyle = '#2c3e50';
                break;
            case 'alien':
                ctx.fillStyle = '#8e44ad';
                break;
            default: // dino
                ctx.fillStyle = '#27ae60';
        }
    }
    
    // Draw character based on type
    switch(character) {
        case 'robot':
            drawRobot(ctx, player, x);
            break;
        case 'ninja':
            drawNinja(ctx, player, x);
            break;
        case 'alien':
            drawAlien(ctx, player, x);
            break;
        default:
            drawDino(ctx, player, x);
    }
    
    // Draw player name
    ctx.fillStyle = '#2c3e50';
    ctx.font = '12px Courier New';
    ctx.fillText(player.name, x, player.y - 20);
}

// Draw dino character
function drawDino(ctx, player, x) {
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
}

// Draw robot character
function drawRobot(ctx, player, x) {
    // Draw robot body
    ctx.fillRect(x, player.y, 40, 50);
    
    // Draw robot head
    ctx.fillRect(x + 35, player.y - 10, 20, 25);
    
    // Draw robot eye
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(x + 45, player.y - 5, 5, 5);
    
    // Draw robot antenna
    ctx.fillRect(x + 50, player.y - 15, 2, 10);
    
    // Draw robot legs
    ctx.fillStyle = '#34495e';
    ctx.fillRect(x + 5, player.y + 50, 8, 15);
    ctx.fillRect(x + 25, player.y + 50, 8, 15);
}

// Draw ninja character
function drawNinja(ctx, player, x) {
    // Draw ninja body
    ctx.fillRect(x, player.y, 40, 50);
    
    // Draw ninja head
    ctx.fillRect(x + 35, player.y - 10, 20, 25);
    
    // Draw ninja mask
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(x + 40, player.y - 8, 10, 8);
    
    // Draw ninja legs
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(x + 5, player.y + 50, 8, 15);
    ctx.fillRect(x + 25, player.y + 50, 8, 15);
}

// Draw alien character
function drawAlien(ctx, player, x) {
    // Draw alien body
    ctx.fillRect(x, player.y, 40, 50);
    
    // Draw alien head
    ctx.fillRect(x + 35, player.y - 10, 20, 25);
    
    // Draw alien eyes
    ctx.fillStyle = '#f39c12';
    ctx.fillRect(x + 42, player.y - 8, 4, 4);
    ctx.fillRect(x + 50, player.y - 8, 4, 4);
    
    // Draw alien antenna
    ctx.fillRect(x + 50, player.y - 15, 2, 10);
    
    // Draw alien legs
    ctx.fillStyle = '#8e44ad';
    ctx.fillRect(x + 5, player.y + 50, 8, 15);
    ctx.fillRect(x + 25, player.y + 50, 8, 15);
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