import axios, { type AxiosRequestConfig } from 'axios';
import qs from 'qs';

import { config } from '@/config';

const api = axios.create({
  baseURL: config.apiBaseUrl,
  headers: { 'Content-Type': 'application/json' },
  paramsSerializer: (params) =>
    qs.stringify(params, { allowDots: false, skipNulls: true, arrayFormat: 'repeat' }),
});

// Attach the Tracer auth header. Scoped to Tracer requests (by base URL) so the
// petstore demo calls sharing this instance are left untouched. The token comes
// from the environment (config.tracerDevToken, backed by the gitignored
// `.env.local`) — never hardcoded here. When it's absent we attach no header and
// let the backend reject the call, rather than shipping a secret in source.
// TODO: replace the static dev token with a real token source (auth store /
// silent refresh) — see config.tracerDevToken.
api.interceptors.request.use((request) => {
  if (request.baseURL === config.tracerApiBaseUrl && config.tracerDevToken) {
    request.headers.set('Authorization', `Bearer ${config.tracerDevToken}`);
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
