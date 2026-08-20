# Keycloak Login Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the static Tracer dev-token with a real Keycloak OIDC redirect login, so the resulting JWT authorizes all Tracer-backed requests (company/country/equipment).

**Architecture:** Port Tracer's `oidc-client-ts` + `react-oidc-context` flow (minus mobile/biometric). A `UserManager` singleton in `shared/lib/auth` drives a PKCE authorization-code redirect. `<AuthProvider>` wires it into React. The single axios instance in `shared/api/client.ts` attaches the Keycloak bearer to Tracer requests only and handles 401 via silent-renew-then-redirect. `/login` becomes a Keycloak sign-in screen; `/auth/callback` completes the redirect.

**Tech Stack:** React 19, react-router 8, TypeScript, Vite 8, Antd, Tanstack Query, Axios, `oidc-client-ts` (v3), `react-oidc-context` (v3), Vitest + React Testing Library.

## Global Constraints

- **Commits are NOT automatic.** Per the user's standing preference, leave all changes uncommitted for review. The final step of each task is *stage + verify*, not commit. Do not run `git commit` unless the user explicitly asks.
- **One axios instance only** — reuse `shared/api/client.ts`. Never create a per-slice or second axios instance (CLAUDE.md rule 5).
- **No server/session data in Zustand** — auth/session state lives in `oidc-client-ts` + `react-oidc-context` only (CLAUDE.md rule 4).
- **FSD import direction** — `pages`/`widgets` import only from lower layers (`shared`, `app`-provided context). `shared/api` may import `shared/lib/auth` (within-`shared` cross-segment is allowed). No same-layer cross-slice imports.
- **`aria-label` must be translated** — any `aria-label` uses `t('...')` (enforced by `local/require-aria-label-i18n`, error level).
- **Token attachment is scoped to Tracer** — only requests whose `baseURL === config.tracerApiBaseUrl` get the bearer and 401 handling. Petstore requests are never touched.
- **Env var names (verbatim):** `VITE_OIDC_AUTHORITY`, `VITE_OIDC_CLIENT_ID`, `VITE_OIDC_REDIRECT_URI`.

---

## File Structure

| File | Responsibility |
|---|---|
| `src/shared/lib/auth/userManager.ts` (new) | Build the `UserManager` singleton from `config.oidc`; export `onSigninCallback`. |
| `src/shared/lib/auth/index.ts` (new) | Public API of the auth segment. |
| `src/config.ts` (modify) | Add `oidc` block; remove `tracerDevToken`. |
| `src/shared/api/client.ts` (modify) | Replace dev-token interceptor with Keycloak bearer attach + 401 handler. |
| `src/shared/api/client.test.ts` (new) | Unit-test the interceptors. |
| `src/app/AppProviders/AppProviders.tsx` (modify) | Wrap tree with `<AuthProvider>`. |
| `src/pages/login/LoginPage.tsx` (modify) | Keycloak sign-in screen. |
| `src/pages/login/LoginPage.test.tsx` (new) | Component test for sign-in / already-authenticated redirect. |
| `src/pages/login/model/useLogin.ts` (delete) | Old petstore login — removed. |
| `src/pages/auth-callback/AuthCallbackPage.tsx` (new) | Completes the OIDC redirect, navigates to return path. |
| `src/pages/auth-callback/index.ts` (new) | Public API. |
| `src/app/AppRoutes/AppRoutes.tsx` (modify) | Add `/auth/callback` route. |
| `src/widgets/nav-bar/**` (modify) | Sign-in link / sign-out + username. |
| `.env.local` / `.env.example` (modify) | Document `VITE_OIDC_*`; drop `VITE_TRACER_DEV_TOKEN`. |

---

## Task 1: Install dependencies

**Files:**
- Modify: `package.json`, lockfile

**Interfaces:**
- Produces: modules `oidc-client-ts` and `react-oidc-context` available to import.

- [ ] **Step 1: Install**

Run:
```bash
npm install oidc-client-ts react-oidc-context
```

