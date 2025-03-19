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
    }
    
    spawnObstacle() {
        try {
            // Create more interesting obstacles with different types
            const obstacleType = Math.floor(Math.random() * 4);
            let mesh, width, height, depth;
            
            // Random base color with variation
            const hue = Math.random();
            const saturation = 0.7 + Math.random() * 0.3;
            const lightness = 0.4 + Math.random() * 0.3;
            const color = new THREE.Color().setHSL(hue, saturation, lightness);
            
            switch(obstacleType) {
                case 0: // Standard block
                    width = 1 + Math.random();
                    height = 0.7 + Math.random() * 1.5;
                    depth = 0.8 + Math.random() * 0.4;
                    
                    const boxGeometry = new THREE.BoxGeometry(width, height, depth);
                    const boxMaterial = new THREE.MeshPhongMaterial({ 
                        color: color,
                        shininess: 50,
                        emissive: color.clone().multiplyScalar(0.2)
                    });
                    mesh = new THREE.Mesh(boxGeometry, boxMaterial);
                    break;
                    
                case 1: // Cylinder/pillar
                    const radius = 0.3 + Math.random() * 0.4;
                    height = 1 + Math.random() * 2;
                    
                    const cylinderGeometry = new THREE.CylinderGeometry(radius, radius, height, 16);
                    const cylinderMaterial = new THREE.MeshPhongMaterial({ 
                        color: color,
                        shininess: 60,
                        emissive: color.clone().multiplyScalar(0.2)
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
                        shininess: 80,
                        emissive: color.clone().multiplyScalar(0.3)
                    });
                    mesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
                    
                    // Position sphere off the ground
                    height = 0.5 + Math.random() * 1.5;
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
            
            // Add glow light to the obstacle
            const light = new THREE.PointLight(color, 0.7, 3);
            light.position.set(0, height / 2, 0);
            mesh.add(light);
            
            // Position at spawn distance
            mesh.position.set(0, height / 2, -this.spawnDistance);
            
            // Add randomized rotation
            mesh.rotation.y = Math.random() * Math.PI * 0.2;
            
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
    
    update() {
        try {
            // Spawn new obstacles at interval
            this.frameCount++;
            if (this.frameCount >= this.spawnInterval) {
                this.spawnObstacle();
                this.frameCount = 0;
                
                // Randomize next spawn interval
                this.spawnInterval = Math.floor(Math.random() * (this.maxGap - this.minGap) + this.minGap) * 60;
                
                // Sometimes spawn a sequence of obstacles
                if (Math.random() < 0.3) {
                    // Schedule additional obstacles for an obstacle "pattern"
                    setTimeout(() => this.spawnObstacle(), 300);
                    if (Math.random() < 0.5) {
                        setTimeout(() => this.spawnObstacle(), 600);
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
                
                // Scale effect as obstacles approach (feeling of speed)
                const distanceToPlayer = obstacle.mesh.position.z;
                if (distanceToPlayer > 0 && distanceToPlayer < 2) {
                    const scaleFactor = 1 + (1 - distanceToPlayer / 2) * 0.1;
                    obstacle.mesh.scale.set(scaleFactor, scaleFactor, scaleFactor);
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
        } catch (error) {
            console.error('Error resetting obstacles:', error);
        }
    }
}