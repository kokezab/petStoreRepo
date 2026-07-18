import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';
import { initReactI18next } from 'react-i18next';

import { config } from '@/config';

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    supportedLngs: ['en', 'sr'],
    backend: {
      loadPath: config.i18nLoadPath,
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
