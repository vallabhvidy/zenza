import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark';

export const ACCENT_COLORS = [
  { name: 'Sky', value: '#0ea5e9' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Rose', value: '#f43f5e' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Slate', value: '#64748b' }
];

interface ThemeState {
  theme: Theme;
  accentColor: string;
  setTheme: (theme: Theme) => void;
  setAccentColor: (color: string) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'light',
      accentColor: ACCENT_COLORS[0].value,
      setTheme: (theme) => set({ theme }),
      setAccentColor: (accentColor) => set({ accentColor }),
    }),
    {
      name: 'zenza-theme-storage',
    }
  )
);
