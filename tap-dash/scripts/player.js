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
        
        // Create the player mesh with improved looks
        this.createPlayerMesh();
        
        // Add glow effect
        this.addGlow();
    }
    
    createPlayerMesh() {
        // Create a more interesting player model with a core sphere and outer shell
        
        // Core sphere (inner glow)
        const coreGeometry = new THREE.SphereGeometry(this.size.x * 0.6, 16, 16);
        const coreMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xffffff,
            transparent: true,
            opacity: 0.9
        });
        this.core = new THREE.Mesh(coreGeometry, coreMaterial);
        
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
        
        // Add core to the main mesh
        this.mesh.add(this.core);
        
        // Position the complete player
        this.mesh.position.set(this.position.x, this.position.y, this.position.z);
        this.scene.add(this.mesh);
        
        // Add particle trail for continuous movement
        this.addParticleTrail();
    }
    
    addParticleTrail() {
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
    }
    
    addGlow() {
        // Add a more dynamic glow effect
        this.light = new THREE.PointLight(0x88aaff, 1, 3);
        this.light.position.copy(this.mesh.position);
        this.scene.add(this.light);
        
        // Add a secondary pulse light
        this.pulseLight = new THREE.PointLight(0xffffff, 0.5, 2);
        this.pulseLight.position.copy(this.mesh.position);
        this.scene.add(this.pulseLight);
    }
    
    jump() {
        if (!this.isJumping) {
            // First jump
            this.velocity.y = this.jumpForce;
            this.isJumping = true;
            this.doubleJumpAvailable = true;
            this.playJumpEffect();
            return true;
        } else if (this.doubleJumpAvailable) {
            // Double jump
            this.velocity.y = this.jumpForce * 0.8;
            this.doubleJumpAvailable = false;
            this.playJumpEffect();
            return true;
        }
        return false; // Can't jump
    }
    
    playJumpEffect() {
        // Visual effect when jumping
        
        // Pulse the player briefly
        const originalScale = 1;
        this.mesh.scale.set(1.2, 1.2, 1.2);
        setTimeout(() => {
            // Return to normal size
            this.mesh.scale.set(originalScale, originalScale, originalScale);
        }, 150);
        
        // Increase light intensity briefly
        const originalIntensity = this.light.intensity;
        this.light.intensity = 2;
        setTimeout(() => {
            this.light.intensity = originalIntensity;
        }, 200);
        
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
    }
    
    update() {
        // Apply gravity
        this.velocity.y -= this.gravity;
        
        // Update position
        this.position.y += this.velocity.y;
        
        // Ground collision
        if (this.position.y <= this.size.y) {
            this.position.y = this.size.y;
            this.velocity.y = 0;
            this.isJumping = false;
        }
        
        // Update mesh position
        this.mesh.position.set(this.position.x, this.position.y, this.position.z);
        
        // Update light positions
        this.light.position.copy(this.mesh.position);
        
        // Animate pulse light
        const time = Date.now() * 0.003;
        this.pulseLight.intensity = 0.3 + Math.sin(time) * 0.2;
        this.pulseLight.position.copy(this.mesh.position);
        
        // Subtle rotation for visual interest
        this.mesh.rotation.y += 0.01;
        this.mesh.rotation.z += 0.005;
        
        // Visual feedback during different states
        if (this.isJumping) {
            // Tilt slightly forward when jumping
            this.mesh.rotation.x = this.velocity.y * 0.1;
            
            // Change color slightly during jump
            this.mesh.material.emissive.setHSL(0.6 + Math.sin(time) * 0.1, 0.7, 0.5);
        } else {
            // Reset rotation when on ground
            this.mesh.rotation.x *= 0.9;
            
            // Restore normal color
            this.mesh.material.emissive.setHSL(0.6, 0.5, 0.3);
        }
        
        // Subtle squash and stretch
        const baseScale = 1;
        if (this.velocity.y > 0) {
            // Stretch when moving up
            this.mesh.scale.set(baseScale * 0.9, baseScale * 1.1, baseScale * 0.9);
        } else if (this.velocity.y < -0.1) {
            // Squash when falling
            this.mesh.scale.set(baseScale * 1.1, baseScale * 0.9, baseScale * 1.1);
        } else {
            // Normal when on ground or at peak of jump
            this.mesh.scale.set(baseScale, baseScale, baseScale);
        }
    }
    
    reset() {
        this.position = { x: 0, y: 0.5, z: 0 };
        this.velocity = { x: 0, y: 0, z: 0 };
        this.isJumping = false;
        this.doubleJumpAvailable = false;
        this.mesh.position.set(this.position.x, this.position.y, this.position.z);
        this.mesh.rotation.set(0, 0, 0);
        this.mesh.scale.set(1, 1, 1);
    }
}