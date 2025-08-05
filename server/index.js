const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const pty = require('node-pty');
const os = require('os');
const path = require('path');
const fs = require('fs').promises;

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
    maxAge: '1d',
    etag: false,
    setHeaders: (res, path) => {
      if (path.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript');
      }
      if (path.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css');
      }
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

// Proxy endpoint to bypass X-Frame-Options
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
    // Validate URL
    const url = new URL(targetUrl);
    if (!['http:', 'https:'].includes(url.protocol)) {
      return res.status(400).json({ error: 'Invalid URL protocol' });
    }
    
    console.log('Proxying request to:', targetUrl);
    
    // Fetch the target page with more realistic headers
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Cache-Control': 'max-age=0'
      }
    });
    
    console.log('Proxy response status:', response.status, response.statusText);
    
    if (!response.ok) {
      return res.status(response.status).json({ 
        error: `Failed to fetch: ${response.status} ${response.statusText}` 
      });
    }
    
    const contentType = response.headers.get('content-type') || 'text/html';
    let content = await response.text();
    
    // If it's HTML, modify it to work in iframe
    if (contentType.includes('text/html')) {
      const wsUrl = req.get('host');
      const proxyPath = '/api/proxy?url=';
      
      // Rewrite all absolute URLs to go through our proxy
      content = content.replace(/https?:\/\/[^"'\s)]+/g, (match) => {
        // Skip if it's already a proxy URL or a data URL
        if (match.includes(proxyPath) || match.startsWith('data:')) {
          return match;
        }
        // Convert to proxy URL
        return `http://${wsUrl}${proxyPath}${encodeURIComponent(match)}`;
      });
      
      // Rewrite form actions to go through proxy
      content = content.replace(/action=["']([^"']+)["']/gi, (match, action) => {
        if (action.startsWith('http')) {
          return `action="http://${wsUrl}${proxyPath}${encodeURIComponent(action)}"`;
        } else if (action.startsWith('/')) {
          return `action="http://${wsUrl}${proxyPath}${encodeURIComponent(url.origin + action)}"`;
        }
        return match;
      });
      
      // Add base tag to fix remaining relative URLs
      const baseTag = `<base href="http://${wsUrl}${proxyPath}${encodeURIComponent(url.origin + '/')}">`;
      content = content.replace(/<head>/i, `<head>${baseTag}`);
      
      // Remove frame-busting scripts
      content = content.replace(/if\s*\(\s*top\s*[!=]==?\s*self\s*\)/gi, 'if(false)');
      content = content.replace(/if\s*\(\s*self\s*[!=]==?\s*top\s*\)/gi, 'if(false)');
      content = content.replace(/if\s*\(\s*window\s*[!=]==?\s*window\.top\s*\)/gi, 'if(false)');
      
      // Inject navigation interceptor script
      const navigationScript = `
        <script>
          // Intercept navigation and redirect through proxy
          document.addEventListener('DOMContentLoaded', function() {
            // Intercept all link clicks
            document.addEventListener('click', function(e) {
              const link = e.target.closest('a');
              if (link && link.href && !link.href.includes('${proxyPath}')) {
                e.preventDefault();
                const proxyUrl = 'http://${wsUrl}${proxyPath}' + encodeURIComponent(link.href);
                window.location.href = proxyUrl;
              }
            });
            
            // Intercept form submissions
            document.addEventListener('submit', function(e) {
              const form = e.target;
              if (form.action && !form.action.includes('${proxyPath}')) {
                const actionUrl = form.action.startsWith('http') ? form.action : '${url.origin}' + form.action;
                form.action = 'http://${wsUrl}${proxyPath}' + encodeURIComponent(actionUrl);
              }
            });
          });
        </script>
      `;
      content = content.replace(/<\/head>/i, `${navigationScript}</head>`);
      
      // Add proxy indicator
      const indicator = `
        <div style="position: fixed; top: 0; left: 0; right: 0; background: rgba(59, 130, 246, 0.9); color: white; text-align: center; padding: 2px 8px; font-size: 12px; z-index: 999999; font-family: system-ui;">
          📱 Viewing via Mobile Terminal IDE Proxy - Navigation enabled
        </div>
        <div style="height: 24px;"></div>
      `;
      content = content.replace(/<body[^>]*>/i, `$&${indicator}`);
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

// Terminal sessions - organized by user
const terminals = new Map(); // socketId -> terminalSession
const userTerminals = new Map(); // userId -> Set of socketIds

// Create a new terminal session
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  console.log('Total connected clients:', io.engine.clientsCount);

  socket.on('create-terminal', (data) => {
    const { userId, workspaceId } = data;
    
    // For now, allow terminals without user auth for backward compatibility
    // In production, you'd want to verify the JWT token here
    
    const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';
    
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
    
    const term = pty.spawn(shell, [], {
      name: 'xterm-color',
      cols: data.cols || 80,
      rows: data.rows || 24,
      cwd: cwd,
      env: {
        ...process.env,
        PS1: userId ? `[${userId.slice(0, 8)}@workspace] $ ` : '$ ' // Custom prompt for user
      }
    });

    const terminalSession = {
      term,
      userId,
      workspaceId,
      cwd,
      createdAt: new Date()
    };

    terminals.set(socket.id, terminalSession);
    
    // Track user terminals
    if (userId) {
      if (!userTerminals.has(userId)) {
        userTerminals.set(userId, new Set());
      }
      userTerminals.get(userId).add(socket.id);
    }
    
    term.on('data', (data) => {
      socket.emit('terminal-output', data);
    });

    socket.on('terminal-input', (data) => {
      term.write(data);
    });

    socket.on('resize', (data) => {
      term.resize(data.cols, data.rows);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      const session = terminals.get(socket.id);
      if (session) {
        session.term.kill();
        terminals.delete(socket.id);
        
        // Clean up user tracking
        if (session.userId && userTerminals.has(session.userId)) {
          userTerminals.get(session.userId).delete(socket.id);
          if (userTerminals.get(session.userId).size === 0) {
            userTerminals.delete(session.userId);
          }
        }
      }
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

// Catch-all handler for SPA in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
  });
}

const PORT = process.env.PORT || 3001;
const HOST = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';

server.listen(PORT, HOST, () => {
  console.log(`Server running on ${HOST}:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Socket.io path: /socket.io/`);
});