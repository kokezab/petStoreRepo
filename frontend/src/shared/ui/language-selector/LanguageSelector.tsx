import { useSyncExternalStore } from 'react';

import { Select } from 'antd';
import i18n from 'i18next';

import { useLocalization } from '@/shared/lib/i18n';

import { supportedLanguages } from './supportedLanguages';
import type { Language } from './types';

// Normalize i18next language string to supported Language type
function normalizeLanguage(lang: string): Language {
  // Extract base language code (e.g., "en-US" -> "en")
  const baseLanguage = lang.split('-')[0];
  // Check if it's a supported language, otherwise fallback to 'en'
  return supportedLanguages.includes(baseLanguage as Language) ? (baseLanguage as Language) : 'en';
}

// Subscribe to i18next language changes as an external store
function subscribe(onStoreChange: () => void) {
  i18n.on('languageChanged', onStoreChange);
  return () => {
    i18n.off('languageChanged', onStoreChange);
  };
}

function getLanguageSnapshot() {
  return i18n.resolvedLanguage || i18n.language;
}

export function LanguageSelector() {
  const { t } = useLocalization();

  // Read the current language directly from i18next (the external store),
  // re-rendering on every 'languageChanged' event — no mirrored state needed.
  const language = normalizeLanguage(useSyncExternalStore(subscribe, getLanguageSnapshot));

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
        aria-label={t('languageSelector.label')}
        value={language}
        onChange={onChange}
        options={options}
      />
    </div>
  );
}
