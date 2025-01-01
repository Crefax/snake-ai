# AI Snake Game

An advanced implementation of the classic Snake game powered by artificial intelligence. The project features both Neural Network and Q-Learning approaches for training the AI to play the game.

## Features

- Classic Snake game implementation with modern graphics
- Neural Network AI implementation using TensorFlow.js
- Q-Learning AI implementation
- Adjustable game speed
- Dark/Light theme support
- Responsive design for both desktop and mobile devices
- High score tracking
- Real-time performance metrics display

## Technologies Used

- Node.js
- Express.js
- Socket.IO
- TensorFlow.js
- HTML5 Canvas
- CSS3

## Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (version 12 or higher)
- npm (comes with Node.js)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/ai-snake.git
cd ai-snake
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

4. Open your browser and navigate to:
```
http://localhost:3002
```

## How to Use

1. The game starts with a basic snake implementation
2. Use the speed slider to adjust the game speed
3. Click "AI'yı Başlat" (Start AI) to begin AI training
4. Click "AI'yı Durdur" (Stop AI) to stop the AI
5. Toggle between light and dark themes using the theme button
6. Monitor the AI's performance through the displayed metrics:
   - Current Score
   - Generation/Iteration Count
   - Average Score
   - Loss Value (Neural Network only)

## Project Structure

- `server.js` - Express server setup and Socket.IO configuration
- `public/`
  - `index.html` - Main game interface
  - `style.css` - Game styling
  - `game.js` - Core snake game implementation
  - `neural_network.js` - Neural Network AI implementation
  - `qlearning.js` - Q-Learning AI implementation

## AI Implementation Details

### Neural Network
- Input Layer: 11 neurons (food direction, dangers, tail proximity, etc.)
- Hidden Layers: Multiple dense layers with dropout
- Output Layer: 3 neurons (forward, left, right)
- Uses experience replay for training
- Implements epsilon-greedy exploration strategy

### Q-Learning
- State space includes food direction and danger detection
- Actions: forward, left, right
- Implements epsilon-greedy exploration
- Uses Q-table for state-action value mapping

## Contributing

Feel free to submit issues and enhancement requests!

## License

This project is open source and available under the [MIT License](LICENSE). 