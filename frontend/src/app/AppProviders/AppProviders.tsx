import { Suspense, useEffect } from 'react';

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
import { useAbilityStore } from '@/shared/lib/rbac';

const unleashConfig = {
  url: config.unleashUrl,
  clientKey: config.unleashClientKey,
  appName: config.unleashAppName,
};

// Stand-in for fetching the current user's abilities from your auth/`/me` endpoint.
function useSeedAbilities() {
  const setRules = useAbilityStore((s) => s.setRules);

  useEffect(() => {
    setRules({
      'create:Country': true,
      'update:Country': true,
      // example: RBAC itself can depend on the record too. The store passes records
      // in untyped (record?: unknown), so narrow to the shape this rule cares about.
      'delete:Country': (record) => (record as { status?: string } | undefined)?.status !== 'done',

      'create:Equipment': true,
      'update:Equipment': true,
      'delete:Equipment': (record) =>
        (record as { status?: string } | undefined)?.status !== 'done',
    });
  }, [setRules]);
}

export function AppProviders({ children }: { children: ReactNode }) {
  useSeedAbilities();

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
