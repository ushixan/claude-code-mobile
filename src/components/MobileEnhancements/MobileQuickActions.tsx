import { useState } from 'react';
import { 
  Copy, 
  Clipboard, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut,
  Plus,
  X,
  ChevronUp
} from 'lucide-react';

interface MobileQuickActionsProps {
  onCopyAll?: () => void;
  onPaste?: () => void;
  onClear?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onNewTerminal?: () => void;
  isTerminalView?: boolean;
}

const MobileQuickActions: React.FC<MobileQuickActionsProps> = ({
  onCopyAll,
  onPaste,
  onClear,
  onZoomIn,
  onZoomOut,
  onNewTerminal,
  isTerminalView = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const actions = [
    {
      icon: Copy,
      label: 'Copy All',
      action: onCopyAll,
      color: 'bg-purple-600',
      show: isTerminalView
    },
    {
      icon: Clipboard,
      label: 'Paste',
      action: onPaste,
      color: 'bg-green-600',
      show: isTerminalView
    },
    {
      icon: RotateCcw,
      label: 'Clear',
      action: onClear,
      color: 'bg-red-600',
      show: isTerminalView
    },
    {
      icon: ZoomIn,
      label: 'Zoom In',
      action: onZoomIn,
      color: 'bg-blue-600',
      show: true
    },
    {
      icon: ZoomOut,
      label: 'Zoom Out',
      action: onZoomOut,
      color: 'bg-blue-600',
      show: true
    },
    {
      icon: Plus,
      label: 'New Terminal',
      action: onNewTerminal,
      color: 'bg-teal-600',
      show: isTerminalView
    }
  ].filter(action => action.show);
  
  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-20 right-4 z-40">
        {/* Expanded Actions */}
        {isExpanded && (
          <div className="absolute bottom-16 right-0 flex flex-col gap-2 mb-2">
            {actions.map((action, index) => (
              <button
                key={index}
                onClick={() => {
                  action.action?.();
                  setIsExpanded(false);
                }}
                className={`${action.color} text-white p-3 rounded-full shadow-lg flex items-center gap-2 
                  transform transition-all duration-200 hover:scale-110 active:scale-95
                  animate-in slide-in-from-bottom-2`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <action.icon size={20} />
                <span className="text-xs font-medium pr-2">{action.label}</span>
              </button>
            ))}
          </div>
        )}
        
        {/* Main FAB */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`${
            isExpanded ? 'bg-red-600' : 'bg-indigo-600'
          } text-white p-4 rounded-full shadow-lg transform transition-all duration-300 
          hover:scale-110 active:scale-95 relative`}
        >
          <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-45' : ''}`}>
            {isExpanded ? <X size={24} /> : <ChevronUp size={24} />}
          </div>
          
          {/* Pulse animation when closed */}
          {!isExpanded && (
            <span className="absolute inset-0 rounded-full bg-indigo-600 animate-ping opacity-20"></span>
          )}
        </button>
      </div>
      
      {/* Backdrop when expanded */}
      {isExpanded && (
        <div 
          className="fixed inset-0 bg-black/20 z-30"
          onClick={() => setIsExpanded(false)}
        />
      )}
    </>
  );
};

export default MobileQuickActions;