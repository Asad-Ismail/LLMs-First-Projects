/**
 * Main game controller for Tap Dash
 */
class Game {
    constructor() {
        console.log('Game constructor called');
        this.isRunning = false;
        this.score = 0;
        this.speedIncreaseInterval = 10; // Increase speed every 10 points
        this.speedIncreaseAmount = 0.01;
        
        try {
            // Set up Three.js scene
            this.setupScene();
            
            // Add environment objects (stars, mountains)
            this.addEnvironmentObjects();
            
            // Initialize game objects
            this.player = new Player(this.scene);
            this.obstacleManager = new ObstacleManager(this.scene);
            this.trailSystem = new TrailSystem(this.scene);
            
            // Set up controls
            this.setupControls();
            
            // Start animation loop
            this.animate();
            
            // Make the game instance globally accessible for debugging
            window.gameInstance = this;
            
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
                } else {
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
            
            // Add keyboard controls with simplified logic
            document.addEventListener('keydown', (e) => {
                if (e.code === 'Space') {
                    console.log('Space pressed');
                    if (!this.isRunning) {
                        this.startGame();
                    } else {
                        this.handleTap();
                    }
                    e.preventDefault(); // Prevent scrolling
                }
            });
            
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
        if (!this.isRunning) {
            console.log('Tap ignored - game not running');
            return;
        }
        
        console.log('Handling tap while game is running');
        
        try {
            // Attempt to jump
            const jumped = this.player.jump();
            
            // If successfully jumped, create a trail
            if (jumped) {
                this.trailSystem.createTrail(this.player.position);
            }
        } catch (error) {
            console.error('Error handling tap:', error);
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
            
            this.isRunning = true;
            console.log('Game is now running:', this.isRunning);
            
            // Add a short countdown before starting
            const countdownEl = document.createElement('div');
            countdownEl.className = 'countdown';
            countdownEl.textContent = '3';
            
            const uiLayer = document.getElementById('ui-layer');
            if (uiLayer) {
                uiLayer.appendChild(countdownEl);
                
                let count = 3;
                const countdown = setInterval(() => {
                    count--;
                    if (count > 0) {
                        countdownEl.textContent = count;
                    } else {
                        clearInterval(countdown);
                        uiLayer.removeChild(countdownEl);
                    }
                }, 1000);
            } else {
                console.error('UI layer not found!');
            }
        } catch (error) {
            console.error('Error starting game:', error);
        }
    }
    
    gameOver() {
        console.log('Game over');
        this.isRunning = false;
        
        try {
            const finalScoreElement = document.getElementById('final-score');
            if (finalScoreElement) {
                finalScoreElement.textContent = Math.floor(this.score);
            }
            
            const gameOverElement = document.getElementById('game-over');
            if (gameOverElement) {
                gameOverElement.classList.remove('hidden');
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
            const gameOverElement = document.getElementById('game-over');
            if (gameOverElement) {
                gameOverElement.classList.add('hidden');
            }
            
            // Reset game objects
            this.player.reset();
            this.obstacleManager.reset();
            this.trailSystem.reset();
            
            // Reset score
            this.score = 0;
            updateScoreDisplay(this.score);
            
            // Start game
            this.isRunning = true;
            console.log('Game restarted and running');
        } catch (error) {
            console.error('Error restarting game:', error);
        }
    }
    
    update() {
        if (!this.isRunning) return;
        
        try {
            // Update game objects
            this.player.update();
            this.obstacleManager.update();
            this.trailSystem.update();
            
            // Animate particles
            this.updateParticles();
            
            // Add subtle camera movements for more dynamic feel
            this.updateCamera();
            
            // Check for collisions
            this.checkCollisions();
            
            // Increase score
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
            // Add subtle camera movements based on player state
            if (this.player.isJumping) {
                // Camera follows player's y position a bit when jumping
                const targetY = 2.5 + this.player.position.y * 0.1;
                this.camera.position.y += (targetY - this.camera.position.y) * 0.1;
            } else {
                // Subtle camera shake during normal gameplay
                this.camera.position.y = 2.5 + Math.sin(Date.now() * 0.001) * 0.05;
            }
            
            // Subtle horizontal movement
            this.camera.position.x = Math.sin(Date.now() * 0.0005) * 0.2;
        } catch (error) {
            console.error('Error updating camera:', error);
        }
    }
    
    checkCollisions() {
        try {
            // Check for collisions with obstacles
            const obstacles = this.obstacleManager.getObstacles();
            for (const obstacle of obstacles) {
                if (checkCollision(
                    this.player.position, obstacle.position,
                    this.player.size, obstacle.size
                )) {
                    this.playCollisionEffect(obstacle.position);
                    this.gameOver();
                    return;
                }
            }
            
            // Check for collisions with previous trails (only after first few seconds)
            if (this.score > 5) {
                const trails = this.trailSystem.getTrails();
                for (const trail of trails) {
                    if (checkCollision(
                        this.player.position, trail.position,
                        this.player.size, trail.size
                    )) {
                        this.playCollisionEffect(trail.position);
                        this.gameOver();
                        return;
                    }
                }
            }
        } catch (error) {
            console.error('Error checking collisions:', error);
        }
    }
    
    playCollisionEffect(position) {
        try {
            // Create explosion-like particles at collision point
            const particleCount = 30;
            const particles = [];
            
            for (let i = 0; i < particleCount; i++) {
                const particle = new THREE.Mesh(
                    new THREE.SphereGeometry(0.1, 8, 8),
                    new THREE.MeshBasicMaterial({
                        color: 0xff5555,
                        transparent: true,
                        opacity: 0.8
                    })
                );
                
                // Position at collision point
                particle.position.copy(position);
                
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
                    particle.scale.multiplyScalar(0.97);
                }
                
                if (particles[0].material.opacity > 0) {
                    requestAnimationFrame(animateParticles);
                }
            };
            
            animateParticles();
            
            // Flash screen red briefly
            const flash = document.createElement('div');
            flash.style.position = 'absolute';
            flash.style.top = '0';
            flash.style.left = '0';
            flash.style.width = '100%';
            flash.style.height = '100%';
            flash.style.backgroundColor = 'rgba(255, 0, 0, 0.3)';
            flash.style.pointerEvents = 'none';
            flash.style.zIndex = '100';
            document.body.appendChild(flash);
            
            // Fade out and remove
            setTimeout(() => {
                flash.style.transition = 'opacity 0.3s';
                flash.style.opacity = '0';
                setTimeout(() => {
                    document.body.removeChild(flash);
                }, 300);
            }, 100);
        } catch (error) {
            console.error('Error playing collision effect:', error);
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
            
            // Position it randomly
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
                    if (checkCollision(
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
            this.update();
            
            // Animate background color very subtly
            if (this.scene && this.scene.background) {
                const time = Date.now() * 0.0001;
                const hue = 0.6 + Math.sin(time) * 0.05; // Blue to purple range
                this.scene.background.setHSL(hue, 0.6, 0.1);
                if (this.scene.fog && this.scene.fog.color) {
                    this.scene.fog.color.setHSL(hue, 0.6, 0.1);
                }
            }
            
            this.renderer.render(this.scene, this.camera);
        } catch (error) {
            console.error('Error in animation loop:', error);
        }
    }
}