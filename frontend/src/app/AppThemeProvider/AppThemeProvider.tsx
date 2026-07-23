import { ConfigProvider, theme as antdTheme } from 'antd';
import type { ReactNode } from 'react';

import { useThemeStore } from '@/shared/lib/theme/useThemeStore';

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const theme = useThemeStore((state) => state.theme);

  const algorithms = [theme === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm];

  return (
    <ConfigProvider
      theme={{
        algorithm: algorithms,
      }}
    >
      {children}
    </ConfigProvider>
  );
}
