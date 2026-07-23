# Pet Creation — Unleash Flag Wiring + Acceptance Tests Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the Unleash feature-flag client into the React app for the first time (config, provider, hook) and write the full Gherkin acceptance-test suite for pet creation — without building the pet-creation UI itself, which is deferred to a later pass.

**Architecture:** `@unleash/proxy-client-react`'s `<FlagProvider>` talks directly to Unleash's built-in Frontend API (`http://localhost:4242/api/frontend`), no separate proxy service. A thin `useFeatureFlag(name)` wrapper hook is the only import surface future components use. Acceptance tests intercept the Frontend API call the same way they already intercept pet/inventory REST calls (`page.route`), so the suite never depends on a real Unleash server being up.

**Tech Stack:** React 19, `@unleash/proxy-client-react` v6 (+ peer dep `unleash-proxy-client`), Vitest + Testing Library, Playwright + playwright-bdd.

## Global Constraints

- `@unleash/proxy-client-react` must be installed at `^6.0.0` — it's the first version with a React 19 peer dependency; earlier majors cap at React 18.
- `unleash-proxy-client` (`^3.8.0`) is a required peer dependency of `@unleash/proxy-client-react` and must be installed alongside it explicitly.
- No UI code for pet creation (no button, modal, form, or `PetListPage`/`AddPetModal` changes) is in scope for this plan. Acceptance scenarios that require that UI are expected to fail until a future pass implements it — this is called out explicitly in Task 6/7, not treated as a defect.
- Acceptance-test AT numbers are global across the whole suite, not per-feature-file. Current highest is AT-14 (`navigation.feature`), so this plan's new scenarios start at AT-15.
- Follow existing repo conventions throughout: `@/` path alias, `simple-import-sort` groups (react → external → `@/` → relative), Playwright step files one-per-feature under `tests/acceptance/steps/`, mock helpers in `tests/acceptance/support/mock-api.ts`.

---

### Task 1: Dependencies, config, and env template

**Files:**
- Modify: `frontend/package.json` (via `npm install`)
- Modify: `frontend/src/config.ts`
- Create: `frontend/.env.example`

**Interfaces:**
- Produces: `config.unleashUrl: string`, `config.unleashClientKey: string` — consumed by Task 4 (`main.tsx`).

- [ ] **Step 1: Install the Unleash React SDK and its peer dependency**

Run: `npm install @unleash/proxy-client-react unleash-proxy-client`
Expected: both packages added to `dependencies` in `package.json`, versions `^6.0.0` and `^3.8.x` respectively.

- [ ] **Step 2: Add Unleash config values**

Current `frontend/src/config.ts`:
```ts
export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'https://petstore.swagger.io/v2',
};
```

Replace with:
```ts
export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'https://petstore.swagger.io/v2',
  unleashUrl: import.meta.env.VITE_UNLEASH_URL || 'http://localhost:4242/api/frontend',
  unleashClientKey: import.meta.env.VITE_UNLEASH_CLIENT_KEY || '',
};
```

- [ ] **Step 3: Add the env template**

Create `frontend/.env.example`:
```
VITE_UNLEASH_URL=http://localhost:4242/api/frontend
VITE_UNLEASH_CLIENT_KEY=
```

- [ ] **Step 4: Verify types still check**

Run: `npm run check`
Expected: passes (tsc, eslint, prettier all clean — the new config fields are unused so far, which `noUnusedLocals` doesn't flag since they're object properties, not locals).

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json src/config.ts .env.example
git commit -m "Add Unleash SDK dependency and frontend config"
```

---

### Task 2: `useFeatureFlag` hook (TDD)

**Files:**
- Create: `frontend/src/lib/feature-flags.ts`
- Test: `frontend/src/lib/feature-flags.test.ts`

**Interfaces:**
- Consumes: `useFlag` from `@unleash/proxy-client-react` (installed in Task 1).
- Produces: `useFeatureFlag(name: string): boolean` — this is the only feature-flag import future UI code should use.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/lib/feature-flags.test.ts`:
```ts
import { renderHook } from '@testing-library/react';
import { vi } from 'vitest';

import { useFlag } from '@unleash/proxy-client-react';

import { useFeatureFlag } from './feature-flags';

vi.mock('@unleash/proxy-client-react', () => ({
  useFlag: vi.fn(),
}));

const mockedUseFlag = vi.mocked(useFlag);

describe('useFeatureFlag', () => {
  it('returns true when the underlying flag is enabled', () => {
    mockedUseFlag.mockReturnValue(true);

    const { result } = renderHook(() => useFeatureFlag('pet-creation'));

    expect(result.current).toBe(true);
    expect(mockedUseFlag).toHaveBeenCalledWith('pet-creation');
  });

  it('returns false when the underlying flag is disabled', () => {
    mockedUseFlag.mockReturnValue(false);

    const { result } = renderHook(() => useFeatureFlag('pet-creation'));

    expect(result.current).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test -- feature-flags`
