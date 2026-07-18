# i18n setup design

## Goal
Add client-side localization using `react-i18next`, with translations loaded as flat
JSON (`{ "about": "About", ... }`) from a source that can be swapped between a static
file and a backend API via a single env var — no code changes required to switch.

## Libraries
- `i18next`, `react-i18next` — core + React bindings
- `i18next-http-backend` — fetches JSON from a configurable `loadPath` URL template
- `i18next-browser-languagedetector` — detects/persists chosen language (localStorage)

## Config
`src/config.ts` gains:
```ts
i18nLoadPath: import.meta.env.VITE_I18N_LOAD_PATH || '/locales/{{lng}}/translation.json',
```
`.env.example` documents both static and backend-API examples for `VITE_I18N_LOAD_PATH`,
following the existing Unleash env var documentation style.

Swapping source = changing this one env var:
- Static: `/locales/{{lng}}/translation.json`
- Backend API: `https://api.example.com/i18n/{{lng}}`

## Translation files
- `public/locales/en/translation.json`
- `public/locales/sr/translation.json`
- Flat key-value JSON, single namespace (`translation`), no nesting.

## Wiring
- `src/lib/i18n.ts` — initializes i18next with http-backend + language-detector +
  initReactI18next. `fallbackLng: 'en'`, `supportedLngs: ['en', 'sr']`.
- `src/app/AppProviders/AppProviders.tsx` — import `src/lib/i18n.ts` for side-effect
  init; wrap children in `<Suspense>` (i18next-http-backend loads async) with a
  minimal fallback, consistent with existing provider composition in that file.

## Usage
Components call `useTranslation()` → `t('about')`. No namespace prefix needed since
there's a single default namespace.

## Testing
Existing Vitest suite gets i18next initialized with the `en` bundle mocked/provided
synchronously (via `initReactI18next` + a static resources object in test setup) so
component tests don't depend on network/fetch for translations.

## Out of scope
- No RTL support
- No pluralization/ICU complexity beyond i18next defaults
- No per-feature namespace splitting (flat single JSON per language, per user choice)
