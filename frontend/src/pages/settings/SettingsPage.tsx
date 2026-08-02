import { useTranslation } from 'react-i18next';

import { LanguageSelector } from '@/shared/ui/language-selector';

import { ThemeToggle } from './ui/ThemeToggle/ThemeToggle';

export function SettingsPage() {
  const { t } = useTranslation();
  return (
    <div>
      <h1>{t('settings')}</h1>

      <LanguageSelector />

      <ThemeToggle />
    </div>
  );
}
