import { useEffect } from 'react';

import { Switch } from 'antd';

import {
  applySystemThemePreferenceIfUnset,
  useTheme,
  useThemeActions,
} from '@/stores/useThemeStore';

export function ThemeToggle() {
  const theme = useTheme();
  const { toggleTheme } = useThemeActions();
  const isDarkMode = theme === 'dark';

  useEffect(() => {
    applySystemThemePreferenceIfUnset();
  }, []);

  const onChange = () => {
    toggleTheme();
  };

  return (
    <Switch
      checkedChildren='Dark mode'
      unCheckedChildren='Light mode'
      checked={isDarkMode}
      onChange={onChange}
    />
  );
}