- [ ] **Step 2: Verify versions support React 19**

Run:
```bash
npm ls react-oidc-context oidc-client-ts
```
Expected: `react-oidc-context@3.x` and `oidc-client-ts@3.x` (or later) resolved with no peer-dependency errors against `react@19`. If a peer conflict is reported, stop and report it — do not force-install.

- [ ] **Step 3: Stage for review**

Run:
```bash
git add package.json package-lock.json
```
Commit deferred to user per standing preference.

---

## Task 2: OIDC config in `src/config.ts`

**Files:**
- Modify: `src/config.ts`

**Interfaces:**
- Produces: `config.oidc.authority: string`, `config.oidc.clientId: string`, `config.oidc.redirectUri: string`. Removes `config.tracerDevToken`.

- [ ] **Step 1: Add the `oidc` block and remove `tracerDevToken`**

In `src/config.ts`, delete the `tracerDevToken` line and its comment block, and add inside the exported `config` object:

```ts
  oidc: {
    authority: import.meta.env.VITE_OIDC_AUTHORITY,
    clientId: import.meta.env.VITE_OIDC_CLIENT_ID,
    redirectUri:
      import.meta.env.VITE_OIDC_REDIRECT_URI ||
      `${window.location.origin}/auth/callback`,
  },
```

- [ ] **Step 2: Typecheck**

Run:
```bash
npx tsc --noEmit
```
Expected: FAIL — `Property 'tracerDevToken' does not exist` at `src/shared/api/client.ts` (the current dev-token interceptor still references it). This is expected; Task 4 fixes it. If any *other* error appears, fix it.

- [ ] **Step 3: Stage for review**

Run:
```bash
git add src/config.ts
```
Commit deferred to user per standing preference.

---

## Task 3: `UserManager` singleton in `shared/lib/auth`

**Files:**
- Create: `src/shared/lib/auth/userManager.ts`
- Create: `src/shared/lib/auth/index.ts`

**Interfaces:**
- Consumes: `config.oidc` (Task 2).
- Produces:
  - `userManager: UserManager` (from `oidc-client-ts`)
  - `onSigninCallback(): void`

- [ ] **Step 1: Write `userManager.ts`**

```ts
import { UserManager, WebStorageStateStore } from 'oidc-client-ts';

import { config } from '@/config';

/**
 * OIDC client for the Tracer Keycloak realm. PKCE authorization-code flow with
 * automatic silent renew. Session (not local) storage so the token dies with the
 * tab, matching the reference Tracer app. Framework-agnostic infra: the axios
 * client reads `getUser()` off this directly; React binds it via <AuthProvider>.
 */
export const userManager = new UserManager({
  authority: config.oidc.authority,
  client_id: config.oidc.clientId,
  redirect_uri: config.oidc.redirectUri,
  response_type: 'code',
  scope: 'openid profile email',
  post_logout_redirect_uri: window.location.origin,
  automaticSilentRenew: true,
  userStore: new WebStorageStateStore({ store: sessionStorage }),
});

/** Strip the `?code=...&state=...` params from the URL after a successful login. */
export function onSigninCallback(): void {
  window.history.replaceState({}, document.title, window.location.pathname);
}
```

- [ ] **Step 2: Write `index.ts`**

```ts
export { userManager, onSigninCallback } from './userManager';
```

- [ ] **Step 3: Typecheck**

Run:
```bash
npx tsc --noEmit
```
Expected: same single pre-existing error from Task 2 in `client.ts` only. No new errors in `shared/lib/auth`.

- [ ] **Step 4: Stage for review**

Run:
```bash
git add src/shared/lib/auth
```
Commit deferred to user per standing preference.

---

## Task 4: Bearer attach + 401 handler in `shared/api/client.ts`

**Files:**
- Modify: `src/shared/api/client.ts`
- Test: `src/shared/api/client.test.ts` (new)

