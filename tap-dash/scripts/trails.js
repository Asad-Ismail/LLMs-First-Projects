/**
 * Trail system for Tap Dash
 */
class TrailSystem {
    constructor(scene) {
        this.scene = scene;
        this.trails = [];
        this.trailSpeed = 0.1; // Same as obstacle speed
        this.maxTrails = 20; // Reduced back to avoid overwhelming graphics
        
        // ADDED: Create a continuous trail effect
        this.continuousTrail = false;
        this.trailInterval = null;
        this.lastTrailTime = 0;
        this.trailDelay = 100; // Slightly faster trail generation for smoother effect
        
        // Create a fire-like color palette
        this.colorPalette = [
            {h: 0.05, s: 0.9, l: 0.6},  // Orange
            {h: 0.08, s: 0.9, l: 0.5},  // Dark orange
            {h: 0.02, s: 0.9, l: 0.6},  // Orange-red
            {h: 0.12, s: 0.9, l: 0.7},  // Yellow-orange
            {h: 0.15, s: 0.8, l: 0.7},  // Yellow
            {h: 0.01, s: 0.9, l: 0.5}   // Red
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
            
            // MODIFIED: Use fire-like colors
            // Pick a color from the palette (avoid repeating the last color)
            let colorIndex;
            do {
                colorIndex = Math.floor(Math.random() * this.colorPalette.length);
            } while (colorIndex === this.lastColorIndex && this.colorPalette.length > 1);
            
            this.lastColorIndex = colorIndex;
            const colorChoice = this.colorPalette[colorIndex];
            const trailColor = new THREE.Color().setHSL(colorChoice.h, colorChoice.s, colorChoice.l);
            
            // MODIFIED: Create a particle-based fire trail instead of solid object
            // We'll create a cluster of particles and add a light
            
            // FIXED: Create a fixed position directly behind the player
            // Clone the position to avoid modifying the original
            const trailPos = new THREE.Vector3().copy(position);
            // Always place the trail behind the player (negative z direction)
            trailPos.z -= 0.2;
            
            // Create a point light at the trail position for glow effect
            const trailLight = new THREE.PointLight(trailColor, 1.5, 3);
            trailLight.position.copy(trailPos);
            this.scene.add(trailLight);
            
            // Create a trail object to track the position (but no visible mesh)
            const trailPosition = new THREE.Vector3().copy(trailPos);
            
            // Add to trails array - instead of a mesh, we'll track the light and position
            this.trails.push({
                light: trailLight,
                position: trailPosition,
                size: { x: 0.6, y: 0.6, z: 0.8 },
                creationTime: Date.now(),
                color: trailColor,
                lifetime: 0,
                maxLifetime: 50 + Math.floor(Math.random() * 20)
            });
            
            // MODIFIED: Create a dense burst of fire particles
            this.addFireParticles(trailPosition, trailColor, 25); // Increased particle count
            
            // If we have too many trails, remove the oldest ones
            if (this.trails.length > this.maxTrails) {
                const oldestTrail = this.trails.shift();
                this.scene.remove(oldestTrail.light);
            }
            
            return trailLight; // Return the light object for any additional processing
        } catch (error) {
            console.error('Error creating trail:', error);
            return null;
        }
    }
    
