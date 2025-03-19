/**
 * Player class for Tap Dash
 */
class Player {
    constructor(scene) {
        this.scene = scene;
        this.position = { x: 0, y: 0.5, z: 0 };
        this.velocity = { x: 0, y: 0, z: 0 };
        this.size = { x: 0.5, y: 0.5, z: 0.5 };
        this.isJumping = false;
        this.gravity = 0.015;
        this.jumpForce = 0.35;
        this.doubleJumpAvailable = false;
        this.trailColors = [];
        
        // Added: Horizontal movement controls
        this.maxHorizontalSpeed = 0.15;
        this.horizontalAcceleration = 0.01;
        this.movingLeft = false;
        this.movingRight = false;
        
        // Create the player mesh with improved looks
        this.createPlayerMesh();
        
        // Add glow effect
        this.addGlow();
    }
    

    addContinuousParticleTrail() {
        try {
            // Create a continuous stream of particles behind the player
            setInterval(() => {
                if (!this.isJumping) return; // Only show particles when jumping
                
                // Create a particle
                const particle = new THREE.Mesh(
                    new THREE.SphereGeometry(0.03 + Math.random() * 0.03, 8, 8),
                    new THREE.MeshBasicMaterial({
                        color: new THREE.Color().setHSL(Math.random(), 0.9, 0.6),
                        transparent: true,
                        opacity: 0.7
                    })
                );
                
                // Position slightly behind player
                particle.position.set(
                    this.position.x + (Math.random() - 0.5) * 0.1,
                    this.position.y - 0.1,
                    this.position.z + 0.1
                );
                
                this.scene.add(particle);
                
                // Animate the particle
                let lifetime = 0;
                const maxLife = 20;
                
                const animateParticle = () => {
                    lifetime++;
                    
                    if (lifetime < maxLife) {
                        // Drift slightly
                        particle.position.x += (Math.random() - 0.5) * 0.01;
                        particle.position.y += (Math.random() - 0.5) * 0.01;
                        particle.position.z += 0.02; // Move backward relative to player
                        
                        // Fade out
                        particle.material.opacity = 0.7 * (1 - lifetime / maxLife);
                        
                        requestAnimationFrame(animateParticle);
                    } else {
                        this.scene.remove(particle);
                    }
                };
                
                animateParticle();
            }, 50); // Create particles at regular intervals
        } catch (error) {
            console.error("Error creating continuous particle trail:", error);
        }
    }

    createPlayerMesh() {
        try {
            // MODIFIED: Create a more vibrant and interesting player model
            
            // Core sphere (inner glow)
            const coreGeometry = new THREE.SphereGeometry(this.size.x * 0.6, 16, 16);
            const coreMaterial = new THREE.MeshBasicMaterial({ 
                color: 0xffffff,
                transparent: true,
                opacity: 0.9
            });
            this.core = new THREE.Mesh(coreGeometry, coreMaterial);
            
            // Middle layer with pulsing effect
            const middleGeometry = new THREE.SphereGeometry(this.size.x * 0.8, 20, 20);
            const middleMaterial = new THREE.MeshPhongMaterial({ 
                color: 0x44aaff,
                transparent: true,
                opacity: 0.6,
                shininess: 100
            });
            this.middleLayer = new THREE.Mesh(middleGeometry, middleMaterial);
            
            // Outer shell (semi-transparent)
            const shellGeometry = new THREE.SphereGeometry(this.size.x, 20, 20);
            const shellMaterial = new THREE.MeshPhongMaterial({ 
                color: 0x88aaff,
                transparent: true,
                opacity: 0.7,
                shininess: 90,
                emissive: 0x4477ff,
                emissiveIntensity: 0.5
            });
            this.mesh = new THREE.Mesh(shellGeometry, shellMaterial);
            
            // Add core and middle layer to the main mesh
            this.mesh.add(this.core);
            this.mesh.add(this.middleLayer);
            
            // Position the complete player
            this.mesh.position.set(this.position.x, this.position.y, this.position.z);
            this.scene.add(this.mesh);
            
            // MODIFIED: Add continuous particle trail
            this.addContinuousParticleTrail();
        } catch(error) {
            console.error("Error creating player mesh:", error);
            // Create a fallback simple player if error occurs
            this.createFallbackMesh();
        }
    }
    
