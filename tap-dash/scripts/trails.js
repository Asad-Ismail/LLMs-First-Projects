/**
 * Trail system for Tap Dash
 */
class TrailSystem {
    constructor(scene) {
        this.scene = scene;
        this.trails = [];
        this.trailSpeed = 0.1; // Same as obstacle speed
        this.maxTrails = 30; // MODIFIED: Increased from 20 to 30 for more persistent trails
        
        // ADDED: Create a continuous trail effect
        this.continuousTrail = false;
        this.trailInterval = null;
        this.lastTrailTime = 0;
        this.trailDelay = 150; // ms between trail segments during continuous trail
        
        // Create a color palette for more cohesive visuals
        this.colorPalette = [
            {h: 0.65, s: 0.9, l: 0.6},  // Blue
            {h: 0.55, s: 0.9, l: 0.6},  // Cyan
            {h: 0.3, s: 0.9, l: 0.6},   // Green
            {h: 0.15, s: 0.9, l: 0.7},  // Yellow
            {h: 0.05, s: 0.9, l: 0.6},  // Orange
            {h: 0.95, s: 0.9, l: 0.6},  // Magenta
            {h: 0.75, s: 0.9, l: 0.6}   // Purple
        ];
        
        // Keep track of last color to avoid repeats
        this.lastColorIndex = -1;
        
        // ADDED: Flag to ensure trails only apply to player
        this.trailsEnabled = true;
        this.playerTrailsOnly = true; // NEW: Set to true to only show trails for player
    }
    
    // ADDED: Method to enable/disable trails
    enableTrails(enabled) {
        this.trailsEnabled = enabled;
    }
    
    // ADDED: Method to set whether trails should only be for the player
    setPlayerTrailsOnly(playerOnly) {
        this.playerTrailsOnly = playerOnly;
    }
    
    createTrail(position, objectType = 'player') {
        // If trails are disabled or we only want player trails and this isn't a player, return null
        if (!this.trailsEnabled || (this.playerTrailsOnly && objectType !== 'player')) {
            return null;
        }
        
        try {
            // Store the last trail time for continuous trail effect
            this.lastTrailTime = Date.now();
            
            // MODIFIED: More vibrant trail colors with limited palette for visual consistency
            // Pick a color from the palette (avoid repeating the last color)
            let colorIndex;
            do {
                colorIndex = Math.floor(Math.random() * this.colorPalette.length);
            } while (colorIndex === this.lastColorIndex && this.colorPalette.length > 1);
            
            this.lastColorIndex = colorIndex;
            const colorChoice = this.colorPalette[colorIndex];
            const trailColor = new THREE.Color().setHSL(colorChoice.h, colorChoice.s, colorChoice.l);
            
            // MODIFIED: Create larger, more dramatic trail shapes that are more visible
            const shape = new THREE.Shape();
            shape.moveTo(-0.6, 0);
            shape.quadraticCurveTo(-0.5, 0.6, 0, 1.0);
            shape.quadraticCurveTo(0.5, 0.6, 0.6, 0);
            shape.quadraticCurveTo(0.5, -0.6, 0, -1.0);
            shape.quadraticCurveTo(-0.5, -0.6, -0.6, 0);
            
            const geometry = new THREE.ExtrudeGeometry(shape, {
                steps: 2,
                depth: 1.5, // MODIFIED: Increased depth for more substantial trails
                bevelEnabled: true,
                bevelThickness: 0.2,
                bevelSize: 0.2,
                bevelSegments: 5
            });
            
            // MODIFIED: Create an even more vibrant glowing material
            const material = new THREE.MeshPhongMaterial({ 
                color: trailColor,
                transparent: true,
                opacity: 0.9, // MODIFIED: More opaque for better visibility
                emissive: trailColor,
                emissiveIntensity: 1.2, // MODIFIED: Increased glow intensity
                shininess: 100,
                side: THREE.DoubleSide
            });
            
            const trail = new THREE.Mesh(geometry, material);
            
            // MODIFIED: Better trail positioning relative to player
            trail.position.set(
                position.x,
                position.y - 0.2, // Slightly lower to show more clearly
                position.z - 0.1  // MODIFIED: Closer behind player
            );
            trail.rotation.y = Math.PI / 2;
            
            // Random rotation for variety
            trail.rotation.z = Math.random() * Math.PI * 2;
            
            // MODIFIED: Add a stronger point light inside the trail
            const trailLight = new THREE.PointLight(trailColor, 1.5, 4); // Brighter, longer range
            trailLight.position.copy(trail.position);
            this.scene.add(trailLight);
            
            // Add to scene and trails array
            this.scene.add(trail);
            this.trails.push({
                mesh: trail,
                light: trailLight,
                size: { x: 0.8, y: 0.8, z: 1.2 }, // MODIFIED: Slightly larger for better visibility
                creationTime: Date.now(),
                color: trailColor // Store color for particles
            });
            
            // MODIFIED: Add more particle burst for additional visual effect
            this.addTrailParticles(trail.position, trailColor, 20); // Increased from 10 to 20 particles
            
            // If we have too many trails, remove the oldest ones
            if (this.trails.length > this.maxTrails) {
                const oldestTrail = this.trails.shift();
                this.scene.remove(oldestTrail.mesh);
                this.scene.remove(oldestTrail.light);
            }
            
            return trail; // Return the trail object for any additional processing
        } catch (error) {
            console.error('Error creating trail:', error);
            return null;
        }
    }
    
