# Mobile Terminal IDE

A Progressive Web App (PWA) designed for iPhone that provides a full-featured terminal IDE with Claude Code CLI integration.

## Features

- **Terminal Tab**: Full xterm.js terminal with mobile touch support
  - Pinch to zoom for font size
  - Swipe gestures for arrow keys
  - WebSocket connection to backend PTY
  - Claude Code CLI pre-installed

- **Editor Tab**: CodeMirror 6 with mobile optimizations
  - Syntax highlighting for multiple languages
  - Tab support with file switching
  - Mobile-friendly font sizes

- **Preview Tab**: Embedded browser with port forwarding
  - Mobile/desktop viewport modes
  - Refresh and external link support
  - Port configuration helper

- **Files Tab**: File explorer with Git integration
  - Tree view navigation
  - File operations (create, rename, delete)
  - Git status indicators

## Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd mobile-terminal-ide
```

2. Install dependencies:
```bash
npm install
```

3. Install Claude Code CLI in the server (optional):
```bash
cd server
npm install -g @anthropic/claude-code
```

## Running the App

1. Start both frontend and backend:
```bash
npm run dev:all
```

Or run them separately:

```bash
# Terminal 1 - Frontend
npm run dev

# Terminal 2 - Backend
npm run dev:server
```

2. Open http://localhost:5173 on your iPhone

3. Add to Home Screen for full PWA experience:
   - Tap the Share button in Safari
   - Select "Add to Home Screen"
   - Launch from home screen for full-screen experience

## Mobile Usage Tips

### Terminal
- **Pinch**: Zoom in/out to adjust font size
- **Swipe**: Arrow key navigation (up/down/left/right)
- **Tap**: Toggle keyboard
- **Blue button**: Manual keyboard toggle

### Editor
- Files open in tabs at the top
- Swipe between tabs
- Green save button (bottom right)

### Preview
- Enter URL in address bar
- Toggle between mobile/desktop view
- External link opens in new tab

### Files
- Tap folders to expand/collapse
- Tap files to open in editor
- Long press for context menu

## Architecture

- **Frontend**: React + Vite + TypeScript + Tailwind CSS
- **Terminal**: xterm.js with Socket.io
- **Editor**: CodeMirror 6
- **Backend**: Node.js + Express + node-pty
- **State**: Zustand

## Development

The app is optimized for mobile but works on desktop too. Key mobile optimizations:

- Touch-friendly UI with large tap targets
- Gesture support throughout
- iOS-specific PWA optimizations
- Prevented rubber-band scrolling
- Keyboard management

## Security Notes

- Terminal runs in sandboxed environment
- File operations restricted to workspace
- WebSocket connections should use HTTPS in production
- Consider authentication for production use

## Next Steps

1. Deploy backend to cloud (Fly.io, Railway, etc.)
2. Add authentication
3. Implement proper file persistence
4. Add collaborative features
5. Enhance Git integration
6. Add more language support

## License

MIT