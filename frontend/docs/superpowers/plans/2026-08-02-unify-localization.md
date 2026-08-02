# Unify Localization Behind useLocalization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `useLocalization()`'s `t()` work identically whether translations are static locale JSON or backend-served JSON, by wiring it to the already-configured `react-i18next` + `i18next-http-backend` stack instead of a hardcoded mock, and fold the orphaned `src/lib/localization/*` into FSD layers.

**Architecture:** Migrate the mock's ~30 hardcoded keys into the real `public/locales/*/translation.json` files (nested JSON), relocate the i18next bootstrap into `app/i18n/init.ts` and `LanguageSelector` into `shared/ui/language-selector/`, then swap `useLocalization`'s internals to wrap `react-i18next`'s `useTranslation()`. Existing call sites (`t('countries.title')`, `t('codebook.add', { entity })`, etc.) need no changes — same `{ t }` shape, same `{{var}}` interpolation.

**Tech Stack:** React, TypeScript, `react-i18next`, `i18next-http-backend`, `i18next-browser-languagedetector`, Vitest, Storybook.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-08-02-unify-localization-design.md`
- No cross-slice imports on the same layer; a module may only import from layers below it (FSD rule from CLAUDE.md) — `shared/ui/language-selector/LanguageSelector.tsx` must import the `i18next` npm package directly for `changeLanguage`, never `app/i18n/init.ts`.
- Single default i18next namespace (`translation`), nested JSON keys (not flat dot-string keys) — per spec, supersedes `2026-07-18-i18n-setup-design.md`'s flat-keys decision.
- English copy must be preserved exactly when migrating keys — no wording changes.
- `public/locales/sr/translation.json` gets the new keys with English text as a placeholder value (not translated) — out of scope to translate.
- No new automated tests — this is a wiring/migration change; existing tests are the regression safety net.
- Every task ends green on `npm run test:unit`.

---

### Task 1: Migrate mock translation keys into the real locale JSON files

**Files:**
- Modify: `public/locales/en/translation.json`
- Modify: `public/locales/sr/translation.json`

**Interfaces:**
- Consumes: nothing (pure data file changes).
- Produces: the nested key paths (`codebook.*`, `validation.*`, `countries.*`, `equipment.*`, `company.*`) that Task 4's rewritten `useLocalization` will resolve through `react-i18next`. Every call site already calls `t()` with these exact dotted paths — see `src/entities/country/ui/CountriesPage.tsx`, `src/entities/company/ui/CompaniesPage.tsx`, `src/entities/equipment/ui/EquipmentPage.tsx`, `src/entities/equipment/ui/MoveEquipmentModal.tsx`, `src/shared/ui/codebook-page/components/{Toolbar,FormModal,Actions}.tsx`, `src/shared/lib/zod-antd/zodToAntd.ts`, `src/entities/country/model/permissions.ts`, `src/entities/equipment/model/permissions.ts`, `src/shared/lib/rbac/withFieldLock.ts`.

This task only adds data — `useLocalization` still uses its mock `resources` object until Task 4, so no existing test can regress from this change alone.

- [ ] **Step 1: Replace `public/locales/en/translation.json` with the migrated content**

```json
{
  "about": "About",
  "settings": "Settings",
  "en": "English",
  "sr": "Serbian",
  "language": "Language",
  "codebook": {
    "add": "Add",
    "edit": "Edit",
    "delete": "Delete",
    "confirmDelete": "Delete this item?",
    "createTitle": "Create {{entity}}",
    "editTitle": "Edit {{entity}}",
    "lockedField": "This action is not available for this record right now",
    "discardChangesTitle": "Discard changes?",
    "discardChangesBody": "You have unsaved changes that will be lost.",
    "discard": "Discard",
    "keepEditing": "Keep editing"
  },
  "validation": {
    "required": "This field is required",
    "invalid": "Invalid value",
    "tooLong": "Value is too long"
  },
  "countries": {
    "title": "Countries",
    "entityName": "Country",
    "fields": {
      "name": "Name",
      "code": "Code",
      "status": "Status"
    },
    "validation": {
      "codeLength": "Code must be exactly 3 letters"
    },
    "permissions": {
      "cannotEditDone": "Cannot edit a country marked as done",
      "cannotDeleteDone": "Cannot delete a country marked as done"
    }
  },
  "equipment": {
    "title": "Equipment",
    "entityName": "Equipment",
    "fields": {
      "name": "Name",
      "code": "Code",
      "status": "Status"
    },
    "permissions": {
      "cannotEditDone": "Cannot edit equipment marked as done",
      "cannotDeleteDone": "Cannot delete equipment marked as done",
      "cannotMoveDone": "Cannot move equipment marked as done"
    },
    "move": {
      "title": "Move equipment",
      "parentLabel": "New parent",
      "root": "No parent (root)",
      "success": "Moved"
    }
  },
  "company": {
    "title": "Companies",
    "entityName": "Company",
    "fields": {
      "name": "Name",
      "shortName": "Short name",
      "additionalInfo": "Additional info",
      "active": "Active"
    },
    "active": {
      "yes": "Yes",
      "no": "No"
    }
  }
}
```

- [ ] **Step 2: Replace `public/locales/sr/translation.json` with the migrated content (English placeholders for the new keys, existing Serbian text unchanged for the original 5)**

```json
{
  "about": "O nama",
  "settings": "Podešavanja",
  "en": "Engleski",
  "sr": "Srpski",
  "language": "Jezik",
  "codebook": {
    "add": "Add",
    "edit": "Edit",
    "delete": "Delete",
    "confirmDelete": "Delete this item?",
    "createTitle": "Create {{entity}}",
    "editTitle": "Edit {{entity}}",
    "lockedField": "This action is not available for this record right now",
    "discardChangesTitle": "Discard changes?",
    "discardChangesBody": "You have unsaved changes that will be lost.",
    "discard": "Discard",
    "keepEditing": "Keep editing"
  },
  "validation": {
    "required": "This field is required",
    "invalid": "Invalid value",
    "tooLong": "Value is too long"
  },
  "countries": {
    "title": "Countries",
    "entityName": "Country",
    "fields": {
      "name": "Name",
      "code": "Code",
      "status": "Status"
    },
    "validation": {
      "codeLength": "Code must be exactly 3 letters"
    },
    "permissions": {
      "cannotEditDone": "Cannot edit a country marked as done",
      "cannotDeleteDone": "Cannot delete a country marked as done"
    }
  },
  "equipment": {
    "title": "Equipment",
    "entityName": "Equipment",
    "fields": {
      "name": "Name",
      "code": "Code",
      "status": "Status"
    },
    "permissions": {
      "cannotEditDone": "Cannot edit equipment marked as done",
      "cannotDeleteDone": "Cannot delete equipment marked as done",
      "cannotMoveDone": "Cannot move equipment marked as done"
    },
    "move": {
      "title": "Move equipment",
      "parentLabel": "New parent",
      "root": "No parent (root)",
      "success": "Moved"
    }
  },
  "company": {
    "title": "Companies",
    "entityName": "Company",
    "fields": {
      "name": "Name",
      "shortName": "Short name",
      "additionalInfo": "Additional info",
      "active": "Active"
    },
    "active": {
      "yes": "Yes",
      "no": "No"
    }
  }
}
```

- [ ] **Step 3: Verify both files are valid JSON**

Run: `node -e "JSON.parse(require('fs').readFileSync('public/locales/en/translation.json')); JSON.parse(require('fs').readFileSync('public/locales/sr/translation.json')); console.log('valid')"`
Expected: `valid`

- [ ] **Step 4: Run the full unit suite — must stay green (mock hook is still active, so this only proves the JSON edit didn't break anything else)**

Run: `npm run test:unit`
Expected: all test files pass (24 files / 90 tests, same as before this change)

- [ ] **Step 5: Commit**

```bash
git add public/locales/en/translation.json public/locales/sr/translation.json
git commit -m "Migrate mock translation keys into real locale JSON files"
```

---

### Task 2: Relocate the i18next bootstrap into `app/i18n/init.ts`

**Files:**
- Create: `src/app/i18n/init.ts`
- Modify: `src/app/AppProviders/AppProviders.tsx:3`
- Delete: `src/lib/localization/i18n.ts`

**Interfaces:**
- Consumes: `config.i18nLoadPath` from `@/config` (unchanged).
- Produces: a side-effect module that initializes the global `i18next` singleton. `AppProviders.tsx` imports it for its side effect only, exactly as it previously imported `@/lib/localization/i18n`.

- [ ] **Step 1: Create `src/app/i18n/init.ts` with the bootstrap moved verbatim**

```ts
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
```

- [ ] **Step 2: Update the import in `AppProviders.tsx`**

In `src/app/AppProviders/AppProviders.tsx`, change line 3 from:

```ts
import '@/lib/localization/i18n';
```

to:

```ts
import '@/app/i18n/init';
```

- [ ] **Step 3: Delete the old bootstrap file**

```bash
rm src/lib/localization/i18n.ts
```

- [ ] **Step 4: Typecheck and run the unit suite**

Run: `npx tsc -b && npm run test:unit`
Expected: typecheck passes with no errors; all tests still pass

- [ ] **Step 5: Commit**

```bash
git add src/app/i18n/init.ts src/app/AppProviders/AppProviders.tsx src/lib/localization/i18n.ts
git commit -m "Relocate i18next bootstrap from src/lib into app/i18n"
```

---

### Task 3: Relocate `LanguageSelector` into `shared/ui/language-selector/`

**Files:**
- Create: `src/shared/ui/language-selector/types.ts`
- Create: `src/shared/ui/language-selector/supportedLanguages.ts`
- Create: `src/shared/ui/language-selector/LanguageSelector.tsx`
- Create: `src/shared/ui/language-selector/index.ts`
- Modify: `src/pages/settings/SettingsPage.tsx:3`
- Delete: `src/lib/localization/LanguageSelector.tsx`, `src/lib/localization/supportedLanguages.ts`, `src/lib/localization/types.ts`

**Interfaces:**
- Consumes: `useTranslation()` from `react-i18next` (still — this task only moves files; Task 4 swaps this to `useLocalization`), the `i18next` npm package directly (not `app/i18n/init`, to respect the FSD import direction: `shared` may not import from `app`).
- Produces: `LanguageSelector` component exported from `@/shared/ui/language-selector`, consumed by `SettingsPage.tsx`.

- [ ] **Step 1: Create `src/shared/ui/language-selector/types.ts` (moved verbatim)**

```ts
type Language = 'en' | 'sr';

