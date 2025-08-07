import { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import '@xterm/xterm/css/xterm.css';
import io, { Socket } from 'socket.io-client';
import { useStore } from '../../store/useStore';
import { useAuth } from '../../contexts/AuthContext';
import TouchControls from './TouchControls';

interface TerminalProps {
  terminalId?: string;
}

const TerminalComponent = ({ terminalId = '1' }: TerminalProps) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [fontSize, setFontSize] = useState(window.innerWidth < 768 ? 12 : 14);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [showCopyButton, setShowCopyButton] = useState(false);
  const [detectedUrl, setDetectedUrl] = useState('');
  const [showManualCopy, setShowManualCopy] = useState(false);
  const [allTerminalContent, setAllTerminalContent] = useState('');
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [terminalBuffer, setTerminalBuffer] = useState<string[]>(() => {
    // Load saved terminal buffer from localStorage for this specific terminal
    const saved = localStorage.getItem(`terminal-buffer-${terminalId}`);
    return saved ? JSON.parse(saved) : [];
  });
  const { setTerminalReady, currentWorkspace } = useStore();
  const { user } = useAuth();
  
  // Save terminal buffer to localStorage whenever it changes
  useEffect(() => {
    if (terminalBuffer.length > 0) {
      localStorage.setItem(`terminal-buffer-${terminalId}`, JSON.stringify(terminalBuffer));
    }
  }, [terminalBuffer, terminalId]);

  // Store terminal instance globally to prevent recreation, keyed by terminal ID
  useEffect(() => {
    // Initialize global terminal storage if it doesn't exist
    if (!(window as any).globalTerminals) {
      (window as any).globalTerminals = {};
    }
    
    // Check if terminal already exists globally for this ID
    if ((window as any).globalTerminals[terminalId]) {
      xtermRef.current = (window as any).globalTerminals[terminalId];
      const existingTerminal = xtermRef.current;
      
      // Reattach to DOM if needed
      if (terminalRef.current && !terminalRef.current.hasChildNodes()) {
        existingTerminal.open(terminalRef.current);
        if (fitAddonRef.current) {
          fitAddonRef.current.fit();
        }
      }
      
      // Terminal already exists, just refocus
      setTimeout(() => {
        existingTerminal.focus();
      }, 100);
      
      return; // Don't recreate terminal
    }
    
    if (!terminalRef.current) return;

    // Initialize terminal
    const term = new Terminal({
      theme: {
        background: '#0f172a',
        foreground: '#e2e8f0',
        cursor: '#60a5fa',
        black: '#1e293b',
        brightBlack: '#475569',
        red: '#ef4444',
        brightRed: '#f87171',
        green: '#10b981',
        brightGreen: '#34d399',
        yellow: '#f59e0b',
        brightYellow: '#fbbf24',
        blue: '#3b82f6',
        brightBlue: '#60a5fa',
        magenta: '#8b5cf6',
        brightMagenta: '#a78bfa',
        cyan: '#06b6d4',
        brightCyan: '#22d3ee',
        white: '#e2e8f0',
        brightWhite: '#f1f5f9',
      },
      fontSize: fontSize,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      cursorBlink: true,
      scrollback: 5000,
      allowProposedApi: true,
      // Mobile optimizations
      scrollOnUserInput: false, // We control scrolling manually
      smoothScrollDuration: 100,
    });

    xtermRef.current = term;
    // Store terminal globally to persist across tab switches, keyed by ID
    (window as any).globalTerminals[terminalId] = term;

    // Add addons
    const fitAddon = new FitAddon();
    fitAddonRef.current = fitAddon;
    term.loadAddon(fitAddon);
    
    const webLinksAddon = new WebLinksAddon((event, uri) => {
      // Copy URL to clipboard and open in new tab
      event.preventDefault();
      
      // Copy to clipboard
      navigator.clipboard.writeText(uri).then(() => {
        console.log('URL copied to clipboard:', uri);
        // Show visual feedback
        const notification = document.createElement('div');
        notification.textContent = '✅ URL copied!';
        notification.style.cssText = `
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: #10b981;
          color: white;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 16px;
          z-index: 10000;
          animation: fadeInOut 2s ease-in-out;
        `;
        document.body.appendChild(notification);
        setTimeout(() => document.body.removeChild(notification), 2000);
      }).catch(err => {
        console.error('Failed to copy URL:', err);
      });
      
      // Open in new tab
      window.open(uri, '_blank', 'noopener,noreferrer');
    });
    term.loadAddon(webLinksAddon);

    // Open terminal
    term.open(terminalRef.current);
    fitAddon.fit();
    
    // Restore saved terminal buffer
    if (terminalBuffer.length > 0) {
      console.log('Restoring terminal buffer with', terminalBuffer.length, 'lines');
      terminalBuffer.forEach(line => {
        term.write(line);
      });
    }
    
    // Focus the terminal so it can receive keyboard input
    setTimeout(() => {
      term.focus();
    }, 100);
    
    // Track scroll position to show/hide scroll button
    term.onScroll(() => {
      const buffer = term.buffer.active;
      const scrollbackSize = buffer.length - term.rows;
      const scrollOffset = buffer.viewportY;
      
      // Show button if not at the bottom
      if (scrollOffset < scrollbackSize) {
        setShowScrollButton(true);
      } else {
        setShowScrollButton(false);
      }
    });
    
    // Ensure arrow keys and other special keys work properly
    term.attachCustomKeyEventHandler((event) => {
      // Handle copy with Ctrl+C or Cmd+C when there's a selection
      if ((event.ctrlKey || event.metaKey) && event.key === 'c' && term.hasSelection()) {
        const selection = term.getSelection();
        if (selection) {
          navigator.clipboard.writeText(selection).then(() => {
            console.log('Text copied to clipboard');
            // Clear selection after copy
            term.clearSelection();
          }).catch(err => {
            console.error('Failed to copy text:', err);
          });
        }
        return false; // Prevent default only for copy when text is selected
      }
      
      // Allow all other key events to be processed by the terminal
      return true;
    });
    
    // Handle selection changes for mobile copy
    term.onSelectionChange(() => {
      const selection = term.getSelection();
      if (selection) {
        setSelectedText(selection);
        setShowCopyButton(true);
        // Auto-copy on mobile when text is selected
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        if (isMobile && navigator.clipboard) {
          navigator.clipboard.writeText(selection).catch(err => {
            console.log('Auto-copy failed, manual copy required:', err);
          });
        }
      } else {
        setSelectedText('');
        setShowCopyButton(false);
      }
    });

    // Check if socket already exists globally for this terminal
    if (!(window as any).globalSockets) {
      (window as any).globalSockets = {};
    }
    
    let socket: Socket;
    if ((window as any).globalSockets[terminalId] && (window as any).globalSockets[terminalId].connected) {
      socket = (window as any).globalSockets[terminalId];
      socketRef.current = socket;
      console.log('Reusing existing socket connection for terminal', terminalId);
      return; // Socket already connected, don't recreate
    }
    
    // Connect to WebSocket server - Vite proxy will handle routing in development
    console.log('Connecting to WebSocket via current origin');
    console.log('Current location:', window.location.href);
    
    socket = io();
    socketRef.current = socket;
    (window as any).globalSockets[terminalId] = socket;

    socket.on('connect', () => {
      console.log('Connected to terminal server');
      setIsConnected(true);
      
      // Create terminal session with user context and terminal ID
      // Get GitHub username from user metadata if they signed in with GitHub
      const storedGithubUsername = localStorage.getItem('github_username') || undefined;
      const jwtToken = localStorage.getItem('github_token') || undefined;
      let decodedUserId: string | undefined;
      if (jwtToken && jwtToken.split('.').length === 3) {
        try {
          const payload = JSON.parse(atob(jwtToken.split('.')[1]));
          decodedUserId = String(payload.userId || '');
        } catch {
          // ignore decode errors
        }
      }

      const githubUsername = user?.user_metadata?.user_name || user?.user_metadata?.preferred_username || storedGithubUsername;
      const effectiveUserId = user?.id || decodedUserId || 'github-user';
      const userEmail = user?.email || `${githubUsername || effectiveUserId}@users.noreply.github.com`;
      const workspaceId = effectiveUserId; // keep stable per user

      socket.emit('create-terminal', {
        cols: term.cols,
        rows: term.rows,
        userId: effectiveUserId,
        workspaceId: workspaceId, // workspace per user
        terminalId: terminalId,
        githubUsername: githubUsername,
        userEmail: userEmail
      });
    });

    socket.on('terminal-ready', async () => {
      console.log('Terminal ready');
      setTerminalReady(true);
      term.write('\x1b[32mTerminal connected successfully!\x1b[0m\r\n');

      // After terminal is ready, configure git credentials if GitHub token exists
      try {
        const jwtToken = localStorage.getItem('github_token');
        const storedGithubUsername = localStorage.getItem('github_username') || undefined;
        let decodedUserId: string | undefined;
        if (jwtToken && jwtToken.split('.').length === 3) {
          try {
            const payload = JSON.parse(atob(jwtToken.split('.')[1]));
            decodedUserId = String(payload.userId || '');
          } catch {
            // ignore decode errors
          }
        }
        const effectiveUserId = user?.id || decodedUserId || 'github-user';
        const workspaceId = effectiveUserId;

        if (jwtToken) {
          const baseUrl = import.meta.env.DEV ? '' : '';
          const resp = await fetch(`${baseUrl}/api/auth/configure-git`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${jwtToken}`
            },
            body: JSON.stringify({ workspaceId })
          });
          if (resp.ok) {
            term.write(`Configured git for ${storedGithubUsername || 'GitHub user'}\r\n`);
            // Attempt to rewrite origin remote to embed token for immediate push access
            term.write('Rewriting git remote to use token...\r\n');
            term.write('git remote get-url origin\r\n');
            // The user can paste or run the following helper commands manually if needed:
            term.write('# If push still prompts, run: git remote set-url origin https://USERNAME:TOKEN@github.com/OWNER/REPO.git\r\n');
          } else {
            const err = await resp.json().catch(() => ({}));
            term.write(`\x1b[31mGit config failed:\x1b[0m ${err.error || resp.statusText}\r\n`);
          }
        }
      } catch (e) {
        term.write(`\x1b[31mGit config error:\x1b[0m ${e instanceof Error ? e.message : 'unknown'}\r\n`);
      }
    });

    socket.on('terminal-output', (data: string) => {
      // Write to terminal first - don't block
      term.write(data);
      
      // Auto-scroll to bottom to show latest content
      setTimeout(() => {
        if (term) {
          term.scrollToBottom();
        }
      }, 10);
      
      // Save to buffer for persistence
      setTerminalBuffer(prev => {
        const newBuffer = [...prev, data];
        // Limit buffer size to prevent localStorage overflow (keep last 1000 entries)
        if (newBuffer.length > 1000) {
          return newBuffer.slice(-1000);
        }
        return newBuffer;
      });
      
      // Store all terminal content
      setAllTerminalContent(prev => prev + data);
      
      // Detect Claude Code URLs in the output asynchronously
      setTimeout(() => {
        if (data.includes('claude.ai/oauth/authorize')) {
          // Extract the URL more carefully
          const lines = data.split('\n');
          for (const line of lines) {
            if (line.includes('https://claude.ai/oauth/authorize')) {
              // Find the start and end of the URL
              const urlStart = line.indexOf('https://claude.ai/oauth/authorize');
              if (urlStart !== -1) {
                // Find the end of the URL (space, newline, or end of string)
                let urlEnd = line.length;
                for (let i = urlStart; i < line.length; i++) {
                  if (line[i] === ' ' || line[i] === '\r' || line[i] === '\n') {
                    urlEnd = i;
                    break;
                  }
                }
                const url = line.substring(urlStart, urlEnd);
                console.log('Detected Claude URL:', url);
                setDetectedUrl(url);
                
                // Also show an alert immediately
                alert('Claude Code URL detected! Look for the yellow box to copy it.');
                break;
              }
            }
          }
        }
      }, 100);
    });
    
    socket.on('terminal-error', (error: any) => {
      console.error('Terminal error:', error);
      term.write(`\r\n\x1b[31mTerminal Error: ${error.message || 'Unknown error'}\x1b[0m\r\n`);
      setIsConnected(false);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from terminal server');
      setIsConnected(false);
      term.write('\r\n\x1b[31mDisconnected from server\x1b[0m\r\n');
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setIsConnected(false);
      term.write('\r\n\x1b[31mConnection error: ' + error.message + '\x1b[0m\r\n');
    });

    // Handle terminal input - pass all data directly to the server
    term.onData(data => {
      if (socket.connected) {
        socket.emit('terminal-input', data);
        
        // Auto-scroll to bottom when user types
        setTimeout(() => {
          if (term) {
            term.scrollToBottom();
          }
        }, 10);
        
        // Also save user input to buffer for persistence
        setTerminalBuffer(prev => {
          const newBuffer = [...prev, data];
          if (newBuffer.length > 1000) {
            return newBuffer.slice(-1000);
          }
          return newBuffer;
        });
      }
    });

    // Handle terminal resize
    term.onResize(({ cols, rows }) => {
      if (socket.connected) {
        socket.emit('resize', { cols, rows });
      }
    });

    // Handle window resize
    const handleResize = () => {
      if (fitAddonRef.current) {
        fitAddonRef.current.fit();
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      // Don't dispose terminal - keep it alive for tab switching
      // socket.disconnect();
      // term.dispose();
      // setTerminalReady(false);
    };
  }, [fontSize, setTerminalReady, user, currentWorkspace, terminalId]);

  // Pinch to zoom handler
  const handlePinch = (scale: number) => {
    setFontSize(prev => {
      const newSize = Math.max(10, Math.min(24, prev * scale));
      return Math.round(newSize);
    });
  };

  // Show copy notification
  const showCopyNotification = (message: string) => {
    const notification = document.createElement('div');
    notification.textContent = `✅ ${message}`;
    notification.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #10b981;
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 16px;
      z-index: 10000;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    `;
    document.body.appendChild(notification);
    setTimeout(() => document.body.removeChild(notification), 2000);
  };

  // Copy all terminal content
  const handleCopyAll = async () => {
    if (!xtermRef.current) return;
    
    try {
      // Select all content
      xtermRef.current.selectAll();
      const allText = xtermRef.current.getSelection();
      
      if (allText) {
        await navigator.clipboard.writeText(allText);
        showCopyNotification('All terminal content copied!');
        // Clear selection after copying
        setTimeout(() => {
          xtermRef.current?.clearSelection();
        }, 100);
      }
    } catch (err) {
      console.error('Failed to copy all:', err);
      // Try fallback method
      const buffer = xtermRef.current.buffer.active;
      let content = '';
      for (let i = 0; i < buffer.length; i++) {
        const line = buffer.getLine(i);
        if (line) {
          content += line.translateToString(true) + '\n';
        }
      }
      
      try {
        await navigator.clipboard.writeText(content);
        showCopyNotification('All terminal content copied!');
      } catch (err2) {
        console.error('Fallback copy all failed:', err2);
      }
    }
  };

  // Clear terminal
  const clearTerminal = () => {
    if (xtermRef.current) {
      xtermRef.current.clear();
      xtermRef.current.write('\x1b[2J\x1b[H'); // Clear screen and move cursor to top
      setTerminalBuffer([]);
      setAllTerminalContent('');
      localStorage.removeItem(`terminal-buffer-${terminalId}`);
      showCopyNotification('Terminal cleared!');
    }
  };
  
  // Scroll to bottom
  const scrollToBottom = () => {
    if (xtermRef.current) {
      xtermRef.current.scrollToBottom();
      setShowScrollButton(false);
    }
  };

  // Focus terminal for keyboard input
  const focusTerminal = () => {
    if (!xtermRef.current) return;
    
    // Always focus the terminal
    xtermRef.current.focus();
    
    // On mobile, also manage keyboard state
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
      setShowKeyboard(!showKeyboard);
    }
  };
  
  // Handle copy action
  const handleCopy = async () => {
    if (selectedText) {
      try {
        await navigator.clipboard.writeText(selectedText);
        console.log('Text copied to clipboard');
        // Show success feedback
        showCopyNotification('Text copied!');
        setShowCopyButton(false);
        setSelectedText('');
        // Clear selection after a short delay
        setTimeout(() => {
          if (xtermRef.current) {
            xtermRef.current.clearSelection();
          }
        }, 100);
      } catch (err) {
        console.error('Failed to copy text:', err);
        // Fallback for older browsers and mobile
        const textArea = document.createElement('textarea');
        textArea.value = selectedText;
        textArea.style.position = 'fixed';
        textArea.style.top = '0';
        textArea.style.left = '0';
        textArea.style.width = '2em';
        textArea.style.height = '2em';
        textArea.style.padding = '0';
        textArea.style.border = 'none';
        textArea.style.outline = 'none';
        textArea.style.boxShadow = 'none';
        textArea.style.background = 'transparent';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          const successful = document.execCommand('copy');
          if (successful) {
            console.log('Text copied using fallback method');
            setShowCopyButton(false);
            setSelectedText('');
            setTimeout(() => {
              if (xtermRef.current) {
                xtermRef.current.clearSelection();
              }
            }, 100);
          }
        } catch (err2) {
          console.error('Fallback copy failed:', err2);
        }
        document.body.removeChild(textArea);
      }
    }
  };
  
  // Handle paste action
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && xtermRef.current && socketRef.current?.connected) {
        socketRef.current.emit('terminal-input', text);
        xtermRef.current.focus();
      }
    } catch (err) {
      console.error('Failed to paste:', err);
      // Show a textarea for manual paste on mobile
      const input = document.createElement('input');
      input.type = 'text';
      input.style.position = 'fixed';
      input.style.top = '50%';
      input.style.left = '50%';
      input.style.transform = 'translate(-50%, -50%)';
      input.style.zIndex = '9999';
      input.style.padding = '10px';
      input.style.fontSize = '16px';
      input.style.border = '2px solid #3b82f6';
      input.style.borderRadius = '8px';
      input.style.background = '#1e293b';
      input.style.color = '#e2e8f0';
      input.placeholder = 'Paste here and press Enter';
      
      const handleInputKeydown = (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
          const value = (e.target as HTMLInputElement).value;
          if (value && xtermRef.current && socketRef.current?.connected) {
            socketRef.current.emit('terminal-input', value);
            xtermRef.current.focus();
          }
          document.body.removeChild(input);
        } else if (e.key === 'Escape') {
          document.body.removeChild(input);
        }
      };
      
      input.addEventListener('keydown', handleInputKeydown);
      document.body.appendChild(input);
      input.focus();
    }
  };

  return (
    <div className="relative h-full bg-slate-900">
      <div 
        ref={terminalRef} 
        className="h-full cursor-text" 
        tabIndex={0}
        onClick={focusTerminal}
        onFocus={() => xtermRef.current?.focus()}
        onContextMenu={(e) => {
          // Enable context menu for easier copy/paste on mobile
          e.stopPropagation();
        }}
      />
      
      <TouchControls 
        onPinch={handlePinch}
        onSwipe={(direction) => {
          if (!xtermRef.current) return;
          
          // Map swipes to arrow keys
          const arrows = {
            up: '\x1b[A',
            down: '\x1b[B',
            right: '\x1b[C',
            left: '\x1b[D'
          };
          
          if (arrows[direction]) {
            xtermRef.current.write(arrows[direction]);
          }
        }}
        onTap={focusTerminal}
      />
      
      {/* Claude Code URL Detected - Simple and Visible */}
      {detectedUrl && (
        <div className="fixed top-20 left-4 right-4 bg-yellow-500 rounded-lg p-4 shadow-2xl z-50 border-4 border-yellow-600">
          <p className="text-black font-bold text-lg mb-3">⚠️ CLAUDE CODE URL DETECTED!</p>
          
          {/* Show URL in a text input for easy selection */}
          <input
            type="text"
            value={detectedUrl}
            readOnly
            onClick={(e) => {
              e.currentTarget.select();
            }}
            className="w-full p-2 mb-3 border-2 border-black rounded text-xs bg-white text-black font-mono"
          />
          
          <div className="flex flex-col gap-2">
            {/* Simple copy button */}
            <button
              onClick={() => {
                const input = document.querySelector('input[type="text"]') as HTMLInputElement;
                if (input) {
                  input.select();
                  try {
                    document.execCommand('copy');
                    alert('URL Copied! Paste it in your browser.');
                  } catch (e) {
                    alert('Select the URL above and copy it manually');
                  }
                }
              }}
              className="bg-black text-white font-bold py-3 px-4 rounded text-lg"
            >
              COPY URL
            </button>
            
            {/* Open button */}
            <button
              onClick={() => {
                window.open(detectedUrl, '_blank');
              }}
              className="bg-green-600 text-white font-bold py-3 px-4 rounded text-lg"
            >
              OPEN IN BROWSER
            </button>
            
            {/* Close button */}
            <button
              onClick={() => setDetectedUrl('')}
              className="bg-red-600 text-white font-bold py-2 px-4 rounded"
            >
              CLOSE
            </button>
          </div>
        </div>
      )}
      
      {/* Manual Copy Dialog */}
      {showManualCopy && detectedUrl && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 max-w-full w-full">
            <h3 className="text-black font-bold mb-2">Copy this URL:</h3>
            <textarea
              readOnly
              value={detectedUrl}
              className="w-full h-32 p-2 border border-gray-300 rounded text-xs font-mono text-black bg-gray-50"
              onClick={(e) => {
                e.currentTarget.select();
                e.currentTarget.setSelectionRange(0, 99999);
              }}
            />
            <p className="text-gray-600 text-xs mt-2 mb-3">
              Tap the text above, select all, and copy it manually
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  // One more attempt to copy
                  const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
                  if (textarea) {
                    textarea.select();
                    textarea.setSelectionRange(0, 99999);
                    try {
                      document.execCommand('copy');
                      alert('Copied!');
                    } catch (e) {
                      alert('Please copy manually by selecting the text');
                    }
                  }
                }}
                className="flex-1 bg-blue-600 text-white py-2 rounded font-bold"
              >
                Try Copy Again
              </button>
              <button
                onClick={() => {
                  setShowManualCopy(false);
                  setDetectedUrl('');
                }}
                className="flex-1 bg-gray-600 text-white py-2 rounded font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Connection status and Clear button */}
      <div className="absolute top-2 right-2 flex gap-2 z-10">
        <button
          onClick={clearTerminal}
          className="bg-red-600 text-white px-2 py-1 rounded text-xs shadow-lg active:scale-95 transition-all duration-150"
          title="Clear terminal"
        >
          Clear
        </button>
        {!isConnected && (
          <div className="bg-red-600 text-white px-2 py-1 rounded text-xs">
            Disconnected
          </div>
        )}
      </div>
      
      {/* Copy/Paste buttons */}
      <div className="absolute top-2 left-2 flex gap-2 z-10">
        {showCopyButton && (
          <button
            onClick={handleCopy}
            className="bg-blue-600 text-white px-2 py-1 rounded text-xs shadow-lg active:scale-95 transition-all duration-150 flex items-center gap-1"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Copy
          </button>
        )}
        <button
          onClick={handleCopyAll}
          className="bg-purple-600 text-white px-2 py-1 rounded text-xs shadow-lg active:scale-95 transition-all duration-150 flex items-center gap-1"
          title="Copy all terminal content"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
          </svg>
          Copy All
        </button>
        <button
          onClick={handlePaste}
          className="bg-green-600 text-white px-2 py-1 rounded text-xs shadow-lg active:scale-95 transition-all duration-150 flex items-center gap-1"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Paste
        </button>
        <button
          onClick={() => {
            // Search for Claude URL in all terminal content
            const content = allTerminalContent || '';
            const urlMatch = content.match(/https:\/\/claude\.ai\/oauth\/authorize\?[^\s\r\n]+/);
            if (urlMatch) {
              setDetectedUrl(urlMatch[0]);
            } else {
              alert('No Claude Code URL found. Run "claude" command first.');
            }
          }}
          className="bg-orange-600 text-white px-2 py-1 rounded text-xs shadow-lg active:scale-95 transition-all duration-150 flex items-center gap-1"
          title="Find Claude Code URL"
        >
          🔍 Find URL
        </button>
      </div>
      
      {/* Scroll to bottom button */}
      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-20 right-4 w-14 h-14 bg-orange-600 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all duration-200 animate-pulse"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>
      )}
      
      {/* Floating keyboard button */}
      <button
        onClick={focusTerminal}
        className="absolute bottom-4 right-4 w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14v7" />
        </svg>
      </button>
    </div>
  );
};

export default TerminalComponent;