**Interfaces:**
- Consumes: `userManager` (Task 3), `config.tracerApiBaseUrl`.
- Produces: default export `api` (unchanged signature), `tracerRequest` (unchanged).

- [ ] **Step 1: Write the failing test**

Create `src/shared/api/client.test.ts`:

```ts
import type { InternalAxiosRequestConfig } from 'axios';
import { AxiosHeaders } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { config } from '@/config';

const getUser = vi.fn();
vi.mock('@/shared/lib/auth', () => ({
  userManager: {
    getUser: () => getUser(),
    signinSilent: vi.fn(),
    signinRedirect: vi.fn(),
  },
}));

import api from './client';

function requestConfig(baseURL: string): InternalAxiosRequestConfig {
  return { baseURL, headers: new AxiosHeaders() } as InternalAxiosRequestConfig;
}

// The request interceptor is the first (index 0) handler registered on the instance.
const requestInterceptor = (api.interceptors.request as unknown as {
  handlers: { fulfilled: (c: InternalAxiosRequestConfig) => Promise<InternalAxiosRequestConfig> }[];
}).handlers[0].fulfilled;

describe('request interceptor', () => {
  beforeEach(() => getUser.mockReset());

  it('attaches the Keycloak bearer to Tracer requests', async () => {
    getUser.mockResolvedValue({ access_token: 'tok123' });
    const result = await requestInterceptor(requestConfig(config.tracerApiBaseUrl));
    expect(result.headers.get('Authorization')).toBe('Bearer tok123');
  });

  it('does not attach a bearer to non-Tracer (petstore) requests', async () => {
    getUser.mockResolvedValue({ access_token: 'tok123' });
    const result = await requestInterceptor(requestConfig(config.apiBaseUrl));
    expect(result.headers.get('Authorization')).toBeNull();
    expect(getUser).not.toHaveBeenCalled();
  });

  it('attaches no bearer when there is no user', async () => {
    getUser.mockResolvedValue(null);
    const result = await requestInterceptor(requestConfig(config.tracerApiBaseUrl));
    expect(result.headers.get('Authorization')).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
npx vitest run src/shared/api/client.test.ts
```
Expected: FAIL — the current interceptor references `config.tracerDevToken` (now removed) and does not call `userManager.getUser()`.

- [ ] **Step 3: Rewrite `client.ts`**

Replace the entire file with:

```ts
import axios, { AxiosHeaders, type AxiosError, type AxiosRequestConfig } from 'axios';
import qs from 'qs';

import { config } from '@/config';
import { userManager } from '@/shared/lib/auth';

const api = axios.create({
  baseURL: config.apiBaseUrl,
  headers: { 'Content-Type': 'application/json' },
  paramsSerializer: (params) =>
    qs.stringify(params, { allowDots: false, skipNulls: true, arrayFormat: 'repeat' }),
});

function isTracer(baseURL?: string): boolean {
  return baseURL === config.tracerApiBaseUrl;
}

// Attach the Keycloak access token to Tracer requests only. The petstore demo
// shares this instance and must stay unauthenticated, so we scope by base URL.
api.interceptors.request.use(async (request) => {
  if (isTracer(request.baseURL)) {
    const user = await userManager.getUser();
    if (user?.access_token) {
      request.headers.set('Authorization', `Bearer ${user.access_token}`);
    }
  }
  return request;
});

// Single in-flight silent-renew shared across concurrent 401s.
let refreshPromise: Promise<string | null> | null = null;

// On a 401 from a Tracer request: silent-renew once and retry; if that fails,
// redirect to Keycloak (remembering where to return). Non-Tracer errors and
// non-401s pass straight through — petstore behavior is unaffected.
api.interceptors.response.use(
  (response) => response,
  async (err: AxiosError) => {
    const original = err.config as
      | (AxiosError['config'] & { _retry?: boolean })
      | undefined;

    if (err.response?.status === 401 && original && isTracer(original.baseURL) && !original._retry) {
      original._retry = true;

      if (!refreshPromise) {
        refreshPromise = userManager
          .signinSilent()
          .then((u) => u?.access_token ?? null)
          .catch(() => null)
          .finally(() => {
            refreshPromise = null;
          });
      }

      const newToken = await refreshPromise;
      if (newToken) {
        original.headers = AxiosHeaders.from(original.headers);
        original.headers.set('Authorization', `Bearer ${newToken}`);
        return api.request(original);
      }

      sessionStorage.setItem('auth_return_path', window.location.pathname);
      await userManager.signinRedirect().catch(() => {});
    }

    return Promise.reject(err);
  },
);

/**
 * Per-request override that points a call at the Tracer backend instead of the
 * default (petstore demo) base URL. The generated petstore and Tracer SDKs share
 * this one axios instance/mutator, so Tracer hooks must pass this as their
 * `request` option to reach the right host.
 */
export const tracerRequest: AxiosRequestConfig = { baseURL: config.tracerApiBaseUrl };

export default api;
```

