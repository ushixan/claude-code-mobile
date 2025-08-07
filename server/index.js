console.log('Starting server initialization...');
console.log('Current directory:', process.cwd());
console.log('Node version:', process.version);
console.log('Environment PORT:', process.env.PORT);

// Load environment variables
require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const GitHubAuth = require('./auth');

// Try to load node-pty with error handling
let pty;
try {
  pty = require('node-pty');
  console.log('✅ node-pty loaded successfully');
} catch (error) {
  console.error('⚠️  Failed to load node-pty:', error.message);
  console.log('Terminal features will be disabled');
}

const os = require('os');
const path = require('path');
const fs = require('fs').promises;

// Global error handlers to prevent server crashes
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Don't exit - try to recover
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Initialize GitHub Auth
const githubAuth = new GitHubAuth();

// Serve static files from dist directory in production
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '..', 'dist');
  console.log('Serving static files from:', distPath);
  
  // Check if dist directory exists
  try {
    const distExists = require('fs').existsSync(distPath);
    console.log('Dist directory exists:', distExists);
    if (distExists) {
      const files = require('fs').readdirSync(distPath);
      console.log('Files in dist:', files);
    }
  } catch (err) {
    console.error('Error checking dist directory:', err);
  }
  
  // Serve static files with proper headers
  app.use(express.static(distPath, {
    maxAge: '1h',
    etag: true,
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
      }
      if (filePath.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css; charset=UTF-8');
      }
      if (filePath.endsWith('.html')) {
        res.setHeader('Content-Type', 'text/html; charset=UTF-8');
        // Ensure fresh HTML on each deploy to avoid stale bundles
        res.setHeader('Cache-Control', 'no-store, must-revalidate');
        return;
      }
      // Prevent caching issues during deployment for other assets
      res.setHeader('Cache-Control', 'public, max-age=3600');
    }
  }));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    connectedClients: io.engine.clientsCount 
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working', timestamp: new Date().toISOString() });
});

// GitHub OAuth endpoints
app.get('/api/auth/github', (req, res) => {
  const state = req.query.state || Math.random().toString(36).substring(7);
  
  // Dynamically set redirect URI to current origin for production (and proxies)
  try {
    const proto = req.headers['x-forwarded-proto'] || (req.secure ? 'https' : 'http');
    const host = req.headers['x-forwarded-host'] || req.headers['host'];
    if (proto && host) {
      githubAuth.redirectUri = `${proto}://${host}/api/auth/github/callback`;
    }
  } catch (e) {
    // Fallback to existing config if header derivation fails
  }

  const authUrl = githubAuth.getAuthUrl(state);
  res.json({ authUrl, state });
});

