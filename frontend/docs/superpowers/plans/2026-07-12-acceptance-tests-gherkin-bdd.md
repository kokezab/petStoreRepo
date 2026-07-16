# Acceptance Tests in Gherkin/BDD — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the 14 prose acceptance tests (AT-1..AT-14) in
`docs/superpowers/specs/2026-07-12-pet-store-browse-design.md` into executable Gherkin scenarios,
wired up via `playwright-bdd` so they run as real Playwright tests against deterministic mocked API
data — and confirm every scenario fails for the right reason (the browse UI doesn't exist yet).

**Architecture:** `.feature` files under `tests/acceptance/features/` are compiled by `playwright-bdd`
into Playwright tests. Step definitions under `tests/acceptance/steps/` implement the Given/When/Then
text using Playwright's `page` fixture. API responses are mocked deterministically via Playwright's own
`page.route()` network interception (not the app's MSW worker) against a small fixed fixture set, so
scenario assertions can check exact values instead of random data.

**Tech Stack:** `@playwright/test`, `playwright-bdd`, TypeScript (ESM, matches existing `"type": "module"`
project setup).

## Global Constraints

- Runtime target: this repo's existing Vite dev server on `http://localhost:5200` (Vite's default
  port; nothing in `vite.config.ts` overrides it). Acceptance tests run against `vite dev`, not a
  production build, so `import.meta.env.DEV` is `true` and the app's MSW worker starts — though as
  described below, Playwright's own route interception pre-empts it for every mocked endpoint, so the
  app's MSW handlers (`src/mocks/browser.ts`) do not need to change for these tests to pass or fail
  correctly.
- Do not modify `src/mocks/browser.ts`, `src/App.tsx`, or any other app source file in this plan — this
  plan only adds the acceptance-test harness itself and must leave every scenario in a **failing (red)**
  state, since the Pets/Inventory UI doesn't exist yet. Building that UI is a separate, later plan.
- **Accessible UI contract** — the step definitions below assert against these roles/accessible names.
  This is the concrete interface the future browse-UI implementation must satisfy for these scenarios to
  go green:
  - A `<nav>` landmark (`role="navigation"`) containing links named exactly `"Pets"` and `"Inventory"`.
  - On `/pets`: a status filter control exposed as `role="combobox"` with accessible name
    `"Status filter"`, whose `selectOption` values are `"available"`, `"pending"`, `"sold"`.
  - `/pets` defaults to `status=available` on initial load with no filter interaction (drives the
    `GET /pet/findByStatus` query) — AT-1 asserts exactly the fixture's 2 available pets, which only
    holds if the default query is `available`, not an unfiltered "all pets" request.
  - The pet list is a `role="list"` element named `"Pets"`, containing `role="listitem"` entries; each
    item contains a `role="link"` named with the pet's name (linking to `/pets/:id`).
  - A loading indicator is `role="status"`, named `"Loading pets"` on `/pets` and `"Loading inventory"`
    on `/inventory`.
  - An empty-state message contains the text `"No pets found"` (case-insensitive match).
  - An error message is exposed as `role="alert"`.
  - The pet detail page (`/pets/:id`) has an `<h1>` (`role="heading"`, level 1) named with the pet's
    name; visible text for status and category name; an `<img>` (`role="img"`) named with the pet's
    name; visible text for each tag name; and a `"Back to list"` link back to `/pets`.
  - A "pet not found" state contains the text `"pet not found"` (case-insensitive match).

---

### Task 1: Install and configure the Playwright + BDD toolchain

**Files:**
- Modify: `package.json`
- Create: `playwright.config.ts`
- Create: `tests/acceptance/tsconfig.json`
- Modify: `.gitignore`
- Modify: `eslint.config.js`

**Interfaces:**
- Produces: `npm run test:acceptance` script; `playwright.config.ts` exporting a Playwright config
  whose `testDir` comes from `defineBddConfig({ features: 'tests/acceptance/features/**/*.feature',
  steps: 'tests/acceptance/steps/**/*.ts', outputDir: 'tests/acceptance/.features-gen' })`.

- [ ] **Step 1: Install dependencies**

Run:
```
npm install -D @playwright/test playwright-bdd
```

- [ ] **Step 2: Install the Chromium browser binary for Playwright**

Run:
```
npx playwright install chromium
```
Expected: downloads Chromium into Playwright's local cache; exits 0.

- [ ] **Step 3: Create `playwright.config.ts`**

```ts
import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';

const testDir = defineBddConfig({
  features: 'tests/acceptance/features/**/*.feature',
  steps: 'tests/acceptance/steps/**/*.ts',
  outputDir: 'tests/acceptance/.features-gen',
});

export default defineConfig({
  testDir,
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5200',
    reuseExistingServer: !process.env.CI,
  },
  use: {
    baseURL: 'http://localhost:5200',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
```

- [ ] **Step 4: Add the `test:acceptance` script to `package.json`**

In the `"scripts"` block, add:
```json
"test:acceptance": "bddgen && playwright test"
```

- [ ] **Step 5: Create `tests/acceptance/tsconfig.json`** (editor/IDE support only — not wired into the
  root `tsconfig.json` project references, so `npm run build`'s `tsc -b` is unaffected)

```json
{
  "compilerOptions": {
    "target": "es2023",
    "module": "esnext",
    "moduleResolution": "bundler",
    "types": ["node"],
    "skipLibCheck": true,
    "noEmit": true
  },
  "include": ["**/*.ts"]
}
```

- [ ] **Step 6: Add Playwright/BDD output directories to `.gitignore`**

Add after the existing `.superpowers/` line:
```
tests/acceptance/.features-gen/
playwright-report/
test-results/
```

- [ ] **Step 7: Ignore generated BDD output in ESLint**

In `eslint.config.js`, extend the existing `globalIgnores` call:
```js
globalIgnores(['dist', 'src/api/generated', 'tests/acceptance/.features-gen']),
```

- [ ] **Step 8: Verify the existing build is unaffected**

Run:
```
npm run build
```
Expected: PASS, same as before this task (confirms `tests/acceptance/tsconfig.json` is not pulled into
the root build graph).

- [ ] **Step 9: Commit**

```bash
git add package.json package-lock.json playwright.config.ts tests/acceptance/tsconfig.json .gitignore eslint.config.js
git commit -m "test: add playwright-bdd toolchain for acceptance tests"
```

---

### Task 2: Deterministic pet fixtures and network-mock support module

**Files:**
- Create: `tests/acceptance/fixtures/pets.ts`
- Create: `tests/acceptance/support/mock-api.ts`

**Interfaces:**
- Consumes: nothing (pure TS + `@playwright/test` types).
- Produces:
  - `pets: Pet[]` and `inventoryCounts: Record<'available' | 'pending' | 'sold', number>` from
    `tests/acceptance/fixtures/pets.ts`.
  - `mockPetApi(page: Page): Promise<void>` — registers baseline routes for pet list, pet-by-id, and
    inventory, from `tests/acceptance/support/mock-api.ts`.
  - `mockPetListEmpty(page: Page, status: string): Promise<void>`
  - `mockPetListError(page: Page): Promise<void>`
  - `mockPetListDelayed(page: Page, delayMs: number): Promise<void>`
  - `mockInventoryError(page: Page): Promise<void>`
  - `mockInventoryDelayed(page: Page, delayMs: number): Promise<void>`

- [ ] **Step 1: Create the fixture data**

`tests/acceptance/fixtures/pets.ts`:
```ts
export type PetStatus = 'available' | 'pending' | 'sold';

export interface Pet {
  id: number;
  name: string;
  status: PetStatus;
  category: { id: number; name: string };
  photoUrls: string[];
  tags: { id: number; name: string }[];
}

export const pets: Pet[] = [
  {
    id: 1,
    name: 'Bella',
    status: 'available',
    category: { id: 1, name: 'Dogs' },
    photoUrls: ['https://example.com/bella.jpg'],
    tags: [{ id: 1, name: 'friendly' }],
  },
  {
    id: 2,
    name: 'Max',
    status: 'available',
    category: { id: 1, name: 'Dogs' },
    photoUrls: ['https://example.com/max.jpg'],
    tags: [{ id: 2, name: 'playful' }],
  },
  {
    id: 3,
    name: 'Whiskers',
    status: 'pending',
    category: { id: 2, name: 'Cats' },
    photoUrls: ['https://example.com/whiskers.jpg'],
    tags: [{ id: 3, name: 'shy' }],
  },
  {
    id: 4,
    name: 'Tweety',
    status: 'pending',
    category: { id: 3, name: 'Birds' },
    photoUrls: ['https://example.com/tweety.jpg'],
    tags: [],
  },
  {
    id: 5,
    name: 'Rocky',
    status: 'sold',
    category: { id: 1, name: 'Dogs' },
    photoUrls: ['https://example.com/rocky.jpg'],
    tags: [{ id: 1, name: 'friendly' }],
  },
];

export const inventoryCounts: Record<PetStatus, number> = {
  available: pets.filter((pet) => pet.status === 'available').length,
  pending: pets.filter((pet) => pet.status === 'pending').length,
  sold: pets.filter((pet) => pet.status === 'sold').length,
};
```

- [ ] **Step 2: Create the network-mock support module**

`tests/acceptance/support/mock-api.ts`:
```ts
import type { Page, Route } from '@playwright/test';
import { pets, inventoryCounts } from '../fixtures/pets';

const PET_BY_ID_PATTERN = /\/pet\/\d+(\?.*)?$/;

export async function mockPetApi(page: Page): Promise<void> {
  await page.route('**/pet/findByStatus**', async (route: Route) => {
    const url = new URL(route.request().url());
    const statuses = url.searchParams.getAll('status');
    const matched = statuses.length > 0 ? pets.filter((pet) => statuses.includes(pet.status)) : pets;
    await route.fulfill({ json: matched });
  });

  await page.route(PET_BY_ID_PATTERN, async (route: Route) => {
    const id = Number(new URL(route.request().url()).pathname.split('/').pop());
    const pet = pets.find((p) => p.id === id);
    if (!pet) {
      await route.fulfill({ status: 404, json: { code: 404, type: 'error', message: 'Pet not found' } });
      return;
    }
    await route.fulfill({ json: pet });
  });

  await page.route('**/store/inventory', async (route: Route) => {
    await route.fulfill({ json: inventoryCounts });
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

- [ ] **Step 3: Type-check the new module**

Run:
```
npx tsc --noEmit -p tests/acceptance/tsconfig.json
```
Expected: PASS, no errors.

- [ ] **Step 4: Commit**

```bash
git add tests/acceptance/fixtures/pets.ts tests/acceptance/support/mock-api.ts
git commit -m "test: add deterministic pet fixtures and network-mock helpers"
```

---

### Task 3: Common step definitions and the navigation scenario (first end-to-end slice)

**Files:**
- Create: `tests/acceptance/steps/common.steps.ts`
- Create: `tests/acceptance/features/navigation.feature`
- Create: `tests/acceptance/steps/navigation.steps.ts`

**Interfaces:**
- Consumes: `mockPetApi` from Task 2 (`tests/acceptance/support/mock-api.ts`).
- Produces: shared step text usable by every other feature file: `Given the pet store app is running
  with mocked API data`, `Given I am on the {string} page`, `When I navigate to {string}`, `When I
  navigate directly to {string}`, `Then I should be on the {string} page`, `Then I should be back on the
  {string} page`, `Then I should see an error message instead of a blank page`.

- [ ] **Step 1: Write the shared step definitions**

`tests/acceptance/steps/common.steps.ts`:
```ts
import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';
import { mockPetApi } from '../support/mock-api';

export const { Given, When, Then } = createBdd();

Given('the pet store app is running with mocked API data', async ({ page }) => {
  await mockPetApi(page);
});

Given('I am on the {string} page', async ({ page }, path: string) => {
  await page.goto(path);
});

When('I navigate to {string}', async ({ page }, path: string) => {
  await page.goto(path);
});

When('I navigate directly to {string}', async ({ page }, path: string) => {
  await page.goto(path);
});

Then('I should be on the {string} page', async ({ page }, path: string) => {
  await expect(page).toHaveURL(path);
});

Then('I should be back on the {string} page', async ({ page }, path: string) => {
  await expect(page).toHaveURL(path);
});

Then('I should see an error message instead of a blank page', async ({ page }) => {
  await expect(page.getByRole('alert')).toBeVisible();
});
```

- [ ] **Step 2: Write the navigation feature file**

`tests/acceptance/features/navigation.feature`:
```gherkin
@navigation
Feature: Top navigation

  Background:
    Given the pet store app is running with mocked API data

  Scenario: AT-14 Nav links route to the corresponding page
    Given I am on the "/pets" page
    When I click the "Inventory" nav link
    Then I should be on the "/inventory" page
    When I click the "Pets" nav link
    Then I should be on the "/pets" page
```

- [ ] **Step 3: Write the navigation-specific step**

`tests/acceptance/steps/navigation.steps.ts`:
```ts
import { createBdd } from 'playwright-bdd';

const { When } = createBdd();

When('I click the {string} nav link', async ({ page }, name: string) => {
  await page.getByRole('navigation').getByRole('link', { name }).click();
});
```

- [ ] **Step 4: Generate and run the suite**

Run:
```
npx bddgen && npx playwright test --grep @navigation
```
Expected: **FAIL**. The app has no `role="navigation"` element yet (current `src/App.tsx` is still the
orval demo page), so the click on the "Inventory" nav link times out with a Playwright locator timeout
(`locator.click: Timeout ... waiting for getByRole('navigation')`). This is the correct red state —
confirms the BDD pipeline (feature parsing, step matching, dev server, network mocking) all work; the
failure is purely "UI doesn't exist yet."

- [ ] **Step 5: Commit**

```bash
git add tests/acceptance/steps/common.steps.ts tests/acceptance/features/navigation.feature tests/acceptance/steps/navigation.steps.ts
git commit -m "test: add navigation acceptance scenario (AT-14, expected red)"
```

---

### Task 4: Pet list scenarios (AT-1..AT-6)

**Files:**
- Create: `tests/acceptance/features/pet-list.feature`
- Create: `tests/acceptance/steps/pet-list.steps.ts`

**Interfaces:**
- Consumes: `pets` from Task 2 fixtures; `mockPetListDelayed`, `mockPetListEmpty`, `mockPetListError`
  from Task 2 support module; shared steps from Task 3 (`common.steps.ts`).
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Write the pet-list feature file**

`tests/acceptance/features/pet-list.feature`:
```gherkin
@pet-list
Feature: Pet list browsing

  Background:
    Given the pet store app is running with mocked API data

  Scenario: AT-1 Default view shows available pets
    When I navigate to "/pets"
    Then the pet list should show only pets with status "available"
    And each pet should be listed by name

  Scenario: AT-2 Filtering by pending status
    Given I am on the "/pets" page
    When I select the "pending" status filter
    Then the pet list should show only pets with status "pending"

  Scenario: AT-3 Filtering by sold status
    Given I am on the "/pets" page
    When I select the "sold" status filter
    Then the pet list should show only pets with status "sold"

  Scenario: AT-4 Loading indicator while pets are loading
    Given the mocked pet list request is delayed
    When I navigate to "/pets"
    Then I should see a loading indicator before the list appears

  Scenario: AT-5 Empty state when a filter has no matches
    Given the mocked API returns no pets for status "sold"
    When I select the "sold" status filter
    Then I should see an empty-state message

  Scenario: AT-6 Error state when the pet list request fails
    Given the mocked API returns an error for the pet list request
    When I navigate to "/pets"
    Then I should see an error message instead of a blank page
```

- [ ] **Step 2: Write the pet-list step definitions**

`tests/acceptance/steps/pet-list.steps.ts`:
```ts
import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';
import { pets } from '../fixtures/pets';
import { mockPetListDelayed, mockPetListEmpty, mockPetListError } from '../support/mock-api';

const { Given, When, Then } = createBdd();

Given('the mocked pet list request is delayed', async ({ page }) => {
  await mockPetListDelayed(page, 2000);
});

Given('the mocked API returns no pets for status {string}', async ({ page }, status: string) => {
  await mockPetListEmpty(page, status);
});

Given('the mocked API returns an error for the pet list request', async ({ page }) => {
  await mockPetListError(page);
});

When('I select the {string} status filter', async ({ page }, status: string) => {
  await page.getByRole('combobox', { name: 'Status filter' }).selectOption(status);
});

Then('the pet list should show only pets with status {string}', async ({ page }, status: string) => {
  const expected = pets.filter((pet) => pet.status === status);
  const list = page.getByRole('list', { name: 'Pets' });
  await expect(list.getByRole('listitem')).toHaveCount(expected.length);
  for (const pet of expected) {
    await expect(list.getByRole('link', { name: pet.name })).toBeVisible();
  }
});

Then('each pet should be listed by name', async ({ page }) => {
  await expect(page.getByRole('list', { name: 'Pets' }).getByRole('listitem').first()).toBeVisible();
});

Then('I should see an empty-state message', async ({ page }) => {
  await expect(page.getByText(/no pets found/i)).toBeVisible();
});

Then('I should see a loading indicator before the list appears', async ({ page }) => {
  await expect(page.getByRole('status', { name: 'Loading pets' })).toBeVisible();
});
```

- [ ] **Step 3: Generate and run the suite**

Run:
```
npx bddgen && npx playwright test --grep @pet-list
```
Expected: **FAIL** on all 6 scenarios — no `role="list"` named "Pets", no status filter, no loading
indicator, no empty/error states exist in the app yet. Confirms red state for the right reason.

- [ ] **Step 4: Commit**

```bash
git add tests/acceptance/features/pet-list.feature tests/acceptance/steps/pet-list.steps.ts
git commit -m "test: add pet list acceptance scenarios (AT-1..AT-6, expected red)"
```

---

### Task 5: Pet detail scenarios (AT-7..AT-10)

**Files:**
- Create: `tests/acceptance/features/pet-detail.feature`
- Create: `tests/acceptance/steps/pet-detail.steps.ts`

**Interfaces:**
- Consumes: `pets` from Task 2 fixtures; shared steps from Task 3.
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Write the pet-detail feature file**

`tests/acceptance/features/pet-detail.feature`:
```gherkin
@pet-detail
Feature: Pet detail

  Background:
    Given the pet store app is running with mocked API data

  Scenario: AT-7 Clicking a pet card navigates to its detail page
    Given I am on the "/pets" page
    When I click on a pet card
    Then I should be on that pet's detail page
    And I should see its name, status, category, photo, and tags

  Scenario: AT-8 Direct navigation to a pet detail page (deep link)
    When I navigate directly to "/pets/1"
    Then I should see pet "1"'s detail

  Scenario: AT-9 Navigating to a nonexistent pet id
    When I navigate directly to "/pets/999999"
    Then I should see a "pet not found" message
    And the app should not crash

  Scenario: AT-10 Back to list from the detail page
    Given I am on a pet's detail page
    When I click "back to list"
    Then I should be back on the "/pets" page
```

- [ ] **Step 2: Write the pet-detail step definitions**

`tests/acceptance/steps/pet-detail.steps.ts`:
```ts
import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';
import { pets } from '../fixtures/pets';

const { Given, When, Then } = createBdd();

// The default status filter ("available") always returns [Bella, Max] in fixture order, so
// "the first pet card" deterministically means Bella (id 1) across these scenarios.
const firstAvailablePet = pets[0];

Given('I am on a pet\'s detail page', async ({ page }) => {
  await page.goto(`/pets/${firstAvailablePet.id}`);
});

When('I click on a pet card', async ({ page }) => {
  await page.getByRole('list', { name: 'Pets' }).getByRole('link').first().click();
});

When('I click {string}', async ({ page }, text: string) => {
  await page.getByRole('link', { name: text }).click();
});

Then('I should be on that pet\'s detail page', async ({ page }) => {
  await expect(page).toHaveURL(`/pets/${firstAvailablePet.id}`);
});

Then('I should see its name, status, category, photo, and tags', async ({ page }) => {
  await expect(page.getByRole('heading', { name: firstAvailablePet.name, level: 1 })).toBeVisible();
  await expect(page.getByText(firstAvailablePet.status)).toBeVisible();
  await expect(page.getByText(firstAvailablePet.category.name)).toBeVisible();
  await expect(page.getByRole('img', { name: firstAvailablePet.name })).toBeVisible();
  await expect(page.getByText(firstAvailablePet.tags[0].name)).toBeVisible();
});

Then('I should see pet {string}\'s detail', async ({ page }, id: string) => {
  const pet = pets.find((p) => p.id === Number(id));
  if (!pet) throw new Error(`No fixture pet with id ${id}`);
  await expect(page.getByRole('heading', { name: pet.name, level: 1 })).toBeVisible();
});

Then('I should see a {string} message', async ({ page }, text: string) => {
  await expect(page.getByText(new RegExp(text, 'i'))).toBeVisible();
});

Then('the app should not crash', async ({ page }) => {
  await expect(page.locator('body')).toBeVisible();
});
```

- [ ] **Step 3: Generate and run the suite**

Run:
```
npx bddgen && npx playwright test --grep @pet-detail
```
Expected: **FAIL** on all 4 scenarios — no pet list to click into, no detail heading/img, no "pet not
found" text, no "Back to list" link exist in the app yet.

- [ ] **Step 4: Commit**

```bash
git add tests/acceptance/features/pet-detail.feature tests/acceptance/steps/pet-detail.steps.ts
git commit -m "test: add pet detail acceptance scenarios (AT-7..AT-10, expected red)"
```

---

### Task 6: Store inventory scenarios (AT-11..AT-13)

**Files:**
- Create: `tests/acceptance/features/inventory.feature`
- Create: `tests/acceptance/steps/inventory.steps.ts`

**Interfaces:**
- Consumes: `inventoryCounts` from Task 2 fixtures; `mockInventoryDelayed`, `mockInventoryError` from
  Task 2 support module; shared steps from Task 3 (including `Then I should see an error message
  instead of a blank page`, reused verbatim here).
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Write the inventory feature file**

`tests/acceptance/features/inventory.feature`:
```gherkin
@inventory
Feature: Store inventory

  Background:
    Given the pet store app is running with mocked API data

  Scenario: AT-11 Inventory shows pet counts grouped by status
    When I navigate to "/inventory"
    Then I should see pet counts grouped by "available", "pending", and "sold"

  Scenario: AT-12 Loading indicator while inventory is loading
    Given the mocked inventory request is delayed
    When I navigate to "/inventory"
    Then I should see a loading indicator before the counts appear

  Scenario: AT-13 Error state when the inventory request fails
    Given the mocked API returns an error for the inventory request
    When I navigate to "/inventory"
    Then I should see an error message instead of a blank page
```

- [ ] **Step 2: Write the inventory step definitions**

`tests/acceptance/steps/inventory.steps.ts`:
```ts
import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';
import { inventoryCounts, type PetStatus } from '../fixtures/pets';
import { mockInventoryDelayed, mockInventoryError } from '../support/mock-api';

const { Given, Then } = createBdd();

Given('the mocked inventory request is delayed', async ({ page }) => {
  await mockInventoryDelayed(page, 2000);
});

Given('the mocked API returns an error for the inventory request', async ({ page }) => {
  await mockInventoryError(page);
});

Then(
  'I should see pet counts grouped by {string}, {string}, and {string}',
  async ({ page }, status1: string, status2: string, status3: string) => {
    for (const status of [status1, status2, status3] as PetStatus[]) {
      await expect(page.getByText(new RegExp(`${status}.*${inventoryCounts[status]}`, 'i'))).toBeVisible();
    }
  },
);

Then('I should see a loading indicator before the counts appear', async ({ page }) => {
  await expect(page.getByRole('status', { name: 'Loading inventory' })).toBeVisible();
});
```

- [ ] **Step 3: Generate and run the suite**

Run:
```
npx bddgen && npx playwright test --grep @inventory
```
Expected: **FAIL** on all 3 scenarios — `/inventory` doesn't exist as a route yet, so none of the
expected text/roles are found.

- [ ] **Step 4: Commit**

```bash
git add tests/acceptance/features/inventory.feature tests/acceptance/steps/inventory.steps.ts
git commit -m "test: add inventory acceptance scenarios (AT-11..AT-13, expected red)"
```

---

### Task 7: Full-suite verification

**Files:** none (verification only).

**Interfaces:** Consumes everything from Tasks 1-6.

- [ ] **Step 1: Run the full acceptance suite**

Run:
```
npm run test:acceptance
```
Expected: 14 scenarios collected (AT-1..AT-14) across 4 feature files, **all FAIL**. Confirm in the
output that every failure is a locator/assertion timeout pointing at a missing UI element (nav, list,
filter, heading, etc.) — not a config error, not a "step undefined" error, and not a network/mock error.
A "step undefined" or config-loading error means something in Tasks 1-6 is wired up wrong and must be
fixed before proceeding; a locator-timeout failure against a real, running app is the correct red state
for ATDD.

- [ ] **Step 2: Open the HTML report and skim it**

Run:
```
npx playwright show-report
```
Expected: report lists all 4 feature files and 14 scenarios by their `AT-#` names, all red, with
trace/screenshot on failure available for each.

- [ ] **Step 3: No commit needed**

This task makes no file changes — it only confirms Tasks 1-6 together produce the intended red state.
If Step 1 or Step 2 surfaces a wiring problem, fix it within the relevant earlier task and re-run before
considering this plan complete.
