import axios, { type AxiosRequestConfig } from 'axios';
import qs from 'qs';

import { config } from '@/config';
import { attachTracerAuth, handleTracerAuthErrors } from '@/shared/lib/auth';

const api = axios.create({
  baseURL: config.apiBaseUrl,
  headers: { 'Content-Type': 'application/json' },
  paramsSerializer: (params) =>
    qs.stringify(params, { allowDots: false, skipNulls: true, arrayFormat: 'repeat' }),
});

// Keycloak auth is scoped to Tracer requests only; the interceptors live in
// shared/lib/auth alongside the userManager they depend on.
attachTracerAuth(api);
handleTracerAuthErrors(api);

/**
 * Per-request override that points a call at the Tracer backend instead of the
 * default (petstore demo) base URL. The generated petstore and Tracer SDKs share
 * this one axios instance/mutator, so Tracer hooks must pass this as their
 * `request` option to reach the right host.
 */
export const tracerRequest: AxiosRequestConfig = { baseURL: config.tracerApiBaseUrl };

export default api;
