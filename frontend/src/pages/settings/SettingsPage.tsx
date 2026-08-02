import { useLocalization } from '@/shared/lib/i18n';
import { LanguageSelector } from '@/shared/ui/language-selector';

import { ThemeToggle } from './ui/ThemeToggle/ThemeToggle';

export function SettingsPage() {
  const { t } = useLocalization();
  return (
    <div>
      <h1>{t('settings')}</h1>

      <LanguageSelector />

      <ThemeToggle />
    </div>
  );
}
