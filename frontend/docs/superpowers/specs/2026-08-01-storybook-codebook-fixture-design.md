# Storybook + `Widgets` fixture test bed for `codebook-page`

**Date:** 2026-08-01
**Status:** Implemented (with one deviation — see Implementation note)

> **Implementation note (2026-08-01):** The story-as-test toolchain in the
> "Toolchain + CI" section did not survive contact with this stack. Storybook
> installed as **v10.5.5** (not 9), and its Vitest-addon browser runner fails
> on Vitest 4 / Vite 8 (a CJS/ESM interop bug: `@storybook/test` →
> `aria-query` `elementRoles`). The named fallback `@storybook/test-runner`
> was also passed over. **Final approach:** the stories are **visual dev docs
> only (no `play()`)**, and CI enforcement moved to a colocated
> `WidgetsCodebook.test.tsx` (Vitest + React Testing Library, jsdom) that
> renders the same `WidgetsCodebook` fixture and asserts the nine flows. It
> runs in the existing `test:unit` job — no `test:storybook` script and no
> `ci.yml` change. Everything else below (fixture placement, Approach C data
> layer, story matrix, provider harness) shipped as written.
**Author:** brainstormed with Claude

## Problem

`shared/ui/codebook-page` is a generic compound component (`Codebook.Root /
Toolbar / Table / Pager / FormModal / Field`, plus `useDefaultActionsColumn`
and `createViewStore`). Consumers inject a `CodebookHooks<T>` object
(client- or server-mode) wrapping TanStack Query, plus `permissions`, a zod
`schema`, columns, and form fields.

It has three real consumers today — `entities/company`, `entities/country`,
`entities/equipment` — but **no single consumer exercises all of its
states** (both list modes, loading/empty/error, permission-gated controls,
full CRUD) in one controlled place. As the component evolves, regressions in
those states can slip through because nothing pins them down.

## Goal

A fake, dev-only `Widgets` codebook that acts as a **CI-enforced living test
bed**: Storybook stories that double as interaction tests (`play()`
assertions) run in CI, so a regression in `codebook-page` fails the build.
Secondary benefit: the stories are living visual documentation of every
supported state.

## Non-goals

- Not a real domain entity. It must never live in `entities/` or ship in the
  app bundle.
- Not a test of the HTTP/axios/normalize layer. That plumbing lives in each
  real entity's `api/` segment, **not** in `codebook-page`, so it is out of
  scope for this test bed. (This is why we do not use MSW here — see
  "Approach".)
- Not a rework of `codebook-page` itself. Where the fixture surfaces a gap
  (e.g. list-error handling), it documents current behavior and files a
  follow-up rather than fixing it inline.

## Approach: in-memory store + real QueryClient

Considered three ways to feed the injected `CodebookHooks<T>`:

- **A — MSW-backed real hooks.** Highest fidelity, reuses the existing MSW
  dep, but exercises axios/HTTP plumbing that is *not part of*
  `codebook-page`, and adds MSW-in-Storybook wiring.
- **B — hand-rolled fake hooks** returning static `UseQueryResult`-shaped
  objects. Simplest, but fakes TanStack Query's real behavior (mutation →
  invalidation → refetch, `isFetching` transitions), so the fixture could
  stay green while real query wiring in `Root` breaks. Lowest fidelity.
- **C — in-memory store + real QueryClient (chosen).** Fixture hooks are
  *real* `useQuery`/`useMutation`, but `queryFn`/`mutationFn` read/write an
  in-memory array instead of the network. Real query lifecycle (loading →
  success, `isFetching` on refetch, mutation → `invalidateQueries` →
  refetch) with the least machinery, and it tests exactly the component's
  actual contract — nothing extra.

## FSD placement

The fixture lives inside the SUT's own folder so component and test bed
travel together. Nothing here is exported from `index.ts`, so it stays out
of the public API and the app bundle (no app code imports it). `shared →
shared` imports (rbac, i18n) are allowed and already used by the component.

```
src/shared/ui/codebook-page/
  __fixtures__/widget/
    types.ts          # Widget = { id, name, category, active, quantity }
    schema.ts         # zod widgetSchema (drives the form + validation)
    store.ts          # in-memory CRUD store: seed[], list/create/update/delete
    hooks.ts          # createWidgetHooks({ mode, latencyMs, failList, seed }) -> CodebookHooks<Widget>
    permissions.ts    # buildWidgetPermissions() variants (full / read-only / status-locked)
  __stories__/
    CodebookPage.stories.tsx   # composed page + all variants + play() assertions
    decorators.tsx             # provider harness
```

