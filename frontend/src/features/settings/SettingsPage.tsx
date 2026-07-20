import { useTranslation } from 'react-i18next';

import { LanguageSelector } from '../../lib/localization/LanguageSelector';
import { ThemeToggle } from './components/ThemeToggle/ThemeToggle';

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
