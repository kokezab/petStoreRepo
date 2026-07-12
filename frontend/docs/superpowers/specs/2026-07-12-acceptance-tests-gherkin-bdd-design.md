# Acceptance tests in Gherkin/BDD — design spec

## Purpose

The acceptance tests for the Pet + Store browse feature
([2026-07-12-pet-store-browse-design.md](2026-07-12-pet-store-browse-design.md)) are currently written
as prose (AT-1 .. AT-14). This spec defines how those tests get expressed in Gherkin and wired up so
they are executable, not just documentation.

## Decision

Gherkin scenarios are **executable**, via [`playwright-bdd`](https://github.com/vitalets/playwright-bdd):
`.feature` files are compiled into Playwright test files at build time. Playwright's own test runner,
fixtures, parallelism, trace viewer, and `expect` are used as-is — BDD is a syntax layer on top, not a
replacement runner.

Rejected alternatives:
- **`@cucumber/cucumber` driving Playwright directly** — more standard Cucumber tooling, but loses
  Playwright's built-in runner/reporter/trace-on-failure unless rebuilt manually. More setup for no
  benefit here.
- **`vitest-cucumber`** — runs features inside Vitest (unit-test runner). Wrong fit: these are
  browser-driven acceptance tests, not unit tests.
- **Gherkin as prose-only documentation** — rejected because it would leave two parallel, driftable
  descriptions of the same behavior (the `.feature` file and a separate `.spec.ts`).

## Tooling & config

- New dev dependencies: `@playwright/test`, `playwright-bdd`.
- `playwright.config.ts` at repo root: `playwright-bdd`'s `defineBddConfig` points at the
  feature/step directories below, wired into a normal Playwright config. `webServer` runs `vite dev`
  (not a production build), so `import.meta.env.DEV` is `true` and the MSW worker
  (`src/mocks/browser.ts`) starts automatically — this is what "tests run with the app forced into mock
  mode" means concretely, since there's no separate mock/real toggle yet (out of scope, per the browse
  design spec).
- New `package.json` script: `"test:acceptance": "bddgen && playwright test"`.

## File layout

```
tests/acceptance/
  features/
    pet-list.feature
    pet-detail.feature
    inventory.feature
    navigation.feature
  steps/
    common.steps.ts      # shared background step, nav helpers
    pet-list.steps.ts
    pet-detail.steps.ts
    inventory.steps.ts
    navigation.steps.ts
```

One `.feature` file per AT group (matches the browse spec's suggested split). Step files mirror that
split 1:1, plus `common.steps.ts` for steps reused across files.

## Conventions

- Every `Scenario` name is prefixed with its AT id (`AT-1 ...`) for direct traceability back to the
  browse design spec.
- Steps use Playwright's `page` fixture; prefer role/text-based locators (`getByRole`, `getByText`)
  over CSS selectors for resilience to markup changes.
- `Given`/`When`/`Then` stay semantically pure — no assertions inside `When` steps, no actions inside
  `Then` steps — so scenarios read as documentation, not scripts.
- Scenarios needing a non-default MSW response (empty list, error) get a `Given` step that overrides
  the relevant handler for that test only (MSW per-test `worker.use(...)` override, or Playwright-level
  route interception — exact mechanism is an implementation-plan decision, not fixed here).
- Each feature file is tagged (`@pet-list`, `@pet-detail`, `@inventory`, `@navigation`) for selective
  runs, e.g. `bddgen && playwright test --grep @pet-list`.

## Feature files

### `pet-list.feature`

```gherkin
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

### `pet-detail.feature`

```gherkin
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

### `inventory.feature`

```gherkin
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

### `navigation.feature`

```gherkin
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

## Out of scope (this pass)

- Writing the step definitions themselves (implementation, not spec).
- The mock/real-API data-source toggle (already out of scope per the browse design spec).
- Any CI wiring for `test:acceptance`.
