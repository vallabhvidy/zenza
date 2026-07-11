import React from 'react';
import { useOutputStore } from '../../store/outputStore';
import './StatusIndicator.css';

export const StatusIndicator: React.FC = () => {
  const { runStatus } = useOutputStore();

  if (runStatus === 'IDLE') return null;

  const getStatusText = () => {
    switch (runStatus) {
      case 'QUEUED': return 'Queued';
      case 'RUNNING': return 'Running';
      case 'COMPLETED': return 'Completed';
      case 'STOPPED': return 'Stopped';
      case 'FAILED': return 'Failed';
      default: return runStatus;
    }
  };

  return (
    <div className={`status-badge status-${runStatus.toLowerCase()}`}>
      <span className="status-dot" />
      <span className="status-text">{getStatusText()}</span>
    </div>
  );
};
