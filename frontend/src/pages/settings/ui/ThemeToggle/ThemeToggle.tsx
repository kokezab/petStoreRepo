import { Switch } from 'antd';

import { useTheme, useThemeActions } from '@/shared/lib/theme';

export function ThemeToggle() {
  const theme = useTheme();
  const { toggleTheme } = useThemeActions();
  const isDarkMode = theme === 'dark';

  return (
    <Switch
      checkedChildren='Dark mode'
      unCheckedChildren='Light mode'
      checked={isDarkMode}
      onChange={toggleTheme}
    />
  );
}
