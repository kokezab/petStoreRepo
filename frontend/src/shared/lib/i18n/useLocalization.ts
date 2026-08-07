import { useTranslation } from 'react-i18next';

export function useLocalization() {
  const { t } = useTranslation();
  return { t };
}
