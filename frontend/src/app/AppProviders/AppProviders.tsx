import { Suspense } from 'react';

import '@/lib/localization/i18n';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { FlagProvider } from '@unleash/proxy-client-react';
import { App as AntdApp } from 'antd';
import type { ReactNode } from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { BrowserRouter } from 'react-router';

import { AntdMessageBridge } from '@/app/AntdMessageBridge/AntdMessageBridge';
import { AppThemeProvider } from '@/app/AppThemeProvider/AppThemeProvider';
import { config } from '@/config';
import { queryClient } from '@/lib/query-client';

import { store } from './store';

const unleashConfig = {
  url: config.unleashUrl,
  clientKey: config.unleashClientKey,
  appName: config.unleashAppName,
};

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ReduxProvider store={store}>
      <FlagProvider config={unleashConfig}>
        <QueryClientProvider client={queryClient}>
          <AppThemeProvider>
            <AntdApp>
              <AntdMessageBridge />
              <Suspense fallback={null}>
                <BrowserRouter>{children}</BrowserRouter>
              </Suspense>
              {/* Demo aid: the cache inspector the enablement session is built around.
                  Vite strips it from production builds via the DEV guard. */}
              {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
            </AntdApp>
          </AppThemeProvider>
        </QueryClientProvider>
      </FlagProvider>
    </ReduxProvider>
  );
}