    // MODIFIED: Create fire particles instead of regular particles
    addFireParticles(position, baseColor, count = 25) {
        try {
            // Create a burst of fire-like particles
            for (let i = 0; i < count; i++) {
                // Vary the color slightly for more realistic fire effect
                const hueVariation = (Math.random() - 0.5) * 0.1;
                const color = new THREE.Color().setHSL(
                    THREE.MathUtils.clamp(baseColor.getHSL().h + hueVariation, 0, 0.15), // Keep in fire color range
                    0.7 + Math.random() * 0.3, // High saturation
                    0.4 + Math.random() * 0.6  // Variable brightness
                );
                
                // Create various sized particles
                const size = 0.05 + Math.random() * 0.15; // Larger particles for more visible fire
                const particle = new THREE.Mesh(
                    new THREE.SphereGeometry(size, 8, 8),
                    new THREE.MeshBasicMaterial({
                        color: color,
                        transparent: true,
                        opacity: 0.7 + Math.random() * 0.3,
                        emissive: color,
                        emissiveIntensity: 0.5
                    })
                );
                
                // Position with variety around trail point
                const spread = 0.15; // Controls how spread out the fire is
                particle.position.set(
                    position.x + (Math.random() - 0.5) * spread,
                    position.y + (Math.random() - 0.5) * spread,
                    position.z + (Math.random() - 0.5) * spread * 0.5 // Less spread in z direction
                );
                
                // Add random velocity vectors - fire tends to rise and move randomly
                const velocity = {
                    x: (Math.random() - 0.5) * 0.02,
                    y: 0.005 + Math.random() * 0.015, // Upward bias for fire
                    z: (Math.random() - 0.5) * 0.02
                };
                
                // Add to scene
                this.scene.add(particle);
                
                // Animate and remove after time period
                let lifetime = 0;
                const maxLife = 30 + Math.floor(Math.random() * 20); // Longer lifetime for fire effect
                
                const animateFireParticle = () => {
                    lifetime++;
                    
                    if (lifetime < maxLife) {
                        // Move based on velocity
                        particle.position.x += velocity.x;
                        particle.position.y += velocity.y;
                        particle.position.z += velocity.z;
                        
                        // Slow down over time but keep rising
                        velocity.x *= 0.97;
                        velocity.y = Math.max(0.001, velocity.y * 0.98); // Maintain some upward movement
                        velocity.z *= 0.97;
                        
                        // Fade out
                        particle.material.opacity = 0.8 * (1 - lifetime / maxLife);
                        
                        // Fire particles should get smaller as they rise
                        const scaleRate = 0.97 + (Math.random() * 0.02);
                        particle.scale.multiplyScalar(scaleRate);
                        
                        // Fire gets more yellow/white as it ages (like real fire)
                        if (lifetime > maxLife * 0.6) {
                            const currentHsl = {};
                            particle.material.color.getHSL(currentHsl);
                            
                            particle.material.color.setHSL(
                                Math.min(0.15, currentHsl.h + 0.001), // Shift toward yellow
                                Math.max(0.5, currentHsl.s - 0.01),   // Reduce saturation
                                Math.min(0.9, currentHsl.l + 0.01)    // Increase brightness
                            );
                        }
                        
                        requestAnimationFrame(animateFireParticle);
                    } else {
                        this.scene.remove(particle);
                    }
                };
                
                animateFireParticle();
            }
            
            // Add a few ember particles that shoot up more dramatically
            for (let i = 0; i < 3; i++) {
                const ember = new THREE.Mesh(
                    new THREE.SphereGeometry(0.03 + Math.random() * 0.02, 6, 6),
                    new THREE.MeshBasicMaterial({
                        color: new THREE.Color().setHSL(0.1, 0.9, 0.8), // Bright yellow-orange
                        transparent: true,
                        opacity: 0.9
                    })
                );
                
                // Position at the base of the fire
                ember.position.copy(position);
                ember.position.y += 0.05;
                
                // Add to scene
                this.scene.add(ember);
                
                // More dramatic upward motion
                const emberVelocity = {
                    x: (Math.random() - 0.5) * 0.04,
                    y: 0.02 + Math.random() * 0.03, // Stronger upward motion
                    z: (Math.random() - 0.5) * 0.04
                };
                
                // Animate ember
                let emberLife = 0;
                const emberMaxLife = 40 + Math.floor(Math.random() * 20);
                
                const animateEmber = () => {
                    emberLife++;
                    
                    if (emberLife < emberMaxLife) {
                        // Move based on velocity
                        ember.position.x += emberVelocity.x;
                        ember.position.y += emberVelocity.y;
                        ember.position.z += emberVelocity.z;
                        
                        // Embers slowly lose upward momentum
                        emberVelocity.y = Math.max(0, emberVelocity.y - 0.0005);
                        
                        // Add some random motion
                        emberVelocity.x += (Math.random() - 0.5) * 0.002;
                        emberVelocity.z += (Math.random() - 0.5) * 0.002;
                        
                        // Fade out
                        ember.material.opacity = 0.9 * (1 - emberLife / emberMaxLife);
                        
                        // Embers get smaller
                        ember.scale.multiplyScalar(0.98);
                        
                        requestAnimationFrame(animateEmber);
                    } else {
                        this.scene.remove(ember);
                    }
                };
                
                animateEmber();
            }
        } catch (error) {
            console.error('Error adding fire particles:', error);
        }
    }
    
    // ADDED: Start continuous trail effect when player is in motion
    startContinuousTrail(player) {
        if (this.continuousTrail) return;
        
        this.continuousTrail = true;
        this.trailInterval = setInterval(() => {
            // FIXED: Check if player is frozen before creating trails
            if (player.frozen) return;
            
            // Only create continuous trail if player is moving or the game is actually running
            if ((player.isJumping || Math.abs(player.velocity.x) > 0.05) && 
                Date.now() - this.lastTrailTime > this.trailDelay) {
                
                // IMPROVED: Add a slight position offset for the trail creation
                const trailPosition = {
                    x: player.position.x,
                    y: player.position.y,
                    z: player.position.z
                };
                
                // Create a smaller trail when moving horizontally vs jumping
                const trail = this.createTrail(trailPosition, 'player');
                
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
            // For each trail segment, update position and fade out over time
            for (let i = this.trails.length - 1; i >= 0; i--) {
                const trail = this.trails[i];
                
                // Update lifetime
                trail.lifetime++;
                
                // Gradually reduce light intensity as trail ages
                if (trail.light) {
                    const fadeRatio = 1 - (trail.lifetime / trail.maxLifetime);
                    trail.light.intensity = 1.5 * fadeRatio;
                }
                
                // Move trail backward with game speed
                if (trail.position) {
                    // MODIFIED: Smoother movement for trailing effects
                    trail.position.z += this.trailSpeed;
                    
                    // Update light position to match
                    if (trail.light) {
                        trail.light.position.copy(trail.position);
                    }
                }
                
                // Remove if too old or too far back
                if (trail.lifetime > trail.maxLifetime || trail.position.z > 5) {
                    if (trail.light) this.scene.remove(trail.light);
                    this.trails.splice(i, 1);
                }
            }
        } catch (error) {
            console.error('Error updating trails:', error);
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
                if (trail.light) {
                    this.scene.remove(trail.light);
                }
            }
            this.trails = [];
            
            // Stop continuous trail if active
            this.stopContinuousTrail();
            
            // Reset last color
            this.lastColorIndex = -1;
            
            // ADDED: Find and remove any remaining fire particles
            const objectsToRemove = [];
            this.scene.traverse(object => {
                // Find small spheres with emissive materials (likely our fire particles)
                if (object.geometry && 
                    object.geometry.type === 'SphereGeometry' && 
                    object.geometry.parameters.radius < 0.2 &&
                    object.material &&
                    (object.material.emissive || object.material.transparent)) {
                    objectsToRemove.push(object);
                }
            });
            
            // Remove all identified particles
            for (const object of objectsToRemove) {
                this.scene.remove(object);
            }
            
            console.log('Trail system reset, removed all trails and particles');
        } catch (error) {
            console.error('Error resetting trails:', error);
        }
    }
}