# Code Review — Frontend (whole project)

**Date:** 2026-08-09
**Reviewer:** Claude (Opus 4.8)
**Scope:** Entire `src/` tree reviewed against `CLAUDE.md` (FSD + project conventions) and general quality.
**Branch:** `main` @ `b58f9b3`

---

## Verdict

Healthy, well-architected codebase. **All automated gates pass** and the hard architectural
rules in `CLAUDE.md` are largely honored with genuine care. The findings below are dominated by
**two secrets-in-VCS issues** (fix first) plus a handful of documentation/convention drifts —
none of them structural.

### Gate results (evidence)

| Gate | Command | Result |
|------|---------|--------|
| TypeScript | `tsc -b` | ✅ exit 0 |
| ESLint | `eslint .` | ✅ exit 0 |
| FSD architecture | `steiger ./src` | ✅ "No problems found!" |
| Unit tests | `vitest run` | ✅ 91 passed / 91 (24 files) |

Not run in this review: Playwright e2e (`test:e2e`), production build, Storybook build.

---

## Findings (ranked by severity)

### 🔴 HIGH-1 — Hardcoded Keycloak JWT committed in source
> **Status (2026-08-09): code portion FIXED, secret still live.** The literal was removed from
> `src/shared/api/client.ts`; the token now comes from `config.tracerDevToken`
> (`VITE_TRACER_DEV_TOKEN`, backed by the gitignored `.env.local`). `git grep` confirms no token
> in tracked source; `tsc`/`eslint` green. **STILL OWED — outside code:** (1) rotate/invalidate the
> token on the Keycloak TRACER realm (treat as compromised), (2) purge it from git history (present
> in `698e5cc` onward) via history rewrite + force-push, or accept it stays in history and rely on
> rotation. Both require the user's explicit go-ahead.

**File:** `src/shared/api/client.ts:16-17` (also in git history — introduced `698e5cc`)

A full Keycloak bearer token (`TRACER_DEV_TOKEN`) is hardcoded and attached to every Tracer
request by the request interceptor. It is flagged with a `TODO`, but it is a real, currently-valid
token (`exp` ≈ Oct 2026) living in version control and in history.

- **Risk:** anyone with repo access holds a working token for the TRACER realm; the payload also
  embeds PII (name, phone, email of the test user).
- **Fix:** remove the literal; source the token from an auth store / silent refresh (as the TODO
  intends). Rotate/invalidate the leaked token. Because it is in history, scrubbing requires
  history rewrite *or* — more pragmatically — treat it as compromised and rotate on the Keycloak side.

### 🔴 HIGH-2 — `.env` is tracked by git
> **Status (2026-08-09): FIXED.** `git rm --cached .env` (working copy kept), and `.env` added to
> `.gitignore` (with `!.env.example` kept tracked). `git ls-files` now lists only `.env.example`;
> `git check-ignore .env` confirms it's ignored. Note: `.env` held only non-secret base URLs, and it
> remains in history — non-sensitive, so no purge needed.

**Evidence:** `git ls-files` lists `.env` (and `.env.example`). `.gitignore` ignores `*.local`
(covers `.env.local`) but **not** `.env`.

- **Risk:** real local/dev configuration values ship in the repo; future secrets added to `.env`
  would silently be committed.
- **Fix:** `git rm --cached .env`, add `.env` to `.gitignore`, keep only `.env.example` tracked.
  Audit the current `.env` contents for anything sensitive before/after untracking. *(Contents not
  reproduced here deliberately.)*

### 🟡 MEDIUM-1 — Zod used for form validation, contradicting an explicit hard rule
**Files:** `src/shared/lib/zod-antd/zodToAntd.ts`, `src/lib/antd-zod-rules.ts`,
consumed by `src/shared/ui/codebook-page/components/Field.tsx` and
`src/pages/pet-list/ui/AddPetForm/AddPetForm.tsx`; schemas e.g. `entities/company/model/schema.ts`.

`CLAUDE.md` (Forms section) states plainly: *"Do not add react-hook-form, zod, or yup for form
validation… Zod is for the API response boundary only."* The code instead derives Antd Form
`rules` from zod schemas via a `zodToAntd` bridge.