Expected: FAIL — `Cannot find module './feature-flags'` (file doesn't exist yet).

- [ ] **Step 3: Write the minimal implementation**

Create `frontend/src/lib/feature-flags.ts`:
```ts
import { useFlag } from '@unleash/proxy-client-react';

export function useFeatureFlag(name: string): boolean {
  return useFlag(name);
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test -- feature-flags`
Expected: PASS — both cases green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/feature-flags.ts src/lib/feature-flags.test.ts
git commit -m "Add useFeatureFlag wrapper hook around Unleash's useFlag"
```

---

### Task 3: Acceptance-test mock helpers (feature flag + add-pet)

**Files:**
- Modify: `frontend/tests/acceptance/support/mock-api.ts`

**Interfaces:**
- Produces: `mockFeatureFlag(page: Page, flags: Record<string, boolean>): Promise<void>`, `mockAddPetError(page: Page): Promise<void>`. `mockPetApi` now also seeds a mutable in-memory pet list (shared by the `findByStatus`, pet-by-id, and new `POST /pet` routes) and defaults the `pet-creation` flag to disabled — both consumed by Task 6's steps.
- Note: the design spec sketched a standalone `mockAddPet` helper; it's folded directly into `mockPetApi` instead so the baseline `POST /pet` handler shares the same mutable pet array as `findByStatus`, making a successfully "created" pet actually show up in a subsequent list refetch (needed for AT-17). `mockAddPetError` stays a separate override, matching the existing `mockPetListError`-style pattern.

This task has no code under `src/`, so its test cycle is the existing acceptance suite: the baseline behavior for every current feature must stay unchanged.

- [ ] **Step 1: Replace the file contents**

Replace all of `frontend/tests/acceptance/support/mock-api.ts` with:
```ts
import type { Page, Route } from '@playwright/test';

import { inventoryCounts, pets, type Pet } from '../fixtures/pets';

const PET_BY_ID_PATTERN = /\/pet\/\d+(\?.*)?$/;

export async function mockPetApi(page: Page): Promise<void> {
  const petsInMemory: Pet[] = [...pets];

  await page.route('**/pet/findByStatus**', async (route: Route) => {
    const url = new URL(route.request().url());
    const statuses = url.searchParams.getAll('status');
    const matched =
      statuses.length > 0 ? petsInMemory.filter((pet) => statuses.includes(pet.status)) : petsInMemory;
    await route.fulfill({ json: matched });
  });

  await page.route(PET_BY_ID_PATTERN, async (route: Route) => {
    const id = Number(new URL(route.request().url()).pathname.split('/').pop());
    const pet = petsInMemory.find((p) => p.id === id);
    if (!pet) {
      await route.fulfill({ status: 404, json: { code: 404, type: 'error', message: 'Pet not found' } });
      return;
    }
    await route.fulfill({ json: pet });
  });

  await page.route('**/store/inventory', async (route: Route) => {
    await route.fulfill({ json: inventoryCounts });
  });

  await page.route('**/pet', async (route: Route) => {
    if (route.request().method() !== 'POST') {
      await route.fallback();
      return;
    }
    const body = route.request().postDataJSON() as {
      name: string;
      category?: { name: string };
      status: Pet['status'];
    };
    const newPet: Pet = {
      id: 6,
      name: body.name,
      status: body.status,
      category: { id: 99, name: body.category?.name ?? '' },
      photoUrls: [],
      tags: [],
    };
    petsInMemory.push(newPet);
    await route.fulfill({ json: newPet });
  });

  await mockFeatureFlag(page, { 'pet-creation': false });
}

export async function mockFeatureFlag(page: Page, flags: Record<string, boolean>): Promise<void> {
  await page.route('**/api/frontend**', async (route: Route) => {
    await route.fulfill({
      json: {
        toggles: Object.entries(flags).map(([name, enabled]) => ({
          name,
          enabled,
          variant: { name: 'disabled', enabled: false },
        })),
      },
    });
  });
}

export async function mockAddPetError(page: Page): Promise<void> {
  await page.route('**/pet', async (route: Route) => {
    if (route.request().method() !== 'POST') {
      await route.fallback();
      return;
    }
    await route.fulfill({ status: 500, json: { code: 500, type: 'error', message: 'Internal server error' } });
  });
}

export async function mockPetListEmpty(page: Page, status: string): Promise<void> {
  // Registered after mockPetApi's route for the same URL, so Playwright runs this handler first;
  // route.fallback() hands non-matching statuses back to the earlier (baseline) handler.
  await page.route('**/pet/findByStatus**', async (route: Route) => {
    const url = new URL(route.request().url());
    if (url.searchParams.getAll('status').includes(status)) {
      await route.fulfill({ json: [] });
    } else {
      await route.fallback();
    }
  });
}

export async function mockPetListError(page: Page): Promise<void> {
  await page.route('**/pet/findByStatus**', async (route: Route) => {
    await route.fulfill({ status: 500, json: { code: 500, type: 'error', message: 'Internal server error' } });
  });
}

export async function mockPetListDelayed(page: Page, delayMs: number): Promise<void> {
  await page.route('**/pet/findByStatus**', async (route: Route) => {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    await route.fulfill({ json: pets.filter((pet) => pet.status === 'available') });
  });
}

export async function mockInventoryError(page: Page): Promise<void> {
  await page.route('**/store/inventory', async (route: Route) => {
    await route.fulfill({ status: 500, json: { code: 500, type: 'error', message: 'Internal server error' } });
  });
}

export async function mockInventoryDelayed(page: Page, delayMs: number): Promise<void> {
  await page.route('**/store/inventory', async (route: Route) => {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    await route.fulfill({ json: inventoryCounts });
  });
}
```

- [ ] **Step 2: Run the full existing acceptance suite to confirm no regressions**

Run: `npx bddgen && npx playwright test --grep @`
Expected: PASS — every scenario in `pet-list.feature`, `pet-detail.feature`, `inventory.feature`, `navigation.feature`, `settings.feature`, `planetsoft.feature` still passes. (`pet-creation.feature` doesn't exist yet, so it isn't part of this run.)

- [ ] **Step 3: Commit**

```bash
git add tests/acceptance/support/mock-api.ts
git commit -m "Add feature-flag and add-pet mock helpers to acceptance test support"
```

---

### Task 4: Wire `<FlagProvider>` into the app

**Files:**
- Modify: `frontend/src/main.tsx`

**Interfaces:**
- Consumes: `config.unleashUrl`, `config.unleashClientKey` (Task 1); `FlagProvider` from `@unleash/proxy-client-react` (Task 1).

Because mocks are already in place (Task 3), this is the first task where the app makes a real (mocked-in-tests) call to the Unleash Frontend API.

- [ ] **Step 1: Wrap the app in `FlagProvider`**

Current `frontend/src/main.tsx`:
```tsx
import { StrictMode } from 'react';

import './index.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRoot } from 'react-dom/client';

import App from './App.tsx';

const queryClient = new QueryClient({
  defaultOptions: {
    // One quick retry keeps some resilience to transient network blips for real
    // users, without react-query's default 3-attempt exponential backoff (up to
    // ~7s) leaving the UI on a stale/loading state far longer than a failure
    // warrants.
    queries: { retry: 1, retryDelay: 300 },
  },
});

async function enableMocking() {
  if (!import.meta.env.DEV) return;

  const { worker } = await import('./mocks/browser');
  // Playwright's acceptance suite blocks service workers (so its own page.route()
  // mocks are the only interceptor) — worker.start() then rejects or hangs. Swallow
  // that so the app still renders; real dev-mode registration resolves normally.
  try {
    await Promise.race([
      worker.start({
        onUnhandledRequest: 'bypass', // requests without a mock handler hit the real API
      }),
      new Promise((resolve) => setTimeout(resolve, 2000)),
    ]);
  } catch (error) {
    console.error(
      'MSW failed to start; requests will hit the real network / Playwright mocks.',
      error,
    );
  }
}

enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </StrictMode>,
  );
});
```

Replace with:
```tsx
import { StrictMode } from 'react';

