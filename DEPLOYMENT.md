# Deployment Guide

## Option 1: Railway (Recommended for Full-Stack)

Railway is perfect for this app because it handles both frontend and backend in one deployment.

### Steps:

1. **Create Railway Account**: Go to [railway.app](https://railway.app) and sign up

2. **Install Railway CLI**:
```bash
npm install -g @railway/cli
railway login
```

3. **Initialize Project**:
```bash
railway init
```

4. **Deploy**:
```bash
railway up
```

5. **Set Environment Variables** in Railway dashboard:
   - `NODE_ENV=production`
   - `PORT=3001`

6. **Update .env.production** with your Railway URL:
```bash
VITE_WS_URL=wss://your-app-name.railway.app
VITE_API_URL=https://your-app-name.railway.app
```

7. **Redeploy**:
```bash
railway up
```

## Option 2: Fly.io

1. **Install flyctl**: [fly.io/docs/hands-on/install-flyctl/](https://fly.io/docs/hands-on/install-flyctl/)

2. **Login**:
```bash
fly auth login
```

3. **Launch app**:
```bash
fly launch
```

4. **Deploy**:
```bash
fly deploy
```

## Option 3: Render

1. **Create account** at [render.com](https://render.com)

2. **Connect GitHub repo**

3. **Create Web Service**:
   - Build Command: `npm run build && npm run build:server`
   - Start Command: `npm run start:prod`
   - Environment: `NODE_ENV=production`

## Option 4: Heroku

1. **Install Heroku CLI**

2. **Create app**:
```bash
heroku create your-app-name
```

3. **Set buildpack**:
```bash
heroku buildpacks:set heroku/nodejs
```

4. **Deploy**:
```bash
git push heroku main
```

## Local Testing for Cross-Network

To test cross-network access locally:

1. **Find your local IP**:
```bash
# macOS/Linux
ifconfig | grep inet

# Windows  
ipconfig
```

2. **Start servers**:
```bash
npm run dev:all
```

3. **Access from other devices**: `http://YOUR_LOCAL_IP:5173`

## Security Notes for Production

- Enable HTTPS/WSS
- Add authentication
- Restrict file system access
- Set up proper CORS policies
- Use environment variables for secrets

## Troubleshooting

### WebSocket Connection Issues
- Check if wss:// is used for HTTPS sites
- Verify firewall settings
- Ensure WebSocket support in hosting provider

### Cross-Origin Issues
- Update CORS settings in server/index.js
- Add your domain to allowed origins

### Terminal Not Working
- Check browser console for errors
- Verify WebSocket connection status
- Test on different browsers/devices