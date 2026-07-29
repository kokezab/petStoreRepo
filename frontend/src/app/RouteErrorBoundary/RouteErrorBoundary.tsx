import * as Sentry from '@sentry/react';
import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { Button, Result } from 'antd';
import type { ReactNode } from 'react';

// Wraps one route/section so an unrecoverable query error (network down, 5xx)
// only takes out that piece of the page, not the whole app. Errors a
// component can render around itself (404s, validation) should stay local
// via useApiError instead of reaching this boundary — see queryClient's
// throwOnError in lib/query-client.ts for the split.
export function RouteErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <Sentry.ErrorBoundary
          onReset={reset}
          fallback={({ error, resetError }) => (
            <Result
              status='error'
              title='Something went wrong'
              subTitle={error instanceof Error ? error.message : String(error)}
              extra={
                <Button type='primary' onClick={resetError}>
                  Try again
                </Button>
              }
            />
          )}
        >
          {children}
        </Sentry.ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}
