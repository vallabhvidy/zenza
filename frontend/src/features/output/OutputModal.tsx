import type React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { useOutputStore } from '../../store/outputStore';
import { X, Activity, BarChart2, Terminal } from 'lucide-react';
import './OutputModal.css';

export const OutputModal: React.FC = () => {
  const { isOutputModalOpen, closeOutputModal, activeOutputTab, setActiveOutputTab } = useWorkspaceStore();
  const { logs } = useOutputStore();

  return (
    <Dialog.Root open={isOutputModalOpen} onOpenChange={(open) => !open && closeOutputModal()}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-content glass-panel">
          <div className="dialog-header">
            <div className="dialog-tabs">
              <button 
                className={`tab-btn ${activeOutputTab === 'graph' ? 'active' : ''}`}
                onClick={() => setActiveOutputTab('graph')}
              >
                <Activity size={16} /> Graph
              </button>
              <button 
                className={`tab-btn ${activeOutputTab === 'benchmarks' ? 'active' : ''}`}
                onClick={() => setActiveOutputTab('benchmarks')}
              >
                <BarChart2 size={16} /> Benchmarks
              </button>
              <button 
                className={`tab-btn ${activeOutputTab === 'logs' ? 'active' : ''}`}
                onClick={() => setActiveOutputTab('logs')}
              >
                <Terminal size={16} /> Logs
              </button>
            </div>
            <Dialog.Close asChild>
              <button className="icon-btn" aria-label="Close">
                <X size={18} />
              </button>
            </Dialog.Close>
          </div>
          
          <div className="dialog-body">
            {activeOutputTab === 'graph' && (
              <div className="placeholder-view">Graph Visualization (Coming Soon)</div>
            )}
            {activeOutputTab === 'benchmarks' && (
              <div className="placeholder-view">Benchmarks Data (Coming Soon)</div>
            )}
            {activeOutputTab === 'logs' && (
              <div className="log-viewer">
                {logs.map((log, i) => (
                  <div key={i} className="log-line">{log}</div>
                ))}
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
