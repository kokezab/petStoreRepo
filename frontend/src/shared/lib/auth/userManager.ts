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
