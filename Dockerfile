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

# Create a shell wrapper for cd command (Railway compatibility)
RUN echo '#!/bin/sh' > /usr/local/bin/cd && \
    echo 'builtin cd "$@"' >> /usr/local/bin/cd && \
    chmod +x /usr/local/bin/cd

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY server/package*.json ./server/

# Install root dependencies
RUN npm install

# Install server dependencies with rebuild for native modules
WORKDIR /app/server
RUN npm install && npm rebuild || true

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

# Start the server directly
CMD ["node", "server/index.js"]