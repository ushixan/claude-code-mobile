# Simple Node.js Alpine image
FROM node:18-alpine

# Install build dependencies for node-pty
RUN apk add --no-cache python3 make g++ git bash

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY server/package*.json ./server/

# Install dependencies
RUN npm install

# Install server dependencies
WORKDIR /app/server
RUN npm install

# Go back to app root
WORKDIR /app

# Copy all source code
COPY . .

# Build the frontend
RUN npm run build

# Set production environment
ENV NODE_ENV=production

# Expose port
EXPOSE 8080

# Start the server - using shell form for compatibility
# This ensures it runs through /bin/sh and handles any edge cases
CMD node server/index.js