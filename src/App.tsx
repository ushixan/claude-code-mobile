import { useEffect } from 'react';
import { Terminal, Code, Globe, FolderOpen, LogOut } from 'lucide-react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useStore } from './store/useStore';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthForm from './components/Auth/AuthForm';
import MultiTerminal from './components/Terminal/MultiTerminal';
import EditorComponent from './components/Editor/Editor';
import PreviewComponent from './components/Preview/Preview';
import FileExplorerComponent from './components/FileExplorer/FileExplorer';
import ArrowControls from './components/ArrowControls/ArrowControls';
import SwipeableView from './components/MobileEnhancements/SwipeableView';
import GitHubLogin from './components/GitHubLogin';
import AuthSuccess from './pages/AuthSuccess';

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
    // Also clear GitHub auth
    localStorage.removeItem('github_token');
    localStorage.removeItem('github_username');
  };

  const handleGitHubLogin = (token: string, username: string) => {
    // Store GitHub credentials in localStorage
    localStorage.setItem('github_token', token);
    localStorage.setItem('github_username', username);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-white" style={{ height: '100dvh' }}>
      {/* Mobile-optimized Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-3 py-2 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 min-w-0">
            <div className="bg-blue-600 p-1.5 rounded-lg shrink-0">
              <Terminal className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="font-semibold text-sm text-white truncate">Mobile IDE</h1>
              <p className="text-xs text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center space-x-1 px-2 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors shrink-0"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-xs hidden sm:inline">Sign Out</span>
          </button>
        </div>
        {/* GitHub Login Section */}
        <div className="mt-2">
          <GitHubLogin onLogin={handleGitHubLogin} />
        </div>
      </header>

      {/* Main Content Area - Keep all components mounted but hidden */}
      <main className="flex-1 overflow-hidden relative">
        <SwipeableView>
          <div className={`absolute inset-0 ${activeTab === 'terminal' ? 'block' : 'hidden'}`}>
            <MultiTerminal />
          </div>
          <div className={`absolute inset-0 ${activeTab === 'editor' ? 'block' : 'hidden'}`}>
            <EditorComponent />
          </div>
          <div className={`absolute inset-0 ${activeTab === 'preview' ? 'block' : 'hidden'}`}>
            <PreviewComponent />
          </div>
          <div className={`absolute inset-0 ${activeTab === 'files' ? 'block' : 'hidden'}`}>
            <FileExplorerComponent />
          </div>
        </SwipeableView>
      </main>

      {/* Arrow Controls */}
      <ArrowControls />

      {/* Mobile-optimized Bottom Navigation */}
      <nav className="flex justify-around items-center bg-slate-800 border-t border-slate-700 px-2 pb-safe shrink-0" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0.5rem)' }}>
        {tabs.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex flex-col items-center justify-center p-3 rounded-lg transition-all active:scale-95 flex-1 ${
              activeTab === id
                ? 'text-blue-400 bg-slate-700/50'
                : 'text-slate-400 active:text-slate-200'
            }`}
          >
            <Icon size={20} />
            <span className="text-[10px] mt-1 font-medium">{label}</span>
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
    // Disable service worker temporarily - it's causing issues
    // if ('serviceWorker' in navigator && import.meta.env.PROD) {
    //   navigator.serviceWorker.register('/sw.js').catch(console.error);
    // }
    
    // Unregister any existing service workers
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => {
          registration.unregister();
          console.log('Unregistered service worker:', registration);
        });
      });
    }
  }, []);

  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/auth/success" element={<AuthSuccess />} />
          <Route path="/*" element={<AuthenticatedApp />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

function AuthenticatedApp() {
  const { user, loading } = useAuth();

  console.log('AuthenticatedApp render:', { user: !!user, loading });

  useEffect(() => {
    // Apply overflow hidden only when user is logged in (MainApp)
    // Allow normal scrolling on auth pages
    if (user) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      // Ensure scrolling works on login page
      document.body.style.overflow = 'auto';
      document.documentElement.style.overflow = 'auto';
      document.body.style.position = '';
      document.body.style.width = '';
    }
    
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [user]);

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