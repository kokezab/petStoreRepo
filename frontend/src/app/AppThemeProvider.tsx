import { ConfigProvider, theme as antdTheme } from 'antd';
import type { ReactNode } from 'react';

import { useThemeStore } from '@/stores/useThemeStore';

const fontSizeMap = {
  small: 12,
  medium: 14,
  large: 16,
} as const;

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const theme = useThemeStore((state) => state.theme);
  const accentColor = useThemeStore((state) => state.preferences.accentColor);
  const fontSize = useThemeStore((state) => state.preferences.fontSize);
  const density = useThemeStore((state) => state.preferences.layout.density);

  const algorithms = [theme === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm];
  if (density === 'compact') {
    algorithms.push(antdTheme.compactAlgorithm);
  }

  return (
    <ConfigProvider
      theme={{
        algorithm: algorithms,
        token: {
          colorPrimary: accentColor,
          fontSize: fontSizeMap[fontSize],
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
}
