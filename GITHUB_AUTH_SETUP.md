# GitHub Authentication Setup Guide

This guide will help you set up GitHub OAuth authentication for seamless git operations in your mobile IDE.

## Features

- Login with GitHub account
- Automatic git authentication for push/pull operations
- No need to enter credentials repeatedly
- Secure token storage

## Setup Instructions

### 1. Create a GitHub OAuth App

1. Go to GitHub Settings → Developer settings → OAuth Apps
2. Click "New OAuth App"
3. Fill in the application details:
   - **Application name**: Mobile IDE (or your preferred name)
   - **Homepage URL**: http://localhost:8080 (for development)
   - **Authorization callback URL**: http://localhost:8080/api/auth/github/callback
4. Click "Register application"

### 2. Get Your Credentials

After creating the app, you'll see:
- **Client ID**: Copy this value
- **Client Secret**: Click "Generate a new client secret" and copy the value

### 3. Configure Environment Variables

Edit the `.env` file in your project root and add your credentials:

```env
# GitHub OAuth Configuration
GITHUB_CLIENT_ID=your_actual_client_id_here
GITHUB_CLIENT_SECRET=your_actual_client_secret_here
GITHUB_REDIRECT_URI=http://localhost:8080/api/auth/github/callback

# JWT Secret (generate a random string)
JWT_SECRET=your_random_jwt_secret_here
```

### 4. Start the Application

```bash
# Install dependencies
npm install

# Start the server (with GitHub auth enabled)
npm run dev:server

# In another terminal, start the frontend
npm run dev
```

### 5. Login with GitHub

1. Open the app in your browser
2. Click the "Login with GitHub" button in the header
3. Authorize the application on GitHub
4. You'll be redirected back to the app, logged in

## How It Works

1. **OAuth Flow**: When you click "Login with GitHub", you're redirected to GitHub's OAuth page
2. **Token Exchange**: After authorization, GitHub sends a code that's exchanged for an access token
3. **Secure Storage**: The access token is stored securely on the server (in memory for dev, use Redis/DB for production)
4. **Git Configuration**: When you create a terminal, git is automatically configured with your credentials
5. **Seamless Operations**: All git operations (clone, push, pull) work without password prompts

## Testing Git Operations

Once logged in, try these commands in the terminal:

```bash
# Clone a private repository
git clone https://github.com/yourusername/private-repo.git

# Make changes and push
cd private-repo
echo "test" > test.txt
git add .
git commit -m "Test commit"
git push
```

All operations should work without asking for credentials!

## Production Deployment

For production deployment:

1. Update the OAuth app URLs on GitHub to match your production domain
2. Update the `.env` file with production URLs:
   ```env
   GITHUB_REDIRECT_URI=https://yourdomain.com/api/auth/github/callback
   ```
3. Use a proper session store (Redis or database) instead of in-memory storage
4. Ensure HTTPS is enabled for security

## Security Notes

- Never commit the `.env` file to version control
- Always use HTTPS in production
- Rotate your client secret periodically
- Consider implementing token refresh for long-lived sessions

## Troubleshooting

### "Authentication failed" error
- Check that your Client ID and Secret are correct in `.env`
- Ensure the redirect URI matches exactly what's configured on GitHub

### Git operations still ask for password
- Make sure you're logged in with GitHub (check for username in header)
- Try creating a new terminal after logging in
- Check server logs for any configuration errors

### Token expired
- Tokens are valid for 30 days by default
- Log out and log in again to refresh the token

## Support

If you encounter any issues, check:
1. Server logs for error messages
2. Browser console for client-side errors
3. GitHub OAuth app settings for correct URLs