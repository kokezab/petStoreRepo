import { StrictMode } from 'react';

import './index.css';
import { createRoot } from 'react-dom/client';

import App from '@/app/App.tsx';
import { AppProviders } from '@/app/AppProviders/AppProviders';
import { initSentry } from '@/app/observability/sentry';
import { enableMocking } from '@/lib/enable-mocking';
import { applySystemThemePreferenceIfUnset } from '@/shared/lib/theme';

initSentry();

// Resolve the initial theme from the OS preference at bootstrap, before the
// first render, so a first-time visitor on a dark-mode OS gets a dark app on
// every route — not only after they happen to open Settings (where the theme
// toggle lives).
applySystemThemePreferenceIfUnset();

enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <AppProviders>
        <App />
      </AppProviders>
    </StrictMode>,
  );
});
