/**
 * Trail system for Tap Dash - Optimized Version
 * Using BufferGeometry and Points for better performance
 */
class TrailSystem {
    constructor(scene) {
        this.scene = scene;
        this.trails = [];
        this.trailSpeed = 0.1; // Same as obstacle speed
        this.maxTrails = 1; // Reduced to improve performance
        
        // Trail effect configuration
        this.continuousTrail = false;
        this.trailInterval = null;
        this.lastTrailTime = 0;
        this.trailDelay = 150; // Increased delay from 100ms to 150ms for fewer particles
        
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
        
        // Flags for trail behavior
        this.trailsEnabled = true;
        this.playerTrailsOnly = true;
        
        // Create particle system for all fire particles
        this.initParticleSystem();
        
        // Trail lights (separate from particles)
        this.trailLights = [];
    }
    
    initParticleSystem() {
        // Max number of particles active at any time
        this.maxParticles = 60; // Reduced from 100 to 60
        
        // Arrays to hold particle data
        this.positions = new Float32Array(this.maxParticles * 3);
        this.colors = new Float32Array(this.maxParticles * 3);
        this.sizes = new Float32Array(this.maxParticles);
        
        // Array to track particle state
        this.particles = [];
        for (let i = 0; i < this.maxParticles; i++) {
            this.particles.push({
                active: false,
                position: new THREE.Vector3(),
                velocity: new THREE.Vector3(),
                color: new THREE.Color(),
                size: 0,
                lifetime: 0,
                maxLifetime: 0,
                index: i // Index in the arrays
            });
        }
        
        // Create geometry with buffers
        this.geometry = new THREE.BufferGeometry();
        this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
        this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
        this.geometry.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1));
        
        // Create a particle texture (simple circle)
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const context = canvas.getContext('2d');
        
        // Draw a circular gradient
        const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
        gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(0.7, 'rgba(255, 220, 180, 0.5)');
        gradient.addColorStop(1.0, 'rgba(255, 180, 0, 0.0)');
        
        context.fillStyle = gradient;
        context.fillRect(0, 0, 64, 64);
        
        const texture = new THREE.CanvasTexture(canvas);
        
        // Create the material for particles
        this.material = new THREE.PointsMaterial({
            size: 0.3,
            map: texture,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            transparent: true,
            vertexColors: true
        });
        
        // Create the particle system and add to scene
        this.particleSystem = new THREE.Points(this.geometry, this.material);
        this.scene.add(this.particleSystem);
        
        // Initialize with all particles inactive
        this.activeParticleCount = 0;
    }
    
    // Find an inactive particle to use, or reuse the oldest one if all are active
    getNextParticle() {
        // First, try to find an inactive particle
        for (let i = 0; i < this.particles.length; i++) {
            if (!this.particles[i].active) {
                return this.particles[i];
            }
        }
        
        // If all particles are active, reuse the oldest one
        let oldestIndex = 0;
        let oldestLifetime = 0;
        
        for (let i = 0; i < this.particles.length; i++) {
            if (this.particles[i].lifetime > oldestLifetime) {
                oldestLifetime = this.particles[i].lifetime;
                oldestIndex = i;
            }
        }
        
        return this.particles[oldestIndex];
    }
    
    // Set values for a single particle in the buffer arrays
    updateParticleBuffers(particle) {
        const i = particle.index;
        
        // Update position
        this.positions[i * 3] = particle.position.x;
        this.positions[i * 3 + 1] = particle.position.y;
        this.positions[i * 3 + 2] = particle.position.z;
        
        // Update color
        this.colors[i * 3] = particle.color.r;
        this.colors[i * 3 + 1] = particle.color.g;
        this.colors[i * 3 + 2] = particle.color.b;
        
        // Update size
        this.sizes[i] = particle.size;
    }
    
    // ADDED: Method to enable/disable trails
    enableTrails(enabled) {
        this.trailsEnabled = enabled;
    }
    
    // ADDED: Method to set whether trails should only be for the player
    setPlayerTrailsOnly(playerOnly) {
        this.playerTrailsOnly = playerOnly;
    }
    
    createTrail(position, objectType = 'player', customColor = null, particleCount = 3) {
        try {            
            // Only create trails if the feature is enabled
            if (!this.trailsEnabled) return null;
            
            // For obstacle trails, only create them if we're showing all trails
            if (objectType !== 'player' && this.playerTrailsOnly) return null;
            
            // Calculate trail color
            let trailColor;
            if (customColor) {
                trailColor = customColor;
            } else {
                // Use random color from palette
                let colorIndex;
                do {
                    colorIndex = Math.floor(Math.random() * this.colorPalette.length);
                } while (colorIndex === this.lastColorIndex);
                
                this.lastColorIndex = colorIndex;
                const colorInfo = this.colorPalette[colorIndex];
                trailColor = new THREE.Color().setHSL(colorInfo.h, colorInfo.s, colorInfo.l);
            }
            
            // Store the last trail time for continuous trail effect
            this.lastTrailTime = Date.now();
            
            // Create a fixed position directly behind the player
            const trailPos = new THREE.Vector3().copy(position);
            trailPos.z -= 0.2;
            
            // Create a point light at the trail position for glow effect
            const trailLight = new THREE.PointLight(trailColor, 1.5, 3);
            trailLight.position.copy(trailPos);
            this.scene.add(trailLight);
            
            // Create a trail object to track the position (with light)
            const trailPosition = new THREE.Vector3().copy(trailPos);
            
            // Add to trails array
            this.trails.push({
                light: trailLight,
                position: trailPosition,
                size: { x: 0.6, y: 0.6, z: 0.8 },
                creationTime: Date.now(),
                color: trailColor,
                lifetime: 0,
                maxLifetime: 50 + Math.floor(Math.random() * 20)
            });
            
            // Create fire particles for this trail
            this.createFireParticles(trailPosition, trailColor, particleCount);
            
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
    
    // Create fire particles using the particle system
    createFireParticles(position, baseColor, count = 5) {
        try {
            // Create regular fire particles
            for (let i = 0; i < count; i++) {
                const particle = this.getNextParticle();
                
                // Vary the color slightly for more realistic fire effect
                const hueVariation = (Math.random() - 0.5) * 0.1;
                const baseHSL = { h: 0, s: 0, l: 0 };
                baseColor.getHSL(baseHSL);
                
                const color = new THREE.Color().setHSL(
                    THREE.MathUtils.clamp(baseHSL.h + hueVariation, 0, 0.15),
                    0.7 + Math.random() * 0.3,
                    0.4 + Math.random() * 0.6
                );
                
                // Set up particle
                particle.active = true;
                particle.position.set(
                    position.x + (Math.random() - 0.5) * 0.15,
                    position.y + (Math.random() - 0.5) * 0.15,
                    position.z + (Math.random() - 0.5) * 0.07
                );
                
                particle.velocity.set(
                    (Math.random() - 0.5) * 0.02,
                    0.005 + Math.random() * 0.015,
                    (Math.random() - 0.5) * 0.02
                );
                
                particle.color.copy(color);
                particle.size = 0.12 + Math.random() * 0.15; // Slightly reduced from 0.15-0.35 to 0.12-0.27
                particle.lifetime = 0;
                particle.maxLifetime = 25 + Math.floor(Math.random() * 15); // Reduced lifetime from 30-50 to 25-40
                
                // Update the buffer arrays
                this.updateParticleBuffers(particle);
                
                // Increase the active count if needed
                if (this.activeParticleCount < this.maxParticles) {
                    this.activeParticleCount++;
                }
            }
            
            // Create a few ember particles
            for (let i = 0; i < 1; i++) { // Reduced from 2 to 1
                const particle = this.getNextParticle();
                
                // Embers are brighter and smaller
                const color = new THREE.Color().setHSL(0.1, 0.9, 0.8); // Bright yellow-orange
                
                // Set up particle
                particle.active = true;
                particle.position.set(
                    position.x + (Math.random() - 0.5) * 0.05,
                    position.y + 0.05,
                    position.z + (Math.random() - 0.5) * 0.05
                );
                
                particle.velocity.set(
                    (Math.random() - 0.5) * 0.04,
                    0.02 + Math.random() * 0.03,
                    (Math.random() - 0.5) * 0.04
                );
                
                particle.color.copy(color);
                particle.size = 0.07 + Math.random() * 0.05;
                particle.lifetime = 0;
                particle.maxLifetime = 40 + Math.floor(Math.random() * 20);
                
                // Update the buffer arrays
                this.updateParticleBuffers(particle);
                
                // Increase the active count if needed
                if (this.activeParticleCount < this.maxParticles) {
                    this.activeParticleCount++;
                }
            }
            
            // Mark attributes as needing update
            this.geometry.attributes.position.needsUpdate = true;
            this.geometry.attributes.color.needsUpdate = true;
            this.geometry.attributes.size.needsUpdate = true;
            
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
                
                // Get random color from the palette for more variation
                let colorIndex;
                do {
                    colorIndex = Math.floor(Math.random() * this.colorPalette.length);
                } while (colorIndex === this.lastColorIndex);
                
                this.lastColorIndex = colorIndex;
                const colorInfo = this.colorPalette[colorIndex];
                const trailColor = new THREE.Color().setHSL(colorInfo.h, colorInfo.s, colorInfo.l);
                
                // Create trail with 'player' type
                this.createTrail(trailPosition, 'player', trailColor, 3); // Reduced particle count parameter from default (5) to 3
                
                // Update last creation time
                this.lastTrailTime = Date.now();
            }
        }, 40); // Increased from default (likely 30ms) to 40ms
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
            let needsUpdate = false;
            
            // For each trail, update position and fade out over time
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
            
            // Update all active particles
            for (let i = 0; i < this.particles.length; i++) {
                const particle = this.particles[i];
                
                if (particle.active) {
                    // Update lifetime
                    particle.lifetime++;
                    
                    // Update position based on velocity
                    particle.position.x += particle.velocity.x;
                    particle.position.y += particle.velocity.y;
                    particle.position.z += particle.velocity.z + this.trailSpeed; // Also move with game speed
                    
                    // Slow down over time but keep rising (for fire effect)
                    particle.velocity.x *= 0.97;
                    particle.velocity.y = Math.max(0.001, particle.velocity.y * 0.98);
                    particle.velocity.z *= 0.97;
                    
                    // Fade out and get smaller
                    const lifeRatio = particle.lifetime / particle.maxLifetime;
                    particle.size *= 0.99; // Slowly shrink
                    
                    // Update color - fire gets yellower/brighter then fades
                    if (lifeRatio < 0.3) {
                        // Brighten from orange to yellow (early life)
                        const hsl = { h: 0, s: 0, l: 0 };
                        particle.color.getHSL(hsl);
                        
                        particle.color.setHSL(
                            Math.min(0.15, hsl.h + 0.001),
                            Math.max(0.5, hsl.s - 0.01),
                            Math.min(0.8, hsl.l + 0.02)
                        );
                    } else {
                        // Fade to darker orange-red (later life)
                        const fadeRatio = 1 - (lifeRatio - 0.3) / 0.7; // Normalized from 0.3-1.0 lifespan
                        const hsl = { h: 0, s: 0, l: 0 };
                        particle.color.getHSL(hsl);
                        
                        // Reduce brightness for fade out effect
                        particle.color.setHSL(
                            hsl.h,
                            hsl.s,
                            hsl.l * fadeRatio
                        );
                    }
                    
                    // Update buffer arrays
                    this.updateParticleBuffers(particle);
                    needsUpdate = true;
                    
                    // Deactivate if too old or too far back
                    if (particle.lifetime >= particle.maxLifetime || particle.position.z > 5) {
                        particle.active = false;
                    }
                }
            }
            
            // Update buffer attributes if needed
            if (needsUpdate) {
                this.geometry.attributes.position.needsUpdate = true;
                this.geometry.attributes.color.needsUpdate = true;
                this.geometry.attributes.size.needsUpdate = true;
            }
            
        } catch (error) {
            console.error('Error updating trails:', error);
        }
    }
    
    // Get trail positions for collision detection
    getTrails() {
        // Don't return trails for collision detection
        return [];
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
            
            // Reset all particles to inactive
            for (let i = 0; i < this.particles.length; i++) {
                this.particles[i].active = false;
            }
            
            // Update the buffers to clear all particles
            for (let i = 0; i < this.maxParticles; i++) {
                // Move particles far away
                this.positions[i * 3] = 0;
                this.positions[i * 3 + 1] = 0;
                this.positions[i * 3 + 2] = 1000; // Move far away (invisible)
                
                // Set size to 0
                this.sizes[i] = 0;
            }
            
            // Mark buffers for update
            this.geometry.attributes.position.needsUpdate = true;
            this.geometry.attributes.size.needsUpdate = true;
            
            console.log('Trail system reset, all particles cleared');
        } catch (error) {
            console.error('Error resetting trails:', error);
        }
    }
}