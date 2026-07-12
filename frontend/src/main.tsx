import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.tsx'

const queryClient = new QueryClient({
  defaultOptions: {
    // Read-only browsing UI: surface errors immediately rather than retrying
    // silently for several seconds before the error state appears.
    queries: { retry: false },
  },
});

async function enableMocking() {
  if (!import.meta.env.DEV) return;

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
    console.error('MSW failed to start; requests will hit the real network / Playwright mocks.', error);
  }
}

enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </StrictMode>,
  )
})
