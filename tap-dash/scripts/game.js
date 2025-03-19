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
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x111111);
        
        // Create camera
        this.camera = new THREE.PerspectiveCamera(
            75, window.innerWidth / window.innerHeight, 0.1, 1000
        );
        this.camera.position.set(0, 2, 5);
        this.camera.lookAt(0, 0, -10);
        
        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.getElementById('game-container').prepend(this.renderer.domElement);
        
        // Add ground
        const groundGeometry = new THREE.PlaneGeometry(10, 100);
        const groundMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x333333,
            side: THREE.DoubleSide
        });
        this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
        this.ground.rotation.x = Math.PI / 2;
        this.ground.position.set(0, 0, -25); // Center the ground
        this.scene.add(this.ground);
        
        // Add ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
        
        // Responsive canvas
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }
    
    setupControls() {
        // Touch/click to jump
        window.addEventListener('mousedown', () => this.handleTap());
        window.addEventListener('touchstart', () => this.handleTap());
        
        // Start game button
        document.getElementById('start-button').addEventListener('click', () => this.startGame());
        
        // Restart game button
        document.getElementById('restart-button').addEventListener('click', () => this.restartGame());
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
    }
    
    gameOver() {
        this.isRunning = false;
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
        
        // Check for collisions with obstacles
        const obstacles = this.obstacleManager.getObstacles();
        for (const obstacle of obstacles) {
            if (checkCollision(
                this.player.position, obstacle.position,
                this.player.size, obstacle.size
            )) {
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
            }
        }
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        this.update();
        this.renderer.render(this.scene, this.camera);
    }
}