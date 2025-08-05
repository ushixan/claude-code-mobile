import { useState } from 'react';
import { RefreshCw, ExternalLink, Smartphone, Monitor, Shield } from 'lucide-react';
import { useStore } from '../../store/useStore';

const Preview = () => {
  const { previewUrl, setPreviewUrl } = useStore();
  const [deviceMode, setDeviceMode] = useState<'mobile' | 'desktop'>('mobile');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [inputUrl, setInputUrl] = useState(previewUrl);
  const [useProxy, setUseProxy] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    const iframe = document.getElementById('preview-iframe') as HTMLIFrameElement;
    if (iframe) {
      iframe.src = iframe.src;
    }
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (useProxy && !inputUrl.startsWith('http://localhost') && !inputUrl.startsWith('http://127.0.0.1')) {
      // Use comprehensive backend proxy for navigation-heavy sites
      if (inputUrl.includes('google.com') || inputUrl.includes('search')) {
        // Google needs comprehensive proxy for search navigation
        const proxyUrl = `/api/proxy?url=${encodeURIComponent(inputUrl)}`;
        console.log('Setting proxy URL for Google:', proxyUrl);
        console.log('Original URL:', inputUrl);
        setPreviewUrl(proxyUrl);
      } else if (inputUrl.includes('github.com')) {
        // GitHub can use simple Vite proxy
        const path = inputUrl.replace('https://github.com', '');
        setPreviewUrl(`/gh${path}`);
      } else {
        // Default to comprehensive backend proxy for unknown sites
        const proxyUrl = `/api/proxy?url=${encodeURIComponent(inputUrl)}`;
        setPreviewUrl(proxyUrl);
      }
    } else {
      // Direct URL
      setPreviewUrl(inputUrl);
    }
  };

  const openInNewTab = () => {
    window.open(previewUrl, '_blank');
  };

  const deviceDimensions = {
    mobile: { width: '375px', height: '667px' },
    desktop: { width: '100%', height: '100%' }
  };

  return (
    <div className="h-full flex flex-col bg-slate-900">
      {/* URL Bar */}
      <form onSubmit={handleUrlSubmit} className="flex items-center gap-2 p-2 bg-slate-800 border-b border-slate-700">
        <input
          type="url"
          value={inputUrl}
          onChange={(e) => setInputUrl(e.target.value)}
          placeholder="http://localhost:3000 or https://github.com"
          className="flex-1 px-3 py-1.5 bg-slate-700 text-white rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="button"
          onClick={() => setUseProxy(!useProxy)}
          className={`p-2 rounded-md transition-all ${
            useProxy ? 'bg-green-600 hover:bg-green-700' : 'hover:bg-slate-700'
          }`}
          title={useProxy ? 'Proxy enabled - bypasses iframe blocking' : 'Enable proxy to bypass iframe blocking'}
        >
          <Shield size={18} />
        </button>
        <button
          type="button"
          onClick={handleRefresh}
          className={`p-2 rounded-md hover:bg-slate-700 transition-all ${
            isRefreshing ? 'animate-spin' : ''
          }`}
        >
          <RefreshCw size={18} />
        </button>
        <button
          type="button"
          onClick={openInNewTab}
          className="p-2 rounded-md hover:bg-slate-700"
        >
          <ExternalLink size={18} />
        </button>
        <button
          type="button"
          onClick={() => setDeviceMode(deviceMode === 'mobile' ? 'desktop' : 'mobile')}
          className="p-2 rounded-md hover:bg-slate-700"
        >
          {deviceMode === 'mobile' ? <Monitor size={18} /> : <Smartphone size={18} />}
        </button>
      </form>

      {/* Preview Container */}
      <div className="flex-1 bg-slate-800 overflow-auto p-4">
        <div
          className={`mx-auto bg-white rounded-lg shadow-2xl overflow-hidden transition-all ${
            deviceMode === 'mobile' ? 'max-w-sm' : 'w-full h-full'
          }`}
          style={deviceMode === 'mobile' ? deviceDimensions.mobile : undefined}
        >
          <iframe
            id="preview-iframe"
            src={previewUrl}
            className="w-full h-full border-0"
            title="Preview"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            onLoad={() => {
              console.log('Iframe loaded successfully:', previewUrl);
            }}
            onError={() => {
              console.log('Iframe failed to load:', previewUrl);
            }}
          />
        </div>
      </div>

      {/* Port Configuration Helper */}
      <div className="p-2 bg-slate-800 border-t border-slate-700 text-xs text-slate-400 text-center">
        <div>Tip: Use port forwarding in terminal to expose local services</div>
        <div className="mt-1 flex items-center justify-center gap-2">
          <Shield size={14} className={useProxy ? 'text-green-400' : 'text-slate-400'} />
          <span className={useProxy ? 'text-green-400' : 'text-yellow-400'}>
            {useProxy 
              ? 'Proxy enabled - can view blocked sites like GitHub, Google' 
              : 'Enable proxy (shield icon) to bypass iframe blocking'
            }
          </span>
        </div>
      </div>
    </div>
  );
};

export default Preview;