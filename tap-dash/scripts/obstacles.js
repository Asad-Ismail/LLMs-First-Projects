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
            
            // ENHANCED: More cosmic, celestial colors that look menacing rather than cartoonish
            const colorOptions = [
                new THREE.Color(0x1a0033), // Deep space purple
                new THREE.Color(0x000a33), // Dark cosmic blue
                new THREE.Color(0x330019), // Dark nebula red
                new THREE.Color(0x331a00), // Dark cosmic amber
                new THREE.Color(0x001a1a), // Dark teal void
                new THREE.Color(0x120033), // Cosmic indigo
                new THREE.Color(0x331500), // Dark cosmic bronze
                new THREE.Color(0x290033)  // Dark cosmic magenta
            ];
            const obstacleColor = colorOptions[Math.floor(Math.random() * colorOptions.length)];
            
            if (selectedType.type === 'asteroid') {
                // Create more menacing asteroid using icosahedron geometry with sharp edges
                geometry = new THREE.IcosahedronGeometry(selectedType.width / 2, 1); // Lower detail for sharper appearance
                
                // Add some randomness to vertices to make it more menacing and jagged
                const positionAttribute = geometry.getAttribute('position');
                const vertex = new THREE.Vector3();
                
                for (let i = 0; i < positionAttribute.count; i++) {
                    vertex.fromBufferAttribute(positionAttribute, i);
                    
                    // Create more jagged, shard-like vertices
                    vertex.normalize().multiplyScalar(
                        selectedType.width/2 * (0.7 + Math.random() * 0.7)
                    );
                    
                    positionAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
                }
                
                // Ensure normals are updated
                geometry.computeVertexNormals();
                
                // Create asteroid texture
                const asteroidTexture = createAsteroidTexture();
                
                // More menacing, celestial asteroid types with darker base colors and glowing accents
                const asteroidTypes = [
                    {   // Dark obsidian with red cracks
                        color: 0x110000,
                        emissive: 0x880000,
                        emissiveIntensity: 0.4,
                    },
                    {   // Cosmic ice crystal with blue glow
                        color: 0x000011, 
                        emissive: 0x0033aa,
                        emissiveIntensity: 0.5,
                    },
                    {   // Dark void with purple energy
                        color: 0x110022,
                        emissive: 0x440088,
                        emissiveIntensity: 0.6,
                    },
                    {   // Ancient cosmic gold
                        color: 0x221100,
                        emissive: 0x553300,
                        emissiveIntensity: 0.4,
                    },
                    {   // Emerald void crystal
                        color: 0x001100,
                        emissive: 0x005522,
                        emissiveIntensity: 0.5,
                    }
                ];
                
                // Select a random asteroid type
                const asteroidType = asteroidTypes[Math.floor(Math.random() * asteroidTypes.length)];
                
                // Create material with more dramatic lighting and menacing glow
                material = new THREE.MeshStandardMaterial({
                    color: asteroidType.color,
                    emissive: asteroidType.emissive,
                    emissiveIntensity: asteroidType.emissiveIntensity,
                    roughness: 0.9,
                    metalness: 0.4,
                    flatShading: true,
                    map: asteroidTexture,
                });
                
                mesh = new THREE.Mesh(geometry, material);
                
                // Add eerie glow effect to all asteroids for a more menacing look
                const glowColor = new THREE.Color(asteroidType.emissive);
                const glowLight = new THREE.PointLight(glowColor, 0.6, 2.0);
                mesh.add(glowLight);
                
                // Add crystal spikes to 50% of asteroids
                if (Math.random() > 0.5) {
                    const spikeCount = 2 + Math.floor(Math.random() * 3); // Fewer spikes but more menacing
                    for (let i = 0; i < spikeCount; i++) {
                        const spikeGeometry = new THREE.ConeGeometry(0.08, 0.4, 4); // Sharper spikes
                        const spikeMaterial = new THREE.MeshStandardMaterial({
                            color: new THREE.Color(asteroidType.emissive).multiplyScalar(0.5),
                            emissive: glowColor,
                            emissiveIntensity: 0.9,
                            transparent: true,
                            opacity: 0.9
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
                
                // Ensure asteroid is positioned higher above ground
                mesh.position.set(xPosition, Math.max(selectedType.height / 2 + 0.2, 0.5), zPosition);
                
            } else if (selectedType.type === 'planet') {
                // Create a more menacing planet
                geometry = new THREE.SphereGeometry(selectedType.width / 2, 24, 24);
                
                // Darker, more ominous planet material with subtle glow
                material = new THREE.MeshPhongMaterial({
                    color: obstacleColor,
                    shininess: 25, // Lower shininess for more ominous look
                    specular: 0x222222, // Darker specular highlights
                    emissive: new THREE.Color(obstacleColor.getHex() + 0x222222).multiplyScalar(0.5)
                });
                
                mesh = new THREE.Mesh(geometry, material);
                
                // Ensure planet sits well above ground
                mesh.position.set(xPosition, Math.max(selectedType.height / 2 + 0.3, 1.0), zPosition);
                
                // Add darker atmosphere with subtle glow
                const atmosphere = new THREE.Mesh(
                    new THREE.SphereGeometry(selectedType.width / 2 * 1.15, 24, 24),
                    new THREE.MeshBasicMaterial({
                        color: new THREE.Color(obstacleColor.getHex() + 0x222222),
                        transparent: true,
                        opacity: 0.2,
                        side: THREE.BackSide
                    })
                );
                mesh.add(atmosphere);
                
                // Add rings to 70% of planets
                if (Math.random() > 0.3) {
                    // Wider, more prominent rings
                    const ringGeometry = new THREE.RingGeometry(
                        selectedType.width * 0.6, 
                        selectedType.width * 1.1, 
                        32
                    );
                    
                    // Glowing rings with more pronounced effect
                    const ringColor = new THREE.Color(obstacleColor.getHex() + 0x333333);
                    const ringMaterial = new THREE.MeshBasicMaterial({ 
                        color: ringColor,
                        side: THREE.DoubleSide,
                        transparent: true,
                        opacity: 0.7
                    });
                    
                    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
                    
                    // Position rings more horizontally
                    ring.rotation.x = Math.PI / 2 + (Math.random() - 0.5) * 0.3;
                    
                    // Ensure rings are positioned high enough to be fully visible
                    ring.position.y = 0.1;
                    
                    mesh.add(ring);
                    
                    // Add a smaller inner ring to 30% of ringed planets for extra menacing look
                    if (Math.random() > 0.7) {
                        const innerRingGeometry = new THREE.RingGeometry(
                            selectedType.width * 0.4, 
                            selectedType.width * 0.5, 
                            32
                        );
                        
                        const innerRingMaterial = new THREE.MeshBasicMaterial({ 
                            color: new THREE.Color(ringColor).multiplyScalar(1.3),
                            side: THREE.DoubleSide,
                            transparent: true,
                            opacity: 0.7
                        });
                        
                        const innerRing = new THREE.Mesh(innerRingGeometry, innerRingMaterial);
                        innerRing.rotation.x = ring.rotation.x + 0.2; // Slightly different angle
                        innerRing.position.y = 0.15; // Position it higher than outer ring
                        
                        mesh.add(innerRing);
                    }
                }
                
            } else if (selectedType.type === 'satellite') {
                // Redesign as a menacing alien spacecraft/sentinel
                
                // Base color from our cosmic palette
                const baseColor = obstacleColor;
                
                // More ominous main body shape
                const bodyGeometry = new THREE.CylinderGeometry(
                    selectedType.width / 5, 
                    selectedType.width / 3, 
                    selectedType.height * 1.2, 
                    6 // Hexagonal for more alien look
                );
                
                // Dark metallic material with subtle glow
                const bodyMaterial = new THREE.MeshPhongMaterial({
                    color: baseColor,
                    shininess: 70,
                    specular: 0x111111,
                    emissive: new THREE.Color(baseColor).multiplyScalar(0.4)
                });
                
                mesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
                
                // Ensure spacecraft is positioned horizontally
                mesh.rotation.z = Math.PI / 2;
                
                // Add menacing "eye" at the front that looks like it's scanning
                const eyeGeometry = new THREE.SphereGeometry(selectedType.width/6, 16, 16);
                const eyeColor = new THREE.Color(0xff1111); // Menacing red
                const eyeMaterial = new THREE.MeshPhongMaterial({
                    color: eyeColor,
                    emissive: eyeColor,
                    emissiveIntensity: 0.7,
                    shininess: 100
                });
                
                const eye = new THREE.Mesh(eyeGeometry, eyeMaterial);
                eye.position.set(selectedType.height/2 + 0.05, 0, 0);
                mesh.add(eye);
                
                // Add scanning beam light
                const scanLight = new THREE.SpotLight(
                    eyeColor,
                    1.0,
                    4,
                    Math.PI / 8,
                    0.5,
                    2
                );
                scanLight.position.copy(eye.position);
                scanLight.target.position.set(selectedType.height/2 + 2, 0, 0);
                mesh.add(scanLight);
                mesh.add(scanLight.target);
                
                // Add angular "wings" that look like dark energy collectors
                const wingGeometry = new THREE.BoxGeometry(
                    selectedType.width/3, 
                    selectedType.width * 1.2, 
                    selectedType.width/15
                );
                
                // Dark material with subtle glow edges
                const wingMaterial = new THREE.MeshPhongMaterial({
                    color: new THREE.Color(baseColor).multiplyScalar(0.7),
                    shininess: 50,
                    emissive: new THREE.Color(baseColor).multiplyScalar(0.2)
                });
                
                // Top wing with angle
                const topWing = new THREE.Mesh(wingGeometry, wingMaterial);
                topWing.position.set(0, selectedType.width/2, 0);
                topWing.rotation.z = Math.PI/12; // Angled slightly up
                mesh.add(topWing);
                
                // Bottom wing with angle
                const bottomWing = new THREE.Mesh(wingGeometry, wingMaterial);
                bottomWing.position.set(0, -selectedType.width/2, 0);
                bottomWing.rotation.z = -Math.PI/12; // Angled slightly down
                mesh.add(bottomWing);
                
                // Add engine glow at the back
                const engineGlow = new THREE.PointLight(
                    new THREE.Color(0x3355ff), // Cold blue engine
                    1.0,
                    2
                );
                engineGlow.position.set(-selectedType.height/2 - 0.1, 0, 0);
                mesh.add(engineGlow);
                
                // Add visual engine effect
                const engineGeometry = new THREE.ConeGeometry(
                    selectedType.width/6, 
                    0.3, 
                    8
                );
                const engineMaterial = new THREE.MeshPhongMaterial({
                    color: 0x0033aa,
                    emissive: 0x0033ff,
                    emissiveIntensity: 0.8,
                    transparent: true,
                    opacity: 0.8
                });
                const engine = new THREE.Mesh(engineGeometry, engineMaterial);
                engine.position.set(-selectedType.height/2 - 0.15, 0, 0);
                engine.rotation.z = -Math.PI/2; // Point backward
                mesh.add(engine);
                
                // Blinking animation for the lights and scanning effect
                const blinkLights = () => {
                    if (!mesh.parent) return; // Stop if removed from scene
                    
                    const time = Date.now() * 0.001;
                    const blinkValue = Math.abs(Math.sin(time * 2));
                    const scanValue = Math.abs(Math.sin(time));
                    
                    // Pulsing eye and scan light
                    eye.material.emissiveIntensity = 0.5 + blinkValue * 0.5;
                    scanLight.intensity = scanValue * 1.2;
                    
                    // Pulsing engine
                    engineGlow.intensity = 0.7 + blinkValue * 0.5;
                    engine.material.opacity = 0.6 + blinkValue * 0.4;
                    
                    requestAnimationFrame(blinkLights);
                };
                
                blinkLights();
                
                // Ensure spacecraft is positioned high enough above ground
                mesh.position.set(xPosition, Math.max(selectedType.width * 0.8, 1.0), zPosition);
                
            } else if (selectedType.type === 'wormhole') {
                // Create a more menacing cosmic void/wormhole
                geometry = new THREE.TorusGeometry(
                    selectedType.width / 2, 
                    selectedType.width / 8, 
                    16, 
                    100
                );
                
                // Dark void material with glowing edges
                material = new THREE.MeshPhongMaterial({
                    color: new THREE.Color(0x000000), // Black center
                    emissive: new THREE.Color(0x3300aa), // Purple blue glow
                    emissiveIntensity: 1.0,
                    shininess: 80,
                    specular: 0x222222,
                    transparent: true,
                    opacity: 0.9
                });
                
                mesh = new THREE.Mesh(geometry, material);
                
                // Orient to face the player
                mesh.rotation.x = Math.PI / 2;
                
                // Ensure wormhole is positioned higher above ground
                mesh.position.set(xPosition, Math.max(selectedType.width / 2 + 0.3, 1.0), zPosition);
                
                // Add central void effect
                const voidGeometry = new THREE.SphereGeometry(selectedType.width / 3, 16, 16);
                const voidMaterial = new THREE.MeshBasicMaterial({
                    color: 0x000000, // Pure black center
                    transparent: true,
                    opacity: 0.95
                });
                
                const voidCenter = new THREE.Mesh(voidGeometry, voidMaterial);
                mesh.add(voidCenter);
                
                // Add swirling energy around the void
                const energyGeometry = new THREE.RingGeometry(
                    selectedType.width / 6,
                    selectedType.width / 3,
                    24,
                    1
                );
                
                const energyMaterial = new THREE.MeshBasicMaterial({
                    color: 0x4400ff,
                    transparent: true,
                    opacity: 0.7,
                    side: THREE.DoubleSide
                });
                
                // Create multiple energy rings with different orientations
                for (let i = 0; i < 3; i++) {
                    const energyRing = new THREE.Mesh(energyGeometry, energyMaterial);
                    energyRing.rotation.set(
                        Math.random() * Math.PI,
                        Math.random() * Math.PI,
                        Math.random() * Math.PI
                    );
                    voidCenter.add(energyRing);
                    
                    // Store reference for animation
                    energyRing.userData.rotationSpeed = {
                        x: (Math.random() - 0.5) * 0.05,
                        y: (Math.random() - 0.5) * 0.05,
                        z: (Math.random() - 0.5) * 0.05
                    };
                }
                
                // Add pulsating animation for wormhole
                const pulseWormhole = () => {
                    if (!mesh.parent) return; // Stop if removed from scene
                    
                    const time = Date.now() * 0.001;
                    
                    // Shift colors through dark cosmic hues
                    material.emissive.setHSL(
                        (0.7 + Math.sin(time * 0.2) * 0.1) % 1, // Shift between deep blues and purples
                        0.8,
                        0.25 + Math.sin(time * 1.5) * 0.15
                    );
                    
                    // Pulse the void center
                    voidCenter.scale.set(
                        0.8 + Math.sin(time * 2) * 0.2,
                        0.8 + Math.sin(time * 2) * 0.2,
                        0.8 + Math.sin(time * 2) * 0.2
                    );
                    
                    // Rotate energy rings
                    voidCenter.children.forEach(ring => {
                        ring.rotation.x += ring.userData.rotationSpeed.x;
                        ring.rotation.y += ring.userData.rotationSpeed.y;
                        ring.rotation.z += ring.userData.rotationSpeed.z;
                    });
                    
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