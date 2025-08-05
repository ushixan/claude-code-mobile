import { useState } from 'react';
import { RefreshCw, ExternalLink, Smartphone, Monitor } from 'lucide-react';
import { useStore } from '../../store/useStore';

const Preview = () => {
  const { previewUrl, setPreviewUrl } = useStore();
  const [deviceMode, setDeviceMode] = useState<'mobile' | 'desktop'>('mobile');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [inputUrl, setInputUrl] = useState(previewUrl);

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
    setPreviewUrl(inputUrl);
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
          placeholder="http://localhost:3000"
          className="flex-1 px-3 py-1.5 bg-slate-700 text-white rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
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
          />
        </div>
      </div>

      {/* Port Configuration Helper */}
      <div className="p-2 bg-slate-800 border-t border-slate-700 text-xs text-slate-400 text-center">
        Tip: Use port forwarding in terminal to expose local services
      </div>
    </div>
  );
};

export default Preview;