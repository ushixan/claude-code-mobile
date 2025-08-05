import { useEffect } from 'react';
import { Terminal, Code, Globe, FolderOpen } from 'lucide-react';
import { useStore } from './store/useStore';
import TerminalComponent from './components/Terminal/Terminal';
import EditorComponent from './components/Editor/Editor';
import PreviewComponent from './components/Preview/Preview';
import FileExplorerComponent from './components/FileExplorer/FileExplorer';

function App() {
  const { activeTab, setActiveTab } = useStore();

  useEffect(() => {
    // Register service worker for PWA
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(console.error);
    }

    // Prevent pull-to-refresh on iOS
    document.body.addEventListener('touchmove', (e) => {
      if (e.touches.length > 1) return;
      e.preventDefault();
    }, { passive: false });
  }, []);

  const tabs = [
    { id: 'terminal', icon: Terminal, label: 'Terminal' },
    { id: 'editor', icon: Code, label: 'Editor' },
    { id: 'preview', icon: Globe, label: 'Preview' },
    { id: 'files', icon: FolderOpen, label: 'Files' },
  ] as const;

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-white">
      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden">
        <div className="h-full">
          {activeTab === 'terminal' && <TerminalComponent />}
          {activeTab === 'editor' && <EditorComponent />}
          {activeTab === 'preview' && <PreviewComponent />}
          {activeTab === 'files' && <FileExplorerComponent />}
        </div>
      </main>

      {/* Bottom Tab Navigation */}
      <nav className="flex justify-around items-center bg-slate-800 border-t border-slate-700 px-2 py-1 safe-area-inset-bottom">
        {tabs.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${
              activeTab === id
                ? 'text-blue-400 bg-slate-700/50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Icon size={24} />
            <span className="text-xs mt-1">{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

export default App;