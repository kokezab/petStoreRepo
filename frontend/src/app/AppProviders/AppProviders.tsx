import { Suspense } from 'react';

import '@/app/i18n/init';
import { QueryClientProvider } from '@tanstack/react-query';
import { FlagProvider } from '@unleash/proxy-client-react';
import { App as AntdApp } from 'antd';
import type { ReactNode } from 'react';
import { AuthProvider } from 'react-oidc-context';
import { BrowserRouter } from 'react-router';

import { AntdMessageBridge } from '@/app/AntdMessageBridge/AntdMessageBridge';
import { AppThemeProvider } from '@/app/AppThemeProvider/AppThemeProvider';
import { useSeedAbilities } from '@/app/useSeedAbilities/useSeedAbilities';
import { config } from '@/config';
import { queryClient } from '@/lib/query-client';
import { onSigninCallback, userManager } from '@/shared/lib/auth';

const unleashConfig = {
  url: config.unleashUrl,
  clientKey: config.unleashClientKey,
  appName: config.unleashAppName,
};

export function AppProviders({ children }: { children: ReactNode }) {
  useSeedAbilities();

  return (
    <AuthProvider userManager={userManager} onSigninCallback={onSigninCallback}>
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
    </AuthProvider>
  );
}
