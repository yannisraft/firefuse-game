# 🎆 Firework Fusion Game

A spectacular 2D fireworks game built with WebGL shaders, JavaScript, and HTML5 Canvas. Launch fireworks that travel in realistic parabolic trajectories and explode in dazzling particle effects!

## 🚀 Features

- **WebGL Shaders**: Advanced particle rendering with GPU acceleration for smooth performance
- **Realistic Physics**: Fireworks follow authentic parabolic trajectories with gravity simulation
- **60-Second Timer**: Fast-paced gameplay with a countdown clock
- **Point System**: Earn 200 points per firework explosion
- **Interactive Controls**: 
  - Click anywhere on screen to launch fireworks
  - Button-based launching
  - Auto-launching for continuous spectacle
- **Beautiful Effects**:
  - Particle trails for rockets
  - Explosion particles with gravity and air resistance
  - Fade-out animations
  - Multiple color variations

## 🎮 How to Play

1. **Start the Game**: Click the "Start Game" button on the welcome screen
2. **Launch Fireworks**: 
   - Click anywhere on the screen to launch a firework toward that location
   - Or use the "Launch Firework" button for random launches
3. **Score Points**: Each firework explosion earns you 200 points
4. **Beat the Clock**: You have 60 seconds to achieve the highest score possible
5. **Restart**: When time runs out, click "Play Again" to start a new round

## 🛠️ Technical Details

### WebGL Shaders
- **Vertex Shader**: Handles particle positioning, sizing, and color attributes
- **Fragment Shader**: Creates smooth circular particles with radial gradients
- **GPU Acceleration**: Efficient rendering of hundreds of particles simultaneously

### Physics Simulation
- **Parabolic Trajectory**: Realistic rocket flight paths calculated using physics equations
- **Gravity Effects**: Both rockets and explosion particles are affected by gravity
- **Air Resistance**: Particles slow down over time for realistic motion
- **Collision Detection**: Automatic explosion timing based on flight duration

### Performance Optimizations
- **Efficient Memory Management**: Dynamic particle arrays with automatic cleanup
- **Batch Rendering**: All particles rendered in single draw calls
- **Responsive Design**: Automatically adjusts to window size changes

## 📁 Files

- `index.html` - Main game interface with embedded shaders
- `fireworks.js` - Game logic, physics, and WebGL rendering
- `README.md` - This documentation file

## 🚀 Getting Started

1. Download all files to a folder
2. Open `index.html` in a modern web browser
3. Ensure WebGL is supported (most modern browsers support this)
4. Start playing and enjoy the fireworks!

## 🔧 Browser Requirements

- Modern web browser with WebGL support
- Chrome, Firefox, Safari, Edge (latest versions)
- Hardware acceleration enabled for best performance

## 🎨 Customization

The game can be easily customized by modifying:

- **Colors**: Edit the `fireworkColors` array in `fireworks.js`
- **Physics**: Adjust gravity, particle count, and explosion parameters
- **Timing**: Change game duration, particle lifespans, and launch intervals
- **Visuals**: Modify shaders for different particle effects

## 🎯 Game Mechanics

- **Timer**: 60-second countdown
- **Scoring**: 200 points per explosion
- **Launch Patterns**: Click-to-launch and automatic launches
- **Particle System**: 80-120 particles per explosion
- **Trail Effects**: Rockets leave glowing trails as they ascend

## 🏆 Tips for High Scores

1. Launch fireworks rapidly at the beginning when you have full time
2. Click near the top of the screen for quicker explosions
3. Take advantage of auto-launching - it doesn't cost you anything!
4. Keep clicking to maintain a steady stream of fireworks

Enjoy creating your spectacular fireworks display! 🎆✨