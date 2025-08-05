# Testing Checklist Before Railway Deployment

## 🧪 Local Testing Commands

### 1. Development Mode
```bash
# Run both frontend and backend in dev mode
npm run dev:all

# Or run separately:
npm run dev        # Frontend on http://localhost:5173
npm run dev:server # Backend on http://localhost:3001
```

### 2. Production Build & Test
```bash
# Build the application
npm run build

# Run in production mode
NODE_ENV=production npm run start
# Visit http://localhost:3001
```

## ✅ Pre-Deployment Checklist

### Authentication
- [ ] Email sign-up works
- [ ] Email sign-in works
- [ ] GitHub OAuth sign-in works (after Supabase config)
- [ ] Sign out works
- [ ] Session persists on page refresh

### File Explorer
- [ ] User sees empty workspace on first login
- [ ] README.md is created automatically
- [ ] Files are isolated per user
- [ ] Refresh button updates file tree
- [ ] Click file to open in editor
- [ ] File tree shows correct icons

### Terminal
- [ ] Terminal connects successfully
- [ ] User starts in their own workspace directory
- [ ] Commands execute properly
- [ ] `git clone` works
- [ ] Files created in terminal appear in explorer (after refresh)
- [ ] Terminal persists session

### Editor
- [ ] Files open when clicked
- [ ] Syntax highlighting works
- [ ] Multiple tabs work
- [ ] Save file (Cmd/Ctrl+S) works
- [ ] File changes persist

### Preview
- [ ] Preview tab loads
- [ ] Can navigate to different URLs
- [ ] Proxy works for sites with X-Frame restrictions

### Mobile Experience
- [ ] App works on mobile browsers
- [ ] Touch controls work in terminal
- [ ] Tabs are accessible
- [ ] No viewport issues

### Security
- [ ] Users cannot access other users' files
- [ ] API endpoints validate user workspace
- [ ] Environment variables are not exposed

## 🚀 Railway Deployment Preparation

### 1. Environment Variables
Ensure these are set in Railway:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
NODE_ENV=production
PORT=3001
```

### 2. GitHub OAuth Setup (if using)
1. In GitHub OAuth App settings, update callback URL to:
   ```
   https://your-railway-app.up.railway.app
   ```

2. In Supabase Auth settings:
   - Add Railway URL to Site URL
   - Add Railway URL to Redirect URLs

### 3. Build Command
Railway should use:
```bash
npm run build
```

### 4. Start Command
Railway should use:
```bash
npm run start
```

## 🐛 Common Issues & Solutions

### Issue: Blank page in production
**Solution:** Check browser console for errors, ensure service worker is properly configured

### Issue: Terminal not connecting
**Solution:** Check WebSocket connection, ensure Socket.io is properly configured for production

### Issue: Files not saving
**Solution:** Check server logs, ensure user workspace directory exists and has write permissions

### Issue: GitHub sign-in redirects to wrong URL
**Solution:** Update OAuth callback URLs in both GitHub and Supabase

## 📝 Testing Notes

1. **Clear browser cache** between tests to ensure fresh state
2. **Test in incognito mode** to simulate new user experience
3. **Test on multiple browsers** (Chrome, Safari, Firefox)
4. **Test on mobile devices** (iOS Safari, Android Chrome)
5. **Monitor server logs** during testing for any errors

## 🎯 Performance Checks

- [ ] Build size is reasonable (< 2MB total)
- [ ] Initial load time is acceptable (< 3s)
- [ ] Terminal response is fast (< 100ms)
- [ ] File operations are responsive

## 🔒 Final Security Review

- [ ] No hardcoded credentials in code
- [ ] Environment variables properly configured
- [ ] CORS settings appropriate for production
- [ ] User isolation properly implemented
- [ ] No sensitive data in client-side code