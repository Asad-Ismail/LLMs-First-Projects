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

// Check collision between player and obstacle
function checkCollision(playerPosition, obstaclePosition, playerSize, obstacleSize) {
    // Simple box collision
    return Math.abs(playerPosition.x - obstaclePosition.x) < (playerSize.x + obstacleSize.x) / 2 &&
           Math.abs(playerPosition.y - obstaclePosition.y) < (playerSize.y + obstacleSize.y) / 2 &&
           Math.abs(playerPosition.z - obstaclePosition.z) < (playerSize.z + obstacleSize.z) / 2;
}

// Update UI score display
function updateScoreDisplay(score) {
    document.getElementById('score').textContent = `Score: ${score}`;
    document.getElementById('final-score').textContent = score;
}