import type { Preview } from '@storybook/react-vite';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enTranslation from '../public/locales/en/translation.json';

// initAsync: false forces synchronous init — safe here since resources are
// provided inline with no backend fetch, and it closes the async-init window
// where a story could render before i18next is ready and show raw keys.
void i18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  resources: {
    en: { translation: enTranslation },
  },
  interpolation: {
    escapeValue: false,
  },
  initAsync: false,
});

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
