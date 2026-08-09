# Testing guidelines

How we write unit/component tests with **Vitest + React Testing Library**. For
Playwright acceptance tests see `tests/acceptance`; this doc is about the
colocated unit layer. Distilled from playtomic-admin's testing docs and adapted
to this repo's stack.

- [Toolchain & layout](#toolchain--layout)
- [What to test](#what-to-test)
- [WET tests, DRY code](#wet-tests-dry-code)
- [Mocking is not the default](#mocking-is-not-the-default)
- [Queries](#queries)
- [Zero-warning policy](#zero-warning-policy)
- [Testing Antd Form controls](#testing-antd-form-controls)
- [Parametrized tests](#parametrized-tests)
- [Mocking a hook or nested component](#mocking-a-hook-or-nested-component)

## Toolchain & layout

- **Vitest** with `globals: true` — `describe`/`it`/`expect`/`vi` are available
  without importing (importing them explicitly is fine too; both styles exist).
- **`@testing-library/react`** + `@testing-library/user-event`, jsdom
  environment. `jest-dom` matchers are wired in `src/test/setup.ts`.
- **Colocate** tests next to the code: `Foo.tsx` → `Foo.test.tsx` in the same
  folder, inside the relevant FSD segment.
- **i18n runs for real in tests.** `src/test/setup.ts` initializes i18next with
  the actual `public/locales/en/translation.json`, so `t('some.key')` renders
  the real English string. That means you query by the **resolved text**
  (`getByRole('button', { name: 'Create order' })`), not by the key. Add the
  key to the English catalog when you add UI that references it, or the test
  sees an empty label.

## What to test

Test virtually everything, but be smart about the level:

- **Small pure units** (hooks, utils, reducers, selectors, permission builders):
  cheap and precise — test them thoroughly, including edge cases. Once tested,
  you can trust them when they appear inside bigger tests.
- **Components**: don't assert the entire render tree. Assert the parts that
  matter — what the user can read, and how the UI reacts to their input
  (typing, clicking). One component test exercises many moving parts at once.

Aim for a balance between the two rather than only one or the other.

## WET tests, DRY code

This is a deliberate inversion of the [WET-before-DRY rule for production
code](./code-guidelines.md#abstraction--duplication):

- Keep each test's fixtures, mocks, and setup **inside the test function**.
  A reader should understand a test without scrolling to shared helpers at the
  top of the file.
- Prefer duplication over a clever shared harness. Test files get long; when the
  test at the bottom fails, hunting for state defined 300 lines up is a time
  sink. Local and obvious beats DRY and remote.
- There are exceptions (a genuinely shared fixture builder used across many
  files), but they're rare — reach for them only after the duplication actually
  hurts.

## Mocking is not the default

Mocking is fine where it's needed, but a mock-heavy test easily ends up asserting
against its own mocks — testing nothing. Prefer driving the real component and
mocking only at genuine boundaries (network via MSW, or a single collaborator
you're deliberately isolating). See [Mocking a hook or nested
component](#mocking-a-hook-or-nested-component) for when it's warranted.

## Queries

Query the way a user (or assistive tech) finds things — by role and accessible
name first. This also means a passing test doubles as a small accessibility
check.

- **Priority:** `getByRole(role, { name })` → `getByLabelText` (form fields) →
  `getByText` → (last resort) `getByTestId`.
- **`getBy` vs `queryBy` vs `findBy`:**
  - `getBy*` — element must exist now; throws if not (good default).
  - `queryBy*` — returns `null` if absent; use it to assert **absence**
    (`expect(queryByText(...)).not.toBeInTheDocument()`).
  - `findBy*` — async, retries until it appears; use it for anything that
    resolves after an interaction or a query settling.
- **`findBy*` also clears most `act(...)` warnings.** If a `userEvent` call
  triggers a state update and you still get an act warning, switch the following
  `getBy*` to `await findBy*`:

  ```ts
  await user.hover(trigger);
  const tip = await screen.findByText('Tooltip text'); // not getByText
  ```

- **Always `userEvent.setup()`** at the top of the test and `await` every
  interaction:

  ```ts
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: 'Create order' }));
  ```

## Zero-warning policy

Tests must not emit console warnings. The two usual suspects:

- **`act(...)` warning** — a state update wasn't awaited. Fix by `await
  findBy*`-ing the resulting UI (above), not by wrapping things in `act()`.
- **State update on an unmounted component** — an async effect resolved after
  unmount. Guard the effect (e.g. an `ignore` flag flipped in cleanup, or an
  `AbortController`) so it no-ops after unmount.

## Testing Antd Form controls

Antd renders real accessible controls, so query them by role/label and assert on
what the **user sees**. Prefer `toHaveDisplayValue` (what's shown) over
`toHaveValue` (the raw value) where they differ.

| Control | Query | Read value | Change value |
|---|---|---|---|
| Text / password / number input | `getByLabelText('Quantity')` or `getByRole('textbox', { name })` | `toHaveDisplayValue('2')` | `await user.clear(el); await user.type(el, '2')` |
| Checkbox | `getByRole('checkbox', { name })` | `toBeChecked()` | `await user.click(el)` |
| Radio | `getByRole('radio', { name })` | `toBeChecked()` | `await user.click(el)` |
| Select (antd custom) | `getByLabelText('Status')` | `toHaveTextContent('placed')` | open + pick the option (below) |

- **`type` appends** — call `user.clear(el)` first when replacing a value.
- **Antd `Select`** isn't a native `<select>`. Open it, then click the option
  (options render with a `title`), mirroring the real `CreateOrderForm` test:

  ```ts
  await user.click(screen.getByLabelText('Status'));
  await user.click(await screen.findByTitle('placed'));
  ```

- Give every `Form` and every custom control an **`aria-label`** so it's
  queryable. That label is user-facing, so it must be translated — enforced by
  the `local/require-aria-label-i18n` lint rule (`aria-label={t('...')}`).

Full submit-path example (this repo's `CreateOrderForm.test.tsx`):

```tsx
it('calls onSubmit with form values when submitted', async () => {
  const onSubmit = vi.fn().mockResolvedValue(undefined);
  const user = userEvent.setup();

  render(<CreateOrderForm onSubmit={onSubmit} isLoading={false} />);

  await user.type(screen.getByLabelText('Quantity'), '2');
  await user.click(screen.getByLabelText('Status'));
  await user.click(await screen.findByTitle('placed'));
  await user.click(screen.getByRole('button', { name: 'Create order' }));

  await waitFor(() => {
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ quantity: 2, status: 'placed' }),
    );
  });
});
```

## Parametrized tests

When the same test body repeats with different data, use `it.each` instead of
copy-pasting — one body, a table of cases:

```tsx
it.each([
  ['available', /available/i],
  ['pending', /pending/i],
  ['sold', /sold/i],
])('renders the %s status', (status, label) => {
  render(<PetStatusTag status={status} />);
  expect(screen.getByText(label)).toBeInTheDocument();
});
```

## Mocking a hook or nested component

Warranted when you want to test **one layer in isolation** — a wrapper's extra
behavior, or a component whose branch depends on a hook's return — without
implicitly testing the thing underneath.

```tsx
// Isolate the component from a hook it depends on.
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

import { useCurrentUser } from '@/entities/user';
import { UserGreeting } from './UserGreeting';

vi.mock('@/entities/user', () => ({ useCurrentUser: vi.fn() }));

it('greets the signed-in user', () => {
  vi.mocked(useCurrentUser).mockReturnValue({ name: 'Ada' });

  render(<UserGreeting />);

  expect(screen.getByText('Hello, Ada')).toBeInTheDocument();
});
```

Keep mocks at real seams (a slice's public API, the network). Mocking deep
internals couples the test to implementation and defeats the purpose.
