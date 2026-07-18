import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface ThemeState {
  theme: 'light' | 'dark';
  actions: {
    toggleTheme: () => void;
  };
}

export const useThemeStore = create<ThemeState>()(
  persist(
    immer((set) => ({
      theme: 'light',
      actions: {
        toggleTheme: () =>
          set((state) => {
            state.theme = state.theme === 'light' ? 'dark' : 'light';
          }),
      },
    })),
    {
      name: 'theme-storage',
    },
  ),
);

export const useTheme = () => useThemeStore((state) => state.theme);

export const useThemeActions = () => useThemeStore((state) => state.actions);

export function applySystemThemePreferenceIfUnset() {
  if (localStorage.getItem('theme-storage') !== null) {
    return;
  }

  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  useThemeStore.setState({ theme: prefersDark ? 'dark' : 'light' });
}