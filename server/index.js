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
  app.use(express.static(distPath));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Terminal sessions
const terminals = new Map();

// Create a new terminal session
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('create-terminal', (data) => {
    const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';
    const cwd = data.cwd || process.env.HOME;
    
    const term = pty.spawn(shell, [], {
      name: 'xterm-color',
      cols: data.cols || 80,
      rows: data.rows || 24,
      cwd: cwd,
      env: process.env
    });

    terminals.set(socket.id, term);
    
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
      const term = terminals.get(socket.id);
      if (term) {
        term.kill();
        terminals.delete(socket.id);
      }
    });
    
    // Send initial prompt
    socket.emit('terminal-ready');
  });
});

// File system API endpoints
app.get('/api/files/tree', async (req, res) => {
  const rootPath = req.query.path || process.env.HOME;
  
  try {
    const tree = await buildFileTree(rootPath);
    res.json(tree);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/files/read', async (req, res) => {
  const filePath = req.query.path;
  
  if (!filePath) {
    return res.status(400).json({ error: 'Path is required' });
  }
  
  try {
    const content = await fs.readFile(filePath, 'utf8');
    res.json({ content });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/files/write', async (req, res) => {
  const { path: filePath, content } = req.body;
  
  if (!filePath || content === undefined) {
    return res.status(400).json({ error: 'Path and content are required' });
  }
  
  try {
    await fs.writeFile(filePath, content, 'utf8');
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
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});