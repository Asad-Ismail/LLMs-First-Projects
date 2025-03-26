FROM node:18-alpine

WORKDIR /app

# Create package.json and install dependencies
RUN npm init -y && \
    npm install express socket.io

# Copy the application code
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# Command to run the app
CMD ["node", "server.js"]
