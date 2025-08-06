import { useState, useEffect, useRef } from 'react';
import { RefreshCw, ExternalLink, Smartphone, Monitor, Shield, Globe, Loader, AlertCircle } from 'lucide-react';
import { useStore } from '../../store/useStore';

type PreviewMode = 'direct' | 'proxy' | 'service-worker' | 'external';
type LoadingState = 'idle' | 'loading' | 'success' | 'error';

const Preview = () => {
  const { previewUrl, setPreviewUrl } = useStore();
  const [deviceMode, setDeviceMode] = useState<'mobile' | 'desktop'>('mobile');
  const [inputUrl, setInputUrl] = useState(previewUrl);
  const [previewMode, setPreviewMode] = useState<PreviewMode>('direct');
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [swReady, setSwReady] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const loadTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Register service worker for preview proxy
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/preview-sw.js', { scope: '/' })
        .then((registration) => {
          console.log('Preview service worker registered:', registration);
          setSwReady(true);
          
          // Check for updates
          registration.update();
        })
        .catch((error) => {
          console.error('Preview service worker registration failed:', error);
        });
    }
  }, []);


  // Smart mode selection based on URL and environment
  const selectBestMode = (url: string): PreviewMode => {
    // Local development URLs work directly
    if (url.includes('localhost') || url.includes('127.0.0.1')) {
      return 'direct';
    }
    
    // Use service worker if available
    if (swReady) {
      return 'service-worker';
    }
    
    // Fallback to server proxy
    return 'proxy';
  };

  const getProxiedUrl = (url: string, mode: PreviewMode): string => {
    switch (mode) {
      case 'direct':
        return url;
      
      case 'service-worker':
        // Use service worker proxy prefix
        return `/__proxy__/${encodeURIComponent(url)}`;
      
      case 'proxy':
        // Use server-side proxy
        return `/api/proxy?url=${encodeURIComponent(url)}`;
      
      case 'external':
        // Open in new tab
        window.open(url, '_blank', 'noopener,noreferrer');
        return '';
      
      default:
        return url;
    }
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputUrl) return;
    
    // Ensure URL has protocol
    let url = inputUrl;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    
    // Auto-select best mode
    const mode = selectBestMode(url);
    setPreviewMode(mode);
    
    // Get proxied URL based on mode
    const finalUrl = getProxiedUrl(url, mode);
    
    if (finalUrl) {
      setLoadingState('loading');
      setErrorMessage('');
      setPreviewUrl(finalUrl);
      
      // Set loading timeout
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
      
      loadTimeoutRef.current = setTimeout(() => {
        if (loadingState === 'loading') {
          handleLoadError('Loading timeout - trying alternative method');
          tryNextMode();
        }
      }, 10000);
    }
  };

  const tryNextMode = () => {
    const modes: PreviewMode[] = ['direct', 'service-worker', 'proxy', 'external'];
    const currentIndex = modes.indexOf(previewMode);
    
    if (currentIndex < modes.length - 1) {
      const nextMode = modes[currentIndex + 1];
      
      // Skip service-worker if not ready
      if (nextMode === 'service-worker' && !swReady) {
        setPreviewMode('proxy');
        const url = getProxiedUrl(inputUrl, 'proxy');
        setPreviewUrl(url);
      } else {
        setPreviewMode(nextMode);
        const url = getProxiedUrl(inputUrl, nextMode);
        
        if (nextMode === 'external') {
          setErrorMessage('Opening in new tab - site cannot be embedded');
        } else {
          setPreviewUrl(url);
        }
      }
    }
  };

  const handleRefresh = () => {
    if (iframeRef.current) {
      setLoadingState('loading');
      iframeRef.current.src = iframeRef.current.src;
    }
  };

  const handleLoadSuccess = () => {
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
    }
    setLoadingState('success');
    setErrorMessage('');
  };

  const handleLoadError = (message?: string) => {
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
    }
    setLoadingState('error');
    setErrorMessage(message || 'Failed to load preview');
  };

  const openInNewTab = () => {
    const url = inputUrl || previewUrl;
    if (url && !url.startsWith('/__proxy__') && !url.includes('/api/proxy')) {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      // Extract original URL from proxy URL
      const match = url.match(/url=([^&]+)/);
      if (match) {
        window.open(decodeURIComponent(match[1]), '_blank', 'noopener,noreferrer');
      }
    }
  };

  const deviceDimensions = {
    mobile: { width: '375px', height: '667px' },
    desktop: { width: '100%', height: '100%' }
  };

  const getModeIcon = () => {
    switch (previewMode) {
      case 'direct':
        return <Globe className="w-4 h-4" />;
      case 'service-worker':
        return <Shield className="w-4 h-4 text-blue-400" />;
      case 'proxy':
        return <Shield className="w-4 h-4 text-green-400" />;
      case 'external':
        return <ExternalLink className="w-4 h-4 text-yellow-400" />;
      default:
        return <Globe className="w-4 h-4" />;
    }
  };

  const getModeLabel = () => {
    switch (previewMode) {
      case 'direct':
        return 'Direct';
      case 'service-worker':
        return 'SW Proxy';
      case 'proxy':
        return 'Server Proxy';
      case 'external':
        return 'External';
      default:
        return 'Unknown';
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="h-full flex flex-col bg-slate-900">
      {/* URL Bar */}
      <form onSubmit={handleUrlSubmit} className="flex items-center gap-2 p-2 bg-slate-800 border-b border-slate-700">
        <input
          type="text"
          value={inputUrl}
          onChange={(e) => setInputUrl(e.target.value)}
          placeholder="Enter URL (e.g., github.com, localhost:3000)"
          className="flex-1 px-3 py-1.5 bg-slate-700 text-white rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        
        {/* Mode Selector */}
        <div className="flex items-center gap-1 px-2 py-1 bg-slate-700 rounded-md">
          {getModeIcon()}
          <span className="text-xs text-slate-300">{getModeLabel()}</span>
        </div>
        
        <button
          type="button"
          onClick={handleRefresh}
          disabled={loadingState === 'loading'}
          className={`p-2 rounded-md hover:bg-slate-700 transition-all ${
            loadingState === 'loading' ? 'animate-spin' : ''
          }`}
        >
          <RefreshCw size={18} />
        </button>
        
        <button
          type="button"
          onClick={openInNewTab}
          className="p-2 rounded-md hover:bg-slate-700"
          title="Open in new tab"
        >
          <ExternalLink size={18} />
        </button>
        
        <button
          type="button"
          onClick={() => setDeviceMode(deviceMode === 'mobile' ? 'desktop' : 'mobile')}
          className="p-2 rounded-md hover:bg-slate-700"
          title={`Switch to ${deviceMode === 'mobile' ? 'desktop' : 'mobile'} view`}
        >
          {deviceMode === 'mobile' ? <Monitor size={18} /> : <Smartphone size={18} />}
        </button>
      </form>

      {/* Preview Container */}
      <div className="flex-1 bg-slate-800 overflow-auto p-4 relative">
        {/* Loading Overlay */}
        {loadingState === 'loading' && (
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-10">
            <div className="bg-slate-800 rounded-lg p-6 flex flex-col items-center gap-3">
              <Loader className="w-8 h-8 animate-spin text-blue-400" />
              <p className="text-sm text-slate-300">Loading preview...</p>
              <p className="text-xs text-slate-400">Mode: {getModeLabel()}</p>
            </div>
          </div>
        )}

        {/* Error Display */}
        {loadingState === 'error' && errorMessage && (
          <div className="absolute inset-0 bg-slate-900 flex items-center justify-center z-10">
            <div className="bg-slate-800 rounded-lg p-6 max-w-md">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="w-8 h-8 text-red-400" />
                <h3 className="text-lg font-semibold">Preview Failed</h3>
              </div>
              <p className="text-sm text-slate-300 mb-4">{errorMessage}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => tryNextMode()}
                  className="px-4 py-2 bg-blue-600 rounded-md hover:bg-blue-700 transition-colors text-sm"
                >
                  Try Alternative Method
                </button>
                <button
                  onClick={openInNewTab}
                  className="px-4 py-2 bg-slate-700 rounded-md hover:bg-slate-600 transition-colors text-sm"
                >
                  Open in New Tab
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Iframe */}
        <div
          className={`mx-auto bg-white rounded-lg shadow-2xl overflow-hidden transition-all ${
            deviceMode === 'mobile' ? 'max-w-sm' : 'w-full h-full'
          }`}
          style={deviceMode === 'mobile' ? deviceDimensions.mobile : undefined}
        >
          {previewUrl && previewMode !== 'external' && (
            <iframe
              ref={iframeRef}
              src={previewUrl}
              className="w-full h-full border-0"
              title="Preview"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation"
              onLoad={handleLoadSuccess}
              onError={() => handleLoadError('Failed to load iframe')}
            />
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div className="p-2 bg-slate-800 border-t border-slate-700">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              loadingState === 'success' ? 'bg-green-400' :
              loadingState === 'error' ? 'bg-red-400' :
              loadingState === 'loading' ? 'bg-yellow-400 animate-pulse' :
              'bg-slate-400'
            }`} />
            <span className="text-slate-400">
              {loadingState === 'success' ? 'Connected' :
               loadingState === 'error' ? 'Failed' :
               loadingState === 'loading' ? 'Connecting...' :
               'Ready'}
            </span>
          </div>
          
          <div className="flex items-center gap-4 text-slate-400">
            {swReady && (
              <span className="flex items-center gap-1">
                <Shield className="w-3 h-3 text-blue-400" />
                SW Ready
              </span>
            )}
            <span>Mode: {getModeLabel()}</span>
          </div>
        </div>
        
        {/* Tips */}
        <div className="mt-1 text-xs text-slate-500 text-center">
          💡 Tip: Sites blocking iframes will automatically open in a new tab
        </div>
      </div>
    </div>
  );
};

export default Preview;