    createFallbackMesh() {
        console.log("Creating fallback player mesh");
        
        try {
            // Simple sphere as fallback
            const geometry = new THREE.SphereGeometry(this.size.x, 8, 8);
            const material = new THREE.MeshBasicMaterial({ color: 0x88aaff });
            this.mesh = new THREE.Mesh(geometry, material);
            this.mesh.position.set(this.position.x, this.position.y, this.position.z);
            this.scene.add(this.mesh);
        } catch(error) {
            console.error("Fallback mesh creation failed:", error);
            // Last resort - create a mock mesh object
            this.mesh = {
                position: this.position,
                rotation: { x: 0, y: 0, z: 0 },
                scale: { set: function() {} },
                material: { 
                    opacity: 1,
                    emissive: { setHSL: function() {} }
                }
            };
        }
    }
    
    addParticleTrail() {
        try {
            // Create a simple particle system for a continuous trail
            const particleCount = 20;
            const particles = [];
            
            for (let i = 0; i < particleCount; i++) {
                const size = Math.random() * 0.08 + 0.02;
                const particle = new THREE.Mesh(
                    new THREE.SphereGeometry(size, 8, 8),
                    new THREE.MeshBasicMaterial({
                        color: 0x88aaff,
                        transparent: true,
                        opacity: 0.6
                    })
                );
                
                // Position initially at player
                particle.position.copy(this.mesh.position);
                particle.position.y -= 0.2; // Slightly below player
                
                // Set lifetime for this particle
                particle.lifetime = Math.random() * 30 + 20;
                particle.age = particle.lifetime * Math.random(); // Stagger initial ages
                
                this.scene.add(particle);
                particles.push(particle);
            }
            
            // Animate particles
            const animateParticles = () => {
                if (!this.scene) return; // Stop if scene was destroyed
                
                for (const particle of particles) {
                    // Age the particle
                    particle.age++;
                    
                    // Reset if too old
                    if (particle.age > particle.lifetime) {
                        particle.position.copy(this.mesh.position);
                        particle.position.y -= 0.2;
                        particle.material.opacity = 0.6;
                        particle.age = 0;
                    }
                    
                    // Fade out
                    particle.material.opacity = 0.6 * (1 - particle.age / particle.lifetime);
                    
                    // Slow down as it ages
                    particle.position.z += 0.02 * (1 - particle.age / particle.lifetime);
                }
                
                requestAnimationFrame(animateParticles);
            };
            
            animateParticles();
        } catch(error) {
            console.error("Error creating particle trail:", error);
        }
    }
    
    addGlow() {
        try {
            // Add a more dynamic glow effect
            this.light = new THREE.PointLight(0x88aaff, 1, 3);
            this.light.position.copy(this.mesh.position);
            this.scene.add(this.light);
            
            // Add a secondary pulse light
            this.pulseLight = new THREE.PointLight(0xffffff, 0.5, 2);
            this.pulseLight.position.copy(this.mesh.position);
            this.scene.add(this.pulseLight);
        } catch(error) {
            console.error("Error adding glow effect:", error);
            // Create mock light objects if real ones fail
            this.light = { position: { copy: function() {} }, intensity: 1 };
            this.pulseLight = { position: { copy: function() {} }, intensity: 0.5 };
        }
    }
    
