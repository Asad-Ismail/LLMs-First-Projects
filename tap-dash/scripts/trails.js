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
        // Create a more interesting trail effect
        const trailColor = getRandomColor();
        
        // Create a glowing trail with custom shape
        const shape = new THREE.Shape();
        shape.moveTo(-0.3, 0);
        shape.quadraticCurveTo(-0.2, 0.3, 0, 0.5);
        shape.quadraticCurveTo(0.2, 0.3, 0.3, 0);
        shape.quadraticCurveTo(0.2, -0.3, 0, -0.5);
        shape.quadraticCurveTo(-0.2, -0.3, -0.3, 0);
        
        const geometry = new THREE.ExtrudeGeometry(shape, {
            steps: 1,
            depth: 0.8,
            bevelEnabled: false
        });
        
        // Create a glowing material
        const material = new THREE.MeshPhongMaterial({ 
            color: trailColor,
            transparent: true,
            opacity: 0.8,
            emissive: new THREE.Color(trailColor),
            emissiveIntensity: 0.5,
            side: THREE.DoubleSide
        });
        
        const trail = new THREE.Mesh(geometry, material);
        
        // Position and rotate to face forward
        trail.position.set(
            playerPosition.x,
            playerPosition.y,
            playerPosition.z - 0.5 // Slightly behind player
        );
        trail.rotation.y = Math.PI / 2;
        
        // Random rotation for variety
        trail.rotation.z = Math.random() * Math.PI * 2;
        
        // Add a small point light inside the trail
        const trailLight = new THREE.PointLight(trailColor, 0.5, 2);
        trailLight.position.copy(trail.position);
        this.scene.add(trailLight);
        
        // Add to scene and trails array
        this.scene.add(trail);
        this.trails.push({
            mesh: trail,
            light: trailLight,
            size: { x: 0.6, y: 0.6, z: 0.8 },
            creationTime: Date.now()
        });
        
        // If we have too many trails, remove the oldest ones
        if (this.trails.length > this.maxTrails) {
            const oldestTrail = this.trails.shift();
            this.scene.remove(oldestTrail.mesh);
            this.scene.remove(oldestTrail.light);
        }
    }
    
    update() {
        const currentTime = Date.now();
        // Move trails and apply effects
        for (let i = this.trails.length - 1; i >= 0; i--) {
            const trail = this.trails[i];
            trail.mesh.position.z += this.trailSpeed;
            
            // Also move the light
            if (trail.light) {
                trail.light.position.copy(trail.mesh.position);
            }
            
            // Add pulsing effect to trails
            const age = (currentTime - trail.creationTime) / 1000;
            const pulseScale = 1 + Math.sin(age * 3) * 0.1;
            trail.mesh.scale.set(pulseScale, pulseScale, 1);
            
            // Fade out older trails
            const opacity = Math.max(0, 0.8 - age * 0.1);
            trail.mesh.material.opacity = opacity;
            
            if (trail.light) {
                trail.light.intensity = Math.max(0, 0.5 - age * 0.1);
            }
            
            // Remove trails that have passed the player or are too old
            if (trail.mesh.position.z > 5 || age > 8) {
                this.scene.remove(trail.mesh);
                if (trail.light) this.scene.remove(trail.light);
                this.trails.splice(i, 1);
            }
            
            // Slowly rotate for additional visual interest
            trail.mesh.rotation.z += 0.01;
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