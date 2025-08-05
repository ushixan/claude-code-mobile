import CodeMirror from '@uiw/react-codemirror';
import { oneDark } from '@codemirror/theme-one-dark';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { useStore } from '../../store/useStore';
import { X, Save } from 'lucide-react';
import { useCallback } from 'react';

const Editor = () => {
  const { openFiles, activeFile, closeFile, setActiveFile, updateFileContent } = useStore();
  
  const activeFileData = openFiles.find(f => f.path === activeFile);

  const handleChange = useCallback((value: string) => {
    if (activeFile) {
      updateFileContent(activeFile, value);
    }
  }, [activeFile, updateFileContent]);

  const handleSave = () => {
    if (activeFileData) {
      // TODO: Implement save via API
      console.log('Saving file:', activeFile);
    }
  };

  const getLanguageExtension = (path: string) => {
    if (path.endsWith('.js') || path.endsWith('.jsx') || path.endsWith('.ts') || path.endsWith('.tsx')) {
      return javascript({ jsx: true, typescript: path.includes('ts') });
    }
    if (path.endsWith('.py')) {
      return python();
    }
    return javascript();
  };

  if (openFiles.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-900">
        <p className="text-slate-400">No files open. Use the file explorer to open a file.</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-900">
      {/* Tab bar */}
      <div className="flex overflow-x-auto bg-slate-800 border-b border-slate-700">
        {openFiles.map(file => (
          <div
            key={file.path}
            className={`flex items-center gap-2 px-3 py-2 border-r border-slate-700 cursor-pointer whitespace-nowrap ${
              file.path === activeFile ? 'bg-slate-700 text-white' : 'text-slate-400'
            }`}
            onClick={() => setActiveFile(file.path)}
          >
            <span className="text-sm">{file.path.split('/').pop()}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                closeFile(file.path);
              }}
              className="hover:text-white"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Editor */}
      {activeFileData && (
        <div className="flex-1 overflow-hidden">
          <CodeMirror
            value={activeFileData.content}
            height="100%"
            theme={oneDark}
            extensions={[getLanguageExtension(activeFileData.path)]}
            onChange={handleChange}
            basicSetup={{
              lineNumbers: true,
              foldGutter: true,
              dropCursor: true,
              allowMultipleSelections: true,
              indentOnInput: true,
              syntaxHighlighting: true,
              bracketMatching: true,
              closeBrackets: true,
              autocompletion: true,
              rectangularSelection: true,
              highlightSelectionMatches: true,
              searchKeymap: true,
            }}
          />
        </div>
      )}

      {/* Floating save button */}
      <button
        onClick={handleSave}
        className="absolute bottom-4 right-4 w-14 h-14 bg-green-600 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
      >
        <Save size={24} />
      </button>
    </div>
  );
};

export default Editor;