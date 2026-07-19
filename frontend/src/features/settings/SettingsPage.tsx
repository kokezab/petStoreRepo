import { useState } from 'react';

import { Select } from 'antd';
import { ThemeToggle } from './components/ThemeToggle/ThemeToggle';
import { useTranslation } from '@/loc/loc';

export function SettingsPage() {
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const { t, locale, setLocale } = useTranslation();

  return (
    <div>
      <button onClick={() => setLocale('en')}>English</button>
      <button onClick={() => setLocale('sr')}>Serbian</button>
      {t('cancel')}

      <h2>{selectedLanguage === 'en' ? 'Settings' : 'Podešavanja'}</h2>
      <ThemeToggle />

      <Select
        value={selectedLanguage}
        onChange={(value) => setSelectedLanguage(value)}
        options={[
          { value: 'en', label: 'English' },
          { value: 'sr', label: 'Serbian' },
        ]}
      />
    </div>
  );
}
