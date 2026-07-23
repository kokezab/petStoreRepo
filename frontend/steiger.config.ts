import fsd from '@feature-sliced/steiger-plugin';
import { defineConfig } from 'steiger';

export default defineConfig([
  ...fsd.configs.recommended,
  {
    rules: {
      // `entities/order` and `widgets/nav-bar` currently have a single
      // consumer each (pages/orders and the app shell). That's expected at
      // this point in the migration, not a design mistake — entities are
      // split out for DTO normalization regardless of current reuse count,
      // and nav-bar is a genuine single-composition-point widget. Downgrade
      // to a warning instead of disabling outright, so growing an
      // unreferenced slice by accident still gets flagged.
      'fsd/insignificant-slice': 'warn',
    },
  },
]);
