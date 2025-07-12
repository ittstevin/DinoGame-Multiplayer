# DinoGame-Multiplayer

A 2-player online multiplayer Dino game inspired by Google Chrome's offline Dino game. Players compete to cover the longest distance while dodging obstacles in real-time.

**Created by Tevin** 🦖

## Features

- 🦖 **2-Player Multiplayer**: Real-time competitive gameplay
- 🌵 **Random Obstacles**: Cacti and flying pterodactyls
- 🏃‍♂️ **Distance Tracking**: Real-time score display
- 🎮 **Multiple Controls**: Spacebar or mouse click to jump
- 🏆 **Winner Announcement**: Automatic game end detection
- 🔄 **Play Again**: Quick restart functionality
- 📱 **Responsive Design**: Works on desktop and mobile

## How to Play

1. **Join the Game**: Enter your name and click "Join Game"
2. **Wait for Opponent**: The game starts when 2 players join
3. **Jump to Survive**: Press SPACE or CLICK to jump over obstacles
4. **Compete**: Try to cover the longest distance
5. **Winner**: Last player standing wins!

## Installation & Setup

### Prerequisites
- Node.js (version 14 or higher)
- npm (comes with Node.js)

### Installation Steps

1. **Clone or download the project**
   ```bash
   git clone <repository-url>
   cd DinoGame-Multiplayer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   npm start
   ```

4. **Open in browser**
   - Open `http://localhost:3000` in your browser
   - Open the same URL in another browser tab/window for the second player

## Game Controls

- **SPACE**: Jump (works globally)
- **Mouse Click**: Jump on canvas
- **Enter**: Submit player name

## Technical Details

### Backend (Node.js + Socket.IO)
- Real-time WebSocket communication
- Game state synchronization
- Collision detection
- Player management

### Frontend (HTML5 + Canvas)
- Retro pixel-style graphics
- Responsive design
- Real-time rendering
- Multiplayer UI

### Game Mechanics
- **Physics**: Gravity-based jumping
- **Obstacles**: Randomly spawned cacti and pterodactyls
- **Scoring**: Distance-based points
- **Collision**: Pixel-perfect detection

## Project Structure

```
DinoGame-Multiplayer/
├── server.js              # WebSocket server & game logic
├── package.json           # Dependencies & scripts
├── public/
│   ├── index.html        # Main game interface
│   ├── style.css         # Retro styling
│   └── game.js           # Client-side game logic
└── README.md             # This file
```

## Development

To run in development mode with auto-restart:
```bash
npm run dev
```

## Technologies Used

- **Backend**: Node.js, Express, Socket.IO
- **Frontend**: HTML5 Canvas, JavaScript, CSS3
- **Real-time**: WebSocket communication
- **Styling**: CSS Grid, Flexbox, Animations

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Multiplayer Setup

1. Start the server: `npm start`
2. Open `http://localhost:3000` in two different browser windows/tabs
3. Enter different player names
4. Click "Join Game" in both windows
5. Game starts automatically when both players join

## Game Rules

- Players start at the same time
- Jump over obstacles to survive
- Game ends when all players hit obstacles
- Player with highest score wins
- Ties are possible (both players die simultaneously)

Enjoy the game! 🦖🏃‍♂️