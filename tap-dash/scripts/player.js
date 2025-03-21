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
        
        // ADDED: Flag to freeze player during countdown
        this.frozen = false;
        // ADDED: Flag for slow motion effect
        this.slowMotion = false;
        
        // Create the player mesh with improved looks
        this.createPlayerMesh();
        
        // Add glow effect
        this.addGlow();
    }
    
    // ADDED: New methods for freezing player during countdown
    freeze() {
        this.frozen = true;
        this.velocity = { x: 0, y: 0, z: 0 };
        
        // ADDED: Update glow positions when freezing to ensure correct placement
        this.updateGlowPositions();
    }
    
    unfreeze() {
        this.frozen = false;
        
        // Ensure player is not below ground level when unfrozen
        if (this.position.y < 0.5) {
            this.position.y = 0.5;
            // Also update mesh position
            if (this.mesh) {
                this.mesh.position.y = 0.5;
            }
        }
    }
    
    // ADDED: Method for slow motion effect
    setSlowMotion(enabled) {
        this.slowMotion = enabled;
        // Adjust physics parameters for slow motion
        if (enabled) {
            this.gravity = 0.005; // Lower gravity in slow motion
        } else {
            this.gravity = 0.015; // Reset to normal
        }
    }

    addContinuousParticleTrail() {
        try {
            // Create a continuous stream of fire-like particles behind the player
            setInterval(() => {
                // Show fire trail when moving or jumping and not frozen
                if ((this.isJumping || Math.abs(this.velocity.x) > 0.05) && !this.frozen) {
                    // Create multiple particles for fire effect
                    for (let i = 0; i < 3; i++) { // Create 3 particles per interval for richer effect
                        // Generate fire-colored particles (yellows, oranges, reds)
                        const fireHue = 0.05 + Math.random() * 0.1; // Range from orange-red to yellow
                        const fireSaturation = 0.7 + Math.random() * 0.3;
                        const fireBrightness = 0.5 + Math.random() * 0.5;
                        
                        // Create a particle
                        const particle = new THREE.Mesh(
                            new THREE.SphereGeometry(0.04 + Math.random() * 0.04, 8, 8),
                            new THREE.MeshBasicMaterial({
                                color: new THREE.Color().setHSL(fireHue, fireSaturation, fireBrightness),
                                transparent: true,
                                opacity: 0.7 + Math.random() * 0.3
                            })
                        );
                        
                        // Position slightly behind player with some randomness
                        particle.position.set(
                            this.position.x + (Math.random() - 0.5) * 0.2,
                            this.position.y - 0.1 + (Math.random() - 0.3) * 0.2, // Slightly below player
                            this.position.z + 0.05 + Math.random() * 0.1 // Slightly behind
                        );
                        
                        this.scene.add(particle);
                        
                        // Animate the particle to create a fire-like effect
                        let lifetime = 0;
                        const maxLife = 15 + Math.floor(Math.random() * 10); // Variable lifetime
                        
                        const animateParticle = () => {
                            lifetime++;
                            
                            if (lifetime < maxLife) {
                                // Fire particles rise slightly and drift
                                particle.position.x += (Math.random() - 0.5) * 0.02;
                                particle.position.y += 0.005 + Math.random() * 0.01; // Slight upward drift
                                particle.position.z += 0.02 + Math.random() * 0.01; // Move backward
                                
                                // Shrink as they disappear
                                const scale = 1 - (lifetime / maxLife) * 0.8;
                                particle.scale.set(scale, scale, scale);
                                
                                // Fade out
                                particle.material.opacity = 0.8 * (1 - lifetime / maxLife);
                                
                                // Add color shifting toward more yellow as it rises (like real fire)
                                if (lifetime > maxLife * 0.5) {
                                    // Create target for getHSL - not needed here as we're setting directly
                                    // Shift toward more yellow/white at the end of life
                                    const targetColor = new THREE.Color();
                                    particle.material.color.getHSL(targetColor);
                                    
                                    particle.material.color.setHSL(
                                        Math.min(0.15, fireHue + (lifetime/maxLife) * 0.1), 
                                        Math.max(0.5, fireSaturation - (lifetime/maxLife) * 0.3),
                                        Math.min(0.9, fireBrightness + (lifetime/maxLife) * 0.3)
                                    );
                                }
                                
                                requestAnimationFrame(animateParticle);
                            } else {
                                this.scene.remove(particle);
                            }
                        };
                        
                        animateParticle();
                    }
                    
                    // Occasionally add a spark/ember particle
                    if (Math.random() > 0.7) {
                        const ember = new THREE.Mesh(
                            new THREE.SphereGeometry(0.02 + Math.random() * 0.02, 6, 6),
                            new THREE.MeshBasicMaterial({
                                color: new THREE.Color().setHSL(0.1, 0.9, 0.8), // Bright orange-yellow
                                transparent: true,
                                opacity: 0.9
                            })
                        );
                        
                        // Position near the player
                        ember.position.set(
                            this.position.x + (Math.random() - 0.5) * 0.15,
                            this.position.y - 0.05 + Math.random() * 0.1,
                            this.position.z + 0.1 + Math.random() * 0.05
                        );
                        
                        this.scene.add(ember);
                        
                        // Animate the ember with erratic movement
                        let emberTime = 0;
                        const emberLife = 20 + Math.floor(Math.random() * 15);
                        
                        const animateEmber = () => {
                            emberTime++;
                            
                            if (emberTime < emberLife) {
                                // Embers move more erratically and faster
                                ember.position.x += (Math.random() - 0.5) * 0.03;
                                ember.position.y += 0.01 + Math.random() * 0.02; // Rise faster
                                ember.position.z += 0.01 + Math.random() * 0.03;
                                
                                // Embers fade and shrink
                                ember.material.opacity = 0.9 * (1 - emberTime / emberLife);
                                ember.scale.multiplyScalar(0.97);
                                
                                requestAnimationFrame(animateEmber);
                            } else {
                                this.scene.remove(ember);
                            }
                        };
                        
                        animateEmber();
                    }
                }
            }, 30); // Create particles more frequently for smooth effect
        } catch (error) {
            console.error("Error creating fire particle trail:", error);
        }
    }

    createPlayerMesh() {
        try {
            // MODIFIED: Create a more vibrant and exciting player model with golden-orange theme
            
            // Core sphere (inner bright glow)
            const coreGeometry = new THREE.SphereGeometry(this.size.x * 0.6, 24, 24);
            const coreMaterial = new THREE.MeshBasicMaterial({ 
                color: 0xffee77, // Bright golden-yellow core
                transparent: true,
                opacity: 0.95
            });
            this.core = new THREE.Mesh(coreGeometry, coreMaterial);
            
            // Middle layer with pulsing effect
            const middleGeometry = new THREE.SphereGeometry(this.size.x * 0.8, 28, 28);
            const middleMaterial = new THREE.MeshPhongMaterial({ 
                color: 0xffa233, // Golden orange middle layer
                transparent: true,
                opacity: 0.8,
                shininess: 120
            });
            this.middleLayer = new THREE.Mesh(middleGeometry, middleMaterial);
            
            // Outer shell (semi-transparent)
            const shellGeometry = new THREE.SphereGeometry(this.size.x, 32, 32);
            const shellMaterial = new THREE.MeshPhongMaterial({ 
                color: 0xff9940, // Warm orange outer shell
                transparent: true,
                opacity: 0.7,
                shininess: 100,
                emissive: 0xff8b33, // Warm orange glow
                emissiveIntensity: 0.7
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
            // Simple sphere as fallback with new color
            const geometry = new THREE.SphereGeometry(this.size.x, 16, 16);
            // Use MeshPhongMaterial instead of MeshBasicMaterial to support emissive
            const material = new THREE.MeshPhongMaterial({ 
                color: 0xffb347,  // Warm orange fallback
                emissive: 0x331100, // Slight glow
                emissiveIntensity: 0.5,
                shininess: 30
            }); 
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
                    // Provide a no-op emissive object that supports getHSL with target
                    emissive: { 
                        setHSL: function() {},
                        getHSL: function(target) { return target || {}; }
                    }
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
            // Create an outer glow effect using a point light
            this.glow = new THREE.PointLight(0xffcc33, 2.0, 3.0);
            this.glow.position.copy(this.position);
            // FIXED: Position the glow slightly behind the player (not under it)
            this.glow.position.z -= 0.2;
            this.scene.add(this.glow);
            
            // Add a soft ambient light attached to the player
            this.ambientGlow = new THREE.PointLight(0xffaa22, 0.8, 5.0);
            this.ambientGlow.position.copy(this.position);
            // FIXED: Position ambient glow correctly
            this.ambientGlow.position.z -= 0.1;
            this.scene.add(this.ambientGlow);
            
            // Pulsating effect for the glow
            this.glowIntensity = 2.0;
            this.glowDirection = 0.05;
            this.glowMin = 1.5;
            this.glowMax = 2.5;
        } catch(error) {
            console.error("Error creating glow effect:", error);
        }
    }
    
    jump() {
        console.log('Jump attempt - isJumping:', this.isJumping, 'doubleJumpAvailable:', this.doubleJumpAvailable, 'frozen:', this.frozen);
        
        // Cannot jump if frozen
        if (this.frozen) {
            console.log('Jump ignored - player is frozen');
            return false;
        }
        
        // Check ground position more explicitly to ensure proper jumping
        const onGround = this.position.y <= 0.5 && this.velocity.y <= 0;
        
        if (onGround) {
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
            if (this.glow) {
                const originalIntensity = this.glow.intensity;
                this.glow.intensity = 2;
                setTimeout(() => {
                    this.glow.intensity = originalIntensity;
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
        if (this.frozen) return; // Can't move if frozen
        this.movingLeft = isMoving;
    }
    
    moveRight(isMoving) {
        if (this.frozen) return; // Can't move if frozen
        this.movingRight = isMoving;
    }
    
    update() {
        if (this.frozen) return; // Don't update if frozen
        
        try {
            // Apply gravity to vertical velocity
            if (this.slowMotion) {
                this.velocity.y -= this.gravity * 0.33; // 1/3 speed in slow motion
            } else {
                this.velocity.y -= this.gravity;
            }
            
            // Apply horizontal movement (capped at maximum speed)
            if (this.movingLeft) {
                this.velocity.x = Math.max(-this.maxHorizontalSpeed, this.velocity.x - this.horizontalAcceleration);
            } else if (this.movingRight) {
                this.velocity.x = Math.min(this.maxHorizontalSpeed, this.velocity.x + this.horizontalAcceleration);
            } else {
                // Slow down when not actively moving
                this.velocity.x *= 0.9;
                
                // Stop completely if very slow
                if (Math.abs(this.velocity.x) < 0.001) {
                    this.velocity.x = 0;
                }
            }
            
            // Update position based on velocity
            this.position.x += this.velocity.x;
            this.position.y += this.velocity.y;
            
            // Constrain horizontal movement to the platform width
            this.position.x = Math.max(-2, Math.min(2, this.position.x));
            
            // Check if landed on ground
            if (this.position.y <= 0.5) {  // CHANGED: From 0 to 0.5 to match initial player position
                this.position.y = 0.5;
                this.velocity.y = 0;
                this.isJumping = false;
                this.doubleJumpAvailable = false;
            }
            
            // ENHANCED: Dynamic color pulsing based on movement
            const dynamicFactor = Math.abs(this.velocity.x) + Math.abs(this.velocity.y);
            const colorIntensity = 0.5 + dynamicFactor * 0.5; // More movement = brighter
            
            // Inner core pulses more intensely with movement
            if (this.core) {
                // Create target color for getHSL
                const coreColor = new THREE.Color();
                this.core.material.color.getHSL(coreColor);
                
                this.core.material.color.setHSL(
                    0.12 - dynamicFactor * 0.01, // Slight hue shift with speed
                    0.9,
                    Math.min(0.9, 0.7 + dynamicFactor * 0.3) // Brighter when moving
                );
                
                // Core pulses gently
                const pulseScale = 1 + Math.sin(Date.now() * 0.005) * 0.07;
                this.core.scale.set(pulseScale, pulseScale, pulseScale);
            }
            
            // Middle layer color responds to velocity
            if (this.middleLayer) {
                // Create target color for getHSL
                const middleColor = new THREE.Color();
                this.middleLayer.material.color.getHSL(middleColor);
                
                this.middleLayer.material.color.setHSL(
                    0.08 + Math.sin(Date.now() * 0.001) * 0.02, // Dynamic hue shift
                    0.8 + dynamicFactor * 0.1,
                    0.6 + dynamicFactor * 0.2
                );
            }
            
            // Update player mesh position
            if (this.mesh) {
                this.mesh.position.copy(this.position);
            }
            
            // Update glow light position and effects
            if (this.glow) {
                // FIXED: Properly position glow behind the player
                this.glow.position.set(
                    this.position.x,
                    this.position.y,
                    this.position.z - 0.2 // Always behind player
                );
                
                // Pulsing effect
                this.glowIntensity += this.glowDirection;
                if (this.glowIntensity > this.glowMax) {
                    this.glowDirection = -0.05;
                } else if (this.glowIntensity < this.glowMin) {
                    this.glowDirection = 0.05;
                }
                this.glow.intensity = this.glowIntensity;
            }
            
            // Update secondary light
            if (this.ambientGlow) {
                // FIXED: Position ambient glow properly
                this.ambientGlow.position.set(
                    this.position.x,
                    this.position.y - 0.1, // Slightly below
                    this.position.z - 0.1  // Slightly behind
                );
                
                // Flicker effect
                if (Math.random() > 0.5) {
                    const flickerIntensity = 0.8 + Math.random() * 0.4;
                    this.ambientGlow.intensity = flickerIntensity;
                }
            }
            
            // Dynamic shell glow based on movement
            if (this.mesh && this.mesh.material) {
                // Check if the material is a MeshPhongMaterial or MeshStandardMaterial that supports emissive
                const supportsMaterial = 
                    this.mesh.material.type === 'MeshPhongMaterial' || 
                    this.mesh.material.type === 'MeshStandardMaterial';
                
                if (supportsMaterial && this.mesh.material.emissive) {
                    const emissiveIntensity = 0.5 + dynamicFactor * 0.3;
                    this.mesh.material.emissiveIntensity = Math.min(1.0, emissiveIntensity);
                    
                    // Shift the emissive color slightly using target parameter
                    const emissiveHue = 0.08 + Math.sin(Date.now() * 0.002) * 0.02;
                    // Create a target color for getHSL
                    const targetColor = new THREE.Color();
                    // Get current HSL values
                    this.mesh.material.emissive.getHSL(targetColor);
                    // Set new HSL values with target
                    this.mesh.material.emissive.setHSL(emissiveHue, 0.9, 0.5);
                }
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
        this.frozen = false;
        this.slowMotion = false;
        this.gravity = 0.015; // Reset to normal gravity
        
        try {
            // Make sure mesh position is updated and properly positioned at ground level
            if (this.mesh) {
                this.mesh.position.set(this.position.x, this.position.y, this.position.z);
                this.mesh.rotation.set(0, 0, 0);
                this.mesh.scale.set(1, 1, 1);
            }
        } catch(error) {
            console.error("Error in player reset:", error);
        }
    }

    // Special method to update light positions even when frozen
    updateGlowPositions() {
        // This function ensures glow positions are correct even when player is frozen (during countdown)
        if (this.glow) {
            this.glow.position.set(
                this.position.x,
                this.position.y,
                this.position.z - 0.2 // Always behind player
            );
        }
        
        if (this.ambientGlow) {
            this.ambientGlow.position.set(
                this.position.x,
                this.position.y - 0.1, // Slightly below
                this.position.z - 0.1  // Slightly behind
            );
        }
    }
}