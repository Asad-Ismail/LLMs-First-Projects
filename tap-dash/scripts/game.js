/**
 * Main game controller for Tap Dash
 */
class Game {
    constructor() {
        console.log('Game constructor called');
        // Start performance tracking
        this.performanceLog = {
            constructorStart: performance.now(),
            setupScene: 0,
            addEnvironment: 0,
            playerInit: 0,
            obstacleInit: 0,
            trailInit: 0,
            setupControls: 0,
            constructorTotal: 0,
            firstJump: 0,
            firstJumpTotal: 0
        };
        
        this.isRunning = false;
        this.score = 0;
        this.gameStarted = false; // Flag to track if gameplay has actually started after countdown
        
        // FPS counter variables - properly initialized
        this.frames = 0;
        this.lastFpsUpdate = performance.now();
        this.currentFps = 0;
        this.hasJumped = false; // Track if first jump happened
        
        // MODIFIED: Better speed progression for more balanced difficulty
        this.speedIncreaseInterval = 15; // Increased from 10 to 15
        this.speedIncreaseAmount = 0.008; // Reduced from 0.01
        this.initialGracePeriod = 3; // Seconds of grace period at start
        
        // Flag to track if assets are fully loaded
        this.assetsLoaded = false;
        this.initialLoadComplete = false;
        
        try {
            // Set up base Three.js scene
            const sceneStart = performance.now();
            this.setupScene();
            this.performanceLog.setupScene = performance.now() - sceneStart;
            
            // Defer heavy loading until after first frame renders
            // This helps prevent initial FPS drops
            setTimeout(() => {
                this.loadGameAssets();
            }, 100);
            
            // Start animation loop immediately for responsive UI
            this.animate();
            
            // Make the game instance globally accessible for debugging
            window.gameInstance = this;
            
            this.performanceLog.constructorTotal = performance.now() - this.performanceLog.constructorStart;
            console.log('Game initialization performance:', this.performanceLog);
            
            console.log('Game initialization complete');
        } catch (error) {
            console.error('Error during game initialization:', error);
            alert('There was a problem initializing the game. Please refresh the page.');
        }
    }
    
    setupScene() {
        console.log('Setting up scene');
        try {
            // Create scene with fog for depth effect
            this.scene = new THREE.Scene();
            this.scene.background = new THREE.Color(0x111122);
            this.scene.fog = new THREE.Fog(0x111122, 10, 30);
            
            // Create camera with better position
            this.camera = new THREE.PerspectiveCamera(
                75, window.innerWidth / window.innerHeight, 0.1, 1000
            );
            this.camera.position.set(0, 2.5, 5.5);
            this.camera.lookAt(0, 1, -5);
            
            // Create renderer with post-processing capabilities
            this.renderer = new THREE.WebGLRenderer({ 
                antialias: true,
                powerPreference: "high-performance"
            });
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.renderer.setPixelRatio(window.devicePixelRatio);
            this.renderer.shadowMap.enabled = true;
            
            // Add the canvas to the DOM
            const gameContainer = document.getElementById('game-container');
            if (gameContainer) {
                gameContainer.prepend(this.renderer.domElement);
                console.log('Added canvas to game container');
            } else {
                console.error('Game container not found!');
                document.body.prepend(this.renderer.domElement);
            }
            
            // Add visually interesting ground
            this.addGround();
            
            // Add lighting
            this.addLighting();
            
            // Add some particles for a more immersive scene
            this.addParticles();
            
            // Responsive canvas
            window.addEventListener('resize', () => {
                this.camera.aspect = window.innerWidth / window.innerHeight;
                this.camera.updateProjectionMatrix();
                this.renderer.setSize(window.innerWidth, window.innerHeight);
                this.renderer.setPixelRatio(window.devicePixelRatio);
            });
        } catch (error) {
            console.error('Error setting up scene:', error);
            throw error; // Re-throw to be caught by constructor
        }
    }
    
    addGround() {
        try {
            const groundSize = 12;
            const groundLength = 120;
            const groundGeometry = new THREE.PlaneGeometry(groundSize, groundLength, 20, 100);
            
            // Create a grid-like texture for the ground
            const groundMaterial = new THREE.MeshPhongMaterial({ 
                color: 0x3333aa,
                shininess: 80,
                specular: 0x111111,
                side: THREE.DoubleSide
            });
            
            // Create and position the ground mesh
            const ground = new THREE.Mesh(groundGeometry, groundMaterial);
            ground.rotation.x = -Math.PI / 2; // Rotate to be horizontal
            ground.position.set(0, 0, -groundLength/2 + 10); // Position ahead of camera
            this.scene.add(ground);
        } catch (error) {
            console.error('Error adding ground:', error);
        }
    }
    
    addLighting() {
        try {
            const ambientLight = new THREE.AmbientLight(0x333333);
            this.scene.add(ambientLight);
            
            const mainLight = new THREE.DirectionalLight(0xffffff, 1);
            mainLight.position.set(10, 10, 10);
            this.scene.add(mainLight);
        } catch (error) {
            console.error('Error adding lighting:', error);
        }
    }
    
    addParticles() {
        try {
            // Add floating particles for atmosphere
            const particlesGeometry = new THREE.BufferGeometry();
            const particleCount = 200;
            const posArray = new Float32Array(particleCount * 3);
            
            for(let i = 0; i < particleCount * 3; i += 3) {
                // Random positions in a defined space around the player
                posArray[i] = (Math.random() - 0.5) * 10;
                posArray[i+1] = Math.random() * 5;
                posArray[i+2] = (Math.random() - 0.5) * 40 - 15; // Mostly ahead of player
            }
            
            particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
            
            const particleMaterial = new THREE.PointsMaterial({
                size: 0.05,
                color: 0xaaaaff,
                transparent: true,
                opacity: 0.8,
                blending: THREE.AdditiveBlending
            });
            
            this.particles = new THREE.Points(particlesGeometry, particleMaterial);
            this.scene.add(this.particles);
        } catch (error) {
            console.error('Error adding particles:', error);
        }
    }
    
