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
  'eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJ2NUZLZGdyZTNZbVFmcHhnOXg1Ymx0Y21RS3VfY2VaM3JDNnZ2Q0VxM01vIn0.eyJleHAiOjE3OTMzNDUxODUsImlhdCI6MTc4NTU2OTE4NSwianRpIjoib2ZydHJvOmQzNjRhYjk1LTczM2MtODU1Ni1jZGIyLTI2MjY2NDEwMmZlZSIsImlzcyI6Imh0dHA6Ly9sb2NhbGhvc3Q6ODA4MS9yZWFsbXMvVFJBQ0VSIiwiYXVkIjoiYWNjb3VudCIsInN1YiI6IjQ5NGEwNjllLWUxMzQtNGM1Mi1hZGI1LWQ2MTc4NmY4ZGM0NyIsInR5cCI6IkJlYXJlciIsImF6cCI6InRyYWNlci1wb3N0bWFuIiwic2lkIjoiMzdkNGIxZDYtZjVhZS0yMjg4LTk1YTAtYzA1OTY2ZGVmMTIxIiwiYWNyIjoiMSIsImFsbG93ZWQtb3JpZ2lucyI6WyIqIl0sInJlYWxtX2FjY2VzcyI6eyJyb2xlcyI6WyJvZmZsaW5lX2FjY2VzcyIsInVtYV9hdXRob3JpemF0aW9uIiwiZGVmYXVsdC1yb2xlcy10cmFjZXIiXX0sInJlc291cmNlX2FjY2VzcyI6eyJhY2NvdW50Ijp7InJvbGVzIjpbIm1hbmFnZS1hY2NvdW50IiwibWFuYWdlLWFjY291bnQtbGlua3MiLCJ2aWV3LXByb2ZpbGUiXX19LCJzY29wZSI6Im9wZW5pZCBvZmZsaW5lX2FjY2VzcyBlbWFpbCBwcm9maWxlIHBob25lIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsIm5hbWUiOiJ0ZXN0dXNlciBLb3Jpc25payIsInBob25lX251bWJlciI6IiszODU5MTEyMzQ1NjciLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJ0ZXN0dXNlciIsImdpdmVuX25hbWUiOiJ0ZXN0dXNlciIsImxvY2FsZSI6ImhyIiwiZmFtaWx5X25hbWUiOiJLb3Jpc25payIsImVtYWlsIjoidGVzdHVzZXJAaGt6cC5ociJ9.aUpCEjjXBtglt4OgPsxrN-dIzasY9SP0-17eq30qr1HJm3tGWivM_jLIE4byq2lxWZWR1-sAVGGFQvpmbAny1dLWiTV9Ep_T1SdRjkQXfeaEduz1kX8quBYu5vHy2vyF85PR9FXdJnyPFXEW8IzBu_ugNXHH3yYmQQKPz-v8Z7IKDAlwWmEP8uxIYEFe-1WW0hK2sOL81VcnjVWYvOiGWWAXMMFU03DsW9F3VmXMAauVfaeEPrJEZcHUzIbA-aaJbYeYghKeZGR-CIeWZS1htqVJAK1L5nIMxXS7y_qlNLizAgIR3Mk2ifqy6e4PrUzISYzU8oKxsVDJTCX7UJdXtA';
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
