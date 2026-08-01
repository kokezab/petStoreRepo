import axios, { type AxiosRequestConfig } from 'axios';
import qs from 'qs';

import { config } from '@/config';

const api = axios.create({
  baseURL: config.apiBaseUrl,
  headers: { 'Content-Type': 'application/json' },
  paramsSerializer: (params) =>
    qs.stringify(params, { allowDots: false, skipNulls: true, arrayFormat: 'repeat' }),
});

// TODO: replace this hardcoded local-dev Keycloak (TRACER realm) bearer token
// with a real token source (auth store / silent refresh). Update the token HERE —
// it's attached to every Tracer request by the interceptor below.
const TRACER_DEV_TOKEN =
  '***REMOVED***';
// Attach the Tracer auth header. Scoped to Tracer requests (by base URL) so the
// petstore demo calls sharing this instance are left untouched.
api.interceptors.request.use((request) => {
  if (request.baseURL === config.tracerApiBaseUrl) {
    request.headers.set('Authorization', `Bearer ${TRACER_DEV_TOKEN}`);
  }
  return request;
});

/**
 * Per-request override that points a call at the Tracer backend instead of the
 * default (petstore demo) base URL. The generated petstore and Tracer SDKs share
 * this one axios instance/mutator, so Tracer hooks must pass this as their
 * `request` option to reach the right host. Pass to any generated Tracer hook/fn.
 */
export const tracerRequest: AxiosRequestConfig = { baseURL: config.tracerApiBaseUrl };

export default api;
