# Use Node.js with build tools
FROM node:18-alpine

# Install build dependencies for node-pty and terminal tools
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git \
    bash \
    coreutils \
    procps \
    ncurses

# Ensure bash is available at standard location
RUN ln -sf /bin/bash /usr/bin/bash 2>/dev/null || true

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY server/package*.json ./server/

# Install root dependencies
RUN npm install

# Install server dependencies
WORKDIR /app/server
RUN npm install

# Go back to app root
WORKDIR /app

# Copy source code
COPY . .

# Build frontend
RUN npm run build

# Set production environment
ENV NODE_ENV=production

# Expose port (Railway will override with its own PORT)
EXPOSE 8080

# Install wget for health check
RUN apk add --no-cache wget

# Copy start script
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

# Ensure we're in the right directory
WORKDIR /app

# Start the server using the start script
CMD ["/app/start.sh"]