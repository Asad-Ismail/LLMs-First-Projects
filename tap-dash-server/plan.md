# TAP DASH - Game Development Plan

## 1. Game Concept & Mechanics

### Game Overview
"Tap Dash" is a one-touch runner where you control a colorful character that automatically moves forward. Tap anywhere on screen to jump over obstacles and collect glowing orbs. The unique twist: each tap creates a colorful trail that becomes part of the obstacle course for future runs!

### Core Mechanic
The trails you leave behind with each jump become part of the course for your next run! This creates a constantly evolving, personalized level without any complex mechanics.

### Why This Works
* **One-Tap Controls**: Just tap anywhere to jump - that's it!
* **Self-Explanatory**: See character running toward obstacle = tap to jump
* **Instant Understanding**: No tutorial needed - human instinct knows to jump over obstacles
* **Visual Feedback**: Your colorful trails build up over time creating a unique level

### Visual Style
* **Aesthetic**: Bright, bold colors with simple shapes
* **Character Design**: A glowing sphere that leaves trails when jumping
* **Environment**: Clean, minimal environment with high contrast

This game requires zero explanation - people will immediately understand "tap to jump over things" when they see the character and obstacles. The unique twist of your trails becoming obstacles adds depth without complexity.

## 2. Technical Implementation

### Core Technology
* **Engine**: ThreeJS with minimal physics
* **Size**: Under 500KB total
* **Controls**: Single tap mechanic works identically on all devices

### Project Structure
```
tap-dash/
├── index.html         # Main HTML file
├── styles/
│   └── main.css       # Basic styling
├── scripts/
│   ├── main.js        # Main game initialization
│   ├── game.js        # Game logic controller
│   ├── player.js      # Player object and controls
│   ├── obstacles.js   # Obstacle generation and management
│   ├── trails.js      # Trail system for player jumps
│   └── utils.js       # Utility functions
└── assets/
    ├── sounds/        # Game sounds (jump, collect, etc.)
    └── images/        # Any necessary images
```

## 3. Performance Optimizations

### Trail System Improvements
1. **Reduce Particle Count**: 
   * Decrease particles per trail from 25 to 2-4
   * Adjust size or opacity to compensate visually
   * Impact: Fewer objects to render, easing GPU load with minimal visual compromise

2. **Reduce Trail Count**: 
   * Decrease the number of trails from 20 to 2
   * Impact: Significantly fewer objects to track and render

3. **Refactor Trail System Architecture**:
   * Use a single Points object with a BufferGeometry
   * Maintain an array of particle data (position, velocity, lifetime, color)
   * Initialize with enough capacity (e.g., 100 particles), reusing slots for new particles
   * Update positions in a single Float32Array and set geometry.attributes.position.needsUpdate = true
   * Impact: Reduces draw calls from hundreds to one per frame, boosting performance without losing the fire-like trail effect

### Rendering Optimizations
4. **Adjust Rendering Settings**:
   * **Cap Pixel Ratio**:
     * Current: `this.renderer.setPixelRatio(window.devicePixelRatio)` uses the device's full resolution
     * Optimization: `this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))`
     * Impact: Reduces rendering resolution on high-DPI devices, improving performance with minimal visual impact
   
   * **Disable Antialiasing** (Optional):
     * Current: `antialias: true` in the renderer setup enhances visuals but is costly
     * Optimization: Set `antialias: false` on low-end devices (detect via browser capabilities or user settings)
     * Impact: Trades visual smoothness for performance; test to ensure acceptability
   
   * **Disable Shadows**:
     * Current: `this.renderer.shadowMap.enabled = true` is set, but no lights have `castShadow = true`
     * Optimization: Set `this.renderer.shadowMap.enabled = false`
     * Impact: Avoids potential shadow-related overhead

### Geometry Optimizations
5. **Simplify Ground Material**:
   * Problem: Ground uses PlaneGeometry with 20x100 divisions and MeshPhongMaterial set to THREE.DoubleSide
   * Impact: Doubles the triangle count from 4,000 to 8,000, contributing to the 8,780 total triangles
   * Solution: Modify the ground material to render only the front side
   * Result: Reduces ground's triangle count to 4,000, cutting scene's total triangles by nearly half (to ~4,632)

6. **Simplify Ground Geometry**:
   * Problem: Ground's 20x100 divisions (4,000 triangles single-sided) are excessive for a flat surface
   * Solution: Reduce divisions to 10x50, maintaining visual quality with fewer polygons
   * Impact: Lowers ground's triangle count to 1,000 (single-sided), further reducing total to ~2,632 triangles

## 4. Multiplayer Implementation

Lets add multiplayer to this game we need to add node server for this purpose. Lets change previous directory stucture

### Server Setup
Structure your directory:
```
tap-dash-server/
├── public/
│   └── tap-dash/ (your existing game files)
├── server.js
├── package.json
└── node_modules/
```

### Multiplayer Features
The multiplayer implementation will allow players to:
- See other players' characters in real-time
- Dont interfere with each other players show other players in tranlucent colors
- Create a collaborative/competitive gameplay experience