import { FlagProvider } from '@unleash/proxy-client-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRoot } from 'react-dom/client';

import { config } from '@/config';

import './index.css';
import App from './App.tsx';

const queryClient = new QueryClient({
  defaultOptions: {
    // One quick retry keeps some resilience to transient network blips for real
    // users, without react-query's default 3-attempt exponential backoff (up to
    // ~7s) leaving the UI on a stale/loading state far longer than a failure
    // warrants.
    queries: { retry: 1, retryDelay: 300 },
  },
});

const unleashConfig = {
  url: config.unleashUrl,
  clientKey: config.unleashClientKey,
  appName: 'frontend',
};

async function enableMocking() {
  if (!import.meta.env.DEV) return;

  const { worker } = await import('./mocks/browser');
  // Playwright's acceptance suite blocks service workers (so its own page.route()
  // mocks are the only interceptor) — worker.start() then rejects or hangs. Swallow
  // that so the app still renders; real dev-mode registration resolves normally.
  try {
    await Promise.race([
      worker.start({
        onUnhandledRequest: 'bypass', // requests without a mock handler hit the real API
      }),
      new Promise((resolve) => setTimeout(resolve, 2000)),
    ]);
  } catch (error) {
    console.error(
      'MSW failed to start; requests will hit the real network / Playwright mocks.',
      error,
    );
  }
}

enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <FlagProvider config={unleashConfig}>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </FlagProvider>
    </StrictMode>,
  );
});
```

- [ ] **Step 2: Auto-fix import order and formatting**

Run: `npm run format:lint`
Expected: exits clean; may reorder the new imports to satisfy `simple-import-sort`.

- [ ] **Step 3: Verify nothing broke**

Run: `npm run check && npm run test`
Expected: both pass.

Run: `npx bddgen && npx playwright test --grep @`
Expected: PASS — same scenarios as Task 3's Step 2, now exercising the real `FlagProvider` code path against the Task 3 mocks instead of nothing.

- [ ] **Step 4: Commit**

```bash
git add src/main.tsx
git commit -m "Wire Unleash FlagProvider into the app entrypoint"
```

---

### Task 5: Document local Unleash setup for the frontend

**Files:**
- Modify: `README.md` (repo root)

**Interfaces:** none (documentation only).

- [ ] **Step 1: Update the "Feature flags (Unleash)" section**

In the repo-root `README.md`, replace this paragraph:
```markdown
This repo runs [Unleash](https://www.getunleash.io/), an open-source feature-flag engine, locally via Docker Compose for development. It's currently infra-only — no application code consumes it yet.
```
with:
```markdown
This repo runs [Unleash](https://www.getunleash.io/), an open-source feature-flag engine, locally via Docker Compose for development. The frontend app (`frontend/`) reads flags from it via Unleash's built-in Frontend API.
```

Then add a new subsection directly after the existing `### Use it` section (before `### Stop it`):
```markdown
### Frontend integration

The app reads flags through Unleash's Frontend API, which needs its own token type (separate from the admin token above):

1. In the Unleash UI (`http://localhost:4242`), create a flag named `pet-creation`.
2. Go to **Admin → API access** and create a token of type **FRONTEND**.
3. `cp frontend/.env.example frontend/.env.local` and set `VITE_UNLEASH_CLIENT_KEY` to that token.
4. `npm run dev` (inside `frontend/`) picks up `.env.local` automatically.

Without this setup the app still runs fine — flags just evaluate to `false`.
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "Document frontend Unleash Frontend API setup"
```

---

### Task 6: `pet-creation.feature` and its step definitions

**Files:**
- Create: `frontend/tests/acceptance/features/pet-creation.feature`
- Create: `frontend/tests/acceptance/steps/pet-creation.steps.ts`

**Interfaces:**
- Consumes: `mockFeatureFlag`, `mockAddPetError` from `tests/acceptance/support/mock-api.ts` (Task 3).
- Establishes the accessibility contract the (not-yet-built) UI must satisfy: a button named "Add pet"; a `role="dialog"` named "Add pet" containing textboxes named "Name" and "Category", a native `<select>` (`role="combobox"`) named "Status", and buttons named "Save" and "Cancel"; validation text containing "Name is required" / "Category is required".

This is the acceptance-test half of the "implement all regarding Unleash, write acceptance tests for pet-creation, don't build the UI" split agreed with the user. Because the UI doesn't exist, most of these scenarios are expected to fail — see Task 7 for exactly which ones and why.

- [ ] **Step 1: Write the feature file**

Create `frontend/tests/acceptance/features/pet-creation.feature`:
```gherkin
@pet-creation
Feature: Pet creation

  Background:
    Given the pet store app is running with mocked API data

  Scenario: AT-15 Add pet button hidden when the feature flag is disabled
    Given the "pet-creation" feature flag is disabled
    When I navigate to "/pets"
    Then I should not see an "Add pet" button

  Scenario: AT-16 Add pet button visible and opens the form when the feature flag is enabled
    Given the "pet-creation" feature flag is enabled
    When I navigate to "/pets"
    Then I should see an "Add pet" button
    When I click the "Add pet" button
    Then I should see the "Add pet" dialog

  Scenario: AT-17 Submitting a valid form adds the pet to the list
    Given the "pet-creation" feature flag is enabled
    And I am on the "/pets" page
    When I click the "Add pet" button
    And I fill in the pet creation form with name "Buddy", category "Dogs" and status "available"
    And I submit the pet creation form
    Then the "Add pet" form should close
    And the pet list should include a pet named "Buddy"

  Scenario: AT-18 Empty required fields show validation errors
    Given the "pet-creation" feature flag is enabled
    And I am on the "/pets" page
    When I click the "Add pet" button
    And I submit the pet creation form without filling it in
    Then I should see a "Name is required" validation message
    And I should see a "Category is required" validation message
    And the "Add pet" form should still be open

  Scenario: AT-19 An API failure keeps the form open with an error
    Given the "pet-creation" feature flag is enabled
    And the mocked API returns an error for adding a pet
    And I am on the "/pets" page
    When I click the "Add pet" button
    And I fill in the pet creation form with name "Buddy", category "Dogs" and status "available"
    And I submit the pet creation form
    Then I should see an error message instead of a blank page
    And the "Add pet" form should still be open

  Scenario: AT-20 Cancelling the form closes it without creating a pet
    Given the "pet-creation" feature flag is enabled
    And I am on the "/pets" page
    When I click the "Add pet" button
    And I fill in the pet creation form with name "Buddy", category "Dogs" and status "available"
    And I cancel the pet creation form
    Then the "Add pet" form should close
    And the pet list should not include a pet named "Buddy"
```

- [ ] **Step 2: Write the step definitions**

Create `frontend/tests/acceptance/steps/pet-creation.steps.ts`:
```ts
import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';

import { mockAddPetError, mockFeatureFlag } from '../support/mock-api';

const { Given, When, Then } = createBdd();

Given('the {string} feature flag is enabled', async ({ page }, flagName: string) => {
  await mockFeatureFlag(page, { [flagName]: true });
});

Given('the {string} feature flag is disabled', async ({ page }, flagName: string) => {
  await mockFeatureFlag(page, { [flagName]: false });
});

Given('the mocked API returns an error for adding a pet', async ({ page }) => {
  await mockAddPetError(page);
});

Then('I should not see an {string} button', async ({ page }, name: string) => {
  await expect(page.getByRole('button', { name })).toHaveCount(0);
});

Then('I should see an {string} button', async ({ page }, name: string) => {
  await expect(page.getByRole('button', { name })).toBeVisible();
});

When('I click the {string} button', async ({ page }, name: string) => {
  await page.getByRole('button', { name }).click();
});

Then('I should see the {string} form', async ({ page }, name: string) => {
  await expect(page.getByRole('form', { name })).toBeVisible();
});

Then('I should see the {string} dialog', async ({ page }, name: string) => {
  await expect(page.getByRole('dialog', { name })).toBeVisible();
});

When(
  'I fill in the pet creation form with name {string}, category {string} and status {string}',
  async ({ page }, name: string, category: string, status: string) => {
    const dialog = page.getByRole('dialog', { name: 'Add pet' });
    await dialog.getByRole('textbox', { name: 'Name' }).fill(name);
    await dialog.getByRole('textbox', { name: 'Category' }).fill(category);
    await dialog.getByRole('combobox', { name: 'Status' }).selectOption(status);
  },
);

When('I submit the pet creation form', async ({ page }) => {
  await page.getByRole('dialog', { name: 'Add pet' }).getByRole('button', { name: 'Save' }).click();
});

When('I submit the pet creation form without filling it in', async ({ page }) => {
  await page.getByRole('dialog', { name: 'Add pet' }).getByRole('button', { name: 'Save' }).click();
});

When('I cancel the pet creation form', async ({ page }) => {
  await page.getByRole('dialog', { name: 'Add pet' }).getByRole('button', { name: 'Cancel' }).click();
});

Then('the {string} form should close', async ({ page }, name: string) => {
  await expect(page.getByRole('dialog', { name })).toHaveCount(0);
});

Then('the {string} form should still be open', async ({ page }, name: string) => {
  await expect(page.getByRole('dialog', { name })).toBeVisible();
});

Then('I should see a {string} validation message', async ({ page }, message: string) => {
  await expect(page.getByText(new RegExp(message, 'i'))).toBeVisible();
});

Then('the pet list should include a pet named {string}', async ({ page }, name: string) => {
  await expect(page.getByRole('list', { name: 'Pets' }).getByRole('link', { name })).toBeVisible();
});

Then('the pet list should not include a pet named {string}', async ({ page }, name: string) => {
  await expect(page.getByRole('list', { name: 'Pets' }).getByRole('link', { name })).toHaveCount(0);
});
```

- [ ] **Step 3: Generate specs and confirm the file compiles/runs**

Run: `npx bddgen`
Expected: succeeds, produces `tests/acceptance/.features-gen/tests/acceptance/features/pet-creation.feature.spec.js` with 6 test cases (AT-15 through AT-20). This confirms the Gherkin steps all resolve to a matching step definition (no "undefined step" errors) — see Task 7 for actually running them.

- [ ] **Step 4: Commit**

```bash
git add tests/acceptance/features/pet-creation.feature tests/acceptance/steps/pet-creation.steps.ts
git commit -m "Add pet-creation acceptance scenarios (AT-15 to AT-20)"
```

---

### Task 7: Final verification

**Files:** none — verification only.

- [ ] **Step 1: Full unit suite**

Run: `npm run test`
Expected: PASS, including `feature-flags.test.ts`.

- [ ] **Step 2: Full type/lint/format check**

Run: `npm run check`
Expected: PASS.

- [ ] **Step 3: Confirm zero regressions on the pre-existing acceptance suite**

Run: `npx bddgen && npx playwright test --grep-invert @pet-creation`
Expected: PASS — every scenario in `pet-list.feature`, `pet-detail.feature`, `inventory.feature`, `navigation.feature`, `settings.feature`, `planetsoft.feature`.

- [ ] **Step 4: Run the new pet-creation scenarios and confirm the expected split**

Run: `npx playwright test --grep @pet-creation`
Expected (documented, not a bug):
- **AT-15 passes** — with no "Add pet" button anywhere in the (unmodified) UI, "I should not see an Add pet button" is trivially true regardless of flag state.
- **AT-16 through AT-20 fail** — each times out on `page.getByRole('button', { name: 'Add pet' })` or `page.getByRole('dialog', { name: 'Add pet' })` never appearing, because the button/modal/form don't exist yet. This is the expected state until a future pass implements the pet-creation UI against the accessibility contract these steps encode (see Task 6's Interfaces note).

- [ ] **Step 5: Manual smoke check (optional but recommended)**

```bash
cd ..
docker compose up -d
```
Follow the README's new "Frontend integration" steps (create the `pet-creation` flag + FRONTEND token, set `VITE_UNLEASH_CLIENT_KEY` in `frontend/.env.local`), then `cd frontend && npm run dev` and confirm the browser console shows no Unleash client errors on load.
