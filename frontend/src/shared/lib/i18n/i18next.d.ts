import 'i18next';

import type translation from '../../../../public/locales/en/translation.json';

// en/translation.json is the canonical key source for typing `t`. sr/translation.json
// must keep the same key structure, but its values aren't type-checked against this.
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: {
      translation: typeof translation;
    };
  }
}
