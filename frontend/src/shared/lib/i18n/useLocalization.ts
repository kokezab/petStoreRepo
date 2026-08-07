import { useTranslation } from 'react-i18next';

// App-wide localization hook. Wraps react-i18next's useTranslation so every
// consumer depends only on the { t } shape: translations resolve identically
// whether they come from static locale JSON or a backend-served source, and t
// reacts to language changes.
export function useLocalization() {
  const { t } = useTranslation();
  return { t };
}
