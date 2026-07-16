# Pet + Store Browse UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Pets/Inventory browsing UI (routes, nav, list/detail/inventory pages) so all 14
acceptance scenarios in `tests/acceptance/` go from red to green.

**Architecture:** Double-loop ATDD. Outer loop = the existing Playwright-bdd acceptance suite (already
merged, currently all red) — each AT is the pass/fail gate per feature slice. Inner loop = Vitest +
React Testing Library, one failing component test written before its implementation. `react-router`
handles routing; data fetching reuses the existing orval-generated react-query hooks as-is (no new API
code). Feature code lives under `src/features/<name>/`.

**Tech Stack:** React 19, `react-router`, `@tanstack/react-query` (existing), Vitest, React Testing
Library, TypeScript (ESM, matches existing `"type": "module"` project setup).

## Global Constraints

- Runtime target: existing Vite dev server on `http://localhost:5200` — unchanged.
- New runtime dependency: `react-router` (latest major is 8.x; peer deps require
  `react >=19.2.7` / `react-dom >=19.2.7`, already satisfied by this project's installed
  `react@^19.2.7`). Import `BrowserRouter`, `Routes`, `Route`, `Navigate`, `Link`, `NavLink`,
  `useParams` all from the single `react-router` package (v7+ folded DOM bindings into this package;
  do not add `react-router-dom`).
- New dev dependencies (testing only): `vitest`, `@testing-library/react`,
  `@testing-library/jest-dom`, `@testing-library/user-event`, `jsdom`.
- Component test files (`src/**/*.test.tsx`) are excluded from the production `tsc -b` graph
  (`tsconfig.app.json`) so `npm run build` is unaffected, but they remain linted by the existing
  ESLint config (`eslint.config.js` already matches `**/*.{ts,tsx}`, no change needed there). They get
  their own editor-only `tsconfig.vitest.json`, mirroring the existing
  `tests/acceptance/tsconfig.json` convention (not wired into root `tsconfig.json` project
  references).
- Do not modify anything under `tests/acceptance/` — that suite is the fixed oracle this plan must
  turn green. If a scenario seems wrong, stop and flag it rather than editing the scenario to fit the
  implementation.
- **Accessible UI contract** — every task below implements a piece of this; it is copied verbatim from
  `docs/superpowers/plans/2026-07-12-acceptance-tests-gherkin-bdd.md`:
  - A `<nav>` landmark (`role="navigation"`) containing links named exactly `"Pets"` and `"Inventory"`.
  - On `/pets`: a status filter control exposed as `role="combobox"` with accessible name
    `"Status filter"`, whose `selectOption` values are `"available"`, `"pending"`, `"sold"`.
  - `/pets` defaults to `status=available` on initial load with no filter interaction.
  - The pet list is a `role="list"` element named `"Pets"`, containing `role="listitem"` entries; each
    item contains a `role="link"` named with the pet's name (linking to `/pets/:id`).
  - A loading indicator is `role="status"`, named `"Loading pets"` on `/pets` and `"Loading inventory"`
    on `/inventory`.
  - An empty-state message contains the text `"No pets found"` (case-insensitive).
  - An error message is exposed as `role="alert"`.
  - The pet detail page (`/pets/:id`) has an `<h1>` (`role="heading"`, level 1) named with the pet's
    name; visible text for status and category name; an `<img>` (`role="img"`) named with the pet's
    name; visible text for each tag name; and a `"Back to list"` link back to `/pets`.
  - A "pet not found" state contains the text `"pet not found"` (case-insensitive).
- Styling stays minimal/semantic — the acceptance contract asserts roles/accessible names/text, not
  visual appearance. No separate visual-design pass is in scope.

---

### Task 1: Toolchain — react-router, Vitest, React Testing Library

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `src/test/setup.ts`
- Modify: `tsconfig.app.json`
- Create: `tsconfig.vitest.json`

**Interfaces:**
- Produces: `npm test` (runs Vitest once), `npm run test:watch` (Vitest watch mode); a jsdom test
  environment with `@testing-library/jest-dom` matchers globally available to every `*.test.tsx` file.

- [ ] **Step 1: Install `react-router` (runtime dependency)**

Run:
```
npm install react-router
```
Expected: adds `react-router` under `"dependencies"` in `package.json`; exits 0.

- [ ] **Step 2: Install the Vitest + Testing Library toolchain (dev dependencies)**

Run:
```
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```
Expected: adds all five packages under `"devDependencies"`; exits 0.

