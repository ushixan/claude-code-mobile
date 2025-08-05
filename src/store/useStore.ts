import { create } from 'zustand';

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
  
  terminalReady: boolean;
  setTerminalReady: (ready: boolean) => void;
  
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
  
  terminalReady: false,
  setTerminalReady: (ready) => set({ terminalReady: ready }),
  
  previewUrl: 'http://localhost:3000',
  setPreviewUrl: (url) => set({ previewUrl: url })
}));