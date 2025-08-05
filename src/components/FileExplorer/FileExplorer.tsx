import { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, File, Folder, GitBranch, Plus, MoreVertical, RefreshCw } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useAuth } from '../../contexts/AuthContext';

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
}

const FileExplorer = () => {
  const { fileTree, setFileTree, openFile } = useStore();
  const { user } = useAuth();
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set(['/']));
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [showContextMenu, setShowContextMenu] = useState<{ x: number; y: number; path: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFileTree();
  }, [user]);

  const loadFileTree = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      // Fetch file tree from server with user credentials
      const response = await fetch(`/api/files/tree?userId=${user.id}&workspaceId=${user.id}`);
      if (response.ok) {
        const tree = await response.json();
        setFileTree(tree);
      } else {
        console.error('Failed to load file tree');
        setFileTree([]);
      }
    } catch (error) {
      console.error('Error loading file tree:', error);
      setFileTree([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleDirectory = (path: string) => {
    setExpandedDirs(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const handleFileClick = async (node: FileNode) => {
    if (node.type === 'directory') {
      toggleDirectory(node.path);
    } else {
      if (!user) return;
      
      try {
        // Read file content from server
        const response = await fetch(`/api/files/read?path=${encodeURIComponent(node.path)}&userId=${user.id}&workspaceId=${user.id}`);
        
        if (response.ok) {
          const data = await response.json();
          const language = getLanguageFromFileName(node.name);
          
          openFile({
            path: node.path,
            content: data.content,
            language
          });
        } else {
          openFile({
            path: node.path,
            content: `// Error loading file: ${response.statusText}`,
            language: 'text'
          });
        }
      } catch (error) {
        console.error('Error reading file:', error);
        openFile({
          path: node.path,
          content: `// Error loading file: ${error}`,
          language: 'text'
        });
      }
    }
    setSelectedPath(node.path);
  };

  const getLanguageFromFileName = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const languageMap: Record<string, string> = {
      'ts': 'typescript',
      'tsx': 'typescript',
      'js': 'javascript',
      'jsx': 'javascript',
      'py': 'python',
      'md': 'markdown',
      'json': 'json',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'yaml': 'yaml',
      'yml': 'yaml',
      'xml': 'xml',
      'sh': 'shell',
      'bash': 'shell',
      'c': 'c',
      'cpp': 'cpp',
      'h': 'c',
      'hpp': 'cpp',
      'java': 'java',
      'go': 'go',
      'rs': 'rust',
      'php': 'php',
      'rb': 'ruby',
      'swift': 'swift'
    };
    return languageMap[ext || ''] || 'text';
  };

  const handleRefresh = () => {
    loadFileTree();
  };

  const handleContextMenu = (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    setShowContextMenu({ x: e.clientX, y: e.clientY, path });
  };

  const handleNewFile = async () => {
    if (!user || !showContextMenu) return;
    
    const fileName = prompt('Enter file name:');
    if (!fileName) return;
    
    const basePath = showContextMenu.path;
    const newPath = basePath.endsWith('/') ? basePath + fileName : basePath + '/' + fileName;
    
    try {
      const response = await fetch('/api/files/write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: newPath,
          content: '',
          userId: user.id,
          workspaceId: user.id
        })
      });
      
      if (response.ok) {
        await loadFileTree();
        setShowContextMenu(null);
      }
    } catch (error) {
      console.error('Error creating file:', error);
    }
  };

  const renderTree = (nodes: FileNode[], level = 0) => {
    return nodes.map(node => (
      <div key={node.path}>
        <div
          className={`flex items-center gap-2 px-2 py-1.5 hover:bg-slate-800 cursor-pointer select-none ${
            selectedPath === node.path ? 'bg-slate-800' : ''
          }`}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => handleFileClick(node)}
          onContextMenu={(e) => handleContextMenu(e, node.path)}
        >
          {node.type === 'directory' ? (
            <>
              {expandedDirs.has(node.path) ? (
                <ChevronDown size={16} className="text-slate-400" />
              ) : (
                <ChevronRight size={16} className="text-slate-400" />
              )}
              <Folder size={16} className="text-blue-400" />
            </>
          ) : (
            <>
              <div className="w-4" />
              <File size={16} className="text-slate-400" />
            </>
          )}
          <span className="text-sm flex-1">{node.name}</span>
          {node.path.includes('.git') && (
            <GitBranch size={14} className="text-green-400" />
          )}
        </div>
        {node.type === 'directory' && node.children && expandedDirs.has(node.path) && (
          <div>{renderTree(node.children, level + 1)}</div>
        )}
      </div>
    ));
  };

  if (loading) {
    return (
      <div className="h-full bg-slate-900 text-slate-300 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-sm text-slate-400">Loading workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-slate-900 text-slate-300 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-slate-700">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide">Explorer</h2>
          {user && (
            <p className="text-xs text-slate-500 mt-1">Workspace: {user.email?.split('@')[0]}</p>
          )}
        </div>
        <div className="flex gap-1">
          <button 
            className="p-1 hover:bg-slate-800 rounded"
            onClick={handleRefresh}
            title="Refresh"
          >
            <RefreshCw size={18} />
          </button>
          <button className="p-1 hover:bg-slate-800 rounded">
            <Plus size={18} />
          </button>
          <button className="p-1 hover:bg-slate-800 rounded">
            <MoreVertical size={18} />
          </button>
        </div>
      </div>

      {/* File tree */}
      <div className="flex-1 overflow-auto">
        {fileTree.length > 0 ? (
          renderTree(fileTree)
        ) : (
          <div className="p-4 text-center text-slate-500">
            <p className="text-sm">Your workspace is ready!</p>
            <p className="text-xs mt-2">Use the terminal to:</p>
            <ul className="text-xs mt-2 space-y-1">
              <li>• Create files: <code className="bg-slate-800 px-1 rounded">touch file.txt</code></li>
              <li>• Clone repos: <code className="bg-slate-800 px-1 rounded">git clone [url]</code></li>
              <li>• Make directories: <code className="bg-slate-800 px-1 rounded">mkdir folder</code></li>
            </ul>
            <button 
              onClick={handleRefresh}
              className="mt-3 text-blue-400 hover:text-blue-300 text-xs"
            >
              Refresh to see changes
            </button>
          </div>
        )}
      </div>

      {/* Context menu */}
      {showContextMenu && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowContextMenu(null)}
          />
          <div
            className="absolute z-20 bg-slate-800 border border-slate-700 rounded-md shadow-lg py-1 min-w-[150px]"
            style={{ left: showContextMenu.x, top: showContextMenu.y }}
          >
            <button 
              className="w-full px-3 py-1.5 text-left text-sm hover:bg-slate-700"
              onClick={handleNewFile}
            >
              New File
            </button>
            <button className="w-full px-3 py-1.5 text-left text-sm hover:bg-slate-700">
              New Folder
            </button>
            <hr className="my-1 border-slate-700" />
            <button className="w-full px-3 py-1.5 text-left text-sm hover:bg-slate-700">
              Rename
            </button>
            <button className="w-full px-3 py-1.5 text-left text-sm hover:bg-slate-700 text-red-400">
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default FileExplorer;