- [ ] **Step 3: Create `vitest.config.ts`**

```ts
import path from 'path';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
});
```

- [ ] **Step 4: Create `src/test/setup.ts`**

```ts
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

afterEach(() => {
  cleanup();
});
```

- [ ] **Step 5: Exclude test files from the production TypeScript build**

In `tsconfig.app.json`, add an `"exclude"` array alongside the existing `"include"`:
```json
  "include": ["src"],
  "exclude": ["src/**/*.test.ts", "src/**/*.test.tsx"]
```

- [ ] **Step 6: Create `tsconfig.vitest.json`** (editor/IDE support only — not wired into the root
  `tsconfig.json` project references, so `npm run build`'s `tsc -b` is unaffected)

```json
{
  "compilerOptions": {
    "target": "es2023",
    "module": "esnext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "types": ["node"],
    "paths": { "@/*": ["./src/*"] },
    "skipLibCheck": true,
    "noEmit": true
  },
  "include": ["src/**/*.test.ts", "src/**/*.test.tsx", "src/test/**/*.ts"]
}
```

- [ ] **Step 7: Add `test` and `test:watch` scripts to `package.json`**

In the `"scripts"` block:
```json
"test": "vitest run",
"test:watch": "vitest",
```

- [ ] **Step 8: Verify the production build is unaffected**

Run:
```
npm run build
```
Expected: PASS, same as before this task (confirms the `tsconfig.app.json` exclude works and
`react-router`'s types don't break the build even though nothing imports it yet).

- [ ] **Step 9: Verify Vitest's config loads cleanly**

Run:
```
npx vitest run
```
Expected: Vitest starts, reports no test files matched (something like "No test files found"), and
exits non-zero — that's expected since no `*.test.ts(x)` files exist yet (the first one arrives in
Task 2). A config-loading error would instead print a stack trace pointing at `vitest.config.ts` or a
missing-plugin error — that's the failure mode to watch for, not the "no tests found" message.

- [ ] **Step 10: Commit**

```bash
git add package.json package-lock.json vitest.config.ts src/test/setup.ts tsconfig.app.json tsconfig.vitest.json
git commit -m "test: add Vitest + React Testing Library toolchain, install react-router"
```

---

### Task 2: Router shell + top nav (AT-14)

**Files:**
- Create: `src/features/navigation/NavBar.tsx`
- Create: `src/features/navigation/NavBar.test.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: nothing from earlier tasks besides the toolchain from Task 1.
- Produces: `NavBar` (named export, no props) from `src/features/navigation/NavBar.tsx`, used by
  `App.tsx`. `App.tsx` after this task renders routes for `/`, `/pets`, `/pets/:id`, `/inventory` (the
  latter three as placeholders until Tasks 3-5 replace them).

- [ ] **Step 1: Write the failing NavBar test**

`src/features/navigation/NavBar.test.tsx`:
```tsx
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { NavBar } from './NavBar';

describe('NavBar', () => {
  it('renders Pets and Inventory links inside a navigation landmark', () => {
    render(
      <MemoryRouter>
        <NavBar />
      </MemoryRouter>,
    );

    const nav = screen.getByRole('navigation');
    expect(within(nav).getByRole('link', { name: 'Pets' })).toHaveAttribute('href', '/pets');
    expect(within(nav).getByRole('link', { name: 'Inventory' })).toHaveAttribute(
      'href',
      '/inventory',
    );
  });
});
```

- [ ] **Step 2: Run the test, verify it fails**

Run:
```
npx vitest run src/features/navigation/NavBar.test.tsx
```
Expected: FAIL — `Cannot find module './NavBar'` (the component doesn't exist yet).

- [ ] **Step 3: Implement `NavBar`**

`src/features/navigation/NavBar.tsx`:
```tsx
import { NavLink } from 'react-router';

export function NavBar() {
  return (
    <nav>
      <NavLink to="/pets">Pets</NavLink>
      <NavLink to="/inventory">Inventory</NavLink>
    </nav>
  );
}
```

- [ ] **Step 4: Run the test, verify it passes**

Run:
```
npx vitest run src/features/navigation/NavBar.test.tsx
```
Expected: PASS.

- [ ] **Step 5: Wire up the router shell in `App.tsx`**

Replace the entire contents of `src/App.tsx` (the current orval-demo scaffold) with:
```tsx
import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { NavBar } from '@/features/navigation/NavBar';

