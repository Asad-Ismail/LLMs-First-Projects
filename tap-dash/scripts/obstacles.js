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
            // Space-themed obstacle types
            const obstacleTypes = [
                { type: 'asteroid', width: 1.2, height: 1.2, depth: 1.2 },
                { type: 'planet', width: 1.8, height: 1.8, depth: 1.8 },
                { type: 'satellite', width: 2.0, height: 0.5, depth: 0.5 },
                { type: 'wormhole', width: 1.5, height: 1.5, depth: 0.3 }
            ];
            
            // Select a random obstacle type
            const selectedType = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
            
            // Base position calculation
            const xPosition = (Math.random() - 0.5) * 8;
            const zPosition = -this.spawnDistance;
            
            // Create obstacle based on type
            let mesh;
            let geometry;
            let material;
            
            // Create space-themed colors
            const colorOptions = [
                new THREE.Color(0x4466ff), // Blue 
                new THREE.Color(0xff5533), // Red-orange (Mars-like)
                new THREE.Color(0xaaddff), // Light blue (Earth-like)
                new THREE.Color(0xffcc44)  // Yellow-gold (Saturn-like)
            ];
            const obstacleColor = colorOptions[Math.floor(Math.random() * colorOptions.length)];
            
            if (selectedType.type === 'asteroid') {
                // Create irregular asteroid using icosahedron geometry with noise
                geometry = new THREE.IcosahedronGeometry(selectedType.width / 2, 1);
                
                // Add some randomness to vertices to make it more irregular
                const positionAttribute = geometry.getAttribute('position');
                const vertex = new THREE.Vector3();
                
                for (let i = 0; i < positionAttribute.count; i++) {
                    vertex.fromBufferAttribute(positionAttribute, i);
                    
                    // Apply noise to vertex
                    vertex.normalize().multiplyScalar(
                        selectedType.width/2 * (0.8 + Math.random() * 0.4)
                    );
                    
                    positionAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
                }
                
                // Ensure normals are updated
                geometry.computeVertexNormals();
                
                // Create rocky material
                material = new THREE.MeshPhongMaterial({
                    color: new THREE.Color(0xaa8866),
                    shininess: 10,
                    flatShading: true,
                    specular: 0x333333
                });
                
                mesh = new THREE.Mesh(geometry, material);
                mesh.rotation.set(
                    Math.random() * Math.PI, 
                    Math.random() * Math.PI,
                    Math.random() * Math.PI
                );
                mesh.position.set(xPosition, selectedType.height / 2, zPosition);
                
            } else if (selectedType.type === 'planet') {
                // Create a planet with rings
                geometry = new THREE.SphereGeometry(selectedType.width / 2, 24, 24);
                
                // Create planet material with texture simulation
                material = new THREE.MeshPhongMaterial({
                    color: obstacleColor,
                    shininess: 30,
                    specular: 0xffffff
                });
                
                mesh = new THREE.Mesh(geometry, material);
                mesh.position.set(xPosition, selectedType.height / 2, zPosition);
                
                // Add rings to some planets (50% chance)
                if (Math.random() > 0.5) {
                    const ringGeometry = new THREE.RingGeometry(
                        selectedType.width * 0.6, 
                        selectedType.width * 0.9, 
                        32
                    );
                    
                    const ringMaterial = new THREE.MeshBasicMaterial({ 
                        color: new THREE.Color(obstacleColor).multiplyScalar(1.3),
                        side: THREE.DoubleSide,
                        transparent: true,
                        opacity: 0.7
                    });
                    
                    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
                    ring.rotation.x = Math.PI / 2;
                    mesh.add(ring);
                    
                    // Rotate ring slightly for better visual
                    ring.rotation.y = Math.random() * Math.PI / 4;
                }
                
            } else if (selectedType.type === 'satellite') {
                // Create a satellite with panels
                const bodyGeometry = new THREE.CylinderGeometry(
                    selectedType.width / 6, 
                    selectedType.width / 6, 
                    selectedType.height, 
                    8
                );
                
                const bodyMaterial = new THREE.MeshPhongMaterial({
                    color: 0xcccccc,
                    shininess: 80,
                    specular: 0xffffff
                });
                
                mesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
                mesh.rotation.x = Math.PI / 2; // Align horizontally
                
                // Add solar panels
                const panelGeometry = new THREE.BoxGeometry(
                    selectedType.width, 
                    selectedType.width / 10, 
                    selectedType.width / 2
                );
                
                const panelMaterial = new THREE.MeshPhongMaterial({
                    color: 0x3366ff,
                    shininess: 100,
                    specular: 0xffffff
                });
                
                const panels = new THREE.Mesh(panelGeometry, panelMaterial);
                mesh.add(panels);
                
                mesh.position.set(xPosition, selectedType.height / 2, zPosition);
                
            } else if (selectedType.type === 'wormhole') {
                // Create a wormhole using torus geometry
                geometry = new THREE.TorusGeometry(
                    selectedType.width / 2, 
                    selectedType.width / 10, 
                    16, 
                    100
                );
                
                // Create a shimmering material for the wormhole
                material = new THREE.MeshPhongMaterial({
                    color: new THREE.Color(0x6633ff),
                    emissive: new THREE.Color(0x3322aa),
                    shininess: 100,
                    specular: 0xffffff,
                    transparent: true,
                    opacity: 0.8
                });
                
                mesh = new THREE.Mesh(geometry, material);
                
                // Orient to face the player
                mesh.rotation.x = Math.PI / 2;
                mesh.position.set(xPosition, selectedType.height / 2, zPosition);
                
                // Add pulsating animation for wormhole
                const pulseWormhole = () => {
                    if (!mesh.parent) return; // Stop if removed from scene
                    
                    const time = Date.now() * 0.001;
                    material.emissive.setHSL(
                        (time * 0.1) % 1, 
                        0.5, 
                        0.2 + Math.sin(time * 2) * 0.1
                    );
                    
                    requestAnimationFrame(pulseWormhole);
                };
                
                pulseWormhole();
            }
            
            // Add custom update function for rotation
            mesh.userData.rotationSpeed = {
                x: (Math.random() - 0.5) * 0.01,
                y: (Math.random() - 0.5) * 0.01,
                z: (Math.random() - 0.5) * 0.01
            };
            
            mesh.userData.update = function() {
                // Directly reference the mesh to avoid 'this' issues
                mesh.rotation.x += mesh.userData.rotationSpeed.x;
                mesh.rotation.y += mesh.userData.rotationSpeed.y;
                mesh.rotation.z += mesh.userData.rotationSpeed.z;
            };
            
            this.scene.add(mesh);
            
            // Store obstacle data with its type for collision handling
            const obstacle = {
                mesh: mesh,
                type: selectedType.type,
                width: selectedType.width,
                height: selectedType.height,
                depth: selectedType.depth
            };
            
            this.obstacles.push(obstacle);
            
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
            // Move obstacles toward the player
            for (let i = this.obstacles.length - 1; i >= 0; i--) {
                const obstacle = this.obstacles[i];
                obstacle.mesh.position.z += this.obstacleSpeed;
                
                // Apply custom update logic if defined
                if (obstacle.mesh.userData.update) {
                    obstacle.mesh.userData.update();
                }
                
                // Remove obstacles that have passed the player
                if (obstacle.mesh.position.z > 5) {
                    this.scene.remove(obstacle.mesh);
                    this.obstacles.splice(i, 1);
                }
            }
            
            // Update frame counter for spawning
            this.frameCount++;
            
            // Generate new obstacles at interval if generation is enabled
            if (this.generatingObstacles && this.frameCount >= this.spawnInterval) {
                this.spawnObstacle();
                this.frameCount = 0;
                
                // Decrease spawn interval slightly over time for difficulty progression
                this.spawnInterval = Math.max(30, this.spawnInterval - 0.1);
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
                size: {
                    x: obstacle.width,
                    y: obstacle.height,
                    z: obstacle.depth
                },
                type: obstacle.type  // Include the type for specialized collision
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
    
    // Add this method to the ObstacleManager class to create special effects when obstacles are hit
    createCollisionEffect(obstacle) {
        try {
            // Check if obstacle has a mesh property or if it's from the simplified obstacle object
            let position;
            let color;
            
            if (obstacle.mesh && obstacle.mesh.position) {
                // This is the full obstacle object from this.obstacles array
                position = obstacle.mesh.position.clone();
                color = obstacle.mesh.material ? obstacle.mesh.material.color.clone() : new THREE.Color(0xff4444);
            } else if (obstacle.position) {
                // This is the simplified obstacle from getObstacles()
                position = new THREE.Vector3(obstacle.position.x, obstacle.position.y, obstacle.position.z);
                color = new THREE.Color(0xff4444); // Default color since we don't have the material
            } else {
                console.error('Invalid obstacle object in createCollisionEffect');
                return;
            }
            
            // Create explosion particles
            const particleCount = 20;
            const particles = [];
            
            for (let i = 0; i < particleCount; i++) {
                // Create smaller particles
                const size = 0.05 + Math.random() * 0.1;
                const geometry = new THREE.SphereGeometry(size, 8, 8);
                
                const material = new THREE.MeshBasicMaterial({
                    color: color,
                    transparent: true,
                    opacity: 0.8
                });
                
                const particle = new THREE.Mesh(geometry, material);
                
                // Position at obstacle position
                particle.position.set(position.x, position.y, position.z);
                
                // Add random velocity
                particle.userData.velocity = new THREE.Vector3(
                    (Math.random() - 0.5) * 0.2,
                    Math.random() * 0.2,
                    (Math.random() - 0.5) * 0.2
                );
                
                this.scene.add(particle);
                particles.push(particle);
            }
            
            // Add a flash light effect at collision point
            const flashLight = new THREE.PointLight(color, 2, 3);
            flashLight.position.set(position.x, position.y, position.z);
            this.scene.add(flashLight);
            
            // Animate explosion
            let age = 0;
            const animateExplosion = () => {
                age++;
                
                // Update particles
                for (const particle of particles) {
                    // Apply velocity and gravity
                    particle.position.add(particle.userData.velocity);
                    particle.userData.velocity.y -= 0.01; // gravity
                    
                    // Rotate particles for more dynamic effect
                    particle.rotation.x += 0.1;
                    particle.rotation.y += 0.1;
                    
                    // Fade out
                    if (particle.material) {
                        particle.material.opacity -= 0.02;
                    }
                }
                
                // Fade out light
                if (flashLight) {
                    flashLight.intensity -= 0.1;
                }
                
                if (age < 30 && particles.length > 0 && particles[0].material.opacity > 0) {
                    requestAnimationFrame(animateExplosion);
                } else {
                    // Clean up
                    for (const particle of particles) {
                        this.scene.remove(particle);
                    }
                    this.scene.remove(flashLight);
                }
            };
            
            animateExplosion();
            
        } catch (error) {
            console.error('Error creating collision effect:', error);
        }
    }
}

