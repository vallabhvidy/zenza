import { create } from 'zustand';

interface OutputState {
  logs: string[];
  addLog: (log: string) => void;
  clearLogs: () => void;
}

export const useOutputStore = create<OutputState>((set) => ({
  logs: ['System initialized.', 'Ready for execution.'],
  addLog: (log) => set((state) => ({ logs: [...state.logs, log] })),
  clearLogs: () => set({ logs: [] }),
}));
