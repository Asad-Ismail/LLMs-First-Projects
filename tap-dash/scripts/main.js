/**
 * Main entry point for Tap Dash
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing game');
    
    // Show console debug message for the UI state
    const startScreen = document.getElementById('start-screen');
    console.log('Start screen initial state:', { 
        exists: !!startScreen,
        classes: startScreen ? startScreen.classList : 'not found',
        visibility: startScreen ? startScreen.style.display : 'not found'
    });
    
    // Add click feedback effect
    document.addEventListener('click', (e) => {
        const feedback = document.createElement('div');
        feedback.classList.add('click-feedback');
        feedback.style.left = `${e.pageX}px`;
        feedback.style.top = `${e.pageY}px`;
        document.body.appendChild(feedback);
        
        // Remove after animation completes
        setTimeout(() => {
            document.body.removeChild(feedback);
        }, 500);
    });
    
    // Prevent scrolling on touch devices
    document.body.addEventListener('touchmove', (e) => {
        if (e.target.tagName !== 'INPUT') {
            e.preventDefault();
        }
    }, { passive: false });
    
    // Ensure DOM is fully loaded before creating game
    setTimeout(() => {
        try {
            // Initialize the game
            window.game = new Game();
            console.log('Game initialized successfully');
            
            // Load and display high score
            loadHighScore();
            
            // Add fallback button handlers
            addFallbackHandlers();
            
            // Hide controls hint after 5 seconds
            setTimeout(() => {
                const controlsHint = document.getElementById('controls-hint');
                if (controlsHint) {
                    controlsHint.style.opacity = '0';
                    setTimeout(() => {
                        controlsHint.style.display = 'none';
                    }, 1000);
                }
            }, 5000);
        } catch (error) {
            console.error('Error initializing game:', error);
        }
    }, 100); // Short delay to ensure everything is ready
});

// Add fallback handlers for buttons
function addFallbackHandlers() {
    // Start button fallback
    const startButton = document.getElementById('start-button');
    if (startButton) {
        startButton.onclick = function(e) {
            console.log('Start button clicked (fallback handler)');
            e.stopPropagation();
            
            // Flash the button to provide feedback
            startButton.style.backgroundColor = '#7799ff';
            setTimeout(() => {
                startButton.style.backgroundColor = '';
            }, 200);
            
            if (window.game) {
                window.game.startGame();
            } else {
                console.error('Game instance not available');
                // Try to recreate game
                window.game = new Game();
                setTimeout(() => window.game.startGame(), 100);
            }
            return false;
        };
    }
    
    // Direct click handler on the entire document as last resort
    document.addEventListener('click', function(e) {
        if (!window.game) return;
        
        console.log('Document clicked at', e.clientX, e.clientY);
        if (!window.game.isRunning) {
            const startScreen = document.getElementById('start-screen');
            if (startScreen && !startScreen.classList.contains('hidden')) {
                console.log('Starting game via document click');
                window.game.startGame();
            }
        }
    });
    
    // Space key as fallback
    document.addEventListener('keydown', function(e) {
        if (e.code === 'Space' && window.game) {
            console.log('Space key pressed (fallback handler)');
            if (!window.game.isRunning) {
                window.game.startGame();
            } else {
                window.game.handleTap();
            }
        }
    });
}

// High score management
function loadHighScore() {
    const highScore = localStorage.getItem('tapDashHighScore') || 0;
    const highScoreElement = document.getElementById('high-score');
    if (highScoreElement) {
        highScoreElement.textContent = `Best: ${highScore}`;
    }
    return parseInt(highScore);
}

function saveHighScore(score) {
    const currentHighScore = loadHighScore();
    if (score > currentHighScore) {
        localStorage.setItem('tapDashHighScore', score);
        
        const highScoreElement = document.getElementById('high-score');
        if (highScoreElement) {
            highScoreElement.textContent = `Best: ${score}`;
        }
        
        const highScoreMessage = document.getElementById('high-score-message');
        if (highScoreMessage) {
            highScoreMessage.classList.remove('hidden');
        }
        
        return true;
    }
    return false;
}

// Ensure the updateScoreDisplay function is defined and works
function updateScoreDisplay(score) {
    console.log('Updating score display:', score);
    
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

// Extend Game.gameOver to save high score
// We need to wait until Game is defined
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (typeof Game !== 'undefined') {
            const originalGameOver = Game.prototype.gameOver;
            
            Game.prototype.gameOver = function() {
                console.log('Game over extending with high score saving');
                
                // Save high score
                const isNewHighScore = saveHighScore(Math.floor(this.score));
                
                // Call the original gameOver method
                originalGameOver.call(this);
                
                // Show high score message if applicable
                const highScoreMessage = document.getElementById('high-score-message');
                if (highScoreMessage) {
                    if (isNewHighScore) {
                        highScoreMessage.classList.remove('hidden');
                    } else {
                        highScoreMessage.classList.add('hidden');
                    }
                }
            };
            
            console.log('Game.gameOver successfully extended');
        } else {
            console.error('Game class not defined, could not extend gameOver');
        }
    }, 200);
});