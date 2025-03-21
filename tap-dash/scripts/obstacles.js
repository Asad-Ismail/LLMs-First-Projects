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
            
            // ENHANCED: More vibrant space-themed colors with a wider palette
            const colorOptions = [
                new THREE.Color(0x4466ff), // Blue 
                new THREE.Color(0xff5533), // Red-orange (Mars-like)
                new THREE.Color(0xaaddff), // Light blue (Earth-like)
                new THREE.Color(0xffcc44),  // Yellow-gold (Saturn-like)
                new THREE.Color(0x33ff88), // Bright teal (alien world)
                new THREE.Color(0xff44aa), // Pink (nebula-like)
                new THREE.Color(0x88ddff), // Cyan (ice planet)
                new THREE.Color(0xffaa22)  // Orange (gas giant)
            ];
            const obstacleColor = colorOptions[Math.floor(Math.random() * colorOptions.length)];
            
            if (selectedType.type === 'asteroid') {
                // Create irregular asteroid using icosahedron geometry with more detail
                geometry = new THREE.IcosahedronGeometry(selectedType.width / 2, 2); // Increased detail level
                
                // Add some randomness to vertices to make it more irregular
                const positionAttribute = geometry.getAttribute('position');
                const vertex = new THREE.Vector3();
                
                for (let i = 0; i < positionAttribute.count; i++) {
                    vertex.fromBufferAttribute(positionAttribute, i);
                    
                    // Apply more pronounced noise to vertex
                    vertex.normalize().multiplyScalar(
                        selectedType.width/2 * (0.7 + Math.random() * 0.6)
                    );
                    
                    positionAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
                }
                
                // Ensure normals are updated
                geometry.computeVertexNormals();
                
                // COMPLETELY REVAMPED: Much more colorful and interesting asteroid materials
                // Create a base texture for the asteroid using a procedural approach
                const asteroidTexture = createAsteroidTexture();
                
                // Choose from several space rock types with rich colors
                const asteroidTypes = [
                    {   // Copper/bronze asteroid
                        color: 0xcc7755,
                        emissive: 0x331100,
                        emissiveIntensity: 0.2,
                    },
                    {   // Blue ice asteroid
                        color: 0x77aadd, 
                        emissive: 0x113366,
                        emissiveIntensity: 0.3,
                    },
                    {   // Purple crystal asteroid
                        color: 0xaa55cc,
                        emissive: 0x550088,
                        emissiveIntensity: 0.4,
                    },
                    {   // Gold/mineral rich asteroid
                        color: 0xddbb44,
                        emissive: 0x553300,
                        emissiveIntensity: 0.2,
                    },
                    {   // Emerald/green asteroid
                        color: 0x55cc77,
                        emissive: 0x115522,
                        emissiveIntensity: 0.3,
                    }
                ];
                
                // Select a random asteroid type
                const asteroidType = asteroidTypes[Math.floor(Math.random() * asteroidTypes.length)];
                
                // Create material with more dramatic lighting and color
                material = new THREE.MeshStandardMaterial({
                    color: asteroidType.color,
                    emissive: asteroidType.emissive,
                    emissiveIntensity: asteroidType.emissiveIntensity,
                    roughness: 0.7,
                    metalness: 0.3,
                    flatShading: true,
                    map: asteroidTexture,
                });
                
                mesh = new THREE.Mesh(geometry, material);
                
                // Add a subtle glow effect to some asteroids (30% chance)
                if (Math.random() > 0.7) {
                    const glowColor = new THREE.Color(asteroidType.emissive);
                    const glowLight = new THREE.PointLight(glowColor, 0.5, 1.5);
                    mesh.add(glowLight);
                    
                    // Add crystal spikes to glowing asteroids
                    const spikeCount = 3 + Math.floor(Math.random() * 4);
                    for (let i = 0; i < spikeCount; i++) {
                        const spikeGeometry = new THREE.ConeGeometry(0.1, 0.3, 5);
                        const spikeMaterial = new THREE.MeshStandardMaterial({
                            color: glowColor,
                            emissive: glowColor,
                            emissiveIntensity: 0.8,
                            transparent: true,
                            opacity: 0.8
                        });
                        
                        const spike = new THREE.Mesh(spikeGeometry, spikeMaterial);
                        
                        // Position spike randomly on the asteroid surface
                        const theta = Math.random() * Math.PI * 2;
                        const phi = Math.random() * Math.PI;
                        const radius = selectedType.width / 2;
                        
                        spike.position.set(
                            radius * Math.sin(phi) * Math.cos(theta),
                            radius * Math.sin(phi) * Math.sin(theta),
                            radius * Math.cos(phi)
                        );
                        
                        // Orient spike to point outward
                        spike.lookAt(0, 0, 0);
                        spike.rotateX(Math.PI); // Flip to point outward
                        
                        mesh.add(spike);
                    }
                }
                
                mesh.rotation.set(
                    Math.random() * Math.PI, 
                    Math.random() * Math.PI,
                    Math.random() * Math.PI
                );
                
                // Make sure asteroid is positioned well above ground
                mesh.position.set(xPosition, Math.max(selectedType.height / 2, 0.3), zPosition);
                
            } else if (selectedType.type === 'planet') {
                // Create a planet with rings
                geometry = new THREE.SphereGeometry(selectedType.width / 2, 24, 24);
                
                // IMPROVED: More interesting planet material with glow
                material = new THREE.MeshPhongMaterial({
                    color: obstacleColor,
                    shininess: 50,
                    specular: 0xffffff,
                    emissive: new THREE.Color(obstacleColor).multiplyScalar(0.2)
                });
                
                mesh = new THREE.Mesh(geometry, material);
                
                // FIXED: Ensure planet sits well above ground with extra clearance
                // Increase the minimum height to ensure rings don't clip ground
                mesh.position.set(xPosition, Math.max(selectedType.height / 2, 0.7), zPosition);
                
                // Add atmosphere glow to planets
                const atmosphere = new THREE.Mesh(
                    new THREE.SphereGeometry(selectedType.width / 2 * 1.1, 24, 24),
                    new THREE.MeshBasicMaterial({
                        color: new THREE.Color(obstacleColor).multiplyScalar(1.2),
                        transparent: true,
                        opacity: 0.3,
                        side: THREE.BackSide
                    })
                );
                mesh.add(atmosphere);
                
                // Add rings to some planets (50% chance)
                if (Math.random() > 0.5) {
                    const ringGeometry = new THREE.RingGeometry(
                        selectedType.width * 0.6, 
                        selectedType.width * 0.9, 
                        32
                    );
                    
                    // IMPROVED: More vibrant ring material with better visibility
                    const ringMaterial = new THREE.MeshBasicMaterial({ 
                        color: new THREE.Color(obstacleColor).multiplyScalar(1.5),
                        side: THREE.DoubleSide,
                        transparent: true,
                        opacity: 0.8
                    });
                    
                    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
                    
                    // FIXED: Position rings to be more horizontal and never below ground
                    ring.rotation.x = Math.PI / 2 + (Math.random() - 0.5) * 0.5; // Less tilt variation
                    
                    // Add a small vertical offset to ensure rings are visible and above ground
                    // Modify this if the rings are still appearing below the ground
                    ring.position.y = 0.05;
                    
                    mesh.add(ring);
                }
                
            } else if (selectedType.type === 'satellite') {
                // REDESIGNED: Transform satellites into colorful space stations or spaceships
                
                // Base color will be from our vibrant palette instead of gray
                const baseColor = obstacleColor;
                
                // Create a more interesting main body
                const bodyGeometry = new THREE.CylinderGeometry(
                    selectedType.width / 4, 
                    selectedType.width / 6, 
                    selectedType.height, 
                    8
                );
                
                // Use the vibrant color for the body instead of gray
                const bodyMaterial = new THREE.MeshPhongMaterial({
                    color: baseColor,
                    shininess: 100,
                    specular: 0xffffff,
                    emissive: new THREE.Color(baseColor).multiplyScalar(0.3) // Stronger emissive glow
                });
                
                mesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
                
                // Give it a more spaceship-like orientation
                mesh.rotation.z = Math.PI / 2; // This makes it look more like a spaceship
                
                // Add distinctive "engine" glow at the back
                const engineGlow = new THREE.PointLight(
                    new THREE.Color(0x44ffff), // Cyan engine glow
                    1.0,
                    2
                );
                engineGlow.position.set(-selectedType.height/2 - 0.1, 0, 0);
                mesh.add(engineGlow);
                
                // Add engine visual
                const engineGeometry = new THREE.CylinderGeometry(
                    selectedType.width/8,
                    selectedType.width/10, 
                    0.2, 
                    16
                );
                const engineMaterial = new THREE.MeshPhongMaterial({
                    color: 0x88ffff,
                    emissive: 0x44ffff,
                    emissiveIntensity: 1.0,
                    shininess: 100
                });
                const engine = new THREE.Mesh(engineGeometry, engineMaterial);
                engine.position.set(-selectedType.height/2 - 0.1, 0, 0);
                engine.rotation.z = Math.PI/2;
                mesh.add(engine);
                
                // Add solar panels/wings with vibrant colors
                const panelGeometry = new THREE.BoxGeometry(
                    selectedType.width/4, 
                    selectedType.width, 
                    selectedType.width/20
                );
                
                // Use contrasting color for panels
                const hsl = {};
                baseColor.getHSL(hsl);
                const contrastColor = new THREE.Color().setHSL(
                    (hsl.h + 0.5) % 1.0, // Opposite hue
                    hsl.s,
                    hsl.l
                );
                
                const panelMaterial = new THREE.MeshPhongMaterial({
                    color: contrastColor,
                    shininess: 100,
                    emissive: contrastColor.clone().multiplyScalar(0.3),
                    specular: 0xffffff
                });
                
                // Top wing/panel
                const topPanel = new THREE.Mesh(panelGeometry, panelMaterial);
                topPanel.position.set(0, selectedType.width/2, 0);
                mesh.add(topPanel);
                
                // Bottom wing/panel
                const bottomPanel = new THREE.Mesh(panelGeometry, panelMaterial);
                bottomPanel.position.set(0, -selectedType.width/2, 0);
                mesh.add(bottomPanel);
                
                // Add cockpit/command module at front
                const cockpitGeometry = new THREE.SphereGeometry(
                    selectedType.width/5,
                    16,
                    16
                );
                const cockpitMaterial = new THREE.MeshPhongMaterial({
                    color: 0x88ccff,
                    shininess: 150,
                    transparent: true,
                    opacity: 0.9,
                    specular: 0xffffff
                });
                const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
                cockpit.position.set(selectedType.height/2, 0, 0);
                mesh.add(cockpit);
                
                // Add blinking navigation lights
                const navLight1 = new THREE.PointLight(0xff0000, 1, 2); // Red light
                navLight1.position.set(0, selectedType.width/2, 0);
                mesh.add(navLight1);
                
                const navLight2 = new THREE.PointLight(0x00ff00, 1, 2); // Green light
                navLight2.position.set(0, -selectedType.width/2, 0);
                mesh.add(navLight2);
                
                // Blinking animation for the lights
                const blinkLights = () => {
                    if (!mesh.parent) return; // Stop if removed from scene
                    
                    const blinkValue = Math.abs(Math.sin(Date.now() * 0.005));
                    navLight1.intensity = blinkValue;
                    navLight2.intensity = blinkValue * 0.8;
                    engineGlow.intensity = 0.7 + blinkValue * 0.5; // Pulsing engine
                    
                    requestAnimationFrame(blinkLights);
                };
                
                blinkLights();
                
                // FIXED: Ensure spaceship is well above ground
                mesh.position.set(xPosition, Math.max(selectedType.width * 0.6, 0.8), zPosition);
                
            } else if (selectedType.type === 'wormhole') {
                // Create a wormhole using torus geometry
                geometry = new THREE.TorusGeometry(
                    selectedType.width / 2, 
                    selectedType.width / 10, 
                    16, 
                    100
                );
                
                // IMPROVED: More vibrant glowing wormhole material
                material = new THREE.MeshPhongMaterial({
                    color: new THREE.Color(0x6633ff),
                    emissive: new THREE.Color(0x3322aa),
                    emissiveIntensity: 1.0,
                    shininess: 100,
                    specular: 0xffffff,
                    transparent: true,
                    opacity: 0.8
                });
                
                mesh = new THREE.Mesh(geometry, material);
                
                // Orient to face the player
                mesh.rotation.x = Math.PI / 2;
                
                // FIXED: Ensure wormhole is positioned higher above ground
                mesh.position.set(xPosition, Math.max(selectedType.width / 2, 0.9), zPosition);
                
                // Add central glow effect
                const glowGeometry = new THREE.SphereGeometry(selectedType.width / 4, 16, 16);
                const glowMaterial = new THREE.MeshBasicMaterial({
                    color: 0x9966ff,
                    transparent: true,
                    opacity: 0.7
                });
                
                const glow = new THREE.Mesh(glowGeometry, glowMaterial);
                mesh.add(glow);
                
                // Add pulsating animation for wormhole
                const pulseWormhole = () => {
                    if (!mesh.parent) return; // Stop if removed from scene
                    
                    const time = Date.now() * 0.001;
                    material.emissive.setHSL(
                        (time * 0.1) % 1, 
                        0.7, 
                        0.35 + Math.sin(time * 2) * 0.15
                    );
                    
                    // Also pulse the central glow
                    glow.scale.set(
                        1 + Math.sin(time * 3) * 0.2,
                        1 + Math.sin(time * 3) * 0.2,
                        1 + Math.sin(time * 3) * 0.2
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
            
            // Add enhanced lighting to make obstacles more visible
            // This helps prevent "gray" appearance due to insufficient lighting
            if (mesh) {
                const obstacleLight = new THREE.PointLight(
                    obstacleColor, 
                    0.6,  // Intensity 
                    3     // Distance
                );
                obstacleLight.position.set(0, 0, 0);
                mesh.add(obstacleLight);
            }
            
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
                
                // ADDED: Ensure obstacles don't sink below ground
                // This is a failsafe in case any animations cause them to go below ground
                const minHeight = (obstacle.type === 'planet') ? 0.7 : 
                                 (obstacle.type === 'satellite') ? 0.6 : 0.3;
                
                if (obstacle.mesh.position.y < minHeight) {
                    obstacle.mesh.position.y = minHeight;
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

// Add this function at the bottom with the other helper functions
function createAsteroidTexture() {
    // Create a canvas for the texture
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    // Fill with base color
    ctx.fillStyle = '#555';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add noise and crater-like details
    for (let i = 0; i < 50; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const radius = 5 + Math.random() * 20;
        
        // Create gradient for crater
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        
        // Randomize crater appearance
        if (Math.random() > 0.5) {
            // Darker crater
            gradient.addColorStop(0, 'rgba(40, 40, 40, 0.8)');
            gradient.addColorStop(0.5, 'rgba(70, 70, 70, 0.5)');
            gradient.addColorStop(1, 'rgba(120, 120, 120, 0)');
        } else {
            // Lighter crater/bump
            gradient.addColorStop(0, 'rgba(180, 180, 180, 0.8)');
            gradient.addColorStop(0.5, 'rgba(140, 140, 140, 0.5)');
            gradient.addColorStop(1, 'rgba(100, 100, 100, 0)');
        }
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Add some sparkling mineral veins
    ctx.strokeStyle = 'rgba(220, 220, 220, 0.5)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 10; i++) {
        const x1 = Math.random() * canvas.width;
        const y1 = Math.random() * canvas.height;
        const x2 = x1 + (Math.random() - 0.5) * 100;
        const y2 = y1 + (Math.random() - 0.5) * 100;
        
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }
    
    // Create THREE.js texture from canvas
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    
    return texture;
}