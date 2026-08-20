import axios, { type InternalAxiosRequestConfig } from 'axios';
import { AxiosHeaders } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { config } from '@/config';

const getUser = vi.fn();
vi.mock('./userManager', () => ({
  userManager: {
    getUser: () => getUser(),
    signinSilent: vi.fn(),
    signinRedirect: vi.fn(),
  },
}));

import { attachTracerAuth } from './interceptors';

function requestConfig(baseURL: string): InternalAxiosRequestConfig {
  return { baseURL, headers: new AxiosHeaders() } as InternalAxiosRequestConfig;
}

describe('attachTracerAuth', () => {
  beforeEach(() => getUser.mockReset());

  // The request interceptor is the first (index 0) handler registered on the instance.
  function requestInterceptorFor(api: ReturnType<typeof axios.create>) {
    return (
      api.interceptors.request as unknown as {
        handlers: {
          fulfilled: (c: InternalAxiosRequestConfig) => Promise<InternalAxiosRequestConfig>;
        }[];
      }
    ).handlers[0].fulfilled;
  }

  it('attaches the Keycloak bearer to Tracer requests', async () => {
    getUser.mockResolvedValue({ access_token: 'tok123' });
    const api = axios.create();
    attachTracerAuth(api);
    const result = await requestInterceptorFor(api)(requestConfig(config.tracerApiBaseUrl));
    expect(result.headers.get('Authorization')).toBe('Bearer tok123');
  });

  it('does not attach a bearer to non-Tracer (petstore) requests', async () => {
    getUser.mockResolvedValue({ access_token: 'tok123' });
    const api = axios.create();
    attachTracerAuth(api);
    const result = await requestInterceptorFor(api)(requestConfig(config.apiBaseUrl));
    expect(result.headers.get('Authorization')).toBeUndefined();
    expect(getUser).not.toHaveBeenCalled();
  });

  it('attaches no bearer when there is no user', async () => {
    getUser.mockResolvedValue(null);
    const api = axios.create();
    attachTracerAuth(api);
    const result = await requestInterceptorFor(api)(requestConfig(config.tracerApiBaseUrl));
    expect(result.headers.get('Authorization')).toBeUndefined();
  });
});
