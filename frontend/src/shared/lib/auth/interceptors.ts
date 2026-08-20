import { type AxiosError, AxiosHeaders, type AxiosInstance } from 'axios';

import { config } from '@/config';

import { userManager } from './userManager';

function isTracer(baseURL?: string): boolean {
  return baseURL === config.tracerApiBaseUrl;
}

/**
 * Attach the Keycloak access token to Tracer requests only. The petstore demo
 * shares the axios instance and must stay unauthenticated, so we scope by base URL.
 */
export function attachTracerAuth(api: AxiosInstance): void {
  api.interceptors.request.use(async (request) => {
    if (isTracer(request.baseURL)) {
      const user = await userManager.getUser();
      if (user?.access_token) {
        request.headers.set('Authorization', `Bearer ${user.access_token}`);
      }
    }
    return request;
  });
}

// Single in-flight silent-renew shared across concurrent 401s.
let refreshPromise: Promise<string | null> | null = null;

/**
 * On a 401 from a Tracer request: silent-renew once and retry; if that fails,
 * redirect to Keycloak (remembering where to return). Non-Tracer errors and
 * non-401s pass straight through — petstore behavior is unaffected.
 */
export function handleTracerAuthErrors(api: AxiosInstance): void {
  api.interceptors.response.use(
    (response) => response,
    async (err: AxiosError) => {
      const original = err.config as (AxiosError['config'] & { _retry?: boolean }) | undefined;

      if (
        err.response?.status === 401 &&
        original &&
        isTracer(original.baseURL) &&
        !original._retry
      ) {
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
}
