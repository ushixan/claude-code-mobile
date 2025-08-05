import { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, File, Folder, GitBranch, Plus, MoreVertical } from 'lucide-react';
import { useStore } from '../../store/useStore';

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
}

// Mock data for now
const mockFileTree: FileNode[] = [
  {
    name: 'src',
    path: '/src',
    type: 'directory',
    children: [
      {
        name: 'components',
        path: '/src/components',
        type: 'directory',
        children: [
          { name: 'App.tsx', path: '/src/components/App.tsx', type: 'file' },
          { name: 'Header.tsx', path: '/src/components/Header.tsx', type: 'file' },
        ]
      },
      { name: 'index.ts', path: '/src/index.ts', type: 'file' },
      { name: 'styles.css', path: '/src/styles.css', type: 'file' },
    ]
  },
  { name: 'package.json', path: '/package.json', type: 'file' },
  { name: 'README.md', path: '/README.md', type: 'file' },
];

const FileExplorer = () => {
  const { fileTree, setFileTree, openFile } = useStore();
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set(['/']));
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [showContextMenu, setShowContextMenu] = useState<{ x: number; y: number; path: string } | null>(null);

  useEffect(() => {
    // Initialize with mock data
    setFileTree(mockFileTree);
  }, [setFileTree]);

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

  const handleFileClick = (node: FileNode) => {
    if (node.type === 'directory') {
      toggleDirectory(node.path);
    } else {
      // Mock file content
      openFile({
        path: node.path,
        content: `// Content of ${node.name}\n\nexport default function() {\n  return "Hello from ${node.name}";\n}`,
        language: node.name.endsWith('.ts') || node.name.endsWith('.tsx') ? 'typescript' : 
                  node.name.endsWith('.js') || node.name.endsWith('.jsx') ? 'javascript' :
                  node.name.endsWith('.py') ? 'python' : 'text'
      });
    }
    setSelectedPath(node.path);
  };

  const handleContextMenu = (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    setShowContextMenu({ x: e.clientX, y: e.clientY, path });
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

  return (
    <div className="h-full bg-slate-900 text-slate-300 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-slate-700">
        <h2 className="text-sm font-semibold uppercase tracking-wide">Explorer</h2>
        <div className="flex gap-1">
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
        {renderTree(fileTree)}
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
            <button className="w-full px-3 py-1.5 text-left text-sm hover:bg-slate-700">
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