# Pet + Store browse — design spec

## Purpose

Extend the existing Petstore demo app (orval-generated react-query hooks + axios + MSW) into a small
read-only browsing experience covering the `pet` and `store` API tag groups. Built via
acceptance-test-driven development: the acceptance tests below are written first (and must fail),
then implementation follows until each passes.

## Scope

- Read-only. No create/update/delete flows.
- Covers `pet` (list by status, get by id) and `store` (get inventory) endpoints.
- Data source (MSW mock vs. real `https://petstore.swagger.io/v2`) is toggle-able in the app, but the
  toggle mechanism itself is not covered by this acceptance test pass — tests run with the app forced
  into mock mode for determinism.

## App structure

- Routing via `react-router` (new dependency).
- Routes:
  - `/pets` — default landing page. Pet list with a status filter (available / pending / sold,
    defaulting to available). Each pet card links to its detail page.
  - `/pets/:id` — pet detail: name, status, category, photo, tags. Link back to the list.
  - `/inventory` — store inventory: pet counts grouped by status, from `GET /store/inventory`.
- A persistent top nav present on every page, linking to "Pets" and "Inventory".

## Acceptance tests

Playwright, run against MSW-mocked data for determinism. One spec file per feature area is fine
(`pet-list.spec.ts`, `pet-detail.spec.ts`, `inventory.spec.ts`, `navigation.spec.ts`), or a single
suite — left to the implementation plan.

### Pet list

1. **AT-1** — App loads at `/pets` → available pets are listed by name (default filter).
2. **AT-2** — Selecting the "pending" filter → list updates to show only pending pets.
3. **AT-3** — Selecting the "sold" filter → list updates to show only sold pets.
4. **AT-4** — While pet data is loading → a loading indicator is shown.
5. **AT-5** — A filter with zero matches → an empty-state message is shown.
6. **AT-6** — Pet list request fails → an error message is shown, not a blank page.

### Pet detail

7. **AT-7** — Clicking a pet card → navigates to that pet's detail page, showing
   name/status/category/photo/tags.
8. **AT-8** — Direct navigation to `/pets/:id` (deep link) → correct pet detail loads.
9. **AT-9** — Navigating to `/pets/:id` for a nonexistent id → "pet not found" message, no crash.
10. **AT-10** — Clicking "back to list" on the detail page → returns to the pet list.

### Store inventory

11. **AT-11** — Navigating to `/inventory` → pet counts grouped by status (available/pending/sold)
    are shown.
12. **AT-12** — While inventory data is loading → a loading indicator is shown.
13. **AT-13** — Inventory request fails → an error message is shown, not a blank page.

### Navigation

14. **AT-14** — Clicking "Pets"/"Inventory" nav links from anywhere → routes to the corresponding
    page.

## Out of scope (this pass)

- Create/update/delete for pets or orders.
- Testing the mock/real-API data-source toggle itself.
- Active-nav-item highlighting.
- Accessibility audit beyond what's incidentally covered.
