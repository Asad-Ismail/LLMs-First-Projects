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
        try {
            // MODIFIED: Generate more vibrant trail colors
            const hue = Math.random(); // Full spectrum of colors
            const saturation = 0.9; // More saturated
            const lightness = 0.6; // Brighter
            const trailColor = new THREE.Color().setHSL(hue, saturation, lightness);
            
            // Create a more interesting trail effect with dynamic shapes
            // MODIFIED: Larger, more dramatic trail shapes
            const shape = new THREE.Shape();
            shape.moveTo(-0.4, 0);
            shape.quadraticCurveTo(-0.3, 0.4, 0, 0.7);
            shape.quadraticCurveTo(0.3, 0.4, 0.4, 0);
            shape.quadraticCurveTo(0.3, -0.4, 0, -0.7);
            shape.quadraticCurveTo(-0.3, -0.4, -0.4, 0);
            
            const geometry = new THREE.ExtrudeGeometry(shape, {
                steps: 1,
                depth: 1.2, // Deeper trails
                bevelEnabled: true,
                bevelThickness: 0.1,
                bevelSize: 0.1,
                bevelSegments: 3
            });
            
            // Create a more vibrant glowing material
            const material = new THREE.MeshPhongMaterial({ 
                color: trailColor,
                transparent: true,
                opacity: 0.85, // More opaque
                emissive: trailColor,
                emissiveIntensity: 0.8, // More glow
                shininess: 100,
                side: THREE.DoubleSide
            });
            
            const trail = new THREE.Mesh(geometry, material);
            
            // Position and rotate to face forward
            // MODIFIED: Better trail positioning
            trail.position.set(
                playerPosition.x,
                playerPosition.y - 0.1, // Slightly lower to show more clearly
                playerPosition.z - 0.2 // Closer behind player
            );
            trail.rotation.y = Math.PI / 2;
            
            // Random rotation for variety
            trail.rotation.z = Math.random() * Math.PI * 2;
            
            // MODIFIED: Add a stronger point light inside the trail
            const trailLight = new THREE.PointLight(trailColor, 1.2, 3);
            trailLight.position.copy(trail.position);
            this.scene.add(trailLight);
            
            // Add to scene and trails array
            this.scene.add(trail);
            this.trails.push({
                mesh: trail,
                light: trailLight,
                size: { x: 0.7, y: 0.7, z: 1.0 }, // Slightly larger collision size
                creationTime: Date.now()
            });
            
            // MODIFIED: Add particle burst for additional visual effect
            this.addTrailParticles(trail.position, trailColor);
            
            // If we have too many trails, remove the oldest ones
            if (this.trails.length > this.maxTrails) {
                const oldestTrail = this.trails.shift();
                this.scene.remove(oldestTrail.mesh);
                this.scene.remove(oldestTrail.light);
            }
        } catch (error) {
            console.error('Error creating trail:', error);
        }
    }

    addTrailParticles(position, color) {
        try {
            // Create a burst of particles for each trail
            const particleCount = 10;
            
            for (let i = 0; i < particleCount; i++) {
                const particle = new THREE.Mesh(
                    new THREE.SphereGeometry(0.05 + Math.random() * 0.05, 8, 8),
                    new THREE.MeshBasicMaterial({
                        color: color,
                        transparent: true,
                        opacity: 0.8,
                        emissive: color,
                        emissiveIntensity: 0.5
                    })
                );
                
                // Position at trail location
                particle.position.copy(position);
                
                // Add random velocity
                const velocity = new THREE.Vector3(
                    (Math.random() - 0.5) * 0.05,
                    Math.random() * 0.05,
                    (Math.random() - 0.5) * 0.05
                );
                
                // Add to scene
                this.scene.add(particle);
                
                // Animate and remove after short period
                let lifetime = 0;
                const maxLife = 30;
                
                const animateParticle = () => {
                    lifetime++;
                    
                    if (lifetime < maxLife) {
                        // Move based on velocity
                        particle.position.x += velocity.x;
                        particle.position.y += velocity.y;
                        particle.position.z += velocity.z;
                        
                        // Add slight gravity effect
                        velocity.y -= 0.001;
                        
                        // Fade out
                        particle.material.opacity = 0.8 * (1 - lifetime / maxLife);
                        
                        requestAnimationFrame(animateParticle);
                    } else {
                        this.scene.remove(particle);
                    }
                };
                
                animateParticle();
            }
        } catch (error) {
            console.error('Error adding trail particles:', error);
        }
    }
    
    update() {
        try {
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
        } catch (error) {
            console.error('Error updating trails:', error);
        }
    }
    
    // Get trail positions for collision detection
    getTrails() {
        try {
            return this.trails.map(trail => ({
                position: trail.mesh.position,
                size: trail.size
            }));
        } catch (error) {
            console.error('Error getting trails:', error);
            return [];
        }
    }
    
    increaseSpeed(amount) {
        this.trailSpeed += amount;
    }
    
    reset() {
        try {
            // Remove all trails
            for (const trail of this.trails) {
                this.scene.remove(trail.mesh);
                if (trail.light) this.scene.remove(trail.light);
            }
            this.trails = [];
        } catch (error) {
            console.error('Error resetting trails:', error);
        }
    }
}