import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface ThemePreferences {
  accentColor: string;
  fontSize: 'small' | 'medium' | 'large';
  layout: {
    sidebarCollapsed: boolean;
    density: 'comfortable' | 'compact';
  };
}

interface ThemeState {
  theme: 'light' | 'dark';
  preferences: ThemePreferences;
  actions: {
    toggleTheme: () => void;
    setAccentColor: (color: string) => void;
    setFontSize: (size: ThemePreferences['fontSize']) => void;
    toggleSidebar: () => void;
    setDensity: (density: ThemePreferences['layout']['density']) => void;
  };
}

export const useThemeStore = create<ThemeState>()(
  persist(
    immer((set) => ({
      theme: 'light',
      preferences: {
        accentColor: '#6366f1',
        fontSize: 'medium',
        layout: {
          sidebarCollapsed: false,
          density: 'comfortable',
        },
      },
      actions: {
        toggleTheme: () =>
          set((state) => {
            state.theme = state.theme === 'light' ? 'dark' : 'light';
          }),
        setAccentColor: (color) =>
          set((state) => {
            state.preferences.accentColor = color;
          }),
        setFontSize: (size) =>
          set((state) => {
            state.preferences.fontSize = size;
          }),
        toggleSidebar: () =>
          set((state) => {
            state.preferences.layout.sidebarCollapsed = !state.preferences.layout.sidebarCollapsed;
          }),
        setDensity: (density) =>
          set((state) => {
            state.preferences.layout.density = density;
          }),
      },
    })),
    {
      name: 'theme-storage',
    },
  ),
);