    jump() {
        console.log('Jump attempt - isJumping:', this.isJumping, 'doubleJumpAvailable:', this.doubleJumpAvailable);
        
        if (!this.isJumping) {
            // First jump
            this.velocity.y = this.jumpForce;
            this.isJumping = true;
            this.doubleJumpAvailable = true;
            this.playJumpEffect();
            return true;
        } else if (this.doubleJumpAvailable) {
            // Double jump - slightly stronger for better gameplay
            this.velocity.y = this.jumpForce * 0.9; // Increased from 0.8
            this.doubleJumpAvailable = false;
            this.playJumpEffect();
            return true;
        }
        return false; // Can't jump
    }
    
    
    playJumpEffect() {
        try {
            // Visual effect when jumping
            
            // Pulse the player briefly
            const originalScale = 1;
            this.mesh.scale.set(1.2, 1.2, 1.2);
            setTimeout(() => {
                // Return to normal size
                this.mesh.scale.set(originalScale, originalScale, originalScale);
            }, 150);
            
            // Increase light intensity briefly
            if (this.light) {
                const originalIntensity = this.light.intensity;
                this.light.intensity = 2;
                setTimeout(() => {
                    this.light.intensity = originalIntensity;
                }, 200);
            }
            
            // Create a small shockwave effect
            const shockwaveGeometry = new THREE.RingGeometry(0.1, 0.5, 16);
            const shockwaveMaterial = new THREE.MeshBasicMaterial({
                color: 0x88aaff,
                transparent: true,
                opacity: 0.7,
                side: THREE.DoubleSide
            });
            
            const shockwave = new THREE.Mesh(shockwaveGeometry, shockwaveMaterial);
            shockwave.position.copy(this.mesh.position);
            shockwave.rotation.x = Math.PI / 2;
            this.scene.add(shockwave);
            
            // Animate the shockwave
            let scale = 1;
            let opacity = 0.7;
            
            const animateShockwave = () => {
                scale += 0.2;
                opacity -= 0.05;
                
                shockwave.scale.set(scale, scale, scale);
                shockwaveMaterial.opacity = opacity;
                
                if (opacity > 0) {
                    requestAnimationFrame(animateShockwave);
                } else {
                    this.scene.remove(shockwave);
                }
            };
            
            animateShockwave();
        } catch(error) {
            console.error("Error playing jump effect:", error);
        }
    }
    
    // Added: New methods for horizontal movement
    moveLeft(isMoving) {
        this.movingLeft = isMoving;
    }
    
    moveRight(isMoving) {
        this.movingRight = isMoving;
    }
    
