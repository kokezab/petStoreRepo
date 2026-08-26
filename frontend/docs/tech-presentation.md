# Frontend Tech & Concepts — Presentation

## 🎯 The spine: contract-driven development

> One OpenAPI spec is the shared contract between backend and frontend.
> Everything below hangs off it.

### 1. Orval — generated client from the spec

- **What:** generates the TS API client + types straight from the OpenAPI spec. Zero hand-written fetch code.
- **Why it matters:** when the backend changes the spec, the frontend gets new types instantly — breaking changes show up as *compile errors*, not runtime surprises in prod.

### 2. MSW — mock the server from the same contract

- **What:** Mock Service Worker intercepts real network calls and answers them with mocked responses shaped to the contract.
- **Why it matters:** frontend can be built and tested **before/without a live backend**, and the *same* mocks run in the test suite. No "works against my local backend only."

### 3. Zod — validate at the boundary ("don't trust the wire")

- **What:** generated types are compile-time only; incoming responses are validated + normalized at runtime.
- **Why it matters:** if the server violates its own spec (missing "required" field), we catch it at the boundary and report drift — instead of a crash deep in the UI.

## 🧪 Testing: ATDD / BDD

### 4. Gherkin + playwright-bdd

- **What:** acceptance tests written as business behavior — `Given/When/Then` `.feature` files, executed end-to-end via Playwright.
- **Why it matters:** tests read as specifications; non-devs can read them; behavior is verified against real user flows, not implementation details.

## ⚙️ Server-state & platform

### 5. TanStack Query — client-side data/caching layer

- **What:** manages server state: request dedup, caching, background refetch, cache invalidation, query-key factories.
- **Why it matters:** removes hand-rolled loading/error/stale-data logic; one source of truth for "what the server said."

### 6. Unleash — feature flags

- **What:** runtime flags gating features per environment/user.
- **Why it matters:** **decouples deploy from release** — ship dark, roll out gradually, kill-switch without redeploy. Enables trunk-based dev.

### 7. Ability / permission seeding

- **What:** an authorization model on the frontend — abilities seeded and checked before rendering privileged UI.
- **Why it matters:** UI reflects the same permission model as the backend; no leaking actions the user can't perform.

### 8. *(optional — cut if short on time)* OIDC / Keycloak auth

- **What:** standards-based auth via Keycloak (auth-callback / token flow).
- **Why it matters:** no bespoke auth; same IdP the backend trusts.

## 🚦 Guardrails

### 9. Husky — commit/push gates

- **What:** pre-commit / pre-push hooks running lint, typecheck, commitlint.
- **Why it matters:** the contract, types, and format are enforced *before* code lands — CI just confirms, never discovers.

## 🤖 GitHub-native AI workflow

> Claude runs *inside* CI via `anthropics/claude-code-action` — the repo is the interface, no local setup for the contributor.

### 10. Auto-implement on issue assignment

- **What:** assign a GitHub issue to me and a GitHub Action fires that runs Claude in the cloud. It reads the issue, implements the change on a new branch, commits, pushes, and opens a PR that `Closes #<issue>`.
- **ATDD-aware:** if the issue is labelled `ATDD`, the workflow injects test-first instructions — write the Gherkin `.feature`, generate missing step defs, confirm the scenario fails for the right reason, *then* implement until green.
- **Why it matters:** the issue tracker becomes the task queue; work starts with zero manual kickoff, and the AI is held to the same ATDD discipline as the team.

### 11. @claude in PR / issue comments

- **What:** mention `@claude` in an issue comment, PR review, or review comment and the same action responds — answering, adjusting code, or pushing follow-up commits on the PR.
- **Why it matters:** review feedback can be actioned in-thread without leaving GitHub.

### 12. Deploy → E2E → promote pipeline

- **What:** on push to `main`: build + deploy a Vercel preview, point the staging alias at it, run the Playwright E2E suite **against the real deployed URL**, and only **promote to production** if E2E passes.
- **Why it matters:** production is gated on real end-to-end tests against a real deployment — not just unit tests against mocks.

### 13. Git worktrees — parallel isolated workspaces

- **What:** each task/agent gets its own `git worktree` — a separate working directory on its own branch, sharing the same repo. Multiple pieces of work (or multiple Claude runs) proceed side by side without stashing or branch-switching.
- **Why it matters:** no "stash my half-done work to fix something else"; agents don't stomp on each other's files; each PR is built in a clean, isolated checkout. Pairs naturally with the issue-per-branch AI workflow above.