This is a **documentation ↔ implementation divergence on a stated hard rule**, not a bug. The
implementation is actually thoughtful (schemas double as form-value types, messages are i18n keys,
output feeds Antd's *native* `rules`/validator pipeline — no second form-state library). So the
right resolution is a **decision, not a reflexive removal**:
- **Option A (recommended):** update `CLAUDE.md` to sanction the zod→Antd-rules bridge as the
  standard, documenting *why* it's not "a second validation system" (it emits Antd rules).
- **Option B:** honor the rule as written and replace zod schemas with inline Antd `rules`.

Either way, code and doc must stop contradicting each other — a reviewer following `CLAUDE.md`
today would (correctly) flag every form.

### 🟡 MEDIUM-2 — Non-FSD top-level buckets duplicate `shared/`
**Dirs:** `src/components/`, `src/hooks/`, `src/lib/`, `src/api/` (+ `src/config.ts`, `src/mocks/`, `src/test/`).

`CLAUDE.md` defines strict FSD layers (`app / pages / widgets / features / entities / shared`).
Alongside them live parallel catch-all folders that overlap what `shared/` is for:
- `src/components/ImageWithFallback`, `src/components/QueryState` → belong in `shared/ui`
- `src/hooks/useApiError` → `shared/lib`
- `src/lib/*` (query-client, api-error, feature-flags, antd-message-bridge) → `shared/lib`/`shared/api`

Steiger passes because the FSD plugin only polices the recognized layers, so this drift is invisible
to CI while still contradicting the documented structure. Not urgent, but it's the kind of divergence
`CLAUDE.md` explicitly asks reviewers to flag. Consolidate into `shared/` over time, or document
these as sanctioned exceptions.

### 🟡 MEDIUM-3 — Page components live in the `entities/` layer
**Files:** `entities/company/ui/CompaniesPage.tsx`, `entities/country/ui/CountriesPage.tsx`,
`entities/equipment/ui/EquipmentPage.tsx` — each re-wrapped by a thin `pages/*/ui/*Route.tsx`.

`CLAUDE.md`'s "pages first" guidance puts route-level screens in `pages/`. Here the actual page
component sits in `entities/` and the `pages/` slice is a passthrough. There's a plausible reason
(these are codebook-driven screens tightly bound to the entity), so this may be an accepted trade-off —
but it inverts the documented default and is worth an explicit decision + a note in `CLAUDE.md` if kept.

### 🟢 LOW-1 — Equipment normalization falls back to sentinel values
**File:** `entities/equipment/api/normalizeEquipment.ts:31-33` — `id ?? -1`, `code ?? 0`, `name ?? ''`.

Logging the drift to Sentry is correct and matches the house pattern. But substituting a fake `id:-1`
lets a malformed row flow into the UI where it can be clicked/acted on (e.g. a move/edit targeting
id `-1`). Consider dropping such rows from the list (or rendering them non-actionable) rather than
inventing an identity.

### 🟢 LOW-2 — Stray files tracked at repo root
- `2026-07-12-pet-store-browse-design.md` — a design doc in root; belongs under `docs/`.
- `debug-storybook.log` present in working tree (matched by `*.log` ignore — confirm it isn't tracked).

### 🟢 LOW-3 — `useBulkCreateUsers` bypasses the slice `api/` wrapper
**File:** `src/pages/bulk-user-creation/model/useBulkCreateUsers.ts:16` passes raw generated `User[]`
DTOs straight into the mutation from a `model/` segment. It's *outbound* data (create), so normalization
doesn't apply, but it uses the generated hook directly rather than through a slice `api/` segment —
minor inconsistency with how `entities/pet` wraps its generated hooks.

---

## What's done well (keep doing this)

These are affirmations, not filler — they're the load-bearing parts of the architecture and they're right:

- **DTO normalization at the boundary** — `normalizePet` / `normalizeEquipment` follow the `CLAUDE.md`
  pattern exactly: fall back *and* `Sentry.captureMessage(..., 'warning')` on contract drift. `petQueries.ts`
  even locks `select` out of the caller-facing options so normalization can't be silently overwritten.
- **One axios instance — COMPLIANT.** `src/api/axios-instance.ts` is only the Orval *mutator*; it wraps
  the single `shared/api/client.ts` instance rather than creating a second one. (Easy to misread as a
  violation — it isn't.)
- **Sentry wiring matches the doc line-for-line** — `QueryCache`/`MutationCache` `onError` →
  `captureException` with the query/mutation key attached; `beforeSend` recursively scrubs PII and strips
  `Authorization`/`Cookie`/request body; `tracesSampleRate` is configurable (default `0.1`, not `1.0`).
- **Client vs server state split is clean** — Zustand holds only UI state (RBAC rules, view prefs, modal,
  filters); all server data goes through Tanstack Query. No server data cached in Zustand.
- **Type-safe RBAC** — `abilities.ts` makes `action:subject` pairs compile-time-checked (`move:Company`
  won't compile), and lives in `shared/` without importing entity types (no layering violation).
- **Global error strategy is coherent** — boundary-worthy (5xx/network) errors escalate to the route
  Error Boundary; 4xx business errors stay local; toasts are de-duped against both. Matches the
  Error-handling section of `CLAUDE.md`.

---

## Suggested follow-up order

1. **HIGH-2** (`.env` untrack) — trivial, do immediately.
2. **HIGH-1** (rotate + remove hardcoded token) — coordinate with whoever owns the Keycloak TRACER realm.
3. **MEDIUM-1** (resolve the zod-forms doc/code conflict) — a decision, then a one-line `CLAUDE.md` edit or a refactor.
4. **MEDIUM-2/3, LOW-*** — opportunistic cleanup.

*No code was modified during this review.*
