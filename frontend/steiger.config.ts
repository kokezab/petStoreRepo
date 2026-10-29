import fsd from '@feature-sliced/steiger-plugin';
import { defineConfig } from 'steiger';

export default defineConfig([
  ...fsd.configs.recommended,
  {
    // Orval output (see orval.config.ts) is not hand-written and is imported by
    // deep path (e.g. `@/shared/api/generated/pet/pet`) — one barrel would
    // collide across the petstore/tracer/zerocode SDKs. Same exemption as in
    // eslint.config.js and .prettierignore.
    ignores: ['**/shared/api/generated/**'],
  },
  {
    // `equipment` is an uncountable noun. Steiger's inconsistent-naming rule
    // uses the `pluralize` library, which reports isPlural('equipment') ===
    // true while singular('equipment') === 'equipment'. That makes the rule
    // flag the slice as "plural" among our singular names, but its auto-fix
    // is a no-op (equipment -> equipment), so the error can never be cleared
    // by renaming. Exempt the equipment slices from this one rule.
    files: ['**/equipment/**'],
    rules: {
      'fsd/inconsistent-naming': 'off',
    },
  },
]);
