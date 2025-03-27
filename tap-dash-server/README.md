
### Deployment Steps
1. Install necessary dependencies:
   ```
   cd tap-dash-server
   sudo apt install npm nodejs
   npm init -y && npm install express socket.io
   ```

2. Start the server: 
   ```
   node server.js
   ```

3. Access the game at http://localhost:3000/tap-dash/ on multiple browsers/devices to test multiplayer functionality