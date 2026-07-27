import { StrictMode } from 'react';

import './index.css';
import { createRoot } from 'react-dom/client';

import App from '@/app/App.tsx';
import { AppProviders } from '@/app/AppProviders/AppProviders';
import { initSentry } from '@/app/observability/sentry';
import { enableMocking } from '@/lib/enable-mocking';

initSentry();

enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <AppProviders>
        <App />
      </AppProviders>
    </StrictMode>,
  );
});
