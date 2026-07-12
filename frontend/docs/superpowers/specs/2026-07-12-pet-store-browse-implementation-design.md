# Pet + Store browse — implementation design

## Purpose

Implement the Pets/Inventory browsing UI specified in
`docs/superpowers/specs/2026-07-12-pet-store-browse-design.md`, driving the work with the 14 red
acceptance scenarios already merged under `tests/acceptance/` (see
`docs/superpowers/specs/2026-07-12-acceptance-tests-gherkin-bdd-design.md`). This doc covers the
*implementation* architecture — the feature behavior itself is already fully specified by those two
documents and by the accessible-UI contract in
`docs/superpowers/plans/2026-07-12-acceptance-tests-gherkin-bdd.md` (Global Constraints section).

## Process: double-loop ATDD

- **Outer loop** — the existing Playwright-bdd acceptance suite (`npm run test:acceptance`). Each of
  the 14 ATs is the pass/fail gate; they are not modified by this work except as noted in the "existing
  fixes" callout below.
- **Inner loop** — classic TDD (Vitest + React Testing Library) for each component/behavior as it's
  built, one AT-cluster at a time. No production code is written without a failing RTL test first.

## New dependencies

- Runtime: `react-router` (v7 — compatible with React 19; used as a plain declarative router, not its
  data-loader APIs, since data fetching stays on the existing react-query hooks).
- Dev/test: `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`,
  `jsdom`.
- New `package.json` script: `"test": "vitest run"` (and `"test:watch": "vitest"` for local dev).

## Data layer

No new API code. Reuse existing orval-generated react-query hooks as-is:
- `useFindPetsByStatus` (`src/api/generated/pet/pet.ts`) — pet list, status filter.
- `useGetPetById` (`src/api/generated/pet/pet.ts`) — pet detail.
- `useGetInventory` (`src/api/generated/store/store.ts`) — inventory counts.

Each page component calls its hook directly — no intermediate `usePetList`-style wrapper, since the
generated hook already *is* the abstraction; a wrapper would add indirection without hiding anything.

## File structure

```
src/
  features/
    navigation/
      NavBar.tsx
      NavBar.test.tsx
    pets/
      PetListPage.tsx
      PetListPage.test.tsx
      PetDetailPage.tsx
      PetDetailPage.test.tsx
    inventory/
      InventoryPage.tsx
      InventoryPage.test.tsx
  App.tsx                 -- becomes route wiring + layout only
  test/
    setup.ts              -- jest-dom matchers, RTL cleanup
vitest.config.ts
```

`App.tsx` renders `<BrowserRouter>` containing a shared layout (`NavBar` + `<Outlet/>`-style routed
content) with routes:
- `/pets` → `PetListPage`
- `/pets/:id` → `PetDetailPage`
- `/inventory` → `InventoryPage`
- default redirect `/` → `/pets` (implied by AT-1 always testing `/pets` directly; no acceptance
  scenario exercises `/`, so the redirect is a reasonable default, not a tested contract)

## Component responsibilities (mapped to the accessible-UI contract)

- **NavBar** — `<nav>` landmark with `"Pets"` / `"Inventory"` links. (AT-14)
- **PetListPage** — `role="combobox"` named `"Status filter"` (`available`/`pending`/`sold`,
  defaulting to `available` on mount with no interaction); `role="list"` named `"Pets"` of
  `role="listitem"` → `role="link"` named per pet; `role="status"` named `"Loading pets"` while
  `isLoading`; `"No pets found"` text when the resolved list is empty; `role="alert"` on error.
  (AT-1..6)
- **PetDetailPage** — `<h1>` named with pet name; visible status/category text; `role="img"` named
  with pet name; tag names as visible text; `"Back to list"` link to `/pets`; `"pet not found"` text
  (case-insensitive) when `useGetPetById` 404s. (AT-7..10)
- **InventoryPage** — counts grouped by status as visible text; `role="status"` named
  `"Loading inventory"` while loading; `role="alert"` on error. (AT-11..13)

Styling: minimal/semantic only — the acceptance contract asserts roles/names/text, not visual
appearance, so no separate visual-design pass is in scope here.

## Build order

Mirrors how the acceptance tests themselves were layered, so each slice closes a contiguous AT range
before moving to the next:

1. Router shell + `NavBar` → AT-14 green.
2. `PetListPage` (filter, list, loading/empty/error) → AT-1..6 green.
3. `PetDetailPage` → AT-7..10 green.
4. `InventoryPage` → AT-11..13 green.

Each step: write failing RTL test(s) for the component → implement → RTL green → run the matching
`--grep @tag` acceptance slice → AT(s) green → move on. Full suite (`npm run test:acceptance` and
`npm test`) is verified at the end.

## Out of scope (unchanged from the feature spec)

- Create/update/delete flows for pets or orders.
- The mock/real-API data-source toggle.
- Active-nav-item highlighting.
- Visual design polish beyond minimal semantic styling.
- Accessibility audit beyond what the acceptance contract already covers.
