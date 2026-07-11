import { create } from 'zustand';

export interface RunMetrics {
  n: number;
  time: number;
  memory: number;
  status: string;
}

export type RunStatus = 'IDLE' | 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'STOPPED';

interface OutputState {
  logs: string[];
  metrics: RunMetrics[];
  runStatus: RunStatus;
  addLog: (log: string) => void;
  addMetric: (metric: RunMetrics) => void;
  setRunStatus: (status: RunStatus) => void;
  clearLogs: () => void;
  clearMetrics: () => void;
}

export const useOutputStore = create<OutputState>((set) => ({
  logs: ['System initialized.', 'Ready for execution.'],
  metrics: [],
  runStatus: 'IDLE',
  addLog: (log) => set((state) => ({ logs: [...state.logs, log] })),
  addMetric: (metric) => set((state) => ({ metrics: [...state.metrics, metric] })),
  setRunStatus: (status) => set({ runStatus: status }),
  clearLogs: () => set({ logs: [] }),
  clearMetrics: () => set({ metrics: [] }),
}));
