import { useState } from 'react';
import { 
  ArrowUp, 
  ArrowDown, 
  ArrowLeft, 
  ArrowRight,
  CornerDownLeft,
  Delete,
  Command,
  X
} from 'lucide-react';

interface VirtualKeyboardProps {
  onKeyPress: (key: string) => void;
  onClose?: () => void;
}

const VirtualKeyboard: React.FC<VirtualKeyboardProps> = ({ onKeyPress, onClose }) => {
  const [isCtrlPressed, setIsCtrlPressed] = useState(false);
  
  const specialKeys = [
    { label: 'Tab', key: '\t', icon: null },
    { label: 'Esc', key: '\x1b', icon: null },
    { label: '↑', key: '\x1b[A', icon: ArrowUp },
    { label: '↓', key: '\x1b[B', icon: ArrowDown },
    { label: '←', key: '\x1b[D', icon: ArrowLeft },
    { label: '→', key: '\x1b[C', icon: ArrowRight },
    { label: 'Enter', key: '\r', icon: CornerDownLeft },
    { label: 'Del', key: '\x7f', icon: Delete }
  ];
  
  const ctrlKeys = [
    { label: 'Ctrl+C', key: '\x03' },
    { label: 'Ctrl+D', key: '\x04' },
    { label: 'Ctrl+Z', key: '\x1a' },
    { label: 'Ctrl+L', key: '\x0c' },
    { label: 'Ctrl+A', key: '\x01' },
    { label: 'Ctrl+E', key: '\x05' },
    { label: 'Ctrl+K', key: '\x0b' },
    { label: 'Ctrl+U', key: '\x15' }
  ];
  
  const commonCommands = [
    { label: 'ls', cmd: 'ls' },
    { label: 'cd', cmd: 'cd ' },
    { label: 'pwd', cmd: 'pwd' },
    { label: 'clear', cmd: 'clear' },
    { label: 'git', cmd: 'git ' },
    { label: 'npm', cmd: 'npm ' },
    { label: 'python', cmd: 'python ' },
    { label: 'node', cmd: 'node ' }
  ];
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 p-2 z-50 
      animate-in slide-in-from-bottom-4 duration-200">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-2 right-2 text-slate-400 hover:text-white p-1"
      >
        <X size={20} />
      </button>
      
      {/* Special Keys Row */}
      <div className="flex gap-1 mb-2 overflow-x-auto pb-1">
        {specialKeys.map((key) => (
          <button
            key={key.label}
            onClick={() => onKeyPress(key.key)}
            className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded 
              text-xs font-medium active:scale-95 transition-all flex items-center justify-center
              min-w-[40px]"
          >
            {key.icon ? <key.icon size={16} /> : key.label}
          </button>
        ))}
      </div>
      
      {/* Ctrl Keys Row */}
      <div className="flex gap-1 mb-2 overflow-x-auto pb-1">
        <button
          onClick={() => setIsCtrlPressed(!isCtrlPressed)}
          className={`px-3 py-2 ${
            isCtrlPressed ? 'bg-blue-600' : 'bg-slate-700'
          } hover:bg-slate-600 text-white rounded text-xs font-medium 
          active:scale-95 transition-all flex items-center gap-1`}
        >
          <Command size={14} />
          Ctrl
        </button>
        {ctrlKeys.map((key) => (
          <button
            key={key.label}
            onClick={() => onKeyPress(key.key)}
            className="px-2 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded 
              text-[10px] font-medium active:scale-95 transition-all whitespace-nowrap"
          >
            {key.label}
          </button>
        ))}
      </div>
      
      {/* Common Commands Row */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {commonCommands.map((cmd) => (
          <button
            key={cmd.label}
            onClick={() => {
              [...cmd.cmd].forEach(char => onKeyPress(char));
            }}
            className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded 
              text-xs font-mono active:scale-95 transition-all"
          >
            {cmd.label}
          </button>
        ))}
      </div>
      
      {/* Quick text snippets */}
      <div className="flex gap-1 mt-2 overflow-x-auto">
        <button
          onClick={() => onKeyPress('./')}
          className="px-2 py-1 bg-slate-600 text-white rounded text-xs"
        >
          ./
        </button>
        <button
          onClick={() => onKeyPress('../')}
          className="px-2 py-1 bg-slate-600 text-white rounded text-xs"
        >
          ../
        </button>
        <button
          onClick={() => onKeyPress('~/')}
          className="px-2 py-1 bg-slate-600 text-white rounded text-xs"
        >
          ~/
        </button>
        <button
          onClick={() => onKeyPress(' | ')}
          className="px-2 py-1 bg-slate-600 text-white rounded text-xs"
        >
          |
        </button>
        <button
          onClick={() => onKeyPress(' && ')}
          className="px-2 py-1 bg-slate-600 text-white rounded text-xs"
        >
          &&
        </button>
        <button
          onClick={() => onKeyPress(' > ')}
          className="px-2 py-1 bg-slate-600 text-white rounded text-xs"
        >
          &gt;
        </button>
        <button
          onClick={() => onKeyPress(' 2>&1')}
          className="px-2 py-1 bg-slate-600 text-white rounded text-xs"
        >
          2&gt;&1
        </button>
      </div>
    </div>
  );
};

export default VirtualKeyboard;