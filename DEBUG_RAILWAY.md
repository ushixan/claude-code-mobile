# 🐛 Railway WebSocket Debug Guide

## Step 1: Check the Logs

1. **Go to your Railway dashboard**
2. **Click on your deployment**
3. **Go to "Deployments" tab → Click latest deployment → "View Logs"**
4. **Look for these messages**:
   ```
   Server running on 0.0.0.0:PORT
   Environment: production  
   Socket.io path: /socket.io/
   ```

## Step 2: Test API Endpoints

Open these URLs in your browser (replace with your Railway URL):

1. **Health Check**: `https://your-app.railway.app/health`
   - Should show: `{"status":"ok","environment":"production","connectedClients":0}`

2. **API Test**: `https://your-app.railway.app/api/test`  
   - Should show: `{"message":"API is working"}`

3. **Frontend**: `https://your-app.railway.app`
   - Should load the app

## Step 3: Browser Console Debugging

1. **Open your deployed app**
2. **Open browser dev tools (F12)**
3. **Go to Console tab**
4. **Look for these messages**:
   ```
   Connecting to WebSocket: same origin
   Connected to terminal server  // ✅ Good
   
   OR
   
   WebSocket connection error: ... // ❌ Problem
   ```

## Step 4: Network Tab Check

1. **In dev tools, go to Network tab**
2. **Refresh the page**
3. **Look for Socket.io requests**:
   - `socket.io/?EIO=4&transport=polling` ✅
   - Failed requests with 404/500 ❌

## Common Issues & Solutions

### Issue 1: "Disconnected" Status
**Cause**: WebSocket can't connect to backend
**Solution**: Check if Railway assigned the correct PORT

### Issue 2: 404 on socket.io requests  
**Cause**: Backend not running or wrong routing
**Solution**: Check Railway logs for server startup

### Issue 3: CORS errors
**Cause**: Domain mismatch
**Solution**: Backend should handle same-origin automatically

## Quick Fix Commands

If you need to redeploy with fixes:

```bash
# Commit the changes
git add .
git commit -m "Fix WebSocket connection for Railway"
git push

# Railway will auto-deploy
```

## What I Fixed

✅ **WebSocket URL detection** - now uses same origin in production
✅ **Added error logging** - see exact connection errors  
✅ **Added test endpoints** - verify backend is working
✅ **Fixed PORT binding** - uses Railway's PORT variable

**Next: Push these fixes and redeploy!**