# Codebase Index: Mobile Terminal IDE

## Overview
- **Frontend**: React + Vite + TypeScript + Tailwind
- **Backend**: Node.js + Express + Socket.io + node-pty
- **Auth**: Supabase (frontend) and GitHub OAuth (backend)
- **State**: Zustand
- **PWA**: Service worker assets in `public/`

## Scripts (package.json)
- `dev`: Vite dev server on 5173
- `dev:server`: Express server on 8080 (binds 0.0.0.0)
- `dev:all`: Run frontend and backend together
- `build`: TypeScript build + Vite build to `dist/`
- `start`: Start backend server

## Frontend Structure (`src/`)
- `main.tsx`: App bootstrap and global styles
- `App.tsx`: Routing, auth gate, tab layout (Terminal, Editor, Preview, Files)
- `contexts/AuthContext.tsx`: Supabase auth provider (email/password and GitHub OAuth)
- `store/useStore.ts`: Global state (tabs, files, terminals, preview URL)
- `services/workspaceService.ts`: Supabase persistence for workspaces/files
- `lib/supabase.ts`: Supabase client + types (requires `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
- `styles/mobile.css`: Mobile UI tweaks

### Components (`src/components/`)
- `Terminal/`
  - `MultiTerminal.tsx`: Multi-session orchestration
  - `Terminal.tsx`: xterm.js terminal integration and socket I/O
  - `TouchControls.tsx`: On-screen terminal controls
- `Editor/`
  - `Editor.tsx`: CodeMirror 6 editor with tabs
- `Preview/`
  - `Preview.tsx`: Iframe preview with proxy helpers
- `FileExplorer/`
  - `FileExplorer.tsx`: Tree, CRUD, and Git indicators
- `Auth/`
  - `AuthForm.tsx`: Email/password auth UI; links to GitHub flow
- `ArrowControls/`
  - `ArrowControls.tsx`: Bottom arrow/navigation controls
- `MobileEnhancements/`
  - `SwipeableView.tsx`: Gesture-based tab switching
  - `MobileQuickActions.tsx`: Quick action bar
  - `VirtualKeyboard.tsx`: iOS keyboard helpers
- `pages/`
  - `AuthSuccess.jsx`: Handles GitHub callback params and local storage

## Backend (`server/`)
- `index.js`:
  - Health: `GET /health`
  - Test: `GET /api/test`
  - GitHub OAuth:
    - `GET /api/auth/github` → returns `authUrl`
    - `GET /api/auth/github/callback` → redirects to `/auth/success?token=...`
    - `GET /api/auth/verify` → verifies JWT
    - `POST /api/auth/configure-git` → sets workspace git creds
  - Proxy:
    - `GET /api/simple-proxy?url=...` → raw passthrough
    - `GET /api/render?url=...` → fallback render page
    - `GET /api/proxy?url=...` → iframe-friendly HTML rewrite
  - Files API:
    - `GET /api/files/tree?userId&workspaceId` → file tree
    - `GET /api/files/read?path&userId&workspaceId` → file content
    - `POST /api/files/write { path, content, userId, workspaceId }`
    - `DELETE /api/files/delete?path`
    - `POST /api/files/rename { oldPath, newPath }`
  - Socket.io terminal:
    - `create-terminal`, `terminal-input`, `terminal-output`, `resize`
    - User/workspace-specific directories under `server/user-workspaces/`
  - Static SPA in production from `dist/`
- `auth.js`: GitHub OAuth helper (JWT issuance, token storage, git credential helper)

## Tooling
- `vite.config.ts`: Dev proxies for `/api`, `/socket.io`, and external sites (`/gh`, `/google`, `/site`)
- `tailwind.config.js`, `postcss.config.js`: Styling setup
- `eslint.config.js`, `tsconfig*.json`: Linting and TS

## Public/PWA (`public/`)
- `manifest.json`, `sw.js`, `preview-sw.js`, `unregister-sw.html`, `clear-cache.html`
- App icons: `icon-192.png`, `icon-512.png`

## Environment
- Frontend: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- Backend: `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GITHUB_REDIRECT_URI`, `JWT_SECRET`

## Key Flows
- Auth:
  - Supabase session via `AuthContext`
  - GitHub OAuth via backend; `AuthSuccess.jsx` stores `github_token`/`username`
- Terminal:
  - Socket.io connects to server; spawns `node-pty` shell per user/workspace
- Files:
  - Server-backed file tree and CRUD; optional Supabase persistence service
- Preview:
  - Iframe navigates via `/api/proxy` or dev server proxies

## Quick Links
- Frontend entry: `src/main.tsx`, `src/App.tsx`
- Terminal: `src/components/Terminal/Terminal.tsx`
- Editor: `src/components/Editor/Editor.tsx`
- Preview: `src/components/Preview/Preview.tsx`
- Files: `src/components/FileExplorer/FileExplorer.tsx`
- Auth: `src/contexts/AuthContext.tsx`, `src/pages/AuthSuccess.jsx`
- Store: `src/store/useStore.ts`
- Server: `server/index.js`, `server/auth.js`
- Config: `vite.config.ts`, `tailwind.config.js` 