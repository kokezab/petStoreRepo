import * as Sentry from '@sentry/react';

import { config } from '@/config';

const PII_KEY_PATTERN = /password|token|email|phone|ssn|credit|secret/i;

function scrubPii<T>(value: T, seen = new WeakSet<object>()): T {
  if (!value || typeof value !== 'object') return value;
  if (seen.has(value as object)) return value;
  seen.add(value as object);

  if (Array.isArray(value)) {
    return value.map((item) => scrubPii(item, seen)) as T;
  }

  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    result[key] = PII_KEY_PATTERN.test(key) ? '[Filtered]' : scrubPii(val, seen);
  }
  return result as T;
}

export function initSentry() {
  if (!config.sentryDsn) return;

  Sentry.init({
    dsn: config.sentryDsn,
    release: __APP_VERSION__,
    environment: config.sentryEnvironment,
    // Sample down in production - cost scales with volume, and we don't
    // need every trace to catch real issues.
    tracesSampleRate: config.sentryTracesSampleRate,
    beforeSend(event) {
      // Request bodies are form payloads (login, signup, add-pet, ...) -
      // never send them wholesale, whatever fields they happen to contain.
      if (event.request) {
        delete event.request.cookies;
        delete event.request.data;
        if (event.request.headers) {
          delete event.request.headers['Authorization'];
          delete event.request.headers['Cookie'];
        }
      }
      if (event.user) {
        delete event.user.email;
        delete event.user.ip_address;
      }
      event.extra = scrubPii(event.extra);
      event.contexts = scrubPii(event.contexts);
      return event;
    },
  });
}
