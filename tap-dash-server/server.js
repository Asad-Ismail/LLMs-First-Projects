const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;
const MAX_PLAYERS = 10;

let players = {};
let serverStartTime = Date.now(); // Record server start time

// Add a reset-scores endpoint to clear high scores
app.get('/api/reset-scores', (req, res) => {
    // Add a script to the HTML that will clear localStorage scores
    const resetScript = `
        <script>
            localStorage.removeItem('tapDashHighScore');
            localStorage.removeItem('tapDashPlayerName');
            console.log('High scores have been reset');
            document.write('High scores have been reset. <a href="/tap-dash">Return to game</a>');
        </script>
    `;
    res.send(resetScript);
});

app.use(express.static('public')); // Serve the game files from 'public' directory

// Modify the tap-dash route to include server start time
app.get('/tap-dash', (req, res) => {
    // Read the index.html file
    fs.readFile(path.join(__dirname, 'public', 'index.html'), 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading index.html:', err);
            return res.status(500).send('Error loading game');
        }

        // Insert script to check server start time and reset scores if needed
        const scriptTag = `
        <script>
            // Server started at ${serverStartTime}
            const lastServerTime = localStorage.getItem('tapDashServerTime') || 0;
            const currentServerTime = ${serverStartTime};
            
            if (currentServerTime > lastServerTime) {
                // Server has been restarted, reset scores
                localStorage.removeItem('tapDashHighScore');
                localStorage.removeItem('tapDashPlayerName');
                console.log('Server restarted, high scores have been reset');
            }
            
            // Save current server time
            localStorage.setItem('tapDashServerTime', currentServerTime);
        </script>
        `;
        
        // Insert the script right before the closing </head> tag
        const modifiedData = data.replace('</head>', scriptTag + '</head>');
        
        res.send(modifiedData);
    });
});

io.on('connection', (socket) => {
    if (Object.keys(players).length >= MAX_PLAYERS) {
        socket.emit('serverFull');
        socket.disconnect();
        return;
    }

    console.log('A user connected:', socket.id);

    socket.on('join', (username) => {
        players[socket.id] = {
            username: username.slice(0, 20), // Limit to 20 characters
            score: 0,
            maxScore: 0,
            position: { x: 0, y: 0.5, z: 0 },
            active: true // Add active state flag
        };
        io.emit('players', players);
    });

    socket.on('update', (data) => {
        if (players[socket.id]) {
            players[socket.id].position = data.position;
            players[socket.id].score = data.score;
            players[socket.id].active = data.active !== undefined ? data.active : true; // Update active state
            if (data.score > players[socket.id].maxScore) {
                players[socket.id].maxScore = data.score;
            }
            io.emit('players', players);
        }
    });

    socket.on('disconnect', () => {
        delete players[socket.id];
        io.emit('players', players);
        console.log('User disconnected:', socket.id);
    });
});

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});