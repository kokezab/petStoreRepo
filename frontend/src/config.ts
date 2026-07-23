export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'https://petstore.swagger.io/v2',
  unleashUrl: import.meta.env.VITE_UNLEASH_URL || 'http://localhost:4242/api/frontend',
  unleashClientKey: import.meta.env.VITE_UNLEASH_CLIENT_KEY || 'local-dev-unconfigured',
  unleashAppName: import.meta.env.VITE_UNLEASH_APP_NAME || 'frontend',
  i18nLoadPath: import.meta.env.VITE_I18N_LOAD_PATH || '/locales/{{lng}}/translation.json',
  // Empty in local/dev by default - Sentry.init no-ops without a DSN.
  sentryDsn: import.meta.env.VITE_SENTRY_DSN || '',
  sentryEnvironment: import.meta.env.VITE_SENTRY_ENVIRONMENT || 'development',
  sentryTracesSampleRate: Number(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
};