// Helper function to create a striped texture
function createStripedTexture(baseColor) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext('2d');
    
    // Convert Three.js color to CSS format
    const r = Math.floor(baseColor.r * 255);
    const g = Math.floor(baseColor.g * 255);
    const b = Math.floor(baseColor.b * 255);
    const baseColorCSS = `rgb(${r},${g},${b})`;
    
    // Darker version for stripes
    const darkerColorCSS = `rgb(${Math.floor(r*0.7)},${Math.floor(g*0.7)},${Math.floor(b*0.7)})`;
    
    // Create diagonal stripes
    context.fillStyle = baseColorCSS;
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    context.fillStyle = darkerColorCSS;
    const stripeWidth = 20;
    for (let i = -canvas.width; i < canvas.width*2; i += stripeWidth*2) {
        context.beginPath();
        context.moveTo(i, 0);
        context.lineTo(i + canvas.width, canvas.height);
        context.lineTo(i + canvas.width + stripeWidth, canvas.height);
        context.lineTo(i + stripeWidth, 0);
        context.closePath();
        context.fill();
    }
    
    // Create texture from canvas
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 1);
    
    return texture;
}

// Helper function to add highlight/glow effect to obstacles
function addHighlightEffect(mesh) {
    // Add subtle animation to the obstacle
    const originalY = mesh.position.y;
    
    // Create a subtle floating animation
    const animateFloating = () => {
        mesh.userData.floatingAngle = (mesh.userData.floatingAngle || 0) + 0.02;
        mesh.position.y = originalY + Math.sin(mesh.userData.floatingAngle) * 0.1;
        
        if (mesh.parent) { // Check if still in scene
            requestAnimationFrame(animateFloating);
        }
    };
    
    // Start animation
    animateFloating();
    
    // Add subtle rotation
    mesh.userData.rotationSpeed = {
        x: (Math.random() - 0.5) * 0.01,
        y: (Math.random() - 0.5) * 0.01,
        z: (Math.random() - 0.5) * 0.01
    };
    
    // Fixed update method - explicitly use mesh reference instead of 'this'
    mesh.userData.update = function() {
        // Directly reference the mesh object to avoid 'this' context issues
        mesh.rotation.x += mesh.userData.rotationSpeed.x;
        mesh.rotation.y += mesh.userData.rotationSpeed.y;
        mesh.rotation.z += mesh.userData.rotationSpeed.z;
    };
}