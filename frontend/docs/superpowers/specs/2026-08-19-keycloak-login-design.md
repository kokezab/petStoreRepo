# Keycloak (OIDC) login flow → JWT for Tracer requests

**Date:** 2026-08-19
**Status:** Approved (design)

## Goal

Replace the static `tracerDevToken` stopgap with the same Keycloak OIDC redirect
flow the Tracer frontend uses. The access token obtained from Keycloak authorizes
every Tracer-backed request (company, country, equipment). Petstore demo pages
stay open and untouched; there is no whole-app route gating.

The reference implementation lives in the Tracer frontend
(`D:\Projects\tracer\tracer-frontend-repo\frontend`):
`src/lib/auth.ts` (userManager), `src/main.tsx` (`<AuthProvider>`),
`src/lib/axios.ts` (token interceptor + 401 handling). We port the core of that,
minus the mobile-PWA/biometric/offline-token machinery, which is Tracer-specific.

## Decisions (locked in during brainstorming)

1. **Petstore login is replaced entirely.** `/login` becomes the Keycloak
   redirect sign-in. The existing petstore username/password login
   (`pages/login/model/useLogin.ts`) is removed.
2. **Reuse Tracer's Keycloak realm/client via env vars.** The user registers this
   app's redirect URI in that Keycloak client. No new client is created by this work.
3. **No route gating.** The Keycloak token is attached only to Tracer requests;
   petstore pages stay open. A 401 from a Tracer request drives the redirect.

## Dependencies

Add:
- `oidc-client-ts`
- `react-oidc-context`

No new axios instance — the single instance in `shared/api/client.ts` is reused
(CLAUDE.md hard rule 5).

## FSD placement

| Concern | Location | Change |
|---|---|---|
| OIDC `UserManager` singleton + `onSigninCallback` | `shared/lib/auth/` (`userManager.ts`, `index.ts`) | **new** — infra beside `shared/lib/rbac`, `shared/lib/i18n` |
| Token attachment + 401 handling | `shared/api/client.ts` | edit — replace dev-token interceptor |
| OIDC config | `src/config.ts` | edit — add `oidc: { authority, clientId, redirectUri }`; remove `tracerDevToken` |
| `<AuthProvider>` wiring | `app/AppProviders/AppProviders.tsx` | edit — wrap tree with `react-oidc-context` |
| Sign-in screen | `pages/login/` | repurpose — delete petstore `model/useLogin.ts`; `LoginPage` → Keycloak sign-in |
| Callback handler | `pages/auth-callback/` + `/auth/callback` route | **new** page + route in `AppRoutes` |
| Sign-in/out control | `widgets/nav-bar` | small edit — sign-out when authed, link to `/login` when not |

### Why `shared/lib/auth` (not `shared/api` or `app`)

The `UserManager` is framework-agnostic infra (no React). It belongs in `shared`,
alongside the existing `shared/lib/rbac` and `shared/lib/i18n` segments. The axios
client (`shared/api`) imports it — a within-`shared` cross-segment import, which
FSD permits (the no-cross-slice rule applies to slices in
pages/widgets/features/entities, not to `shared`). The React binding
(`<AuthProvider>`, `useAuth`) is app/page-layer concern and lives there.

## Component design

### `shared/lib/auth/userManager.ts`

Mirrors Tracer's `lib/auth.ts`, minus mobile client id / `ui_locales`:

```ts
import { UserManager, WebStorageStateStore } from 'oidc-client-ts';
import { config } from '@/config';

export const userManager = new UserManager({
  authority: config.oidc.authority,
  client_id: config.oidc.clientId,
  redirect_uri: config.oidc.redirectUri,
  response_type: 'code',            // PKCE authorization-code flow
  scope: 'openid profile email',
  post_logout_redirect_uri: window.location.origin,
  automaticSilentRenew: true,
  userStore: new WebStorageStateStore({ store: sessionStorage }),
});

export function onSigninCallback(): void {
  window.history.replaceState({}, document.title, window.location.pathname);
}
```

`index.ts` re-exports `userManager` and `onSigninCallback`.

### `src/config.ts`

Add an `oidc` block; remove `tracerDevToken`:

```ts
oidc: {
  authority: import.meta.env.VITE_OIDC_AUTHORITY,
  clientId: import.meta.env.VITE_OIDC_CLIENT_ID,
  redirectUri:
    import.meta.env.VITE_OIDC_REDIRECT_URI ||
    `${window.location.origin}/auth/callback`,
},
```

### `shared/api/client.ts`

Replace the dev-token request interceptor and add a response interceptor.

**Request interceptor** — for Tracer requests only, attach the Keycloak bearer:

```ts
api.interceptors.request.use(async (request) => {
  if (request.baseURL === config.tracerApiBaseUrl) {
    const user = await userManager.getUser();
    if (user?.access_token) {
      request.headers.set('Authorization', `Bearer ${user.access_token}`);
    }
  }
  return request;
});
```

**Response interceptor** — on a 401 from a *Tracer* request, silent-renew once and
retry, else redirect to Keycloak (storing the return path). Non-Tracer errors and
non-401s pass through untouched so petstore behavior is unaffected:

