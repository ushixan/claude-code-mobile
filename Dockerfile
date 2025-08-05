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

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

# Start server
CMD ["npm", "run", "start"]