    // MODIFIED: Enhanced particle effect for more visual impact
    addTrailParticles(position, color, count = 20) {
        try {
            // Create a burst of particles for each trail
            const particleCount = count;
            
            for (let i = 0; i < particleCount; i++) {
                const particle = new THREE.Mesh(
                    new THREE.SphereGeometry(0.08 + Math.random() * 0.08, 8, 8), // MODIFIED: Larger particles
                    new THREE.MeshBasicMaterial({
                        color: color,
                        transparent: true,
                        opacity: 0.9, // MODIFIED: More opaque
                        emissive: color,
                        emissiveIntensity: 0.8 // MODIFIED: More glow
                    })
                );
                
                // Position at trail location with slight randomness
                particle.position.set(
                    position.x + (Math.random() - 0.5) * 0.5,
                    position.y + (Math.random() - 0.5) * 0.5,
                    position.z + (Math.random() - 0.5) * 0.5
                );
                
                // Add random velocity
                const velocity = new THREE.Vector3(
                    (Math.random() - 0.5) * 0.08, // MODIFIED: Faster movement
                    Math.random() * 0.08,
                    (Math.random() - 0.5) * 0.08
                );
                
                // Add to scene
                this.scene.add(particle);
                
                // Animate and remove after short period
                let lifetime = 0;
                const maxLife = 45; // MODIFIED: Longer lifetime
                
                const animateParticle = () => {
                    lifetime++;
                    
                    if (lifetime < maxLife) {
                        // Move based on velocity
                        particle.position.x += velocity.x;
                        particle.position.y += velocity.y;
                        particle.position.z += velocity.z;
                        
                        // Add slight gravity effect
                        velocity.y -= 0.001;
                        
                        // Slow down over time
                        velocity.x *= 0.98;
                        velocity.y *= 0.98;
                        velocity.z *= 0.98;
                        
                        // Fade out
                        particle.material.opacity = 0.9 * (1 - lifetime / maxLife);
                        
                        // Scale down over time
                        particle.scale.multiplyScalar(0.99);
                        
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
    
    // ADDED: Start continuous trail effect when player is in motion
    startContinuousTrail(player) {
        if (this.continuousTrail) return;
        
        this.continuousTrail = true;
        this.trailInterval = setInterval(() => {
            // Only create continuous trail if player is moving
            if ((player.isJumping || Math.abs(player.velocity.x) > 0.05) && 
                Date.now() - this.lastTrailTime > this.trailDelay &&
                !player.frozen) { // Don't create trails when player is frozen
                
                // Create a smaller trail when moving horizontally vs jumping
                const trail = this.createTrail(player.position, 'player');
                
                // Make trail size dependent on movement type
                if (trail && !player.isJumping && Math.abs(player.velocity.x) > 0.05) {
                    // Scale down horizontal movement trails
                    trail.scale.set(0.7, 0.7, 0.7);
                    
                    // Tilt trail in direction of movement for better visual effect
                    trail.rotation.z += Math.sign(player.velocity.x) * 0.3;
                }
            }
        }, this.trailDelay);
    }
    
    stopContinuousTrail() {
        this.continuousTrail = false;
        if (this.trailInterval) {
            clearInterval(this.trailInterval);
            this.trailInterval = null;
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
                
                // MODIFIED: Enhanced visual effects
                const age = (currentTime - trail.creationTime) / 1000;
                
                // MODIFIED: Smoother pulsing effect with variation based on trail index
                const pulseRate = 2 + (i % 3); // Different pulse rates for variety
                const pulseScale = 1 + Math.sin(age * pulseRate) * 0.15;
                trail.mesh.scale.set(
                    trail.mesh.scale.x * pulseScale / trail.mesh.scale.x,
                    trail.mesh.scale.y * pulseScale / trail.mesh.scale.y,
                    trail.mesh.scale.z
                );
                
                // MODIFIED: Slower fade out to keep trails visible longer
                const opacity = Math.max(0, 0.9 - age * 0.08); // MODIFIED: Slower fade
                trail.mesh.material.opacity = opacity;
                
                if (trail.light) {
                    trail.light.intensity = Math.max(0, 1.5 - age * 0.15);
                }
                
                // Add occasional extra particles from trails for more dynamic visuals
                if (Math.random() < 0.01 && age < 3) {
                    this.addTrailParticlesSparse(trail.mesh.position, trail.color);
                }
                
                // MODIFIED: Keep trails visible longer before removing
                if (trail.mesh.position.z > 8 || age > 10) { // MODIFIED: Increased from 5 to 8, and age from 8 to 10
                    this.scene.remove(trail.mesh);
                    if (trail.light) this.scene.remove(trail.light);
                    this.trails.splice(i, 1);
                }
                
                // Slowly rotate for additional visual interest
                trail.mesh.rotation.z += 0.02;
            }
        } catch (error) {
            console.error('Error updating trails:', error);
        }
    }
    
    // ADDED: Occasional sparse particles from existing trails for more dynamic feel
    addTrailParticlesSparse(position, color) {
        try {
            // Create just a few particles from existing trails
            const particleCount = 3 + Math.floor(Math.random() * 4);
            
            for (let i = 0; i < particleCount; i++) {
                const particle = new THREE.Mesh(
                    new THREE.SphereGeometry(0.05 + Math.random() * 0.05, 8, 8),
                    new THREE.MeshBasicMaterial({
                        color: color,
                        transparent: true,
                        opacity: 0.7,
                        emissive: color,
                        emissiveIntensity: 0.5
                    })
                );
                
                // Position near trail
                particle.position.set(
                    position.x + (Math.random() - 0.5) * 0.5,
                    position.y + (Math.random() - 0.5) * 0.5,
                    position.z + (Math.random() - 0.5) * 0.1
                );
                
                // Add slower velocity
                const velocity = new THREE.Vector3(
                    (Math.random() - 0.5) * 0.03,
                    Math.random() * 0.05,
                    (Math.random() - 0.5) * 0.02
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
                        velocity.y -= 0.0005;
                        
                        // Fade out
                        particle.material.opacity = 0.7 * (1 - lifetime / maxLife);
                        
                        requestAnimationFrame(animateParticle);
                    } else {
                        this.scene.remove(particle);
                    }
                };
                
                animateParticle();
            }
        } catch (error) {
            console.error('Error adding sparse trail particles:', error);
        }
    }
    
    // Get trail positions for collision detection
    getTrails() {
        try {
            // Don't return trails for collision detection since they shouldn't be considered as objects
            return [];
            
            // Original code (now commented out):
            // return this.trails.map(trail => ({
            //     position: trail.mesh.position,
            //     size: trail.size
            // }));
        } catch (error) {
            console.error('Error getting trails:', error);
            return [];
        }
    }
    
    increaseSpeed(amount) {
        this.trailSpeed += amount;
        
        // Also adjust trail delay to create appropriate spacing at higher speeds
        const minDelay = 50;
        this.trailDelay = Math.max(minDelay, 150 - amount * 1000);
    }
    
    reset() {
        try {
            // Remove all trails
            for (const trail of this.trails) {
                this.scene.remove(trail.mesh);
                if (trail.light) this.scene.remove(trail.light);
            }
            this.trails = [];
            
            // Stop continuous trail if active
            this.stopContinuousTrail();
            
            // Reset last color
            this.lastColorIndex = -1;
        } catch (error) {
            console.error('Error resetting trails:', error);
        }
    }
}