export type { Language };
```

- [ ] **Step 2: Create `src/shared/ui/language-selector/supportedLanguages.ts` (moved verbatim, same relative import)**

```ts
import type { Language } from './types';

export const supportedLanguages: Language[] = ['en', 'sr'];
```

- [ ] **Step 3: Create `src/shared/ui/language-selector/LanguageSelector.tsx`, with the `i18n` import switched from the app-layer bootstrap to the bare `i18next` package**

```tsx
import { useState } from 'react';

import { Select } from 'antd';
import i18n from 'i18next';
import { useTranslation } from 'react-i18next';

import { supportedLanguages } from './supportedLanguages';
import type { Language } from './types';

export function LanguageSelector() {
  const { t } = useTranslation();
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
```

- [ ] **Step 4: Create the barrel `src/shared/ui/language-selector/index.ts`**

```ts
export { LanguageSelector } from './LanguageSelector';
```

- [ ] **Step 5: Update the import in `SettingsPage.tsx`**

In `src/pages/settings/SettingsPage.tsx`, change line 3 from:

```ts
import { LanguageSelector } from '@/lib/localization/LanguageSelector';
```

to:

```ts
import { LanguageSelector } from '@/shared/ui/language-selector';
```

- [ ] **Step 6: Delete the old files and the now-empty directory**

```bash
rm src/lib/localization/LanguageSelector.tsx src/lib/localization/supportedLanguages.ts src/lib/localization/types.ts
rmdir src/lib/localization
```

- [ ] **Step 7: Typecheck, lint/FSD-check, and run the unit suite**

Run: `npx tsc -b && npm run lint:fsd && npm run test:unit`
Expected: typecheck passes; Steiger reports no new FSD violations; all tests still pass

- [ ] **Step 8: Commit**

```bash
git add src/shared/ui/language-selector src/pages/settings/SettingsPage.tsx
git add -u src/lib/localization
git commit -m "Relocate LanguageSelector from src/lib into shared/ui"
```

---

### Task 4: Wire `useLocalization` to real `react-i18next`

**Files:**
- Modify: `src/shared/lib/i18n/useLocalization.ts` (full rewrite)
- Modify: `src/pages/settings/SettingsPage.tsx`
- Modify: `src/shared/ui/language-selector/LanguageSelector.tsx`

**Interfaces:**
- Consumes: `useTranslation` from `react-i18next`.
- Produces: `useLocalization(): { t: TFunction }` from `@/shared/lib/i18n` — same call shape every existing consumer already uses (`CountriesPage`, `CompaniesPage`, `EquipmentPage`, `MoveEquipmentModal`, `Toolbar`, `FormModal`, `Actions`, `zodToAntd` need zero changes).

- [ ] **Step 1: Rewrite `src/shared/lib/i18n/useLocalization.ts`**

```ts
import { useTranslation } from 'react-i18next';

export function useLocalization() {
  const { t } = useTranslation();
  return { t };
}
```

- [ ] **Step 2: Switch `SettingsPage.tsx` from `useTranslation` to `useLocalization`**

`src/pages/settings/SettingsPage.tsx` currently reads:

```tsx
import { useTranslation } from 'react-i18next';

import { LanguageSelector } from '@/shared/ui/language-selector';

import { ThemeToggle } from './ui/ThemeToggle/ThemeToggle';

export function SettingsPage() {
  const { t } = useTranslation();
  return (
    <div>
      <h1>{t('settings')}</h1>

      <LanguageSelector />

      <ThemeToggle />
    </div>
  );
}
```

Replace it with:

```tsx
import { useLocalization } from '@/shared/lib/i18n';
import { LanguageSelector } from '@/shared/ui/language-selector';

import { ThemeToggle } from './ui/ThemeToggle/ThemeToggle';

export function SettingsPage() {
  const { t } = useLocalization();
  return (
    <div>
      <h1>{t('settings')}</h1>

      <LanguageSelector />

      <ThemeToggle />
    </div>
  );
}
```

- [ ] **Step 3: Switch `LanguageSelector.tsx` from `useTranslation` to `useLocalization`**

In `src/shared/ui/language-selector/LanguageSelector.tsx`, change:

```tsx
import { useTranslation } from 'react-i18next';
```

to:

```tsx
import { useLocalization } from '@/shared/lib/i18n';
```

and change:

```tsx
  const { t } = useTranslation();
```

to:

```tsx
  const { t } = useLocalization();
```

(the `i18n` import and `i18n.changeLanguage(value)` call from Task 3 stay unchanged)

- [ ] **Step 4: Run the full unit suite — this is the behavior-changing step**

Run: `npm run test:unit`
Expected: all test files still pass (24 files / 90 tests). If any entity page test fails on missing text, re-check Task 1's JSON against the failing key — this means a key was missed in the migration.

- [ ] **Step 5: Typecheck and full check**

Run: `npx tsc -b && npm run check`
Expected: no errors from typecheck, eslint, Steiger, or Prettier

- [ ] **Step 6: Commit**

```bash
git add src/shared/lib/i18n/useLocalization.ts src/pages/settings/SettingsPage.tsx src/shared/ui/language-selector/LanguageSelector.tsx
git commit -m "Wire useLocalization to real react-i18next instead of the mock"
```

---

### Task 5: Fix the Storybook preview regression and do final verification

**Files:**
- Modify: `.storybook/preview.tsx`

**Interfaces:**
- Consumes: `public/locales/en/translation.json` (the migrated file from Task 1).
- Produces: nothing consumed by other tasks — this is the last task.

Without this, every codebook label in the Storybook preview would render as a raw
dotted key (`codebook.add`) instead of real text, because `.storybook/preview.tsx`
never initializes i18next and — after Task 4 — `useLocalization` no longer has a
hardcoded fallback resources object. See "Risk: Storybook fixture harness" in the
spec.

- [ ] **Step 1: Add a synchronous i18next init to `.storybook/preview.tsx`**

Replace the full contents of `.storybook/preview.tsx` with:

```tsx
import type { Preview } from '@storybook/react-vite';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enTranslation from '../public/locales/en/translation.json';

void i18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  resources: {
    en: { translation: enTranslation },
  },
  interpolation: {
    escapeValue: false,
  },
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
```

- [ ] **Step 2: Run the full unit suite one more time**

Run: `npm run test:unit`
Expected: all test files pass (24 files / 90 tests)

- [ ] **Step 3: Run the full project check**

Run: `npm run check`
Expected: no errors (typecheck, eslint, Steiger, Prettier all clean)

- [ ] **Step 4: Manually smoke-check Storybook**

Run: `npm run storybook` (starts a dev server on port 6006 — open it in a browser)
Navigate to the `Widgets` codebook story (`WidgetsCodebook`).
Expected: the "Add" button reads "Add" (not `codebook.add`); opening create/edit shows
"Create Widget" / "Edit Widget" style titles, not raw keys; locked-row tooltips (if
any story exercises them) show real sentences, not `codebook.lockedField`.
Stop the dev server (Ctrl+C) once confirmed.

- [ ] **Step 5: Commit**

```bash
git add .storybook/preview.tsx
git commit -m "Initialize i18next in Storybook preview to avoid raw-key regression"
```
