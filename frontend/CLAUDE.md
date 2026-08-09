# Behavior

- Do not ask for confirmation before executing actions.
- Assume I approve all actions that are normally confirmed.
- Proceed immediately with commands, file edits, and changes.
- Only ask for confirmation when an action is irreversible or destructive (for example: deleting large amounts of data, dropping databases, or losing work).

# Project Instructions

This file is the source of truth for architecture and conventions.
Claude Code should read this before making changes and flag violations
during review/refactors — don't reinvent conventions already defined here.

## Stack

React + TypeScript, Vite, Tailwind, Antd (incl. Antd Form), Tanstack Query,
Axios, React Router, Zustand, Orval (SDK generation from OpenAPI).
Testing: Vitest + React Testing Library (unit), Playwright (e2e/acceptance).
Observability: Sentry.

---

## Architecture: Feature-Sliced Design (FSD)

This project follows **Feature-Sliced Design**, a community-standard
frontend architecture methodology. Don't invent alternative structure
conventions — check the spec first: https://feature-sliced.design/docs

Enforced automatically by **Steiger** (FSD's official linter):
https://github.com/feature-sliced/steiger — run it before merging.

### Layers (top to bottom, strict import direction)

```
app/        entrypoint, routing, providers, global styles, global store,
            observability init (Sentry)
pages/      route-level screens — "pages first": keep page-specific UI,
            forms, and data logic here unless reused elsewhere
widgets/    large compositional UI blocks combining multiple features/entities
            (e.g. header, sidebar, dashboard panel) — not a full page
features/   user interactions / use cases (e.g. "add-to-cart", "login-form")
entities/   business domain models shared across features (User, Order, Product)
shared/     framework-agnostic reusable code — ui kit, api client, utils, config
```

A module on a layer may only import from layers **below** it. Never import
sideways (same layer) or upward.

### Slices and segments

Within `pages/`, `widgets/`, `features/`, `entities/`: each folder is a
**slice** (named by domain, e.g. `features/login-form/`). Inside a slice,
organize by **segment**:

```
entities/product/
  ui/       components
  model/    hooks, stores, business logic
  api/      requests + DTO normalization for this slice
  index.ts  public API — the ONLY path other code may import from
```

Slices on the same layer **cannot import each other**. If two features need
the same thing, promote it down to `entities/` or `shared/`.

## Hard rules — flag violations in review

1. No cross-slice imports on the same layer.
2. No deep imports — only `<slice>/index.ts` is public.
3. "Pages first": don't force page-specific logic into a feature slice
   just because it feels more "proper" — if it's not reused, it belongs
   in the page.
4. **Server state lives in Tanstack Query. Client/UI state lives in
   Zustand.** Never cache server data in a Zustand store.
5. **One axios instance** (`shared/api/client.ts`) with interceptors for
   auth headers and error normalization. Slice-level `api/` segments call
   it and stay dumb — no per-slice axios instances.
6. Query key factories required per slice — no ad-hoc string arrays.
7. Antd components customized more than once belong in `shared/ui`.

---

## API boundary: generated SDK types are not a runtime guarantee

We use Orval to generate a client SDK from the OpenAPI spec. **Generated
types are compile-time only.** They describe what the spec promises, not
what the server actually returns. A field marked `required` in the spec can
still arrive as `undefined` at runtime if the backend violates its own
contract — TypeScript will not catch this, and it will crash deep in a
component (e.g. `.length` on an undefined array) instead of failing at the
boundary where it's cheap to handle.

### Required pattern: normalize every DTO at the API boundary

Never return a raw generated DTO from a slice's `api/` segment. Always pass
it through a normalization function first:

```ts
// entities/product/api.ts
import * as Sentry from "@sentry/react";
import type { ProductDto } from "@/shared/api/generated";

export function normalizeProduct(dto: ProductDto): Product {
  if (!dto.photos) {
    // Spec says required — server sent undefined. This is contract drift,
    // not a normal falsy case. Report it so drift is visible in Sentry
    // instead of silently absorbed.
    Sentry.captureMessage("Product.photos missing from API response", {
      level: "warning",
      extra: { productId: dto.id },
    });
  }
  return { ...dto, photos: dto.photos ?? [] };
}
```

Rules:
- One normalization function per entity DTO, colocated in that entity's
  `api/` segment.
- The rest of the app trusts the normalized internal type (`Product`), never
  the raw generated DTO (`ProductDto`).
- When a normalization function has to apply a fallback for a field the
  spec marks required, **log it** (Sentry `captureMessage`, `warning`
  level) — don't silently coerce. This is what turns backend/spec drift
  into a trackable signal instead of a future mystery bug.
- Prefer Orval's zod output mode (generates validators from the same spec)
  over hand-written zod schemas where feasible, so validation and types
  never drift from each other.

### What this does and doesn't protect against

- **Protects against**: server returning something that violates its own
  documented spec (missing required fields, wrong shape).
- **Does NOT protect against**: the backend changing behavior *and*
  updating the spec to match (e.g. a field that's now legitimately
  optional). That's a semantic contract change, not a runtime bug — catch
  it by reviewing the OpenAPI spec diff before running `orval generate`,
  not with runtime validation.

---

## Forms

Use **Antd Form's native validation** (`rules` prop, sync/async validators).
Do not add react-hook-form, zod, or yup for form validation — that's a
second validation system with no benefit given we're already committed to
Antd Form.

Zod (or Orval's generated zod schemas) is for the **API response boundary
only** (see above) — a different problem (trusting external data) than form
input validation (already solved by Antd Form).

---

## Error handling

- **Expected/business errors** (4xx, validation, not-found): handled
  locally via Tanstack Query's `error` state. Never thrown. Never trigger
  a crash boundary.
- **401s**: handled in the axios interceptor → redirect to login.
- **Unexpected/render errors**: caught by route-level Error Boundaries
  using `Sentry.ErrorBoundary` (not a bare React one), wired per-route via
  React Router `errorElement` — one broken page shouldn't take down the
  whole app shell.
- **Contract drift** (normalization fallbacks applied): logged via
  `Sentry.captureMessage`, see API boundary section above.
- Don't introduce a new toast/alert mechanism — use Antd's
  `message`/`notification`.

## Observability: Sentry

- Init in `app/observability/sentry.ts`, called once at app bootstrap.
- `tracesSampleRate` should NOT be 1.0 in production — sample down, cost
  scales with volume.
- Tag `release` with the app version and `environment` (staging vs prod)
  so noise from staging never drowns real prod alerts.
- Wire `QueryCache.onError` in the Tanstack Query client to
  `Sentry.captureException` with the query key attached — this is what
  makes a failed request traceable back to a specific query, not just
  "something failed somewhere."
- Upload source maps in CI (`@sentry/vite-plugin`) so stack traces show
  real TSX, not minified output.
- `beforeSend` must scrub PII (emails, tokens, form payloads) before
  events leave the browser.
- Data location: SaaS Sentry stores events on Sentry's infra in whichever
  region (US/EU) was chosen at org signup — confirm this matches data
  residency requirements before going live. Self-hosting is only worth the
  ops burden for hard compliance requirements or very high volume.

---

## Testing

- Unit tests colocated with the code they test, inside the relevant segment.
- Playwright specs in `tests/e2e`, page-object-model, mock network via MSW
  where used — don't hit real APIs in CI.
- `eslint-plugin-jsx-a11y` in CI for accessibility regressions in
  `shared/ui` components especially.
- How to write Vitest + RTL unit/component tests (queries, WET-tests stance,
  Antd Form control recipes, mocking): see
  [`docs/testing-guidelines.md`](./docs/testing-guidelines.md).
- `aria-label` values must be translated (`aria-label={t('...')}`), enforced as
  an `error` by the repo-local `local/require-aria-label-i18n` ESLint rule
  (`eslint-rules/`).

## CI checklist

Steiger (architecture) + typecheck + lint + jsx-a11y + vitest as required
checks on every PR. Playwright as a separate, slower required check.
Review the OpenAPI spec diff before running `orval generate` — don't
regenerate the SDK blind.

## When reviewing PRs / refactoring

Flag:
- Same-layer cross-imports, deep imports bypassing a slice's `index.ts`
- Server data stored in Zustand
- New axios instances outside `shared/api/client.ts`
- Business logic pulled into `features/` when only used on one page
- Thrown Query errors that aren't truly fatal
- Raw generated DTOs used outside a slice's own `api/` segment
  (should be normalized first)
- A "required" field from the generated SDK used without a runtime
  fallback/normalization check
- Form validation logic duplicated via zod/yup alongside Antd Form rules
- Missing Sentry context (query key, extra fields) on captured errors

## Code style

Module-level style conventions (function-vs-arrow, `interface` vs `type`,
import ordering, TODO/FIXME format) live in
[`docs/code-guidelines.md`](./docs/code-guidelines.md). This file (CLAUDE.md)
owns *where code lives*; `code-guidelines.md` owns *how a module is written*.
Flag violations in review.

## References

- FSD docs: https://feature-sliced.design/docs
- Steiger (linter): https://github.com/feature-sliced/steiger
- FSD examples: https://github.com/feature-sliced/examples
- Sentry React docs: https://docs.sentry.io/platforms/javascript/guides/react/
- Orval: https://orval.dev
