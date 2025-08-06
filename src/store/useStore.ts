import { create } from 'zustand';
import type { UserWorkspace } from '../lib/supabase';

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
}

interface OpenFile {
  path: string;
  content: string;
  language?: string;
}

interface TerminalSession {
  id: string;
  name: string;
  isActive: boolean;
}

interface AppState {
  activeTab: 'terminal' | 'editor' | 'preview' | 'files';
  setActiveTab: (tab: AppState['activeTab']) => void;
  
  openFiles: OpenFile[];
  activeFile: string | null;
  openFile: (file: OpenFile) => void;
  closeFile: (path: string) => void;
  setActiveFile: (path: string) => void;
  updateFileContent: (path: string, content: string) => void;
  
  fileTree: FileNode[];
  setFileTree: (tree: FileNode[]) => void;
  
  currentWorkspace: UserWorkspace | null;
  setCurrentWorkspace: (workspace: UserWorkspace | null) => void;
  
  terminalReady: boolean;
  setTerminalReady: (ready: boolean) => void;
  
  terminals: TerminalSession[];
  activeTerminalId: string;
  addTerminal: () => void;
  removeTerminal: (id: string) => void;
  setActiveTerminal: (id: string) => void;
  renameTerminal: (id: string, name: string) => void;
  
  previewUrl: string;
  setPreviewUrl: (url: string) => void;
}

export const useStore = create<AppState>((set) => ({
  activeTab: 'terminal',
  setActiveTab: (tab) => set({ activeTab: tab }),
  
  openFiles: [],
  activeFile: null,
  openFile: (file) => set((state) => {
    const exists = state.openFiles.find(f => f.path === file.path);
    if (exists) {
      return { activeFile: file.path };
    }
    return {
      openFiles: [...state.openFiles, file],
      activeFile: file.path,
      activeTab: 'editor'
    };
  }),
  closeFile: (path) => set((state) => {
    const newFiles = state.openFiles.filter(f => f.path !== path);
    const newActiveFile = state.activeFile === path 
      ? (newFiles.length > 0 ? newFiles[newFiles.length - 1].path : null)
      : state.activeFile;
    return {
      openFiles: newFiles,
      activeFile: newActiveFile
    };
  }),
  setActiveFile: (path) => set({ activeFile: path, activeTab: 'editor' }),
  updateFileContent: (path, content) => set((state) => ({
    openFiles: state.openFiles.map(f => 
      f.path === path ? { ...f, content } : f
    )
  })),
  
  fileTree: [],
  setFileTree: (tree) => set({ fileTree: tree }),
  
  currentWorkspace: null,
  setCurrentWorkspace: (workspace) => set({ currentWorkspace: workspace }),
  
  terminalReady: false,
  setTerminalReady: (ready) => set({ terminalReady: ready }),
  
  terminals: [{ id: '1', name: 'Terminal 1', isActive: true }],
  activeTerminalId: '1',
  addTerminal: () => set((state) => {
    const newId = String(Date.now());
    const newTerminal: TerminalSession = {
      id: newId,
      name: `Terminal ${state.terminals.length + 1}`,
      isActive: false
    };
    return {
      terminals: [...state.terminals, newTerminal],
      activeTerminalId: newId
    };
  }),
  removeTerminal: (id) => set((state) => {
    const newTerminals = state.terminals.filter(t => t.id !== id);
    if (newTerminals.length === 0) {
      const defaultTerminal: TerminalSession = { id: '1', name: 'Terminal 1', isActive: true };
      return {
        terminals: [defaultTerminal],
        activeTerminalId: '1'
      };
    }
    const newActiveId = state.activeTerminalId === id 
      ? newTerminals[newTerminals.length - 1].id 
      : state.activeTerminalId;
    return {
      terminals: newTerminals,
      activeTerminalId: newActiveId
    };
  }),
  setActiveTerminal: (id) => set({ activeTerminalId: id }),
  renameTerminal: (id, name) => set((state) => ({
    terminals: state.terminals.map(t => 
      t.id === id ? { ...t, name } : t
    )
  })),
  
  previewUrl: 'http://localhost:3000',
  setPreviewUrl: (url) => set({ previewUrl: url })
}));