export default function App() {
  return (
    <BrowserRouter>
      <NavBar />
      <Routes>
        <Route path="/" element={<Navigate to="/pets" replace />} />
        <Route path="/pets" element={<div>Pets page placeholder</div>} />
        <Route path="/pets/:id" element={<div>Pet detail placeholder</div>} />
        <Route path="/inventory" element={<div>Inventory page placeholder</div>} />
      </Routes>
    </BrowserRouter>
  );
}
```

- [ ] **Step 6: Verify the production build**

Run:
```
npm run build
```
Expected: PASS — confirms `react-router` types resolve and `App.tsx` compiles.

- [ ] **Step 7: Run the navigation acceptance scenario**

Run:
```
npx bddgen && npx playwright test --grep @navigation
```
Expected: PASS (AT-14 green — the first acceptance scenario to go green in this plan).

- [ ] **Step 8: Commit**

```bash
git add src/App.tsx src/features/navigation/NavBar.tsx src/features/navigation/NavBar.test.tsx
git commit -m "feat: add router shell and top nav (AT-14 green)"
```

---

### Task 3: Pet list page (AT-1..AT-6)

**Files:**
- Create: `src/features/pets/PetListPage.tsx`
- Create: `src/features/pets/PetListPage.test.tsx`
- Modify: `src/App.tsx:10` (the `/pets` route's placeholder element)

**Interfaces:**
- Consumes: `useFindPetsByStatus` from `@/api/generated/pet/pet`; `FindPetsByStatusStatusItem` type
  from `@/api/generated/models`; router shell from Task 2.
- Produces: `PetListPage` (named export, no props) from `src/features/pets/PetListPage.tsx`.

- [ ] **Step 1: Write the failing tests for all six pet-list behaviors**

`src/features/pets/PetListPage.test.tsx`:
```tsx
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { vi } from 'vitest';
import { useFindPetsByStatus } from '@/api/generated/pet/pet';
import type { Pet } from '@/api/generated/models';
import { PetListPage } from './PetListPage';

vi.mock('@/api/generated/pet/pet', () => ({
  useFindPetsByStatus: vi.fn(),
}));

const mockedUseFindPetsByStatus = vi.mocked(useFindPetsByStatus);

const bella: Pet = { id: 1, name: 'Bella', photoUrls: [], status: 'available' };
const max: Pet = { id: 2, name: 'Max', photoUrls: [], status: 'available' };
const whiskers: Pet = { id: 3, name: 'Whiskers', photoUrls: [], status: 'pending' };

const petsByStatus: Record<'available' | 'pending' | 'sold', Pet[]> = {
  available: [bella, max],
  pending: [whiskers],
  sold: [],
};

function mockStatus(
  status: keyof typeof petsByStatus,
  overrides: Partial<{ data: Pet[] | undefined; isLoading: boolean; error: Error | null }> = {},
) {
  mockedUseFindPetsByStatus.mockReturnValue({
    data: petsByStatus[status],
    isLoading: false,
    error: null,
    ...overrides,
  } as unknown as ReturnType<typeof useFindPetsByStatus>);
}

function renderPage() {
  render(
    <MemoryRouter>
      <PetListPage />
    </MemoryRouter>,
  );
}

