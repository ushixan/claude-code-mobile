#!/bin/sh

echo "========================================="
echo "Starting Mobile Terminal IDE Server"
echo "========================================="
echo "PORT: ${PORT:-8080}"
echo "NODE_ENV: ${NODE_ENV:-production}"
echo "Working Directory: $(pwd)"
echo "========================================="

# Check if the build exists (we're already in /app from WORKDIR)
if [ ! -d "dist" ]; then
  echo "ERROR: dist directory not found!"
  echo "Running build..."
  npm run build
fi

# Start the server
echo "Starting Node.js server..."
exec node server/index.js