The `Widget` type is deliberately richer than any real entity — text
(`name`), a filterable enum (`category`), a boolean render (`active`), and a
number (`quantity`) — so one fixture exercises every column / field / form
control shape the generic component supports.

## Data layer

- `store.ts` holds a mutable seed array and pure CRUD functions returning
  clones.
- `createWidgetHooks(config)` returns a real `CodebookHooks<Widget>`:
  - `useList` — real `useQuery`; `queryFn` reads the store after `latencyMs`
    (or throws if `failList`).
  - `useCreate/useUpdate/useDelete` — real `useMutation`s that mutate the
    store and `invalidateQueries`, so mutation → invalidation → refetch is
    genuinely exercised.
- A **factory** (not a static object) lets each story inject its own timing,
  error, and seed, and pair with its own `QueryClient` (`retry: false`) for
  deterministic states.
- Both `mode: 'client'` and `mode: 'server'` variants are produced from the
  same store to cover both branches of `Root`.

## Story matrix (CI-enforced)

Each story renders the composed `Widgets` page and carries a `play()` that
drives it with `userEvent` and asserts with `@storybook/test`'s `expect`.

| Story | What it proves | Key assertion |
|---|---|---|
| `ClientMode` | client branch: full list, antd local paging/sort | rows render, sorter works locally |
| `ServerMode` | server branch: `ListParams` -> refetch on page/sort | page change triggers refetch with new params |
| `Loading` | `latencyMs` set | skeleton/spinner visible before data |
| `Empty` | empty seed | antd empty state renders |
| `ListError` | `failList` | documents current behavior (see note) |
| `CreateFlow` | modal -> fill -> submit -> invalidate -> refetch | new row appears, "Created" message |
| `EditFlow` | edit existing -> submit | row reflects update |
| `DeleteFlow` | delete + Popconfirm | row disappears |
| `PermissionGated` | seeded read-only / status-locked rules | create hidden/disabled; edit/delete show `reason` tooltip |

**Note on `ListError`:** `Root` currently passes `isLoading`/`isFetching`
into context but **not** `isError` (`Root.tsx:129-157`). A list error
therefore likely renders as a permanent empty/loading state rather than an
error UI. The `ListError` story asserts whatever the component actually does
today, and the gap is filed as a **follow-up**, not fixed inside this task —
the test bed doing its job on day one.

## Provider harness (`decorators.tsx`)

Lighter than usual because i18n and rbac need no React providers:

- `QueryClientProvider` with a fresh per-story client (`retry: false`).
- antd `<App>` wrapper so `message.success` in `Root.submit/remove` has
  context.
- rbac seeding: a decorator calls `useAbilityStore.setState({ rules })`
  before render and resets after, per story, so permission stories are
  deterministic and do not leak state between stories.

`useLocalization` is a standalone hook with key-fallback (missing keys render
as the key), so no i18n setup is required; the fixture may use literal
strings or `codebook.*` keys.

## Toolchain + CI

- **Storybook 9** with `@storybook/react-vite` (matches Vite 8 / React 19).
- **Story-as-test in CI** via `@storybook/addon-vitest`, running `play()`
  functions through the project's existing **Vitest** in **Playwright
  browser mode** (Playwright is already a dependency). New `test:storybook`
  script, added as a CI step alongside the existing `check` / `test:unit`
  jobs in `.github/workflows/ci.yml`.

### Risk: bleeding-edge toolchain

The stack is very new — **Vitest 4 + Vite 8 + React 19**. The Storybook
Vitest addon may not yet support Vitest 4.

**Mitigation / fallback:** try `@storybook/addon-vitest` first; if there is
version friction, fall back to `@storybook/test-runner` (Playwright-based,
runs `play()` against a built Storybook), which is far more version-tolerant.
Either path satisfies "regressions fail the build." The chosen path and the
reason are to be recorded in the implementation plan.

## Success criteria

1. `npm run storybook` opens a `Widgets` codebook demonstrating every state
   in the matrix.
2. All stories carry `play()` assertions.
3. A single command (`test:storybook`) runs those assertions headlessly and
   fails on any regression.
4. That command runs in CI on every PR.
5. Nothing in `__fixtures__` / `__stories__` is reachable from app code or
   the production bundle.
6. `steiger ./src` and `tsc -b` stay green with the fixture present.

## Follow-ups (out of scope here)

- `Root` does not propagate `isError` to the table context — decide whether
  list errors should render an error state, and wire it if so.