```ts
let refreshPromise: Promise<string | null> | null = null;

api.interceptors.response.use(
  (response) => response,
  async (err: AxiosError) => {
    const original = err.config as (AxiosError['config'] & { _retry?: boolean }) | undefined;
    const isTracer = original?.baseURL === config.tracerApiBaseUrl;

    if (err.response?.status === 401 && isTracer && original && !original._retry) {
      original._retry = true;
      if (!refreshPromise) {
        refreshPromise = userManager
          .signinSilent()
          .then((u) => u?.access_token ?? null)
          .catch(() => null)
          .finally(() => { refreshPromise = null; });
      }
      const newToken = await refreshPromise;
      if (newToken) {
        original.headers.set('Authorization', `Bearer ${newToken}`);
        return api.request(original);
      }
      sessionStorage.setItem('auth_return_path', window.location.pathname);
      await userManager.signinRedirect().catch(() => {});
    }
    return Promise.reject(err);
  },
);
```

Note: this is a smaller 401 handler than Tracer's (no Locked/Forbidden/BadRequest
notification branches) because this app routes those through its existing
query-client / feedback mechanisms. We add only the auth-refresh/redirect branch.

### `app/AppProviders/AppProviders.tsx`

Wrap the existing provider tree with `<AuthProvider>` as an outer provider:

```tsx
import { AuthProvider } from 'react-oidc-context';
import { userManager, onSigninCallback } from '@/shared/lib/auth';

// ...
<AuthProvider userManager={userManager} onSigninCallback={onSigninCallback}>
  <FlagProvider config={unleashConfig}>
    {/* existing tree */}
  </FlagProvider>
</AuthProvider>
```

The interceptor reads `userManager` directly (not via context), so provider
ordering relative to `QueryClientProvider` does not matter for token attachment.

### `pages/login/LoginPage.tsx` (repurposed)

- Delete `pages/login/model/useLogin.ts` (petstore auth) and the `LoginFormValues`
  form.
- New `LoginPage`: uses `useAuth()` from `react-oidc-context`. If
  `auth.isAuthenticated`, `navigate('/', { replace: true })`. Otherwise render a
  "Sign in with Keycloak" primary button that calls
  `auth.signinRedirect()` (storing `window.location.pathname` return path first).
- `aria-label` on the button must be translated (`t(...)`) per the repo's
  `local/require-aria-label-i18n` rule.

### `pages/auth-callback/` (new)

- `AuthCallbackPage`: renders an antd `<Spin>`. On mount watches `useAuth()`; when
  `auth.isAuthenticated`, reads `auth_return_path` from sessionStorage (default
  `/`), clears it, and `navigate(returnPath, { replace: true })`. On `auth.error`,
  navigate to `/login`.
- `index.ts` public API.
- Route `/auth/callback` added to `AppRoutes`, wrapped in `RouteErrorBoundary`
  like the others. This is the `redirect_uri` target.

### `widgets/nav-bar` (small edit)

- When `auth.isAuthenticated`: show the username (`auth.user?.profile?.preferred_username`)
  and a "Sign out" action → `auth.signoutRedirect()`.
- When not: a link/button to `/login`.
- Keep it minimal; follow existing NavBar structure and i18n conventions.

## Config / environment

Reuses Tracer's realm. The user registers this app's redirect URI in that Keycloak
client. Document in `.env.local` (gitignored) and remove `VITE_TRACER_DEV_TOKEN`:

```
VITE_OIDC_AUTHORITY=https://<keycloak-host>/realms/<realm>
VITE_OIDC_CLIENT_ID=<client-id>
VITE_OIDC_REDIRECT_URI=http://localhost:5173/auth/callback
```

The dev server port must match the redirect URI registered in Keycloak.

## Conventions honored (CLAUDE.md)

- **One axios instance** preserved (rule 5). ✅
- **Auth/session state lives in oidc-client-ts + react-oidc-context, not Zustand**
  (rule 4 — never cache server/session data in Zustand). ✅
- DTO normalization untouched — company/country/equipment `api/` segments keep
  normalizing; they simply start receiving a real bearer token.
- No same-layer cross-slice imports; the new `pages/auth-callback` and `pages/login`
  import only from `shared`/`app` (down-layer). ✅

## Testing

- **Interceptor unit test** (`shared/api/client.test.ts` or colocated): mock
  `userManager.getUser()`; assert `Authorization` is attached for a request with
  the Tracer baseURL and *absent* for a petstore request.
- **LoginPage component test**: renders the sign-in button when unauthenticated;
  redirects home when `auth.isAuthenticated` (mock `useAuth`).
- **AuthCallbackPage component test** (optional, if cheap): navigates to the return
  path once authenticated.
- No Playwright spec for the Keycloak redirect — the external IdP redirect is not
  MSW-mockable and CI must not hit a real IdP.

## Out of scope (YAGNI)

- Mobile PWA / biometric / offline-token login (Tracer-specific).
- Whole-app or per-page route gating.
- Wiring Keycloak `realm_access.roles` into the RBAC `useSeedAbilities` store — a
  natural future extension (the token already carries the roles), but not built now.

## Risks / open items

- **Functional end-to-end requires real Keycloak values.** All code is env-driven;
  the flow cannot be exercised until `VITE_OIDC_*` are set in `.env.local` and this
  app's redirect URI is registered in the Keycloak client.
- **React 19 / react-router 8 compatibility:** `react-oidc-context` v3 +
  `oidc-client-ts` v3 support React 19; confirm at install time.
