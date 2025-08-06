import { useState, useEffect } from 'react';
import { Plus, X, Terminal as TerminalIcon, Edit2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useStore } from '../../store/useStore';
import TerminalComponent from './Terminal';

const MultiTerminal = () => {
  const { 
    terminals, 
    activeTerminalId, 
    addTerminal, 
    removeTerminal, 
    setActiveTerminal,
    renameTerminal 
  } = useStore();
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [showTabMenu, setShowTabMenu] = useState(false);
  
  const isMobile = window.innerWidth < 768;
  
  const handleRename = (id: string, newName: string) => {
    if (newName.trim()) {
      renameTerminal(id, newName.trim());
    }
    setEditingId(null);
    setEditName('');
  };
  
  const handleSwipeTab = (direction: 'left' | 'right') => {
    const currentIndex = terminals.findIndex(t => t.id === activeTerminalId);
    if (direction === 'left' && currentIndex > 0) {
      setActiveTerminal(terminals[currentIndex - 1].id);
    } else if (direction === 'right' && currentIndex < terminals.length - 1) {
      setActiveTerminal(terminals[currentIndex + 1].id);
    }
  };
  
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
        if (e.key === 'T') {
          e.preventDefault();
          addTerminal();
        } else if (e.key === 'W' && terminals.length > 1) {
          e.preventDefault();
          removeTerminal(activeTerminalId);
        } else if (e.key === 'Tab') {
          e.preventDefault();
          handleSwipeTab(e.shiftKey ? 'left' : 'right');
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [terminals, activeTerminalId]);
  
  return (
    <div className="flex flex-col h-full bg-slate-900">
      {/* Tab Bar - Optimized for mobile */}
      <div className="bg-slate-800 border-b border-slate-700 flex items-center shrink-0">
        {/* Mobile Tab Navigation */}
        {isMobile ? (
          <div className="flex items-center w-full px-2 py-1">
            {/* Previous Tab Button */}
            <button
              onClick={() => handleSwipeTab('left')}
              className={`p-1.5 rounded transition-colors ${
                terminals.findIndex(t => t.id === activeTerminalId) > 0
                  ? 'text-slate-400 hover:text-white hover:bg-slate-700'
                  : 'text-slate-600 cursor-not-allowed'
              }`}
              disabled={terminals.findIndex(t => t.id === activeTerminalId) === 0}
            >
              <ChevronLeft size={18} />
            </button>
            
            {/* Current Tab Display */}
            <div className="flex-1 mx-2 min-w-0">
              <div 
                className="bg-slate-700 px-3 py-1.5 rounded-lg flex items-center justify-between"
                onClick={() => setShowTabMenu(!showTabMenu)}
              >
                <div className="flex items-center min-w-0 flex-1">
                  <TerminalIcon size={14} className="text-blue-400 shrink-0 mr-2" />
                  <span className="text-sm text-white truncate">
                    {terminals.find(t => t.id === activeTerminalId)?.name}
                  </span>
                  <span className="text-xs text-slate-400 ml-2">
                    ({terminals.findIndex(t => t.id === activeTerminalId) + 1}/{terminals.length})
                  </span>
                </div>
                <Plus size={16} className="text-slate-400 shrink-0 ml-2" />
              </div>
            </div>
            
            {/* Next Tab Button */}
            <button
              onClick={() => handleSwipeTab('right')}
              className={`p-1.5 rounded transition-colors ${
                terminals.findIndex(t => t.id === activeTerminalId) < terminals.length - 1
                  ? 'text-slate-400 hover:text-white hover:bg-slate-700'
                  : 'text-slate-600 cursor-not-allowed'
              }`}
              disabled={terminals.findIndex(t => t.id === activeTerminalId) === terminals.length - 1}
            >
              <ChevronRight size={18} />
            </button>
            
            {/* Add Terminal Button */}
            <button
              onClick={addTerminal}
              className="ml-1 p-1.5 text-green-400 hover:bg-slate-700 rounded transition-colors"
              title="New Terminal"
            >
              <Plus size={18} />
            </button>
          </div>
        ) : (
          /* Desktop/Tablet Tab Bar */
          <div className="flex items-center w-full">
            <div className="flex-1 flex items-center overflow-x-auto scrollbar-thin scrollbar-thumb-slate-600">
              {terminals.map((terminal) => (
                <div
                  key={terminal.id}
                  className={`group flex items-center px-3 py-2 cursor-pointer transition-all min-w-0 border-r border-slate-700 ${
                    terminal.id === activeTerminalId
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                  }`}
                  onClick={() => setActiveTerminal(terminal.id)}
                >
                  <TerminalIcon size={14} className="shrink-0 mr-2" />
                  
                  {editingId === terminal.id ? (
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onBlur={() => handleRename(terminal.id, editName)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleRename(terminal.id, editName);
                        } else if (e.key === 'Escape') {
                          setEditingId(null);
                          setEditName('');
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="bg-slate-900 text-white px-1 py-0 text-sm rounded outline-none border border-blue-500 min-w-[60px] max-w-[150px]"
                      autoFocus
                    />
                  ) : (
                    <>
                      <span className="text-sm truncate max-w-[120px]">
                        {terminal.name}
                      </span>
                      
                      {/* Desktop only - Edit button */}
                      {!isMobile && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingId(terminal.id);
                            setEditName(terminal.name);
                          }}
                          className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Edit2 size={12} />
                        </button>
                      )}
                    </>
                  )}
                  
                  {/* Close button - only show if more than one terminal */}
                  {terminals.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeTerminal(terminal.id);
                      }}
                      className={`ml-2 ${
                        isMobile 
                          ? 'opacity-100' 
                          : 'opacity-0 group-hover:opacity-100'
                      } transition-opacity text-red-400 hover:text-red-300`}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            {/* Add Terminal Button */}
            <button
              onClick={addTerminal}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-green-400 hover:text-green-300 transition-colors border-l border-slate-700"
              title="New Terminal (Ctrl+Shift+T)"
            >
              <Plus size={18} />
            </button>
          </div>
        )}
      </div>
      
      {/* Mobile Tab Menu Dropdown */}
      {isMobile && showTabMenu && (
        <div className="absolute top-12 left-2 right-2 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
          {terminals.map((terminal) => (
            <button
              key={terminal.id}
              onClick={() => {
                setActiveTerminal(terminal.id);
                setShowTabMenu(false);
              }}
              className={`w-full px-4 py-3 flex items-center justify-between hover:bg-slate-700 transition-colors ${
                terminal.id === activeTerminalId ? 'bg-slate-700' : ''
              }`}
            >
              <div className="flex items-center">
                <TerminalIcon size={16} className="text-blue-400 mr-2" />
                <span className="text-sm text-white">{terminal.name}</span>
              </div>
              {terminal.id === activeTerminalId && (
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              )}
            </button>
          ))}
          <div className="border-t border-slate-700 mt-1 pt-1">
            <button
              onClick={() => {
                addTerminal();
                setShowTabMenu(false);
              }}
              className="w-full px-4 py-3 flex items-center text-green-400 hover:bg-slate-700 transition-colors"
            >
              <Plus size={16} className="mr-2" />
              <span className="text-sm">New Terminal</span>
            </button>
          </div>
        </div>
      )}
      
      {/* Terminal Content Area */}
      <div className="flex-1 relative overflow-hidden">
        {terminals.map((terminal) => (
          <div
            key={terminal.id}
            className={`absolute inset-0 ${
              terminal.id === activeTerminalId ? 'block' : 'hidden'
            }`}
          >
            <TerminalComponent terminalId={terminal.id} />
          </div>
        ))}
      </div>
      
      {/* Mobile Gesture Hints */}
      {isMobile && terminals.length > 1 && (
        <div className="absolute bottom-16 left-0 right-0 flex justify-center pointer-events-none">
          <div className="bg-slate-800/90 text-xs text-slate-400 px-3 py-1 rounded-full">
            Swipe or use arrows to switch terminals
          </div>
        </div>
      )}
      
      {/* Keyboard Shortcuts Help - Desktop only */}
      {!isMobile && (
        <div className="absolute bottom-2 right-2 text-xs text-slate-500">
          <span className="mr-3">Ctrl+Shift+T: New</span>
          <span className="mr-3">Ctrl+Shift+W: Close</span>
          <span>Ctrl+Shift+Tab: Switch</span>
        </div>
      )}
    </div>
  );
};

export default MultiTerminal;