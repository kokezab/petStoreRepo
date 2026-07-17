import { StrictMode } from 'react';

import './index.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FlagProvider } from '@unleash/proxy-client-react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';

import { AppThemeProvider } from '@/app/AppThemeProvider/AppThemeProvider';
import { config } from '@/config';

import App from './App.tsx';

const queryClient = new QueryClient({
  defaultOptions: {
    // One quick retry keeps some resilience to transient network blips for real
    // users, without react-query's default 3-attempt exponential backoff (up to
    // ~7s) leaving the UI on a stale/loading state far longer than a failure
    // warrants.
    queries: { retry: 1, retryDelay: 300 },
  },
});

const unleashConfig = {
  url: config.unleashUrl,
  clientKey: config.unleashClientKey,
  appName: config.unleashAppName,
};

async function enableMocking() {
  if (!import.meta.env.DEV) return;
  if (import.meta.env.VITE_API_MOCKING === 'false') return;

  const { worker } = await import('./mocks/browser');
  // Playwright's acceptance suite blocks service workers (so its own page.route()
  // mocks are the only interceptor) — worker.start() then rejects or hangs. Swallow
  // that so the app still renders; real dev-mode registration resolves normally.
  try {
    await Promise.race([
      worker.start({
        onUnhandledRequest: 'bypass', // requests without a mock handler hit the real API
      }),
      new Promise((resolve) => setTimeout(resolve, 2000)),
    ]);
  } catch (error) {
    console.error(
      'MSW failed to start; requests will hit the real network / Playwright mocks.',
      error,
    );
  }
}

enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <FlagProvider config={unleashConfig}>
        <QueryClientProvider client={queryClient}>
          <AppThemeProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </AppThemeProvider>
        </QueryClientProvider>
      </FlagProvider>
    </StrictMode>,
  );
});
