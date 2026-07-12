
# Pet creation — Unleash flag wiring + acceptance tests — design spec

## Purpose

Wire the Unleash feature-flag client into the React app (the Unleash server/Postgres infra
already exists per `2026-07-12-unleash-docker-setup-design.md`, but nothing in the app talks to
it yet), and write the Gherkin acceptance test suite for the pet-creation feature ahead of its UI
implementation. The `pet-creation` flag is the first real consumer of this wiring.

## Scope

In scope:

- `@unleash/proxy-client-react` integration: config, `<FlagProvider>`, a `useFeatureFlag` wrapper
  hook, and a unit test for that hook.
- `frontend/.env.example` + README documentation for the one manual local-setup step (creating
  the `pet-creation` flag and a `FRONTEND`-type API token in the Unleash UI).
- Acceptance test artifacts for pet creation: `pet-creation.feature`, its step definitions, and
  mock-API helpers for both the Unleash Frontend API and `addPet`.

Explicitly out of scope (deferred to a later pass):

- The actual "Add pet" UI — button, modal, form, `PetListPage` changes. The pet-creation
  acceptance scenarios describe this UI and **will fail (red)** until it's implemented; that's
  intentional, not a bug in this pass.
- A unit test for the (non-existent) UI component.

## Feature flag wiring

- Add dependency `@unleash/proxy-client-react`.
- `src/config.ts` gains:
  ```ts
  unleashUrl: import.meta.env.VITE_UNLEASH_URL || 'http://localhost:4242/api/frontend',
  unleashClientKey: import.meta.env.VITE_UNLEASH_CLIENT_KEY || 'local-dev-unconfigured',
  ```
  The fallback must be a non-empty placeholder, not `''` — `unleash-proxy-client` throws
  synchronously at construction (`if (!clientKey) throw ...`) if it's empty, which crashes the
  whole app with no error boundary. A non-empty placeholder lets the client construct; any request
  it makes still fails/401s against a real server (or is intercepted by test mocks) exactly like an
  unset key would, so flags still evaluate to `false`.
- `src/main.tsx` wraps `<App />` in `<FlagProvider config={{ url: config.unleashUrl, clientKey:
  config.unleashClientKey, appName: 'frontend' }}>` (matching the app name in `package.json`).
  Placed inside `QueryClientProvider`,
  outermost relative to `App`. The client's own *fetch* failures (e.g. Unleash not running
  locally) are handled internally by the library — flags simply evaluate to `false`, no app
  crash. A missing/empty `clientKey` is different: it fails at construction time, synchronously,
  which is why the fallback above must be non-empty.
- `src/lib/feature-flags.ts`: thin wrapper —
  ```ts
  import { useFlag } from '@unleash/proxy-client-react';

  export function useFeatureFlag(name: string): boolean {
    return useFlag(name);
  }
  ```
  This is the seam future UI code will import from — keeps call sites decoupled from the specific
  Unleash SDK.
- `src/lib/feature-flags.test.ts`: unit test mocking `@unleash/proxy-client-react`'s `useFlag` to
  confirm the wrapper delegates the flag name and returns its value.

## Local setup (manual, documented not automated)

Added to root `README.md`:

1. `docker compose up -d` (existing step).
2. In the Unleash UI (`http://localhost:4242`), create a flag named `pet-creation`.
3. Create an API token of type **FRONTEND** (Admin → API access).
4. `cp frontend/.env.example frontend/.env.local` and set `VITE_UNLEASH_CLIENT_KEY` to that token.

`frontend/.env.example` (new file, tracked):
```
VITE_UNLEASH_URL=http://localhost:4242/api/frontend
VITE_UNLEASH_CLIENT_KEY=
```
`.env.local` is already covered by the existing `*.local` entry in `frontend/.gitignore`, so no
gitignore change is needed.

## Acceptance test artifacts

### `tests/acceptance/support/mock-api.ts`

- `mockPetApi` (called from every feature's `Background` step) additionally mocks
  `**/api/frontend**` with `{ toggles: [{ name: 'pet-creation', enabled: false, ... }] }` by
  default, so every existing scenario gets a deterministic, network-free flag state without
  having to know about Unleash.
- New `mockFeatureFlag(page, { petCreation }: { petCreation: boolean })` — overrides the
  `**/api/frontend**` route for scenarios that need the flag on.
- New `mockAddPet(page)` — mocks `POST **/pet` to return a fixed pet
  (`{ id: 6, name: <submitted>, category: <submitted>, status: <submitted>, photoUrls: [], tags:
  [] }`), and `mockAddPetError(page)` for the failure-path scenario.

### `tests/acceptance/features/pet-creation.feature`

Tag `@pet-creation`, same `Background` as the other pet features. Scenarios (continuing the
`AT-N` numbering from `pet-detail.feature`, which ends at AT-10):

- **AT-11** — Add pet button hidden when the flag is disabled
- **AT-12** — Add pet button visible and opens the form when the flag is enabled
- **AT-13** — Submitting a valid form closes it and shows the new pet in the list
- **AT-14** — Empty required fields show inline validation errors and send no request
- **AT-15** — An API failure on submit shows an error and keeps the form open
- **AT-16** — Cancelling closes the form without creating a pet

### `tests/acceptance/steps/pet-creation.steps.ts`

Step definitions for the scenarios above (flag-state Given steps, form-fill/submit/cancel When
steps, visibility/list/error Then steps), following the existing step-file-per-feature convention.
Because the UI doesn't exist yet, these steps will exercise selectors (`Add pet` button/link,
form fields, etc.) that don't currently render — the generated Playwright spec for this feature
is expected to fail until the UI lands.

## File layout

```
frontend/
├── .env.example                                  # new
├── src/
│   ├── config.ts                                  # updated
│   ├── main.tsx                                    # updated
│   └── lib/
│       ├── feature-flags.ts                        # new
│       └── feature-flags.test.ts                   # new
├── tests/acceptance/
│   ├── features/pet-creation.feature                # new
│   ├── steps/pet-creation.steps.ts                   # new
│   └── support/mock-api.ts                           # updated
└── docs/superpowers/specs/2026-07-12-pet-creation-unleash-design.md   # this file
README.md                                            # updated (root, may need creating)
```

## Testing / verification

- `npm run test` — existing unit suite stays green; new `feature-flags.test.ts` passes.
- `npm run test:acceptance` — existing feature files stay green (flag defaults to disabled via
  the `Background` mock); the new `pet-creation.feature` scenarios are expected to fail since the
  UI isn't implemented yet. This is called out explicitly so it isn't mistaken for a regression.
- `npm run check` (tsc + eslint + prettier) passes.
- Manual: `docker compose up -d`, create the flag + FRONTEND token per the README steps, run
  `npm run dev`, confirm no console errors from the Unleash client on app load.