- [ ] **Step 4: Run test to verify it passes**

Run:
```bash
npx vitest run src/shared/api/client.test.ts
```
Expected: PASS (3 tests).

- [ ] **Step 5: Typecheck**

Run:
```bash
npx tsc --noEmit
```
Expected: the `tracerDevToken` error is gone. No new errors.

- [ ] **Step 6: Stage for review**

Run:
```bash
git add src/shared/api/client.ts src/shared/api/client.test.ts
```
Commit deferred to user per standing preference.

---

## Task 5: Wire `<AuthProvider>` in `AppProviders`

**Files:**
- Modify: `src/app/AppProviders/AppProviders.tsx`

**Interfaces:**
- Consumes: `userManager`, `onSigninCallback` (Task 3).
- Produces: `useAuth()` from `react-oidc-context` is usable anywhere in the tree.

- [ ] **Step 1: Add imports**

At the top of `AppProviders.tsx` add:

```ts
import { AuthProvider } from 'react-oidc-context';

import { userManager, onSigninCallback } from '@/shared/lib/auth';
```

- [ ] **Step 2: Wrap the returned tree**

Wrap the existing outermost provider (`<FlagProvider>`) with `<AuthProvider>`:

```tsx
  return (
    <AuthProvider userManager={userManager} onSigninCallback={onSigninCallback}>
      <FlagProvider config={unleashConfig}>
        <QueryClientProvider client={queryClient}>
          <AppThemeProvider>
            <AntdApp>
              <AntdMessageBridge />
              <Suspense fallback={null}>
                <BrowserRouter>{children}</BrowserRouter>
              </Suspense>
            </AntdApp>
          </AppThemeProvider>
        </QueryClientProvider>
      </FlagProvider>
    </AuthProvider>
  );
```

- [ ] **Step 3: Typecheck + existing provider test**

Run:
```bash
npx tsc --noEmit && npx vitest run src/app
```
Expected: PASS. If `App.test.tsx`/`AppRoutes.test.tsx` render the tree and now need an auth context, they will surface here — fix by mocking `react-oidc-context`'s `useAuth`/`AuthProvider` in those tests only if they fail. If they pass, change nothing.

- [ ] **Step 4: Stage for review**

Run:
```bash
git add src/app/AppProviders/AppProviders.tsx
```
Commit deferred to user per standing preference.

---

## Task 6: Auth-callback page + route

**Files:**
- Create: `src/pages/auth-callback/AuthCallbackPage.tsx`
- Create: `src/pages/auth-callback/index.ts`
- Modify: `src/app/AppRoutes/AppRoutes.tsx`

**Interfaces:**
- Consumes: `useAuth()` (Task 5).
- Produces: `AuthCallbackPage` component; route `/auth/callback`.

- [ ] **Step 1: Write `AuthCallbackPage.tsx`**

