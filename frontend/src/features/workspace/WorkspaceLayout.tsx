import type React from 'react';
import { useState, useRef, useEffect } from 'react';
import { Allotment } from 'allotment';
import 'allotment/dist/style.css';
import { SchemaTree } from '../schema/SchemaTree';
import { CodeEditor } from '../editor/CodeEditor';
import { useThemeStore, ACCENT_COLORS } from '../../store/themeStore';
import { Sun, Moon, ChevronDown } from 'lucide-react';
import './WorkspaceLayout.css';

export const WorkspaceLayout: React.FC = () => {
  const { theme, setTheme, accentColor, setAccentColor } = useThemeStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeColorObj = ACCENT_COLORS.find(c => c.value === accentColor) || ACCENT_COLORS[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="workspace-container">
      <header className="workspace-header glass-panel">
        <div className="logo">Zenza IDE</div>
        <div className="header-controls">
          <div className="accent-picker-group" ref={dropdownRef}>
            <span className="control-label">Accent</span>
            <div className="custom-dropdown-container">
              <button 
                className="accent-dropdown-trigger" 
                onClick={() => setIsOpen(!isOpen)}
                title={`Accent Color: ${activeColorObj.name}`}
              >
                <span 
                  className="color-preview-circle" 
                  style={{ backgroundColor: accentColor }} 
                />
                <ChevronDown size={12} className="chevron" />
              </button>
              {isOpen && (
                <div className="accent-dropdown-menu">
                  {ACCENT_COLORS.map((c) => (
                    <button
                      key={c.name}
                      className={`accent-menu-item ${accentColor === c.value ? 'selected' : ''}`}
                      onClick={() => {
                        setAccentColor(c.value);
                        setIsOpen(false);
                      }}
                      title={c.name}
                    >
                      <span 
                        className="menu-color-circle" 
                        style={{ backgroundColor: c.value }} 
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="theme-toggle-group">
            <button
              className={`theme-icon-btn ${theme === 'light' ? 'active' : ''}`}
              onClick={() => setTheme('light')}
              title="Light Mode"
            >
              <Sun size={16} />
            </button>
            <button
              className={`theme-icon-btn ${theme === 'dark' ? 'active' : ''}`}
              onClick={() => setTheme('dark')}
              title="Dark Mode"
            >
              <Moon size={16} />
            </button>
          </div>
        </div>
      </header>
      <div className="workspace-main">
        <Allotment>
          <Allotment.Pane minSize={250} preferredSize={300}>
            <div className="pane-content left-pane">
              <SchemaTree />
            </div>
          </Allotment.Pane>
          <Allotment.Pane minSize={400}>
            <div className="pane-content right-pane">
              <CodeEditor />
            </div>
          </Allotment.Pane>
        </Allotment>
      </div>
    </div>
  );
};
