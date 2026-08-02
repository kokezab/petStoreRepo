import { useState } from 'react';

import { Select } from 'antd';
import i18n from 'i18next';

import { useLocalization } from '@/shared/lib/i18n';

import { supportedLanguages } from './supportedLanguages';
import type { Language } from './types';

export function LanguageSelector() {
  const { t } = useLocalization();
  const [language, setLanguage] = useState<Language>('en');

  const options = supportedLanguages.map((lang) => ({
    label: t(lang),
    value: lang,
  }));

  const onChange = (value: Language) => {
    setLanguage(value);
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