```tsx
import { useEffect } from 'react';

import { Spin } from 'antd';
import { useAuth } from 'react-oidc-context';
import { useNavigate } from 'react-router';

/**
 * Redirect landing page (the OIDC `redirect_uri`). react-oidc-context processes
 * the `?code=...` exchange automatically; this component just waits for the
 * result and forwards the user to where they started (or `/`).
 */
export function AuthCallbackPage() {
  const auth = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (auth.error) {
      navigate('/login', { replace: true });
      return;
    }
    if (auth.isAuthenticated) {
      const returnPath = sessionStorage.getItem('auth_return_path') || '/';
      sessionStorage.removeItem('auth_return_path');
      navigate(returnPath, { replace: true });
    }
  }, [auth.isAuthenticated, auth.error, navigate]);

  return (
    <div className='flex min-h-[50vh] items-center justify-center'>
      <Spin size='large' />
    </div>
  );
}
```

- [ ] **Step 2: Write `index.ts`**

```ts
export { AuthCallbackPage } from './AuthCallbackPage';
```

- [ ] **Step 3: Add the route**

In `src/app/AppRoutes/AppRoutes.tsx`, add the import (alphabetically near the other page imports):

```ts
import { AuthCallbackPage } from '@/pages/auth-callback';
```

and add the route inside `<Routes>`:

```tsx
      <Route path='/auth/callback' element={withRouteErrorBoundary(<AuthCallbackPage />)} />
```

- [ ] **Step 4: Typecheck**

Run:
```bash
npx tsc --noEmit
```
Expected: PASS.

- [ ] **Step 5: Stage for review**

Run:
```bash
git add src/pages/auth-callback src/app/AppRoutes/AppRoutes.tsx
```
Commit deferred to user per standing preference.

---

## Task 7: Repurpose `/login` as Keycloak sign-in

**Files:**
- Modify: `src/pages/login/LoginPage.tsx`
- Delete: `src/pages/login/model/useLogin.ts`
- Test: `src/pages/login/LoginPage.test.tsx` (new)
- Check: `src/pages/login/index.ts` (should still export `LoginPage` — verify unchanged)

**Interfaces:**
- Consumes: `useAuth()` (Task 5), `useLocalization` (existing).
- Produces: `LoginPage` component (default sign-in screen).

- [ ] **Step 1: Write the failing test**

Create `src/pages/login/LoginPage.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const signinRedirect = vi.fn();
const useAuthMock = vi.fn();
vi.mock('react-oidc-context', () => ({ useAuth: () => useAuthMock() }));

const navigate = vi.fn();
vi.mock('react-router', () => ({ useNavigate: () => navigate }));

vi.mock('@/shared/lib/i18n', () => ({
  useLocalization: () => ({ t: (k: string) => k }),
}));

import { LoginPage } from './LoginPage';

describe('LoginPage', () => {
  it('shows a sign-in button when unauthenticated', () => {
    useAuthMock.mockReturnValue({ isAuthenticated: false, signinRedirect });
    render(<LoginPage />);
    expect(screen.getByRole('button', { name: 'login.signIn' })).toBeInTheDocument();
  });

  it('redirects home when already authenticated', () => {
    useAuthMock.mockReturnValue({ isAuthenticated: true, signinRedirect });
    render(<LoginPage />);
    expect(navigate).toHaveBeenCalledWith('/', { replace: true });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
npx vitest run src/pages/login/LoginPage.test.tsx
```
Expected: FAIL — current `LoginPage` renders the petstore form (no `login.signIn` button) and imports the soon-deleted `useLogin`.

- [ ] **Step 3: Delete the petstore login hook**

