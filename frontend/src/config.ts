export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'https://petstore.swagger.io/v2',
  // Tracer is a separate backend service from the petstore demo above. Its
  // generated SDK paths are like `/v1/equipment`, served from this base.
  tracerApiBaseUrl: import.meta.env.VITE_TRACER_API_BASE_URL || 'http://localhost:8080/api',
  // Local-dev bearer token for the Tracer backend. Sourced from the environment
  // (put the real value in the gitignored `.env.local`) so no secret lives in
  // tracked source. Empty by default — the interceptor then attaches no auth
  // header. TODO: replace with a real token source (auth store / silent refresh).
  tracerDevToken: import.meta.env.VITE_TRACER_DEV_TOKEN || '',
  unleashUrl: import.meta.env.VITE_UNLEASH_URL || 'http://localhost:4242/api/frontend',
  unleashClientKey: import.meta.env.VITE_UNLEASH_CLIENT_KEY || 'local-dev-unconfigured',
  unleashAppName: import.meta.env.VITE_UNLEASH_APP_NAME || 'frontend',
  i18nLoadPath: import.meta.env.VITE_I18N_LOAD_PATH || '/locales/{{lng}}/translation.json',
  // Empty in local/dev by default - Sentry.init no-ops without a DSN.
  sentryDsn: import.meta.env.VITE_SENTRY_DSN || '',
  sentryEnvironment: import.meta.env.VITE_SENTRY_ENVIRONMENT || 'development',
  sentryTracesSampleRate: Number(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
};
