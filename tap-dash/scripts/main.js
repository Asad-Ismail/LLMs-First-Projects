/**
 * Main entry point for Tap Dash
 */
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the game
    const game = new Game();
    
    // Prevent scrolling on touch devices
    document.body.addEventListener('touchmove', (e) => {
        if (e.target.tagName !== 'INPUT') {
            e.preventDefault();
        }
    }, { passive: false });
    
    // Load and display high score
    loadHighScore();
    
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
});

// High score management
function loadHighScore() {
    const highScore = localStorage.getItem('tapDashHighScore') || 0;
    document.getElementById('high-score').textContent = `Best: ${highScore}`;
    return parseInt(highScore);
}

function saveHighScore(score) {
    const currentHighScore = loadHighScore();
    if (score > currentHighScore) {
        localStorage.setItem('tapDashHighScore', score);
        document.getElementById('high-score').textContent = `Best: ${score}`;
        document.getElementById('high-score-message').classList.remove('hidden');
        return true;
    }
    return false;
}

// Override the updateScoreDisplay function to add high score functionality
function updateScoreDisplay(score) {
    document.getElementById('score').textContent = `Score: ${score}`;
    document.getElementById('final-score').textContent = score;
    
    // Check if this is a new high score
    const currentHighScore = loadHighScore();
    if (score > currentHighScore) {
        document.getElementById('high-score').textContent = `Best: ${score}`;
    }
    
    // Add a visual highlight effect for score changes
    const scoreElement = document.getElementById('score');
    scoreElement.classList.add('score-highlight');
    setTimeout(() => {
        scoreElement.classList.remove('score-highlight');
    }, 300);
}

// Extend Game.gameOver to save high score
const originalGameOver = Game.prototype.gameOver;
Game.prototype.gameOver = function() {
    // Save high score
    const isNewHighScore = saveHighScore(Math.floor(this.score));
    
    // Call the original gameOver method
    originalGameOver.call(this);
    
    // Show high score message if applicable
    if (isNewHighScore) {
        document.getElementById('high-score-message').classList.remove('hidden');
    } else {
        document.getElementById('high-score-message').classList.add('hidden');
    }
};