Run:
```bash
git rm src/pages/login/model/useLogin.ts
```
(If `src/pages/login/model/` is now empty, that's fine — leave the folder or let git drop it.)

- [ ] **Step 4: Rewrite `LoginPage.tsx`**

Replace the entire file with:

```tsx
import { Button, Space, Typography } from 'antd';
import { useAuth } from 'react-oidc-context';
import { useNavigate } from 'react-router';

import { useLocalization } from '@/shared/lib/i18n';

/**
 * Keycloak sign-in screen. There is no local credential form — auth is a redirect
 * to the IdP. If a session already exists, bounce straight home.
 */
export function LoginPage() {
  const { t } = useLocalization();
  const auth = useAuth();
  const navigate = useNavigate();

  if (auth.isAuthenticated) {
    navigate('/', { replace: true });
    return null;
  }

  const signIn = () => {
    sessionStorage.setItem('auth_return_path', window.location.pathname);
    void auth.signinRedirect();
  };

  return (
    <Space orientation='vertical' align='center' size='large' style={{ width: '100%' }}>
      <Typography.Title level={2}>{t('login.title')}</Typography.Title>
      <Button
        type='primary'
        size='large'
        onClick={signIn}
        aria-label={t('login.signIn')}
      >
        {t('login.signIn')}
      </Button>
    </Space>
  );
}
```

- [ ] **Step 5: Add the translation keys**

Add `login.title` and `login.signIn` to each locale's `translation.json` (locate them via the existing `login.formLabel` key). English values: `"title": "Sign in"`, `"signIn": "Sign in with Keycloak"`. Mirror the existing nesting under the `login` object. For non-English locales, add the same keys (translated if the repo already localizes; otherwise copy the English string as a placeholder consistent with how other new keys are handled).

Run to find the files:
```bash
grep -rl "formLabel" public/locales src 2>/dev/null
```

- [ ] **Step 6: Verify `index.ts` still exports `LoginPage`**

Confirm `src/pages/login/index.ts` exports `LoginPage` (a named or default export matching how `AppRoutes` imports it: `import { LoginPage } from '@/pages/login'`). If the old barrel re-exported anything from `model/useLogin`, remove that line.

- [ ] **Step 7: Run test + typecheck**

Run:
```bash
npx vitest run src/pages/login/LoginPage.test.tsx && npx tsc --noEmit
```
Expected: PASS (2 tests); no type errors.

- [ ] **Step 8: Stage for review**

Run:
```bash
git add -A src/pages/login public/locales
```
Commit deferred to user per standing preference.

---

## Task 8: NavBar sign-in / sign-out control

**Files:**
- Modify: `src/widgets/nav-bar/**` (the component that renders nav items — locate the main `.tsx`)

**Interfaces:**
- Consumes: `useAuth()` (Task 5), existing i18n.
- Produces: nav control — username + "Sign out" when authenticated; a "Sign in" link to `/login` when not.

- [ ] **Step 1: Locate the NavBar component**

Run:
```bash
grep -rl "nav-bar" src/widgets/nav-bar
```
Open the main component file (the one exported by `src/widgets/nav-bar/index.ts`).

- [ ] **Step 2: Add the auth control**

Add near the top:
```ts
import { useAuth } from 'react-oidc-context';
```
Inside the component, read auth and render a control consistent with the existing NavBar markup (Antd `Menu`/`Button`/`Space` — match what's already there). Logic:

```tsx
const auth = useAuth();
// ...in the rendered nav, on the trailing/right side:
{auth.isAuthenticated ? (
  <Space>
    <span>{auth.user?.profile?.preferred_username ?? auth.user?.profile?.email}</span>
    <Button type='text' onClick={() => void auth.signoutRedirect()} aria-label={t('auth.signOut')}>
      {t('auth.signOut')}
    </Button>
  </Space>
) : (
  <Button type='text' onClick={() => void auth.signinRedirect()} aria-label={t('auth.signIn')}>
    {t('auth.signIn')}
  </Button>
)}
```
Use the NavBar's existing translation hook (match how other NavBar labels are translated). Add `auth.signOut` / `auth.signIn` keys to the locale files (English: `"signOut": "Sign out"`, `"signIn": "Sign in"`).

- [ ] **Step 3: Typecheck + existing NavBar tests**

Run:
```bash
npx tsc --noEmit && npx vitest run src/widgets/nav-bar
```
Expected: PASS. If a NavBar test renders without an auth provider and fails, mock `react-oidc-context`'s `useAuth` in that test to return `{ isAuthenticated: false, signinRedirect: vi.fn(), signoutRedirect: vi.fn() }`.

- [ ] **Step 4: Stage for review**

Run:
```bash
git add -A src/widgets/nav-bar public/locales
```
Commit deferred to user per standing preference.

---

## Task 9: Environment documentation

**Files:**
- Modify: `.env.example` (create if absent), `.env.local` (create if absent, gitignored)

**Interfaces:** none (docs/config only).

- [ ] **Step 1: Add OIDC vars to `.env.example` and remove the dev token**

Ensure `.env.example` contains (and no longer references `VITE_TRACER_DEV_TOKEN`):
```
# Keycloak OIDC (reuses the Tracer realm; register THIS app's redirect URI in the client)
VITE_OIDC_AUTHORITY=https://<keycloak-host>/realms/<realm>
VITE_OIDC_CLIENT_ID=<client-id>
VITE_OIDC_REDIRECT_URI=http://localhost:5173/auth/callback
```
Confirm the Vite dev server port (check `vite.config.*` / `npm run dev` output) matches the redirect URI; adjust the port in the example if the dev server uses a different one.

- [ ] **Step 2: Confirm no lingering `tracerDevToken` references**

Run:
```bash
grep -rn "tracerDevToken\|VITE_TRACER_DEV_TOKEN" src .env.example
```
Expected: no matches. If any remain, remove them.

- [ ] **Step 3: Stage for review**

Run:
```bash
git add .env.example
```
Commit deferred to user per standing preference. (`.env.local` is gitignored — the user fills in real values there; do not stage it.)

---

## Task 10: Full verification pass

**Files:** none (verification only).

- [ ] **Step 1: Full typecheck**

Run:
```bash
npx tsc --noEmit
```
Expected: PASS, zero errors.

- [ ] **Step 2: Lint (includes Steiger FSD + jsx-a11y + aria-label i18n rule)**

Run:
```bash
npm run lint
```
Expected: PASS. In particular, no FSD import-direction violations from the new `shared/lib/auth` and `pages/auth-callback`, and no untranslated `aria-label` errors.

- [ ] **Step 3: Full unit test suite**

Run:
```bash
npx vitest run
```
Expected: PASS. New tests: `client.test.ts` (3), `LoginPage.test.tsx` (2).

- [ ] **Step 4: Manual smoke (requires real `.env.local`)**

With `VITE_OIDC_*` set and this app's redirect URI registered in Keycloak:
```bash
npm run dev
```
Then: visit a Tracer page (e.g. `/companies`) unauthenticated → a 401 redirects to Keycloak (or click "Sign in") → after Keycloak login, land on `/auth/callback` → forwarded to the original page → `/companies` data loads with the bearer attached (verify the `Authorization` header in DevTools Network on the `/v1/companies` request). If `.env.local` is not yet available, note this step as blocked pending Keycloak values.

- [ ] **Step 5: Report status**

Summarize: which tasks are done, test/lint/typecheck results (with output), and whether Step 4 was exercised or blocked on Keycloak credentials. Leave everything staged/uncommitted for the user to review.

---

## Self-Review notes

- **Spec coverage:** deps (T1), config (T2), userManager (T3), interceptors incl. 401 (T4), AuthProvider (T5), callback+route (T6), login replacement + petstore removal (T7), NavBar control (T8), env/dev-token removal (T9), verification incl. FSD lint + smoke (T10). All spec sections mapped.
- **Type consistency:** `userManager`/`onSigninCallback` names consistent across T3→T4/T5/T6; `tracerRequest` unchanged; `auth_return_path` sessionStorage key consistent across T4 (write on redirect), T6 (read), T7 (write on manual sign-in).
- **Placeholders:** none — full code given for every code step. Locale-file edits (T7/T8) and NavBar file (T8) reference existing patterns to match rather than invented content, since exact filenames/markup are repo-specific; discovery commands provided.
