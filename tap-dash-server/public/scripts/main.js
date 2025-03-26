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
            if (document.body.contains(feedback)) {
                document.body.removeChild(feedback);
            }
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
            
            // Ensure high score display is updated with player name
            if (window.game.updateHighScoreDisplay) {
                window.game.updateHighScoreDisplay();
            }
            
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

            // ADDED: Debug checker to ensure THREE.js is properly loaded
            console.log('THREE.js availability check:', {
                threeLoaded: window.threeLoaded,
                threeExists: typeof THREE !== 'undefined',
                sceneAvailable: typeof THREE !== 'undefined' && typeof THREE.Scene === 'function'
            });
        } catch (error) {
            console.error('Error initializing game:', error);
            // ADDED: Show user-friendly error and retry option
            showErrorScreen();
        }
    }, 100); // Short delay to ensure everything is ready
});

// ADDED: Error handling screen
function showErrorScreen() {
    try {
        const errorDiv = document.createElement('div');
        errorDiv.style.position = 'absolute';
        errorDiv.style.top = '0';
        errorDiv.style.left = '0';
        errorDiv.style.width = '100%';
        errorDiv.style.height = '100%';
        errorDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        errorDiv.style.color = 'white';
        errorDiv.style.fontSize = '18px';
        errorDiv.style.padding = '20px';
        errorDiv.style.boxSizing = 'border-box';
        errorDiv.style.zIndex = '1000';
        errorDiv.style.display = 'flex';
        errorDiv.style.flexDirection = 'column';
        errorDiv.style.justifyContent = 'center';
        errorDiv.style.alignItems = 'center';
        errorDiv.style.textAlign = 'center';
        
        errorDiv.innerHTML = `
            <h2 style="color:#ff5555;margin-bottom:20px;">Game Loading Error</h2>
            <p>There was a problem loading the game components.</p>
            <p>This might be due to network issues or browser compatibility.</p>
            <button id="retry-button" style="background-color:#4466ff;color:white;border:none;padding:10px 20px;margin-top:20px;cursor:pointer;border-radius:5px;">Retry</button>
        `;
        
        document.body.appendChild(errorDiv);
        
        // Add retry handler
        document.getElementById('retry-button').addEventListener('click', () => {
            document.body.removeChild(errorDiv);
            location.reload();
        });
    } catch (e) {
        console.error('Error showing error screen:', e);
        alert('Game failed to load. Please refresh the page to try again.');
    }
}

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
    
    // Restart button fallback
    const restartButton = document.getElementById('restart-button');
    if (restartButton) {
        restartButton.onclick = function(e) {
            console.log('Restart button clicked (fallback handler)');
            e.stopPropagation();
            
            if (window.game) {
                console.log('Restarting game via direct click');
                window.game.restartGame();
            } else {
                console.error('Game instance not available for restart');
                location.reload(); // Fallback to page reload
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
            
            // Check if game over screen is visible
            const gameOverScreen = document.getElementById('game-over');
            if (gameOverScreen && gameOverScreen.style.display !== 'none' && !gameOverScreen.classList.contains('hidden')) {
                console.log('Game over screen is visible, restarting game');
                // Explicitly hide game over screen
                gameOverScreen.style.display = 'none';
                gameOverScreen.classList.add('hidden');
                
                // Restart the game
                window.game.restartGame();
                return;
            }
            
            // Normal game flow
            if (!window.game.isRunning) {
                window.game.startGame();
            } else if (window.game.gameStarted) {
                window.game.handleTap();
            }
        }
    });
    
    // ADDED: Escape key to pause game
    document.addEventListener('keydown', function(e) {
        if (e.code === 'Escape' && window.game && window.game.isRunning) {
            console.log('Escape key pressed - toggle pause');
            if (window.game.togglePause) {
                window.game.togglePause();
            }
        }
    });
}

// Handle window focus/blur via the game class directly
// The game itself will handle browser switching internally
// For older browsers/compatibility, these handlers remain as a fallback
window.addEventListener('blur', () => {
    if (!window.game || !window.game.windowFocused) return;
    console.log('Window blur fallback handler');
    
    if (window.game && window.game.handleBlur) {
        window.game.handleBlur();
    }
});

window.addEventListener('focus', () => {
    if (!window.game) return;
    console.log('Window focus fallback handler');
    
    if (window.game && window.game.handleFocus) {
        window.game.handleFocus();
    }
});

// Handle orientation change on mobile devices
window.addEventListener('orientationchange', () => {
    setTimeout(() => {
        if (window.game && window.game.handleResize) {
            window.game.handleResize();
        }
    }, 200);
});

// ADDED: Check for Three.js availability
function checkThreeAvailability() {
    if (typeof THREE === 'undefined') {
        console.error('THREE.js is not defined!');
        return false;
    }
    
    if (typeof THREE.Scene !== 'function') {
        console.error('THREE.Scene is not available!');
        return false;
    }
    
    console.log('THREE.js appears to be properly loaded');
    return true;
}

// ADDED: Function to retry initialization with fallback mock if needed
window.retryGameInitialization = function() {
    if (window.game) {
        console.log('Game already initialized, no need to retry');
        return;
    }
    
    console.log('Attempting to retry game initialization');
    
    if (!checkThreeAvailability()) {
        console.log('THREE.js not available, creating mock');
        createThreeMock();
    }
    
    try {
        window.game = new Game();
        console.log('Game successfully initialized on retry');
    } catch (error) {
        console.error('Retry initialization failed:', error);
        showErrorScreen();
    }
};

// Safety check - if game fails to initialize within 5 seconds, show error
setTimeout(() => {
    if (!window.game) {
        console.error('Game failed to initialize within timeout');
        window.retryGameInitialization();
    }
}, 5000);