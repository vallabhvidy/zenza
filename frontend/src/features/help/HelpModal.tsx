import React from 'react';
import { X, Play, BarChart2, Code, LayoutList } from 'lucide-react';
import './HelpModal.css';

interface HelpModalProps {
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
  return (
    <div className="help-modal-overlay">
      <div className="help-modal-content glass-panel">
        <div className="help-modal-header">
          <h2>How to use Zenza</h2>
          <button className="close-btn" onClick={onClose} title="Close">
            <X size={20} />
          </button>
        </div>
        <div className="help-modal-body">
          <div className="help-step">
            <div className="help-icon"><Code size={24} /></div>
            <div className="help-text">
              <h3>1. Write Code</h3>
              <p>Write your algorithmic logic in the <b>Code Editor</b> using Python or C++.</p>
            </div>
          </div>
          
          <div className="help-step">
            <div className="help-icon"><LayoutList size={24} /></div>
            <div className="help-text">
              <h3>2. Edit Input Schema</h3>
              <p>Configure the shape of your input data using the <b>Schema Tree</b> in the left pane.</p>
            </div>
          </div>
          
          <div className="help-step">
            <div className="help-icon"><BarChart2 size={24} /></div>
            <div className="help-text">
              <h3>3. Set Execution Parameter</h3>
              <p>Choose the execution parameter (like <b>N</b>) in the bottom left that will scale up during the benchmark.</p>
            </div>
          </div>
          
          <div className="help-step">
            <div className="help-icon"><Play size={24} /></div>
            <div className="help-text">
              <h3>4. Run & Visualize</h3>
              <p>Click <b>Run</b> to benchmark the code and see a real-time graph of your execution parameter versus Time and Space!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
