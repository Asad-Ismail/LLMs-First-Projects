/**
 * Multiplayer management for Tap Dash
 */
class MultiplayerManager {
    constructor(game) {
        this.game = game;
        this.socket = null;
        this.players = {};
        this.username = '';
        this.isConnected = false;
        this.otherPlayerMeshes = {};

        // DOM elements
        this.playersList = document.getElementById('players-ul');
        this.highScore = document.getElementById('high-score');

        // Initialize
        this.initializeSocket();
        this.setupEventListeners();
    }

    initializeSocket() {
        try {
            console.log('Initializing socket connection');
            this.socket = io();

            // Socket event handlers
            this.socket.on('connect', () => {
                console.log('Connected to server:', this.socket.id);
                this.isConnected = true;
            });

            this.socket.on('disconnect', () => {
                console.log('Disconnected from server');
                this.isConnected = false;
            });

            this.socket.on('serverFull', () => {
                alert('The server is full. Please try again later.');
            });

            this.socket.on('players', (players) => {
                this.players = players;
                this.updatePlayersList();
                this.updateOtherPlayerMeshes();
                
                // Still track high scores in the background, but don't update display
                this.updateGlobalHighScore();
            });
        } catch (error) {
            console.error('Error initializing socket:', error);
        }
    }

    setupEventListeners() {
        // Username input change/keyup handler to enable/disable start button
        const usernameInput = document.getElementById('username-input');
        const startButton = document.getElementById('start-button');
        
        if (usernameInput && startButton) {
            // Check username on input and enable/disable button
            usernameInput.addEventListener('input', () => {
                const username = usernameInput.value.trim();
                if (username) {
                    startButton.classList.remove('disabled');
                } else {
                    startButton.classList.add('disabled');
                }
            });
            
            // Handle Enter key on username input
            usernameInput.addEventListener('keyup', (e) => {
                if (e.key === 'Enter') {
                    const username = usernameInput.value.trim();
                    if (username) {
                        this.joinGame(username);
                    }
                }
            });
            
            // Handle start button click
            startButton.addEventListener('click', () => {
                const username = usernameInput.value.trim();
                if (username) {
                    this.joinGame(username);
                }
            });
        }
    }

    joinGame(username) {
        if (!this.isConnected) {
            console.warn('Not connected to server yet');
            return;
        }

        if (!username) {
            username = document.getElementById('username-input')?.value.trim();
        }
        
        if (!username) {
            alert('Please enter a username');
            return;
        }
        
        this.username = username;

        // Send username to server
        this.socket.emit('join', this.username);
        
        // Allow the game to start now
        if (this.game) {
            this.game.userJoined = true;
        }
    }

    updatePlayersList() {
        if (!this.playersList) return;

        // Clear current list
        this.playersList.innerHTML = '';

        // Add each player to the list
        Object.entries(this.players).forEach(([id, player]) => {
            const li = document.createElement('li');
            li.textContent = `${player.username} - Score: ${Math.floor(player.score)} - Best: ${Math.floor(player.maxScore)}`;
            
            // Highlight current player
            if (id === this.socket.id) {
                li.classList.add('current-player');
            }
            
            this.playersList.appendChild(li);
        });
    }

    updateGlobalHighScore() {
        if (!this.highScore) return;

        // Find player with highest maxScore from server
        let highestScore = 0;
        let topPlayer = '';

        Object.values(this.players).forEach(player => {
            if (player.maxScore > highestScore) {
                highestScore = player.maxScore;
                topPlayer = player.username;
            }
        });

        if (highestScore > 0) {
            // Compare with local high score and track it internally
            const localHighScore = parseInt(localStorage.getItem('tapDashHighScore') || '0');
            
            if (highestScore > localHighScore) {
                // Update local high score if server high score is higher
                localStorage.setItem('tapDashHighScore', highestScore);
                localStorage.setItem('tapDashPlayerName', topPlayer);
                console.log(`Updated local high score to ${highestScore} by ${topPlayer}`);
                
                // Only update the display at game over, not in real-time
                // We'll let the game.gameOver() method handle displaying
            }
        }
    }

    updateOtherPlayerMeshes() {
        // First, remove meshes for disconnected players
        Object.keys(this.otherPlayerMeshes).forEach(id => {
            if (!this.players[id] || id === this.socket.id) {
                if (this.otherPlayerMeshes[id] && this.game.scene) {
                    this.game.scene.remove(this.otherPlayerMeshes[id]);
                }
                delete this.otherPlayerMeshes[id];
            }
        });

        // Update or create meshes for other players
        Object.entries(this.players).forEach(([id, player]) => {
            // Skip current player and inactive players
            if (id === this.socket.id) return;

            // If player is inactive (game over), remove their mesh
            if (player.active === false) {
                if (this.otherPlayerMeshes[id] && this.game.scene) {
                    this.game.scene.remove(this.otherPlayerMeshes[id]);
                    delete this.otherPlayerMeshes[id];
                }
                return;
            }

            if (this.otherPlayerMeshes[id]) {
                // Update existing mesh
                this.otherPlayerMeshes[id].position.x = player.position.x;
                this.otherPlayerMeshes[id].position.y = player.position.y;
                this.otherPlayerMeshes[id].position.z = player.position.z;
            } else if (this.game.scene) {
                // Create new mesh for player
                const geometry = new THREE.SphereGeometry(0.3, 16, 16);
                const material = new THREE.MeshBasicMaterial({ 
                    color: 0xf0f4ff, 
                    transparent: true, 
                    opacity: 0.6 
                });
                const mesh = new THREE.Mesh(geometry, material);
                
                // Add player name label
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.width = 256;
                canvas.height = 64;
                context.font = 'Bold 24px Arial';
                context.fillStyle = 'white';
                context.textAlign = 'center';
                context.fillText(player.username, 128, 30);
                
                const texture = new THREE.CanvasTexture(canvas);
                const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
                const sprite = new THREE.Sprite(spriteMaterial);
                sprite.position.y = 0.7;
                sprite.scale.set(1, 0.25, 1);
                
                mesh.add(sprite);
                mesh.position.set(player.position.x, player.position.y, player.position.z);
                
                this.otherPlayerMeshes[id] = mesh;
                this.game.scene.add(mesh);
            }
        });
    }

    updateServer(data) {
        if (!this.isConnected || !this.socket) return;
        
        if (data) {
            // Use provided data
            this.socket.emit('update', data);
        } else if (this.game && this.game.player) {
            // Get data from game
            this.socket.emit('update', {
                position: this.game.player.position,
                score: this.game.score,
                active: this.game.isRunning && this.game.gameStarted
            });
        }
    }
} 