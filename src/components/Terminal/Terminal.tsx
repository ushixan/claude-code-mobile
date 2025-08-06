import { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import '@xterm/xterm/css/xterm.css';
import io, { Socket } from 'socket.io-client';
import { useStore } from '../../store/useStore';
import { useAuth } from '../../contexts/AuthContext';
import TouchControls from './TouchControls';

const TerminalComponent = () => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [fontSize, setFontSize] = useState(window.innerWidth < 768 ? 12 : 14);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [showCopyButton, setShowCopyButton] = useState(false);
  const { setTerminalReady, currentWorkspace } = useStore();
  const { user } = useAuth();

  useEffect(() => {
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
        selection: '#4a5568',
      },
      fontSize: fontSize,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      cursorBlink: true,
      scrollback: 1000,
      allowProposedApi: true,
      // Mobile optimizations
      scrollOnUserInput: true,
    });

    xtermRef.current = term;
    // Expose terminal instance globally for arrow controls
    (window as any).xtermRef = xtermRef;

    // Add addons
    const fitAddon = new FitAddon();
    fitAddonRef.current = fitAddon;
    term.loadAddon(fitAddon);
    
    const webLinksAddon = new WebLinksAddon((event, uri) => {
      // Open links in a new tab/window
      event.preventDefault();
      window.open(uri, '_blank', 'noopener,noreferrer');
    });
    term.loadAddon(webLinksAddon);

    // Open terminal
    term.open(terminalRef.current);
    fitAddon.fit();
    
    // Focus the terminal so it can receive keyboard input
    setTimeout(() => {
      term.focus();
    }, 100);
    
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
      } else {
        setSelectedText('');
        setShowCopyButton(false);
      }
    });

    // Connect to WebSocket server - Vite proxy will handle routing in development
    console.log('Connecting to WebSocket via current origin');
    console.log('Current location:', window.location.href);
    
    const socket = io();
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to terminal server');
      setIsConnected(true);
      
      // Create terminal session with user context
      socket.emit('create-terminal', {
        cols: term.cols,
        rows: term.rows,
        userId: user?.id,
        workspaceId: user?.id // Use user.id as workspaceId for simplicity
      });
    });

    socket.on('terminal-ready', () => {
      console.log('Terminal ready');
      setTerminalReady(true);
      term.write('\x1b[32mTerminal connected successfully!\x1b[0m\r\n');
    });

    socket.on('terminal-output', (data: string) => {
      term.write(data);
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
      socket.disconnect();
      term.dispose();
      setTerminalReady(false);
    };
  }, [fontSize, setTerminalReady, user, currentWorkspace]);

  // Pinch to zoom handler
  const handlePinch = (scale: number) => {
    setFontSize(prev => {
      const newSize = Math.max(10, Math.min(24, prev * scale));
      return Math.round(newSize);
    });
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
        // Clear selection and hide button
        if (xtermRef.current) {
          xtermRef.current.clearSelection();
        }
        setShowCopyButton(false);
        setSelectedText('');
      } catch (err) {
        console.error('Failed to copy text:', err);
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = selectedText;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          document.execCommand('copy');
          console.log('Text copied using fallback method');
          if (xtermRef.current) {
            xtermRef.current.clearSelection();
          }
          setShowCopyButton(false);
          setSelectedText('');
        } catch (err2) {
          console.error('Fallback copy failed:', err2);
        }
        document.body.removeChild(textArea);
      }
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
      
      {/* Connection status */}
      {!isConnected && (
        <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded text-xs">
          Disconnected
        </div>
      )}
      
      {/* Copy button */}
      {showCopyButton && (
        <button
          onClick={handleCopy}
          className="absolute top-2 left-2 bg-blue-600 text-white px-3 py-1 rounded text-sm shadow-lg active:scale-95 transition-all duration-150 flex items-center gap-2 z-10"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Copy
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