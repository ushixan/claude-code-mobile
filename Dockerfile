# Simple single-stage build
FROM node:18-alpine

WORKDIR /app

# Copy all package files first
COPY package*.json ./
COPY server/package*.json ./server/

# Install all dependencies
RUN npm install
RUN cd server && npm install

# Copy source code
COPY . .

# Build frontend
RUN npm run build

# Expose ports
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

# Start backend server (frontend will be served by Express)  
CMD ["npm", "run", "start:prod"]