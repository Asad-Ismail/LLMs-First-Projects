/**
 * Utility functions for the Tap Dash game
 */

// Generate a random color for trails
function getRandomColor() {
    const colors = [
        0xff5555, // red
        0x55ff55, // green
        0x5555ff, // blue
        0xffff55, // yellow
        0xff55ff, // purple
        0x55ffff  // cyan
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

// IMPROVED: Enhanced collision detection with better accuracy
function checkCollision(playerPosition, obstaclePosition, playerSize, obstacleSize) {
    // Calculate collision boundaries with a slightly smaller margin for better gameplay feel
    const playerHalfWidth = playerSize.x * 0.8 / 2;
    const playerHalfHeight = playerSize.y * 0.8 / 2;
    const playerHalfDepth = playerSize.z * 0.8 / 2;
    
    const obstacleHalfWidth = obstacleSize.x / 2;
    const obstacleHalfHeight = obstacleSize.y / 2;
    const obstacleHalfDepth = obstacleSize.z / 2;
    
    // Check for overlap in all three dimensions
    const overlapX = Math.abs(playerPosition.x - obstaclePosition.x) < (playerHalfWidth + obstacleHalfWidth);
    const overlapY = Math.abs(playerPosition.y - obstaclePosition.y) < (playerHalfHeight + obstacleHalfHeight);
    const overlapZ = Math.abs(playerPosition.z - obstaclePosition.z) < (playerHalfDepth + obstacleHalfDepth);
    
    return overlapX && overlapY && overlapZ;
}

// ADDED: Visualize collision boxes for debugging
function createCollisionBox(scene, position, size, color = 0xff0000, duration = 500) {
    try {
        const geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
        const material = new THREE.MeshBasicMaterial({
            color: color,
            wireframe: true,
            transparent: true,
            opacity: 0.5
        });
        
        const box = new THREE.Mesh(geometry, material);
        box.position.set(position.x, position.y, position.z);
        scene.add(box);
        
        // Remove after specified duration
        setTimeout(() => {
            scene.remove(box);
        }, duration);
        
        return box;
    } catch (error) {
        console.error('Error creating collision box:', error);
        return null;
    }
}

// Update UI score display with smooth animation
function updateScoreDisplay(score) {
    const scoreElement = document.getElementById('score');
    if (scoreElement) {
        scoreElement.textContent = `Score: ${score}`;
        
        // Add a visual highlight effect
        scoreElement.classList.add('score-highlight');
        setTimeout(() => {
            scoreElement.classList.remove('score-highlight');
        }, 300);
    }
    
    const finalScoreElement = document.getElementById('final-score');
    if (finalScoreElement) {
        finalScoreElement.textContent = score;
    }
    
    // Check if this is a new high score
    const currentHighScore = loadHighScore();
    if (score > currentHighScore) {
        const highScoreElement = document.getElementById('high-score');
        if (highScoreElement) {
            highScoreElement.textContent = `Best: ${score}`;
        }
    }
}

// ADDED: Create explosion effect at a given position
function createExplosion(scene, position, color = 0xff5555, particleCount = 30) {
    try {
        // Create explosion particles
        for (let i = 0; i < particleCount; i++) {
            const particle = new THREE.Mesh(
                new THREE.SphereGeometry(0.1, 8, 8),
                new THREE.MeshBasicMaterial({
                    color: color,
                    transparent: true,
                    opacity: 0.8
                })
            );
            
            // Position at explosion point
            particle.position.copy(position);
            
            // Random velocity
            particle.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 0.3,
                Math.random() * 0.3,
                (Math.random() - 0.5) * 0.3
            );
            
            // Add to scene
            scene.add(particle);
            
            // Animate and remove
            let lifetime = 0;
            const maxLife = 60;
            
            const animateParticle = () => {
                lifetime++;
                
                if (lifetime < maxLife) {
                    // Move according to velocity
                    particle.position.add(particle.velocity);
                    
                    // Apply gravity and drag
                    particle.velocity.y -= 0.01;
                    particle.velocity.multiplyScalar(0.98);
                    
                    // Fade out
                    particle.material.opacity = 0.8 * (1 - lifetime / maxLife);
                    
                    // Shrink
                    particle.scale.multiplyScalar(0.98);
                    
                    requestAnimationFrame(animateParticle);
                } else {
                    scene.remove(particle);
                }
            };
            
            animateParticle();
        }
        
        // Add a flash light at explosion point
        const light = new THREE.PointLight(color, 3, 5);
        light.position.copy(position);
        scene.add(light);
        
        // Fade out light
        let intensity = 3;
        const animateLight = () => {
            intensity *= 0.9;
            light.intensity = intensity;
            
            if (intensity > 0.1) {
                requestAnimationFrame(animateLight);
            } else {
                scene.remove(light);
            }
        };
        
        animateLight();
        
        return true;
    } catch (error) {
        console.error('Error creating explosion:', error);
        return false;
    }
}

// High score management functions
function loadHighScore() {
    const highScore = localStorage.getItem('tapDashHighScore') || 0;
    const playerName = localStorage.getItem('tapDashPlayerName') || '';
    
    const highScoreElement = document.getElementById('high-score');
    if (highScoreElement) {
        if (playerName) {
            highScoreElement.textContent = `Best: ${Math.floor(highScore)} (${playerName})`;
        } else {
            highScoreElement.textContent = `Best: ${Math.floor(highScore)}`;
        }
    }
    return parseInt(highScore);
}

function saveHighScore(score, playerName) {
    const currentHighScore = loadHighScore();
    if (score > currentHighScore) {
        localStorage.setItem('tapDashHighScore', score);
        
        // Save player name if provided
        if (playerName) {
            localStorage.setItem('tapDashPlayerName', playerName);
        }
        
        const highScoreElement = document.getElementById('high-score');
        if (highScoreElement) {
            if (playerName) {
                highScoreElement.textContent = `Best: ${Math.floor(score)} (${playerName})`;
            } else {
                highScoreElement.textContent = `Best: ${Math.floor(score)}`;
            }
        }
        
        const highScoreMessage = document.getElementById('high-score-message');
        if (highScoreMessage) {
            highScoreMessage.classList.remove('hidden');
        }
        
        return true;
    }
    return false;
}

// ADDED: Create a visual countdown display
function createCountdown(parent, duration = 3, onComplete = null) {
    try {
        // Create countdown element
        const countdownEl = document.createElement('div');
        countdownEl.className = 'countdown';
        countdownEl.textContent = duration;
        
        // Add to parent
        parent.appendChild(countdownEl);
        
        // Create instruction element
        const instructionEl = document.createElement('div');
        instructionEl.className = 'countdown-instruction';
        instructionEl.textContent = 'Get Ready!';
        parent.appendChild(instructionEl);
        
        // Start countdown
        let count = duration;
        const interval = setInterval(() => {
            count--;
            
            if (count > 0) {
                countdownEl.textContent = count;
                // Update instruction text
                if (count === 2) {
                    instructionEl.textContent = 'Tap to Jump! Use A/D or ←/→ to Move!';
                } else if (count === 1) {
                    instructionEl.textContent = 'Double-Tap for Double Jump!';
                }
            } else {
                // End countdown
                clearInterval(interval);
                parent.removeChild(countdownEl);
                parent.removeChild(instructionEl);
                
                // Call completion callback
                if (onComplete) onComplete();
            }
        }, 1000);
        
        return interval;
    } catch (error) {
        console.error('Error creating countdown:', error);
        // Still call the completion callback even if there was an error
        if (onComplete) onComplete();
        return null;
    }
}

// ADDED: Create a visual flash effect
function createScreenFlash(color = 'rgba(255, 0, 0, 0.3)', duration = 500) {
    try {
        const flash = document.createElement('div');
        flash.style.position = 'absolute';
        flash.style.top = '0';
        flash.style.left = '0';
        flash.style.width = '100%';
        flash.style.height = '100%';
        flash.style.backgroundColor = color;
        flash.style.pointerEvents = 'none';
        flash.style.zIndex = '100';
        document.body.appendChild(flash);
        
        // Fade out and remove
        setTimeout(() => {
            flash.style.transition = 'opacity 0.3s';
            flash.style.opacity = '0';
            setTimeout(() => {
                if (flash.parentNode) {
                    document.body.removeChild(flash);
                }
            }, 300);
        }, duration);
        
        return flash;
    } catch (error) {
        console.error('Error creating screen flash:', error);
        return null;
    }
}