describe('PetListPage', () => {
  it('AT-1: shows only available pets by default, listed by name', () => {
    mockStatus('available');
    renderPage();

    expect(mockedUseFindPetsByStatus).toHaveBeenCalledWith({ status: ['available'] });
    const list = screen.getByRole('list', { name: 'Pets' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(2);
    expect(within(list).getByRole('link', { name: 'Bella' })).toBeVisible();
    expect(within(list).getByRole('link', { name: 'Max' })).toBeVisible();
  });

  it('AT-2: selecting the pending filter re-queries and shows pending pets', async () => {
    mockStatus('available');
    renderPage();
    const user = userEvent.setup();

    mockStatus('pending');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Status filter' }), 'pending');

    expect(mockedUseFindPetsByStatus).toHaveBeenCalledWith({ status: ['pending'] });
    const list = screen.getByRole('list', { name: 'Pets' });
    expect(within(list).getByRole('link', { name: 'Whiskers' })).toBeVisible();
  });

  it('AT-3: selecting the sold filter re-queries with sold status', async () => {
    mockStatus('available');
    renderPage();
    const user = userEvent.setup();

    mockStatus('sold');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Status filter' }), 'sold');

    expect(mockedUseFindPetsByStatus).toHaveBeenCalledWith({ status: ['sold'] });
  });

  it('AT-4: shows a loading indicator while pets are loading', () => {
    mockStatus('available', { data: undefined, isLoading: true });
    renderPage();

    expect(screen.getByRole('status', { name: 'Loading pets' })).toBeVisible();
  });

  it('AT-5: shows an empty-state message when a filter has no matches', () => {
    mockStatus('sold');
    renderPage();

    expect(screen.getByText(/no pets found/i)).toBeVisible();
  });

  it('AT-6: shows an error message when the request fails', () => {
    mockStatus('available', { data: undefined, isLoading: false, error: new Error('boom') });
    renderPage();

    expect(screen.getByRole('alert')).toBeVisible();
  });
});
```

- [ ] **Step 2: Run the tests, verify they fail**

Run:
```
npx vitest run src/features/pets/PetListPage.test.tsx
```
Expected: FAIL — `Cannot find module './PetListPage'`.

- [ ] **Step 3: Implement `PetListPage`**

`src/features/pets/PetListPage.tsx`:
```tsx
import { useState } from 'react';
import { Link } from 'react-router';
import { useFindPetsByStatus } from '@/api/generated/pet/pet';
import type { FindPetsByStatusStatusItem } from '@/api/generated/models';

const STATUS_OPTIONS: FindPetsByStatusStatusItem[] = ['available', 'pending', 'sold'];

export function PetListPage() {
  const [status, setStatus] = useState<FindPetsByStatusStatusItem>('available');
  const { data, isLoading, error } = useFindPetsByStatus({ status: [status] });

  return (
    <div>
      <label>
        Status filter
        <select
          aria-label="Status filter"
          value={status}
          onChange={(event) => setStatus(event.target.value as FindPetsByStatusStatusItem)}
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>

      {isLoading && (
        <p role="status" aria-label="Loading pets">
          Loading pets…
        </p>
      )}
      {error && <p role="alert">Failed to load pets.</p>}
      {!isLoading && !error && data?.length === 0 && <p>No pets found</p>}
      {!isLoading && !error && data && data.length > 0 && (
        <ul aria-label="Pets" role="list">
          {data.map((pet) => (
            <li key={pet.id} role="listitem">
              <Link to={`/pets/${pet.id}`}>{pet.name}</Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run the tests, verify they pass**

Run:
```
npx vitest run src/features/pets/PetListPage.test.tsx
```
Expected: PASS, all 6 tests green.

- [ ] **Step 5: Wire `PetListPage` into the `/pets` route**

In `src/App.tsx`, add the import and replace the `/pets` route's placeholder:
```tsx
import { PetListPage } from '@/features/pets/PetListPage';
```
```tsx
<Route path="/pets" element={<PetListPage />} />
```

- [ ] **Step 6: Verify the production build**

Run:
```
npm run build
```
Expected: PASS.

- [ ] **Step 7: Run the pet-list acceptance scenarios**

Run:
```
npx bddgen && npx playwright test --grep @pet-list
```
Expected: PASS (AT-1..AT-6 green).

- [ ] **Step 8: Commit**

```bash
git add src/App.tsx src/features/pets/PetListPage.tsx src/features/pets/PetListPage.test.tsx
git commit -m "feat: add pet list page with status filter (AT-1..AT-6 green)"
```

---

### Task 4: Pet detail page (AT-7..AT-10)

**Files:**
- Create: `src/features/pets/PetDetailPage.tsx`
- Create: `src/features/pets/PetDetailPage.test.tsx`
- Modify: `src/App.tsx:11` (the `/pets/:id` route's placeholder element)

**Interfaces:**
- Consumes: `useGetPetById` from `@/api/generated/pet/pet`; `Pet` type from
  `@/api/generated/models`; router shell from Task 2; the `/pets` list built in Task 3 links here.
- Produces: `PetDetailPage` (named export, no props) from `src/features/pets/PetDetailPage.tsx`.

- [ ] **Step 1: Write the failing tests**

`src/features/pets/PetDetailPage.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { vi } from 'vitest';
import { useGetPetById } from '@/api/generated/pet/pet';
import type { Pet } from '@/api/generated/models';
import { PetDetailPage } from './PetDetailPage';

vi.mock('@/api/generated/pet/pet', () => ({
  useGetPetById: vi.fn(),
}));

const mockedUseGetPetById = vi.mocked(useGetPetById);

const bella: Pet = {
  id: 1,
  name: 'Bella',
  status: 'available',
  category: { id: 1, name: 'Dogs' },
  photoUrls: ['https://example.com/bella.jpg'],
  tags: [{ id: 1, name: 'friendly' }],
};

function mockResult(overrides: Partial<{ data: Pet | undefined; isLoading: boolean; error: Error | null }>) {
  mockedUseGetPetById.mockReturnValue({
    data: undefined,
    isLoading: false,
    error: null,
    ...overrides,
  } as unknown as ReturnType<typeof useGetPetById>);
}

function renderDetail(id = '1') {
  render(
    <MemoryRouter initialEntries={[`/pets/${id}`]}>
      <Routes>
        <Route path="/pets/:id" element={<PetDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('PetDetailPage', () => {
  it('AT-7/AT-8: shows name, status, category, photo, and tags', () => {
    mockResult({ data: bella });
    renderDetail();

    expect(screen.getByRole('heading', { level: 1, name: 'Bella' })).toBeVisible();
    expect(screen.getByText(/available/)).toBeVisible();
    expect(screen.getByText(/Dogs/)).toBeVisible();
    expect(screen.getByRole('img', { name: 'Bella' })).toBeVisible();
    expect(screen.getByText('friendly')).toBeVisible();
  });

  it('AT-9: shows a not-found message for a nonexistent pet, without crashing', () => {
    mockResult({ error: new Error('not found') });
    renderDetail('999999');

    expect(screen.getByText(/pet not found/i)).toBeVisible();
  });

  it('AT-10: links back to the pet list', () => {
    mockResult({ data: bella });
    renderDetail();

    expect(screen.getByRole('link', { name: 'Back to list' })).toHaveAttribute('href', '/pets');
  });
});
```

- [ ] **Step 2: Run the tests, verify they fail**

Run:
```
npx vitest run src/features/pets/PetDetailPage.test.tsx
```
Expected: FAIL — `Cannot find module './PetDetailPage'`.

- [ ] **Step 3: Implement `PetDetailPage`**

`src/features/pets/PetDetailPage.tsx`:
```tsx
import { Link, useParams } from 'react-router';
import { useGetPetById } from '@/api/generated/pet/pet';

export function PetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: pet, isLoading, error } = useGetPetById(Number(id));

  if (isLoading) {
    return (
      <p role="status" aria-label="Loading pet">
        Loading pet…
      </p>
    );
  }
  if (error || !pet) {
    return <p>Pet not found</p>;
  }

  return (
    <div>
      <h1>{pet.name}</h1>
      <p>Status: {pet.status}</p>
      <p>Category: {pet.category?.name}</p>
      <img src={pet.photoUrls[0] ?? ''} alt={pet.name} />
      <ul>
        {pet.tags?.map((tag) => <li key={tag.id}>{tag.name}</li>)}
      </ul>
      <Link to="/pets">Back to list</Link>
    </div>
  );
}
```

- [ ] **Step 4: Run the tests, verify they pass**

Run:
```
npx vitest run src/features/pets/PetDetailPage.test.tsx
```
Expected: PASS, all 3 tests green.

- [ ] **Step 5: Wire `PetDetailPage` into the `/pets/:id` route**

In `src/App.tsx`, add the import and replace the `/pets/:id` route's placeholder:
```tsx
import { PetDetailPage } from '@/features/pets/PetDetailPage';
```
```tsx
<Route path="/pets/:id" element={<PetDetailPage />} />
```

- [ ] **Step 6: Verify the production build**

Run:
```
npm run build
```
Expected: PASS.

- [ ] **Step 7: Run the pet-detail acceptance scenarios**

Run:
```
npx bddgen && npx playwright test --grep @pet-detail
```
Expected: PASS (AT-7..AT-10 green).

- [ ] **Step 8: Commit**

```bash
git add src/App.tsx src/features/pets/PetDetailPage.tsx src/features/pets/PetDetailPage.test.tsx
git commit -m "feat: add pet detail page (AT-7..AT-10 green)"
```

---

### Task 5: Store inventory page (AT-11..AT-13)

**Files:**
- Create: `src/features/inventory/InventoryPage.tsx`
- Create: `src/features/inventory/InventoryPage.test.tsx`
- Modify: `src/App.tsx:12` (the `/inventory` route's placeholder element)

**Interfaces:**
- Consumes: `useGetInventory` from `@/api/generated/store/store`; router shell from Task 2.
- Produces: `InventoryPage` (named export, no props) from `src/features/inventory/InventoryPage.tsx`.

- [ ] **Step 1: Write the failing tests**

`src/features/inventory/InventoryPage.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { useGetInventory } from '@/api/generated/store/store';
import { InventoryPage } from './InventoryPage';

vi.mock('@/api/generated/store/store', () => ({
  useGetInventory: vi.fn(),
}));

const mockedUseGetInventory = vi.mocked(useGetInventory);

function mockResult(overrides: Partial<{ data: Record<string, number> | undefined; isLoading: boolean; error: Error | null }>) {
  mockedUseGetInventory.mockReturnValue({
    data: undefined,
    isLoading: false,
    error: null,
    ...overrides,
  } as unknown as ReturnType<typeof useGetInventory>);
}

describe('InventoryPage', () => {
  it('AT-11: shows pet counts grouped by available, pending, and sold', () => {
    mockResult({ data: { available: 2, pending: 2, sold: 1 } });
    render(<InventoryPage />);

    expect(screen.getByText(/available.*2/i)).toBeVisible();
    expect(screen.getByText(/pending.*2/i)).toBeVisible();
    expect(screen.getByText(/sold.*1/i)).toBeVisible();
  });

  it('AT-12: shows a loading indicator while inventory is loading', () => {
    mockResult({ isLoading: true });
    render(<InventoryPage />);

    expect(screen.getByRole('status', { name: 'Loading inventory' })).toBeVisible();
  });

  it('AT-13: shows an error message when the request fails', () => {
    mockResult({ error: new Error('boom') });
    render(<InventoryPage />);

    expect(screen.getByRole('alert')).toBeVisible();
  });
});
```

- [ ] **Step 2: Run the tests, verify they fail**

Run:
```
npx vitest run src/features/inventory/InventoryPage.test.tsx
```
Expected: FAIL — `Cannot find module './InventoryPage'`.

- [ ] **Step 3: Implement `InventoryPage`**

`src/features/inventory/InventoryPage.tsx`:
```tsx
import { useGetInventory } from '@/api/generated/store/store';

const STATUSES = ['available', 'pending', 'sold'] as const;

export function InventoryPage() {
  const { data, isLoading, error } = useGetInventory();

  if (isLoading) {
    return (
      <p role="status" aria-label="Loading inventory">
        Loading inventory…
      </p>
    );
  }
  if (error) {
    return <p role="alert">Failed to load inventory.</p>;
  }

  return (
    <ul>
      {STATUSES.map((status) => (
        <li key={status}>
          {status}: {data?.[status] ?? 0}
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 4: Run the tests, verify they pass**

Run:
```
npx vitest run src/features/inventory/InventoryPage.test.tsx
```
Expected: PASS, all 3 tests green.

- [ ] **Step 5: Wire `InventoryPage` into the `/inventory` route**

In `src/App.tsx`, add the import and replace the `/inventory` route's placeholder:
```tsx
import { InventoryPage } from '@/features/inventory/InventoryPage';
```
```tsx
<Route path="/inventory" element={<InventoryPage />} />
```

- [ ] **Step 6: Verify the production build**

Run:
```
npm run build
```
Expected: PASS.

- [ ] **Step 7: Run the inventory acceptance scenarios**

Run:
```
npx bddgen && npx playwright test --grep @inventory
```
Expected: PASS (AT-11..AT-13 green).

- [ ] **Step 8: Commit**

```bash
git add src/App.tsx src/features/inventory/InventoryPage.tsx src/features/inventory/InventoryPage.test.tsx
git commit -m "feat: add store inventory page (AT-11..AT-13 green)"
```

---

### Task 6: Full-suite verification

**Files:** none (verification only).

**Interfaces:** Consumes everything from Tasks 1-5.

- [ ] **Step 1: Run the full unit-test suite**

Run:
```
npm test
```
Expected: PASS — all Vitest suites green (`NavBar`, `PetListPage`, `PetDetailPage`, `InventoryPage`).

- [ ] **Step 2: Run the full acceptance suite**

Run:
```
npm run test:acceptance
```
Expected: PASS — all 14 scenarios (AT-1..AT-14) across the 4 feature files green.

- [ ] **Step 3: Run lint and the production build**

Run:
```
npm run lint
npm run build
```
Expected: both PASS.

- [ ] **Step 4: No commit needed**

This task makes no file changes — it only confirms Tasks 1-5 together turned every acceptance
scenario green. If any step surfaces a regression, fix it within the relevant earlier task and re-run
before considering this plan complete.