    addEnvironmentObjects() {
        try {
            // Add distant stars/particles for atmosphere
            const starsGeometry = new THREE.BufferGeometry();
            const starsCount = 1000;
            const starsPositions = new Float32Array(starsCount * 3);
            
            for (let i = 0; i < starsCount; i++) {
                // Position stars in a dome around the scene
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.random() * Math.PI / 2;
                const radius = 50 + Math.random() * 50;
                
                starsPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
                starsPositions[i * 3 + 1] = radius * Math.cos(phi);
                starsPositions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta) - 40;
            }
            
            starsGeometry.setAttribute('position', new THREE.BufferAttribute(starsPositions, 3));
            
            const starsMaterial = new THREE.PointsMaterial({
                color: 0xffffff,
                size: 0.2,
                transparent: true,
                opacity: 0.8,
                blending: THREE.AdditiveBlending
            });
            
            const stars = new THREE.Points(starsGeometry, starsMaterial);
            this.scene.add(stars);
            
            // Add some distant mountains or structures for horizon
            this.addMountains();
        } catch (error) {
            console.error('Error adding environment objects:', error);
        }
    }
    
    addMountains() {
        try {
            const addMountain = (x, z, height, width, color) => {
                const mountainGeometry = new THREE.ConeGeometry(width, height, 4);
                const mountainMaterial = new THREE.MeshPhongMaterial({
                    color: color,
                    emissive: color.clone().multiplyScalar(0.2),
                    flatShading: true
                });
                
                const mountain = new THREE.Mesh(mountainGeometry, mountainMaterial);
                mountain.position.set(x, height/2 - 0.5, z);
                this.scene.add(mountain);
            };
            
            // Create some distant mountains
            for (let i = 0; i < 15; i++) {
                const side = i % 2 === 0 ? -1 : 1;
                const distance = -60 - Math.random() * 30;
                const height = 5 + Math.random() * 10;
                const width = 3 + Math.random() * 5;
                
                // Create colors with a unified palette
                const hue = 0.6 + Math.random() * 0.2; // Blue to purple
                const saturation = 0.5 + Math.random() * 0.5;
                const lightness = 0.2 + Math.random() * 0.2;
                const color = new THREE.Color().setHSL(hue, saturation, lightness);
                
                addMountain(
                    (10 + Math.random() * 15) * side,
                    distance,
                    height,
                    width,
                    color
                );
            }
        } catch (error) {
            console.error('Error adding mountains:', error);
        }
    }
    
    setupControls() {
        console.log('Setting up controls');
        
        try {
            // Simplified interaction handler
            const handleInteraction = (e) => {
                console.log('Interaction detected', e.type);
                
                // If the game is not running, start it
                if (!this.isRunning) {
                    console.log('Game not running, attempting to start');
                    this.startGame();
                } else if (this.gameStarted) { // Only handle taps if game has actually started
                    this.handleTap();
                }
                
                // Prevent default behavior to be safe
                e.preventDefault();
            };
            
            // Add event listeners to document for better capture
            document.addEventListener('mousedown', handleInteraction);
            document.addEventListener('touchstart', handleInteraction, { passive: false });
            
            // Make start button more robust
            const startButton = document.getElementById('start-button');
            if (startButton) {
                console.log('Start button found, adding click handler');
                startButton.addEventListener('click', (e) => {
                    console.log('Start button clicked');
                    this.startGame();
                    e.stopPropagation(); // Prevent event from bubbling
                });
            } else {
                console.error('Start button not found!');
            }
            
            // Make restart button more robust
            const restartButton = document.getElementById('restart-button');
            if (restartButton) {
                console.log('Restart button found, adding click handler');
                restartButton.addEventListener('click', (e) => {
                    console.log('Restart button clicked');
                    this.restartGame();
                    e.stopPropagation(); // Prevent event from bubbling
                });
            } else {
                console.error('Restart button not found!');
            }
            
            // MODIFIED: Enhanced keyboard controls for movement
            document.addEventListener('keydown', (e) => {
                if (e.code === 'Space') {
                    console.log('Space pressed');
                    if (!this.isRunning) {
                        this.startGame();
                    } else if (this.gameStarted) { // Only handle jumps if game has actually started
                        this.handleTap();
                    }
                    e.preventDefault(); // Prevent scrolling
                }
                
                // Add left/right movement with arrow keys and A/D
                if (this.isRunning && this.gameStarted && this.player) {
                    if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
                        this.player.moveLeft(true);
                    }
                    if (e.code === 'ArrowRight' || e.code === 'KeyD') {
                        this.player.moveRight(true);
                    }
                }
            });
            
            // Add key up event for smoother controls
            document.addEventListener('keyup', (e) => {
                if (this.isRunning && this.gameStarted && this.player) {
                    if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
                        this.player.moveLeft(false);
                    }
                    if (e.code === 'ArrowRight' || e.code === 'KeyD') {
                        this.player.moveRight(false);
                    }
                }
            });
            
            // MODIFIED: Add touch swipe controls for mobile
            let touchStartX = 0;
            let touchStartTime = 0;
            
            document.addEventListener('touchstart', (e) => {
                if (this.isRunning && this.gameStarted && e.touches.length > 0) {
                    touchStartX = e.touches[0].clientX;
                    touchStartTime = Date.now();
                }
            }, { passive: true });
            
            document.addEventListener('touchmove', (e) => {
                if (!this.isRunning || !this.gameStarted || !this.player || e.touches.length === 0) return;
                
                const touchCurrentX = e.touches[0].clientX;
                const deltaX = touchCurrentX - touchStartX;
                
                // Reset start position for continuous movement
                if (Math.abs(deltaX) > 30) {
                    touchStartX = touchCurrentX;
                }
                
                // Move based on swipe direction
                if (deltaX < -20) {
                    this.player.moveLeft(true);
                    this.player.moveRight(false);
                } else if (deltaX > 20) {
                    this.player.moveRight(true);
                    this.player.moveLeft(false);
                } else {
                    this.player.moveLeft(false);
                    this.player.moveRight(false);
                }
            }, { passive: true });
            
            document.addEventListener('touchend', (e) => {
                if (this.isRunning && this.gameStarted && this.player) {
                    // Stop movement on touch end
                    this.player.moveLeft(false);
                    this.player.moveRight(false);
                    
                    // Check if it was a quick tap for jumping
                    const touchDuration = Date.now() - touchStartTime;
                    if (touchDuration < 200) {
                        // It was a quick tap, so jump
                        this.handleTap();
                    }
                }
            }, { passive: true });
            
            // Add a direct click handler to the start screen
            const startScreen = document.getElementById('start-screen');
            if (startScreen) {
                console.log('Start screen found, adding click handler');
                startScreen.addEventListener('click', (e) => {
                    console.log('Start screen clicked');
                    if (!this.isRunning) {
                        this.startGame();
                    }
                });
            }
        } catch (error) {
            console.error('Error setting up controls:', error);
        }
    }
    
    handleTap() {
        if (!this.isRunning || !this.gameStarted) {
            console.log('Tap ignored - game not running or not started yet');
            return;
        }
        
        console.log('Handling tap while game is running');
        
        try {
            // Track first jump performance in detail
            if (!this.hasJumped) {
                this.hasJumped = true;
                const jumpStart = performance.now();
                
                // Detailed tracking of player jump preparation
                const playerPrepStart = performance.now();
                
                // Attempt to jump
                const jumpPhysicsStart = performance.now();
                const jumped = this.player.jump();
                const jumpPhysicsTime = performance.now() - jumpPhysicsStart;
                
                // Track trail creation
                let trailTime = 0;
                if (jumped) {
                    const trailStart = performance.now();
                    this.trailSystem.createTrail(this.player.position);
                    trailTime = performance.now() - trailStart;
                }
                
                // Log detailed performance
                this.performanceLog.firstJump = performance.now() - jumpStart;
                this.performanceLog.firstJumpTotal = performance.now() - this.performanceLog.constructorStart;
                
                console.log('First jump detailed performance:', {
                    preparationTime: jumpPhysicsStart - playerPrepStart,
                    jumpPhysicsTime: jumpPhysicsTime,
                    trailCreationTime: trailTime,
                    totalJumpDuration: this.performanceLog.firstJump,
                    timeSinceGameStart: this.performanceLog.firstJumpTotal,
                    memoryInfo: window.performance && window.performance.memory ? 
                        window.performance.memory : 'Not available'
                });
                
                // If successfully jumped, create a trail
                if (jumped) {
                    // Trail already created during performance tracking
                }
            } else {
                // Normal jump after first one
                const jumped = this.player.jump();
                if (jumped) {
                    this.trailSystem.createTrail(this.player.position);
                }
            }
        } catch (error) {
            console.error('Error handling tap:', error);
        }
    }


    playStartEffect() {
        try {
            // Flash screen with a "go" effect
            const flash = document.createElement('div');
            flash.style.position = 'absolute';
            flash.style.top = '0';
            flash.style.left = '0';
            flash.style.width = '100%';
            flash.style.height = '100%';
            flash.style.backgroundColor = 'rgba(50, 255, 100, 0.3)';
            flash.style.pointerEvents = 'none';
            flash.style.zIndex = '100';
            flash.style.display = 'flex';
            flash.style.justifyContent = 'center';
            flash.style.alignItems = 'center';
            flash.style.fontSize = '80px';
            flash.style.fontWeight = 'bold';
            flash.style.color = '#fff';
            flash.style.textShadow = '0 0 10px rgba(0,0,0,0.5)';
            flash.textContent = 'GO!';
            document.body.appendChild(flash);
            
            // Fade out and remove
            setTimeout(() => {
                flash.style.transition = 'all 0.5s';
                flash.style.opacity = '0';
                flash.style.transform = 'scale(1.5)';
                setTimeout(() => {
                    document.body.removeChild(flash);
                }, 500);
            }, 300);
        } catch (error) {
            console.error('Error playing start effect:', error);
        }
    }
        
    startGame() {
        console.log('Starting game');
        
        try {
            // Ensure start screen is hidden
            const startScreen = document.getElementById('start-screen');
            if (startScreen) {
                startScreen.classList.add('hidden');
            } else {
                console.error('Start screen element not found!');
            }
            
            // Set running state, but don't start actual gameplay yet
            this.isRunning = true;
            
            // Reset player position and ensure they don't move yet
            if (this.player) {
                this.player.reset();
                this.player.freeze(); // New method to freeze player during countdown
            }
            
            // ADDED: Make sure trails are reset and disabled during countdown
            if (this.trailSystem) {
                this.trailSystem.reset();
                this.trailSystem.enableTrails(true);  // Enable trails but don't start continuous effect yet
            }
            
            // MODIFIED: Add a more visible countdown and instructions
            const countdownEl = document.createElement('div');
            countdownEl.className = 'countdown';
            countdownEl.textContent = '3';
            
            const uiLayer = document.getElementById('ui-layer');
            if (uiLayer) {
                uiLayer.appendChild(countdownEl);
                
                // Show a helpful instruction during countdown
                const instructionEl = document.createElement('div');
                instructionEl.className = 'countdown-instruction';
                instructionEl.textContent = 'Get Ready!';
                uiLayer.appendChild(instructionEl);
                
                let count = 3;
                const countdown = setInterval(() => {
                    count--;
                    if (count > 0) {
                        countdownEl.textContent = count;
                        // Update instruction text
                        if (count === 2) {
                            instructionEl.textContent = 'Tap to Jump! Use A/D or ←/→ to Move!';
                        } else if (count === 1) {
                            instructionEl.textContent = 'Double-Tap for Double Jump!';
                        }
                    } else {
                        clearInterval(countdown);
                        uiLayer.removeChild(countdownEl);
                        uiLayer.removeChild(instructionEl);
                        
                        // Now actually start the game mechanics after countdown
                        this.gameStarted = true;
                        console.log('Game is now fully running:', this.gameStarted);
                        
                        // Unfreeze the player
                        if (this.player) {
                            this.player.unfreeze();
                        }
                        
                        // Start obstacle generation once countdown is complete
                        this.obstacleManager.startGeneratingObstacles();
                        
                        // MODIFIED: Start continuous trail effect only after countdown
                        if (this.trailSystem) {
                            this.trailSystem.startContinuousTrail(this.player);
                        }
                        
                        // Play a "go" effect
                        this.playStartEffect();
                    }
                }, 1000);
            } else {
                console.error('UI layer not found!');
                // Fallback - start the game after a delay
                setTimeout(() => {
                    this.gameStarted = true;
                    if (this.player) this.player.unfreeze();
                    this.obstacleManager.startGeneratingObstacles();
                    
                    // Start trail system with delay
                    if (this.trailSystem) {
                        this.trailSystem.startContinuousTrail(this.player);
                    }
                }, 3000);
            }
        } catch (error) {
            console.error('Error starting game:', error);
            // Fallback - just start the game after a delay
            setTimeout(() => {
                this.gameStarted = true;
                this.isRunning = true;
                if (this.player) this.player.unfreeze();
                this.obstacleManager.startGeneratingObstacles();
                if (this.trailSystem) {
                    this.trailSystem.startContinuousTrail(this.player);
                }
            }, 3000);
        }
    }
    
    // MODIFIED: Enhanced game over and restart logic
    gameOver() {
        console.log('Game over');
        this.isRunning = false;
        this.gameStarted = false;
        
        try {
            // ADDED: Stop continuous trail on game over
            this.trailSystem.stopContinuousTrail();
            
            // Freeze player
            if (this.player) {
                this.player.freeze();
            }
            
            // Stop obstacle generation
            this.obstacleManager.stopGeneratingObstacles();
            
            // Show final score
            const finalScoreElement = document.getElementById('final-score');
            if (finalScoreElement) {
                finalScoreElement.textContent = Math.floor(this.score);
            }
            
            // Show game over screen
            const gameOverElement = document.getElementById('game-over');
            if (gameOverElement) {
                gameOverElement.classList.remove('hidden');
                // ADDED: Also set display style directly for extra reliability
                gameOverElement.style.display = 'flex';
            } else {
                console.error('Game over element not found!');
            }
            
            // Save high score
            saveHighScore(Math.floor(this.score));
        } catch (error) {
            console.error('Error in game over:', error);
        }
    }
    
    restartGame() {
        console.log('Restarting game');
        
        try {
            // MODIFIED: Make sure game over screen is actually hidden
            const gameOverElement = document.getElementById('game-over');
            if (gameOverElement) {
                // Force hide by setting display style directly, in case CSS class isn't working
                gameOverElement.classList.add('hidden');
                gameOverElement.style.display = 'none';
            } else {
                console.error('Game over element not found!');
            }
            
            // Reset high score message
            const highScoreMessage = document.getElementById('high-score-message');
            if (highScoreMessage) {
                highScoreMessage.classList.add('hidden');
            }
            
            // Reset game objects
            this.player.reset();
            this.obstacleManager.reset();
            this.trailSystem.reset();
            
            // Reset score
            this.score = 0;
            updateScoreDisplay(this.score);
            
            // Start new countdown
            this.startGame();
        } catch (error) {
            console.error('Error restarting game:', error);
        }
    }
    
    update() {
        // Always update basic scene elements, even when not running
        this.updateParticles();
        this.updateCamera();
        
        // ADDED: Update player's glow positions during countdown
        if (this.isRunning && !this.gameStarted && this.player) {
            // During countdown, make sure glow positions are always correct
            this.player.updateGlowPositions();
        }
        
        if (!this.isRunning || !this.gameStarted) return;
        
        // Track performance for the first few seconds
        let updateStart = 0;
        let isTracking = false;
        
        if (this.gameStarted && (!this.updateCount || this.updateCount < 180)) { // ~3 seconds at 60fps
            isTracking = true;
            updateStart = performance.now();
            this.updateCount = this.updateCount || 0;
            this.updateCount++;
            
            if (!this.updatePerformance) {
                this.updatePerformance = {
                    updates: [],
                    playerUpdate: 0,
                    obstacleUpdate: 0,
                    collisionCheck: 0,
                    cameraUpdate: 0,
                    particleUpdate: 0,
                    renderTime: 0
                };
            }
            
            // Track initial rendering performance
            if (this.updateCount === 1) {
                console.log('First game update - tracking initial performance');
                // Log initial WebGL context stats if available
                if (this.renderer && this.renderer.info) {
                    console.log('Renderer stats:', this.renderer.info);
                }
            }
            
            // ADDED: Enhanced profiling around the spike area (updates 50-70)
            if (this.updateCount >= 50 && this.updateCount <= 70) {
                this.captureDetailedProfile(this.updateCount);
            }
        }
        
        try {
            // Update game objects
            let playerStart;
            if (isTracking) playerStart = performance.now();
            
            this.player.update();
            
            if (isTracking) {
                this.updatePerformance.playerUpdate += performance.now() - playerStart;
            }
            
            let obstacleStart;
            if (isTracking) obstacleStart = performance.now();
            
            this.obstacleManager.update();
            this.trailSystem.update();
            
            if (isTracking) {
                this.updatePerformance.obstacleUpdate += performance.now() - obstacleStart;
            }
            
            // MODIFIED: Improved collision detection with safe zone
            if (this.score > 5) { // Only start checking collisions after a grace period
                let collisionStart;
                if (isTracking) collisionStart = performance.now();
                
                this.checkCollisions();
                
                if (isTracking) {
                    this.updatePerformance.collisionCheck += performance.now() - collisionStart;
                }
            }
            
            // Increase score only when game is running
            this.score += 0.1;
            const roundedScore = Math.floor(this.score);
            updateScoreDisplay(roundedScore);
            
            // Increase speed periodically
            if (roundedScore > 0 && roundedScore % this.speedIncreaseInterval === 0) {
                // Only increase once per interval
                if (Math.floor((this.score - 0.1)) % this.speedIncreaseInterval !== 0) {
                    this.obstacleManager.increaseSpeed(this.speedIncreaseAmount);
                    this.trailSystem.increaseSpeed(this.speedIncreaseAmount);
                    
                    // Flash effect to indicate speed increase
                    this.playSpeedUpEffect();
                }
            }
            
            // Randomly spawn collectibles
            if (Math.random() < 0.002) {
                this.spawnCollectible();
            }
            
            // Log performance data at specific intervals
            if (isTracking) {
                const updateDuration = performance.now() - updateStart;
                this.updatePerformance.updates.push(updateDuration);
                
                // Log at specific intervals and on first frame
                if (this.updateCount === 1 || this.updateCount === 60 || this.updateCount === 120 || this.updateCount === 180) {
                    console.log(`Performance data at update ${this.updateCount}:`, {
                        averageUpdateTime: this.updatePerformance.updates.reduce((a, b) => a + b, 0) / this.updatePerformance.updates.length,
                        playerUpdateTotal: this.updatePerformance.playerUpdate,
                        obstacleUpdateTotal: this.updatePerformance.obstacleUpdate,
                        collisionCheckTotal: this.updatePerformance.collisionCheck,
                        lastUpdateTime: updateDuration,
                        fps: this.currentFps,
                        activeObjects: this.scene ? this.scene.children.length : 'unknown'
                    });
                }
            }
        } catch (error) {
            console.error('Error in game update:', error);
        }
    }
    
    updateParticles() {
        try {
            if (this.particles) {
                this.particles.rotation.y += 0.0005;
                
                // Move particles to create flow effect
                const positions = this.particles.geometry.attributes.position.array;
                for (let i = 0; i < positions.length; i += 3) {
                    positions[i+2] += 0.03; // Move forward
                    
                    // If particle is too far ahead, reset it to behind
                    if (positions[i+2] > 5) {
                        positions[i+2] = -30 + Math.random() * 10;
                        positions[i] = (Math.random() - 0.5) * 10; // Randomize x position
                        positions[i+1] = Math.random() * 5; // Randomize y position
                    }
                }
                this.particles.geometry.attributes.position.needsUpdate = true;
            }
        } catch (error) {
            console.error('Error updating particles:', error);
        }
    }
    
    updateCamera() {
        try {
            // MODIFIED: Improved camera that follows player's horizontal movement too
            if (this.player) {
                // Add subtle camera movements based on player state
                if (this.player.isJumping) {
                    // Camera follows player's y position a bit when jumping
                    const targetY = 2.5 + this.player.position.y * 0.1;
                    this.camera.position.y += (targetY - this.camera.position.y) * 0.1;
                } else {
                    // Subtle camera shake during normal gameplay
                    this.camera.position.y = 2.5 + Math.sin(Date.now() * 0.001) * 0.05;
                }
                
                // MODIFIED: Camera follows player's x position for better side movement visibility
                const targetX = this.player.position.x * 0.3; // Scale down to make it subtle
                this.camera.position.x += (targetX - this.camera.position.x) * 0.05;
                
                // Keep the camera looking at a point ahead of the player
                this.camera.lookAt(this.player.position.x * 0.2, 1, -5);
            } else {
                // Subtle horizontal movement if player is not available
                this.camera.position.x = Math.sin(Date.now() * 0.0005) * 0.2;
            }
        } catch (error) {
            console.error('Error updating camera:', error);
        }
    }
    
    checkCollisions() {
        try {
            const obstacles = this.obstacleManager.getObstacles();
            
            for (const obstacle of obstacles) {
                // Adjust collision parameters based on obstacle type
                let collisionScale = 1.0;
                
                // Make spike hitboxes slightly smaller for fairness
                if (obstacle.type === 'spike') {
                    collisionScale = 0.9;
                }
                
                // Make barrier hitboxes match their visual shape better
                if (obstacle.type === 'barrier') {
                    // Adjust the hitbox to be wider but shorter
                    obstacle.size.y *= 0.9;
                }
                
                const scaledSize = {
                    x: obstacle.size.x * collisionScale,
                    y: obstacle.size.y * collisionScale,
                    z: obstacle.size.z * collisionScale
                };
                
                // Check for collision
                if (this.detailedCollisionCheck(this.player.position, obstacle.position, this.player.size, scaledSize)) {
                    // Handle collision
                    this.handleCollision(obstacle);
                    return true;
                }
            }
            
            return false;
        } catch (error) {
            console.error('Error checking collisions:', error);
            return false;
        }
    }
    
    // When collision happens, create visual effect
    handleCollision(obstacle) {
        try {
            console.log('Collision with', obstacle.type);
            
            // Add explosion/impact effect based on obstacle type
            this.obstacleManager.createCollisionEffect(obstacle);
            
            // Apply different effects based on obstacle type
            switch(obstacle.type) {
                case 'asteroid':
                    // Stronger shake for asteroid impacts
                    this.addScreenShake(0.5);
                    
                    // Show particle impact
                    this.showAsteroidImpact();
                    break;
                    
                case 'wormhole':
                    // Visual distortion for wormhole
                    this.showWormholeEffect();
                    
                    // Subtle shake
                    this.addScreenShake(0.2);
                    break;
                    
                case 'planet':
                    // Medium shake
                    this.addScreenShake(0.4);
                    
                    // Show gravitational effect
                    this.showPlanetaryImpact();
                    break;
                    
                case 'satellite':
                    // Light shake
                    this.addScreenShake(0.3);
                    
                    // Show electrical sparks
                    this.showSatelliteImpact();
                    break;
                    
                default:
                    // Default shake
                    this.addScreenShake(0.3);
            }
            
            // Show brief slow-motion effect before game over
            this.showSlowMotionEffect(() => {
                this.gameOver();
            });
        } catch (error) {
            console.error('Error handling collision:', error);
            // Fallback to direct game over
            this.gameOver();
        }
    }
    
    // ADDED: More detailed collision check with better visualization
    detailedCollisionCheck(pos1, pos2, size1, size2) {
        // Calculate collision boundaries
        const halfWidth1 = size1.x / 2;
        const halfHeight1 = size1.y / 2;
        const halfDepth1 = size1.z / 2;
        
        const halfWidth2 = size2.x / 2;
        const halfHeight2 = size2.y / 2;
        const halfDepth2 = size2.z / 2;
        
        // Check for overlap in all three dimensions
        const overlapX = Math.abs(pos1.x - pos2.x) < (halfWidth1 + halfWidth2);
        const overlapY = Math.abs(pos1.y - pos2.y) < (halfHeight1 + halfHeight2);
        const overlapZ = Math.abs(pos1.z - pos2.z) < (halfDepth1 + halfDepth2);
        
        const isColliding = overlapX && overlapY && overlapZ;
        
        // Debug collision info if colliding
        if (isColliding) {
            console.log('Collision details:', {
                player: { pos: pos1, size: size1 },
                obstacle: { pos: pos2, size: size2 },
                overlap: { x: overlapX, y: overlapY, z: overlapZ }
            });
            
            // For debugging: visualize collision boxes
            this.visualizeCollisionBoxes(pos1, pos2, size1, size2);
        }
        
        return isColliding;
    }
    
    // ADDED: Helper to visualize collision boxes for debugging
    visualizeCollisionBoxes(pos1, pos2, size1, size2) {
        try {
            // Create wireframe boxes to visualize collision boundaries
            const box1Geo = new THREE.BoxGeometry(size1.x, size1.y, size1.z);
            const box2Geo = new THREE.BoxGeometry(size2.x, size2.y, size2.z);
            
            const wireframeMaterial = new THREE.MeshBasicMaterial({
                color: 0xff0000,
                wireframe: true,
                transparent: true,
                opacity: 0.7
            });
            
            const box1 = new THREE.Mesh(box1Geo, wireframeMaterial);
            const box2 = new THREE.Mesh(box2Geo, wireframeMaterial);
            
            box1.position.set(pos1.x, pos1.y, pos1.z);
            box2.position.set(pos2.x, pos2.y, pos2.z);
            
            this.scene.add(box1);
            this.scene.add(box2);
            
            // Remove after a short time
            setTimeout(() => {
                this.scene.remove(box1);
                this.scene.remove(box2);
            }, 200);
        } catch (error) {
            console.error('Error visualizing collision boxes:', error);
        }
    }

    // ADDED: New enhanced collision effect
    playEnhancedCollisionEffect(collisionPoint, obstaclePosition) {
        try {
            // 1. Create explosion particles at collision point
            const particleCount = 50; // Increased from 30
            const particles = [];
            
            // Create particle colors
            const particleColors = [
                new THREE.Color(0xff5555), // red
                new THREE.Color(0xff8855), // orange
                new THREE.Color(0xffff55), // yellow
                new THREE.Color(0xffffff)  // white
            ];
            
            for (let i = 0; i < particleCount; i++) {
                // Choose random color from palette
                const color = particleColors[Math.floor(Math.random() * particleColors.length)];
                
                // Create particle with random size
                const size = 0.05 + Math.random() * 0.15;
                
                // FIXED: Use MeshPhongMaterial instead of MeshBasicMaterial if emissive properties are needed
                const useFancyMaterial = Math.random() > 0.5; // Use a mix of material types for visual variety
                
                let material;
                if (useFancyMaterial) {
                    // MeshPhongMaterial supports emissive property
                    material = new THREE.MeshPhongMaterial({
                        color: color,
                        transparent: true,
                        opacity: 0.9,
                        emissive: color,
                        emissiveIntensity: 0.7,
                        shininess: 100
                    });
                } else {
                    // MeshBasicMaterial for simpler particles (no emissive)
                    material = new THREE.MeshBasicMaterial({
                        color: color,
                        transparent: true,
                        opacity: 0.9
                    });
                }
                
                const particle = new THREE.Mesh(
                    new THREE.SphereGeometry(size, 8, 8),
                    material
                );
                
                // Position at collision point with slight random offset
                particle.position.set(
                    collisionPoint.x + (Math.random() - 0.5) * 0.2,
                    collisionPoint.y + (Math.random() - 0.5) * 0.2,
                    collisionPoint.z + (Math.random() - 0.5) * 0.2
                );
                
                // Random velocity with more energy
                particle.velocity = new THREE.Vector3(
                    (Math.random() - 0.5) * 0.4,
                    Math.random() * 0.4,
                    (Math.random() - 0.5) * 0.4
                );
                
                // Add to scene
                this.scene.add(particle);
                particles.push(particle);
                
                // Remove after animation
                setTimeout(() => {
                    this.scene.remove(particle);
                }, 1500);
            }
            
            // 2. Create a flash at the collision point
            const flashLight = new THREE.PointLight(0xffaa00, 5, 10);
            flashLight.position.copy(collisionPoint);
            this.scene.add(flashLight);
            
            // Flash animation
            let flashIntensity = 5;
            const animateFlash = () => {
                flashIntensity *= 0.9;
                flashLight.intensity = flashIntensity;
                
                if (flashIntensity > 0.1) {
                    requestAnimationFrame(animateFlash);
                } else {
                    this.scene.remove(flashLight);
                }
            };
            
            animateFlash();
            
            // 3. Create a shock wave ring
            const ringGeometry = new THREE.RingGeometry(0.2, 0.4, 32);
            const ringMaterial = new THREE.MeshBasicMaterial({
                color: 0xffaa00,
                transparent: true,
                opacity: 0.9,
                side: THREE.DoubleSide
            });
            
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            ring.position.copy(collisionPoint);
            
            // Orient ring to face camera
            ring.lookAt(this.camera.position);
            this.scene.add(ring);
            
            // Animate particles
            const animateParticles = () => {
                for (const particle of particles) {
                    // Move according to velocity
                    particle.position.add(particle.velocity);
                    
                    // Apply gravity and drag
                    particle.velocity.y -= 0.015; // gravity
                    particle.velocity.multiplyScalar(0.98); // drag
                    
                    // Fade out
                    particle.material.opacity -= 0.01;
                    
                    // Shrink slightly
                    particle.scale.multiplyScalar(0.99);
                }
                
                if (particles[0].material.opacity > 0) {
                    requestAnimationFrame(animateParticles);
                }
            };
            
            // Animate shock wave ring
            let ringScale = 1;
            let ringOpacity = 0.9;
            
            const animateRing = () => {
                ringScale += 0.2;
                ringOpacity -= 0.05;
                
                ring.scale.set(ringScale, ringScale, ringScale);
                ringMaterial.opacity = ringOpacity;
                
                if (ringOpacity > 0) {
                    requestAnimationFrame(animateRing);
                } else {
                    this.scene.remove(ring);
                }
            };
            
            animateParticles();
            animateRing();
            
            // 4. Create camera shake effect
            const originalCameraPos = {
                x: this.camera.position.x,
                y: this.camera.position.y,
                z: this.camera.position.z
            };
            
            const shakeCamera = () => {
                const shakeAmount = 0.2;
                this.camera.position.set(
                    originalCameraPos.x + (Math.random() - 0.5) * shakeAmount,
                    originalCameraPos.y + (Math.random() - 0.5) * shakeAmount,
                    originalCameraPos.z + (Math.random() - 0.5) * shakeAmount
                );
            };
            
            // Apply shake 10 times over 500ms
            let shakeCount = 0;
            const shakeInterval = setInterval(() => {
                shakeCamera();
                shakeCount++;
                
                if (shakeCount >= 10) {
                    clearInterval(shakeInterval);
                    // Reset camera position
                    this.camera.position.set(
                        originalCameraPos.x,
                        originalCameraPos.y,
                        originalCameraPos.z
                    );
                }
            }, 50);
            
        } catch (error) {
            console.error('Error playing enhanced collision effect:', error);
        }
    }
    
    // ADDED: Slow motion effect on collision
    showSlowMotionEffect(callback) {
        try {
            // Store original speeds
            const originalObstacleSpeed = this.obstacleManager.obstacleSpeed;
            const originalTrailSpeed = this.trailSystem.trailSpeed;
            
            // Slow down game
            this.obstacleManager.obstacleSpeed *= 0.2;
            this.trailSystem.trailSpeed *= 0.2;
            
            // Slow down player animation
            if (this.player) {
                this.player.setSlowMotion(true);
            }
            
            // Return to normal speed after delay and execute callback
            setTimeout(() => {
                this.obstacleManager.obstacleSpeed = originalObstacleSpeed;
                this.trailSystem.trailSpeed = originalTrailSpeed;
                
                if (this.player) {
                    this.player.setSlowMotion(false);
                }
                
                if (callback) callback();
            }, 800);
        } catch (error) {
            console.error('Error showing slow motion effect:', error);
            // Ensure callback still runs even if effect fails
            if (callback) callback();
        }
    }

    playSpeedUpEffect() {
        try {
            // Flash screen blue briefly
            const flash = document.createElement('div');
            flash.style.position = 'absolute';
            flash.style.top = '0';
            flash.style.left = '0';
            flash.style.width = '100%';
            flash.style.height = '100%';
            flash.style.backgroundColor = 'rgba(0, 100, 255, 0.2)';
            flash.style.pointerEvents = 'none';
            flash.style.zIndex = '100';
            document.body.appendChild(flash);
            
            // Fade out and remove
            setTimeout(() => {
                flash.style.transition = 'opacity 0.5s';
                flash.style.opacity = '0';
                setTimeout(() => {
                    document.body.removeChild(flash);
                }, 500);
            }, 200);
        } catch (error) {
            console.error('Error playing speed up effect:', error);
        }
    }
    
    spawnCollectible() {
        try {
            // Create a spinning collectible orb
            const geometry = new THREE.SphereGeometry(0.3, 16, 16);
            const material = new THREE.MeshPhongMaterial({
                color: 0xffcc00,
                emissive: 0xffcc00,
                emissiveIntensity: 0.5,
                shininess: 100
            });
            
            const collectible = new THREE.Mesh(geometry, material);
            
            // Position it randomly but always ahead of player
            collectible.position.set(
                (Math.random() - 0.5) * 3,  // x
                1 + Math.random() * 1.5,    // y
                -this.obstacleManager.spawnDistance // z
            );
            
            // Add light for glow effect
            const light = new THREE.PointLight(0xffcc00, 1, 3);
            collectible.add(light);
            
            this.scene.add(collectible);
            
            // Track this collectible
            const collectibleObj = {
                mesh: collectible,
                light: light,
                size: { x: 0.6, y: 0.6, z: 0.6 },
                rotationSpeed: 0.05,
                collected: false
            };
            
            // Create animation function
            const animateCollectible = () => {
                if (!collectibleObj.collected) {
                    // Move forward
                    collectible.position.z += this.obstacleManager.obstacleSpeed;
                    
                    // Rotate
                    collectible.rotation.y += collectibleObj.rotationSpeed;
                    collectible.rotation.x += collectibleObj.rotationSpeed / 2;
                    
                    // Hover animation
                    collectible.position.y += Math.sin(Date.now() * 0.005) * 0.01;
                    
                    // Check if collected
                    if (this.detailedCollisionCheck(
                        this.player.position, collectible.position,
                        this.player.size, collectibleObj.size
                    )) {
                        this.collectOrb(collectibleObj);
                        return;
                    }
                    
                    // Remove if passed player
                    if (collectible.position.z > 5) {
                        this.scene.remove(collectible);
                        return;
                    }
                    
                    requestAnimationFrame(animateCollectible);
                }
            };
            
            animateCollectible();
        } catch (error) {
            console.error('Error spawning collectible:', error);
        }
    }
    
    collectOrb(collectible) {
        try {
            // Mark as collected to stop animation
            collectible.collected = true;
            
            // Score boost
            this.score += 5;
            updateScoreDisplay(Math.floor(this.score));
            
            // Visual effect - explode into particles
            const particleCount = 20;
            const particles = [];
            
            for (let i = 0; i < particleCount; i++) {
                const particle = new THREE.Mesh(
                    new THREE.SphereGeometry(0.05, 8, 8),
                    new THREE.MeshBasicMaterial({
                        color: 0xffcc00,
                        transparent: true,
                        opacity: 0.8
                    })
                );
                
                // Position at collectible point
                particle.position.copy(collectible.mesh.position);
                
                // Random velocity
                particle.velocity = new THREE.Vector3(
                    (Math.random() - 0.5) * 0.2,
                    Math.random() * 0.2,
                    (Math.random() - 0.5) * 0.2
                );
                
                // Add to scene
                this.scene.add(particle);
                particles.push(particle);
                
                // Remove after animation
                setTimeout(() => {
                    this.scene.remove(particle);
                }, 1000);
            }
            
            // Animate particles
            const animateParticles = () => {
                for (const particle of particles) {
                    particle.position.add(particle.velocity);
                    particle.velocity.y -= 0.01; // gravity
                    particle.material.opacity -= 0.02;
                }
                
                if (particles[0].material.opacity > 0) {
                    requestAnimationFrame(animateParticles);
                }
            };
            
            animateParticles();
            
            // Remove the collectible
            this.scene.remove(collectible.mesh);
            
            // Show score popup
            this.showScorePopup(collectible.mesh.position, "+5");
        } catch (error) {
            console.error('Error collecting orb:', error);
        }
    }
    
    showScorePopup(position, text) {
        try {
            // Create HTML element for score popup
            const popup = document.createElement('div');
            popup.textContent = text;
            popup.style.position = 'absolute';
            popup.style.color = '#ffcc00';
            popup.style.fontWeight = 'bold';
            popup.style.fontSize = '24px';
            popup.style.textShadow = '0 0 5px rgba(255, 204, 0, 0.7)';
            popup.style.pointerEvents = 'none';
            
            // Convert 3D position to screen coordinates
            const vector = new THREE.Vector3();
            vector.copy(position);
            vector.project(this.camera);
            
            const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
            const y = -(vector.y * 0.5 - 0.5) * window.innerHeight;
            
            popup.style.left = `${x}px`;
            popup.style.top = `${y}px`;
            
            document.body.appendChild(popup);
            
            // Animate rising and fading
            let opacity = 1;
            let posY = y;
            
            const animatePopup = () => {
                opacity -= 0.02;
                posY -= 1;
                
                popup.style.opacity = opacity;
                popup.style.top = `${posY}px`;
                
                if (opacity > 0) {
                    requestAnimationFrame(animatePopup);
                } else {
                    document.body.removeChild(popup);
                }
            };
            
            animatePopup();
        } catch (error) {
            console.error('Error showing score popup:', error);
        }
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        try {
            // Update FPS counter with a more stable calculation
            this.frames++;
            const now = performance.now();
            
            // Update FPS every 500ms for a smoother reading
            if (now >= this.lastFpsUpdate + 500) {
                // Calculate FPS with millisecond precision
                const elapsed = now - this.lastFpsUpdate;
                this.currentFps = Math.round((this.frames * 1000) / elapsed);
                this.lastFpsUpdate = now;
                this.frames = 0;
                
                // Update FPS display with red color as requested
                const fpsCounter = document.getElementById('fps-counter');
                if (fpsCounter) {
                    fpsCounter.textContent = `FPS: ${this.currentFps}`;
                    fpsCounter.style.color = '#ff3333'; // Ensure it's red
                }
            }
            
            // Track render performance during the initial period
            const isInitialPeriod = this.gameStarted && this.updatePerformance && this.updateCount && this.updateCount < 180;
            const updateStart = isInitialPeriod ? performance.now() : 0;
            
            this.update();
            
            // ADDED: Track pre-render state for detailed profiling around the spike area
            let preRenderMemory = null;
            let materialCompilationStart = 0;
            let preRenderStart = 0;
            
            if (isInitialPeriod && this.updateCount >= 55 && this.updateCount <= 65) {
                preRenderMemory = window.performance && window.performance.memory ? 
                    {...window.performance.memory} : null;
                
                preRenderStart = performance.now();
                
                // Log more details about renderer state before rendering
                console.log(`PRE-RENDER at update ${this.updateCount}:`, {
                    updateCount: this.updateCount,
                    renderCalls: this.renderer.info?.render?.calls || 'unknown',
                    triangles: this.renderer.info?.render?.triangles || 'unknown',
                    geometries: this.renderer.info?.memory?.geometries || 'unknown',
                    textures: this.renderer.info?.memory?.textures || 'unknown',
                    programs: this.renderer.info?.programs?.length || 'unknown'
                });
                
                // Force material update on all objects to detect compilation spikes
                materialCompilationStart = performance.now();
                this.scene.traverse(object => {
                    if (object.material) {
                        if (Array.isArray(object.material)) {
                            object.material.forEach(mat => {
                                if (mat.needsUpdate !== undefined) mat.needsUpdate = true;
                            });
                        } else if (object.material.needsUpdate !== undefined) {
                            object.material.needsUpdate = true;
                        }
                    }
                });
                console.log(`Material compilation time: ${performance.now() - materialCompilationStart}ms`);
            }
            
            // Animate background color very subtly
            if (this.scene && this.scene.background) {
                const time = Date.now() * 0.0001;
                const hue = 0.6 + Math.sin(time) * 0.05; // Blue to purple range
                
                // Create a temporary color object as the target parameter required in newer Three.js
                const targetColor = new THREE.Color();
                // Set the background color using temporary target
                this.scene.background.getHSL(targetColor);
                this.scene.background.setHSL(hue, 0.6, 0.1);
                
                // Also update fog color if it exists
                if (this.scene.fog && this.scene.fog.color) {
                    const fogTargetColor = new THREE.Color();
                    this.scene.fog.color.getHSL(fogTargetColor);
                    this.scene.fog.color.setHSL(hue, 0.6, 0.1);
                }
            }
            
            // Measure render time if in initial period
            const renderStart = isInitialPeriod ? performance.now() : 0;
            
            // ADDED: Track detailed render phases for spike identification
            if (isInitialPeriod && this.updateCount >= 55 && this.updateCount <= 65) {
                // Break down render into sub-steps to identify the bottleneck
                const renderPrepStart = performance.now();
                // Renderer internal preparation steps would happen here in Three.js
                const renderPrepTime = performance.now() - renderPrepStart;
                
                // Log the preparation time
                if (renderPrepTime > 1) {
                    console.log(`Render preparation time: ${renderPrepTime}ms`);
                }
            }
            
            this.renderer.render(this.scene, this.camera);
            
            // ADDED: Post-render logging for the spike area
            if (isInitialPeriod && this.updateCount >= 55 && this.updateCount <= 65) {
                const renderTime = performance.now() - renderStart;
                const postRenderMemory = window.performance && window.performance.memory ? 
                    {...window.performance.memory} : null;
                
                console.log(`POST-RENDER at update ${this.updateCount}:`, {
                    updateCount: this.updateCount,
                    totalRenderTime: renderTime,
                    preRenderToPostRender: performance.now() - preRenderStart,
                    memorySizeBefore: preRenderMemory ? (preRenderMemory.usedJSHeapSize / 1000000).toFixed(2) + 'MB' : 'unknown',
                    memorySizeAfter: postRenderMemory ? (postRenderMemory.usedJSHeapSize / 1000000).toFixed(2) + 'MB' : 'unknown',
                    memoryDelta: (preRenderMemory && postRenderMemory) ? 
                        ((postRenderMemory.usedJSHeapSize - preRenderMemory.usedJSHeapSize) / 1000000).toFixed(2) + 'MB' : 'unknown'
                });
                
                if (renderTime > 50) {
                    console.warn(`HIGH RENDER TIME DETECTED: ${renderTime}ms at update ${this.updateCount}`);
                }
            }
            
            // Add back original render time logging
            if (isInitialPeriod) {
                const renderTime = performance.now() - renderStart;
                const totalFrameTime = performance.now() - updateStart;
                
                this.updatePerformance.renderTime += renderTime;
                
                // Log detailed render stats periodically
                if (this.updateCount % 60 === 0) {
                    console.log(`Render stats at update ${this.updateCount}:`, {
                        renderTime: renderTime,
                        totalFrameTime: totalFrameTime,
                        updateToRenderRatio: (totalFrameTime - renderTime) / totalFrameTime,
                        cumulativeRenderTime: this.updatePerformance.renderTime
                    });
                }
            }
        } catch (error) {
            console.error('Error in animation loop:', error);
        }
    }

    // ADDED: Detailed profiling function to diagnose rendering spikes
    captureDetailedProfile(updateCount) {
        try {
            const now = performance.now();
            const memory = window.performance && window.performance.memory ? 
                window.performance.memory : { usedJSHeapSize: 'unavailable' };
            
            // Scene statistics
            const sceneStats = {
                totalObjects: this.scene.children.length,
                visibleObjects: 0,
                objectTypes: {},
                materialTypes: {},
                geometryTypes: {},
                textureCount: 0
            };
            
            // Count object types and materials
            this.scene.traverse(object => {
                // Only count visible objects
                if (object.visible === false) return;
                
                sceneStats.visibleObjects++;
                
                // Count by object type
                const type = object.type || 'Unknown';
                sceneStats.objectTypes[type] = (sceneStats.objectTypes[type] || 0) + 1;
                
                // Count materials
                if (object.material) {
                    const materials = Array.isArray(object.material) ? object.material : [object.material];
                    materials.forEach(material => {
                        if (!material) return;
                        const matType = material.type || 'Unknown';
                        sceneStats.materialTypes[matType] = (sceneStats.materialTypes[matType] || 0) + 1;
                        
                        // Count textures
                        if (material.map) sceneStats.textureCount++;
                        if (material.normalMap) sceneStats.textureCount++;
                        if (material.specularMap) sceneStats.textureCount++;
                        if (material.emissiveMap) sceneStats.textureCount++;
                    });
                }
                
                // Count geometries
                if (object.geometry) {
                    const geoType = object.geometry.type || 'Unknown';
                    sceneStats.geometryTypes[geoType] = (sceneStats.geometryTypes[geoType] || 0) + 1;
                }
            });
            
            // Renderer info
            const rendererInfo = this.renderer.info ? {
                render: {...this.renderer.info.render},
                memory: {...this.renderer.info.memory},
                programs: this.renderer.info.programs ? this.renderer.info.programs.length : 0
            } : 'Renderer info unavailable';
            
            // Collect obstacle and particle stats
            const gameObjectStats = {
                obstacles: this.obstacleManager ? this.obstacleManager.obstacles.length : 0,
                trails: this.trailSystem ? this.trailSystem.trails.length : 0,
                particles: 0  // We'll count these below
            };
            
            // Count particles specifically (they're often the cause of performance issues)
            this.scene.traverse(object => {
                if (object.geometry && 
                    object.geometry.type === 'SphereGeometry' &&
                    object.geometry.parameters && 
                    object.geometry.parameters.radius < 0.2) {
                    gameObjectStats.particles++;
                }
            });
            
            // Log everything with clear formatting
            console.log(`===== DETAILED PROFILE AT UPDATE ${updateCount} =====`);
            console.log(`Time: ${now.toFixed(2)}ms since start`);
            console.log(`Memory: ${(memory.usedJSHeapSize / 1000000).toFixed(2)}MB used`);
            console.log(`FPS: ${this.currentFps}`);
            console.log(`Scene objects: ${sceneStats.totalObjects} total, ${sceneStats.visibleObjects} visible`);
            console.log(`Game objects: ${gameObjectStats.obstacles} obstacles, ${gameObjectStats.trails} trails, ${gameObjectStats.particles} particles`);
            console.log(`Object types:`, sceneStats.objectTypes);
            console.log(`Material types:`, sceneStats.materialTypes);
            console.log(`Geometry types:`, sceneStats.geometryTypes);
            console.log(`Renderer stats:`, rendererInfo);
            console.log(`====================================`);
            
            // Return the stats so they can be stored if needed
            return {
                updateCount,
                timestamp: now,
                memory,
                fps: this.currentFps,
                sceneStats,
                gameObjectStats,
                rendererInfo
            };
        } catch (error) {
            console.error('Error capturing detailed profile:', error);
            return null;
        }
    }

    // Add this method to the Game class
    addScreenShake(intensity = 0.3) {
        try {
            // Store original camera position
            const originalPosition = {
                x: this.camera.position.x,
                y: this.camera.position.y,
                z: this.camera.position.z
            };
            
            // Animation variables
            let shakeTime = 0;
            const shakeDuration = 0.5; // seconds
            const maxShakeTime = shakeDuration * 60; // frames (assuming 60fps)
            
            // Create shake animation function
            const shakeCamera = () => {
                if (shakeTime >= maxShakeTime) {
                    // Restore original position
                    this.camera.position.set(originalPosition.x, originalPosition.y, originalPosition.z);
                    return;
                }
                
                // Calculate shake intensity based on remaining time (gradually decrease)
                const currentIntensity = intensity * (1 - (shakeTime / maxShakeTime));
                
                // Apply random offset
                this.camera.position.set(
                    originalPosition.x + (Math.random() - 0.5) * currentIntensity,
                    originalPosition.y + (Math.random() - 0.5) * currentIntensity,
                    originalPosition.z + (Math.random() - 0.5) * currentIntensity * 0.5 // Less shake in z direction
                );
                
                shakeTime++;
                requestAnimationFrame(shakeCamera);
            };
            
            // Start shake animation
            shakeCamera();
        } catch (error) {
            console.error('Error adding screen shake:', error);
        }
    }

    // Add this method to load assets progressively
    loadGameAssets() {
        try {
            console.log('Loading game assets progressively...');
            
            // Setup loading screen or indicator
            this.showLoadingIndicator(true);
            
            // Add environment objects with minimal initial geometry
            this.addEnvironmentObjects();
            
            // Queue remaining asset loading
            setTimeout(() => {
                // Initialize player
                const playerStart = performance.now();
                this.player = new Player(this.scene);
                this.performanceLog.playerInit = performance.now() - playerStart;
                
                setTimeout(() => {
                    // Initialize obstacle manager
                    const obstacleStart = performance.now();
                    this.obstacleManager = new ObstacleManager(this.scene);
                    this.performanceLog.obstacleInit = performance.now() - obstacleStart;
                    
                    setTimeout(() => {
                        // Initialize trail system
                        const trailStart = performance.now();
                        this.trailSystem = new TrailSystem(this.scene);
                        this.performanceLog.trailInit = performance.now() - trailStart;
                        
                        // Setup controls last
                        const controlsStart = performance.now();
                        this.setupControls();
                        this.performanceLog.setupControls = performance.now() - controlsStart;
                        
                        // All assets loaded
                        this.assetsLoaded = true;
                        this.initialLoadComplete = true;
                        this.showLoadingIndicator(false);
                        
                        console.log('All game assets loaded successfully');
                    }, 100);
                }, 100);
            }, 100);
            
        } catch (error) {
            console.error('Error loading game assets:', error);
            // Hide loading indicator and show error
            this.showLoadingIndicator(false);
            alert('Failed to load some game assets. Game may not function correctly.');
        }
    }

    // Add a simple loading indicator
    showLoadingIndicator(show) {
        try {
            let loadingElement = document.getElementById('loading-indicator');
            
            if (show) {
                if (!loadingElement) {
                    loadingElement = document.createElement('div');
                    loadingElement.id = 'loading-indicator';
                    loadingElement.innerHTML = 'Loading Game Assets...';
                    loadingElement.style.cssText = `
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        background-color: rgba(0, 0, 0, 0.7);
                        color: white;
                        padding: 15px 30px;
                        border-radius: 10px;
                        font-family: Arial, sans-serif;
                        z-index: 1000;
                    `;
                    document.body.appendChild(loadingElement);
                }
            } else if (loadingElement) {
                document.body.removeChild(loadingElement);
            }
        } catch (error) {
            console.error('Error showing/hiding loading indicator:', error);
        }
    }

    // Add these special effects methods
    showAsteroidImpact() {
        try {
            // Flash the screen orange/red briefly
            const flash = document.createElement('div');
            flash.style.position = 'absolute';
            flash.style.top = '0';
            flash.style.left = '0';
            flash.style.width = '100%';
            flash.style.height = '100%';
            flash.style.backgroundColor = 'rgba(255, 100, 50, 0.4)';
            flash.style.zIndex = '1000';
            
            document.body.appendChild(flash);
            
            setTimeout(() => {
                flash.style.transition = 'opacity 0.5s';
                flash.style.opacity = '0';
                setTimeout(() => {
                    document.body.removeChild(flash);
                }, 500);
            }, 100);
        } catch (error) {
            console.error('Error showing asteroid impact effect:', error);
        }
    }

    showWormholeEffect() {
        try {
            // Create a ripple/distortion effect
            const distortion = document.createElement('div');
            distortion.style.position = 'absolute';
            distortion.style.top = '0';
            distortion.style.left = '0';
            distortion.style.width = '100%';
            distortion.style.height = '100%';
            distortion.style.backgroundImage = 'radial-gradient(circle, rgba(100, 50, 255, 0.7) 0%, rgba(100, 50, 255, 0) 70%)';
            distortion.style.zIndex = '1000';
            distortion.style.opacity = '0';
            distortion.style.transition = 'transform 1s, opacity 1s';
            
            document.body.appendChild(distortion);
            
            // Animate the distortion
            setTimeout(() => {
                distortion.style.opacity = '1';
                distortion.style.transform = 'scale(2)';
                
                setTimeout(() => {
                    distortion.style.opacity = '0';
                    setTimeout(() => {
                        document.body.removeChild(distortion);
                    }, 1000);
                }, 200);
            }, 10);
        } catch (error) {
            console.error('Error showing wormhole effect:', error);
        }
    }

    showPlanetaryImpact() {
        // Implementation of planetary impact effect
        // Similar to previous effects but with different visuals
    }

    showSatelliteImpact() {
        // Implementation of satellite impact effect
        // Electrical sparks or similar visuals
    }
}