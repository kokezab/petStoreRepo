import { useEffect, useState } from 'react';

import { Select } from 'antd';
import { useTranslation } from 'react-i18next';

import { supportedLanguages } from './supportedLanguages';
import type { Language } from './types';

// Normalize i18next language string to supported Language type
function normalizeLanguage(lang: string): Language {
  // Extract base language code (e.g., "en-US" -> "en")
  const baseLanguage = lang.split('-')[0];
  // Check if it's a supported language, otherwise fallback to 'en'
  return supportedLanguages.includes(baseLanguage as Language)
    ? (baseLanguage as Language)
    : 'en';
}

export function LanguageSelector() {
  const { t, i18n } = useTranslation();

  // Derive current language from i18next's resolved language
  const currentLanguage = normalizeLanguage(i18n.resolvedLanguage || i18n.language);
  const [language, setLanguage] = useState<Language>(currentLanguage);

  // Subscribe to language changes from i18next
  useEffect(() => {
    const handleLanguageChanged = (lng: string) => {
      setLanguage(normalizeLanguage(lng));
    };

    i18n.on('languageChanged', handleLanguageChanged);

    // Sync with current language on mount
    setLanguage(currentLanguage);

    return () => {
      i18n.off('languageChanged', handleLanguageChanged);
    };
  }, [i18n, currentLanguage]);

  const options = supportedLanguages.map((lang) => ({
    label: t(lang),
    value: lang,
  }));

  const onChange = (value: Language) => {
    i18n.changeLanguage(value);
  };

  return (
    <div>
      <label>{t('language')}</label>
      <Select<Language>
        role='combobox'
        aria-label='Select language'
        value={language}
        onChange={onChange}
        options={options}
      />
    </div>
  );
}
