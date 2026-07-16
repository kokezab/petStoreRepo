export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'https://petstore.swagger.io/v2',
  unleashUrl: import.meta.env.VITE_UNLEASH_URL || 'http://localhost:4242/api/frontend',
  unleashClientKey: import.meta.env.VITE_UNLEASH_CLIENT_KEY || 'local-dev-unconfigured',
  unleashAppName: import.meta.env.VITE_UNLEASH_APP_NAME || 'frontend',
};
