import { StrictMode } from 'react';

import './index.css';
import { createRoot } from 'react-dom/client';

import { AppProviders } from '@/app/AppProviders/AppProviders';
import { enableMocking } from '@/lib/enable-mocking';

import App from './App.tsx';

enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <AppProviders>
        <App />
      </AppProviders>
    </StrictMode>,
  );
});
