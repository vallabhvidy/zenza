import { useEffect } from 'react';
import { WorkspaceLayout } from './features/workspace/WorkspaceLayout';
import { OutputModal } from './features/output/OutputModal';
import { useThemeStore } from './store/themeStore';

function App() {
  const { theme, accentColor } = useThemeStore();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.setProperty('--accent-primary', accentColor);
    
    // Derived hover color for buttons/tabs (just slight opacity adjustments)
    // A simple hack is to use the same color but we let CSS handle hover where possible
  }, [theme, accentColor]);

  return (
    <>
      <WorkspaceLayout />
      <OutputModal />
    </>
  );
}

export default App;
