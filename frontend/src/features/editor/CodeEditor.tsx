import Editor from '@monaco-editor/react';
import { useEditorStore } from '../../store/editorStore';
import { useThemeStore } from '../../store/themeStore';
import { useExecution } from '../../api/hooks';
import { TEMPLATES } from '../../store/templates';
import { Play, Square } from 'lucide-react';
import './CodeEditor.css';

export const CodeEditor = () => {
  const { language, codes, setCode, setLanguage, loadTemplate } = useEditorStore();
  const code = codes[language];
  const { theme } = useThemeStore();
  const { run, stop, isRunning } = useExecution();

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setCode(value);
    }
  };

  return (
    <div className="editor-container">
      <div className="editor-toolbar">
        <div className="file-tabs">
          <div className="file-tab active">
            {language === 'python' ? 'main.py' : 'main.cpp'}
          </div>
        </div>
        <div className="toolbar-actions">
          <div className="lang-select-container">
            <select
              className="lang-select"
              value={language}
              onChange={(e) => setLanguage(e.target.value as any)}
              disabled={isRunning}
            >
              <option value="python">Python</option>
              <option value="cpp">C++</option>
            </select>
          </div>

          <div className="template-select-container">
            <select
              className="template-select"
              value=""
              onChange={(e) => {
                if (e.target.value) {
                  loadTemplate(e.target.value as any);
                }
              }}
              disabled={isRunning}
            >
              <option value="" disabled hidden>
                Template...
              </option>
              {TEMPLATES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {isRunning ? (
            <button className="btn-run stop" onClick={stop}>
              <Square size={14} fill="currentColor" />
              <span>Stop</span>
            </button>
          ) : (
            <button className="btn-run primary" onClick={run}>
              <Play size={14} fill="currentColor" />
              <span>Run</span>
            </button>
          )}
        </div>
      </div>
      <div className="monaco-wrapper">
        <Editor
          height="100%"
          language={language}
          theme={theme === 'dark' ? 'vs-dark' : 'light'}
          value={code}
          onChange={handleEditorChange}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            fontFamily: 'JetBrains Mono, monospace',
            padding: { top: 16 },
            scrollBeyondLastLine: false,
            smoothScrolling: true,
          }}
        />
      </div>
    </div>
  );
};
