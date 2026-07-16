import { create } from 'zustand';

interface WorkspaceState {
  isOutputModalOpen: boolean;
  activeOutputTab: string;
  openOutputModal: (tab?: string) => void;
  closeOutputModal: () => void;
  setActiveOutputTab: (tab: string) => void;
  reduceNoise: boolean;
  setReduceNoise: (val: boolean) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  isOutputModalOpen: false,
  activeOutputTab: 'graph',
  openOutputModal: (tab) => set((state) => ({ 
    isOutputModalOpen: true, 
    activeOutputTab: tab || state.activeOutputTab 
  })),
  closeOutputModal: () => set({ isOutputModalOpen: false }),
  setActiveOutputTab: (tab) => set({ activeOutputTab: tab }),
  reduceNoise: false,
  setReduceNoise: (val) => set({ reduceNoise: val }),
}));
