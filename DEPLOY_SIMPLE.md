# Easy Deployment Guide

## Option 1: Railway (Recommended - 2 minutes)

Railway automatically detects your app structure and deploys everything.

1. **Go to** [railway.app](https://railway.app) and sign up with GitHub

2. **New Project** → **Deploy from GitHub repo** → Select this repository

3. **That's it!** Railway will:
   - Detect it's a Node.js app
   - Run the build commands automatically
   - Deploy your app
   - Give you a URL like `https://mobile-terminal-ide-production.up.railway.app`

4. **Access your app** from anywhere using the Railway URL

## Option 2: Render (3 minutes)

1. **Go to** [render.com](https://render.com) and sign up with GitHub

2. **New** → **Web Service** → Connect your GitHub repo

3. **Settings**:
   - Build Command: `npm install && npm run build && cd server && npm install`
   - Start Command: `cd server && NODE_ENV=production npm start`
   - Environment Variables: `NODE_ENV=production`

4. **Deploy** and get your URL

## Option 3: Local Network Access (1 minute)

For quick testing on your local network:

1. **Find your computer's IP**:
   ```bash
   # Mac/Linux
   ifconfig | grep "inet " | grep -v 127.0.0.1
   
   # Windows
   ipconfig | findstr IPv4
   ```

2. **Start the app**:
   ```bash
   npm run dev:all
   ```

3. **Access from any device on your network**:
   - From iPhone: `http://YOUR_IP:5173`
   - From another computer: `http://YOUR_IP:5173`

## Which Option to Choose?

- **Railway**: Best for permanent deployment, free tier available
- **Render**: Good alternative, also has free tier
- **Local Network**: Quick testing, no internet required

## After Deployment

Once deployed, your app will be available at the provided URL and you can:
- Access it from your iPhone anywhere with internet
- Use all terminal features with Claude Code CLI
- Share it with others
- Add it to your iPhone home screen as a PWA

The terminal will work exactly the same as locally, but now accessible from anywhere!