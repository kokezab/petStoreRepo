import { useState } from 'react';

import { Select } from 'antd';

import { ThemeToggle } from '@/components/ThemeToggle/ThemeToggle';

export function SettingsPage() {
  const [selectedLanguage, setSelectedLanguage] = useState('en');

  return (
    <div>
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