app.get('/api/auth/github/callback', async (req, res) => {
  const { code, state } = req.query;
  
  if (!code) {
    return res.status(400).send('Authorization code is required');
  }
  
  try {
    // Exchange code for token
    const tokenData = await githubAuth.exchangeCodeForToken(code);
    
    if (tokenData.error) {
      return res.status(400).json({ error: tokenData.error_description });
    }
    
    // Get user info
    const userInfo = await githubAuth.getUserInfo(tokenData.access_token);
    
    // Generate JWT
    const jwt = githubAuth.generateJWT(
      userInfo.id.toString(),
      userInfo.login,
      tokenData.access_token
    );
    
    // Redirect to frontend with JWT
    const redirectUrl = process.env.NODE_ENV === 'production' 
      ? `/auth/success?token=${jwt}&username=${userInfo.login}`
      : `http://localhost:5173/auth/success?token=${jwt}&username=${userInfo.login}`;
    
    res.redirect(redirectUrl);
  } catch (error) {
    console.error('GitHub OAuth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

app.get('/api/auth/verify', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  const decoded = githubAuth.verifyJWT(token);
  
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  
  res.json({
    userId: decoded.userId,
    githubUsername: decoded.githubUsername,
    expiresAt: new Date(decoded.exp * 1000)
  });
});

// Configure git for authenticated user
app.post('/api/auth/configure-git', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const { workspaceId } = req.body;
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  const decoded = githubAuth.verifyJWT(token);
  
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  
  try {
    const result = await githubAuth.configureGitCredentials(decoded.userId, workspaceId);
    res.json(result);
  } catch (error) {
    console.error('Error configuring git:', error);
    res.status(500).json({ error: error.message });
  }
});

// Debug endpoint to test query parameters
app.get('/api/debug', (req, res) => {
  res.json({ 
    message: 'Debug endpoint', 
    query: req.query,
    url: req.url,
    originalUrl: req.originalUrl,
    params: req.params
  });
});

// Simple proxy endpoint - just removes headers
app.get('/api/simple-proxy', async (req, res) => {
  const targetUrl = req.query.url;
  
  if (!targetUrl) {
    return res.status(400).send('URL parameter is required');
  }
  
  try {
    const response = await fetch(targetUrl);
    const content = await response.text();
    
    // Remove all blocking headers
    res.removeHeader('X-Frame-Options');
    res.removeHeader('Content-Security-Policy');
    res.set('Content-Type', response.headers.get('content-type') || 'text/html');
    
    res.send(content);
  } catch (error) {
    console.error('Simple proxy error:', error);
    res.status(500).send('Proxy error');
  }
});

// Screenshot/render endpoint for stubborn sites
app.get('/api/render', async (req, res) => {
  const targetUrl = req.query.url;
  
  if (!targetUrl) {
    return res.status(400).json({ error: 'URL parameter is required' });
  }
  
  try {
    // For now, return a simple HTML page that explains the limitation
    // In production, you would use Puppeteer or Playwright here
    const renderHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Preview: ${targetUrl}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            margin: 0;
            padding: 20px;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
          }
          .container {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 30px;
            max-width: 500px;
            text-align: center;
          }
          h1 {
            font-size: 24px;
            margin-bottom: 20px;
          }
          .url {
            background: rgba(255, 255, 255, 0.2);
            padding: 10px;
            border-radius: 10px;
            word-break: break-all;
            margin: 20px 0;
            font-size: 14px;
          }
          .buttons {
            display: flex;
            gap: 10px;
            justify-content: center;
            margin-top: 20px;
          }
          .button {
            background: white;
            color: #667eea;
            border: none;
            padding: 12px 24px;
            border-radius: 10px;
            font-weight: 600;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            transition: transform 0.2s;
          }
          .button:hover {
            transform: scale(1.05);
          }
          .info {
            margin-top: 20px;
            font-size: 14px;
            opacity: 0.9;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🔒 This site cannot be embedded</h1>
          <p>The website you're trying to view has security restrictions that prevent it from being displayed in an iframe.</p>
          <div class="url">${targetUrl}</div>
          <div class="buttons">
            <a href="${targetUrl}" target="_blank" class="button">Open in New Tab</a>
          </div>
          <div class="info">
            <p>💡 Pro tip: You can still browse this site by opening it in a new tab. Your terminal and editor will remain accessible in other tabs.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    res.set('Content-Type', 'text/html');
    res.send(renderHtml);
  } catch (error) {
    console.error('Render error:', error);
    res.status(500).json({ error: 'Failed to render page' });
  }
});

// Comprehensive proxy endpoint to bypass X-Frame-Options
app.get('/api/proxy', async (req, res) => {
  console.log('Proxy request received:', req.url);
  console.log('Query params:', req.query);
  console.log('Full URL:', req.originalUrl);
  
  const targetUrl = req.query.url;
  
  if (!targetUrl) {
    console.log('Missing URL parameter in request');
    return res.status(400).json({ error: 'URL parameter is required' });
  }
  
  try {
    // Validate and fix URL
    let url;
    try {
      url = new URL(targetUrl);
    } catch (e) {
      // Try adding https:// if no protocol
      try {
        url = new URL('https://' + targetUrl);
      } catch (e2) {
        return res.status(400).json({ error: 'Invalid URL format' });
      }
    }
    
    if (!['http:', 'https:'].includes(url.protocol)) {
      return res.status(400).json({ error: 'Invalid URL protocol' });
    }
    
    console.log('Proxying request to:', url.href);
    
    // Fetch the target page with mobile user agent for better compatibility
    const response = await fetch(url.href, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Cache-Control': 'max-age=0'
      },
      redirect: 'follow'
    });
    
    console.log('Proxy response status:', response.status, response.statusText);
    
    if (!response.ok) {
      // Return a proper error page instead of JSON for iframe
      const errorHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Error ${response.status}</title>
          <style>
            body {
              font-family: -apple-system, system-ui, sans-serif;
              background: #1e293b;
              color: #e2e8f0;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              text-align: center;
            }
            .error { 
              padding: 20px;
            }
            h1 { color: #f87171; }
            a {
              color: #60a5fa;
              text-decoration: none;
              display: inline-block;
              margin-top: 20px;
              padding: 10px 20px;
              background: #334155;
              border-radius: 6px;
            }
          </style>
        </head>
        <body>
          <div class="error">
            <h1>Error ${response.status}</h1>
            <p>${response.statusText}</p>
            <p>Failed to load: ${url.hostname}</p>
            <a href="${url.href}" target="_blank">Open in new tab →</a>
          </div>
        </body>
        </html>
      `;
      return res.status(200).set('Content-Type', 'text/html').send(errorHtml);
    }
    
    const contentType = response.headers.get('content-type') || 'text/html';
    let content = await response.text();
    
    // If it's HTML, modify it to work in iframe
    if (contentType.includes('text/html')) {
      // Simple but effective approach - inject a base tag and remove blocking scripts
      
      // Add base tag for relative URLs
      const baseTag = `<base href="${url.origin}/" target="_self">`;
      if (!content.includes('<base')) {
        content = content.replace(/<head[^>]*>/i, `$&${baseTag}`);
      }
      
      // Remove common frame-busting code
      content = content.replace(/if\s*\(\s*top\s*!==?\s*self\s*\)/gi, 'if(false)');
      content = content.replace(/if\s*\(\s*self\s*!==?\s*top\s*\)/gi, 'if(false)');
      content = content.replace(/if\s*\(\s*window\s*!==?\s*window\.top\s*\)/gi, 'if(false)');
      content = content.replace(/if\s*\(\s*parent\s*!==?\s*window\s*\)/gi, 'if(false)');
      content = content.replace(/top\.location/gi, 'window.location');
      content = content.replace(/window\.top\.location/gi, 'window.location');
      
      // Remove X-Frame-Options meta tags
      content = content.replace(/<meta[^>]*http-equiv=["']X-Frame-Options["'][^>]*>/gi, '');
      
      // Add a simple CSS fix for better mobile viewing
      const mobileStyles = `
        <style>
          @media (max-width: 768px) {
            body { 
              -webkit-text-size-adjust: 100%;
              overflow-x: auto !important;
            }
            * {
              max-width: 100vw !important;
              word-wrap: break-word !important;
            }
          }
        </style>
      `;
      content = content.replace(/<\/head>/i, `${mobileStyles}</head>`);
    }
    
    // Set appropriate headers, removing frame-blocking ones
    res.set('Content-Type', contentType);
    res.set('Cache-Control', 'no-cache');
    // Explicitly remove frame-blocking headers
    res.removeHeader('X-Frame-Options');
    res.removeHeader('Content-Security-Policy');
    
    res.send(content);
    
  } catch (error) {
    console.error('Proxy error for URL:', targetUrl, error.message);
    
    // Handle specific error types
    if (error.code === 'ENOTFOUND') {
      res.status(404).json({ error: 'Website not found or DNS resolution failed' });
    } else if (error.code === 'ECONNREFUSED') {
      res.status(503).json({ error: 'Connection refused by target server' });
    } else if (error.code === 'ETIMEDOUT') {
      res.status(504).json({ error: 'Request timed out' });
    } else {
      res.status(500).json({ error: 'Failed to proxy request: ' + error.message });
    }
  }
});

// Terminal sessions - organized by user and terminal ID
const terminals = new Map(); // socketId:terminalId -> terminalSession
const userTerminals = new Map(); // userId -> Map of terminalId -> socketId

// Create a new terminal session
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  console.log('Total connected clients:', io.engine.clientsCount);

  socket.on('create-terminal', async (data) => {
    const { userId, workspaceId, terminalId = '1', githubUsername, userEmail } = data;
    
    // Configure git with user information if provided
    let gitConfigCommands = [];
    if (userId && workspaceId) {
      // Create workspace directory first
      const userWorkspaceDir = path.join(process.cwd(), 'user-workspaces', userId, workspaceId);
      
      // Configure git for this workspace
      if (githubUsername) {
        gitConfigCommands.push(`git config --global user.name "${githubUsername}"`);
      } else if (userEmail) {
        // Use email username as fallback
        const username = userEmail.split('@')[0];
        gitConfigCommands.push(`git config --global user.name "${username}"`);
      }
      
      if (userEmail) {
        gitConfigCommands.push(`git config --global user.email "${userEmail}"`);
      }
      
      // Log git configuration
      if (gitConfigCommands.length > 0) {
        console.log('Configuring git for user:', userId, 'with:', githubUsername || userEmail);
      }
    }
    
    // Detect available shell - Alpine uses sh by default
    let shell = 'sh'; // Default fallback
    if (os.platform() === 'win32') {
      shell = 'powershell.exe';
    } else {
      // Check for available shells in order of preference
      const fs = require('fs');
      if (fs.existsSync('/bin/bash')) {
        shell = '/bin/bash';
      } else if (fs.existsSync('/usr/bin/bash')) {
        shell = '/usr/bin/bash';
      } else if (fs.existsSync('/bin/sh')) {
        shell = '/bin/sh';
      }
    }
    
    console.log('Using shell:', shell);
    
    // Create user-specific workspace directory
    let cwd = data.cwd || process.cwd();
    if (userId && workspaceId) {
      // Create a user workspace directory (in production, this would be persistent storage)
      const userWorkspaceDir = path.join(process.cwd(), 'user-workspaces', userId, workspaceId);
      
      try {
        if (!require('fs').existsSync(userWorkspaceDir)) {
          require('fs').mkdirSync(userWorkspaceDir, { recursive: true });
          
          // Initialize with some default files
          require('fs').writeFileSync(
            path.join(userWorkspaceDir, 'welcome.txt'), 
            'Welcome to your personal workspace!\nYour files are saved in the cloud and will persist between sessions.\n'
          );
        }
        cwd = userWorkspaceDir;
      } catch (error) {
        console.error('Error creating user workspace:', error);
      }
    }
    
    let term;
    try {
      if (!pty) {
        throw new Error('node-pty is not available');
      }
      term = pty.spawn(shell, [], {
        name: 'xterm-color',
        cols: data.cols || 80,
        rows: data.rows || 24,
        cwd: cwd,
        env: {
          ...process.env,
          TERM: 'xterm-256color',
          PS1: userId ? `[${userId.slice(0, 8)}@workspace] $ ` : '$ ' // Custom prompt for user
        }
      });
      console.log('Terminal spawned successfully for', socket.id);
    } catch (error) {
      console.error('Error spawning terminal:', error);
      socket.emit('terminal-error', { 
        message: 'Failed to create terminal session', 
        error: error.message 
      });
      return;
    }

    const terminalSession = {
      term,
      userId,
      workspaceId,
      terminalId,
      cwd,
      createdAt: new Date()
    };

    const sessionKey = `${socket.id}:${terminalId}`;
    terminals.set(sessionKey, terminalSession);
    
    // Track user terminals
    if (userId) {
      if (!userTerminals.has(userId)) {
        userTerminals.set(userId, new Map());
      }
      userTerminals.get(userId).set(terminalId, socket.id);
    }
    
    term.on('data', (data) => {
      socket.emit('terminal-output', data);
    });

    socket.on('terminal-input', (data) => {
      if (term && typeof term.write === 'function') {
        try {
          term.write(data);
        } catch (error) {
          console.error('Error writing to terminal:', error);
        }
      }
    });
    
    // Execute git config commands after terminal is ready
    if (gitConfigCommands.length > 0) {
      setTimeout(() => {
        gitConfigCommands.forEach(cmd => {
          term.write(`${cmd}\r\n`);
        });
        // Show configured git info
        term.write('git config --global user.name\r\n');
        term.write('git config --global user.email\r\n');
      }, 500);
    }

    socket.on('resize', (data) => {
      if (term && typeof term.resize === 'function') {
        try {
          // Validate dimensions
          const cols = Math.max(1, Math.min(data.cols || 80, 500));
          const rows = Math.max(1, Math.min(data.rows || 24, 200));
          term.resize(cols, rows);
        } catch (error) {
          console.error('Error resizing terminal:', error.message);
          // Don't crash the server on resize errors
        }
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      // Find all terminals associated with this socket
      const sessionsToDelete = [];
      for (const [key, session] of terminals.entries()) {
        if (key.startsWith(`${socket.id}:`)) {
          sessionsToDelete.push({ key, session });
        }
      }
      
      sessionsToDelete.forEach(({ key, session }) => {
        if (session && session.term) {
          try {
            // Properly kill the terminal process
            if (typeof session.term.kill === 'function') {
              session.term.kill();
            }
          } catch (error) {
            console.error('Error killing terminal:', error.message);
          }
          
          terminals.delete(key);
          
          // Clean up user tracking
          if (session.userId && userTerminals.has(session.userId)) {
            const userTerminalMap = userTerminals.get(session.userId);
            userTerminalMap.delete(session.terminalId);
            if (userTerminalMap.size === 0) {
              userTerminals.delete(session.userId);
            }
          }
        }
      });
    });
    
    // Send initial prompt
    socket.emit('terminal-ready');
  });
});

// Socket.io endpoint (important: before catch-all route)
// This is handled automatically by socket.io

// File system API endpoints  
app.get('/api/files/tree', async (req, res) => {
  const { userId, workspaceId } = req.query;
  
  // Use user-specific workspace directory
  let rootPath;
  if (userId && workspaceId) {
    rootPath = path.join(process.cwd(), 'user-workspaces', userId, workspaceId);
    
    // Ensure the directory exists
    if (!require('fs').existsSync(rootPath)) {
      require('fs').mkdirSync(rootPath, { recursive: true });
      
      // Initialize with a welcome file
      require('fs').writeFileSync(
        path.join(rootPath, 'README.md'), 
        `# Welcome to Your Workspace!\n\nThis is your personal development environment.\n\n## Getting Started\n\n- Use the terminal to run commands\n- Create and edit files in the editor\n- Preview your web apps in the preview tab\n- Use \`git clone\` to import projects\n\n## Tips\n\n- All your files are automatically saved\n- Your workspace persists between sessions\n- You can run any command available in a standard Linux environment\n`
      );
    }
  } else {
    rootPath = req.query.path || process.cwd();
  }
  
  try {
    const tree = await buildFileTree(rootPath);
    res.json(tree);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/files/read', async (req, res) => {
  const { path: filePath, userId, workspaceId } = req.query;
  
  if (!filePath) {
    return res.status(400).json({ error: 'Path is required' });
  }
  
  // Validate that the path is within user's workspace
  let validatedPath = filePath;
  if (userId && workspaceId) {
    const userWorkspace = path.join(process.cwd(), 'user-workspaces', userId, workspaceId);
    const resolvedPath = path.resolve(filePath);
    
    // Security check: ensure path is within user's workspace
    if (!resolvedPath.startsWith(userWorkspace)) {
      return res.status(403).json({ error: 'Access denied: Path outside user workspace' });
    }
    validatedPath = resolvedPath;
  }
  
  try {
    const content = await fs.readFile(validatedPath, 'utf8');
    res.json({ content });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/files/write', async (req, res) => {
  const { path: filePath, content, userId, workspaceId } = req.body;
  
  if (!filePath || content === undefined) {
    return res.status(400).json({ error: 'Path and content are required' });
  }
  
  // Validate that the path is within user's workspace
  let validatedPath = filePath;
  if (userId && workspaceId) {
    const userWorkspace = path.join(process.cwd(), 'user-workspaces', userId, workspaceId);
    const resolvedPath = path.resolve(filePath);
    
    // Security check: ensure path is within user's workspace
    if (!resolvedPath.startsWith(userWorkspace)) {
      return res.status(403).json({ error: 'Access denied: Path outside user workspace' });
    }
    validatedPath = resolvedPath;
  }
  
  try {
    // Ensure directory exists
    const dir = path.dirname(validatedPath);
    await fs.mkdir(dir, { recursive: true });
    
    await fs.writeFile(validatedPath, content, 'utf8');
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/files/delete', async (req, res) => {
  const filePath = req.query.path;
  
  if (!filePath) {
    return res.status(400).json({ error: 'Path is required' });
  }
  
  try {
    const stat = await fs.stat(filePath);
    if (stat.isDirectory()) {
      await fs.rmdir(filePath, { recursive: true });
    } else {
      await fs.unlink(filePath);
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/files/rename', async (req, res) => {
  const { oldPath, newPath } = req.body;
  
  if (!oldPath || !newPath) {
    return res.status(400).json({ error: 'Both oldPath and newPath are required' });
  }
  
  try {
    await fs.rename(oldPath, newPath);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper function to build file tree
async function buildFileTree(dirPath, maxDepth = 3, currentDepth = 0) {
  if (currentDepth >= maxDepth) return [];
  
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const tree = [];
  
  for (const entry of entries) {
    // Skip hidden files and common ignore patterns
    if (entry.name.startsWith('.') || 
        entry.name === 'node_modules' || 
        entry.name === 'dist' ||
        entry.name === 'build') {
      continue;
    }
    
    const fullPath = path.join(dirPath, entry.name);
    const node = {
      name: entry.name,
      path: fullPath,
      type: entry.isDirectory() ? 'directory' : 'file'
    };
    
    if (entry.isDirectory()) {
      try {
        node.children = await buildFileTree(fullPath, maxDepth, currentDepth + 1);
      } catch (error) {
        // Skip directories we can't read
        node.children = [];
      }
    }
    
    tree.push(node);
  }
  
  return tree;
}

// Catch-all handler for SPA in production - but NOT for asset files
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    // Don't serve index.html for asset requests
    const ext = path.extname(req.path);
    if (ext && ext !== '.html') {
      // If it's an asset file that wasn't found, return 404
      return res.status(404).send('Not found');
    }
    // For routes without extensions, serve the SPA
    res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
  });
}

const PORT = process.env.PORT || 8080;
const HOST = '0.0.0.0'; // Always bind to 0.0.0.0 for containers

console.log('Starting server with configuration:');
console.log(`- PORT: ${PORT}`);
console.log(`- HOST: ${HOST}`);
console.log(`- NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
console.log(`- Current directory: ${process.cwd()}`);
console.log(`- __dirname: ${__dirname}`);

// Check if dist directory exists in production
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '..', 'dist');
  const distExists = require('fs').existsSync(distPath);
  console.log(`- Dist directory exists: ${distExists}`);
  if (distExists) {
    const indexHtmlExists = require('fs').existsSync(path.join(distPath, 'index.html'));
    console.log(`- index.html exists: ${indexHtmlExists}`);
  }
}

server.listen(PORT, HOST, (error) => {
  if (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
  console.log(`✅ Server successfully started on ${HOST}:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Socket.io path: /socket.io/`);
  console.log(`Process ID: ${process.pid}`);
  console.log(`Health check available at: http://${HOST}:${PORT}/health`);
});