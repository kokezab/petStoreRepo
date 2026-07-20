import { Suspense } from 'react';

import '@/lib/localization/i18n';
import { QueryClientProvider } from '@tanstack/react-query';
import { FlagProvider } from '@unleash/proxy-client-react';
import { App as AntdApp } from 'antd';
import type { ReactNode } from 'react';
import { BrowserRouter } from 'react-router';

import { AntdMessageBridge } from '@/app/AntdMessageBridge/AntdMessageBridge';
import { AppThemeProvider } from '@/app/AppThemeProvider/AppThemeProvider';
import { config } from '@/config';
import { queryClient } from '@/lib/query-client';

const unleashConfig = {
  url: config.unleashUrl,
  clientKey: config.unleashClientKey,
  appName: config.unleashAppName,
};

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <FlagProvider config={unleashConfig}>
      <QueryClientProvider client={queryClient}>
        <AppThemeProvider>
          <AntdApp>
            <AntdMessageBridge />
            <Suspense fallback={null}>
              <BrowserRouter>{children}</BrowserRouter>
            </Suspense>
          </AntdApp>
        </AppThemeProvider>
      </QueryClientProvider>
    </FlagProvider>
  );
}
