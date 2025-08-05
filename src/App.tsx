import { useEffect } from 'react';
import { Terminal, Code, Globe, FolderOpen, LogOut } from 'lucide-react';
import { useStore } from './store/useStore';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthForm from './components/Auth/AuthForm';
import TerminalComponent from './components/Terminal/Terminal';
import EditorComponent from './components/Editor/Editor';
import PreviewComponent from './components/Preview/Preview';
import FileExplorerComponent from './components/FileExplorer/FileExplorer';

function MainApp() {
  const { activeTab, setActiveTab } = useStore();
  const { user, signOut } = useAuth();

  const tabs = [
    { id: 'terminal', icon: Terminal, label: 'Terminal' },
    { id: 'editor', icon: Code, label: 'Editor' },
    { id: 'preview', icon: Globe, label: 'Preview' },
    { id: 'files', icon: FolderOpen, label: 'Files' },
  ] as const;

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-white">
      {/* Header with user info */}
      <header className="bg-slate-800 border-b border-slate-700 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Terminal className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-white">Mobile Terminal IDE</h1>
            <p className="text-xs text-slate-400">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center space-x-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm">Sign Out</span>
        </button>
      </header>

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

function App() {
  console.log('App component rendering');
  
  useEffect(() => {
    console.log('App useEffect running');
    // Only register service worker in production
    if ('serviceWorker' in navigator && import.meta.env.PROD) {
      navigator.serviceWorker.register('/sw.js').catch(console.error);
    }

    // Prevent pull-to-refresh on iOS
    document.body.addEventListener('touchmove', (e) => {
      if (e.touches.length > 1) return;
      e.preventDefault();
    }, { passive: false });
  }, []);

  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  );
}

function AuthenticatedApp() {
  const { user, loading } = useAuth();

  console.log('AuthenticatedApp render:', { user: !!user, loading });

  if (loading) {
    console.log('Showing loading screen');
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-300">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('No user, showing auth form');
    return <AuthForm />;
  }

  console.log('User authenticated, showing main app');
  return <MainApp />;
}

export default App;