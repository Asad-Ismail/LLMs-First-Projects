/**
 * Obstacle management for Tap Dash
 */
class ObstacleManager {
    constructor(scene) {
        this.scene = scene;
        this.obstacles = [];
        this.obstacleSpeed = 0.1;
        this.spawnDistance = 30;
        this.spawnInterval = 60; // frames
        this.frameCount = 0;
        this.minGap = 2;
        this.maxGap = 5;
    }
    
    spawnObstacle() {
        const width = 1 + Math.random();
        const height = 0.5 + Math.random() * 1.5;
        
        const geometry = new THREE.BoxGeometry(width, height, 1);
        const material = new THREE.MeshBasicMaterial({ color: 0xff5555 });
        const obstacle = new THREE.Mesh(geometry, material);
        
        // Position at spawn distance
        obstacle.position.set(0, height / 2, -this.spawnDistance);
        
        // Add to scene and obstacles array
        this.scene.add(obstacle);
        this.obstacles.push({
            mesh: obstacle,
            size: { x: width, y: height, z: 1 }
        });
    }
    
    update() {
        // Spawn new obstacles at interval
        this.frameCount++;
        if (this.frameCount >= this.spawnInterval) {
            this.spawnObstacle();
            this.frameCount = 0;
            
            // Randomize next spawn interval
            this.spawnInterval = Math.floor(Math.random() * (this.maxGap - this.minGap) + this.minGap) * 60;
        }
        
        // Move obstacles
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.obstacles[i];
            obstacle.mesh.position.z += this.obstacleSpeed;
            
            // Remove obstacles that have passed the player
            if (obstacle.mesh.position.z > 5) {
                this.scene.remove(obstacle.mesh);
                this.obstacles.splice(i, 1);
            }
        }
    }
    
    // Get obstacle positions for collision detection
    getObstacles() {
        return this.obstacles.map(obstacle => ({
            position: obstacle.mesh.position,
            size: obstacle.size
        }));
    }
    
    increaseSpeed(amount) {
        this.obstacleSpeed += amount;
    }
    
    reset() {
        // Remove all obstacles
        for (const obstacle of this.obstacles) {
            this.scene.remove(obstacle.mesh);
        }
        this.obstacles = [];
        this.obstacleSpeed = 0.1;
        this.frameCount = 0;
    }
}