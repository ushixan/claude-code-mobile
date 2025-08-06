#!/bin/sh

echo "========================================="
echo "Starting Mobile Terminal IDE Server"
echo "========================================="
echo "PORT: ${PORT:-8080}"
echo "NODE_ENV: ${NODE_ENV:-production}"
echo "Working Directory: $(pwd)"
echo "========================================="

# Ensure we're in the right directory
cd /app || exit 1

# Check if the build exists
if [ ! -d "dist" ]; then
  echo "ERROR: dist directory not found!"
  echo "Running build..."
  npm run build
fi

# Start the server
echo "Starting Node.js server..."
exec node server/index.js