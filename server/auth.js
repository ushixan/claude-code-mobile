const axios = require('axios');
const jwt = require('jsonwebtoken');
const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

class GitHubAuth {
  constructor() {
    this.clientId = process.env.GITHUB_CLIENT_ID;
    this.clientSecret = process.env.GITHUB_CLIENT_SECRET;
    this.redirectUri = process.env.GITHUB_REDIRECT_URI || 'https://mobile-terminal-ide-production-5a0a.up.railway.app/api/auth/github/callback';
    this.jwtSecret = process.env.JWT_SECRET || 'default_secret_change_in_production';
    this.userTokens = new Map(); // Store tokens in memory (use Redis/DB in production)
  }

  // Generate GitHub OAuth URL
  getAuthUrl(state) {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: 'repo user email',
      state: state || 'random_state_string'
    });
    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  // Exchange code for access token
  async exchangeCodeForToken(code) {
    try {
      const response = await axios.post('https://github.com/login/oauth/access_token', {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code: code,
        redirect_uri: this.redirectUri
      }, {
        headers: {
          'Accept': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error exchanging code for token:', error);
      throw error;
    }
  }

  // Get user info from GitHub
  async getUserInfo(accessToken) {
    try {
      const response = await axios.get('https://api.github.com/user', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching user info:', error);
      throw error;
    }
  }

  // Generate JWT for session
  generateJWT(userId, githubUsername, accessToken) {
    const payload = {
      userId,
      githubUsername,
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 30) // 30 days
    };
    
    // Store the access token securely
    this.userTokens.set(userId, {
      accessToken,
      githubUsername,
      createdAt: new Date()
    });
    
    return jwt.sign(payload, this.jwtSecret);
  }

  // Verify JWT
  verifyJWT(token) {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch (error) {
      return null;
    }
  }

  // Get stored access token for user
  getAccessToken(userId) {
    const userData = this.userTokens.get(userId);
    return userData ? userData.accessToken : null;
  }

  // Configure git with credentials
  async configureGitCredentials(userId, workspaceId) {
    const userData = this.userTokens.get(userId);
    if (!userData) {
      throw new Error('No GitHub token found for user');
    }

    const { accessToken, githubUsername } = userData;
    
    // Create a git credentials helper script
    const credentialHelperPath = path.join(os.homedir(), '.git-credentials-helper', `${userId}-${workspaceId}.sh`);
    const credentialHelperDir = path.dirname(credentialHelperPath);
    
    // Ensure directory exists
    await fs.mkdir(credentialHelperDir, { recursive: true });
    
    // Create the credential helper script
    const helperScript = `#!/bin/bash
if [ "$1" = "get" ]; then
    echo "protocol=https"
    echo "host=github.com"
    echo "username=${githubUsername}"
    echo "password=${accessToken}"
fi
`;
    
    await fs.writeFile(credentialHelperPath, helperScript, { mode: 0o700 });
    
    // Configure git to use this credential helper for the workspace
    const workspacePath = path.join(process.cwd(), 'user-workspaces', userId, workspaceId);
    
    return new Promise((resolve, reject) => {
      // Set up git config for this workspace using git -C option instead of cd
      const commands = [
        `git -C "${workspacePath}" config user.name "${githubUsername}"`,
        `git -C "${workspacePath}" config user.email "${githubUsername}@users.noreply.github.com}"`,
        `git -C "${workspacePath}" config credential.helper "${credentialHelperPath}"`
      ];
      
      let completed = 0;
      const errors = [];
      
      commands.forEach(cmd => {
        exec(cmd, (error, stdout, stderr) => {
          if (error) {
            errors.push(error.message);
          }
          completed++;
          
          if (completed === commands.length) {
            if (errors.length > 0) {
              reject(new Error('Failed to configure git: ' + errors.join(', ')));
            } else {
              resolve({
                success: true,
                message: 'Git configured successfully'
              });
            }
          }
        });
      });
    });
  }

  // Alternative: Use GitHub token directly in git commands
  async executeGitCommand(userId, workspaceId, command) {
    const userData = this.userTokens.get(userId);
    if (!userData) {
      throw new Error('No GitHub token found for user');
    }

    const { accessToken, githubUsername } = userData;
    const workspacePath = path.join(process.cwd(), 'user-workspaces', userId, workspaceId);
    
    // Inject token into git URLs for HTTPS operations
    let modifiedCommand = command;
    
    // Handle git clone/push/pull with token
    if (command.includes('github.com')) {
      modifiedCommand = command.replace(
        /https:\/\/github\.com/g,
        `https://${githubUsername}:${accessToken}@github.com`
      );
    }
    
    return new Promise((resolve, reject) => {
      exec(modifiedCommand, { cwd: workspacePath }, (error, stdout, stderr) => {
        if (error) {
          // Remove token from error messages for security
          const cleanError = error.message.replace(new RegExp(accessToken, 'g'), '[REDACTED]');
          reject(new Error(cleanError));
        } else {
          resolve({ stdout, stderr });
        }
      });
    });
  }
}

module.exports = GitHubAuth;