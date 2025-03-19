/**
 * Trail system for Tap Dash
 */
class TrailSystem {
    constructor(scene) {
        this.scene = scene;
        this.trails = [];
        this.trailSpeed = 0.1; // Same as obstacle speed
        this.maxTrails = 20; // Maximum number of trails to keep
    }
    
    createTrail(playerPosition) {
        // Create a colorful trail at the player's position
        const geometry = new THREE.BoxGeometry(0.5, 0.1, 1);
        const material = new THREE.MeshBasicMaterial({ 
            color: getRandomColor(),
            transparent: true,
            opacity: 0.7
        });
        
        const trail = new THREE.Mesh(geometry, material);
        
        // Position at player's current position
        trail.position.set(
            playerPosition.x,
            playerPosition.y,
            playerPosition.z - 1 // Slightly behind player
        );
        
        // Add to scene and trails array
        this.scene.add(trail);
        this.trails.push({
            mesh: trail,
            size: { x: 0.5, y: 0.1, z: 1 }
        });
        
        // If we have too many trails, remove the oldest ones
        if (this.trails.length > this.maxTrails) {
            const oldestTrail = this.trails.shift();
            this.scene.remove(oldestTrail.mesh);
        }
    }
    
    update() {
        // Move trails
        for (let i = this.trails.length - 1; i >= 0; i--) {
            const trail = this.trails[i];
            trail.mesh.position.z += this.trailSpeed;
            
            // Remove trails that have passed the player
            if (trail.mesh.position.z > 5) {
                this.scene.remove(trail.mesh);
                this.trails.splice(i, 1);
            }
        }
    }
    
    // Get trail positions for collision detection
    getTrails() {
        return this.trails.map(trail => ({
            position: trail.mesh.position,
            size: trail.size
        }));
    }
    
    increaseSpeed(amount) {
        this.trailSpeed += amount;
    }
    
    reset() {
        // Remove all trails
        for (const trail of this.trails) {
            this.scene.remove(trail.mesh);
        }
        this.trails = [];
    }
}