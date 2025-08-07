#!/bin/sh
# Startup script for Railway deployment

echo "Starting Mobile Terminal IDE server..."
echo "Current directory: $(pwd)"
echo "Node version: $(node --version)"
echo "Environment: $NODE_ENV"
echo "Port: $PORT"

# Start the server
exec node /app/server/index.js