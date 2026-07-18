import type { ReactNode } from 'react';

import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { Button, Result } from 'antd';

import { ErrorBoundary } from '@/app/ErrorBoundary/ErrorBoundary';

// Wraps one route/section so an unrecoverable query error (network down, 5xx)
// only takes out that piece of the page, not the whole app. Errors a
// component can render around itself (404s, validation) should stay local
// via useApiError instead of reaching this boundary — see queryClient's
// throwOnError in main.tsx for the split.
export function RouteErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          onReset={reset}
          fallback={(error, retry) => (
            <Result
              status='error'
              title='Something went wrong'
              subTitle={error.message}
              extra={
                <Button type='primary' onClick={retry}>
                  Try again
                </Button>
              }
            />
          )}
        >
          {children}
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}
