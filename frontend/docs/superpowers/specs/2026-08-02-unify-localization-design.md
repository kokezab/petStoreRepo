# Unify localization behind `useLocalization`

**Supersedes:** two decisions in `2026-07-18-i18n-setup-design.md` — see "Superseded decisions" below.

## Goal

One `t()` API (`shared/lib/i18n`'s `useLocalization`) that works identically whether
translations are static locale JSON or served by a real backend endpoint, and that
every part of the app actually uses. Today two disconnected systems exist:

- `shared/lib/i18n/useLocalization.ts` — a standalone mock with a hardcoded local
  `resources` object, used by `CountriesPage`, `EquipmentPage`, `CompaniesPage`,
  `MoveEquipmentModal`, `Toolbar`, `FormModal`, `Actions`, `zodToAntd`.
- `src/lib/localization/i18n.ts` — a real `react-i18next` + `i18next-http-backend`
  setup (built per `2026-07-18-i18n-setup-design.md`), used directly via
  `useTranslation()` by `SettingsPage` and `LanguageSelector`, bypassing
  `useLocalization` entirely.

The real system already supports loading translations from either a static file or
a backend endpoint via one env var (`VITE_I18N_LOAD_PATH` → `config.i18nLoadPath`) —
exactly the capability being asked for. The fix is wiring, not new abstraction.

## File layout

- `app/i18n/init.ts` — moved from `src/lib/localization/i18n.ts`. Same
  `i18next.use(Backend).use(LanguageDetector).use(initReactI18next).init({...})`
  call, side-effect-imported once from `AppProviders.tsx` (mirrors how
  `app/observability/sentry.ts` is bootstrapped).
- `shared/lib/i18n/useLocalization.ts` — rewritten to wrap `useTranslation()`. Mock
  `resources` object and `interpolate` helper deleted entirely.
- `shared/lib/i18n/index.ts` — unchanged, stays the slice's public API.
- `shared/ui/language-selector/LanguageSelector.tsx` (+ colocated
  `supportedLanguages.ts`, `types.ts`) — moved from `src/lib/localization/`.
  Switches to `useLocalization()`. For `i18n.changeLanguage(...)` it imports the
  bare `i18next` package directly (not the `app/` init module) — keeps this a
  `shared`-layer file with no upward import into `app/`.
- `SettingsPage.tsx` — switches from direct `useTranslation()` to
  `useLocalization()`; updates the `LanguageSelector` import path.
- `src/lib/localization/` deleted once its contents move.
- `src/lib/query-client` is a separate, pre-existing instance of the same
  "framework singleton outside FSD" pattern — out of scope here, flagged as a
  follow-up cleanup, not fixed inside this task.
- `.storybook/preview.tsx` — gains a synchronous i18next init (real resources,
  no backend fetch) so the Storybook preview keeps showing real translated text
  instead of raw keys. See "Risk: Storybook fixture harness" below.

## `useLocalization` implementation

```ts
import { useTranslation } from 'react-i18next';

export function useLocalization() {
  const { t } = useTranslation();
  return { t };
}
```

Exactly what the mock file's own header comment already prescribed. All existing
call sites keep the same `{ t }` shape and the same `{{var}}` interpolation syntax
(i18next's default) — no call-site changes beyond `SettingsPage`/`LanguageSelector`
above.

## Key migration

The ~30 keys currently hardcoded in the mock's `resources` object move into
`public/locales/en/translation.json` as **nested** objects (e.g. `codebook.add`,
`countries.fields.name`, `validation.required`), preserving the exact same English
copy. `public/locales/sr/translation.json` gets the same keys with the English text
as a placeholder value, left for a future translation pass — not this task's job to
translate.

Single default namespace (`translation`) is kept — no per-slice namespace files.

## Superseded decisions

`2026-07-18-i18n-setup-design.md` made two calls that this design deliberately
reverses, now that real usage has shown the shape needed:

1. **"Flat key-value JSON... no nesting... per user choice"** → now **nested**.
   Flat literal-dot keys (`"codebook.add"`) would require `keySeparator: false` in
   the i18next config and reads less idiomatically than nested objects once the
   key volume grew past the original handful of chrome strings.
2. **Init file living in `src/lib/i18n.ts`** (a top-level bucket alongside
   `src/lib/query-client`, outside any FSD layer) → now **`app/i18n/init.ts`**.
   Global bootstrap/init calls belong in `app/` per CLAUDE.md (e.g.
   `app/observability/sentry.ts`); `src/lib/query-client` remains as a known,
   separate instance of the same gap, not addressed here.

## Backend-source requirement — already satisfied

`config.i18nLoadPath` (overridable via `VITE_I18N_LOAD_PATH`) can already point
`i18next-http-backend` at a real backend endpoint instead of the static
`public/locales/*` files, with zero changes to `useLocalization` or any call site.
This refactor doesn't add that capability — it makes the app actually use the
plumbing that already existed.

## Risk: Storybook fixture harness

`docs/superpowers/specs/2026-08-01-storybook-codebook-fixture-design.md` explicitly
relies on "`useLocalization` ... key-fallback (missing keys render as the key)...
so no i18n setup is required" for `WidgetsCodebook.stories.tsx`, and
`.storybook/preview.tsx` wires no i18n provider.

The mock's `resources` object always had all ~30 keys hardcoded, so historically
Storybook rendered real text ("Add", "Edit") — the fallback-to-key path only ever
fired for genuinely missing/typo'd keys. Once `useLocalization` wraps real
`react-i18next`, and `.storybook/preview.tsx` never initializes i18next, **every**
key is "missing" from i18next's perspective there. It won't crash or hang —
react-i18next's documented behavior for an uninitialized instance is to return the
raw key synchronously — but every codebook label in the Storybook preview would
show literal dotted keys (`codebook.add`) instead of real text. That's a visible
regression in the interactive demo specifically (not in automated tests —
`src/test/setup.ts` already loads real resources synchronously for Vitest, so
`WidgetsCodebook.test.tsx` stays green either way).

**Mitigation:** add a synchronous i18next init to `.storybook/preview.tsx`,
mirroring `src/test/setup.ts` — `i18next.use(initReactI18next).init({ lng: 'en',
resources: { en: { translation: enTranslation } }, ... })` using the same
`public/locales/en/translation.json` import. Zero React providers still needed
(matches the original Storybook design's intent), just a plain module-level
`.init()` call. Verify by running `npm run storybook` and visually confirming
`WidgetsCodebook` renders real English labels, not dotted keys.

## Testing

- `src/test/setup.ts` already boots real `react-i18next` from
  `public/locales/en/translation.json`; once keys land there, existing entity tests
  (`CountriesPage`, `CompaniesPage`, `EquipmentPage`, etc.) keep passing unchanged —
  same rendered English text, same keys.
- No new tests needed — this is a wiring/migration change, not new behavior.
- Acceptance check: full `npm run test:unit` run green, plus the manual
  Storybook smoke-check described above.

## Out of scope

- Translating `sr/translation.json` for real (placeholder English copy only).
- Per-slice namespace splitting (single `translation` namespace retained).
- Cleaning up `src/lib/query-client`'s same FSD-placement gap.
- RTL support, pluralization/ICU beyond i18next defaults (per prior doc, still
  applies).
