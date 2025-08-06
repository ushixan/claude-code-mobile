import { ChevronUp, ChevronDown } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useRef, useEffect } from 'react';

const ArrowControls = () => {
  const { activeTab } = useStore();
  const terminalRef = useRef<any>(null);
  const editorRef = useRef<any>(null);

  useEffect(() => {
    // Get references to terminal and editor instances
    if (activeTab === 'terminal') {
      const terminalElement = document.querySelector('.xterm');
      if (terminalElement) {
        terminalRef.current = terminalElement;
      }
    } else if (activeTab === 'editor') {
      const editorElement = document.querySelector('.cm-editor');
      if (editorElement) {
        editorRef.current = editorElement;
      }
    }
  }, [activeTab]);

  const sendArrowKey = (direction: 'up' | 'down' | 'left' | 'right') => {
    if (activeTab === 'terminal') {
      // Send arrow key sequences to terminal
      const terminal = (window as any).xtermRef?.current;
      if (terminal) {
        const arrows = {
          up: '\x1b[A',
          down: '\x1b[B',
          right: '\x1b[C',
          left: '\x1b[D'
        };
        terminal.write(arrows[direction]);
        terminal.focus();
      }
    } else if (activeTab === 'editor') {
      // Find the CodeMirror editor view
      const editorElement = document.querySelector('.cm-content') as HTMLElement;
      if (editorElement) {
        // Focus the editor first
        editorElement.focus();
        
        const keyMap = {
          up: 'ArrowUp',
          down: 'ArrowDown',
          left: 'ArrowLeft',
          right: 'ArrowRight'
        };
        
        // Create and dispatch the keyboard event
        const event = new KeyboardEvent('keydown', {
          key: keyMap[direction],
          code: keyMap[direction],
          keyCode: direction === 'up' ? 38 : direction === 'down' ? 40 : direction === 'left' ? 37 : 39,
          which: direction === 'up' ? 38 : direction === 'down' ? 40 : direction === 'left' ? 37 : 39,
          bubbles: true,
          cancelable: true,
          view: window,
        });
        
        // Dispatch to the editor content
        const result = editorElement.dispatchEvent(event);
        
        // If the event wasn't handled, try the parent editor element
        if (!result) {
          const cmEditor = document.querySelector('.cm-editor');
          if (cmEditor) {
            cmEditor.dispatchEvent(event);
          }
        }
      }
    }
  };

  // Only show controls for terminal and editor tabs
  if (activeTab !== 'terminal' && activeTab !== 'editor') {
    return null;
  }

  return (
    <div className="fixed right-2 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-2">
      {/* Up Arrow */}
      <button
        onClick={() => sendArrowKey('up')}
        className="w-10 h-10 bg-slate-700/90 backdrop-blur text-white rounded-lg flex items-center justify-center active:scale-95 active:bg-slate-600 transition-all shadow-lg"
        aria-label="Arrow Up"
      >
        <ChevronUp size={20} />
      </button>
      
      {/* Down Arrow */}
      <button
        onClick={() => sendArrowKey('down')}
        className="w-10 h-10 bg-slate-700/90 backdrop-blur text-white rounded-lg flex items-center justify-center active:scale-95 active:bg-slate-600 transition-all shadow-lg"
        aria-label="Arrow Down"
      >
        <ChevronDown size={20} />
      </button>
    </div>
  );
};

export default ArrowControls;