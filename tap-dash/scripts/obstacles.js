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
        
        // ADDED: Safe zone distance to prevent spawning obstacles too close to player
        this.safeZoneDistance = 10;
        
        // ADDED: Flag to control obstacle generation
        this.generatingObstacles = false;
    }
    
    // ADDED: Method to start generating obstacles (called after countdown)
    startGeneratingObstacles() {
        this.generatingObstacles = true;
        console.log('Obstacle generation started');
    }
    
    // ADDED: Method to stop generating obstacles
    stopGeneratingObstacles() {
        this.generatingObstacles = false;
        console.log('Obstacle generation stopped');
    }
    
    spawnObstacle() {
        try {
            // Create more interesting obstacles with different types
            const obstacleType = Math.floor(Math.random() * 4);
            let mesh, width, height, depth;
            
            // MODIFIED: More vibrant color palette
            const hue = Math.random();
            const saturation = 0.8 + Math.random() * 0.2; // Higher saturation
            const lightness = 0.5 + Math.random() * 0.3; // Brighter colors
            const color = new THREE.Color().setHSL(hue, saturation, lightness);
            
            // MODIFIED: Add lateral variation to obstacle positions
            // Make sure obstacles don't spawn directly on player's path
            let lateralPosition;
            do {
                lateralPosition = (Math.random() - 0.5) * 3;
            } while (Math.abs(lateralPosition) < 0.3); // Ensure some minimum offset from center
            
            switch(obstacleType) {
                case 0: // Standard block
                    width = 1 + Math.random();
                    height = 0.7 + Math.random() * 1.5;
                    depth = 0.8 + Math.random() * 0.4;
                    
                    const boxGeometry = new THREE.BoxGeometry(width, height, depth);
                    const boxMaterial = new THREE.MeshPhongMaterial({ 
                        color: color,
                        shininess: 80, // Increased shininess
                        emissive: color.clone().multiplyScalar(0.3) // More glow
                    });
                    mesh = new THREE.Mesh(boxGeometry, boxMaterial);
                    break;
                    
                case 1: // Cylinder/pillar
                    const radius = 0.3 + Math.random() * 0.4;
                    height = 1 + Math.random() * 2;
                    
                    const cylinderGeometry = new THREE.CylinderGeometry(radius, radius, height, 16);
                    const cylinderMaterial = new THREE.MeshPhongMaterial({ 
                        color: color,
                        shininess: 90,
                        emissive: color.clone().multiplyScalar(0.3)
                    });
                    mesh = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
                    
                    width = radius * 2;
                    depth = radius * 2;
                    break;
                    
                case 2: // Floating sphere
                    const sphereRadius = 0.4 + Math.random() * 0.6;
                    
                    const sphereGeometry = new THREE.SphereGeometry(sphereRadius, 24, 24);
                    const sphereMaterial = new THREE.MeshPhongMaterial({ 
                        color: color,
                        shininess: 100,
                        emissive: color.clone().multiplyScalar(0.4)
                    });
                    mesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
                    
                    // Position sphere off the ground
                    // MODIFIED: Ensure floating spheres are at jumpable heights
                    height = 0.8 + Math.random(); // Reduced max height to make it easier to jump over
                    width = sphereRadius * 2;
                    depth = sphereRadius * 2;
                    break;
                    
                case 3: // Arc/gateway
                    width = 1.5 + Math.random();
                    height = 1.5 + Math.random();
                    depth = 0.5;
                    
                    // Create a tube-like arc
                    const path = new THREE.CatmullRomCurve3([
                        new THREE.Vector3(-width/2, 0, 0),
                        new THREE.Vector3(-width/2, height, 0),
                        new THREE.Vector3(width/2, height, 0),
                        new THREE.Vector3(width/2, 0, 0)
                    ]);
                    
                    const tubeGeometry = new THREE.TubeGeometry(path, 20, 0.2, 8, false);
                    const tubeMaterial = new THREE.MeshPhongMaterial({ 
                        color: color,
                        shininess: 70,
                        emissive: color.clone().multiplyScalar(0.2)
                    });
                    mesh = new THREE.Mesh(tubeGeometry, tubeMaterial);
                    break;
            }
            
            // Add stronger glow light to the obstacle
            const light = new THREE.PointLight(color, 1.2, 4); // Brighter, longer range
            light.position.set(0, height / 2, 0);
            mesh.add(light);
            
            // MODIFIED: Position at spawn distance with lateral variation
            mesh.position.set(
                lateralPosition, 
                height / 2, 
                -this.spawnDistance
            );
            
            // Add randomized rotation
            mesh.rotation.y = Math.random() * Math.PI * 0.2;
            
            // Add a glowing outline to make obstacles more visible
            this.addGlowingOutline(mesh, color, width, height, depth);
            
            // Add to scene and obstacles array
            this.scene.add(mesh);
            this.obstacles.push({
                mesh: mesh,
                light: light,
                size: { x: width, y: height, z: depth },
                rotationSpeed: (Math.random() - 0.5) * 0.03 // random rotation
            });
        } catch (error) {
            console.error('Error spawning obstacle:', error);
        }
    }
    
    // ADDED: Method to add glowing outline to obstacles
    addGlowingOutline(mesh, color, width, height, depth) {
        try {
            // Create a slightly larger wireframe version of the obstacle
            let outlineGeometry;
            
            // Determine the type of geometry based on the mesh
            if (mesh.geometry instanceof THREE.BoxGeometry) {
                outlineGeometry = new THREE.BoxGeometry(width * 1.05, height * 1.05, depth * 1.05);
            } else if (mesh.geometry instanceof THREE.CylinderGeometry) {
                const radius = width / 2;
                outlineGeometry = new THREE.CylinderGeometry(radius * 1.05, radius * 1.05, height * 1.05, 16);
            } else if (mesh.geometry instanceof THREE.SphereGeometry) {
                const radius = width / 2;
                outlineGeometry = new THREE.SphereGeometry(radius * 1.05, 24, 24);
            } else {
                // For complex geometries like the tube, skip outline
                return;
            }
            
            // Create outline material
            const outlineMaterial = new THREE.MeshBasicMaterial({
                color: color,
                wireframe: true,
                transparent: true,
                opacity: 0.4,
                blending: THREE.AdditiveBlending
            });
            
            const outline = new THREE.Mesh(outlineGeometry, outlineMaterial);
            mesh.add(outline);
            
            // Add pulsing animation to outline
            const pulseOutline = () => {
                if (!outline.parent) return; // Stop if removed from scene
                
                const time = Date.now() * 0.001;
                const scale = 1.05 + Math.sin(time * 3) * 0.02;
                outline.scale.set(scale, scale, scale);
                
                outlineMaterial.opacity = 0.3 + Math.sin(time * 2) * 0.1;
                
                requestAnimationFrame(pulseOutline);
            };
            
            pulseOutline();
        } catch (error) {
            console.error('Error adding glowing outline:', error);
        }
    }
    
    update() {
        try {
            // Only spawn new obstacles if generation is active
            if (this.generatingObstacles) {
                // MODIFIED: Spawn new obstacles at interval with more randomness
                this.frameCount++;
                if (this.frameCount >= this.spawnInterval) {
                    this.spawnObstacle();
                    this.frameCount = 0;
                    
                    // MODIFIED: More varied spawn intervals
                    this.spawnInterval = Math.floor(Math.random() * (this.maxGap - this.minGap) + this.minGap) * 50;
                    
                    // Sometimes spawn a sequence of obstacles
                    if (Math.random() < 0.2) { // Reduced chance from 0.3 to 0.2
                        // Schedule additional obstacles for an obstacle "pattern"
                        setTimeout(() => {
                            if (this.generatingObstacles) this.spawnObstacle();
                        }, 400);
                        
                        if (Math.random() < 0.3) { // Reduced chance from 0.5 to 0.3
                            setTimeout(() => {
                                if (this.generatingObstacles) this.spawnObstacle();
                            }, 800);
                        }
                    }
                }
            }
            
            // Move obstacles with visual effects
            for (let i = this.obstacles.length - 1; i >= 0; i--) {
                const obstacle = this.obstacles[i];
                obstacle.mesh.position.z += this.obstacleSpeed;
                
                // Apply rotation if this obstacle has rotation speed
                if (obstacle.rotationSpeed) {
                    obstacle.mesh.rotation.y += obstacle.rotationSpeed;
                    
                    // Some obstacles can also rotate on other axes
                    if (Math.random() < 0.01) {
                        obstacle.mesh.rotation.x += obstacle.rotationSpeed * 0.5;
                    }
                }
                
                // Add subtle hover effect to floating objects
                if (obstacle.mesh.position.y > obstacle.size.y) {
                    obstacle.mesh.position.y += Math.sin(Date.now() * 0.003 + i) * 0.01;
                }
                
                // MODIFIED: Improved visual cues for approaching obstacles
                const distanceToPlayer = obstacle.mesh.position.z;
                if (distanceToPlayer > -2 && distanceToPlayer < 2) {
                    // Slightly highlight obstacles as they get closer
                    if (obstacle.mesh.material && obstacle.mesh.material.emissive) {
                        const intensity = 0.3 + (1 - Math.abs(distanceToPlayer) / 2) * 0.7;
                        obstacle.mesh.material.emissive.multiplyScalar(intensity);
                    }
                    
                    // Adjust light intensity for better visual cues
                    if (obstacle.light) {
                        obstacle.light.intensity = 1 + (1 - Math.abs(distanceToPlayer) / 2);
                    }
                }
                
                // Remove obstacles that have passed the player
                if (obstacle.mesh.position.z > 5) {
                    this.scene.remove(obstacle.mesh);
                    this.obstacles.splice(i, 1);
                }
            }
        } catch (error) {
            console.error('Error updating obstacles:', error);
        }
    }
    
    
    // Get obstacle positions for collision detection
    getObstacles() {
        try {
            return this.obstacles.map(obstacle => ({
                position: obstacle.mesh.position,
                size: obstacle.size
            }));
        } catch (error) {
            console.error('Error getting obstacles:', error);
            return [];
        }
    }
    
    increaseSpeed(amount) {
        this.obstacleSpeed += amount;
    }
    
    reset() {
        try {
            // Remove all obstacles
            for (const obstacle of this.obstacles) {
                this.scene.remove(obstacle.mesh);
            }
            this.obstacles = [];
            this.obstacleSpeed = 0.1;
            this.frameCount = 0;
            this.generatingObstacles = false;
        } catch (error) {
            console.error('Error resetting obstacles:', error);
        }
    }
}