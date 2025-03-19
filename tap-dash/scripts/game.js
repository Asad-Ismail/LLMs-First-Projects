/**
 * Main game controller for Tap Dash
 */
class Game {
    constructor() {
        this.isRunning = false;
        this.score = 0;
        this.speedIncreaseInterval = 10; // Increase speed every 10 points
        this.speedIncreaseAmount = 0.01;
        
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
    }
    
    setupScene() {
        // Performance monitoring (uncomment if needed)
        // this.stats = new Stats();
        // document.body.appendChild(this.stats.dom);
        
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
        document.getElementById('game-container').prepend(this.renderer.domElement);
        
        // Add visually interesting ground
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
        
        // Add lighting
        const ambientLight = new THREE.AmbientLight(0x333333);
        this.scene.add(ambientLight);
        
        const mainLight = new THREE.DirectionalLight(0xffffff, 1);
        mainLight.position.set(10, 10, 10);
        this.scene.add(mainLight);
        
        // Add some particles for a more immersive scene
        this.addParticles();
        
        // Responsive canvas
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.renderer.setPixelRatio(window.devicePixelRatio);
        });
    }
    
    addParticles() {
        // Add floating particles for atmosphere
        const particlesGeometry = new THREE.BufferGeometry();
        const particleCount = 200;
        const posArray = new Float32Array(particleCount * 3);
        
        for(let i = 0; i < particleCount * 3; i++) {
            // Random positions in a defined space around the player
            posArray[i] = (Math.random() - 0.5) * 10;
            posArray[i+1] = Math.random() * 5;
            posArray[i+2] = (Math.random() - 0.5) * 40 - 15; // Mostly ahead of player
            i += 2;
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
    }
    
    addEnvironmentObjects() {
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
    }
    
    setupControls() {
        // Touch/click to jump or start game
        window.addEventListener('mousedown', (e) => {
            if (!this.isRunning && document.getElementById('start-screen').classList.contains('overlay') && 
                !document.getElementById('start-screen').classList.contains('hidden')) {
                this.startGame();
            } else {
                this.handleTap();
            }
        });
        
        window.addEventListener('touchstart', (e) => {
            if (!this.isRunning && document.getElementById('start-screen').classList.contains('overlay') && 
                !document.getElementById('start-screen').classList.contains('hidden')) {
                this.startGame();
            } else {
                this.handleTap();
            }
        });
        
        // Start game button (still needed for explicit button clicks)
        document.getElementById('start-button').addEventListener('click', () => this.startGame());
        
        // Restart game button
        document.getElementById('restart-button').addEventListener('click', () => this.restartGame());
        
        // Add keyboard controls (spacebar to jump or start game)
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                if (!this.isRunning && document.getElementById('start-screen').classList.contains('overlay') && 
                    !document.getElementById('start-screen').classList.contains('hidden')) {
                    this.startGame();
                } else {
                    this.handleTap();
                }
            }
        });
    }
    
    handleTap() {
        if (!this.isRunning) return;
        
        // Attempt to jump
        const jumped = this.player.jump();
        
        // If successfully jumped, create a trail
        if (jumped) {
            this.trailSystem.createTrail(this.player.position);
        }
    }
    
    startGame() {
        document.getElementById('start-screen').classList.add('hidden');
        this.isRunning = true;
        
        // Add a short countdown before starting
        const countdownEl = document.createElement('div');
        countdownEl.className = 'countdown';
        countdownEl.textContent = '3';
        document.getElementById('ui-layer').appendChild(countdownEl);
        
        let count = 3;
        const countdown = setInterval(() => {
            count--;
            if (count > 0) {
                countdownEl.textContent = count;
            } else {
                clearInterval(countdown);
                document.getElementById('ui-layer').removeChild(countdownEl);
            }
        }, 1000);
    }
    
    gameOver() {
        this.isRunning = false;
        document.getElementById('final-score').textContent = Math.floor(this.score);
        document.getElementById('game-over').classList.remove('hidden');
    }
    
    restartGame() {
        document.getElementById('game-over').classList.add('hidden');
        
        // Reset game objects
        this.player.reset();
        this.obstacleManager.reset();
        this.trailSystem.reset();
        
        // Reset score
        this.score = 0;
        updateScoreDisplay(this.score);
        
        // Start game
        this.isRunning = true;
    }
    
    update() {
        if (!this.isRunning) return;
        
        // Update game objects
        this.player.update();
        this.obstacleManager.update();
        this.trailSystem.update();
        
        // Animate particles
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
        
        // Add subtle camera movements for more dynamic feel
        this.updateCamera();
        
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
        
        // Update Stats if enabled
        // if (this.stats) this.stats.update();
    }
    
    updateCamera() {
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
    }
    
    playCollisionEffect(position) {
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
    }
    
    playSpeedUpEffect() {
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
    }
    
    spawnCollectible() {
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
    }
    
    collectOrb(collectible) {
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
    }
    
    showScorePopup(position, text) {
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
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        this.update();
        
        // Animate background color very subtly
        if (this.scene.background) {
            const time = Date.now() * 0.0001;
            const hue = 0.6 + Math.sin(time) * 0.05; // Blue to purple range
            this.scene.background.setHSL(hue, 0.6, 0.1);
            if (this.scene.fog) {
                this.scene.fog.color.setHSL(hue, 0.6, 0.1);
            }
        }
        
        this.renderer.render(this.scene, this.camera);
    }
}