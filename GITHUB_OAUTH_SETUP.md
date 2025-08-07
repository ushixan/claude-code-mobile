# GitHub OAuth Setup for Supabase

## The 404 Error Fix

You're getting a 404 error because GitHub OAuth needs to be configured in your Supabase project. Here's how to fix it:

## Step 1: GitHub OAuth App Setup

1. Go to GitHub Settings → Developer settings → OAuth Apps
2. Click "New OAuth App"
3. Fill in:
   - **Application name**: Mobile Terminal IDE
   - **Homepage URL**: `https://mobile-terminal-ide-production-5a0a.up.railway.app`
   - **Authorization callback URL**: `https://YOUR_SUPABASE_PROJECT.supabase.co/auth/v1/callback`
   
   To find your Supabase URL:
   - Go to your Supabase dashboard
   - Settings → API
   - Copy your Project URL (looks like: `https://xxxxx.supabase.co`)
   - Your callback URL will be: `https://xxxxx.supabase.co/auth/v1/callback`

4. Click "Register application"
5. You'll get:
   - **Client ID**
   - **Client Secret** (click "Generate a new client secret")

## Step 2: Configure Supabase

1. Go to your Supabase project dashboard
2. Navigate to **Authentication → Providers**
3. Find **GitHub** in the list
4. Toggle it **ON**
5. Enter:
   - **Client ID** (from GitHub)
   - **Client Secret** (from GitHub)
6. Click **Save**

## Step 3: Update Redirect URLs (Important!)

1. In Supabase dashboard, go to **Authentication → URL Configuration**
2. Add your app URLs to **Redirect URLs**:
   ```
   https://mobile-terminal-ide-production-5a0a.up.railway.app
   https://mobile-terminal-ide-production-5a0a.up.railway.app/auth/success
   http://localhost:5173
   http://localhost:5173/auth/success
   ```
3. Click **Save**

## Step 4: Test

1. Go to your app's login page
2. Click "Sign in with GitHub"
3. You should be redirected to GitHub for authorization
4. After authorizing, you'll be redirected back to your app

## Alternative: Email-Only Authentication

If you don't want to use GitHub OAuth, you can:
1. Hide the GitHub button
2. Use email/password authentication only

To hide the GitHub button, update `src/components/Auth/AuthForm.tsx`:
- Remove or comment out the GitHub sign-in button section (lines 94-108)

## Troubleshooting

### Still getting 404?
- Check that your Supabase project URL in `.env` is correct
- Ensure GitHub provider is enabled in Supabase
- Verify the callback URL matches exactly

### After successful login, Git config not working?
The app will automatically configure Git with:
- GitHub users: Your GitHub username
- Email users: Your email address

This happens automatically when you open a terminal.