    update() {
        try {
            // More refined gravity and physics
            // Apply gravity with slight easing for better feel
            if (this.velocity.y > 0) {
                this.velocity.y -= this.gravity * 0.9;
            } else {
                this.velocity.y -= this.gravity * 1.1;
            }
            
            // Cap terminal velocity for better control
            if (this.velocity.y < -0.5) {
                this.velocity.y = -0.5;
            }
            
            // Update position
            this.position.y += this.velocity.y;
            
            // MODIFIED: Improved horizontal movement with user control
            // Apply horizontal acceleration based on input
            if (this.movingLeft) {
                this.velocity.x -= this.horizontalAcceleration;
            } else if (this.movingRight) {
                this.velocity.x += this.horizontalAcceleration;
            } else {
                // Slow down if no input
                this.velocity.x *= 0.9;
            }
            
            // Cap horizontal speed
            if (this.velocity.x > this.maxHorizontalSpeed) {
                this.velocity.x = this.maxHorizontalSpeed;
            } else if (this.velocity.x < -this.maxHorizontalSpeed) {
                this.velocity.x = -this.maxHorizontalSpeed;
            }
            
            // Update horizontal position
            this.position.x += this.velocity.x;
            
            // Keep player within bounds
            const boundaryLimit = 2.5;
            if (this.position.x > boundaryLimit) {
                this.position.x = boundaryLimit;
                this.velocity.x = 0;
            } else if (this.position.x < -boundaryLimit) {
                this.position.x = -boundaryLimit;
                this.velocity.x = 0;
            }
            
            // Ground collision
            if (this.position.y <= this.size.y) {
                this.position.y = this.size.y;
                this.velocity.y = 0;
                this.isJumping = false;
            }
            
            // Update mesh position
            this.mesh.position.set(this.position.x, this.position.y, this.position.z);
            
            // Update light positions
            if (this.light) {
                this.light.position.copy(this.mesh.position);
            }
            
            // Animate pulse light with more dramatic effect
            const time = Date.now() * 0.003;
            if (this.pulseLight) {
                this.pulseLight.intensity = 0.3 + Math.sin(time) * 0.3;
                this.pulseLight.position.copy(this.mesh.position);
            }
            
            // More dynamic rotation for visual interest
            this.mesh.rotation.y += 0.02;
            this.mesh.rotation.z += 0.01;
            
            // MODIFIED: Better visual feedback during different states
            if (this.isJumping) {
                // More dramatic tilt when jumping
                this.mesh.rotation.x = this.velocity.y * 0.2;
                
                // Add slight tilt based on horizontal velocity for better feedback
                this.mesh.rotation.z = -this.velocity.x * 0.5;
                
                // Change color based on jump state
                if (this.mesh.material && this.mesh.material.emissive) {
                    if (this.doubleJumpAvailable) {
                        // First jump - blue hue
                        this.mesh.material.emissive.setHSL(0.6, 0.7, 0.5);
                    } else {
                        // Double jump - purple hue
                        this.mesh.material.emissive.setHSL(0.7, 0.9, 0.6);
                    }
                }
                
                // Pulse the middle layer
                if (this.middleLayer) {
                    this.middleLayer.scale.set(
                        1 + Math.sin(time * 5) * 0.1,
                        1 + Math.sin(time * 5) * 0.1,
                        1 + Math.sin(time * 5) * 0.1
                    );
                }
            } else {
                // Reset rotation when on ground
                this.mesh.rotation.x *= 0.9;
                
                // Add tilt based on horizontal velocity for better feedback
                this.mesh.rotation.z = -this.velocity.x * 0.5;
                
                // Restore normal color
                if (this.mesh.material && this.mesh.material.emissive) {
                    this.mesh.material.emissive.setHSL(0.6, 0.5, 0.3);
                }
                
                // Normal pulsing for middle layer
                if (this.middleLayer) {
                    this.middleLayer.scale.set(
                        1 + Math.sin(time * 2) * 0.05,
                        1 + Math.sin(time * 2) * 0.05,
                        1 + Math.sin(time * 2) * 0.05
                    );
                }
            }
            
            // More dramatic squash and stretch
            const baseScale = 1;
            if (this.velocity.y > 0.1) {
                // Stretch when moving up
                this.mesh.scale.set(baseScale * 0.85, baseScale * 1.15, baseScale * 0.85);
            } else if (this.velocity.y < -0.1) {
                // Squash when falling
                this.mesh.scale.set(baseScale * 1.15, baseScale * 0.85, baseScale * 1.15);
            } else {
                // Normal when on ground or at peak of jump
                this.mesh.scale.set(baseScale, baseScale, baseScale);
            }
            
            // Add slight stretching effect when moving horizontally
            if (Math.abs(this.velocity.x) > 0.03) {
                const stretchFactor = 0.15 * Math.abs(this.velocity.x) / this.maxHorizontalSpeed;
                this.mesh.scale.x += stretchFactor * Math.sign(-this.velocity.x);
                this.mesh.scale.z += stretchFactor * 0.5;
            }
        } catch(error) {
            console.error("Error in player update:", error);
        }
    }
    
    reset() {
        this.position = { x: 0, y: 0.5, z: 0 };
        this.velocity = { x: 0, y: 0, z: 0 };
        this.isJumping = false;
        this.doubleJumpAvailable = false;
        this.movingLeft = false;
        this.movingRight = false;
        try {
            this.mesh.position.set(this.position.x, this.position.y, this.position.z);
            this.mesh.rotation.set(0, 0, 0);
            this.mesh.scale.set(1, 1, 1);
        } catch(error) {
            console.error("Error in player reset:", error);
        }
    }
}