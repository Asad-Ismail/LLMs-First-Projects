const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;
const MAX_PLAYERS = 10;

let players = {};

app.use(express.static('public')); // Serve the game files from 'public' directory

// Add a specific route for /tap-dash to serve the game
app.get('/tap-dash', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
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
            position: { x: 0, y: 0.5, z: 0 }
        };
        io.emit('players', players);
    });

    socket.on('update', (data) => {
        if (players[socket.id]) {
            players[socket.id].position = data.position;
            players[socket.id].score = data.score;
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