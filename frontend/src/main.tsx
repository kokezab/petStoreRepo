import { StrictMode } from 'react';

import './index.css';
import { createRoot } from 'react-dom/client';

import { AppProviders } from '@/app/AppProviders/AppProviders';
import { initSentry } from '@/app/observability/sentry';
import { enableMocking } from '@/lib/enable-mocking';

import App from './App.tsx';

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
